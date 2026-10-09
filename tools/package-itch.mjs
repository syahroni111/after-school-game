// Membangun dist/, mengemas ISI dist/ menjadi release/after-school-web-v{versi}.zip, lalu memverifikasi paket untuk itch.io
// (CLAUDE.md §11). Gagal (exit 1) bila satu syarat saja tidak terpenuhi. Lintas platform (Node saja).
import AdmZip from 'adm-zip';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/fsx.mjs';

const LIMITS = { files: 1000, totalBytes: 500 * 1024 * 1024, fileBytes: 200 * 1024 * 1024, pathChars: 240 };
const args = new Set(process.argv.slice(2));

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const dist = path.join(ROOT, 'dist');
const releaseDir = path.join(ROOT, 'release');
const zipPath = path.join(releaseDir, `after-school-web-v${pkg.version}.zip`);

const fail = (msg) => {
  console.error(`package-itch: GAGAL: ${msg}`);
  process.exit(1);
};

function build() {
  if (!fs.existsSync(path.join(ROOT, 'public', 'assets'))) {
    fail('public/assets tidak ada. Jalankan `npm run prepare-assets` (butuh paket aset di D:\\ASET_PIXEL\\AFTER_SCHOOL atau env ASSET_SRC).');
  }
  fs.rmSync(dist, { recursive: true, force: true });
  const vite = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  const r = spawnSync(process.execPath, [vite, 'build'], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) fail('vite build gagal');
}

function createZip() {
  fs.mkdirSync(releaseDir, { recursive: true });
  fs.rmSync(zipPath, { force: true });
  const zip = new AdmZip();
  zip.addLocalFolder(dist); // isi dist/ (bukan foldernya): index.html berada di akar zip
  zip.writeZip(zipPath);
}

/** Mengambil path aset dari manifest yang di-commit (src/generated/assetManifest.ts). */
function manifestPaths() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'generated', 'assetManifest.ts'), 'utf8');
  return [...src.matchAll(/^\s*path: '([^']+)'/gm)].map((m) => m[1]);
}

const ABSOLUTE_URL = /(?:src|href)=["']\/(?!\/)|url\(\s*["']?\/(?!\/)|["'`]\/assets\//;
const TEXT_EXT = /\.(html|js|mjs|css|json|txt)$/i;

function verify() {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries().filter((e) => !e.isDirectory);
  const names = entries.map((e) => e.entryName);
  const problems = [];

  if (!names.includes('index.html')) problems.push('index.html tidak ada di akar zip');
  if (entries.length >= LIMITS.files) problems.push(`jumlah file ${entries.length} >= ${LIMITS.files}`);
  const total = entries.reduce((s, e) => s + e.header.size, 0);
  if (total >= LIMITS.totalBytes) problems.push(`total ${total} byte >= 500 MB`);
  for (const e of entries) {
    if (e.header.size >= LIMITS.fileBytes) problems.push(`berkas terlalu besar: ${e.entryName}`);
    if (e.entryName.length > LIMITS.pathChars) problems.push(`path terlalu panjang (${e.entryName.length}): ${e.entryName}`);
    if (e.entryName.includes('\\') || e.entryName.startsWith('/')) problems.push(`path tidak relatif: ${e.entryName}`);
  }

  for (const e of entries) {
    if (!TEXT_EXT.test(e.entryName)) continue;
    const text = e.getData().toString('utf8');
    const m = ABSOLUTE_URL.exec(text);
    if (m) problems.push(`path absolut di ${e.entryName}: ${text.slice(Math.max(0, m.index - 20), m.index + 40).replace(/\s+/g, ' ')}`);
  }

  const set = new Set(names);
  const missing = manifestPaths().filter((p) => !set.has(`assets/${p}`));
  if (missing.length > 0) problems.push(`${missing.length} aset manifest tidak ada di zip (huruf besar-kecil persis): ${missing.slice(0, 5).join(', ')}`);

  if (problems.length > 0) {
    for (const p of problems) console.error(`  - ${p}`);
    fail(`${problems.length} masalah`);
  }
  const mb = (n) => (n / 1024 / 1024).toFixed(1);
  console.log(`package-itch: OK  ${path.relative(ROOT, zipPath)}`);
  console.log(`  file: ${entries.length} (< ${LIMITS.files})   total: ${mb(total)} MB (< 500)   zip: ${mb(fs.statSync(zipPath).size)} MB`);
  console.log('  index.html di akar zip; tanpa path absolut; semua aset manifest cocok persis.');
}

if (!args.has('--verify-only')) {
  build();
  createZip();
}
if (!fs.existsSync(zipPath)) fail(`zip tidak ditemukan: ${zipPath}`);
verify();
