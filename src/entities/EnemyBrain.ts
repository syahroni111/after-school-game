// Otak musuh (murni): mengitari tanpa token, mendekat dan menyerang dengan token, bertahan/menghindar/menangkis reaktif.
import { AttackDirector } from '../combat/AttackDirector';
import type { CombatWorld } from '../combat/CombatWorld';
import type { BufferedAction } from '../combat/ComboBuffer';
import { TICKS_PER_FRAME } from '../config';
import type { DifficultyDef } from '../data/difficulty';
import type { EnemyDef, PlanDef, PlanStep } from '../data/enemies';
import { FRAME_DATA } from '../data/frameData';
import { MOVES } from '../data/moves';
import type { Rng } from '../util/rng';
import { clamp, sign } from '../util/math';
import type { Fighter, Intent } from './Fighter';
import { IDLE_INTENT } from './Fighter';

type Mode = 'circle' | 'approach' | 'attack';

const ATTACK_RANGE_X = 24; // jarak x tempat serangan mulai dilepas
const ATTACK_RANGE_Y = 5;
const APPROACH_TIMEOUT = 5 * 60;
const GUARD_HOLD = 42;
const DASH_MIN_DIST = 64;

interface Pending {
  kind: 'guard' | 'dodge' | 'parry';
  key: string;
}

export interface BrainDeps {
  director: AttackDirector | null; // null = tanpa token (sekutu)
  diff: DifficultyDef;
  rng: Rng;
  slotIndex: number;
  emitTelegraph: (x: number, y: number) => void;
}

export class EnemyBrain {
  private mode: Mode = 'circle';
  private nextThink = 0;
  private nextAttackAt: number;
  private slotSide: -1 | 1;
  private yOff = 0;
  private plan: readonly PlanStep[] = [];
  private planIdx = 0;
  private approachSince = 0;
  private guardUntil = 0;
  private pending: Pending | null = null;
  private lastThreatKey = '';
  private dashed = false;
  /** Waktu dunia (tick); satu basis waktu dengan AttackDirector. */
  private now = 0;

  constructor(
    readonly def: EnemyDef,
    private readonly deps: BrainDeps,
  ) {
    this.slotSide = deps.slotIndex % 2 === 0 ? -1 : 1;
    this.nextAttackAt = 40 + deps.slotIndex * 25 + deps.rng.int(0, 30);
  }

  private cooldownTicks(): number {
    const [a, b] = this.def.cooldown;
    return Math.round(this.deps.rng.int(a, b) * this.deps.diff.cooldown);
  }

  private dropToken(self: Fighter): void {
    this.deps.director?.release(self.id, this.now, 0);
    this.nextAttackAt = this.now + this.cooldownTicks();
    this.mode = 'circle';
    this.plan = [];
    this.planIdx = 0;
    this.dashed = false;
  }

  intent(self: Fighter, world: CombatWorld): Intent {
    this.now = world.tickCount;
    const now = this.now;
    const foe = world.nearestFoe(self);
    if (!foe || self.dead) {
      this.dropToken(self);
      return IDLE_INTENT;
    }
    if (self.entering !== 0) return IDLE_INTENT;
    const st = self.state;
    if (st === 'hitstun' || st === 'knockback' || st === 'down' || st === 'dizzy' || st === 'ko' || st === 'getup') {
      if (this.mode !== 'circle') this.dropToken(self);
      this.pending = null;
      return IDLE_INTENT;
    }
    if (st === 'cutscene') return IDLE_INTENT;

    const dx = foe.x - self.x;
    const dy = foe.y - self.y;
    const face = (dx >= 0 ? 1 : -1) as 1 | -1;

    const reactive = this.reactive(self, foe, face);
    if (reactive) return reactive;
    if (st === 'parry') return { ...IDLE_INTENT, face, presses: self.sm.stateTick >= 3 ? ['light'] : [] };
    if (st === 'block') {
      // Terus bertahan sampai waktunya habis.
      return { ...IDLE_INTENT, face, guardHeld: now < this.guardUntil };
    }
    if (st === 'attack' || st === 'counter' || st === 'dash' || st === 'dodge') {
      return this.mode === 'attack' ? this.attackStep(self, foe, face) : { ...IDLE_INTENT, face };
    }
    if (this.mode === 'attack') return this.attackStep(self, foe, face);
    if (this.mode === 'approach') return this.approach(self, foe, dx, dy, face);
    return this.circle(self, foe, face);
  }

