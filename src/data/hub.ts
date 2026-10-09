// Lokasi Waktu Bebas: NPC, percakapan menurut progres cerita, dan titik interaksi (GDD §7).
import { say, narasi } from './cutscene';
import type { Cmd } from './cutscene';
import type { LocationId } from './locations';
import type { Weather } from './stages';

const DIMAS = 'A02_sahabat';
const LARAS = 'A05_ketua_kelas';
const TIARA = 'A06_murid_enerjik';
const GILANG = 'A07_petarung_bertahan';
const BIMA = 'A04_murid_atletis';
const ANDI = 'C01_murid_pria';
const WAWAN = 'C03_kutu_buku';
const RIZAL = 'C04_murid_olahraga';
const NISA = 'C05_murid_pendiam';
const EKO = 'C06_anggota_klub';
const MEGA = 'C07_anggota_osis';
const HENDRA = 'D01_guru';

export interface HubTalk {
  /** Flag yang harus ada; kosong = percakapan bawaan. Dipilih yang pertama cocok. */
  requires?: string;
  script: readonly Cmd[];
}

export type HubAction = 'shop' | 'dojo';

export interface HubNpc {
  id: string;
  char: string;
  x: number;
  y: number;
  face: 'left' | 'right';
  /** Animasi diam utama; bergantian dengan idle lain setiap beberapa detik. */
  idle?: string;
  talk: readonly HubTalk[];
  /** Dibuka setelah percakapan selesai. */
  action?: HubAction;
  /** Id Cerita Sekolah yang diberikan NPC ini (M8). */
  quest?: string;
}

export interface HubSpot {
  id: string;
  x: number;
  y: number;
  label: string;
  action: HubAction;
}

export interface HubLocation {
  id: LocationId;
  label: string;
  stage: string;
  weather?: Weather;
  npcs: readonly HubNpc[];
  spots?: readonly HubSpot[];
  /** Animasi latar penonton dari 05_NPC (kunci tanpa awalan `npc:`). */
  ambient?: readonly { sheet: string; x: number; y: number }[];
}

const t = (script: Cmd[], requires?: string): HubTalk => ({ requires, script });

