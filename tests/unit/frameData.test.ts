import { describe, expect, it } from 'vitest';
import { TICKS_PER_FRAME } from '../../src/config';
import { charAnimFrames } from '../../src/data/assetIndex';
import { FRAME_DATA, animTicks, frameAtTick, isActiveFrame, isInvulnFrame, isParryFrame } from '../../src/data/frameData';

describe('frameData', () => {
  it('satu frame animasi = 5 tick logika', () => {
    expect(TICKS_PER_FRAME).toBe(5);
    expect(animTicks('pukulan_cepat')).toBe(40);
    expect(frameAtTick(0, 8)).toBe(0);
    expect(frameAtTick(4, 8)).toBe(0);
    expect(frameAtTick(5, 8)).toBe(1);
    expect(frameAtTick(999, 8)).toBe(7);
  });
  it('jumlah frame di tabel sama dengan manifest', () => {
    for (const [anim, t] of Object.entries(FRAME_DATA)) {
      expect(charAnimFrames('A01_protagonis', anim)?.length, anim).toBe(t.frames);
    }
  });
  it('rentang aktif, kebal, tangkis berada di dalam animasi dan berurutan', () => {
    for (const [anim, t] of Object.entries(FRAME_DATA)) {
      for (const r of [t.active, t.invuln, t.parry]) {
        if (!r) continue;
        expect(r[0], anim).toBeGreaterThanOrEqual(0);
        expect(r[1], anim).toBeLessThan(t.frames);
        expect(r[0], anim).toBeLessThanOrEqual(r[1]);
      }
      if (t.active) expect(t.hitbox, `${anim} butuh hitbox`).toBeDefined();
      if (t.cancelFrom !== undefined) expect(t.cancelFrom).toBeGreaterThan(t.active?.[1] ?? 0);
    }
  });
  it('nilai GDD: jendela aktif, kebal, tangkis, root motion', () => {
    expect(FRAME_DATA.pukulan_cepat?.active).toEqual([3, 4]);
    expect(FRAME_DATA.pukulan_berat?.active).toEqual([6, 8]);
    expect(FRAME_DATA.serangan_balik?.active).toEqual([7, 9]);
    expect(FRAME_DATA.tangkis?.parry).toEqual([2, 5]);
    expect(FRAME_DATA.menghindar_mundur?.invuln).toEqual([1, 6]);
    expect(FRAME_DATA.menghindar_mundur?.rootMotion).toBe(-10);
    expect(FRAME_DATA.terpental?.rootMotion).toBe(-18);
    expect(FRAME_DATA.maju_selangkah?.rootMotion).toBe(8);
  });
  it('predikat frame', () => {
    expect(isActiveFrame('pukulan_berat', 5)).toBe(false);
    expect(isActiveFrame('pukulan_berat', 6)).toBe(true);
    expect(isActiveFrame('pukulan_berat', 9)).toBe(false);
    expect(isInvulnFrame('menghindar_samping', 0)).toBe(false);
    expect(isInvulnFrame('menghindar_samping', 3)).toBe(true);
    expect(isParryFrame('tangkis', 2)).toBe(true);
    expect(isParryFrame('tangkis', 6)).toBe(false);
  });
});
