// Simulasi satu petarung (murni, tanpa Phaser). Tampilan dipasang lewat FighterView.
import { BUFFER_TICKS, COMBO_GAP_TICKS, ComboBuffer } from '../combat/ComboBuffer';
import type { BufferedAction } from '../combat/ComboBuffer';
import { SPECIAL_HP_COST, SPECIAL_RECOVER_HITS, calcDamage } from '../combat/Damage';
import type { HitResult, WorldEvent } from '../combat/events';
import { FighterStateMachine } from '../combat/FighterStateMachine';
import { TICKS_PER_FRAME } from '../config';
import { ANIM, isLoopingAnim } from '../data/animMap';
import { charAnimFrames } from '../data/assetIndex';
import {
  FRAME_DATA,
  HURTBOX,
  animTicks,
  isActiveFrame,
  isInvulnFrame,
  isParryFrame,
} from '../data/frameData';
import type { Box } from '../data/frameData';
import { COMBO_CHAIN, MOVES } from '../data/moves';
import type { MoveDef, MoveId } from '../data/moves';
import * as T from '../data/tuning';
import { clamp, sign } from '../util/math';
import type { Rect } from '../util/math';
import type { Rng } from '../util/rng';
import type { EnemyDef } from '../data/enemies';

export type Team = 'player' | 'enemy' | 'ally';

/** Antarmuka tampilan minimal. Test memakai NullView; game memakai FighterView (Phaser). */
export interface FighterView {
  setFrame(sheetFrame: number): void;
  setPos(x: number, y: number): void;
  setFlipX(flip: boolean): void;
  setAlpha(alpha: number): void;
  setFlash(on: boolean): void;
  destroy(): void;
}

export const NullView: FighterView = {
  setFrame: () => undefined,
  setPos: () => undefined,
  setFlipX: () => undefined,
  setAlpha: () => undefined,
  setFlash: () => undefined,
  destroy: () => undefined,
};

export interface FighterStats {
  maxHp: number;
  maxStamina: number;
  power: number; // pengali damage keluar
  defense: number; // poin Ketahanan
  speed: number; // pengali kecepatan jalan
}

export interface Unlocks {
  badan: boolean;
  dash: boolean;
  push: boolean;
  counter: boolean;
  doubleFinisher: boolean;
}
export const ALL_UNLOCKED: Unlocks = {
  badan: true,
  dash: true,
  push: true,
  counter: true,
  doubleFinisher: false,
};
export const NO_UNLOCKS: Unlocks = {
  badan: false,
  dash: false,
  push: false,
  counter: false,
  doubleFinisher: false,
};

export interface Intent {
  moveX: -1 | 0 | 1;
  moveY: -1 | 0 | 1;
  guardHeld: boolean;
  heavyHeld: boolean;
  dashPressed: boolean;
  /** Arah hadap yang diminta saat diam (AI menghadap lawan). */
  face?: 1 | -1;
  /** Tekanan tombol (tepi) pada tick ini. */
  presses: readonly BufferedAction[];
}
export const IDLE_INTENT: Intent = {
  moveX: 0,
  moveY: 0,
  guardHeld: false,
  heavyHeld: false,
  dashPressed: false,
  presses: [],
};

export interface FighterHost {
  emit(e: WorldEvent): void;
  bounds: T.Bounds;
  rng: Rng;
}

export interface FighterConfig {
  id: string;
  team: Team;
  charKey: string;
  x: number;
  y: number;
  facing?: 1 | -1;
  stats: FighterStats;
  unlocks?: Unlocks;
  view?: FighterView;
  host: FighterHost;
  koBehavior?: 'leave' | 'stay';
  isBoss?: boolean;
}

interface AnimState {
  name: string;
  frames: readonly number[];
  tick: number;
  loop: boolean;
  start: number;
  facing: 1 | -1;
}

type KoPhase = 'none' | 'rising' | 'leaving';

const MISS: HitResult = { kind: 'miss', damage: 0, knockdown: false, ko: false };
const MIN_BLOCK_TICKS = 12;
const PARRY_REARM_TICKS = 20;
const FALLBACK_ANIM = ANIM.idle;

export class Fighter {
  readonly id: string;
  readonly team: Team;
  readonly charKey: string;
  readonly sm = new FighterStateMachine();
  readonly buffer = new ComboBuffer();
  readonly hitSet = new Set<Fighter>();
  readonly host: FighterHost;
  readonly koBehavior: 'leave' | 'stay';
  readonly isBoss: boolean;
  view: FighterView;
  stats: FighterStats;
  unlocks: Unlocks;

