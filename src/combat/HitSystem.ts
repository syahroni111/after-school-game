// Resolusi tumbukan hitbox/hurtbox (dengan toleransi kedalaman) dan pembuatan "rasa pukulan".
import type { Fighter } from '../entities/Fighter';
import { BLOCK_FEEL, BOSS_KO_FEEL, KO_FEEL, KO_SLOWMO, PARRY_FEEL, hitstopTicks } from '../data/moves';
import type { HitFeel, MoveDef } from '../data/moves';
import { DEPTH_TOLERANCE } from '../data/tuning';
import { rectsOverlap, sign } from '../util/math';
import type { HitResult, WorldEvent } from './events';

export const isFoe = (a: Fighter, b: Fighter): boolean => (a.team === 'enemy') !== (b.team === 'enemy');

function emitFeel(
  emit: (e: WorldEvent) => void,
  feel: HitFeel,
  x: number,
  y: number,
  flip: boolean,
  extraStop = 0,
  extraShake = 0,
): void {
  for (const name of feel.fx) emit({ type: 'fx', name, x, y, flip });
  const stop = hitstopTicks(feel) + extraStop;
  if (stop > 0) emit({ type: 'hitstop', ticks: stop });
  const shake = feel.shake + extraShake;
  if (shake > 0) emit({ type: 'shake', amount: shake });
  if (feel.flash) emit({ type: 'flash', alpha: feel.flash });
  emit({ type: 'sfx', name: feel.sfx });
}

function feelFor(result: HitResult, move: MoveDef): HitFeel {
  if (result.kind === 'parry') return PARRY_FEEL;
  if (result.kind === 'block') return BLOCK_FEEL;
  return move.feel;
}

/** Satu tick: cek semua serangan aktif terhadap lawan. */
export function resolveHits(fighters: readonly Fighter[], emit: (e: WorldEvent) => void): void {
  for (const atk of fighters) {
    if (atk.removed) continue;
    const hit = atk.activeHit();
    if (!hit) continue;
    for (const tgt of fighters) {
      if (tgt === atk || tgt.removed || !isFoe(atk, tgt) || atk.hitSet.has(tgt)) continue;
      if (Math.abs(tgt.y - atk.y) > DEPTH_TOLERANCE) continue;
      if (!rectsOverlap(hit.rect, tgt.hurtbox())) continue;
      const first = atk.hitSet.size === 0;
      const result = tgt.receiveHit(atk, hit.move, hit.charged);
      if (result.kind === 'miss') continue; // kebal: coba lagi di tick berikutnya
      atk.hitSet.add(tgt);
      atk.onHitLanded(result);
      const dir = sign(tgt.x - atk.x) || atk.facing;
      const px = hit.move.radial ? atk.x : tgt.x - dir * 6;
      const py = hit.move.radial ? atk.y - 26 : tgt.y - 34;
      const feel = feelFor(result, hit.move);
      if (!hit.move.radial || first || result.kind !== 'hit') {
        const bonus = hit.charged && result.kind === 'hit';
        emitFeel(emit, feel, px, py, dir < 0, bonus ? 3 : 0, bonus ? 1 : 0);
        if (bonus) emit({ type: 'fx', name: 'starburst', x: px, y: py, flip: dir < 0 });
      }
      emit({ type: 'hit', attacker: atk, target: tgt, move: hit.move, result });
      if (result.ko) {
        const boss = tgt.isBoss;
        emitFeel(emit, boss ? BOSS_KO_FEEL : KO_FEEL, tgt.x, tgt.y - 24, dir < 0);
        emit({ type: 'slowmo', scale: KO_SLOWMO.scale, ms: boss ? KO_SLOWMO.ms * 2 : KO_SLOWMO.ms });
        if (boss) {
          emit({ type: 'screenFx', name: 'garis_fokus' });
          emit({ type: 'screenFx', name: 'vinyet' });
        }
      }
    }
  }
}
