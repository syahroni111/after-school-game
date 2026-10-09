import { describe, expect, it } from 'vitest';
import { chooseZoom } from '../../src/systems/Display';
import { DEFAULT_KEYS } from '../../src/systems/InputManager';
import { keyLabel, rebind, resetBindings } from '../../src/systems/Rebind';
import { defaultSettings, migrateSettings } from '../../src/systems/Settings';
import { findInvalidChars } from '../../src/util/text';

describe('rebind', () => {
  it('menjadikan tombol baru tombol utama dan tidak mengubah masukan asli', () => {
    const b = rebind(DEFAULT_KEYS, 'light', 'KeyX');
    expect(b?.light).toEqual(['KeyX']);
    expect(DEFAULT_KEYS.light).toEqual(['KeyJ']);
  });
  it('tombol yang dipakai aksi lain dilepas dari aksi itu', () => {
    const b = rebind(DEFAULT_KEYS, 'light', 'KeyK'); // KeyK = heavy
    expect(b?.light).toEqual(['KeyK']);
    expect(b?.heavy).toEqual(['KeyJ']); // heavy kosong -> menerima tombol lama light
  });
  it('aksi dengan dua tombol hanya kehilangan tombol yang direbut', () => {
    const b = rebind(DEFAULT_KEYS, 'light', 'KeyA'); // KeyA = left (juga ArrowLeft)
    expect(b?.left).toEqual(['ArrowLeft']);
  });
  it('tombol terlarang dan aksi menu tidak bisa diatur', () => {
    expect(rebind(DEFAULT_KEYS, 'light', 'Enter')).toBeNull();
    expect(rebind(DEFAULT_KEYS, 'confirm', 'KeyX')).toBeNull();
  });
  it('tidak ada tombol ganda antar aksi yang bisa diatur setelah rebind berantai', () => {
    let b = resetBindings();
    for (const [a, k] of [
      ['light', 'KeyK'],
      ['heavy', 'KeyL'],
      ['guard', 'KeyJ'],
      ['special', 'KeyJ'],
    ] as const)
      b = rebind(b, a, k) ?? b;
    const seen = new Map<string, string>();
    for (const a of [
      'left',
      'right',
      'up',
      'down',
      'light',
      'heavy',
      'guard',
      'dodge',
      'special',
      'interact',
      'pause',
    ] as const) {
      expect(b[a].length, a).toBeGreaterThan(0);
      for (const k of b[a]) {
        expect(seen.get(k), `${k} ganda di ${a}`).toBeUndefined();
        seen.set(k, a);
      }
    }
  });
  it('label tombol hanya memakai karakter font', () => {
    for (const code of [
      'KeyJ',
      'Digit5',
      'ArrowLeft',
      'Space',
      'Escape',
      'ShiftLeft',
      'BracketLeft',
      'F7',
      'Numpad3',
    ]) {
      expect(findInvalidChars(keyLabel(code)), code).toEqual([]);
    }
    expect(keyLabel('KeyJ')).toBe('J');
    expect(keyLabel('ArrowLeft')).toBe('KIRI');
  });
  it('pengaturan tersimpan membawa tombol dan dibersihkan saat dimuat', () => {
    const s = defaultSettings();
    s.bindings = rebind(s.bindings, 'light', 'KeyZ') ?? s.bindings;
    const back = migrateSettings(JSON.parse(JSON.stringify(s)));
    expect(back.bindings.light).toEqual(['KeyZ']);
  });
});

describe('skala layar', () => {
  it('auto = zoom bulat terbesar; angka dibatasi oleh yang muat', () => {
    expect(chooseZoom(1920, 1080, 'auto')).toBe(4);
    expect(chooseZoom(1920, 1080, '2')).toBe(2);
    expect(chooseZoom(1000, 600, '4')).toBe(2);
    expect(chooseZoom(300, 200, '3')).toBe(1);
  });
});