  x: number;
  y: number;
  facing: 1 | -1;
  vx = 0;
  hp: number;
  tempHp = 0;
  tempHits = 0;
  stamina: number;
  tick = 0;
  alpha = 1;
  flashTicks = 0;
  invulnTicks = 0;
  removed = false;
  /** Arah masuk dari luar layar (1 = ke kanan, -1 = ke kiri); 0 = sudah di dalam arena. */
  entering: -1 | 0 | 1 = 0;
  /** Data musuh (nama, uang, fase) bila ini musuh. */
  enemyDef?: EnemyDef;

  move: MoveDef | null = null;
  charged = false;
  chargeTicks = 0;
  chainIdx = 0;
  combo = 0;
  comboTimer = 0;
  koPhase: KoPhase = 'none';
  status = { kuat: 0, marah: false, bertahan: 0 };

  private anim: AnimState = { name: '', frames: [0], tick: 0, loop: false, start: 0, facing: 1 };
  private rootApplied = true;
  private frozen = false;
  private lastAttackEnd = -9999;
  private lastStaminaUse = -9999;
  private lastBlockEnd = -9999;
  private lastDashTick = -9999;
  private hitstunLeft = 0;
  private downLeft = 0;
  private settling = false;
  private afterDodgeUntil = 0;
  private parryEligible = false;
  private sideDir: -1 | 1 = 1;
  private cutsceneLock = false;

  constructor(cfg: FighterConfig) {
    this.id = cfg.id;
    this.team = cfg.team;
    this.charKey = cfg.charKey;
    this.host = cfg.host;
    this.x = cfg.x;
    this.y = cfg.y;
    this.facing = cfg.facing ?? (cfg.team === 'enemy' ? -1 : 1);
    this.stats = cfg.stats;
    this.unlocks = cfg.unlocks ?? ALL_UNLOCKED;
    this.view = cfg.view ?? NullView;
    this.koBehavior = cfg.koBehavior ?? (cfg.team === 'enemy' ? 'leave' : 'stay');
    this.isBoss = cfg.isBoss ?? false;
    this.hp = cfg.stats.maxHp;
    this.stamina = cfg.stats.maxStamina;
    this.play(ANIM.idle, { loop: true, restart: true });
    this.syncView();
  }

  // ---------- kueri ----------
  get state() {
    return this.sm.state;
  }
  get dead(): boolean {
    return this.hp <= 0;
  }
  get animName(): string {
    return this.anim.name;
  }
  /** Frame animasi (relatif terhadap awal animasi) yang sedang tampil. */
  get animFrame(): number {
    const n = this.anim.frames.length;
    const raw = this.anim.start + Math.floor(this.anim.tick / TICKS_PER_FRAME);
    return this.anim.loop ? raw % n : Math.min(n - 1, raw);
  }
  get animTick(): number {
    return this.anim.tick;
  }
  get animDone(): boolean {
    return (
      !this.anim.loop &&
      this.anim.start + Math.floor(this.anim.tick / TICKS_PER_FRAME) >= this.anim.frames.length
    );
  }
  get tired(): boolean {
    return this.stamina < T.STAMINA_TIRED_BELOW;
  }
  get canAct(): boolean {
    return this.sm.is('idle', 'walk');
  }

  isInvulnerable(): boolean {
    if (this.invulnTicks > 0 || this.entering !== 0) return true;
    if (this.sm.is('knockback', 'down', 'getup', 'ko', 'cutscene')) return true;
    return isInvulnFrame(this.anim.name, this.animFrame) && this.sm.is('counter', 'dodge');
  }

  worldBox(b: Box): Rect {
    return { x: this.facing > 0 ? this.x + b.x : this.x - (b.x + b.w), y: this.y + b.y, w: b.w, h: b.h };
  }
  hurtbox(): Rect {
    return this.worldBox(HURTBOX);
  }

  activeHit(): { rect: Rect; move: MoveDef; charged: boolean } | null {
    if (!this.move || !this.sm.is('attack', 'counter')) return null;
    const box = FRAME_DATA[this.move.anim]?.hitbox;
    if (!box || !isActiveFrame(this.move.anim, this.animFrame)) return null;
    return { rect: this.worldBox(box), move: this.move, charged: this.charged };
  }

