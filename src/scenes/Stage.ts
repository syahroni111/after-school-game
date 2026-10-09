import Phaser from 'phaser';
import { audio } from '../audio/AudioBus';
import { AttackDirector } from '../combat/AttackDirector';
import { CombatWorld } from '../combat/CombatWorld';
import type { Controller, WorldStats } from '../combat/CombatWorld';
import type { WorldEvent } from '../combat/events';
import { LOGICAL_W } from '../config';
import { characterName } from '../data/characters';
import type { WaitCond } from '../data/cutscene';
import { DIFFICULTY } from '../data/difficulty';
import type { Difficulty } from '../data/difficulty';
import { enemyDef } from '../data/enemies';
import { WALK_AREA_Y } from '../data/assetIndex';
import { TEST_SCREENS } from '../data/testScreens';
import { stageLabel } from '../util/text';
import type { ScreenDef, Weather } from '../data/stages';
import { FighterActor } from '../entities/Actor';
import type { Actor } from '../entities/Actor';
import { spawnEnemy } from '../entities/Enemy';
import type { EnemyBrain } from '../entities/EnemyBrain';
import { ALL_UNLOCKED, Fighter, IDLE_INTENT } from '../entities/Fighter';
import { PlayerController } from '../entities/Player';
import { SpriteView } from '../entities/SpriteView';
import { Backdrop } from '../systems/Backdrop';
import { CombatPresenter } from '../systems/CombatPresenter';
import { runCutscene } from '../systems/Cutscene';
import type { CutsceneControl } from '../systems/Cutscene';
import { SceneCutsceneHost } from '../systems/CutsceneHost';
import { debug } from '../systems/Debug';
import { EffectPool } from '../systems/EffectPool';
import { game } from '../systems/GameState';
import { input } from '../systems/InputManager';
import { playerStats } from '../systems/Profile';
import { parSecondsFor, rankOf, scoreOf } from '../systems/Ranking';
import type { Rank } from '../systems/Ranking';
import { ScreenFx } from '../systems/ScreenFx';
import { drawHitboxes } from '../systems/HitboxOverlay';
import { settings } from '../systems/Settings';
import { WaveDirector } from '../systems/WaveDirector';
import type { SpawnDef } from '../systems/WaveDirector';
import { HP_FLOOR_RATIO, HP_REGEN_RATIO, consumeBuffs } from '../systems/Economy';
import { DUET_FULL_HITS, KUAT_TICKS } from '../data/tuning';
import type { PickupDef } from '../data/stages';
import { Hud } from '../ui/Hud';
import type { HudTarget } from '../ui/Hud';
import { PixelText } from '../ui/PixelText';
import { flushToasts } from '../ui/Toast';
import { Rng } from '../util/rng';

export interface StageResult {
  win: boolean;
  screenId: string;
  label: string;
  stats: WorldStats;
  hpLeft: number;
  hpMax: number;
  seconds: number;
  score: number;
  rank: Rank;
  /** Misi gagal karena aturan (waktu habis, terlalu sering terkena, kawalan kalah). */
  failReason?: 'waktu' | 'terkena' | 'kawalan';
}

export interface StageInit {
  screen?: ScreenDef | string;
  /** Alat dev: buka stage mana saja (?scene=Stage&stage=halaman&weather=hujan&enemies=1). */
  stage?: string;
  weather?: string;
  enemies?: string;
  onDone?: (r: StageResult, from: Phaser.Scene) => void;
  onQuit?: (from: Phaser.Scene) => void;
  /** Lewati cutscene pembuka (dipakai saat mengulang setelah kalah). */
  skipIntro?: boolean;
  /** Alat dev: buka semua jurus / kesulitan dari URL. */
  unlock?: string;
  diff?: string;
}

type StageState = 'intro' | 'fight' | 'outro' | 'clear' | 'exit' | 'over';
type Track = Record<WaitCond, number>;

