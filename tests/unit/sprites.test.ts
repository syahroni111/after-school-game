// Memverifikasi data frame terhadap piksel sheet asli: kaki di garis tanah, frame aktif = lengan terentang,
// hitbox menjangkau kepalan, dan root motion cocok dengan pergeseran sprite.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { alphaAt, decodePng } from '../../tools/lib/png.mjs';
import type { Png } from '../../tools/lib/png.mjs';
import { SHEETS, sideKey } from '../../src/data/assetIndex';
import { FRAME_DATA } from '../../src/data/frameData';

const ASSETS = path.resolve(__dirname, '../../public/assets');
const FIGHTERS = SHEETS.filter((s) => /^char:[AB]\d\d_[a-z_]+:side$/.test(s.key)).map((s) => s.key.split(':')[1] as string);
const AIRBORNE = new Set(['terpental', 'jatuh']); // beberapa frame memang melayang/berbaring
const SOLID = 250;

interface Stat {
  bottom: number;
  minX: number;
  maxX: number;
}

function loadSheet(charKey: string) {
  const sheet = SHEETS.find((s) => s.key === sideKey(charKey));
  if (!sheet) throw new Error(`sheet ${charKey} tidak ada`);
  return { sheet, img: decodePng(path.join(ASSETS, ...sheet.path.split('/'))) };
}

function frameStat(img: Png, columns: number, index: number): Stat {
  const cx = (index % columns) * 64;
  const cy = Math.floor(index / columns) * 64;
  const st: Stat = { bottom: -1, minX: 99, maxX: -1 };
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      if (alphaAt(img, cx + x, cy + y) < SOLID) continue;
      st.bottom = Math.max(st.bottom, y);
      st.minX = Math.min(st.minX, x);
      st.maxX = Math.max(st.maxX, x);
    }
  }
  return st;
}

describe.skipIf(!fs.existsSync(ASSETS))('sprite vs frameData (butuh public/assets)', () => {
  it('ada 15 petarung (A01-A08, B01-B07)', () => {
    expect(FIGHTERS).toHaveLength(15);
  });

  it('kaki menempel di garis tanah (baris 58-59) pada semua frame non-udara', () => {
    for (const key of FIGHTERS) {
      const { sheet, img } = loadSheet(key);
      for (const [anim, list] of Object.entries(sheet.animations)) {
        if (AIRBORNE.has(anim)) continue;
        for (const [i, idx] of list.entries()) {
          const st = frameStat(img, sheet.columns, idx);
          expect(st.bottom, `${key}:${anim}[${i}]`).toBeGreaterThanOrEqual(58);
          expect(st.bottom, `${key}:${anim}[${i}]`).toBeLessThanOrEqual(59);
        }
      }
    }
  });

  it('frame aktif adalah frame lengan paling terentang, dan hitbox menjangkau kepalan', () => {
    const { sheet, img } = loadSheet('A01_protagonis');
    for (const anim of ['pukulan_cepat', 'pukulan_lurus', 'pukulan_kait', 'pukulan_badan', 'pukulan_berat', 'serangan_balik', 'dorong']) {
      const t = FRAME_DATA[anim];
      const list = sheet.animations[anim] as readonly number[];
      const tips = list.map((idx) => frameStat(img, sheet.columns, idx).maxX - 32);
      const best = Math.max(...tips);
      const [a, b] = t?.active as [number, number];
      for (let f = a; f <= b; f++) expect(tips[f], `${anim} frame ${f} harus terentang`).toBeGreaterThanOrEqual(best - 4);
      for (const f of [0, 1]) expect(tips[f], `${anim} frame ${f} masih startup`).toBeLessThan(best - 4);
      const hb = t?.hitbox as { x: number; w: number };
      const reach = Math.max(...tips.slice(a, b + 1));
      expect(hb.x + hb.w, `${anim} hitbox harus menjangkau kepalan`).toBeGreaterThanOrEqual(reach - 1);
      expect(hb.x + hb.w, `${anim} hitbox tidak berlebihan`).toBeLessThanOrEqual(reach + 8);
    }
  });

  it('root motion cocok dengan pergeseran sprite pada frame terakhir (toleransi 3 px)', () => {
    const { sheet, img } = loadSheet('A01_protagonis');
    for (const anim of ['menghindar_mundur', 'maju_selangkah', 'terhuyung', 'terpental']) {
      const list = sheet.animations[anim] as readonly number[];
      const first = frameStat(img, sheet.columns, list[0] as number);
      const last = frameStat(img, sheet.columns, list[list.length - 1] as number);
      const shift = (last.minX + last.maxX - first.minX - first.maxX) / 2;
      expect(Math.abs(shift - (FRAME_DATA[anim]?.rootMotion ?? 0)), `${anim} bergeser ${shift}`).toBeLessThanOrEqual(3);
    }
  });
});
