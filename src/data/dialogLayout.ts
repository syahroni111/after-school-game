// Tata letak kotak dialog (piksel layar 480x270). Dipakai DialogBox dan validator teks.
import { LOGICAL_W } from '../config';
import { ADVANCE } from '../util/text';

export const DIALOG = {
  boxX: 8,
  boxY: 200,
  boxW: LOGICAL_W - 16,
  boxH: 62,
  portraitFrame: 104,
  portraitInner: 96,
  smallFrame: 36,
  padX: 12,
  nameY: 7,
  textY: 19,
  maxLines: 3,
  /** Efek ketik: 40 karakter per detik. */
  charsPerSecond: 40,
} as const;

/** Lebar area teks bila ada potret di satu sisi (potret di atas-kiri/kanan kotak). */
export function textAreaWidth(hasPortrait: boolean): number {
  const portrait = hasPortrait ? DIALOG.portraitFrame + 4 : 0;
  return DIALOG.boxW - DIALOG.padX * 2 - portrait;
}

/** Jumlah karakter maksimum per baris, dihitung dari lebar kotak. */
export function dialogMaxChars(hasPortrait: boolean): number {
  return Math.floor(textAreaWidth(hasPortrait) / ADVANCE);
}