  attackBuff(): number {
    return (this.status.kuat > 0 ? T.KUAT_MULT : 1) * (this.status.marah ? T.MARAH_MULT : 1);
  }
  defendBuff(): number {
    return this.status.bertahan > 0 ? T.BERTAHAN_MULT : 1;
  }

  // ---------- langkah utama ----------
  step(intent: Intent): void {
    this.tick++;
    this.sm.advance();
    this.feedBuffer(intent);
    this.tickTimers();
    switch (this.sm.state) {
      case 'idle':
      case 'walk':
        this.stepFree(intent);
        break;
      case 'attack':
        this.stepAttack(intent);
        break;
      case 'block':
        this.stepBlock(intent);
        break;
      case 'parry':
        this.stepParry(intent);
        break;
      case 'counter':
        if (this.animDone) this.finishToIdle();
        break;
      case 'dodge':
        this.stepDodge(intent);
        break;
      case 'dash':
        this.stepDash(intent);
        break;
      case 'hitstun':
        this.stepHitstun();
        break;
      case 'knockback':
        this.stepKnockback();
        break;
      case 'down':
        this.stepDown();
        break;
      case 'getup':
        if (this.animDone) this.finishToIdle(false);
        break;
      case 'dizzy':
        this.stepDizzy();
        break;
      case 'ko':
        this.stepKo();
        break;
      case 'cutscene':
        break;
    }
    this.applyVelocity();
    if (this.entering !== 0) this.stepEntering();
    else this.clampToBounds();
    this.advanceAnim();
    this.syncView();
  }

  private feedBuffer(intent: Intent): void {
    const ttl = this.sm.state === 'attack' ? this.ticksUntilCancel() + BUFFER_TICKS : BUFFER_TICKS;
    for (const p of intent.presses) {
      this.buffer.push(p, this.tick, p === 'guard' ? BUFFER_TICKS : ttl);
    }
  }

  private ticksUntilCancel(): number {
    const cancel = this.move ? FRAME_DATA[this.move.anim]?.cancelFrom : undefined;
    if (cancel === undefined) return 0;
    return Math.max(0, cancel * TICKS_PER_FRAME - this.anim.tick);
  }

  private tickTimers(): void {
    if (this.flashTicks > 0) this.flashTicks--;
    if (this.invulnTicks > 0) this.invulnTicks--;
    if (this.status.kuat > 0) this.status.kuat--;
    if (this.status.bertahan > 0) this.status.bertahan--;
    if (this.comboTimer > 0 && --this.comboTimer === 0) this.combo = 0;
    if (this.tick - this.lastStaminaUse >= T.STAMINA_REGEN_DELAY && !this.sm.is('block', 'parry')) {
      this.stamina = Math.min(this.stats.maxStamina, this.stamina + T.STAMINA_REGEN);
    }
  }

  private spendStamina(amount: number): void {
    this.stamina = Math.max(0, this.stamina - amount);
    this.lastStaminaUse = this.tick;
  }

  // ---------- state: idle/walk ----------
  private stepFree(intent: Intent): void {
    if (this.tryStartAction(intent)) return;
    const moving = intent.moveX !== 0 || intent.moveY !== 0;
    if (moving) {
      this.settling = false;
      this.sm.go('walk', 'move');
      this.play(ANIM.walk, { loop: true });
      if (intent.face) this.facing = intent.face;
      else if (intent.moveX !== 0) this.facing = intent.moveX;
      const sp = T.WALK_SPEED * this.stats.speed;
      this.x += intent.moveX * sp;
      this.y += intent.moveY * T.DEPTH_SPEED * this.stats.speed;
      return;
    }
    if (intent.face) this.facing = intent.face;
    this.sm.go('idle', 'stop');
    if (this.settling) {
      if (this.animDone) this.settling = false;
      return;
    }
    this.play(this.tick < this.afterDodgeUntil ? ANIM.afterDodge : ANIM.idle, { loop: true });
  }