export const HUB_LOCATIONS: readonly HubLocation[] = [
  {
    id: 'halaman',
    label: 'HALAMAN',
    stage: 'halaman',
    weather: 'cerah',
    npcs: [
      {
        id: 'laras', char: LARAS, x: 330, y: 188, face: 'left',
        talk: [
          t([say(LARAS, 'FESTIVAL TIGA SEKOLAH SUDAH KEMBALI, DAN SEMUA ORANG DATANG. TERIMA KASIH, RAKA.', 'percaya_diri')], 'ch08_selesai'),
          t([say(LARAS, 'SURAT ITU PALSU. BERARTI ADA YANG MENGADU DOMBA KITA. KITA HARUS CARI TAHU SIAPA.', 'serius')], 'ch04_selesai'),
          t([say(LARAS, 'USULAN FESTIVAL SUDAH KUAJUKAN KE OSIS. SEMOGA DISETUJUI.', 'percaya_diri')], 'ch02_selesai'),
          t([say(LARAS, 'SEKOLAH BARU, TAPI SUDAH RAMAI, YA? JAGA DIRI, RAKA.', 'netral')]),
        ],
      },
      {
        id: 'dimas', char: DIMAS, x: 230, y: 198, face: 'right',
        talk: [
          t([say(DIMAS, 'FESTIVALNYA ENAK SEKALI. MAKANANNYA, MAKSUDKU. PERTANDINGANNYA JUGA.', 'percaya_diri')], 'ch08_selesai'),
          t([say(DIMAS, 'BAYU CEPAT SEKALI. TAPI GORENGAN KANTIN LEBIH CEPAT HABISNYA.', 'percaya_diri')], 'ch03_selesai'),
          t([say(DIMAS, 'AKU LAPAR. KANTIN SUDAH BUKA, KAN? ANTAR AKU SETELAH INI.', 'percaya_diri')]),
        ],
      },
    ],
    ambient: [{ sheet: 'murid_mengobrol', x: 110, y: 186 }],
  },
  {
    id: 'kantin',
    label: 'KANTIN',
    stage: 'kantin',
    npcs: [
      {
        id: 'andi', char: ANDI, x: 330, y: 190, face: 'left',
        talk: [
          t([say(ANDI, 'ES TEHNYA MANIS. SAMA SEPERTI SUASANA SEKOLAH SEKARANG.', 'percaya_diri')], 'ch08_selesai'),
          t([say(ANDI, 'MAKAN YANG BANYAK SEBELUM BERTARUNG. RAHASIA ORANG SOUTH COURT.', 'netral')]),
        ],
      },
    ],
    spots: [{ id: 'konter', x: 150, y: 176, label: 'BELI MAKANAN', action: 'shop' }],
  },
  {
    id: 'gimnasium',
    label: 'GIMNASIUM',
    stage: 'gimnasium',
    npcs: [
      {
        id: 'gilang', char: GILANG, x: 330, y: 186, face: 'left', action: 'dojo',
        talk: [
          t([say(GILANG, 'DOJO SELALU TERBUKA. JURUS TERBAIK ADALAH YANG KAU PAHAMI, BUKAN YANG KAU HAFAL.', 'percaya_diri')], 'ch04_selesai'),
          t([say(GILANG, 'SELAMAT DATANG DI DOJO. BELI JURUS BARU, ATAU LATIH TANDING DENGANKU.', 'percaya_diri')]),
        ],
      },
      {
        id: 'bima', char: BIMA, x: 170, y: 196, face: 'right', idle: 'main_basket',
        talk: [t([say(BIMA, 'LATIH TANDING ITU SERU! KALAU MAU, LAWAN AKU DI DOJO.', 'percaya_diri')])],
      },
    ],
  },
  {
    id: 'perpustakaan',
    label: 'PERPUSTAKAAN',
    stage: 'perpustakaan',
    npcs: [
      {
        id: 'wawan', char: WAWAN, x: 330, y: 192, face: 'left', idle: 'membaca', quest: 'buku_hilang',
        talk: [
          t([say(WAWAN, 'SEKARANG PERPUSTAKAAN RAMAI. SEMUA SEKOLAH MENCARI BUKU SEJARAH FESTIVAL.', 'percaya_diri')], 'ch08_selesai'),
          t([say(WAWAN, 'SSST... INI PERPUSTAKAAN. TAPI KALAU UNTUK RAKA, BOLEH BERBISIK.', 'netral')]),
        ],
      },
      {
        id: 'hendra', char: HENDRA, x: 160, y: 188, face: 'right',
        talk: [
          t([say(HENDRA, 'PIALA PANJI SUDAH PULANG. DUA PULUH TAHUN PENANTIAN... TERIMA KASIH.', 'netral')], 'ch08_selesai'),
          t([say(HENDRA, 'ARSIP FESTIVAL MASIH BANYAK YANG TERSEBAR. CARI DI SETIAP SUDUT SEKOLAH.', 'serius')], 'ch02_selesai'),
          t([say(HENDRA, 'SEJARAH TIDAK HILANG. IA HANYA MENUNGGU ADA YANG MAU MEMBACANYA.', 'serius')]),
        ],
      },
    ],
  },
  {
    id: 'lapangan_basket',
    label: 'LAPANGAN BASKET',
    stage: 'lapangan_basket',
    weather: 'cerah',
    npcs: [
      {
        id: 'rizal', char: RIZAL, x: 330, y: 206, face: 'left', quest: 'pengganggu_lapangan',
        talk: [
          t([say(RIZAL, 'LAPANGAN INI AMAN LAGI. AYO MAIN BERTIGA SEKOLAH!', 'percaya_diri')], 'ch08_selesai'),
          t([say(RIZAL, 'KADANG ADA YANG SUKA MENGGANGGU PERMAINAN DI LAPANGAN INI.', 'khawatir')]),
        ],
      },
      { id: 'bima', char: BIMA, x: 160, y: 196, face: 'right', idle: 'main_basket', talk: [t([say(BIMA, 'TIGA ANGKA! ... YAH, MELESET.', 'percaya_diri')])] },
    ],
  },
  {
    id: 'ruang_musik',
    label: 'RUANG MUSIK',
    stage: 'ruang_musik',
    npcs: [
      {
        id: 'tiara', char: TIARA, x: 330, y: 190, face: 'left', quest: 'latihan_band',
        talk: [
          t([say(TIARA, 'BANDKU AKAN TAMPIL DI FESTIVAL! LAGUNYA TENTANG TIGA SEKOLAH.', 'percaya_diri')], 'ch08_selesai'),
          t([say(TIARA, 'AKU TIARA, KLUB MUSIK. LATIHAN BAND KAMI SERING TERGANGGU.', 'khawatir')]),
        ],
      },
    ],
  },
  {
    id: 'ruang_osis',
    label: 'RUANG OSIS',
    stage: 'ruang_osis',
    npcs: [
      {
        id: 'mega', char: MEGA, x: 330, y: 190, face: 'left', quest: 'proposal_osis',
        talk: [
          t([say(MEGA, 'PROPOSAL FESTIVAL DISETUJUI SEMUA SEKOLAH. LUAR BIASA!', 'percaya_diri')], 'ch08_selesai'),
          t([say(MEGA, 'PROPOSAL KAMI BELUM TUNTAS. ADA YANG TERUS MEMBUAT KERIBUTAN.', 'khawatir')]),
        ],
      },
    ],
  },
  {
    id: 'parkir_sepeda',
    label: 'PARKIR SEPEDA',
    stage: 'parkir_sepeda',
    npcs: [
      {
        id: 'nisa', char: NISA, x: 330, y: 196, face: 'left', quest: 'sepeda_nisa',
        talk: [
          t([say(NISA, 'SEPEDAKU KEMBALI. TERIMA KASIH SUDAH MEMBANTU.', 'netral')], 'ch08_selesai'),
          t([say(NISA, 'AKU... TIDAK BANYAK BICARA. TAPI SEPEDAKU SERING DIGANGGU.', 'khawatir')]),
        ],
      },
    ],
  },
  {
    id: 'kebun_sekolah',
    label: 'KEBUN SEKOLAH',
    stage: 'kebun_sekolah',
    npcs: [
      {
        id: 'eko', char: EKO, x: 330, y: 200, face: 'left', quest: 'kebun_pak_hendra',
        talk: [
          t([say(EKO, 'TOMATNYA SUDAH MERAH SEMUA. PAK HENDRA SENANG SEKALI.', 'percaya_diri')], 'ch08_selesai'),
          t([say(EKO, 'KEBUN INI MILIK PAK HENDRA. KADANG ADA YANG MERUSAKNYA.', 'khawatir')]),
        ],
      },
      {
        id: 'hendra', char: HENDRA, x: 170, y: 196, face: 'right',
        talk: [
          t([say(HENDRA, 'TANAMAN TIDAK PERNAH CURIGA. MEREKA CUMA BUTUH AIR DAN SABAR.', 'netral')]),
        ],
      },
    ],
  },
];

export const hubLocation = (id: string): HubLocation | undefined => HUB_LOCATIONS.find((l) => l.id === id);

/** Percakapan pertama yang syaratnya terpenuhi (urutan data = prioritas); bawaan bila tidak ada yang cocok. */
export function pickTalk(npc: HubNpc, hasFlag: (k: string) => boolean): readonly Cmd[] {
  for (const tk of npc.talk) if (!tk.requires || hasFlag(tk.requires)) return tk.script;
  return [narasi('...')];
}

