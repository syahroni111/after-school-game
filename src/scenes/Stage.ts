import Phaser from 'phaser';
import { AttackDirector } from '../combat/AttackDirector';
import { CombatWorld } from '../combat/CombatWorld';
import type { Controller, WorldStats } from '../combat/CombatWorld';
import type { WorldEvent } from '../combat/events';
import { LOGICAL_H, LOGICAL_W } from '../config';
import { characterName } from '../data/characters';
import { DIFFICULTY } from '../data/difficulty';
import type { Difficulty } from '../data/difficulty';
import { enemyDef } from '../data/enemies';
import { hasTexture, WALK_AREA_Y } from '../data/assetIndex';
import { TEST_SCREENS } from '../data/testScreens';
import type { ScreenDef } from '../data/stages';
import { spawnEnemy } from '../entities/Enemy';
import type { EnemyBrain } from '../entities/EnemyBrain';
import { ALL_UNLOCKED, Fighter } from '../entities/Fighter';
import { PlayerController } from '../entities/Player';
import { SpriteView } from '../entities/SpriteView';
import { CombatPresenter } from '../systems/CombatPresenter';
import { EffectPool } from '../systems/EffectPool';
import { game } from '../systems/GameState';
import { input } from '../systems/InputManager';
import { playerStats } from '../systems/Profile';
import { ScreenFx } from '../systems/ScreenFx';
import { WaveDirector } from '../systems/WaveDirector';
import type { SpawnDef } from '../systems/WaveDirector';
import { Hud } from '../ui/Hud';
import type { HudTarget } from '../ui/Hud';
import { PixelText } from '../ui/PixelText';
import { Rng } from '../util/rng';

export interface StageResult {
  win: boolean;
  screenId: string;
  stats: WorldStats;
  hpLeft: number;
  hpMax: number;
  seconds: number;
}

export interface StageInit {
  screen: ScreenDef | string;
  onDone?: (r: StageResult) => void;
  /** Alat dev: buka semua jurus / kesulitan dari URL. */
  unlock?: string;
  diff?: string;
}

type StageState = 'fight' | 'clear' | 'exit' | 'over';

const PLAYER_START_X = 60;
const EXIT_X = 458;
const TARGET_TICKS = 240;

/** Satu layar pertarungan: arena terkunci, gelombang musuh, bos masuk saat kroco tinggal ≤ 1, lalu LANJUT. */
export class Stage extends Phaser.Scene {
  world!: CombatWorld;
  player!: Fighter;
  state: StageState = 'fight';
  private screenDef!: ScreenDef;
  private init0!: StageInit;
  private director!: AttackDirector;
  private wave!: WaveDirector;
  private rng!: Rng;
  private fx!: EffectPool;
  private screenFx!: ScreenFx;
  private presenter!: CombatPresenter;
  private hud!: Hud;
  private brains = new Map<Fighter, EnemyBrain>();
  private phasesDone = new Map<Fighter, Set<number>>();
  private extra: SpawnDef[] = [];
  private seq = 0;
  private target: Fighter | null = null;
  private targetTimer = 0;
  private playerTicks = 0;
  private controller = new PlayerController();
  private pauseRequested = false;
  private marker?: Phaser.GameObjects.Sprite;
  private markerText?: PixelText;
  private overlayObjs: Phaser.GameObjects.GameObject[] = [];
  private finished = false;
  private pausedByUser = false;

  constructor() {
    super('Stage');
  }

