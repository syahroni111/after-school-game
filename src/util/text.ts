// Aturan teks game (murni). Font piksel hanya punya karakter di FONT.chars (huruf kapital).
import { FONT } from '../generated/assetManifest';

const ALLOWED = new Set(FONT.chars);
export const ADVANCE = FONT.advance;
export const GLYPH_H = FONT.glyphH;
export const LINE_HEIGHT = GLYPH_H + 3;

/** Karakter di luar font (huruf kecil dihitung tidak valid). '\n' dipakai sebagai pemisah baris. */
export function findInvalidChars(text: string): string[] {
  const bad = new Set<string>();
  for (const ch of text) if (ch !== '\n' && !ALLOWED.has(ch)) bad.add(ch);
  return [...bad];
}

export const isValidGameText = (text: string): boolean => findInvalidChars(text).length === 0;

/** Pembersih runtime: kapital, pengganti tanda umum, karakter asing menjadi spasi. */
export function sanitizeText(text: string): string {
  const mapped = text
    .replace(/…/g, '...')
    .replace(/[‘’“”]/g, "'")
    .replace(/[–—]/g, '-')
    .toUpperCase();
  let out = '';
  for (const ch of mapped) out += ch === '\n' || ALLOWED.has(ch) ? ch : ' ';
  return out;
}

export const textWidth = (text: string): number => Math.max(0, text.length * ADVANCE - (ADVANCE - FONT.glyphW));

/** Bungkus kata ke baris maksimal `maxChars` karakter; '\n' memaksa baris baru. */
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const rawWord of paragraph.split(' ')) {
      let word = rawWord;
      while (word.length > maxChars) {
        if (line) {
          lines.push(line);
          line = '';
        }
        lines.push(word.slice(0, maxChars));
        word = word.slice(maxChars);
      }
      if (!word && !line) continue;
      if (!line) line = word;
      else if (line.length + 1 + word.length <= maxChars) line += ` ${word}`;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}