const PLAYER_START_X = 60;
const EXIT_X = 458;
const TARGET_TICKS = 240;
const WEATHERS: readonly string[] = ['cerah', 'berawan', 'hujan', 'sore', 'malam'];
const newTrack = (): Track => ({
  move: 0,
  hit: 0,
  combo: 0,
  guard: 0,
  parry: 0,
  dodge: 0,
  counter: 0,
  special: 0,
  dash: 0,
});

/** Layar dev dari parameter URL: stage apa pun, cuaca apa pun, dengan atau tanpa musuh. */
export function debugScreen(stage: string, weather?: string, enemies = false): ScreenDef {
  const w = weather && WEATHERS.includes(weather) ? (weather as Weather) : undefined;
  return {
    id: `dbg_${stage}${w ? `_${w}` : ''}`,
    stage,
    weather: w,
    spawns: enemies ? (TEST_SCREENS.kecil?.spawns ?? []) : [],
  };
}

/** Satu layar: cutscene pembuka, arena terkunci dengan gelombang musuh, bos masuk saat kroco tinggal ≤ 1, cutscene penutup, LANJUT. */
export class Stage extends Phaser.Scene {
  world!: CombatWorld;
  player!: Fighter;
  state: StageState = 'intro';
  private screenDef!: ScreenDef;
  private init0!: StageInit;
  private director!: AttackDirector;
  private wave!: WaveDirector;
  private rng!: Rng;
  private fx!: EffectPool;
  private screenFx!: ScreenFx;
  private presenter!: CombatPresenter;
  private hud!: Hud;
  private backdrop?: Backdrop;
  private host!: SceneCutsceneHost;
  private actors = new Map<string, Actor>();
  private ctl: CutsceneControl = { cancelled: false };
  /** Kontrol terpisah untuk skrip `during` agar bisa dihentikan saat arena bersih. */
  private duringCtl: CutsceneControl = { cancelled: false };
  /** Layar tanpa musuh tetapi dengan skrip `during` (tutorial gerak): marker LANJUT menunggu skrip selesai. */
  private duringFinished = true;
  private cutsceneActive = false;
  private brains = new Map<Fighter, EnemyBrain>();
  private phasesDone = new Map<Fighter, Set<number>>();
  private extra: SpawnDef[] = [];
  private seq = 0;
  private enemyHpTotal = 0;
  private target: Fighter | null = null;
  private targetTimer = 0;
  private playerTicks = 0;
  private controller = new PlayerController();
  private pauseRequested = false;
  private marker?: Phaser.GameObjects.Sprite;
  private markerText?: PixelText;
  private finished = false;
  private fightStarted = false;
  private track: Track = newTrack();
  private waiters: { cond: WaitCond; base: number; times: number; resolve: () => void }[] = [];
  private waveWaiter: (() => void) | null = null;
  private prev = { x: 0, y: 0, move: '', state: '' };
  private interactRequested = false;
  private pickups: { def: PickupDef; sprite: Phaser.GameObjects.Sprite; icon: Phaser.GameObjects.Sprite }[] =
    [];
  private timeLeft = Infinity;
  private escortFighter: Fighter | null = null;
  private ally: Fighter | null = null;
  private hitboxGfx?: Phaser.GameObjects.Graphics;
  private hitboxShown = false;
  private fpsText?: PixelText;
  /** Meteran Duet Panji: pukulan mendarat sejak duet terakhir. */
  duetHits = 0;

  constructor() {
    super('Stage');
  }