  /** Mencoba memulai aksi dari buffer/intent. Mengembalikan true bila state berubah. */
  private tryStartAction(intent: Intent): boolean {
    const now = this.tick;
    if (intent.dashPressed && this.unlocks.dash && this.sm.is('idle', 'walk')) {
      this.startDash();
      return true;
    }
    if (this.unlocks.push && this.hp > SPECIAL_HP_COST && this.buffer.consume(now, (a) => a === 'special')) {
      this.startMove('push');
      return true;
    }
    if (this.stamina >= T.STAMINA_DODGE && this.buffer.consume(now, (a) => a === 'dodge')) {
      this.startDodge(intent);
      return true;
    }
    if (this.buffer.consume(now, (a) => a === 'guard') || (intent.guardHeld && this.sm.is('idle', 'walk'))) {
      this.startBlock();
      return true;
    }
    if (this.buffer.consume(now, (a) => a === 'heavy')) {
      this.startMove('heavy');
      return true;
    }
    if (this.unlocks.badan && this.buffer.consume(now, (a) => a === 'back-light')) {
      this.startMove('bodyBlow');
      return true;
    }
    if (this.buffer.consume(now, (a) => a === 'light' || a === 'back-light')) {
      this.startMove(this.nextChainMove());
      return true;
    }
    return false;
  }

  private chain(): readonly MoveId[] {
    return this.unlocks.doubleFinisher ? [...COMBO_CHAIN, 'heavy'] : COMBO_CHAIN;
  }

  private nextChainMove(): MoveId {
    if (this.tick - this.lastDashTick <= T.DASH_ATTACK_WINDOW && this.chainIdx === 0) return 'dashStraight';
    const chain = this.chain();
    if (this.sm.state !== 'attack' && this.tick - this.lastAttackEnd > COMBO_GAP_TICKS) this.chainIdx = 0;
    const id = chain[this.chainIdx % chain.length] as MoveId;
    this.chainIdx = (this.chainIdx + 1) % chain.length;
    return id;
  }

  // ---------- serangan ----------
  startMove(id: MoveId): void {
    const move = MOVES[id];
    this.commitDrift();
    this.move = move;
    this.hitSet.clear();
    this.charged = false;
    this.chargeTicks = 0;
    this.frozen = false;
    if (id === 'push') this.spendHpForSpecial();
    if (!this.sm.go('attack', id)) this.sm.force('attack', id);
    this.play(move.anim, { loop: false, restart: true });
    this.host.emit({ type: 'sfx', name: id === 'heavy' || id === 'push' ? 'swing_heavy' : 'swing' });
  }

  private spendHpForSpecial(): void {
    this.hp -= SPECIAL_HP_COST;
    this.tempHp = SPECIAL_HP_COST;
    this.tempHits = SPECIAL_RECOVER_HITS;
  }

  private stepAttack(intent: Intent): void {
    const move = this.move;
    if (!move) {
      this.finishToIdle();
      return;
    }
    const frame = this.animFrame;
    if (move.id === 'dashStraight' && this.sm.stateTick <= T.DASH_CARRY_TICKS) {
      this.x += this.facing * T.DASH_SPEED * (1 - this.sm.stateTick / T.DASH_CARRY_TICKS);
    }
    // Chord J+K tiba sedikit setelah salah satu tombol: Dorongan Semangat boleh memotong startup awal.
    if (
      move.id !== 'push' &&
      frame < 3 &&
      this.unlocks.push &&
      this.hp > SPECIAL_HP_COST &&
      this.buffer.consume(this.tick, (x) => x === 'special')
    ) {
      this.startMove('push');
      return;
    }
    // Pukulan berat: tahan tombol di akhir wind-up untuk versi bertenaga.
    if (
      move.id === 'heavy' &&
      frame >= T.CHARGE_FREEZE_FRAME &&
      frame < (FRAME_DATA[move.anim]?.active?.[0] ?? 99)
    ) {
      if (intent.heavyHeld && this.chargeTicks < T.CHARGE_MAX_TICKS) {
        this.frozen = true;
        this.chargeTicks++;
        if (this.chargeTicks === T.CHARGE_MIN_TICKS) {
          this.host.emit({ type: 'fx', name: 'aksen_energi_biru', x: this.x, y: this.y - 52, flip: false });
          this.host.emit({ type: 'sfx', name: 'charge_ready' });
        }
        return;
      }
      if (this.frozen) {
        this.frozen = false;
        this.charged = this.chargeTicks >= T.CHARGE_MIN_TICKS;
      }
    }
    // Memutus ke serangan lanjutan.
    const timing = FRAME_DATA[move.anim];
    if (timing?.cancelFrom !== undefined && frame >= timing.cancelFrom) {
      const next = this.buffer.consume(
        this.tick,
        (a) => a === 'light' || a === 'heavy' || a === 'back-light',
      );
      if (next) {
        this.lastAttackEnd = this.tick;
        this.startMove(next === 'heavy' ? 'heavy' : this.nextChainMove());
        return;
      }
    }
    if (this.animDone) this.finishToIdle();
  }

