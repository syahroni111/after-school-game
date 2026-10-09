// Nama tokoh dan pemetaannya ke kunci aset (GDD §2). File aset tidak pernah diganti namanya.
import type { FighterStats } from '../entities/Fighter';

export type School = 'north' | 'east' | 'south' | 'staff';

export interface CharacterDef {
  key: string; // kunci aset, mis. A01_protagonis
  name: string; // nama di game (kapital)
  school: School;
  role: string;
  /** Punya potret 96x96 di 16_PORTRAITS. */
  portrait: boolean;
  playable: boolean;
  hp: number;
}

const c = (
  key: string,
  name: string,
  school: School,
  role: string,
  portrait: boolean,
  playable: boolean,
  hp: number,
): CharacterDef => ({
  key,
  name,
  school,
  role,
  portrait,
  playable,
  hp,
});

export const CHARACTERS: Readonly<Record<string, CharacterDef>> = Object.fromEntries(
  [
    c('A01_protagonis', 'RAKA', 'north', 'PROTAGONIS', true, true, 100),
    c('A02_sahabat', 'DIMAS', 'north', 'SAHABAT', true, true, 120),
    c('A03_murid_pendiam', 'FAJAR', 'north', 'ANAK PENDIAM', false, false, 80),
    c('A04_murid_atletis', 'BIMA', 'north', 'KAPTEN BASKET', false, false, 90),
    c('A05_ketua_kelas', 'LARAS', 'north', 'KETUA KELAS', true, false, 80),
    c('A06_murid_enerjik', 'TIARA', 'north', 'KLUB MUSIK', false, false, 80),
    c('A07_petarung_bertahan', 'GILANG', 'north', 'KETUA BELA DIRI', false, false, 110),
    c('A08_petarung_cepat', 'BAYU', 'north', 'PETARUNG CEPAT', true, true, 90),
    c('B01_pemimpin_rival', 'ARGA', 'east', 'PEMIMPIN EAST BLOCK', true, true, 110),
    c('B02_wakil_rival', 'SEKAR', 'east', 'WAKIL EAST BLOCK', true, false, 90),
    c('B03_rival_atletis', 'RENDY', 'east', 'PETARUNG DASH', false, false, 90),
    c('B04_rival_agresif', 'JAKA', 'east', 'AGRESIF', true, false, 90),
    c('B05_rival_bertahan', 'TEGUH', 'east', 'BERTAHAN KERAS', false, false, 110),
    c('B06_rival_cepat', 'YOGA', 'east', 'CEPAT', false, false, 85),
    c('B07_senior_mengintimidasi', 'BANG HARIS', 'east', 'SENIOR DALANG', true, false, 300),
    c('C01_murid_pria', 'ANDI', 'south', 'SISWA SOUTH COURT', false, false, 60),
    c('C02_murid_wanita', 'PUTRI', 'south', 'SISWA SOUTH COURT', false, false, 60),
    c('C03_kutu_buku', 'WAWAN', 'south', 'KUTU BUKU', false, false, 60),
    c('C04_murid_olahraga', 'RIZAL', 'south', 'ANAK OLAHRAGA', false, false, 60),
    c('C05_murid_pendiam', 'NISA', 'south', 'ANAK PENDIAM', false, false, 60),
    c('C06_anggota_klub', 'EKO', 'south', 'ANGGOTA KLUB', false, false, 60),
    c('C07_anggota_osis', 'MEGA', 'south', 'ANGGOTA OSIS', false, false, 60),
    c('D01_guru', 'PAK HENDRA', 'staff', 'GURU SEJARAH', false, false, 60),
  ].map((d) => [d.key, d]),
);

export const characterName = (key: string): string => CHARACTERS[key]?.name ?? key;

/** Penyetelan gaya bertarung per tokoh (GDD §2/§4.4). Nilai tidak tercantum = netral. */
const STYLE: Record<string, Partial<FighterStats>> = {
  A02_sahabat: { power: 1.15, speed: 0.9, defense: 2 },
  A08_petarung_cepat: { power: 0.92, speed: 1.15 },
  B01_pemimpin_rival: { power: 1.08, speed: 1.03, defense: 1 },
  B07_senior_mengintimidasi: { power: 1.1, speed: 1, defense: 2 },
};

export function baseStats(key: string): FighterStats {
  const hp = CHARACTERS[key]?.hp ?? 100;
  return { maxHp: hp, maxStamina: 100, power: 1, defense: 0, speed: 1, ...STYLE[key] };
}