  // ---------- reaksi terhadap serangan lawan ----------
  private reactive(self: Fighter, foe: Fighter, face: 1 | -1): Intent | null {
    const now = this.now;
    const threat = this.threatOf(self, foe);
    if (threat) {
      if (threat.key !== this.lastThreatKey) {
        this.lastThreatKey = threat.key;
        const r = this.deps.rng.next();
        const d = this.def;
        this.pending =
          r < d.parrySkill ? { kind: 'parry', key: threat.key }
            : r < d.parrySkill + d.guardChance ? { kind: 'guard', key: threat.key }
              : r < d.parrySkill + d.guardChance + d.dodgeChance ? { kind: 'dodge', key: threat.key }
                : null;
      }
      const p = this.pending;
      if (p && p.key === threat.key && self.canAct) {
        if (p.kind === 'guard') return this.startGuard(self, face);
        if (p.kind === 'parry' && threat.ticksToActive <= 6) return this.startGuard(self, face);
        if (p.kind === 'dodge' && threat.ticksToActive <= 8) {
          this.pending = null;
          this.dropToken(self);
          return { ...IDLE_INTENT, face, presses: ['dodge'], moveX: (-face) as -1 | 1 };
        }
      }
    }
    if (self.state === 'block' && now < this.guardUntil) return { ...IDLE_INTENT, face, guardHeld: true };
    return null;
  }

  private startGuard(self: Fighter, face: 1 | -1): Intent {
    this.guardUntil = this.now + GUARD_HOLD;
    this.pending = null;
    if (this.mode !== 'circle') this.dropToken(self);
    return { ...IDLE_INTENT, face, guardHeld: true, presses: ['guard'] };
  }

  /** Serangan lawan yang akan segera mengenai kita. */
  private threatOf(self: Fighter, foe: Fighter): { key: string; ticksToActive: number } | null {
    if (!foe.move || !foe.sm.is('attack', 'counter')) return null;
    const timing = FRAME_DATA[foe.move.anim];
    if (!timing?.active || !timing.hitbox) return null;
    const reach = timing.hitbox.x + timing.hitbox.w + 12;
    if (Math.abs(foe.x - self.x) > reach || Math.abs(foe.y - self.y) > 10) return null;
    const ticksToActive = timing.active[0] * TICKS_PER_FRAME - foe.animTick;
    if (ticksToActive < -2 || ticksToActive > 22) return null;
    return { key: `${foe.id}:${foe.move.id}:${foe.tick - foe.sm.stateTick}`, ticksToActive };
  }

  // ---------- mengitari ----------
  private circle(self: Fighter, foe: Fighter, face: 1 | -1): Intent {
    const now = this.now;
    const b = self.host.bounds;
    if (now >= this.nextThink) {
      this.nextThink = now + this.deps.rng.int(45, 100);
      this.yOff = this.deps.rng.int(-36, 36);
      if (this.deps.rng.chance(0.25)) this.slotSide = (-this.slotSide) as -1 | 1;
    }
    if (now >= this.nextAttackAt && this.requestToken(self)) {
      this.mode = 'approach';
      this.approachSince = now;
      this.plan = this.choosePlan();
      this.planIdx = 0;
      this.dashed = false;
      return { ...IDLE_INTENT, face };
    }
    const tx = clamp(foe.x + this.slotSide * this.def.ring, b.minX + 6, b.maxX - 6);
    const ty = clamp(foe.y + this.yOff, b.minY, b.maxY);
    return { ...IDLE_INTENT, face, ...this.moveToward(self, tx, ty, 6, 3) };
  }

  private requestToken(self: Fighter): boolean {
    return this.deps.director ? this.deps.director.request(self.id, this.now) : true;
  }

