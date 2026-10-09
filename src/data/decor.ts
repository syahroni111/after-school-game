// Dekorasi beranimasi (14_ENVIRONMENT_EFFECTS) dipasang tepat di atas elemen yang sudah dilukis di stage.
// Koordinat (sudut kiri atas sprite) diukur dengan mencocokkan piksel sprite terhadap gambar stage.
import type { Weather } from './stages';

export interface Decor {
  fx: string;
  x: number;
  y: number;
}

const neon = (xs: readonly number[]): Decor[] => xs.map((x) => ({ fx: 'lampu_neon_berkedip', x, y: 14 }));
const NEON4 = [40, 160, 280, 400] as const;

/** Dekorasi untuk gambar stage dasar/cerah. */
export const DECOR: Readonly<Record<string, readonly Decor[]>> = {
  halaman: [
    { fx: 'bendera_berkibar', x: 220, y: 56 },
    { fx: 'pohon_bergoyang', x: 34, y: 72 },
    { fx: 'pohon_bergoyang', x: 364, y: 72 },
  ],
  gerbang_utama: [
    { fx: 'pohon_bergoyang', x: -6, y: 92 },
    { fx: 'pohon_bergoyang', x: 414, y: 92 },
  ],
  gerbang_sekolah: [{ fx: 'pohon_bergoyang', x: 104, y: 68 }],
  lorong_utama: neon([40, 160, 400]),
  lorong_loker: neon(NEON4),
  ruang_osis: neon(NEON4),
  laboratorium_sains: neon(NEON4),
  tangga: neon([160, 280, 400]),
};

/** Genangan yang sudah dilukis di varian hujan; sprite riak beranimasi dipasang di atasnya. */
const PUDDLES_COMMON: readonly (readonly [number, number])[] = [
  [34, 162],
  [79, 171],
  [120, 198],
  [205, 230],
  [52, 252],
];
export const PUDDLES: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  halaman: PUDDLES_COMMON,
  area_parkir: PUDDLES_COMMON,
  lapangan_basket: PUDDLES_COMMON,
  gang_belakang: [
    [46, 198],
    [245, 209],
    [120, 228],
    [52, 240],
    [10, 241],
    [281, 227],
  ],
  atap: [
    [34, 197],
    [120, 215],
    [205, 231],
    [52, 242],
    [79, 201],
  ],
};

/** Stage luar ruangan dengan langit: burung boleh melintas (bukan saat hujan/malam). */
export const BIRD_STAGES: ReadonlySet<string> = new Set([
  'gerbang_utama',
  'halaman',
  'gerbang_sekolah',
  'lapangan_olahraga',
  'kebun_sekolah',
]);
export const BIRD_WEATHER: readonly (Weather | undefined)[] = [undefined, 'cerah', 'berawan', 'sore'];