  private finishToIdle(commit = true): void {
    if (commit) this.applyRoot();
    this.lastAttackEnd = this.tick;
    this.move = null;
    this.charged = false;
    this.frozen = false;
    this.sm.enter('idle', 'anim-end');
    this.settling = false;
    this.play(ANIM.idle, { loop: true });
  }

  // ---------- block / parry ----------
  private startBlock(): void {
    this.commitDrift();
    this.sm.go('block', 'guard');
    this.parryEligible = this.tick - this.lastBlockEnd >= PARRY_REARM_TICKS;
    this.play(ANIM.guardHold, { loop: true, restart: true });
    this.host.emit({ type: 'sfx', name: 'guard_up' });
  }

  private stepBlock(intent: Intent): void {
    this.spendStamina(T.STAMINA_BLOCK_DRAIN);
    if (this.stamina <= 0) {
      this.enterDizzy();
      return;
    }
    if (this.anim.name === ANIM.guardHit && this.animDone) this.play(ANIM.guardHold, { loop: true });
    if (this.stamina >= T.STAMINA_DODGE && this.buffer.consume(this.tick, (a) => a === 'dodge')) {
      this.lastBlockEnd = this.tick;
      this.startDodge(intent);
      return;
    }
    if (intent.moveX !== 0) this.facing = intent.moveX;
    if (!intent.guardHeld && this.sm.stateTick >= MIN_BLOCK_TICKS) {
      this.lastBlockEnd = this.tick;
      this.sm.go('idle', 'guard-release');
      this.play(ANIM.idle, { loop: true });
    }
  }

  private enterParry(): void {
    this.sm.enter('parry', 'parry');
    this.play(ANIM.parry, { loop: false, restart: true, start: 2 });
  }

  private stepParry(intent: Intent): void {
    const counterOk = this.unlocks.counter && this.sm.stateTick <= T.COUNTER_WINDOW_TICKS;
    if (
      counterOk &&
      this.buffer.consume(this.tick, (a) => a === 'light' || a === 'special' || a === 'heavy')
    ) {
      this.startCounter();
      return;
    }
    if (this.animDone) {
      if (intent.guardHeld) {
        this.sm.go('block', 'parry-end');
        this.parryEligible = false;
        this.play(ANIM.guardHold, { loop: true, restart: true });
      } else this.finishToIdle(false);
    }
  }

  private startCounter(): void {
    this.move = MOVES.counter;
    this.hitSet.clear();
    this.charged = false;
    this.sm.go('counter', 'counter');
    this.play(MOVES.counter.anim, { loop: false, restart: true });
    this.host.emit({ type: 'sfx', name: 'swing_heavy' });
  }

  // ---------- dodge / dash ----------
  private startDodge(intent: Intent): void {
    this.commitDrift();
    this.spendStamina(T.STAMINA_DODGE);
    const side = intent.moveY !== 0;
    this.sideDir = intent.moveY === 0 ? 1 : intent.moveY;
    if (!this.sm.go('dodge', side ? 'side' : 'back')) this.sm.force('dodge', side ? 'side' : 'back');
    this.play(side ? ANIM.dodgeSide : ANIM.dodgeBack, { loop: false, restart: true });
    this.host.emit({ type: 'sfx', name: 'dodge' });
  }

  private stepDodge(intent: Intent): void {
    const timing = FRAME_DATA[this.anim.name];
    const frame = this.animFrame;
    if (this.anim.name === ANIM.dodgeSide && timing?.depthShift && frame >= 1 && frame <= 6) {
      this.y += (this.sideDir * timing.depthShift) / (6 * TICKS_PER_FRAME);
    }
    // Setelah frame kebal habis, boleh langsung membalas atau bertahan.
    if (frame >= (timing?.invuln?.[1] ?? 6) + 1) {
      if (this.tryStartAction({ ...intent, dashPressed: false })) return;
    }
    if (this.animDone) {
      this.applyRoot();
      this.afterDodgeUntil = this.tick + T.AFTER_DODGE_IDLE_TICKS;
      this.sm.go('idle', 'dodge-end');
      this.play(ANIM.afterDodge, { loop: true });
    }
  }

