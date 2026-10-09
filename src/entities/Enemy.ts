// Pembuat musuh: Fighter + EnemyBrain dari data EnemyDef, dipasang ke CombatWorld.
import type { AttackDirector } from '../combat/AttackDirector';
import type { CombatWorld } from '../combat/CombatWorld';
import type { DifficultyDef } from '../data/difficulty';
import { enemyDef } from '../data/enemies';
import type { Rng } from '../util/rng';
import { EnemyBrain } from './EnemyBrain';
import { ALL_UNLOCKED, Fighter } from './Fighter';
import type { FighterView, Team } from './Fighter';

export interface SpawnEnemyOpts {
  enemy: string;
  world: CombatWorld;
  director: AttackDirector | null;
  diff: DifficultyDef;
  x: number;
  y: number;
  /** Masuk dari sisi layar ('left'/'right'); undefined = langsung di posisi (x, y). */
  from?: 'left' | 'right';
  rng: Rng;
  slotIndex: number;
  view: FighterView;
  id: string;
  team?: Team;
}

export interface SpawnedEnemy {
  fighter: Fighter;
  brain: EnemyBrain;
}

export function spawnEnemy(o: SpawnEnemyOpts): SpawnedEnemy {
  const def = enemyDef(o.enemy);
  const team = o.team ?? 'enemy';
  const fighter = new Fighter({
    id: o.id,
    team,
    charKey: def.charKey,
    x: o.x,
    y: o.y,
    facing: o.from === 'left' ? 1 : o.from === 'right' ? -1 : team === 'enemy' ? -1 : 1,
    stats: {
      maxHp: Math.round(def.hp * (team === 'enemy' ? o.diff.enemyHp : 1)),
      maxStamina: 100,
      power: def.power * (team === 'enemy' ? o.diff.enemyDamage : 1),
      defense: def.defense,
      speed: def.speed,
    },
    unlocks: ALL_UNLOCKED,
    host: o.world,
    view: o.view,
    isBoss: !!def.boss,
    koBehavior: team === 'enemy' ? 'leave' : 'stay',
  });
  fighter.enemyDef = def;
  if (o.from) fighter.entering = o.from === 'left' ? 1 : -1;
  const brain = new EnemyBrain(def, {
    director: team === 'enemy' ? o.director : null,
    diff: o.diff,
    rng: o.rng,
    slotIndex: o.slotIndex,
    emitTelegraph: (x, y) => {
      o.world.emit({ type: 'fx', name: 'aksen_energi_merah', x, y, flip: false });
      o.world.emit({ type: 'sfx', name: 'telegraph' });
    },
  });
  o.world.add(fighter, (self, world) => brain.intent(self, world));
  return { fighter, brain };
}
