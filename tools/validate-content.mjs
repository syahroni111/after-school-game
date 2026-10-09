// Validasi konten. M1: manifest aset. Ditambah di milestone berikutnya (teks cerita, referensi).
// Memuat modul TypeScript lewat server Vite (mode SSR) agar import tanpa ekstensi tetap jalan.
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { ROOT, existsExact, pngSize } from './lib/fsx.mjs';

const errors = [];
const fail = (msg) => errors.push(msg);

const server = await createServer({
  root: ROOT,
  logLevel: 'silent',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const assetsDir = path.join(ROOT, 'public', 'assets');
  if (!fs.existsSync(assetsDir)) fail('public/assets belum ada. Jalankan: npm run prepare-assets');

  const manifest = await server.ssrLoadModule('/src/generated/assetManifest.ts');
  const entries = [...manifest.SHEETS, ...manifest.IMAGES];
  const keys = new Set();
  for (const e of entries) {
    if (keys.has(e.key)) fail(`key manifest ganda: ${e.key}`);
    keys.add(e.key);
    if (!existsExact(assetsDir, e.path)) {
      fail(`aset tidak ada (atau huruf besar-kecil berbeda): ${e.path}`);
      continue;
    }
    const { w, h } = pngSize(path.join(assetsDir, ...e.path.split('/')));
    if (w !== e.w || h !== e.h) fail(`ukuran ${e.path}: manifest ${e.w}x${e.h}, file ${w}x${h}`);
  }
  for (const s of manifest.SHEETS) {
    const frames = s.columns * Math.floor(s.h / s.frameH);
    for (const [anim, list] of Object.entries(s.animations)) {
      for (const i of list) if (i < 0 || i >= frames) fail(`${s.key}:${anim} merujuk frame ${i} di luar sheet (${frames})`);
    }
  }

  console.log(`validate-content: ${entries.length} entri manifest diperiksa.`);
} finally {
  await server.close();
}

if (errors.length) {
  console.error(`validate-content GAGAL (${errors.length} masalah):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('validate-content: OK');