  private startDash(): void {
    this.commitDrift();
    this.lastDashTick = this.tick;
    this.chainIdx = 0;
    this.sm.go('dash', 'dash');
    this.play(ANIM.dash, { loop: false, restart: true });
    this.host.emit({ type: 'sfx', name: 'dash' });
    this.host.emit({
      type: 'fx',
      name: 'jejak_debu',
      x: this.x - this.facing * 8,
      y: this.y - 8,
      flip: this.facing < 0,
    });
  }

  private stepDash(_intent: Intent): void {
    if (this.sm.stateTick <= T.DASH_MOVE_TICKS) this.x += this.facing * T.DASH_SPEED;
    if (this.buffer.consume(this.tick, (a) => a === 'light' || a === 'heavy')) {
      this.startMove('dashStraight');
      return;
    }
    if (this.animDone) {
      this.applyRoot();
      this.sm.go('idle', 'dash-end');
      this.play(ANIM.idle, { loop: true });
    }
  }

  // ---------- menerima serangan ----------
  receiveHit(attacker: Fighter, move: MoveDef, charged: boolean): HitResult {
    if (this.isInvulnerable() || this.removed || this.sm.is('ko', 'cutscene')) return MISS;
    const dx = attacker.x - this.x;
    const inFront = !move.radial && (Math.abs(dx) < 4 || sign(dx) === this.facing);
    if (inFront && this.sm.is('block', 'parry')) {
      if (this.canParry()) {
        this.enterParry();
        attacker.staggerFromParry(this);
        return { kind: 'parry', damage: 0, knockdown: false, ko: false };
      }
      if (move.breaker) {
        this.enterDizzy();
        this.stamina = 0;
        return { kind: 'guardBreak', damage: 0, knockdown: false, ko: false };
      }
      return this.takeBlocked(attacker, move, charged);
    }
    return this.takeHit(attacker, move, charged);
  }

  private canParry(): boolean {
    if (this.sm.state === 'block') return this.parryEligible && this.sm.stateTick <= T.PARRY_WINDOW_TICKS;
    return this.sm.state === 'parry' && isParryFrame(this.anim.name, this.animFrame);
  }

  private takeBlocked(attacker: Fighter, move: MoveDef, charged: boolean): HitResult {
    const dmg = calcDamage({
      base: move.damage,
      attackerPower: attacker.stats.power,
      attackerBuff: attacker.attackBuff(),
      defense: this.stats.defense,
      defenderBuff: this.defendBuff(),
      blocked: true,
      charged,
    });
    this.hp = Math.max(1, this.hp - dmg);
    this.spendStamina(T.STAMINA_BLOCK_HIT);
    this.vx = -this.facing * 1.4;
    this.play(ANIM.guardHit, { loop: false, restart: true });
    this.flashTicks = 0;
    if (this.stamina <= 0) {
      this.enterDizzy();
      return { kind: 'guardBreak', damage: dmg, knockdown: false, ko: false };
    }
    return { kind: 'block', damage: dmg, knockdown: false, ko: false };
  }

  private takeHit(attacker: Fighter, move: MoveDef, charged: boolean): HitResult {
    const dmg = calcDamage({
      base: move.damage,
      attackerPower: attacker.stats.power,
      attackerBuff: attacker.attackBuff(),
      defense: this.stats.defense,
      defenderBuff: this.defendBuff(),
      blocked: false,
      charged,
    });
    this.hp = Math.max(0, this.hp - dmg);
    this.tempHp = 0;
    this.tempHits = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.flashTicks = T.FLASH_TICKS;
    this.chainIdx = 0;
    const ko = this.hp <= 0;
    const knockdown = ko || move.reaction === 'knockdown';
    if (knockdown) this.startKnockdown(attacker, (move.knockback || 2.2) * (charged ? 1.2 : 1));
    else this.startStagger(attacker, move.hitstunTicks);
    return { kind: 'hit', damage: dmg, knockdown, ko };
  }

  /** Dipanggil saat serangan penyerang berhasil ditangkis. */
  staggerFromParry(by: Fighter): void {
    this.startStagger(by, T.PARRY_STAGGER_TICKS);
  }

