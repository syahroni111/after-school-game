import { describe, expect, it } from 'vitest';
import { hasTexture } from '../../src/data/assetIndex';
import { DECOR, PUDDLES } from '../../src/data/decor';
import { STAGES } from '../../src/data/stages';
import type { Weather } from '../../src/data/stages';
import { planBackdrop } from '../../src/systems/TimeWeather';

const WEATHERS: Weather[] = ['cerah', 'berawan', 'hujan', 'sore', 'malam'];

describe('stage dan cuaca', () => {
  it('ada 22 stage unik yang semuanya punya gambar', () => {
    expect(STAGES).toHaveLength(22);
    expect(new Set(STAGES.map((s) => s.id)).size).toBe(22);
    for (const s of STAGES) expect(hasTexture(`stage:${s.id}`), s.id).toBe(true);
  });
  it('varian cuaca yang dideklarasikan semuanya ada di manifest', () => {
    for (const s of STAGES)
      for (const w of s.weather) expect(hasTexture(`stage:${s.id}:${w}`), `${s.id}:${w}`).toBe(true);
  });
  it('dekorasi dan genangan merujuk stage dan efek yang ada', () => {
    const ids = new Set(STAGES.map((x) => x.id));
    for (const [stage, list] of Object.entries(DECOR)) {
      expect(ids.has(stage), stage).toBe(true);
      for (const d of list) expect(hasTexture(`fx:${d.fx}`), d.fx).toBe(true);
    }
    for (const stage of Object.keys(PUDDLES))
      expect(STAGES.find((x) => x.id === stage)?.weather).toContain('hujan');
    expect(hasTexture('fx:genangan_beriak')).toBe(true);
    expect(hasTexture('fx:burung_terbang')).toBe(true);
  });
  it('semua kombinasi stage x cuaca menghasilkan tekstur yang ada', () => {
    for (const s of STAGES)
      for (const w of WEATHERS) expect(hasTexture(planBackdrop(s.id, w).key), `${s.id}:${w}`).toBe(true);
  });
  it('stage dengan gambar cuaca memakainya dan tidak diberi tint', () => {
    const p = planBackdrop('halaman', 'sore');
    expect(p.key).toBe('stage:halaman:sore');
    expect(p.tint).toBeNull();
  });
  it('stage tanpa varian: sore = oranye 18%, malam = biru gelap 45%', () => {
    expect(planBackdrop('lorong_utama', 'sore').tint).toEqual({ color: 0xe8803c, alpha: 0.18 });
    expect(planBackdrop('lorong_utama', 'malam').tint).toEqual({ color: 0x0c1a40, alpha: 0.45 });
  });
  it('hujan memasang overlay hujan; cerah tidak', () => {
    expect(planBackdrop('halaman', 'hujan').rain).toBe(true);
    expect(planBackdrop('halaman', 'cerah').rain).toBe(false);
    expect(planBackdrop('atap', undefined, true).rain).toBe(true);
    expect(planBackdrop('tangga', 'hujan').rain).toBe(true);
  });
  it('efek lingkungan hanya dipasang pada gambar dasar/cerah', () => {
    expect(planBackdrop('halaman', undefined).envMatches).toBe(true);
    expect(planBackdrop('halaman', 'cerah').envMatches).toBe(true);
    expect(planBackdrop('halaman', 'hujan').envMatches).toBe(false);
    expect(planBackdrop('lorong_utama', 'malam').envMatches).toBe(true);
  });
  it('stage tak dikenal melempar error', () => {
    expect(() => planBackdrop('tidak_ada', 'cerah')).toThrow();
  });
});
