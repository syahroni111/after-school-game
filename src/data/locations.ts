// Lokasi Waktu Bebas (hub). Pembukaan lokasi lewat perintah `unlock location:ID`. Detail NPC dan stage ada di M7.
export const LOCATION_IDS = [
  'halaman',
  'ruang_kelas',
  'kantin',
  'gimnasium',
  'perpustakaan',
  'lapangan_basket',
  'ruang_musik',
  'ruang_osis',
  'parkir_sepeda',
  'kebun_sekolah',
  'laboratorium_sains',
  'atap',
] as const;
export type LocationId = (typeof LOCATION_IDS)[number];

export const isLocation = (id: string): id is LocationId => (LOCATION_IDS as readonly string[]).includes(id);