  private startStagger(from: Fighter, ticks: number): void {
    const again = this.sm.state === 'hitstun';
    if (!again) this.commitDrift();
    this.cancelMove();
    this.facing = from.x >= this.x ? 1 : -1;
    this.hitstunLeft = ticks;
    this.vx = again ? 0 : -this.facing * 0.35;
    if (!this.sm.go('hitstun', 'hit')) this.sm.force('hitstun', 'hit');
    // Hit beruntun: lanjut dari frame 2 (pergeseran sprite sudah ±6 px) agar tidak meloncat.
    this.play(ANIM.hitstun, { loop: false, restart: true, start: again ? 2 : 0, keepDrift: again });
    this.settling = false;
  }

  private startKnockdown(from: Fighter, speed: number): void {
    this.commitDrift();
    this.cancelMove();
    this.facing = from.x >= this.x ? 1 : -1;
    this.vx = -this.facing * speed;
    this.sm.force('knockback', 'knockdown');
    this.play(ANIM.knockback, { loop: false, restart: true });
  }

  private cancelMove(): void {
    this.move = null;
    this.charged = false;
    this.frozen = false;
    this.chargeTicks = 0;
  }

  private enterDizzy(): void {
    this.cancelMove();
    this.sm.enter('dizzy', 'guard-break');
    this.play(ANIM.dizzy, { loop: true, restart: true });
    this.host.emit({ type: 'sfx', name: 'guard_break' });
    this.host.emit({ type: 'fx', name: 'impact_lingkaran', x: this.x, y: this.y - 30, flip: false });
  }

  // ---------- reaksi ----------
  private stepHitstun(): void {
    this.vx *= T.HITSTUN_SLIDE;
    if (--this.hitstunLeft <= 0) {
      this.applyRoot();
      this.sm.go('idle', 'recover');
      this.settling = true;
      this.play(ANIM.afterHit, { loop: false, restart: true });
    }
  }

  private stepKnockback(): void {
    this.vx *= T.KNOCKBACK_DECAY;
    if (!this.animDone) return;
    this.applyRoot();
    this.sm.go('down', 'landed');
    this.downLeft = this.host.rng.int(T.DOWN_TICKS_MIN, T.DOWN_TICKS_MAX);
    this.play(ANIM.down, { loop: false, restart: true });
    this.host.emit({ type: 'fx', name: 'dampak_tanah', x: this.x, y: this.y - 8, flip: false });
    this.host.emit({ type: 'sfx', name: 'land' });
  }

  private stepDown(): void {
    this.vx *= T.KNOCKBACK_DECAY;
    if (this.sm.stateTick < animTicks(ANIM.down) + this.downLeft) return;
    if (this.dead) {
      this.sm.go('ko', 'defeated');
      this.host.emit({ type: 'ko', fighter: this });
      if (this.koBehavior === 'leave') {
        this.koPhase = 'rising';
        this.play(ANIM.getup, { loop: false, restart: true });
      }
      return;
    }
    this.sm.go('getup', 'getup');
    this.play(ANIM.getup, { loop: false, restart: true });
  }

  private stepDizzy(): void {
    if (this.sm.stateTick >= T.DIZZY_TICKS) {
      this.sm.go('idle', 'dizzy-end');
      this.settling = true;
      this.play(ANIM.recover, { loop: false, restart: true });
    }
  }

  private stepKo(): void {
    if (this.koBehavior === 'stay') return;
    if (this.koPhase === 'rising') {
      if (this.animDone) {
        this.koPhase = 'leaving';
        this.facing = this.x < (this.host.bounds.minX + this.host.bounds.maxX) / 2 ? -1 : 1;
        this.play(ANIM.leave, { loop: true, restart: true });
        this.sm.stateTick = 0;
      }
    } else if (this.koPhase === 'leaving') {
      this.x += this.facing * T.ENEMY_LEAVE_SPEED;
      this.alpha = Math.max(0, 1 - this.sm.stateTick / T.ENEMY_LEAVE_FADE_TICKS);
      if (this.alpha <= 0) {
        this.removed = true;
        this.host.emit({ type: 'koDone', fighter: this });
      }
    }
  }

  // ---------- hasil mendaratkan serangan ----------
  onHitLanded(result: HitResult): void {
    if (result.kind === 'miss') return;
    if (result.kind === 'hit' || result.kind === 'guardBreak') {
      this.combo++;
      this.comboTimer = 90;
    }
    if (result.kind === 'hit' && this.tempHp > 0 && --this.tempHits <= 0) {
      this.hp = Math.min(this.stats.maxHp, this.hp + this.tempHp);
      this.tempHp = 0;
      this.host.emit({ type: 'text', text: 'PULIH', x: this.x, y: this.y - 60, color: 0x86e8a0 });
    }
  }

