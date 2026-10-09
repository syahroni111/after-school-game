// Helper fs kecil yang dipakai beberapa skrip tooling (lintas platform, tanpa dependensi).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Cek keberadaan file dengan huruf besar-kecil PERSIS (Windows biasanya tidak membedakan). */
export function existsExact(baseDir, relPosix) {
  let dir = baseDir;
  for (const part of relPosix.split('/')) {
    let names;
    try {
      names = fs.readdirSync(dir);
    } catch {
      return false;
    }
    if (!names.includes(part)) return false;
    dir = path.join(dir, part);
  }
  return true;
}

/** Daftar semua file di bawah dir, sebagai path relatif berformat posix. */
export function walkFiles(dir, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walkFiles(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}

/** Baca lebar dan tinggi PNG dari header IHDR. */
export function pngSize(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    if (buf.toString('latin1', 1, 4) !== 'PNG') throw new Error(`Bukan PNG: ${file}`);
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } finally {
    fs.closeSync(fd);
  }
}
