// Data kemajuan pemain (murni). Disimpan oleh SaveSystem; dibaca Stage, Hub, Shop, Dojo.
import { baseStats } from '../data/characters';
import type { Difficulty } from '../data/difficulty';
import type { FighterStats, Unlocks } from '../entities/Fighter';

export const PROFILE_VERSION = 1;

export interface StatBonus {
  kekuatan: number;
  ketahanan: number;
  kecepatan: number;
  stamina: number;
  hpMaks: number;
}

export type FlagValue = boolean | number | string;

export interface Profile {
  version: number;
  chapter: string; // id bab yang sedang/akan dimainkan, mis. 'ch00'
  step: number; // indeks langkah di dalam bab
  flags: Record<string, FlagValue>;
  money: number;
  bonus: StatBonus;
  moves: Unlocks;
  foodBought: Record<string, boolean>;
  archives: string[];
  ranks: Record<string, string>;
  unlockedChars: string[];
  selectedChar: string;
  sideQuests: Record<string, 'aktif' | 'selesai'>;
  difficulty: Difficulty;
  playMs: number;
  /** Mode bebas dan boss rush terbuka setelah tamat. */
  cleared: boolean;
  /** HP saat ini (terbawa antar layar). Kosong = penuh. */
  hp?: number;
  /** Buff sekali pakai dari makanan, dipakai di layar berikutnya. */
  buff?: { kuat?: boolean };
  /** Lokasi Waktu Bebas terakhir. */
  hubLocation?: string;
}

export function newProfile(): Profile {
  return {
    version: PROFILE_VERSION,
    chapter: 'ch00',
    step: 0,
    flags: {},
    money: 0,
    bonus: { kekuatan: 0, ketahanan: 0, kecepatan: 0, stamina: 0, hpMaks: 0 },
    moves: { badan: false, dash: false, push: false, counter: false, doubleFinisher: false },
    foodBought: {},
    archives: [],
    ranks: {},
    unlockedChars: ['A01_protagonis'],
    selectedChar: 'A01_protagonis',
    sideQuests: {},
    difficulty: 'normal',
    playMs: 0,
    cleared: false,
  };
}

/** Statistik petarung pemain = dasar tokoh + bonus permanen dari Kantin. */
export function playerStats(profile: Profile, charKey = profile.selectedChar): FighterStats {
  const b = baseStats(charKey);
  const k = profile.bonus;
  return {
    maxHp: b.maxHp + k.hpMaks,
    maxStamina: b.maxStamina + k.stamina,
    power: b.power * (1 + 0.04 * k.kekuatan),
    defense: b.defense + k.ketahanan,
    speed: b.speed * (1 + 0.03 * k.kecepatan),
  };
}

export function hasFlag(profile: Profile, key: string): boolean {
  const v = profile.flags[key];
  return v !== undefined && v !== false && v !== 0 && v !== '';
}
