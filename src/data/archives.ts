// Arsip Sejarah: 12 halaman tentang Festival Tiga Sekolah (sejarah FIKTIF). Dipasang sebagai penanda di stage
// (ScreenDef.pickups) dan dibaca di scene Archive. Teks kapital, hanya karakter font, maks. 4 baris x 46 karakter.

export interface ArchiveDef {
  id: string;
  title: string;
  lines: readonly string[];
}

export const ARCHIVES: readonly ArchiveDef[] = [
  {
    id: 'arsip_01',
    title: 'SEJARAH FESTIVAL',
    lines: [
      'FESTIVAL TIGA SEKOLAH DIADAKAN SETIAP TAHUN',
      'DI LAPANGAN OLAHRAGA TIRTASARI.',
      'PEMENANGNYA MEMBAWA PULANG PIALA PANJI.',
    ],
  },
  {
    id: 'arsip_02',
    title: 'ATURAN LOMBA',
    lines: [
      'ADA TIGA LOMBA: OLAHRAGA, MUSIK, DAN BAZAR.',
      'SKOR DIHITUNG BERSAMA OLEH PANITIA DARI',
      'NORTH HALL, EAST BLOCK, DAN SOUTH COURT.',
    ],
  },
  {
    id: 'arsip_03',
    title: 'PIALA PANJI',
    lines: [
      'PIALA BERBENTUK TIANG DENGAN PANJI KECIL.',
      'DI DASARNYA TERUKIR KALIMAT:',
      'MENANG BERSAMA, KALAH BERSAMA.',
    ],
  },
  {
    id: 'arsip_04',
    title: 'SURAT KABAR SEKOLAH',
    lines: [
      'KERIBUTAN PECAH DI HARI FINAL.',
      'FESTIVAL DIBUBARKAN SEBELUM PIALA DISERAHKAN.',
      'PIALA PANJI HILANG DAN TIDAK PERNAH DITEMUKAN.',
    ],
  },
  {
    id: 'arsip_05',
    title: 'CATATAN OSIS',
    lines: [
      'SEORANG ANGGOTA PANITIA DITUDUH MENGHILANGKAN',
      'PIALA. NAMANYA DICORET DARI DAFTAR PANITIA.',
      'IA TIDAK PERNAH DIBERI KESEMPATAN BICARA.',
    ],
  },
  {
    id: 'arsip_06',
    title: 'FOTO PANITIA',
    lines: [
      'FOTO BERSAMA PANITIA TIGA SEKOLAH.',
      'SEORANG SISWA BERKACAMATA BERDIRI DI BELAKANG.',
      'DI BALIK FOTO TERTULIS: HENDRA, NORTH HALL.',
    ],
  },
  {
    id: 'arsip_07',
    title: 'SURAT TANTANGAN',
    lines: [
      'SURAT ATAS NAMA NORTH HALL KEPADA EAST BLOCK.',
      'ISINYA PENUH HINAAN. TULISAN TANGANNYA BUKAN',
      'TULISAN OSIS. ADA PIHAK KETIGA DI BALIKNYA.',
    ],
  },
  {
    id: 'arsip_08',
    title: 'BUKU SAKU HENDRA',
    lines: [
      'AKU MENYEMBUNYIKAN PIALA DI TEMPAT YANG TIDAK',
      'AKAN DICARI ORANG. SEMOGA SUATU HARI ADA YANG',
      'PERCAYA BAHWA AKU TIDAK MENCURINYA.',
    ],
  },
  {
    id: 'arsip_09',
    title: 'DAFTAR PEMALAKAN',
    lines: [
      'SATU HALAMAN BERISI TANGGAL DAN NAMA KORBAN',
      'DARI TIGA SEKOLAH. SEMUA UANG MENGALIR KE',
      'SATU ORANG YANG SAMA.',
    ],
  },
  {
    id: 'arsip_10',
    title: 'PESAN DI PAPAN TULIS',
    lines: [
      'SELAMA TIGA SEKOLAH SALING MEMUSUHI,',
      'TIDAK ADA YANG PERNAH MEMERIKSA UANG KITA.',
      'FESTIVAL TIDAK BOLEH KEMBALI. HARIS.',
    ],
  },
  {
    id: 'arsip_11',
    title: 'FOTO SENIOR LAMA',
    lines: [
      'KELOMPOK SENIOR DUA PULUH TAHUN LALU.',
      'SALAH SATU WAJAHNYA MIRIP SESEORANG',
      'YANG KAU KENAL. SEJARAH MEMANG SUKA BERULANG.',
    ],
  },
  {
    id: 'arsip_12',
    title: 'TUTUP FESTIVAL',
    lines: [
      'TULISAN TANGAN PAK HENDRA DI KOTAK PIALA:',
      'JIKA PIALA INI PULANG, BERARTI SEJARAH',
      'MASIH BISA DIPERBAIKI.',
    ],
  },
];

export const ARCHIVE_IDS: readonly string[] = ARCHIVES.map((a) => a.id);
export const archiveById = (id: string): ArchiveDef | undefined => ARCHIVES.find((a) => a.id === id);