  create(data: StageInit): void {
    this.init0 = data;
    const screen =
      data.stage !== undefined
        ? debugScreen(data.stage, data.weather, data.enemies === '1')
        : typeof data.screen === 'string'
          ? TEST_SCREENS[data.screen]
          : data.screen;
    if (!screen) throw new Error(`Layar tidak dikenal: ${String(data.screen)}`);
    this.screenDef = screen;
    this.finished = false;
    this.fightStarted = false;
    this.cutsceneActive = false;
    this.pauseRequested = false;
    this.ctl = { cancelled: false };
    this.duringCtl = { cancelled: false };
    this.duringFinished = true;
    this.brains.clear();
    this.phasesDone.clear();
    this.actors.clear();
    this.waiters = [];
    this.waveWaiter = null;
    this.extra = [];
    this.seq = 0;
    this.enemyHpTotal = 0;
    this.playerTicks = 0;
    this.target = null;
    this.marker = undefined;
    this.markerText = undefined;
    this.track = newTrack();
    this.interactRequested = false;
    this.pickups = [];
    this.timeLeft = screen.timeLimit !== undefined ? screen.timeLimit * 60 : Infinity;
    this.escortFighter = null;
    this.ally = null;
    this.duetHits = 0;
    if (import.meta.env.DEV) (window as unknown as { __stage?: Stage }).__stage = this;

    this.cameras.main.setBackgroundColor(0x000000);
    this.backdrop = new Backdrop(this, screen.stage, {
      weather: screen.weather,
      rain: screen.rain,
      filter: screen.filter,
      crowd: screen.crowd,
    });
    audio.music(screen.music ?? (screen.spawns.length > 0 ? 'tempur' : 'sekolah'));

    const diff = DIFFICULTY[this.difficulty()];
    const bounds = { minX: 14, maxX: LOGICAL_W - 14, minY: WALK_AREA_Y[0], maxY: WALK_AREA_Y[1] };
    this.world = new CombatWorld({ bounds, seed: Math.floor(Math.random() * 1e9) });
    this.rng = new Rng(Math.floor(Math.random() * 1e9));
    this.director = new AttackDirector(diff.tokens);
    this.wave = new WaveDirector(screen.spawns);
    this.fx = new EffectPool(this);
    this.screenFx = new ScreenFx(this, {
      reduceShake: () => settings.current.reduceShake,
      reduceFlash: () => settings.current.reduceFlash,
    });
    this.hitboxGfx = this.add.graphics().setDepth(9500);
    if (import.meta.env.DEV) this.setupFpsOverlay();
    this.presenter = new CombatPresenter(this.world, this.fx, this.screenFx, (n) => audio.sfx(n));

    const charKey = screen.playerChar ?? (screen.free ? game.profile.selectedChar : 'A01_protagonis');
    const unlocks = data.unlock === 'all' ? ALL_UNLOCKED : game.profile.moves;
    this.player = new Fighter({
      id: 'player',
      team: 'player',
      charKey,
      x: PLAYER_START_X,
      y: 222,
      facing: 1,
      stats:
        debug.power !== 1
          ? {
              ...playerStats(game.profile, charKey),
              power: playerStats(game.profile, charKey).power * debug.power,
            }
          : playerStats(game.profile, charKey),
      unlocks,
      host: this.world,
      view: new SpriteView(this, charKey),
    });
    this.world.add(this.player, this.playerController);
    this.actors.set('player', new FighterActor('player', this.player));
    this.applyCarryover(screen);
    if (screen.allyArga) this.ally = this.spawnAlly('arga');
    if (screen.escort) this.escortFighter = this.spawnAlly(screen.escort);
    this.buildPickups(screen);
    this.prev = { x: this.player.x, y: this.player.y, move: '', state: '' };

    this.hud = new Hud(this);
    flushToasts(this);
    this.host = new SceneCutsceneHost({
      scene: this,
      actors: this.actors,
      fx: { shake: (n) => this.screenFx.shake(n), flash: (a) => this.screenFx.flash(a) },
      spawnWave: (s, w) => this.scriptWave(s, w),
      waitFor: (c, n) => this.scriptWaitFor(c, n),
    });
    this.events.on(Phaser.Scenes.Events.RESUME, () => input.clear());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.ctl.cancelled = true;
      this.duringCtl.cancelled = true;
      this.hud.destroy();
      this.backdrop?.destroy();
      this.host.destroy();
      this.events.off(Phaser.Scenes.Events.RESUME);
    });

    const intro = screen.before && !data.skipIntro ? screen.before : null;
    if (intro) {
      this.state = 'intro';
      this.enterCutscene();
      this.cameras.main.fadeIn(250, 0, 0, 0);
      void runCutscene(intro, this.host, this.ctl).then(() => this.afterIntro());
    } else {
      this.cameras.main.fadeIn(200, 0, 0, 0);
      this.afterIntro();
    }
  }

  private afterIntro(): void {
    if (this.ctl.cancelled) return;
    if (this.screenDef.cutsceneOnly) {
      this.state = 'exit';
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.finish(true));
      return;
    }
    this.exitCutscene();
    for (const [id, a] of [...this.actors]) {
      if (id !== 'player') {
        a.destroy();
        this.actors.delete(id);
      }
    }
    this.state = 'fight';
    this.fightStarted = true;
    const during = this.screenDef.during;
    if (during && !this.init0.skipIntro) {
      this.duringFinished = this.screenDef.spawns.length > 0;
      void runCutscene(during, this.host, this.duringCtl).then(() => (this.duringFinished = true));
    }
  }

  // ---------- mode cutscene ----------
  private enterCutscene(): void {
    this.cutsceneActive = true;
    this.player.enterCutscene();
    this.player.playFree('idle_berdiri', true);
    this.hud.setVisible(false);
  }

  private exitCutscene(): void {
    this.cutsceneActive = false;
    if (this.player.inCutscene) this.player.exitCutscene();
    this.hud.setVisible(true);
  }

  private playerController: Controller = (self) => {
    if (this.cutsceneActive) return IDLE_INTENT;
    this.playerTicks++;
    const frame = input.sample();
    if (frame.pressed.has('pause')) this.pauseRequested = true;
    if (frame.pressed.has('interact')) this.interactRequested = true;
    return this.controller.intent(frame, self, this.playerTicks);
  };

  // ---------- skrip: gelombang dan tutorial ----------
  private scriptWave(spawns: readonly SpawnDef[], wait: boolean): Promise<void> {
    const wasCutscene = this.cutsceneActive;
    if (wasCutscene) this.exitCutscene();
    this.fightStarted = true;
    this.state = 'fight';
    this.extra.push(...spawns);
    if (!wait) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.waveWaiter = () => {
        if (wasCutscene && this.state !== 'over') this.enterCutscene();
        resolve();
      };
    });
  }

  private scriptWaitFor(cond: WaitCond, times: number): Promise<void> {
    const wasCutscene = this.cutsceneActive;
    if (wasCutscene) this.exitCutscene();
    return new Promise<void>((resolve) => {
      this.waiters.push({
        cond,
        base: cond === 'combo' ? 0 : this.track[cond],
        times,
        resolve: () => {
          if (wasCutscene) this.enterCutscene();
          resolve();
        },
      });
    });
  }

  private updateTracking(events: WorldEvent[]): void {
    const p = this.player;
    if (!this.cutsceneActive) this.track.move += Math.hypot(p.x - this.prev.x, p.y - this.prev.y);
    this.prev.x = p.x;
    this.prev.y = p.y;
    const moveId = p.move?.id ?? '';
    if (moveId === 'push' && this.prev.move !== 'push') {
      this.track.special++;
      this.tryDuet();
    }
    this.prev.move = moveId;
    if (p.state === 'dash' && this.prev.state !== 'dash') this.track.dash++;
    this.prev.state = p.state;
    for (const e of events) {
      if (e.type === 'sfx') {
        if (e.name === 'guard_up') this.track.guard++;
        else if (e.name === 'dodge') this.track.dodge++;
      } else if (e.type === 'hit') {
        if (e.attacker === p && (e.result.kind === 'hit' || e.result.kind === 'guardBreak')) {
          this.track.hit++;
          if (e.move.id === 'counter') this.track.counter++;
        }
        if (e.target === p && e.result.kind === 'parry') this.track.parry++;
      }
    }
    for (const w of [...this.waiters]) {
      const ok = w.cond === 'combo' ? p.combo >= w.times : this.track[w.cond] - w.base >= w.times;
      if (ok) {
        this.waiters.splice(this.waiters.indexOf(w), 1);
        w.resolve();
      }
    }
  }

  // ---------- spawn ----------
  private difficulty(): Difficulty {
    const d = this.init0.diff;
    return (d && d in DIFFICULTY ? d : game.profile.difficulty) as Difficulty;
  }

  private spawn(def: SpawnDef): void {
    const e = enemyDef(def.enemy);
    const b = this.world.bounds;
    const y = def.y ?? this.rng.int(b.minY + 12, b.maxY - 8);
    const { fighter, brain } = spawnEnemy({
      enemy: def.enemy,
      world: this.world,
      director: this.director,
      diff: DIFFICULTY[this.difficulty()],
      x: def.side === 'left' ? -24 : LOGICAL_W + 24,
      y,
      from: def.side,
      rng: this.rng,
      slotIndex: ++this.seq,
      view: new SpriteView(this, e.charKey, e.tint),
      id: `e${this.seq}`,
    });
    this.enemyHpTotal += fighter.stats.maxHp;
    this.brains.set(fighter, brain);
    this.phasesDone.set(fighter, new Set());
  }

  private spawnAlly(enemy: string): Fighter {
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
    return fighter;
  }

  private enemies(): Fighter[] {
    return this.world.fighters.filter((f) => f.team === 'enemy' && !f.removed);
  }

  // ---------- loop ----------
  override update(_time: number, delta: number): void {
    if (this.finished) return;
    this.host.update(delta);
    if (this.pauseRequested) {
      this.pauseRequested = false;
      this.openPause();
      return;
    }
    // Dialog di tengah pertarungan membekukan dunia.
    this.world.paused = this.host.dialog.active && !this.cutsceneActive;
    if (debug.god && !this.player.dead) this.player.hp = this.player.stats.maxHp;

    const steps = this.world.advance(delta);
    this.director.tick(this.world.tickCount);
    if (this.fightStarted) for (let i = 0; i < steps; i++) this.spawnTick();
    const events = this.presenter.flush();
    this.handleEvents(events);
    this.updateTracking(events);
    this.screenFx.update(delta);
    this.checkPhases();
    for (const f of this.world.fighters) (f.view as SpriteView).updateStatus(f);
    this.updateRules(steps);
    this.updateHitboxOverlay();
    this.updatePickups();
    this.updateState();
    this.hud.update(this.hudState());
    if (this.targetTimer > 0) this.targetTimer--;
    this.marker?.setVisible(this.state === 'clear');
    this.markerText?.setVisible(this.state === 'clear' && Math.floor(this.time.now / 350) % 2 === 0);
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
      }
      if (
        this.screenDef.duet &&
        e.type === 'hit' &&
        e.attacker.team !== 'enemy' &&
        e.target.team === 'enemy' &&
        (e.result.kind === 'hit' || e.result.kind === 'guardBreak')
      ) {
        this.duetHits = Math.min(DUET_FULL_HITS, this.duetHits + 1);
      }
      if (e.type === 'hit' && e.result.ko && e.target.team === 'enemy') this.onEnemyDown(e.target);
      else if (e.type === 'koDone') {
        this.brains.get(e.fighter)?.release(e.fighter);
        this.brains.delete(e.fighter);
        this.phasesDone.delete(e.fighter);
        e.fighter.view.destroy();
      }
    }
  }

  /** Dorongan pemain saat meteran penuh: Arga ikut mendorong bersamaan, dengan efek layar duet. */
  private tryDuet(): void {
    const a = this.ally;
    if (!this.screenDef.duet || this.duetHits < DUET_FULL_HITS || !a || a.dead || a.removed || !a.canAct)
      return;
    this.duetHits = 0;
    const hp = a.hp; // dorongan sekutu tidak memakai HP
    a.startMove('push');
    a.hp = hp;
    a.tempHp = 0;
    a.tempHits = 0;
    this.screenFx.screen('kilat_dramatis');
    this.screenFx.screen('garis_fokus');
    this.fx.floatText('DUET PANJI', this.player.x, this.player.y - 70, 0xe8c860);
    audio.sfx('hit_special');
  }

  private onEnemyDown(f: Fighter): void {
    const def = f.enemyDef;
    this.director.forget(f.id);
    if (!def || this.screenDef.noMoney) return;
    const gain = this.rng.int(def.money[0], def.money[1]);
    if (gain > 0) {
      game.profile.money += gain;
      this.fx.floatText(`RP ${gain}`, f.x, f.y - 56, 0xe8c860);
      audio.sfx('money');
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

  private fightCleared(): boolean {
    return (
      this.duringFinished &&
      this.wave.exhausted &&
      this.extra.length === 0 &&
      this.world.aliveEnemies().length === 0
    );
  }

  private updateState(): void {
    if (this.state === 'fight') {
      if (this.player.state === 'ko') {
        this.state = 'over';
        this.time.delayedCall(900, () => this.finish(false));
        return;
      }
      if (!this.fightStarted || !this.fightCleared()) return;
      if (this.waveWaiter) {
        const r = this.waveWaiter;
        this.waveWaiter = null;
        r();
        return;
      }
      this.endDuring();
      if (this.screenDef.after && !this.init0.skipIntro) {
        this.state = 'outro';
        this.enterCutscene();
        void runCutscene(this.screenDef.after, this.host, this.ctl).then(() => {
          this.exitCutscene();
          this.openExit();
        });
      } else this.openExit();
    } else if (this.state === 'clear') {
      if (this.player.x >= EXIT_X && this.player.canAct) {
        this.state = 'exit';
        this.cameras.main.fadeOut(220, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.finish(true));
      }
    }
  }

  /** HP terbawa antar layar, buff makanan, dan lantai HP saat mengulang. */
  private applyCarryover(screen: ScreenDef): void {
    if (screen.practice) return;
    const prof = game.profile;
    const max = this.player.stats.maxHp;
    let hp = Math.min(max, prof.hp ?? max);
    if (this.init0.skipIntro) hp = Math.max(hp, Math.round(max * HP_FLOOR_RATIO));
    this.player.hp = hp;
    if (consumeBuffs(prof).kuat) this.player.status.kuat = KUAT_TICKS;
  }

  private buildPickups(screen: ScreenDef): void {
    for (const def of screen.pickups ?? []) {
      if (this.pickupTaken(def)) continue;
      const sprite = this.add
        .sprite(def.x, def.y, 'prop:07_CLASSROOM/buku_catatan')
        .setOrigin(0.5, 1)
        .setDepth(def.y - 1);
      const icon = this.add.sprite(def.x, def.y - 16, 'ui:penanda_misi', 0).setDepth(9500);
      icon.play('ui:penanda_misi:loop');
      this.pickups.push({ def, sprite, icon });
    }
  }

  private pickupTaken(def: PickupDef): boolean {
    return def.kind === 'buku'
      ? game.profile.flags[`item_${def.id}`] === true
      : game.profile.archives.includes(def.id);
  }

  private updatePickups(): void {
    const want = this.interactRequested;
    this.interactRequested = false;
    if (!want || this.cutsceneActive || this.pickups.length === 0 || this.state === 'over') return;
    const p = this.player;
    const hit = this.pickups.find((k) => Math.abs(k.def.x - p.x) <= 28 && Math.abs(k.def.y - p.y) <= 18);
    if (!hit) return;
    this.pickups.splice(this.pickups.indexOf(hit), 1);
    hit.sprite.destroy();
    hit.icon.destroy();
    audio.sfx('archive');
    if (hit.def.kind === 'buku') {
      game.profile.flags[`item_${hit.def.id}`] = true;
      this.fx.floatText('BUKU DIAMBIL', p.x, p.y - 62, 0x86e8a0);
    } else this.host.giveArchive(hit.def.id);
  }

  /** Aturan misi: batas waktu, batas terkena, kawalan harus selamat. */
  private updateRules(steps: number): void {
    if (this.state !== 'fight' || this.finished) return;
    const s = this.screenDef;
    if (Number.isFinite(this.timeLeft) && this.fightStarted) {
      this.timeLeft -= steps;
      if (this.timeLeft <= 0) return this.failRule('waktu');
    }
    if (s.maxHits !== undefined && this.world.stats.hitsTaken > s.maxHits) return this.failRule('terkena');
    if (this.escortFighter && (this.escortFighter.dead || this.escortFighter.removed))
      this.failRule('kawalan');
  }

  private failRule(reason: 'waktu' | 'terkena' | 'kawalan'): void {
    if (this.state === 'over') return;
    this.state = 'over';
    this.time.delayedCall(500, () => this.finish(false, reason));
  }

  /** Arena bersih: hentikan skrip tutorial dan bebaskan penantiannya. */
  private endDuring(): void {
    this.duringCtl.cancelled = true;
    this.host.hintOff();
    for (const w of this.waiters.splice(0)) w.resolve();
  }

  private openExit(): void {
    if (this.ctl.cancelled) return;
    this.state = 'clear';
    this.marker = this.add.sprite(LOGICAL_W - 22, 205, 'ui:penanda_tujuan', 0).setDepth(19500);
    this.marker.play('ui:penanda_tujuan:loop');
    this.markerText = new PixelText(this, LOGICAL_W - 22, 184, 'LANJUT', {
      color: 0xf6f7fa,
      origin: 0.5,
      align: 'center',
    }).setDepth(19500);
  }

  // ---------- selesai ----------
  private finish(win: boolean, failReason?: StageResult['failReason']): void {
    if (this.finished) return;
    this.finished = true;
    this.ctl.cancelled = true;
    this.duringCtl.cancelled = true;
    const stats = { ...this.world.stats };
    const seconds = stats.ticks / 60;
    const hpMax = this.player.stats.maxHp;
    const hpLeft = Math.max(0, Math.ceil(this.player.hp));
    const fought = this.screenDef.spawns.length > 0;
    const score =
      win && fought
        ? scoreOf({
            damageDealt: stats.damageDealt,
            enemyHpTotal: this.enemyHpTotal,
            maxCombo: stats.maxCombo,
            seconds,
            parSeconds: parSecondsFor(this.screenDef.spawns.length),
            hpRatio: hpLeft / hpMax,
            hitsTaken: stats.hitsTaken,
          })
        : 0;
    const result: StageResult = {
      win,
      screenId: this.screenDef.id,
      label: this.screenDef.label ?? stageLabel(this.screenDef.stage),
      stats,
      hpLeft,
      hpMax,
      seconds,
      score,
      rank: rankOf(score),
      failReason,
    };
    if (win && !this.screenDef.practice) {
      game.profile.hp = Math.min(hpMax, hpLeft + Math.round(hpMax * HP_REGEN_RATIO));
    }
    (window as unknown as { __stageResult?: StageResult }).__stageResult = result;
    this.cameras.main.resetFX();
    if (this.init0.onDone) this.init0.onDone(result, this);
    else this.debugDone(result);
  }

  private quit(): void {
    if (this.init0.onQuit) this.init0.onQuit(this);
    else this.scene.start(this.scene.get('DebugMenu') ? 'DebugMenu' : 'Boot');
  }

  /** Tanpa alur cerita (alat dev): tampilkan Hasil / Game Over lalu kembali ke menu debug. */
  private debugDone(r: StageResult): void {
    const retry = () => this.scene.start('Stage', this.init0);
    if (r.win) {
      this.scene.start('Result', {
        title: 'UJI',
        rows: [
          {
            label: r.label,
            score: r.score,
            rank: r.rank,
            damage: r.stats.damageDealt,
            combo: r.stats.maxCombo,
            seconds: r.seconds,
          },
        ],
        money: game.profile.money,
        onContinue: () => this.quit(),
        onRetry: retry,
      });
    } else this.scene.start('GameOver', { onRetry: retry, onQuit: () => this.quit() });
  }

  /** Dipanggil saat tab kehilangan fokus: buka menu jeda bila sedang bermain. */
  requestPause(): void {
    if (!this.finished && this.state !== 'over' && !this.scene.isPaused()) this.pauseRequested = true;
  }

  /** Build dev: F3 menampilkan FPS dan jumlah petarung (CLAUDE.md §14). */
  private setupFpsOverlay(): void {
    this.fpsText = new PixelText(this, LOGICAL_W - 4, 24, '', { color: 0xe8c860, origin: 1 })
      .setOrigin(1, 0)
      .setDepth(20000)
      .setVisible(false);
    this.input.keyboard?.on('keydown-F3', () => this.fpsText?.setVisible(!this.fpsText.visible));
    const tick = (): void => {
      if (this.fpsText?.visible)
        this.fpsText.setText(
          `FPS ${Math.round(this.game.loop.actualFps)}  PETARUNG ${this.world.fighters.length}`,
        );
    };
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, tick);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, tick),
    );
  }

  private updateHitboxOverlay(): void {
    const on = settings.current.showHitbox;
    if (on) drawHitboxes(this.hitboxGfx as Phaser.GameObjects.Graphics, this.world.fighters);
    else if (this.hitboxShown) this.hitboxGfx?.clear();
    this.hitboxShown = on;
  }

  private openPause(): void {
    this.scene.launch('Pause', {
      parent: 'Stage',
      onRestart: () => this.scene.restart(this.init0),
      onQuit: () => this.quit(),
      onSettings: () => {
        this.scene.launch('Settings', { from: 'Pause', overlay: true });
        this.scene.pause('Pause');
      },
    });
    this.scene.pause();
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
      name: this.screenDef.playerName ?? characterName(p.charKey),
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
      extra: this.extraText(),
    };
  }

  private extraText(): string {
    const s = this.screenDef;
    const parts: string[] = [];
    if (Number.isFinite(this.timeLeft)) {
      const sec = Math.max(0, Math.ceil(this.timeLeft / 60));
      parts.push(`WAKTU ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`);
    }
    if (s.maxHits !== undefined)
      parts.push(`KENA ${Math.min(this.world.stats.hitsTaken, s.maxHits + 1)}/${s.maxHits}`);
    if (s.duet)
      parts.push(
        this.duetHits >= DUET_FULL_HITS
          ? 'DUET PANJI SIAP: J DAN K'
          : `DUET ${this.duetHits}/${DUET_FULL_HITS}`,
      );
    if (this.escortFighter) parts.push(`KAWAL ${Math.max(0, Math.ceil(this.escortFighter.hp))}`);
    return parts.join('  ');
  }

  private hudTarget(): HudTarget | null {
    const boss = this.enemies().find((f) => f.enemyDef?.boss && !f.dead);
    const t = this.targetTimer > 0 && this.target && !this.target.removed ? this.target : boss;
    const def = t?.enemyDef;
    if (!t || !def) return null;
    return { name: def.name, school: def.school, ratio: Math.max(0, t.hp / t.stats.maxHp), boss: !!def.boss };
  }

  /** Apakah sedang cutscene (dipakai test dan alat dev). */
  get inCutscene(): boolean {
    return this.cutsceneActive;
  }
}