  // ---------- kontrol luar (cutscene, spawn) ----------
  enterCutscene(): void {
    this.cancelMove();
    this.sm.force('cutscene', 'cutscene');
    this.cutsceneLock = true;
    this.vx = 0;
  }
  exitCutscene(): void {
    this.cutsceneLock = false;
    this.sm.force('idle', 'cutscene-end');
    this.play(ANIM.idle, { loop: true, restart: true });
  }
  get inCutscene(): boolean {
    return this.cutsceneLock;
  }
  setSpawnInvuln(): void {
    this.invulnTicks = T.SPAWN_INVULN_TICKS;
  }
  /** Putar animasi bebas (dipakai cutscene dan kemenangan). */
  playFree(name: string, loop: boolean): void {
    this.play(name, { loop, restart: true });
  }

  // ---------- animasi ----------
  play(
    name: string,
    opts: { loop?: boolean; restart?: boolean; start?: number; keepDrift?: boolean } = {},
  ): void {
    if (!opts.restart && this.anim.name === name) return;
    if (!opts.keepDrift) this.commitDrift();
    const frames = charAnimFrames(this.charKey, name) ?? charAnimFrames(this.charKey, FALLBACK_ANIM) ?? [0];
    this.anim = {
      name,
      frames,
      tick: 0,
      loop: opts.loop ?? isLoopingAnim(name),
      start: opts.start ?? 0,
      facing: this.facing,
    };
    this.frozen = false;
    this.rootApplied = (FRAME_DATA[name]?.rootMotion ?? 0) === 0;
    this.pushFrame();
  }

  private advanceAnim(): void {
    if (!this.frozen) this.anim.tick++;
    this.pushFrame();
  }

  private pushFrame(): void {
    this.view.setFrame(this.anim.frames[this.animFrame] ?? 0);
  }

  /** Terapkan root motion penuh animasi yang berjalan (saat selesai). */
  private applyRoot(): void {
    if (this.rootApplied) return;
    const rm = FRAME_DATA[this.anim.name]?.rootMotion ?? 0;
    this.x += rm * this.anim.facing;
    this.rootApplied = true;
  }

  /** Animasi dipotong sebelum selesai: terapkan pergeseran yang sudah tampil agar posisi tidak meloncat. */
  private commitDrift(): void {
    if (this.rootApplied) return;
    const rm = FRAME_DATA[this.anim.name]?.rootMotion ?? 0;
    if (rm !== 0) {
      const n = this.anim.frames.length;
      const f = this.animFrame;
      const frac =
        this.anim.name === ANIM.hitstun
          ? f === 0
            ? 0
            : f === 1
              ? 0.85
              : 1
          : Math.min(1, f / Math.max(1, n - 1));
      this.x += rm * frac * this.anim.facing;
    }
    this.rootApplied = true;
  }

  private applyVelocity(): void {
    if (Math.abs(this.vx) < 0.01) {
      this.vx = 0;
      return;
    }
    this.x += this.vx;
  }

  /** Berjalan masuk dari luar layar sampai berada di dalam batas arena. */
  private stepEntering(): void {
    const b = this.host.bounds;
    const dir = this.entering;
    if (dir === 0) return;
    this.facing = dir;
    this.x += dir * T.WALK_SPEED * 1.4 * this.stats.speed;
    this.play(ANIM.walk, { loop: true });
    if (this.x >= b.minX + 16 && this.x <= b.maxX - 16) this.entering = 0;
    this.y = clamp(this.y, b.minY, b.maxY);
  }

  private clampToBounds(): void {
    const b = this.host.bounds;
    this.x = clamp(this.x, b.minX, b.maxX);
    this.y = clamp(this.y, b.minY, b.maxY);
  }

  syncView(): void {
    this.view.setPos(Math.floor(this.x), Math.floor(this.y));
    this.view.setFlipX(this.facing < 0);
    this.view.setAlpha(this.alpha);
    this.view.setFlash(this.flashTicks > 0);
  }

  /** Dipakai untuk spawn/penempatan di luar simulasi. */
  place(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.syncView();
  }
}
