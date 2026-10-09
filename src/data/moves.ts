// Definisi jurus dan "rasa pukulan" (GDD §4.5). Semua angka ada di sini, bukan di kode.
import { msToTicks } from '../util/math';

export type MoveId = 'jab' | 'straight' | 'hook' | 'heavy' | 'bodyBlow' | 'counter' | 'push' | 'dashStraight';

export interface HitFeel {
  /** Nama efek (`fx:{nama}`) yang dimunculkan di titik kena. */
  fx: readonly string[];
  hitstopMs: number;
  shake: number;
  /** Alpha flash layar (kilat_layar), 0 = tanpa. */
  flash?: number;
  sfx: string;
}

export interface MoveDef {
  id: MoveId;
  anim: string;
  damage: number;
  reaction: 'stagger' | 'knockdown';
  /** Lama hitstun (tick) bila reaction = stagger. */
  hitstunTicks: number;
  /** Kecepatan knockback awal (px/tick) bila knockdown. */
  knockback: number;
  breaker: boolean;
  /** Mengenai semua arah dalam jangkauan (Dorongan Semangat). */
  radial: boolean;
  hpCost: number;
  feel: HitFeel;
}

export const MOVES: Readonly<Record<MoveId, MoveDef>> = {
  jab: {
    id: 'jab',
    anim: 'pukulan_cepat',
    damage: 4,
    reaction: 'stagger',
    hitstunTicks: 44,
    knockback: 0,
    breaker: false,
    radial: false,
    hpCost: 0,
    feel: { fx: ['impact_kecil'], hitstopMs: 40, shake: 0, sfx: 'hit_light' },
  },
  straight: {
    id: 'straight',
    anim: 'pukulan_lurus',
    damage: 6,
    reaction: 'stagger',
    hitstunTicks: 50,
    knockback: 0,
    breaker: false,
    radial: false,
    hpCost: 0,
    feel: { fx: ['impact_sedang', 'serpihan_piksel'], hitstopMs: 60, shake: 1, sfx: 'hit_mid' },
  },
  hook: {
    id: 'hook',
    anim: 'pukulan_kait',
    damage: 7,
    reaction: 'stagger',
    hitstunTicks: 56,
    knockback: 0,
    breaker: false,
    radial: false,
    hpCost: 0,
    feel: { fx: ['impact_sedang', 'serpihan_piksel'], hitstopMs: 60, shake: 1, sfx: 'hit_mid' },
  },
  heavy: {
    id: 'heavy',
    anim: 'pukulan_berat',
    damage: 14,
    reaction: 'knockdown',
    hitstunTicks: 0,
    knockback: 2.4,
    breaker: false,
    radial: false,
    hpCost: 0,
    feel: {
      fx: ['impact_berat', 'gelombang_kejut', 'debu_ledak'],
      hitstopMs: 110,
      shake: 3,
      sfx: 'hit_heavy',
    },
  },
  bodyBlow: {
    id: 'bodyBlow',
    anim: 'pukulan_badan',
    damage: 7,
    reaction: 'stagger',
    hitstunTicks: 50,
    knockback: 0,
    breaker: true,
    radial: false,
    hpCost: 0,
    feel: { fx: ['impact_sedang', 'impact_lingkaran'], hitstopMs: 70, shake: 1, sfx: 'hit_mid' },
  },
  counter: {
    id: 'counter',
    anim: 'serangan_balik',
    damage: 16,
    reaction: 'knockdown',
    hitstunTicks: 0,
    knockback: 2.8,
    breaker: false,
    radial: false,
    hpCost: 0,
    feel: { fx: ['kilat_impact', 'starburst'], hitstopMs: 140, shake: 3, flash: 0.35, sfx: 'hit_counter' },
  },
  push: {
    id: 'push',
    anim: 'dorong',
    damage: 8,
    reaction: 'knockdown',
    hitstunTicks: 0,
    knockback: 3.0,
    breaker: false,
    radial: true,
    hpCost: 12,
    feel: { fx: ['ledakan_burst', 'gelombang_kejut'], hitstopMs: 120, shake: 4, sfx: 'hit_special' },
  },
  dashStraight: {
    id: 'dashStraight',
    anim: 'pukulan_lurus',
    damage: 8,
    reaction: 'stagger',
    hitstunTicks: 54,
    knockback: 0,
    breaker: false,
    radial: false,
    hpCost: 0,
    feel: {
      fx: ['impact_sedang', 'serpihan_piksel', 'garis_kecepatan_horizontal'],
      hitstopMs: 70,
      shake: 1,
      sfx: 'hit_mid',
    },
  },
};

/** Rantai kombo ringan: tiap tekanan J memajukan satu langkah. Langkah terakhir = finisher. */
export const COMBO_CHAIN: readonly MoveId[] = ['jab', 'straight', 'hook', 'heavy'];

/** Efek pada kejadian lain (GDD §4.5). */
export const BLOCK_FEEL: HitFeel = { fx: ['impact_arah'], hitstopMs: 30, shake: 0, sfx: 'block' };
export const PARRY_FEEL: HitFeel = { fx: ['aksen_energi_biru'], hitstopMs: 80, shake: 0, sfx: 'parry' };
export const KO_FEEL: HitFeel = { fx: ['debu_ledak'], hitstopMs: 160, shake: 2, sfx: 'ko' };
export const BOSS_KO_FEEL: HitFeel = {
  fx: ['debu_ledak', 'impact_lingkaran'],
  hitstopMs: 300,
  shake: 4,
  sfx: 'ko_boss',
};
export const LAND_FEEL: HitFeel = { fx: ['dampak_tanah'], hitstopMs: 0, shake: 0, sfx: 'land' };

export const KO_SLOWMO = { scale: 0.4, ms: 300 };

export const hitstopTicks = (feel: HitFeel): number => (feel.hitstopMs > 0 ? msToTicks(feel.hitstopMs) : 0);

/** Semua nama efek yang dirujuk data jurus (dipakai test untuk memvalidasi terhadap manifest). */
export function allFxNames(): string[] {
  const names = new Set<string>();
  for (const f of [
    ...Object.values(MOVES).map((m) => m.feel),
    BLOCK_FEEL,
    PARRY_FEEL,
    KO_FEEL,
    BOSS_KO_FEEL,
    LAND_FEEL,
  ]) {
    for (const n of f.fx) names.add(n);
  }
  return [...names];
}
