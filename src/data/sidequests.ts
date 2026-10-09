// 6 Cerita Sekolah (misi sampingan, GDD §7). Tiap misi: pemberi di lokasi hub, satu atau lebih layar tantangan, hadiah.
import { say } from './cutscene';
import type { Cmd } from './cutscene';
import type { LocationId } from './locations';
import type { ScreenDef } from './stages';

const RAKA = 'A01_protagonis';
const TIARA = 'A06_murid_enerjik';
const WAWAN = 'C03_kutu_buku';
const RIZAL = 'C04_murid_olahraga';
const MEGA = 'C07_anggota_osis';
const NISA = 'C05_murid_pendiam';
const EKO = 'C06_anggota_klub';
const HENDRA = 'D01_guru';

export interface QuestReward {
  money: number;
  archive: string;
  /** Statistik kecil permanen. */
  stat?: { key: 'kekuatan' | 'ketahanan' | 'kecepatan' | 'stamina' | 'hpMaks'; amount: number; label: string };
}

export interface SideQuest {
  id: string;
  title: string;
  location: LocationId;
  /** NPC pemberi (id di data hub). */
  giver: string;
  /** Flag yang membuka misi (selesai bab tertentu). */
  requires: string;
  /** Penjelasan aturan singkat untuk pemain. */
  rule: string;
  intro: readonly Cmd[];
  success: readonly Cmd[];
  fail: readonly Cmd[];
  /** Layar tantangan berurutan (semua harus menang). */
  screens: readonly ScreenDef[];
  reward: QuestReward;
}

const ok = (who: string, text: string): Cmd => say(who, text, 'percaya_diri');

