// Dunia simulasi pertarungan: langkah tetap 60 Hz, hitstop, slow-mo, antrean kejadian untuk tampilan.
import { TICK_MS } from '../config';
import { BODY_PUSH_X, BODY_PUSH_Y, DEFAULT_BOUNDS } from '../data/tuning';
import type { Bounds } from '../data/tuning';
import type { Fighter, FighterHost, Intent } from '../entities/Fighter';
import { IDLE_INTENT } from '../entities/Fighter';
import { Rng } from '../util/rng';
import type { WorldEvent } from './events';
import { isFoe, resolveHits } from './HitSystem';

export type Controller = (self: Fighter, world: CombatWorld) => Intent;

export interface WorldStats {
  damageDealt: number;
  damageTaken: number;
  hitsTaken: number;
  maxCombo: number;
  kos: number;
  ticks: number;
}

const MAX_STEPS_PER_FRAME = 5;
const SEPARATE_STATES = new Set([
  'idle',
  'walk',
  'attack',
  'block',
  'parry',
  'counter',
  'dodge',
  'dash',
  'hitstun',
  'dizzy',
]);

export class CombatWorld implements FighterHost {
  readonly fighters: Fighter[] = [];
  readonly events: WorldEvent[] = [];
  readonly stats: WorldStats = {
    damageDealt: 0,
    damageTaken: 0,
    hitsTaken: 0,
    maxCombo: 0,
    kos: 0,
    ticks: 0,
  };
  bounds: Bounds;
  rng: Rng;
  /** Tick tersisa di mana simulasi dibekukan (hitstop). */
  hitstop = 0;
  /** Faktor waktu slow-mo (1 = normal). */
  timeScale = 1;
  tickCount = 0;
  paused = false;

  private controllers = new Map<Fighter, Controller>();
  private acc = 0;
  private slowLeftMs = 0;
  private slowScale = 1;

  constructor(opts: { bounds?: Bounds; seed?: number } = {}) {
    this.bounds = opts.bounds ?? DEFAULT_BOUNDS;
    this.rng = new Rng(opts.seed ?? 1);
  }

  add(f: Fighter, controller: Controller = () => IDLE_INTENT): Fighter {
    this.fighters.push(f);
    this.controllers.set(f, controller);
    return f;
  }

  setController(f: Fighter, controller: Controller): void {
    this.controllers.set(f, controller);
  }

  remove(f: Fighter): void {
    const i = this.fighters.indexOf(f);
    if (i >= 0) this.fighters.splice(i, 1);
    this.controllers.delete(f);
  }

  emit(e: WorldEvent): void {
    if (e.type === 'hitstop') this.hitstop = Math.max(this.hitstop, e.ticks);
    else if (e.type === 'slowmo') {
      this.slowLeftMs = Math.max(this.slowLeftMs, e.ms);
      this.slowScale = e.scale;
    } else if (e.type === 'hit') this.recordHit(e);
    this.events.push(e);
  }

  private recordHit(e: Extract<WorldEvent, { type: 'hit' }>): void {
    const { attacker, target, result } = e;
    if (attacker.team !== 'enemy') {
      this.stats.damageDealt += result.damage;
      this.stats.maxCombo = Math.max(this.stats.maxCombo, attacker.combo);
    }
    if (result.ko && target.team === 'enemy') this.stats.kos++;
    if (target.team !== 'enemy' && result.kind === 'hit') {
      this.stats.hitsTaken++;
      this.stats.damageTaken += result.damage;
    }
  }

  /** Ambil dan kosongkan antrean kejadian (dipanggil lapisan tampilan tiap frame render). */
  drainEvents(): WorldEvent[] {
    return this.events.splice(0, this.events.length);
  }

  /** Maju sesuai waktu nyata. Mengembalikan jumlah tick yang dijalankan. */
  advance(deltaMs: number): number {
    if (this.paused) return 0;
    if (this.slowLeftMs > 0) {
      this.slowLeftMs -= deltaMs;
      this.timeScale = this.slowLeftMs > 0 ? this.slowScale : 1;
    } else this.timeScale = 1;
    this.acc += Math.min(deltaMs, 100) * this.timeScale;
    let steps = 0;
    while (this.acc >= TICK_MS && steps < MAX_STEPS_PER_FRAME) {
      this.acc -= TICK_MS;
      this.tick();
      steps++;
    }
    if (steps === MAX_STEPS_PER_FRAME) this.acc = 0;
    return steps;
  }

  /** Satu tick logika (60 Hz). */
  tick(): void {
    this.tickCount++;
    this.stats.ticks++;
    if (this.hitstop > 0) {
      this.hitstop--;
      return;
    }
    for (const f of [...this.fighters]) {
      const ctrl = this.controllers.get(f);
      f.step(ctrl && !f.removed ? ctrl(f, this) : IDLE_INTENT);
    }
    this.separate();
    resolveHits(this.fighters, (e) => this.emit(e));
    for (const f of [...this.fighters]) if (f.removed) this.remove(f);
  }

  /** Cegah petarung menumpuk di titik yang sama. */
  private separate(): void {
    const fs = this.fighters;
    for (let i = 0; i < fs.length; i++) {
      const a = fs[i] as Fighter;
      if (!SEPARATE_STATES.has(a.state)) continue;
      for (let j = i + 1; j < fs.length; j++) {
        const b = fs[j] as Fighter;
        if (!SEPARATE_STATES.has(b.state)) continue;
        const dx = b.x - a.x;
        const dy = Math.abs(b.y - a.y);
        if (Math.abs(dx) >= BODY_PUSH_X || dy >= BODY_PUSH_Y) continue;
        const push = (BODY_PUSH_X - Math.abs(dx)) / 2;
        const dir = dx === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dx);
        a.x -= dir * push;
        b.x += dir * push;
      }
    }
  }

  foesOf(f: Fighter): Fighter[] {
    return this.fighters.filter((o) => o !== f && !o.removed && isFoe(f, o) && !o.dead);
  }

  nearestFoe(f: Fighter): Fighter | undefined {
    let best: Fighter | undefined;
    let bd = Infinity;
    for (const o of this.foesOf(f)) {
      const d = Math.abs(o.x - f.x) + Math.abs(o.y - f.y) * 2;
      if (d < bd) {
        bd = d;
        best = o;
      }
    }
    return best;
  }

  /** Musuh yang masih "hidup" (belum KO). */
  aliveEnemies(): Fighter[] {
    return this.fighters.filter((f) => f.team === 'enemy' && !f.dead && !f.removed);
  }
}
