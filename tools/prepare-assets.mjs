// Membaca paket aset AFTER_SCHOOL (hanya-baca), menyalin aset terpilih ke public/assets
// dengan path dan huruf besar-kecil yang sama, lalu menulis src/generated/assetManifest.ts.
// Idempoten: public/assets dibuat ulang setiap dijalankan.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, pngSize, walkFiles } from './lib/fsx.mjs';

const DEST = path.join(ROOT, 'public', 'assets');
const MANIFEST_OUT = path.join(ROOT, 'src', 'generated', 'assetManifest.ts');

// Properti opsional yang benar-benar dipakai game (ASSET_MAP §6). Tambahkan di sini bila perlu.
const PROPS = [
  '07_CLASSROOM/buku_catatan',
  '07_CLASSROOM/jam_sekolah',
  '07_CLASSROOM/rak_buku',
  '08_HALLWAY/lemari_piala',
  '08_HALLWAY/papan_pengumuman',
  '10_COURTYARD/bangku_taman',
  '12_PROPS/mesin_minuman',
  '12_PROPS/konter_kantin',
  '12_PROPS/piano',
  '12_PROPS/gitar',
  '12_PROPS/meja_osis',
];
const COVERS = ['240x135', '320x180'];
const UI_SKIP = new Set(['hud_contoh']);
const WEATHER_RE = /^(.*)_(cerah|berawan|hujan|sore|malam)$/;

function findSource() {
  const candidates = [
    process.env.ASSET_SRC,
    'D:\\ASET_PIXEL\\AFTER_SCHOOL',
    path.join(ROOT, 'AFTER_SCHOOL'),
  ].filter(Boolean);
  const tried = [];
  for (const dir of candidates) {
    tried.push(dir);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    if (fs.existsSync(path.join(dir, 'metadata.json'))) return dir;
    for (const sub of fs.readdirSync(dir, { withFileTypes: true })) {
      if (sub.isDirectory() && fs.existsSync(path.join(dir, sub.name, 'metadata.json')))
        return path.join(dir, sub.name);
    }
  }
  console.error('GAGAL: metadata.json paket AFTER_SCHOOL tidak ditemukan. Sudah dicoba:');
  for (const t of tried) console.error(`  - ${t}`);
  console.error(
    'Set env ASSET_SRC ke folder paket (yang berisi metadata.json atau satu subfolder di bawahnya).',
  );
  process.exit(1);
}

const SRC = findSource();
const meta = JSON.parse(fs.readFileSync(path.join(SRC, 'metadata.json'), 'utf8'));
const allFiles = new Set(walkFiles(SRC));
console.log(`Sumber aset: ${SRC} (${allFiles.size} file)`);

const items = []; // { rel, key, group }
const add = (rel, key, group) => {
  if (!allFiles.has(rel)) throw new Error(`File tidak ada di paket: ${rel}`);
  items.push({ rel, key, group });
};
const pngsIn = (dir) =>
  [...allFiles].filter(
    (f) => f.startsWith(`${dir}/`) && f.endsWith('.png') && !f.slice(dir.length + 1).includes('/'),
  );
const stem = (rel) => path.posix.basename(rel, '.png');

// Karakter: hanya sheet samping_kanan (kiri = flipX), depan_belakang, dan ekspresi.
for (const f of [...allFiles].filter((x) => /^01_CHARACTERS\/[^/]+\/[^/]+\.png$/.test(x))) {
  const key = f.split('/')[1];
  const s = stem(f);
  if (s === `${key}_samping_kanan`) add(f, `char:${key}:side`, 'char');
  else if (s === `${key}_depan_belakang`) add(f, `char:${key}:fb`, 'char');
  else if (s === `${key}_ekspresi`) add(f, `char:${key}:expr`, 'char');
}
for (const f of pngsIn('16_PORTRAITS')) add(f, `portrait:${stem(f).replace(/_potret$/, '')}`, 'portrait');
for (const f of pngsIn('06_SCHOOL_TILES/stage')) add(f, `stage:${stem(f)}`, 'stage');
for (const f of pngsIn('13_WEATHER')) {
  const s = stem(f);
  const m = WEATHER_RE.exec(s);
  if (s === 'overlay_hujan_480x270') add(f, 'fx:overlay_hujan', 'weather');
  else if (m) add(f, `stage:${m[1]}:${m[2]}`, 'weather');
  else throw new Error(`Nama file cuaca tak dikenal: ${f}`);
}
for (const dir of [
  '04_COMBAT_EFFECTS',
  '04_COMBAT_EFFECTS/kecepatan',
  '04_COMBAT_EFFECTS/sinematik_480x270',
  '14_ENVIRONMENT_EFFECTS',
]) {
  for (const f of pngsIn(dir)) add(f, `fx:${stem(f)}`, 'fx');
}
for (const f of pngsIn('05_NPC')) add(f, `npc:${stem(f)}`, 'npc');
for (const f of pngsIn('05_NPC/formasi').filter((x) => x.endsWith('_transparan.png'))) {
  add(f, `npc:formasi:${stem(f).replace(/_transparan$/, '')}`, 'npc');
}
for (const f of pngsIn('15_UI')) if (!UI_SKIP.has(stem(f))) add(f, `ui:${stem(f)}`, 'ui');
for (const p of PROPS) add(`${p}.png`, `prop:${p}`, 'prop');
for (const c of COVERS) add(`17_THUMBNAIL/after_school_cover_${c}.png`, `cover:${c}`, 'cover');