export const SIDE_QUESTS: readonly SideQuest[] = [
  {
    id: 'buku_hilang',
    title: 'BUKU YANG HILANG',
    location: 'perpustakaan',
    giver: 'wawan',
    requires: 'ch02_selesai',
    rule: 'AMBIL 3 BUKU DI LORONG LOKER DAN AREA LOKER',
    intro: [
      say(WAWAN, 'RAKA, TIGA BUKU SEJARAH FESTIVAL DIAMBIL ANAK NAKAL DAN DISEMBUNYIKAN DI LOKER.', 'khawatir'),
      say(WAWAN, 'TOLONG AMBILKAN. TANDA BERKEDIP ADALAH BUKUNYA. TEKAN E UNTUK MENGAMBIL.', 'netral'),
      say(RAKA, 'SIAP. TUNGGU DI SINI.', 'netral'),
    ],
    success: [ok(WAWAN, 'LENGKAP! TERIMA KASIH BANYAK. INI SEBAGIAN UANG TABUNGANKU, DAN ADA SELEMBAR ARSIP DI DALAMNYA.')],
    fail: [say(WAWAN, 'YAH... BUKUNYA MASIH HILANG. COBA LAGI NANTI, YA.', 'khawatir')],
    screens: [
      {
        id: 'sq1_lorong', stage: 'lorong_loker', label: 'LORONG LOKER', free: true, noMoney: false, music: 'tempur',
        spawns: [{ enemy: 'cepat', side: 'right' }, { enemy: 'agresif', side: 'left', delay: 40 }],
        pickups: [{ id: 'buku_1', kind: 'buku', x: 150, y: 200 }, { id: 'buku_2', kind: 'buku', x: 360, y: 232 }],
      },
      {
        id: 'sq1_loker', stage: 'area_loker', label: 'AREA LOKER', free: true, music: 'tempur',
        spawns: [{ enemy: 'tank', side: 'right' }, { enemy: 'cepat', side: 'left', delay: 40 }],
        pickups: [{ id: 'buku_3', kind: 'buku', x: 300, y: 210 }],
      },
    ],
    reward: { money: 2500, archive: 'arsip_03', stat: { key: 'kekuatan', amount: 1, label: 'KEKUATAN NAIK 1' } },
  },
  {
    id: 'pengganggu_lapangan',
    title: 'PENGGANGGU LAPANGAN',
    location: 'lapangan_basket',
    giver: 'rizal',
    requires: 'ch03_selesai',
    rule: 'KALAHKAN 3 GELOMBANG DALAM 90 DETIK',
    intro: [
      say(RIZAL, 'ANAK-ANAK SUKA MENGACAU DI LAPANGAN INI. KALAU KAMU BISA MENGUSIR MEREKA DALAM SEMENIT SETENGAH...', 'khawatir'),
      say(RAKA, 'TIGA GELOMBANG, SEMENIT SETENGAH. AKU COBA.', 'serius'),
    ],
    success: [ok(RIZAL, 'KEREN! LAPANGAN KEMBALI AMAN. INI HADIAHNYA, ADA ARSIP LAMA DI BAWAH RING.')],
    fail: [say(RIZAL, 'WAKTUNYA HABIS. MEREKA KABUR... TAPI AKAN KEMBALI.', 'netral')],
    screens: [
      {
        id: 'sq2_lapangan', stage: 'lapangan_basket', weather: 'sore', label: 'LAPANGAN BASKET', free: true, music: 'tempur', timeLimit: 90,
        spawns: [
          { enemy: 'cepat', side: 'right' }, { enemy: 'agresif', side: 'left', delay: 30 },
          { enemy: 'dash', side: 'right', delay: 160 }, { enemy: 'cepat', side: 'left', delay: 30 },
          { enemy: 'tank', side: 'right', delay: 160 }, { enemy: 'agresif', side: 'left', delay: 30 },
        ],
      },
    ],
    reward: { money: 3000, archive: 'arsip_05', stat: { key: 'stamina', amount: 5, label: 'STAMINA NAIK 5' } },
  },
  {
    id: 'latihan_band',
    title: 'LATIHAN BAND',
    location: 'ruang_musik',
    giver: 'tiara',
    requires: 'ch03_selesai',
    rule: 'KAWAL TIARA MELEWATI 2 LAYAR. TIARA TIDAK BOLEH KALAH',
    intro: [
      say(TIARA, 'ALAT BAND KAMI DISIMPAN DI RUANG MUSIK, TAPI LORONG KE SANA DIJAGA ANAK-ANAK NAKAL.', 'khawatir'),
      say(TIARA, 'KAWAL AKU, YA! AKU JUGA BISA PUKUL KOK. SEDIKIT.', 'percaya_diri'),
    ],
    success: [ok(TIARA, 'SAMPAI! TERIMA KASIH RAKA. KAMI AKAN LATIHAN SEKERAS MUNGKIN. INI ARSIP YANG KUTEMUKAN DI PIANO.')],
    fail: [say(TIARA, 'AKU... TIDAK BISA MELANJUTKAN. KITA COBA LAGI NANTI.', 'khawatir')],
    screens: [
      {
        id: 'sq3_a', stage: 'lorong_jendela', label: 'LORONG JENDELA', free: true, escort: 'tiara', music: 'tempur',
        spawns: [{ enemy: 'cepat', side: 'right' }, { enemy: 'agresif', side: 'right', delay: 40 }],
      },
      {
        id: 'sq3_b', stage: 'ruang_musik', label: 'RUANG MUSIK', free: true, escort: 'tiara', music: 'tempur',
        spawns: [{ enemy: 'tank', side: 'right' }, { enemy: 'dash', side: 'left', delay: 40 }],
      },
    ],
    reward: { money: 3000, archive: 'arsip_07', stat: { key: 'kecepatan', amount: 1, label: 'KECEPATAN NAIK 1' } },
  },
  {
    id: 'proposal_osis',
    title: 'PROPOSAL OSIS',
    location: 'ruang_osis',
    giver: 'mega',
    requires: 'ch04_selesai',
    rule: 'MENANGKAN PERTARUNGAN TANPA TERKENA LEBIH DARI 3 KALI',
    intro: [
      say(MEGA, 'ANAK-ANAK NAKAL MENGOTORI RUANG OSIS. KALAU KAMU BERTARUNG BERSIH, AKU TIDAK PERLU MEMBERESKAN KEKACAUAN BARU.', 'serius'),
      say(RAKA, 'BERTARUNG BERSIH. TIGA KALI KENA BOLEH, LEBIH DARI ITU GAGAL.', 'serius'),
    ],
    success: [ok(MEGA, 'BERSIH DAN RAPI! PROPOSAL KAMI AMAN. INI UNTUKMU, ADA ARSIP DI LACI.')],
    fail: [say(MEGA, 'RUANGAN INI BERANTAKAN LAGI... COBA LEBIH HATI-HATI.', 'khawatir')],
    screens: [
      {
        id: 'sq4_osis', stage: 'ruang_osis', label: 'RUANG OSIS', free: true, maxHits: 3, music: 'tempur',
        spawns: [{ enemy: 'cepat', side: 'right' }, { enemy: 'agresif', side: 'left', delay: 40 }, { enemy: 'tank', side: 'right', delay: 40 }, { enemy: 'dash', side: 'left', delay: 40 }],
      },
    ],
    reward: { money: 4000, archive: 'arsip_09', stat: { key: 'ketahanan', amount: 1, label: 'KETAHANAN NAIK 1' } },
  },
  {
    id: 'sepeda_nisa',
    title: 'SEPEDA NISA',
    location: 'parkir_sepeda',
    giver: 'nisa',
    requires: 'ch03_selesai',
    rule: 'KEJAR SURUHAN. MEREKA KABUR BILA TIDAK KALAH DALAM 45 DETIK',
    intro: [
      say(NISA, 'SEPEDAKU DIAMBIL... ORANG-ORANG ITU MASIH DI SINI. TAPI MEREKA CEPAT KABUR.', 'khawatir'),
      say(RAKA, 'AKAN KUKEJAR. KITA LIHAT SIAPA YANG LEBIH CEPAT.', 'percaya_diri'),
    ],
    success: [ok(NISA, 'SEPEDAKU KEMBALI! TERIMA KASIH. ADA SELEMBAR KERTAS DI KERANJANGNYA, UNTUKMU.')],
    fail: [say(NISA, 'MEREKA SUDAH KABUR... TIDAK APA-APA. TERIMA KASIH SUDAH MENCOBA.', 'netral')],
    screens: [
      {
        id: 'sq5_parkir', stage: 'parkir_sepeda', label: 'PARKIR SEPEDA', free: true, timeLimit: 45, music: 'tempur',
        spawns: [{ enemy: 'cepat', side: 'right' }, { enemy: 'cepat', side: 'left', delay: 20 }, { enemy: 'dash', side: 'right', delay: 40 }],
      },
    ],
    reward: { money: 3000, archive: 'arsip_10', stat: { key: 'hpMaks', amount: 5, label: 'HP MAKS NAIK 5' } },
  },
  {
    id: 'kebun_pak_hendra',
    title: 'KEBUN PAK HENDRA',
    location: 'kebun_sekolah',
    giver: 'eko',
    requires: 'ch05_selesai',
    rule: 'JAGA KEBUN DARI 4 GELOMBANG KROCO',
    intro: [
      say(EKO, 'KEBUN PAK HENDRA SERING DIRUSAK ORANG. SEKARANG ADA ROMBONGAN BARU DATANG!', 'terkejut'),
      say(HENDRA, 'TOMAT-TOMAT SAYA... RAKA, TOLONG, YA.', 'khawatir'),
      say(RAKA, 'SERAHKAN PADAKU.', 'percaya_diri'),
    ],
    success: [say(HENDRA, 'TERIMA KASIH, RAKA. SAYA SIMPAN SATU ARSIP LAGI UNTUKMU. RAWATLAH SEJARAH INI.', 'netral')],
    fail: [say(HENDRA, 'TIDAK APA-APA. TANAMAN BISA TUMBUH LAGI.', 'netral')],
    screens: [
      {
        id: 'sq6_kebun', stage: 'kebun_sekolah', label: 'KEBUN SEKOLAH', free: true, music: 'tempur',
        spawns: [
          { enemy: 'cepat', side: 'right' }, { enemy: 'agresif', side: 'left', delay: 30 },
          { enemy: 'tank', side: 'right', delay: 200 }, { enemy: 'dash', side: 'left', delay: 30 },
          { enemy: 'agresif', side: 'right', delay: 200 }, { enemy: 'cepat', side: 'left', delay: 30 },
          { enemy: 'tank', side: 'right', delay: 200 }, { enemy: 'agresif', side: 'left', delay: 30 },
        ],
      },
    ],
    reward: { money: 4000, archive: 'arsip_12', stat: { key: 'kekuatan', amount: 1, label: 'KEKUATAN NAIK 1' } },
  },
];

export const questById = (id: string): SideQuest | undefined => SIDE_QUESTS.find((q) => q.id === id);
