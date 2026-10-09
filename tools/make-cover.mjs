// Membuat cover itch.io 630x500 dari sampul 1920x1080 paket aset (hanya membaca sumber).
// Subjudul bawaan "PIXEL ACTION ASSET PACK" ditimpa persegi warna dan teks "JEJAK TIGA SEKOLAH" dari font piksel paket
// (sama seperti layar Title). Hasil: docs/itch/cover_630x500.png
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ROOT } from './lib/fsx.mjs';
import { decodePng } from './lib/png.mjs';

const ROOTS = [process.env.ASSET_SRC, 'D:\\ASET_PIXEL\\AFTER_SCHOOL', path.join(ROOT, 'AFTER_SCHOOL')].filter(Boolean);
const SRC = ROOTS.find((d) => fs.existsSync(path.join(d, '17_THUMBNAIL'))) ?? ROOTS[0];
const OUT = path.join(ROOT, 'docs', 'itch', 'cover_630x500.png');
const SCALE = 4; // 1920/480: koordinat layar logis -> sampul penuh
const PATCH = { x: 92, y: 52, w: 296, h: 26, color: [0x16, 0x21, 0x3c] }; // sama dengan SUBTITLE_PATCH di Title.ts
const ACCENT = [0x86, 0xb4, 0xe8];
const TEXT = 'JEJAK TIGA SEKOLAH';
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?-:/'&";
const GLYPH = { w: 5, h: 7, advance: 6 };

const find = (name) => {
  const hit = [SRC, path.join(SRC, 'AFTER_SCHOOL')].map((d) => path.join(d, name)).find((p) => fs.existsSync(p));
  if (!hit) throw new Error(`make-cover: ${name} tidak ditemukan di ${SRC}`);
  return hit;
};

const cover = decodePng(find('17_THUMBNAIL/after_school_cover_1920x1080.png'));
const font = decodePng(find('15_UI/font_piksel_5x7.png'));
if (cover.w !== 1920 || cover.h !== 1080) throw new Error(`ukuran sampul tak terduga: ${cover.w}x${cover.h}`);

const setPx = (x, y, [r, g, b]) => {
  const i = (y * cover.w + x) * 4;
  cover.data[i] = r;
  cover.data[i + 1] = g;
  cover.data[i + 2] = b;
  cover.data[i + 3] = 255;
};

// 1) timpa subjudul
for (let y = PATCH.y * SCALE; y < (PATCH.y + PATCH.h) * SCALE; y++) {
  for (let x = PATCH.x * SCALE; x < (PATCH.x + PATCH.w) * SCALE; x++) setPx(x, y, PATCH.color);
}
// 2) tulis teks dengan font paket, diperbesar bulat (x8 = skala 2 di layar logis x4)
const GS = 2 * SCALE;
const textW = TEXT.length * GLYPH.advance * GS - GS;
const x0 = Math.round(cover.w / 2 - textW / 2);
const y0 = Math.round((PATCH.y + 14) * SCALE - (GLYPH.h * GS) / 2);
[...TEXT].forEach((ch, n) => {
  const gi = CHARS.indexOf(ch);
  if (gi < 0 || ch === ' ') return;
  for (let gy = 0; gy < GLYPH.h; gy++) {
    for (let gx = 0; gx < GLYPH.w; gx++) {
      if (font.data[(gy * font.w + gi * GLYPH.advance + gx) * 4 + 3] < 128) continue;
      for (let dy = 0; dy < GS; dy++) for (let dx = 0; dx < GS; dx++) setPx(x0 + n * GLYPH.advance * GS + gx * GS + dx, y0 + gy * GS + dy, ACCENT);
    }
  }
});

// 3) potong 1361x1080 di tengah (rasio 630:500) lalu perkecil dengan rata-rata area
const OW = 630;
const OH = 500;
const cropH = cover.h;
const cropW = Math.round((cropH * OW) / OH);
const cropX = Math.round((cover.w - cropW) / 2);
const out = Buffer.alloc(OW * OH * 4);
for (let oy = 0; oy < OH; oy++) {
  const sy0 = Math.floor((oy * cropH) / OH);
  const sy1 = Math.max(sy0 + 1, Math.floor(((oy + 1) * cropH) / OH));
  for (let ox = 0; ox < OW; ox++) {
    const sx0 = cropX + Math.floor((ox * cropW) / OW);
    const sx1 = Math.max(sx0 + 1, cropX + Math.floor(((ox + 1) * cropW) / OW));
    let r = 0, g = 0, b = 0, n = 0;
    for (let sy = sy0; sy < sy1; sy++) {
      for (let sx = sx0; sx < sx1; sx++) {
        const i = (sy * cover.w + sx) * 4;
        r += cover.data[i] ?? 0;
        g += cover.data[i + 1] ?? 0;
        b += cover.data[i + 2] ?? 0;
        n++;
      }
    }
    const o = (oy * OW + ox) * 4;
    out[o] = Math.round(r / n);
    out[o + 1] = Math.round(g / n);
    out[o + 2] = Math.round(b / n);
    out[o + 3] = 255;
  }
}

// 4) tulis PNG (RGBA 8-bit, filter 0)
const chunk = (type, data) => {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([head.subarray(4), data])) >>> 0, 0);
  return Buffer.concat([head, data, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(OW, 0);
ihdr.writeUInt32BE(OH, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const raw = Buffer.alloc((OW * 4 + 1) * OH);
for (let y = 0; y < OH; y++) out.copy(raw, y * (OW * 4 + 1) + 1, y * OW * 4, (y + 1) * OW * 4);
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, png);
console.log(`make-cover: ${path.relative(ROOT, OUT)} (${OW}x${OH}, ${png.length} byte)`);
