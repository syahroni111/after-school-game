import { describe, expect, it } from 'vitest';
import { hasCharAnim, hasTexture } from '../../src/data/assetIndex';
import { ANIM } from '../../src/data/animMap';
import { allFxNames, COMBO_CHAIN, MOVES } from '../../src/data/moves';
import { FRAME_DATA } from '../../src/data/frameData';

describe('data jurus', () => {
  it('semua efek yang dirujuk ada di manifest', () => {
    for (const n of allFxNames()) expect(hasTexture(`fx:${n}`), n).toBe(true);
  });
  it('semua animasi jurus dan state ada di sheet petarung dan punya frame data', () => {
    for (const m of Object.values(MOVES)) {
      expect(hasCharAnim('A01_protagonis', m.anim), m.id).toBe(true);
      expect(FRAME_DATA[m.anim]?.hitbox, m.id).toBeDefined();
    }
    for (const a of Object.values(ANIM)) expect(hasCharAnim('B01_pemimpin_rival', a), a).toBe(true);
  });
  it('rantai kombo berakhir dengan finisher yang menjatuhkan', () => {
    expect(COMBO_CHAIN.at(-1)).toBe('heavy');
    expect(MOVES.heavy.reaction).toBe('knockdown');
    for (const id of COMBO_CHAIN.slice(0, -1)) expect(MOVES[id].reaction).toBe('stagger');
  });
  it('hitstun cukup panjang agar kombo tersambung (>= jeda ke serangan berikutnya)', () => {
    // jab -> straight: cancel di tick 25 + startup 20 - waktu kena ~15 = 30 tick minimal
    expect(MOVES.jab.hitstunTicks).toBeGreaterThanOrEqual(35);
    expect(MOVES.straight.hitstunTicks).toBeGreaterThanOrEqual(45);
  });
});
