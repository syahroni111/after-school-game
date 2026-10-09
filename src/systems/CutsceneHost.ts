// Implementasi CutsceneHost untuk scene Phaser (Stage, Hub): aktor, dialog, gerak, fade, judul, petunjuk tutorial.
import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { LOGICAL_H, LOGICAL_W } from '../config';
import { characterName } from '../data/characters';
import type { Cmd, Dir, SayCmd, WaitCond } from '../data/cutscene';
import { portraitFor } from '../data/portraits';
import { SpriteActor } from '../entities/Actor';
import type { Actor } from '../entities/Actor';
import { DialogBox } from '../ui/DialogBox';
import { COLORS } from '../ui/Panel';
import { PixelText } from '../ui/PixelText';
import { showToast } from '../ui/Toast';
import { debug } from './Debug';
import type { CutsceneHost } from './Cutscene';
import { game } from './GameState';
import { applyUnlock } from './Progression';
import type { FlagValue } from './Profile';
import type { SpawnDef } from './WaveDirector';

export interface HostDeps {
  scene: Phaser.Scene;
  actors: Map<string, Actor>;
  fx: { shake(n: number): void; flash(a: number): void };
  spawnWave?: (spawns: readonly SpawnDef[], wait: boolean) => Promise<void>;
  waitFor?: (cond: WaitCond, times: number) => Promise<void>;
  /** Judul dan petunjuk di bawah HUD. */
  hintY?: number;
}

const WALK_SPEED = 70;
const IDLE_ANIM = 'idle_berdiri';
const WALK_ANIM = 'jalan_samping';

interface Mover {
  actor: Actor;
  tx: number;
  ty: number;
  speed: number;
  resolve: () => void;
}

export class SceneCutsceneHost implements CutsceneHost {
  readonly dialog: DialogBox;
  private movers: Mover[] = [];
  private animWaiters: { actor: Actor; resolve: () => void }[] = [];
  private hintObjs: Phaser.GameObjects.GameObject[] = [];

  constructor(private readonly d: HostDeps) {
    this.dialog = new DialogBox(d.scene);
  }

  private scene(): Phaser.Scene {
    return this.d.scene;
  }

  /** Dipanggil tiap frame render. */
  update(dtMs: number): void {
    this.dialog.update(dtMs);
    for (const m of [...this.movers]) {
      const dx = m.tx - m.actor.x;
      const dy = m.ty - m.actor.y;
      const dist = Math.hypot(dx, dy);
      const step = (m.speed * dtMs) / 1000;
      if (dist <= step) {
        m.actor.setPos(m.tx, m.ty);
        m.actor.play(IDLE_ANIM, true);
        this.movers.splice(this.movers.indexOf(m), 1);
        m.resolve();
      } else {
        if (Math.abs(dx) > 0.5) m.actor.setFacing(dx > 0 ? 1 : -1);
        m.actor.setPos(m.actor.x + (dx / dist) * step, m.actor.y + (dy / dist) * step);
      }
    }
    for (const w of [...this.animWaiters]) {
      if (w.actor.animDone()) {
        this.animWaiters.splice(this.animWaiters.indexOf(w), 1);
        w.resolve();
      }
    }
  }

  get busy(): boolean {
    return this.dialog.active || this.movers.length > 0;
  }

  // ---------- CutsceneHost ----------
  say(cmd: SayCmd): Promise<void> {
    const narr = cmd.who === 'narasi';
    const speaker = [...this.d.actors.values()].find((a) => a.char === cmd.who);
    const side: Dir = cmd.side ?? (speaker && speaker.x > LOGICAL_W / 2 ? 'right' : 'left');
    const portrait = narr ? null : portraitFor(cmd.who, cmd.face ?? 'netral');
    audio.sfx('text');
    return this.dialog.show({ name: narr ? undefined : (cmd.name ?? characterName(cmd.who)), text: cmd.text, portrait, side });
  }

  spawn(cmd: Extract<Cmd, { c: 'spawn' }>): void {
    this.d.actors.get(cmd.id)?.destroy();
    const a = new SpriteActor(this.scene(), cmd.id, cmd.char, cmd.x, cmd.y, cmd.face === 'left' ? -1 : 1);
    a.play(cmd.anim ?? IDLE_ANIM, true);
    this.d.actors.set(cmd.id, a);
  }

  remove(id: string): void {
    this.d.actors.get(id)?.destroy();
    this.d.actors.delete(id);
  }

  move(cmd: Extract<Cmd, { c: 'move' }>): Promise<void> {
    const actor = this.d.actors.get(cmd.id);
    if (!actor) return Promise.resolve();
    actor.play(WALK_ANIM, true);
    const speed = cmd.speed ?? WALK_SPEED;
    return new Promise<void>((resolve) => {
      // Pindah baru membatalkan gerak lama aktor yang sama.
      this.movers = this.movers.filter((m) => {
        if (m.actor !== actor) return true;
        m.resolve();
        return false;
      });
      this.movers.push({ actor, tx: cmd.x, ty: cmd.y ?? actor.y, speed: debug.fast ? speed * 4 : speed, resolve });
    });
  }

