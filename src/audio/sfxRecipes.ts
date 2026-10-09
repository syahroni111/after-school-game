// Resep efek suara gaya sfxr (murni data): osilator + luncuran frekuensi + envelope + noise. Dimainkan oleh Sfx.ts.
import type { SfxName } from './names';

export type SfxWave = 'square' | 'saw' | 'triangle' | 'sine';

export interface SfxRecipe {
  wave: SfxWave;
  /** Frekuensi awal dan akhir (Hz); meluncur eksponensial selama `dur`. 0 = tanpa nada (hanya noise). */
  f0: number;
  f1: number;
  /** Durasi detik. */
  dur: number;
  vol: number;
  /** Campuran noise 0..1 (derau putih disaring bandpass di sekitar `noiseHz`). */
  noise?: number;
  noiseHz?: number;
  /** Getar: [laju Hz, kedalaman Hz]. */
  vibrato?: readonly [number, number];
  /** Nada tambahan berurutan: [jeda detik, kelipatan f0]; dipakai efek UI/uang. */
  arp?: readonly (readonly [number, number])[];
  /** Waktu naik (detik); bawaan 0,004. */
  attack?: number;
}

export const SFX_RECIPES: Readonly<Record<SfxName, SfxRecipe>> = {
  swing: { wave: 'saw', f0: 520, f1: 180, dur: 0.1, vol: 0.18, noise: 0.5, noiseHz: 2400 },
  swing_heavy: { wave: 'saw', f0: 380, f1: 90, dur: 0.18, vol: 0.24, noise: 0.6, noiseHz: 1500 },
  hit_light: { wave: 'square', f0: 300, f1: 90, dur: 0.07, vol: 0.28, noise: 0.5, noiseHz: 3000 },
  hit_mid: { wave: 'square', f0: 240, f1: 60, dur: 0.11, vol: 0.34, noise: 0.55, noiseHz: 2200 },
  hit_heavy: { wave: 'saw', f0: 180, f1: 40, dur: 0.22, vol: 0.46, noise: 0.7, noiseHz: 1200 },
  hit_counter: {
    wave: 'square',
    f0: 620,
    f1: 70,
    dur: 0.2,
    vol: 0.42,
    noise: 0.5,
    noiseHz: 2600,
    arp: [[0.05, 1.5]],
  },
  hit_special: {
    wave: 'saw',
    f0: 140,
    f1: 35,
    dur: 0.34,
    vol: 0.5,
    noise: 0.75,
    noiseHz: 900,
    vibrato: [18, 12],
  },
  block: { wave: 'square', f0: 900, f1: 500, dur: 0.07, vol: 0.22, noise: 0.35, noiseHz: 4200 },
  parry: { wave: 'triangle', f0: 1300, f1: 1900, dur: 0.16, vol: 0.34, arp: [[0.06, 1.34]] },
  guard_up: { wave: 'triangle', f0: 380, f1: 560, dur: 0.07, vol: 0.14 },
  guard_break: { wave: 'saw', f0: 520, f1: 60, dur: 0.3, vol: 0.4, noise: 0.6, noiseHz: 1800 },
  dodge: { wave: 'sine', f0: 700, f1: 260, dur: 0.12, vol: 0.14, noise: 0.35, noiseHz: 3500 },
  dash: { wave: 'saw', f0: 260, f1: 520, dur: 0.12, vol: 0.14, noise: 0.5, noiseHz: 2800 },
  land: { wave: 'square', f0: 120, f1: 45, dur: 0.12, vol: 0.28, noise: 0.5, noiseHz: 700 },
  ko: { wave: 'saw', f0: 420, f1: 55, dur: 0.46, vol: 0.4, noise: 0.5, noiseHz: 1400, vibrato: [9, 18] },
  ko_boss: {
    wave: 'saw',
    f0: 520,
    f1: 38,
    dur: 0.9,
    vol: 0.46,
    noise: 0.6,
    noiseHz: 1000,
    vibrato: [7, 24],
    arp: [[0.25, 0.6]],
  },
  telegraph: { wave: 'square', f0: 1100, f1: 1100, dur: 0.1, vol: 0.12, arp: [[0.07, 1.25]] },
  charge_ready: { wave: 'triangle', f0: 600, f1: 1500, dur: 0.18, vol: 0.2 },
  step: { wave: 'square', f0: 90, f1: 60, dur: 0.035, vol: 0.06, noise: 0.7, noiseHz: 1200 },
  ui_move: { wave: 'square', f0: 660, f1: 660, dur: 0.035, vol: 0.12 },
  ui_confirm: { wave: 'square', f0: 520, f1: 520, dur: 0.07, vol: 0.16, arp: [[0.06, 1.5]] },
  ui_back: { wave: 'square', f0: 420, f1: 260, dur: 0.09, vol: 0.14 },
  money: { wave: 'square', f0: 1250, f1: 1250, dur: 0.06, vol: 0.14, arp: [[0.06, 1.5]] },
  unlock: {
    wave: 'triangle',
    f0: 523,
    f1: 523,
    dur: 0.1,
    vol: 0.28,
    arp: [
      [0.1, 1.25],
      [0.2, 1.5],
      [0.3, 2],
    ],
  },
  archive: {
    wave: 'sine',
    f0: 880,
    f1: 880,
    dur: 0.14,
    vol: 0.26,
    arp: [
      [0.12, 1.5],
      [0.24, 1.25],
    ],
  },
  text: { wave: 'square', f0: 480, f1: 470, dur: 0.018, vol: 0.05 },
  door: { wave: 'saw', f0: 160, f1: 70, dur: 0.18, vol: 0.2, noise: 0.5, noiseHz: 800 },
  bell: { wave: 'sine', f0: 1046, f1: 1040, dur: 0.6, vol: 0.28, vibrato: [5, 4], arp: [[0.02, 2.01]] },
};
