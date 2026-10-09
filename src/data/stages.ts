// Stage dan layar pertarungan. 22 stage dari paket aset; varian cuaca/waktu mengikuti ASSET_MAP §3.
import type { SpawnDef } from '../systems/WaveDirector';
import type { Cmd } from './cutscene';

export type Weather = 'cerah' | 'berawan' | 'hujan' | 'sore' | 'malam';

export interface StageDef {
  id: string;
  /** Cuaca yang punya gambar sendiri di 13_WEATHER. */
  weather: readonly Weather[];
}

const W5: readonly Weather[] = ['cerah', 'berawan', 'hujan', 'sore', 'malam'];

export const STAGES: readonly StageDef[] = [
  { id: 'gerbang_utama', weather: W5 },
  { id: 'halaman', weather: W5 },
  { id: 'lorong_utama', weather: [] },
  { id: 'ruang_kelas', weather: ['hujan', 'malam'] },
  { id: 'kantin', weather: [] },
  { id: 'area_parkir', weather: W5 },
  { id: 'gang_belakang', weather: W5 },
  { id: 'perpustakaan', weather: [] },
  { id: 'lorong_loker', weather: [] },
  { id: 'area_loker', weather: [] },
  { id: 'lorong_jendela', weather: [] },
  { id: 'lapangan_basket', weather: W5 },
  { id: 'lapangan_olahraga', weather: [] },
  { id: 'parkir_sepeda', weather: [] },
  { id: 'gerbang_sekolah', weather: [] },
  { id: 'gimnasium', weather: [] },
  { id: 'kebun_sekolah', weather: [] },
  { id: 'ruang_musik', weather: [] },
  { id: 'ruang_osis', weather: [] },
  { id: 'laboratorium_sains', weather: [] },
  { id: 'tangga', weather: [] },
  { id: 'atap', weather: W5 },
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
  /** Nama di layar Hasil; kosong = nama stage. */
  label?: string;
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
  /** Cutscene sebelum pertarungan dimulai (pemain tidak bisa digerakkan). */
  before?: readonly Cmd[];
  /** Skrip yang berjalan bersamaan dengan pertarungan (petunjuk tutorial, dialog di tengah laga). */
  during?: readonly Cmd[];
  /** Cutscene setelah semua musuh kalah, sebelum marker LANJUT. */
  after?: readonly Cmd[];
  /** Hanya cutscene (tanpa pertarungan dan tanpa marker LANJUT): layar selesai setelah skrip habis. */
  cutsceneOnly?: boolean;
}
