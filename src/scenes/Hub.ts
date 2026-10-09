import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { LOGICAL_W, LOGICAL_H } from '../config';
import { characterName } from '../data/characters';
import { HUB_LOCATIONS, hubLocation, pickTalk } from '../data/hub';
import type { HubLocation, HubNpc, HubSpot } from '../data/hub';
import { SpriteActor } from '../entities/Actor';
import { Backdrop } from '../systems/Backdrop';
import { runCutscene } from '../systems/Cutscene';
import { SceneCutsceneHost } from '../systems/CutsceneHost';
import { game } from '../systems/GameState';
import { input } from '../systems/InputManager';
import { runner } from '../systems/ChapterRunner';
import { startQuest } from '../systems/QuestRunner';
import type { HubQuestResult } from '../systems/QuestRunner';
import { questState } from '../systems/Quests';
import { questById } from '../data/sidequests';
import { Menu } from '../ui/Menu';
import type { MenuItem } from '../ui/Menu';
import { addDim, addPanel, COLORS } from '../ui/Panel';
import { PixelText } from '../ui/PixelText';
import { flushToasts, showToast } from '../ui/Toast';
import { clamp } from '../util/math';
import { formatMoney } from '../util/text';

export interface HubInit {
  location?: string;
  /** Hasil Cerita Sekolah yang baru dimainkan; skrip sukses/gagalnya diputar di sini. */
  quest?: HubQuestResult;
}

interface NpcEntry {
  def: HubNpc;
  actor: SpriteActor;
  idle: string;
  nextIdle: number;
}

const WALK_X = 82; // px per detik
const WALK_Y = 58;
const MIN_Y = 162;
const MAX_Y = 264;
const EXIT_X = 456;
const TALK_DX = 36;
const TALK_DY = 16;
const IDLE_ALTS = ['idle_berdiri', 'idle_napas', 'idle_lihat_sekitar'];

type Near = { kind: 'npc'; entry: NpcEntry } | { kind: 'spot'; spot: HubSpot } | null;

