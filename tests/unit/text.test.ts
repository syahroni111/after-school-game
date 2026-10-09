import { describe, expect, it } from 'vitest';
import { findInvalidChars, isValidGameText, sanitizeText, textWidth, wrapText } from '../../src/util/text';

describe('aturan teks game', () => {
  it('huruf kecil dinyatakan tidak valid', () => {
    expect(isValidGameText('Halo dunia')).toBe(false);
    expect(findInvalidChars('Halo')).toEqual(['a', 'l', 'o']);
  });
  it('karakter yang tidak ada di font tidak valid', () => {
    for (const bad of ['"KUTIP"', '(KURUNG)', 'A;B', '50%', 'SEPERTI INI…']) expect(isValidGameText(bad), bad).toBe(false);
  });
  it('semua karakter font valid', () => {
    expect(isValidGameText("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?-:/'&")).toBe(true);
    expect(isValidGameText('BARIS SATU\nBARIS DUA')).toBe(true);
  });
  it('sanitizeText: kapital, tanda umum dipetakan, karakter asing jadi spasi', () => {
    expect(sanitizeText('halo, dunia!')).toBe('HALO, DUNIA!');
    expect(sanitizeText('hai…')).toBe('HAI...');
    expect(sanitizeText('a(b)c')).toBe('A B C');
    expect(isValidGameText(sanitizeText('Aneh; "teks" 50%'))).toBe(true);
  });
  it('lebar teks memakai advance 6 dan glyph 5', () => {
    expect(textWidth('')).toBe(0);
    expect(textWidth('AB')).toBe(11);
  });
  it('wrapText membungkus per kata dan menghormati baris baru', () => {
    expect(wrapText('SATU DUA TIGA EMPAT', 9)).toEqual(['SATU DUA', 'TIGA', 'EMPAT']);
    expect(wrapText('A\nB', 10)).toEqual(['A', 'B']);
    expect(wrapText('KATAPANJANGSEKALI', 6)).toEqual(['KATAPA', 'NJANGS', 'EKALI']);
  });
});
