// Cheat/alat debug lewat URL (?debug=1). Aman dibiarkan aktif di build rilis: tanpa parameter tidak berefek.
export interface DebugFlags {
  /** ?debug=1 */
  on: boolean;
  /** ?god=1: pemain tidak bisa kalah. */
  god: boolean;
  /** ?fast=1: dialog maju otomatis dengan cepat. */
  fast: boolean;
  /** ?chapter=ch02&step=0: lompat langsung ke bab/langkah. */
  chapter?: string;
  step: number;
  /** ?money=99999 */
  money?: number;
  /** ?power=8: pengali damage pemain (menguji alur tanpa menunggu pertarungan panjang). */
  power: number;
}

export function parseDebug(search: string): DebugFlags {
  const q = new URLSearchParams(search);
  const on = q.get('debug') === '1';
  const num = (k: string): number | undefined => {
    const v = q.get(k);
    return v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined;
  };
  return {
    on,
    god: on && q.get('god') === '1',
    fast: on && q.get('fast') === '1',
    chapter: on ? (q.get('chapter') ?? undefined) : undefined,
    step: on ? (num('step') ?? 0) : 0,
    money: on ? num('money') : undefined,
    power: on ? (num('power') ?? 1) : 1,
  };
}

export const debug: DebugFlags = parseDebug(typeof window === 'undefined' ? '' : window.location.search);