/** Waktu Bebas: berjalan bebas di sekolah, bicara dengan NPC, beli di Kantin, berlatih di Dojo, buka peta. */
export class Hub extends Phaser.Scene {
  private loc!: HubLocation;
  private backdrop?: Backdrop;
  private host!: SceneCutsceneHost;
  private actors = new Map<string, SpriteActor>();
  private npcs: NpcEntry[] = [];
  private player!: SpriteActor;
  private playerAnim = '';
  private idleAt = 0;
  private busy = false;
  /** Jeda singkat setelah dialog agar tombol yang menutup dialog tidak langsung memulai percakapan baru. */
  private noTalkUntil = 0;
  private leaving = false;
  private prompt!: Phaser.GameObjects.Sprite;
  private header!: PixelText;
  private menu: Menu | null = null;
  private menuObjs: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('Hub');
  }

  create(data: HubInit): void {
    const loc =
      hubLocation(data.location ?? game.profile.hubLocation ?? 'halaman') ??
      (HUB_LOCATIONS[0] as HubLocation);
    this.loc = loc;
    game.profile.hubLocation = loc.id;
    if (import.meta.env.DEV) (window as unknown as { __hub?: Hub }).__hub = this;
    this.busy = false;
    this.leaving = false;
    this.menu = null;
    this.menuObjs = [];
    this.npcs = [];
    this.actors.clear();
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.backdrop = new Backdrop(this, loc.stage, { weather: loc.weather });
    audio.music('sekolah');

    for (const a of loc.ambient ?? []) {
      this.add
        .sprite(a.x, a.y, `npc:${a.sheet}`, 0)
        .setOrigin(32 / 64, 59 / 64)
        .setDepth(a.y)
        .play(`npc:${a.sheet}:loop`);
    }
    for (const def of loc.npcs) {
      const actor = new SpriteActor(this, def.id, def.char, def.x, def.y, def.face === 'left' ? -1 : 1);
      const idle = def.idle ?? 'idle_berdiri';
      actor.play(idle, true);
      this.actors.set(def.id, actor);
      this.npcs.push({ def, actor, idle, nextIdle: this.time.now + 3000 + Math.random() * 4000 });
    }
    const char = game.profile.selectedChar;
    this.player = new SpriteActor(this, 'player', char, 70, 222, 1);
    this.actors.set('player', this.player);
    this.playerAnim = '';
    this.setPlayerAnim('idle_berdiri');

    this.prompt = this.add.sprite(0, 0, 'ui:penanda_misi', 0).setDepth(19000).setVisible(false);
    this.prompt.play('ui:penanda_misi:loop');
    this.add
      .sprite(EXIT_X + 8, 205, 'ui:penanda_tujuan', 0)
      .setDepth(19000)
      .play('ui:penanda_tujuan:loop');
    new PixelText(this, EXIT_X + 8, 184, 'PETA', {
      color: COLORS.text,
      origin: 0.5,
      align: 'center',
    }).setDepth(19000);

    this.add.rectangle(0, 0, LOGICAL_W, 20, 0x121a2e, 0.7).setOrigin(0, 0).setDepth(19900);
    this.header = new PixelText(this, 6, 6, '', { color: COLORS.text }).setDepth(19901);

    this.host = new SceneCutsceneHost({
      scene: this,
      actors: this.actors,
      fx: { shake: () => undefined, flash: () => undefined },
    });
    flushToasts(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.host.destroy();
      this.backdrop?.destroy();
    });
    runner.save();
    if (data.quest) this.playQuestEnding(data.quest);
  }

  private playQuestEnding(r: HubQuestResult): void {
    const q = questById(r.id);
    const giver = this.npcs.find((n) => n.def.quest === r.id);
    if (!q || !giver) return;
    this.busy = true;
    this.player.setPos(giver.actor.x - 40, giver.actor.y);
    this.player.setFacing(1);
    giver.actor.setFacing(-1);
    void runCutscene(r.ok ? q.success : q.fail, this.host).then(() => {
      this.noTalkUntil = this.time.now + 350;
      this.busy = false;
    });
  }

  // ---------- pemain ----------
  private setPlayerAnim(name: string): void {
    if (name === this.playerAnim) return;
    this.playerAnim = name;
    this.player.play(name, true);
  }

  override update(time: number, delta: number): void {
    this.host.update(delta);
    this.header.setText(
      `${this.loc.label}   ${formatMoney(game.profile.money)}   ${characterName(game.profile.selectedChar)}`,
    );
    for (const e of this.npcs) {
      if (time >= e.nextIdle && !this.busy) {
        const alts = e.def.idle ? [e.def.idle] : IDLE_ALTS;
        e.idle = alts[Math.floor(Math.random() * alts.length)] as string;
        e.actor.play(e.idle, true);
        e.nextIdle = time + 4000 + Math.random() * 3000;
      }
    }
    if (this.menu) {
      this.menu.update();
      return;
    }
    if (this.busy || this.leaving) return;

    const f = input.sample();
    const h = f.held;
    const dx = (h.has('right') ? 1 : 0) - (h.has('left') ? 1 : 0);
    const dy = (h.has('down') ? 1 : 0) - (h.has('up') ? 1 : 0);
    const dt = delta / 1000;
    if (dx !== 0 || dy !== 0) {
      this.player.setPos(
        clamp(this.player.x + dx * WALK_X * dt, 14, LOGICAL_W - 14),
        clamp(this.player.y + dy * WALK_Y * dt, MIN_Y, MAX_Y),
      );
      if (dx !== 0) this.player.setFacing(dx > 0 ? 1 : -1);
      this.setPlayerAnim('jalan_samping');
      this.idleAt = time + 4500;
    } else if (this.playerAnim === 'jalan_samping') {
      this.setPlayerAnim('idle_berdiri');
    } else if (time >= this.idleAt) {
      this.setPlayerAnim(IDLE_ALTS[Math.floor(Math.random() * IDLE_ALTS.length)] as string);
      this.idleAt = time + 4500 + Math.random() * 2500;
    }

    const near = this.nearest();
    if (near) {
      const x = near.kind === 'npc' ? near.entry.actor.x : near.spot.x;
      const y = near.kind === 'npc' ? near.entry.actor.y : near.spot.y;
      this.prompt.setPosition(Math.floor(x), Math.floor(y - 64)).setVisible(true);
    } else this.prompt.setVisible(false);

    if (f.pressed.has('pause')) this.openMenu();
    else if ((f.pressed.has('interact') || f.pressed.has('confirm')) && near && time >= this.noTalkUntil)
      this.interact(near);
    else if (this.player.x >= EXIT_X) {
      this.leaving = true;
      this.scene.start('MapSelect', { location: this.loc.id });
    }
  }

  private nearest(): Near {
    let best: Near = null;
    let bd = Infinity;
    const px = this.player.x;
    const py = this.player.y;
    for (const entry of this.npcs) {
      const dx = Math.abs(entry.actor.x - px);
      const dy = Math.abs(entry.actor.y - py);
      if (dx <= TALK_DX && dy <= TALK_DY && dx + dy < bd) {
        bd = dx + dy;
        best = { kind: 'npc', entry };
      }
    }
    for (const spot of this.loc.spots ?? []) {
      const dx = Math.abs(spot.x - px);
      const dy = Math.abs(spot.y - py);
      if (dx <= TALK_DX + 14 && dy <= TALK_DY + 10 && dx + dy < bd) {
        bd = dx + dy;
        best = { kind: 'spot', spot };
      }
    }
    return best;
  }

  private interact(n: NonNullable<Near>): void {
    audio.sfx('ui_confirm');
    this.busy = true;
    this.prompt.setVisible(false);
    this.setPlayerAnim('idle_berdiri');
    if (n.kind === 'spot') {
      this.openAction(n.spot.action);
      return;
    }
    const { def, actor } = n.entry;
    this.player.setFacing(actor.x >= this.player.x ? 1 : -1);
    actor.setFacing(this.player.x >= actor.x ? 1 : -1);
    const script = pickTalk(def, (k) => game.profile.flags[k] === true);
    void runCutscene(script, this.host).then(() => {
      actor.setFacing(def.face === 'left' ? -1 : 1);
      this.noTalkUntil = this.time.now + 350;
      if (def.action) this.openAction(def.action);
      else if (def.quest) this.offerQuest(def.quest);
      else this.busy = false;
    });
  }

  // ---------- Cerita Sekolah ----------
  private offerQuest(id: string): void {
    const q = questById(id);
    if (!q || questState(game.profile, q) !== 'tersedia') {
      this.busy = false;
      return;
    }
    input.clear();
    const w = 330;
    const h = 120;
    const x = (LOGICAL_W - w) / 2;
    const y = 70;
    const close = (): void => {
      this.menu?.destroy();
      this.menu = null;
      for (const o of this.menuObjs) o.destroy();
      this.menuObjs = [];
      input.clear();
    };
    const lines = [q.title, '', q.rule];
    const texts = lines.map((t, i) =>
      new PixelText(this, x + 14, y + 28 + i * 11, t, {
        color: i === 0 ? COLORS.gold : COLORS.text,
      }).setDepth(106),
    );
    this.menuObjs = [addDim(this, 0.55, 90), ...addPanel(this, x, y, w, h, 'CERITA SEKOLAH'), ...texts];
    const items: MenuItem[] = [
      {
        label: 'TERIMA',
        onSelect: () => {
          close();
          void runCutscene(q.intro, this.host).then(() => {
            this.leaving = true;
            startQuest(this, q, this.loc.id);
          });
        },
      },
      {
        label: 'NANTI SAJA',
        onSelect: () => {
          close();
          this.noTalkUntil = this.time.now + 350;
          this.busy = false;
        },
      },
    ];
    this.menu = new Menu(this, {
      x: x + 30,
      y: y + 72,
      items,
      width: 120,
      depth: 110,
      onBack: () => {
        close();
        this.busy = false;
      },
    });
  }

  private openAction(action: 'shop' | 'dojo'): void {
    this.leaving = true;
    this.scene.start(action === 'shop' ? 'Shop' : 'Dojo', {
      from: 'Hub',
      fromData: { location: this.loc.id },
    });
  }

  // ---------- menu jeda Waktu Bebas ----------
  private openMenu(): void {
    input.clear();
    const w = 170;
    const items: MenuItem[] = [
      { label: 'LANJUTKAN', onSelect: () => this.closeMenu() },
      { label: 'PETA SEKOLAH', onSelect: () => this.scene.start('MapSelect', { location: this.loc.id }) },
      {
        label: () => `KARAKTER: ${characterName(game.profile.selectedChar)}`,
        onSelect: () => this.cycleCharacter(),
        onLeft: () => this.cycleCharacter(-1),
        onRight: () => this.cycleCharacter(1),
      },
      {
        label: 'MODE BEBAS',
        disabled: () => !game.profile.cleared || !this.scene.manager.keys.ModeSelect,
        onSelect: () => this.scene.start('ModeSelect', { from: 'Hub', fromData: { location: this.loc.id } }),
      },
      {
        label: 'ARSIP SEJARAH',
        onSelect: () => this.scene.start('Archive', { from: 'Hub', fromData: { location: this.loc.id } }),
      },
      {
        label: 'PENGATURAN',
        disabled: () => !this.scene.manager.keys.Settings,
        onSelect: () => this.scene.start('Settings', { from: 'Hub', fromData: { location: this.loc.id } }),
      },
      {
        label: 'SIMPAN',
        onSelect: () => {
          const ok = runner.save();
          showToast(this, ok ? 'TERSIMPAN' : 'TIDAK BISA MENYIMPAN', 1800, ok ? COLORS.good : COLORS.bad);
        },
      },
      {
        label: 'KELUAR KE MENU',
        onSelect: () => {
          runner.save();
          this.scene.start('MainMenu');
        },
      },
    ];
    const h = 34 + items.length * 16;
    const x = (LOGICAL_W - w) / 2;
    const y = (LOGICAL_H - h) / 2;
    this.menuObjs = [addDim(this, 0.62, 90), ...addPanel(this, x, y, w, h, 'JEDA')];
    this.menu = new Menu(this, {
      x: x + 20,
      y: y + 28,
      items,
      width: w - 34,
      depth: 110,
      onBack: () => this.closeMenu(),
    });
  }

  private cycleCharacter(d = 1): void {
    const list = game.profile.unlockedChars;
    const i = list.indexOf(game.profile.selectedChar);
    game.profile.selectedChar = list[(i + d + list.length) % list.length] as string;
    this.player.destroy();
    const old = this.player;
    this.player = new SpriteActor(this, 'player', game.profile.selectedChar, old.x, old.y, old.facing);
    this.actors.set('player', this.player);
    this.playerAnim = '';
    this.setPlayerAnim('idle_berdiri');
  }

  private closeMenu(): void {
    this.menu?.destroy();
    this.menu = null;
    for (const o of this.menuObjs) o.destroy();
    this.menuObjs = [];
    input.clear();
  }
}