  private choosePlan(): readonly PlanStep[] {
    const plans: readonly PlanDef[] = this.def.plans;
    const total = plans.reduce((s, p) => s + p.weight, 0);
    let r = this.deps.rng.next() * total;
    for (const p of plans) {
      r -= p.weight;
      if (r <= 0) return p.steps;
    }
    return plans[0]?.steps ?? ['light'];
  }

  // ---------- mendekat ----------
  private approach(self: Fighter, foe: Fighter, dx: number, dy: number, face: 1 | -1): Intent {
    const now = this.now;
    if (now - this.approachSince > APPROACH_TIMEOUT) {
      this.dropToken(self);
      return { ...IDLE_INTENT, face };
    }
    const first = this.plan[0];
    if (first === 'dash') {
      if (Math.abs(dx) < DASH_MIN_DIST) return { ...IDLE_INTENT, face, moveX: (-face) as -1 | 1 }; // ambil jarak dulu
      this.mode = 'attack';
      this.planIdx = 1;
      this.dashed = true;
      return { ...IDLE_INTENT, face, dashPressed: true };
    }
    const range = first === 'heavy' || first === 'special' ? ATTACK_RANGE_X + 6 : ATTACK_RANGE_X;
    if (Math.abs(dx) <= range && Math.abs(dy) <= ATTACK_RANGE_Y) {
      this.mode = 'attack';
      this.planIdx = 0;
      return { ...IDLE_INTENT, face };
    }
    const tx = foe.x - face * (range - 4);
    return { ...IDLE_INTENT, face, ...this.moveToward(self, tx, foe.y, 3, 2) };
  }

  // ---------- menyerang ----------
  private attackStep(self: Fighter, foe: Fighter, face: 1 | -1): Intent {
    const presses: BufferedAction[] = [];
    const base: Intent = { ...IDLE_INTENT, face };
    if (self.sm.is('idle', 'walk')) {
      if (this.planIdx >= this.plan.length) {
        this.dropToken(self);
        return base;
      }
      if (!this.dashed && this.planIdx > 0) {
        // Serangan sebelumnya selesai sebelum rantai lanjut: rencana berhenti.
        this.dropToken(self);
        return base;
      }
      const dist = Math.abs(foe.x - self.x);
      if (dist > ATTACK_RANGE_X + 18 && !this.dashed) {
        this.mode = 'approach';
        return base;
      }
      const step = this.plan[this.planIdx] as PlanStep;
      this.planIdx++;
      this.dashed = false;
      if (step === 'heavy' || step === 'special') this.deps.emitTelegraph(self.x, self.y - 56);
      presses.push(step === 'dash' ? 'light' : step);
      return { ...base, presses };
    }
    if (self.sm.state === 'dash' && this.dashed && this.planIdx < this.plan.length) {
      if (Math.abs(foe.x - self.x) < 40 || self.sm.stateTick > 16) {
        this.planIdx++;
        this.dashed = false;
        return { ...base, presses: ['light'] };
      }
      return base;
    }
    if (self.sm.state === 'attack' && self.move) {
      const cancel = FRAME_DATA[self.move.anim]?.cancelFrom;
      const next = this.plan[this.planIdx];
      if (next && next !== 'dash' && cancel !== undefined && self.animFrame >= cancel - 1 && MOVES[self.move.id].reaction === 'stagger') {
        this.planIdx++;
        if (next === 'heavy' || next === 'special') this.deps.emitTelegraph(self.x, self.y - 56);
        return { ...base, presses: [next] };
      }
    }
    return base;
  }

  private moveToward(self: Fighter, tx: number, ty: number, dzX: number, dzY: number): Pick<Intent, 'moveX' | 'moveY'> {
    const ddx = tx - self.x;
    const ddy = ty - self.y;
    return {
      moveX: Math.abs(ddx) > dzX ? sign(ddx) : 0,
      moveY: Math.abs(ddy) > dzY ? sign(ddy) : 0,
    } as Pick<Intent, 'moveX' | 'moveY'>;
  }

  holdsToken(self: Fighter): boolean {
    return this.deps.director?.has(self.id) ?? false;
  }

  /** Dipakai Stage saat musuh dihapus. */
  release(self: Fighter): void {
    this.deps.director?.forget(self.id);
  }
}
