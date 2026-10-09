// Stage dan layar pertarungan. 22 stage dari paket aset; varian cuaca/waktu mengikuti ASSET_MAP §3.
import type { SpawnDef } from '../systems/WaveDirector';

export type Weather = 'cerah' | 'berawan' | 'hujan' | 'sore' | 'malam';

export interface StageDef {
  id: string;
  /** Cuaca yang punya gambar sendiri di 13_WEATHER. */
  weather: readonly Weather[];
  /** Efek lingkungan (14_ENVIRONMENT_EFFECTS) yang dipasang sebagai dekorasi. */
  effects: readonly string[];
}

const W5: readonly Weather[] = ['cerah', 'berawan', 'hujan', 'sore', 'malam'];

export const STAGES: readonly StageDef[] = [
  { id: 'gerbang_utama', weather: W5, effects: ['bendera_berkibar', 'burung_terbang'] },
  { id: 'halaman', weather: W5, effects: ['pohon_bergoyang', 'bendera_berkibar'] },
  { id: 'lorong_utama', weather: [], effects: ['lampu_neon_berkedip'] },
  { id: 'ruang_kelas', weather: ['hujan', 'malam'], effects: ['tirai_bergerak', 'hujan_di_jendela'] },
  { id: 'kantin', weather: [], effects: [] },
  { id: 'area_parkir', weather: W5, effects: ['genangan_beriak'] },
  { id: 'gang_belakang', weather: W5, effects: ['lampu_neon_berkedip', 'genangan_beriak'] },
  { id: 'perpustakaan', weather: [], effects: ['tirai_bergerak'] },
  { id: 'lorong_loker', weather: [], effects: ['lampu_neon_berkedip'] },
  { id: 'area_loker', weather: [], effects: [] },
  { id: 'lorong_jendela', weather: [], effects: ['hujan_di_jendela'] },
  { id: 'lapangan_basket', weather: W5, effects: ['genangan_beriak'] },
  { id: 'lapangan_olahraga', weather: [], effects: ['bendera_berkibar', 'burung_terbang'] },
  { id: 'parkir_sepeda', weather: [], effects: [] },
  { id: 'gerbang_sekolah', weather: [], effects: ['pohon_bergoyang'] },
  { id: 'gimnasium', weather: [], effects: [] },
  { id: 'kebun_sekolah', weather: [], effects: ['pohon_bergoyang', 'burung_terbang'] },
  { id: 'ruang_musik', weather: [], effects: ['tirai_bergerak'] },
  { id: 'ruang_osis', weather: [], effects: ['lampu_neon_berkedip'] },
  { id: 'laboratorium_sains', weather: [], effects: ['lampu_neon_berkedip'] },
  { id: 'tangga', weather: [], effects: ['lampu_neon_berkedip'] },
  { id: 'atap', weather: W5, effects: ['genangan_beriak'] },
];

export const stageDef = (id: string): StageDef => {
  const s = STAGES.find((x) => x.id === id);
  if (!s) throw new Error(`Stage tidak dikenal: ${id}`);
  return s;
};

/** Overlay warna untuk stage tanpa gambar cuaca sendiri (GDD §9). */
export interface TintDef {
  color: number;
  alpha: number;
}
export const WEATHER_TINT: Readonly<Partial<Record<Weather, TintDef>>> = {
  sore: { color: 0xe8803c, alpha: 0.18 },
  malam: { color: 0x0c1a40, alpha: 0.45 },
};

export type ScreenFilter = 'sepia';

/** Satu layar pertarungan (arena terkunci). */
export interface ScreenDef {
  id: string;
  stage: string;
  weather?: Weather;
  /** Hujan: pasang overlay hujan (fx:overlay_hujan). */
  rain?: boolean;
  spawns: readonly SpawnDef[];
  filter?: ScreenFilter;
  music?: string;
  /** Pemain dikendalikan sebagai tokoh lain (Bab 5: Hendra muda). */
  playerChar?: string;
  /** Arga ikut sebagai sekutu AI (Bab 7). */
  allyArga?: boolean;
  /** Tanpa uang (latih tanding). */
  noMoney?: boolean;
  /** Batas waktu dalam detik (misi sampingan); kosong = tanpa batas. */
  timeLimit?: number;
}