  face(id: string, dir: string): void {
    const actor = this.d.actors.get(id);
    if (!actor) return;
    if (dir === 'left' || dir === 'right') actor.setFacing(dir === 'left' ? -1 : 1);
    else {
      const other = this.d.actors.get(dir);
      if (other) actor.setFacing(other.x >= actor.x ? 1 : -1);
    }
  }

  anim(cmd: Extract<Cmd, { c: 'anim' }>): Promise<void> {
    const actor = this.d.actors.get(cmd.id);
    if (!actor) return Promise.resolve();
    actor.play(cmd.anim, cmd.loop ?? false);
    if (cmd.loop) return Promise.resolve();
    return new Promise<void>((resolve) => this.animWaiters.push({ actor, resolve }));
  }

  wait(ms: number): Promise<void> {
    return new Promise((resolve) => this.scene().time.delayedCall(debug.fast ? Math.min(ms, 60) : ms, resolve));
  }

  fade(dir: 'in' | 'out', ms: number): Promise<void> {
    const cam = this.scene().cameras.main;
    const t = debug.fast ? Math.min(ms, 60) : ms;
    return new Promise((resolve) => {
      const ev = dir === 'out' ? Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE : Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE;
      cam.once(ev, () => resolve());
      if (dir === 'out') cam.fadeOut(t, 0, 0, 0);
      else cam.fadeIn(t, 0, 0, 0);
    });
  }

  shake(amount: number): void {
    this.d.fx.shake(amount);
  }
  flash(alpha: number): void {
    this.d.fx.flash(alpha);
  }

  getFlag(key: string): boolean {
    const v = game.profile.flags[key];
    return v !== undefined && v !== false && v !== 0 && v !== '';
  }
  setFlag(key: string, value: FlagValue): void {
    game.profile.flags[key] = value;
  }

  spawnWave(spawns: readonly SpawnDef[], wait: boolean): Promise<void> {
    return this.d.spawnWave ? this.d.spawnWave(spawns, wait) : Promise.resolve();
  }

  music(song: string): void {
    audio.music(song);
  }
  sfx(name: string): void {
    audio.sfx(name);
  }

  giveMoney(amount: number): void {
    game.profile.money += amount;
    audio.sfx('money');
    showToast(this.scene(), `DAPAT RP ${amount}`, 1800);
  }

  giveArchive(id: string): void {
    if (!game.profile.archives.includes(id)) {
      game.profile.archives.push(id);
      audio.sfx('archive');
      showToast(this.scene(), 'ARSIP SEJARAH BARU', 2600, COLORS.cyan);
    }
  }

  unlock(what: string): void {
    const r = applyUnlock(game.profile, what);
    if (r.toast) {
      audio.sfx('unlock');
      showToast(this.scene(), r.toast, 3000, COLORS.good);
    }
  }

  title(text: string, sub?: string): Promise<void> {
    const s = this.scene();
    const band = s.add.rectangle(0, LOGICAL_H / 2 - 30, LOGICAL_W, 60, 0x000000, 0.7).setOrigin(0, 0).setDepth(33000).setScrollFactor(0).setAlpha(0);
    const big = new PixelText(s, LOGICAL_W / 2, LOGICAL_H / 2 - 4, text, { color: COLORS.text, origin: 0.5, align: 'center' }).setScale(2).setDepth(33001).setScrollFactor(0).setAlpha(0);
    const small = new PixelText(s, LOGICAL_W / 2, LOGICAL_H / 2 - 24, sub ?? '', { color: COLORS.cyan, origin: 0.5, align: 'center' }).setDepth(33001).setScrollFactor(0).setAlpha(0);
    const objs = [band, big, small];
    const hold = debug.fast ? 120 : 2200;
    return new Promise((resolve) => {
      s.tweens.add({ targets: objs, alpha: 1, duration: debug.fast ? 30 : 350, yoyo: false });
      s.tweens.add({
        targets: objs,
        alpha: 0,
        delay: hold,
        duration: debug.fast ? 30 : 400,
        onComplete: () => {
          for (const o of objs) o.destroy();
          resolve();
        },
      });
    });
  }

  hint(text: string): void {
    this.hintOff();
    const s = this.scene();
    const y = this.d.hintY ?? 52;
    const label = new PixelText(s, LOGICAL_W / 2, y + 5, text, { color: COLORS.gold, origin: 0.5, align: 'center' }).setDepth(32501).setScrollFactor(0);
    const bg = s.add.rectangle(LOGICAL_W / 2, y + 9, Math.max(80, label.width + 18), 16, 0x121a2e, 0.85).setDepth(32500).setScrollFactor(0);
    this.hintObjs = [bg, label];
  }

  hintOff(): void {
    for (const o of this.hintObjs) o.destroy();
    this.hintObjs = [];
  }

  waitFor(cond: WaitCond, times: number): Promise<void> {
    return this.d.waitFor ? this.d.waitFor(cond, times) : Promise.resolve();
  }

  destroy(): void {
    this.hintOff();
    this.dialog.destroy();
    for (const a of this.d.actors.values()) a.destroy();
    this.d.actors.clear();
    this.movers = [];
    this.animWaiters = [];
  }
}
