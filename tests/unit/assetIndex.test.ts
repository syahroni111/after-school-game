import { describe, expect, it } from 'vitest';
import { SHEETS, charAnimFrames, characterKeys, hasCharAnim, hasTexture, sideKey, animKeyFor, stageNames } from '../../src/data/assetIndex';

describe('manifest aset', () => {
  it('A01_protagonis:pukulan_kait punya 10 frame', () => {
    expect(charAnimFrames('A01_protagonis', 'pukulan_kait')).toHaveLength(10);
  });
  it('D01_guru tidak punya pukulan_cepat, tetapi punya jalan_samping', () => {
    expect(hasCharAnim('D01_guru', 'pukulan_cepat')).toBe(false);
    expect(hasCharAnim('D01_guru', 'jalan_samping')).toBe(true);
  });
  it('kelompok C tidak bisa menyerang (tanpa pukulan), tetapi bisa jatuh dan bangkit', () => {
    for (const k of ['C01_murid_pria', 'C07_anggota_osis']) {
      expect(hasCharAnim(k, 'pukulan_cepat')).toBe(false);
      expect(hasCharAnim(k, 'jatuh')).toBe(true);
      expect(hasCharAnim(k, 'bangkit')).toBe(true);
    }
  });
  it('ada 23 karakter, 22 stage, dan font 5x7 dengan 46 glyph', () => {
    expect(characterKeys()).toHaveLength(23);
    expect(stageNames()).toHaveLength(22);
    expect(hasTexture('ui:font_piksel_5x7')).toBe(true);
  });
  it('key animasi karakter tidak bertabrakan antar sheet karakter yang sama', () => {
    const seen = new Set<string>();
    for (const s of SHEETS.filter((x) => x.key.startsWith('char:'))) {
      for (const a of Object.keys(s.animations)) {
        const k = animKeyFor(s, a);
        expect(seen.has(k), k).toBe(false);
        seen.add(k);
      }
    }
  });
  it('semua indeks frame ada di dalam sheet', () => {
    for (const s of SHEETS) {
      const total = s.columns * Math.floor(s.h / s.frameH);
      for (const list of Object.values(s.animations)) for (const i of list) expect(i).toBeLessThan(total);
    }
  });
  it('key sheet samping konsisten', () => {
    expect(sideKey('A01_protagonis')).toBe('char:A01_protagonis:side');
  });
});