// Key unik
const seen = new Map();
for (const it of items) {
  if (seen.has(it.key)) throw new Error(`Key ganda: ${it.key} (${seen.get(it.key)} dan ${it.rel})`);
  seen.set(it.key, it.rel);
}

// Salin (bangun ulang folder tujuan agar idempoten dan tidak ada sisa file lama).
fs.rmSync(DEST, { recursive: true, force: true });
for (const it of items) {
  const out = path.join(DEST, ...it.rel.split('/'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(path.join(SRC, ...it.rel.split('/')), out);
}

// Manifest
const sheets = [];
const images = [];
const warnings = [];
let font = null;
for (const it of items) {
  const { w, h } = pngSize(path.join(DEST, ...it.rel.split('/')));
  const m = meta.sheets[it.rel];
  if (m && m.frame_w) {
    const cols = m.columns;
    const expectW = cols * m.frame_w;
    const expectH = Math.ceil(m.count / cols) * m.frame_h;
    if (w !== expectW || h < expectH)
      warnings.push(`${it.rel}: PNG ${w}x${h}, metadata mengharapkan ${expectW}x${expectH}`);
    const e = {
      key: it.key,
      path: it.rel,
      w,
      h,
      frameW: m.frame_w,
      frameH: m.frame_h,
      columns: cols,
      count: m.count,
    };
    if (m.origin) e.origin = m.origin;
    if (m.fps) e.fps = m.fps;
    e.animations = m.animations ?? {};
    sheets.push(e);
  } else {
    const e = { key: it.key, path: it.rel, w, h };
    if (m?.nine_slice) e.nineSlice = m.nine_slice;
    images.push(e);
    if (m?.glyph_w)
      font = { key: it.key, glyphW: m.glyph_w, glyphH: m.glyph_h, advance: m.advance, chars: m.chars };
  }
}
if (!font) throw new Error('Info font (font_piksel_5x7) tidak ditemukan di metadata.');

const stageMeta = meta.sheets['06_SCHOOL_TILES/stage/halaman.png'];
const walkArea = stageMeta?.walk_area_y ?? [160, 266];

const ts = `// GENERATED oleh tools/prepare-assets.mjs. Jangan edit manual; jalankan \`npm run prepare-assets\`.
export interface SheetEntry {
  key: string;
  path: string;
  w: number;
  h: number;
  frameW: number;
  frameH: number;
  columns: number;
  count: number;
  origin?: readonly [number, number];
  fps?: number;
  animations: Readonly<Record<string, readonly number[]>>;
}
export interface ImageEntry {
  key: string;
  path: string;
  w: number;
  h: number;
  nineSlice?: readonly [number, number, number, number];
}
export interface FontEntry {
  key: string;
  glyphW: number;
  glyphH: number;
  advance: number;
  chars: string;
}

export const SHEETS: readonly SheetEntry[] = [
${sheets.map((s) => `  ${JSON.stringify(s)},`).join('\n')}
];

export const IMAGES: readonly ImageEntry[] = [
${images.map((s) => `  ${JSON.stringify(s)},`).join('\n')}
];

export const FONT: FontEntry = ${JSON.stringify(font)};
export const WALK_AREA_Y: readonly [number, number] = ${JSON.stringify(walkArea)};
export const PALETTE: readonly string[] = ${JSON.stringify(meta.palette ?? [])};
`;
fs.mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });
fs.writeFileSync(MANIFEST_OUT, ts);

const byGroup = {};
for (const it of items) byGroup[it.group] = (byGroup[it.group] ?? 0) + 1;
const core = items.length - (byGroup.prop ?? 0);
console.log(`Disalin ${items.length} file ke public/assets (inti tanpa properti: ${core}).`);
console.log(
  `Per grup: ${Object.entries(byGroup)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')}`,
);
console.log(
  `Manifest: ${sheets.length} spritesheet + ${images.length} gambar -> ${path.relative(ROOT, MANIFEST_OUT)}`,
);
for (const w of warnings) console.warn(`PERINGATAN: ${w}`);
if (warnings.length) process.exitCode = 1;
