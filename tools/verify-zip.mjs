/* global window, document -- dipakai di dalam page.evaluate (konteks browser) */
// Menguji zip rilis seperti di itch.io: ekstrak ke folder sementara, sajikan dari SUBFOLDER (path relatif harus tetap bekerja),
// buka di Chrome lewat Playwright, dan pastikan game sampai ke Title tanpa 404 atau error konsol.
import AdmZip from 'adm-zip';
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './lib/fsx.mjs';

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const zipPath = path.join(ROOT, 'release', `after-school-web-v${pkg.version}.zip`);
if (!fs.existsSync(zipPath)) {
  console.error(`verify-zip: zip tidak ada: ${zipPath} (jalankan npm run package:itch)`);
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};
const SUBPATH = '/html/12345/'; // mirip pola folder itch.io

const extract = fs.mkdtempSync(path.join(os.tmpdir(), 'afterschool-zip-'));
new AdmZip(zipPath).extractAllTo(extract, true);

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (!url.startsWith(SUBPATH)) {
    res.writeHead(404).end('di luar subfolder');
    return;
  }
  const rel = url.slice(SUBPATH.length) || 'index.html';
  const file = path.join(extract, rel);
  if (!file.startsWith(extract) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end('tidak ada');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const errors = [];
const bad = [];
let code = 0;
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('response', (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`));
  await page.goto(`http://127.0.0.1:${port}${SUBPATH}index.html`);
  await page.waitForFunction(() => window.__game?.scene.isActive('Title') === true, null, { timeout: 60_000 }).catch(() => undefined);
  const info = await page.evaluate(() => {
    const g = window.__game;
    const c = document.querySelector('canvas');
    return { title: g?.scene.isActive('Title') ?? false, w: c?.clientWidth ?? 0, h: c?.clientHeight ?? 0 };
  });
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });
  await page.waitForFunction(() => window.__game?.scene.isActive('MainMenu') === true, null, { timeout: 15_000 }).catch(() => undefined);
  const menu = await page.evaluate(() => window.__game?.scene.isActive('MainMenu') ?? false);
  const zoomOk = info.w % 480 === 0 && info.h % 270 === 0 && info.w / 480 === info.h / 270;
  console.log(`verify-zip: Title=${info.title} MainMenu=${menu} kanvas=${info.w}x${info.h} zoomBulat=${zoomOk} 404=${bad.length} errorKonsol=${errors.length}`);
  if (!info.title || !menu || !zoomOk || bad.length > 0 || errors.length > 0) {
    for (const b of bad) console.error(`  404: ${b}`);
    for (const e of errors) console.error(`  error: ${e}`);
    code = 1;
  } else {
    console.log('verify-zip: OK (disajikan dari subfolder, path relatif bekerja)');
  }
} finally {
  await browser.close();
  server.close();
  fs.rmSync(extract, { recursive: true, force: true });
}
process.exit(code);
