// Mengatur ulang tombol (murni): satu tombol hanya boleh dipakai satu aksi yang bisa diatur; bentrok ditukar.
import { DEFAULT_KEYS, REBINDABLE } from './InputManager';
import type { Action, Bindings } from './InputManager';

const SPECIAL_LABEL: Readonly<Record<string, string>> = {
  ArrowLeft: 'KIRI',
  ArrowRight: 'KANAN',
  ArrowUp: 'ATAS',
  ArrowDown: 'BAWAH',
  Space: 'SPASI',
  Enter: 'ENTER',
  Escape: 'ESC',
  Backspace: 'BKSP',
  ShiftLeft: 'SHIFT',
  ShiftRight: 'SHIFT',
  ControlLeft: 'CTRL',
  ControlRight: 'CTRL',
  Tab: 'TAB',
};

/** Nama tombol yang bisa digambar font piksel (hanya A-Z, 0-9, spasi). */
export function keyLabel(code: string): string {
  const s = SPECIAL_LABEL[code];
  if (s) return s;
  const m = /^(?:Key|Digit|Numpad)([A-Z0-9])$/.exec(code);
  if (m) return m[1] as string;
  return (
    code
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6) || '?'
  );
}

/** Tombol yang tidak boleh dipakai sebagai tombol permainan (dipakai menu atau sistem). */
export const RESERVED_KEYS: readonly string[] = [
  'Enter',
  'F5',
  'F11',
  'F12',
  'Tab',
  'MetaLeft',
  'MetaRight',
  'AltLeft',
  'AltRight',
];

export const labelsFor = (b: Bindings, a: Action): string => b[a].map(keyLabel).join(' / ');

/**
 * Menjadikan `code` tombol utama `action`. Tombol itu dilepas dari aksi lain; bila aksi lain jadi kosong,
 * ia menerima tombol utama lama `action` (tukar). Mengembalikan kopi baru, atau null bila tombol terlarang.
 */
export function rebind(current: Bindings, action: Action, code: string): Bindings | null {
  if (!REBINDABLE.includes(action) || RESERVED_KEYS.includes(code)) return null;
  const next = structuredClone(current);
  const oldPrimary = next[action][0];
  for (const a of REBINDABLE) {
    if (a === action) continue;
    next[a] = next[a].filter((k) => k !== code);
    if (next[a].length === 0 && oldPrimary) next[a] = [oldPrimary];
  }
  next[action] = [code];
  return next;
}

export const resetBindings = (): Bindings => structuredClone(DEFAULT_KEYS);