  create(data: StageInit): void {
    this.init0 = data;
    const screen = typeof data.screen === 'string' ? TEST_SCREENS[data.screen] : data.screen;
    if (!screen) throw new Error(`Layar tidak dikenal: ${String(data.screen)}`);
    this.screenDef = screen;
    this.state = 'fight';
    this.finished = false;
    this.pausedByUser = false;
    this.brains.clear();
    this.phasesDone.clear();
    this.extra = [];
    this.seq = 0;
    this.playerTicks = 0;
    this.target = null;
    if (import.meta.env.DEV) (window as unknown as { __stage?: Stage }).__stage = this;

    this.cameras.main.fadeIn(200, 0, 0, 0);
    this.buildBackdrop(screen);

    const diffKey = (
      data.diff && data.diff in DIFFICULTY ? data.diff : game.profile.difficulty
    ) as Difficulty;
    const diff = DIFFICULTY[diffKey];
    const bounds = { minX: 14, maxX: LOGICAL_W - 14, minY: WALK_AREA_Y[0], maxY: WALK_AREA_Y[1] };
    this.world = new CombatWorld({ bounds, seed: Math.floor(Math.random() * 1e9) });
    this.rng = new Rng(Math.floor(Math.random() * 1e9));
    this.director = new AttackDirector(diff.tokens);
    this.wave = new WaveDirector(screen.spawns);
    this.fx = new EffectPool(this);
    this.screenFx = new ScreenFx(this);
    this.presenter = new CombatPresenter(this.world, this.fx, this.screenFx);

    const charKey = screen.playerChar ?? game.profile.selectedChar;
    const unlocks = data.unlock === 'all' ? ALL_UNLOCKED : game.profile.moves;
    this.player = new Fighter({
      id: 'player',
      team: 'player',
      charKey,
      x: PLAYER_START_X,
      y: 222,
      facing: 1,
      stats: playerStats(game.profile, charKey),
      unlocks,
      host: this.world,
      view: new SpriteView(this, charKey),
    });
    this.world.add(this.player, this.playerController);
    if (screen.allyArga) this.spawnAlly('arga');

    this.hud = new Hud(this);
    this.cameras.main.setBackgroundColor(0x000000);
    this.input.keyboard?.on('keydown-ENTER', () => this.overlayConfirm());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.hud.destroy());
  }

  /** Latar stage. Detail cuaca, efek lingkungan, dan filter ditambah di M5. */
  private buildBackdrop(screen: ScreenDef): void {
    const weatherKey = screen.weather ? `stage:${screen.stage}:${screen.weather}` : '';
    const key = weatherKey && hasTexture(weatherKey) ? weatherKey : `stage:${screen.stage}`;
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(-10);
  }

  private playerController: Controller = (self) => {
    this.playerTicks++;
    const frame = input.sample();
    if (frame.pressed.has('pause')) this.pauseRequested = true;
    return this.controller.intent(frame, self, this.playerTicks);
  };

  // ---------- spawn ----------
  private spawn(def: SpawnDef): void {
    const e = enemyDef(def.enemy);
    const from = def.side;
    const b = this.world.bounds;
    const y = def.y ?? this.rng.int(b.minY + 12, b.maxY - 8);
    const id = `e${++this.seq}`;
    const { fighter, brain } = spawnEnemy({
      enemy: def.enemy,
      world: this.world,
      director: this.director,
      diff: DIFFICULTY[this.difficulty()],
      x: from === 'left' ? -24 : LOGICAL_W + 24,
      y,
      from,
      rng: this.rng,
      slotIndex: this.seq,
      view: new SpriteView(this, e.charKey, e.tint),
      id,
    });
    this.brains.set(fighter, brain);
    this.phasesDone.set(fighter, new Set());
  }

  private spawnAlly(enemy: string): void {
    const e = enemyDef(enemy);
    const { fighter, brain } = spawnEnemy({
      enemy,
      world: this.world,
      director: null,
      diff: DIFFICULTY.normal,
      x: -24,
      y: 235,
      from: 'left',
      rng: this.rng,
      slotIndex: 0,
      view: new SpriteView(this, e.charKey),
      id: `ally${++this.seq}`,
      team: 'ally',
    });
    this.brains.set(fighter, brain);
  }

  private difficulty(): Difficulty {
    const d = this.init0.diff;
    return (d && d in DIFFICULTY ? d : game.profile.difficulty) as Difficulty;
  }

  private enemies(): Fighter[] {
    return this.world.fighters.filter((f) => f.team === 'enemy' && !f.removed);
  }

  // ---------- loop ----------
  override update(_time: number, delta: number): void {
    if (this.finished) return;
    if (this.pauseRequested) {
      this.pauseRequested = false;
      this.togglePause();
    }
    if (this.pausedByUser) return;

    const steps = this.world.advance(delta);
    this.director.tick(this.world.tickCount);
    for (let i = 0; i < steps; i++) this.spawnTick();
    this.handleEvents(this.presenter.flush());
    this.screenFx.update(delta);
    this.checkPhases();
    for (const f of this.world.fighters) (f.view as SpriteView).updateStatus(f);
    this.updateState();
    this.hud.update(this.hudState());
    if (this.targetTimer > 0) this.targetTimer--;
    if (this.marker) this.marker.setVisible(this.state === 'clear');
    if (this.markerText)
      this.markerText.setVisible(this.state === 'clear' && Math.floor(this.time.now / 350) % 2 === 0);
  }

  private spawnTick(): void {
    const alive = this.world.aliveEnemies();
    const grunts = alive.filter((f) => !f.enemyDef?.boss).length;
    for (const s of this.wave.update(alive.length, grunts)) this.spawn(s);
    while (this.extra.length > 0 && alive.length < 6) this.spawn(this.extra.shift() as SpawnDef);
  }

  private handleEvents(events: WorldEvent[]): void {
    for (const e of events) {
      if (
        e.type === 'hit' &&
        e.attacker.team !== 'enemy' &&
        e.target.team === 'enemy' &&
        e.result.kind !== 'miss'
      ) {
        this.target = e.target;
        this.targetTimer = TARGET_TICKS;
      } else if (e.type === 'ko' && e.fighter.team === 'enemy') {
        this.onEnemyDown(e.fighter);
      } else if (e.type === 'koDone') {
        this.brains.get(e.fighter)?.release(e.fighter);
        this.brains.delete(e.fighter);
        this.phasesDone.delete(e.fighter);
        e.fighter.view.destroy();
      }
    }
  }

  private onEnemyDown(f: Fighter): void {
    const def = f.enemyDef;
    this.director.forget(f.id);
    if (!def || this.screenDef.noMoney) return;
    const gain = this.rng.int(def.money[0], def.money[1]);
    if (gain > 0) {
      game.profile.money += gain;
      this.fx.floatText(`+${gain}`, f.x, f.y - 56, 0xe8c860);
    }
  }

  private checkPhases(): void {
    for (const f of this.world.fighters) {
      const def = f.enemyDef;
      if (!def?.phases || f.dead || f.team !== 'enemy') continue;
      const done = this.phasesDone.get(f);
      if (!done) continue;
      const ratio = f.hp / f.stats.maxHp;
      def.phases.forEach((ph, i) => {
        if (done.has(i) || ratio > ph.below) return;
        done.add(i);
        if (ph.marah) f.status.marah = true;
        if (ph.speedMult) f.stats = { ...f.stats, speed: f.stats.speed * ph.speedMult };
        if (ph.screenFx) this.screenFx.screen(ph.screenFx);
        if (ph.say) this.fx.floatText(ph.say, f.x, f.y - 62, 0xe05050);
        for (const id of ph.spawn ?? [])
          this.extra.push({ enemy: id, side: this.rng.chance(0.5) ? 'left' : 'right' });
      });
    }
  }

  private updateState(): void {
    if (this.state === 'fight') {
      if (this.player.state === 'ko') {
        this.state = 'over';
        this.time.delayedCall(900, () => this.finish(false));
        return;
      }
      const cleared =
        this.wave.exhausted && this.extra.length === 0 && this.world.aliveEnemies().length === 0;
      if (cleared && this.enemies().every((f) => f.dead)) this.openExit();
    } else if (this.state === 'clear') {
      if (this.player.x >= EXIT_X && this.player.canAct) {
        this.state = 'exit';
        this.cameras.main.fadeOut(220, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.finish(true));
      }
    }
  }

  private openExit(): void {
    this.state = 'clear';
    this.marker = this.add
      .sprite(LOGICAL_W - 22, 205, 'ui:penanda_tujuan', 0)
      .setDepth(9000)
      .play('ui:penanda_tujuan:loop');
    this.markerText = new PixelText(this, LOGICAL_W - 22, 184, 'LANJUT', {
      color: 0xf6f7fa,
      origin: 0.5,
      align: 'center',
    }).setDepth(9000);
  }

  private finish(win: boolean): void {
    if (this.finished) return;
    this.finished = true;
    const result: StageResult = {
      win,
      screenId: this.screenDef.id,
      stats: { ...this.world.stats },
      hpLeft: Math.max(0, Math.ceil(this.player.hp)),
      hpMax: this.player.stats.maxHp,
      seconds: this.world.stats.ticks / 60,
    };
    (window as unknown as { __stageResult?: StageResult }).__stageResult = result;
    if (this.init0.onDone) {
      this.init0.onDone(result);
      return;
    }
    this.cameras.main.resetFX();
    this.showOverlay(
      `${win ? 'MENANG!' : 'KALAH...'}
DAMAGE ${Math.round(result.stats.damageDealt)}  KOMBO ${result.stats.maxCombo}
TEKAN ENTER UNTUK ULANG`,
    );
  }

  /** Teks di tengah layar di atas latar gelap (sementara; layar Hasil/Jeda/Game Over penuh ada di M5). */
  private showOverlay(text: string): void {
    this.clearOverlay();
    const dim = this.add
      .rectangle(0, 0, LOGICAL_W, LOGICAL_H, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setDepth(39999)
      .setScrollFactor(0);
    const label = new PixelText(this, LOGICAL_W / 2, LOGICAL_H / 2 - 10, text, {
      color: 0xf6f7fa,
      origin: 0.5,
      align: 'center',
    })
      .setDepth(40000)
      .setScrollFactor(0);
    this.overlayObjs.push(dim, label);
  }

  private clearOverlay(): void {
    for (const o of this.overlayObjs) o.destroy();
    this.overlayObjs = [];
  }

  private overlayConfirm(): void {
    if (this.finished && this.overlayObjs.length > 0 && !this.init0.onDone) {
      this.clearOverlay();
      this.scene.restart(this.init0);
    }
  }

  private togglePause(): void {
    this.pausedByUser = !this.pausedByUser;
    if (this.pausedByUser) {
      this.anims.pauseAll();
      this.showOverlay('JEDA');
    } else {
      this.anims.resumeAll();
      this.clearOverlay();
      input.clear();
    }
  }

  // ---------- HUD ----------
  private hudState() {
    const p = this.player;
    const statuses: string[] = [];
    if (p.state === 'dizzy') statuses.push('pusing');
    if (p.tired) statuses.push('lelah');
    if (p.status.marah) statuses.push('marah');
    if (p.status.kuat > 0) statuses.push('kuat');
    if (p.status.bertahan > 0) statuses.push('bertahan');
    return {
      name: characterName(p.charKey),
      school: 'north' as const,
      hp: Math.max(0, Math.ceil(p.hp)),
      maxHp: p.stats.maxHp,
      tempHp: p.tempHp,
      stamina: p.stamina,
      maxStamina: p.stats.maxStamina,
      money: game.profile.money,
      combo: p.combo,
      statuses,
      target: this.hudTarget(),
    };
  }

  private hudTarget(): HudTarget | null {
    const boss = this.enemies().find((f) => f.enemyDef?.boss && !f.dead);
    const t = this.targetTimer > 0 && this.target && !this.target.removed ? this.target : boss;
    const def = t?.enemyDef;
    if (!t || !def) return null;
    return { name: def.name, school: def.school, ratio: Math.max(0, t.hp / t.stats.maxHp), boss: !!def.boss };
  }
}
