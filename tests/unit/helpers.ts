// Alat bantu test simulasi: boneka yang dikendalikan skrip di atas CombatWorld.
import { CombatWorld } from '../../src/combat/CombatWorld';
import type { BufferedAction } from '../../src/combat/ComboBuffer';
import { ALL_UNLOCKED, Fighter } from '../../src/entities/Fighter';
import type { FighterStats, Intent, Team, Unlocks } from '../../src/entities/Fighter';

export const STATS: FighterStats = { maxHp: 100, maxStamina: 100, power: 1, defense: 0, speed: 1 };

export class Puppet {
  held = { guard: false, heavy: false, moveX: 0 as -1 | 0 | 1, moveY: 0 as -1 | 0 | 1 };
  private queue: BufferedAction[] = [];
  private dash = false;
  constructor(readonly f: Fighter) {}
  press(...a: BufferedAction[]): void {
    this.queue.push(...a);
  }
  doDash(): void {
    this.dash = true;
  }
  intent = (): Intent => {
    const presses = this.queue.splice(0);
    const dashPressed = this.dash;
    this.dash = false;
    return {
      moveX: this.held.moveX,
      moveY: this.held.moveY,
      guardHeld: this.held.guard,
      heavyHeld: this.held.heavy,
      dashPressed,
      presses,
    };
  };
}

export interface Rig {
  world: CombatWorld;
  a: Puppet;
  b: Puppet;
  run(ticks: number): void;
  runUntil(pred: () => boolean, max?: number): number;
}

export function mkFighter(
  world: CombatWorld,
  team: Team,
  id: string,
  x: number,
  y: number,
  over: Partial<FighterStats> = {},
  unlocks: Unlocks = ALL_UNLOCKED,
  charKey = 'A01_protagonis',
): Puppet {
  const f = new Fighter({ id, team, charKey, x, y, stats: { ...STATS, ...over }, unlocks, host: world });
  const p = new Puppet(f);
  world.add(f, p.intent);
  return p;
}

/** Dua petarung berhadapan: a (pemain, menghadap kanan) dan b (musuh, menghadap kiri). */
export function mkRig(
  gap = 30,
  opts: { bOver?: Partial<FighterStats>; aOver?: Partial<FighterStats>; unlocks?: Unlocks } = {},
): Rig {
  const world = new CombatWorld({ seed: 7 });
  const a = mkFighter(world, 'player', 'a', 200, 220, opts.aOver, opts.unlocks);
  const b = mkFighter(world, 'enemy', 'b', 200 + gap, 220, opts.bOver, opts.unlocks, 'B04_rival_agresif');
  return {
    world,
    a,
    b,
    run(ticks) {
      for (let i = 0; i < ticks; i++) world.tick();
    },
    runUntil(pred, max = 600) {
      for (let i = 0; i < max; i++) {
        if (pred()) return i;
        world.tick();
      }
      return -1;
    },
  };
}
