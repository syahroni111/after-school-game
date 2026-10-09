// Memetakan (tokoh, ekspresi) ke gambar potret. Tokoh dengan potret 96x96 memakainya; lainnya memakai wajah dari sheet _ekspresi.
import { hasTexture } from './assetIndex';
import { CHARACTERS } from './characters';
import type { Expr } from './cutscene';

/** Urutan frame potret 96x96: netral, serius, marah, percaya_diri, khawatir, terkejut. */
export const PORTRAIT_FRAME: Readonly<Record<Expr, number>> = { netral: 0, serius: 1, marah: 2, percaya_diri: 3, khawatir: 4, terkejut: 5 };

/**
 * Indeks wajah di sheet `_ekspresi` (urutan: netral, fokus, marah, tekad, terkejut, gugup, percaya_diri,
 * lelah, frustrasi, sakit, teriak). Tampak depan = indeks + 11.
 */
export const EXPR_FRONT_FRAME: Readonly<Record<Expr, number>> = { netral: 11, serius: 12, marah: 13, percaya_diri: 17, khawatir: 16, terkejut: 15 };

export type PortraitSpec =
  | { kind: 'portrait'; key: string; frame: number; rival: boolean }
  | { kind: 'small'; key: string; frame: number };

export function portraitFor(charKey: string, expr: Expr = 'netral'): PortraitSpec | null {
  const def = CHARACTERS[charKey];
  if (!def) return null;
  if (def.portrait && hasTexture(`portrait:${charKey}`)) {
    return { kind: 'portrait', key: `portrait:${charKey}`, frame: PORTRAIT_FRAME[expr], rival: def.school === 'east' };
  }
  const key = `char:${charKey}:expr`;
  return hasTexture(key) ? { kind: 'small', key, frame: EXPR_FRONT_FRAME[expr] } : null;
}
