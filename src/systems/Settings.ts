// Pengaturan pemain (disimpan terpisah dari slot simpan): volume, skala layar, aksesibilitas, tombol.
import { DEFAULT_KEYS } from './InputManager';
import type { Action, Bindings } from './InputManager';

export type ScaleSetting = 'auto' | '2' | '3' | '4';

export interface Settings {
  version: number;
  musicVol: number; // 0..1
  sfxVol: number; // 0..1
  scale: ScaleSetting;
  showHitbox: boolean;
  reduceShake: boolean;
  reduceFlash: boolean;
  bindings: Bindings;
}

export const SETTINGS_VERSION = 1;

export function defaultSettings(): Settings {
  return {
    version: SETTINGS_VERSION,
    musicVol: 0.6,
    sfxVol: 0.8,
    scale: 'auto',
    showHitbox: false,
    reduceShake: false,
    reduceFlash: false,
    bindings: structuredClone(DEFAULT_KEYS),
  };
}

const clamp01 = (v: unknown, d: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d;

/** Membersihkan data tersimpan: nilai tak valid diganti bawaan, tombol hanya untuk aksi yang dikenal. */
export function migrateSettings(raw: unknown): Settings {
  const d = defaultSettings();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  const out: Settings = {
    ...d,
    musicVol: clamp01(r.musicVol, d.musicVol),
    sfxVol: clamp01(r.sfxVol, d.sfxVol),
    scale: r.scale === '2' || r.scale === '3' || r.scale === '4' || r.scale === 'auto' ? r.scale : d.scale,
    showHitbox: r.showHitbox === true,
    reduceShake: r.reduceShake === true,
    reduceFlash: r.reduceFlash === true,
  };
  if (r.bindings && typeof r.bindings === 'object') {
    for (const a of Object.keys(DEFAULT_KEYS) as Action[]) {
      const v = (r.bindings as Record<string, unknown>)[a];
      if (Array.isArray(v) && v.length > 0 && v.every((k) => typeof k === 'string'))
        out.bindings[a] = v as string[];
    }
  }
  return out;
}

/** Pengaturan aktif (satu per halaman). Dibaca oleh audio, ScreenFx, dan scene. */
export const settings: { current: Settings } = { current: defaultSettings() };
