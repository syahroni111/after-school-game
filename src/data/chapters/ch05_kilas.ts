// BAB 5: KILAS BALIK, FESTIVAL TERAKHIR. Dimainkan sebagai Hendra muda (sepia): kebun sekolah, halaman, ruang musik.
import type { ChapterDef } from './types';
import { say, narasi } from '../cutscene';
import type { Cmd } from '../cutscene';

const RAKA = 'A01_protagonis';
const HENDRA = 'D01_guru';
const MUDA = 'A03_murid_pendiam';
const SENIOR = 'B07_senior_mengintimidasi';
const SENIORS = 'SENIOR ANGKATAN LAMA';

const kebunKini: Cmd[] = [
  { c: 'fade', dir: 'in', ms: 500 },
  { c: 'title', text: 'KILAS BALIK', sub: 'BAB 5' },
  narasi('SORE HARI DI KEBUN SEKOLAH. PAK HENDRA MENYIRAM TOMAT-TOMATNYA.'),
  { c: 'move', id: 'player', x: 130, y: 188 },
  { c: 'spawn', id: 'hendra', char: HENDRA, x: 330, y: 190, face: 'left' },
  say(RAKA, 'PAK, ARSIP INI MENYEBUT NAMA BAPAK. HENDRA, NORTH HALL, PANITIA FESTIVAL.', 'serius'),
  say(HENDRA, 'JADI KAMU SUDAH MENEMUKANNYA. DUA PULUH TAHUN SAYA MENYIMPAN CERITA INI SENDIRIAN.', 'khawatir'),
  say(HENDRA, 'BAIKLAH. DENGARKAN BAIK-BAIK, RAKA. INI YANG SEBENARNYA TERJADI.', 'serius'),
  { c: 'fade', dir: 'out', ms: 700 },
];

const kebun: Cmd[] = [
  { c: 'fade', dir: 'in', ms: 700 },
  narasi('DUA PULUH TAHUN LALU. HARI FINAL FESTIVAL TIGA SEKOLAH. SEORANG PANITIA BERKACAMATA BERNAMA HENDRA.'),
  { c: 'move', id: 'player', x: 130, y: 190 },
  { c: 'spawn', id: 's1', char: 'B06_rival_cepat', x: 340, y: 188, face: 'left' },
  say(MUDA, 'PIALA PANJI HARUS DISERAHKAN SORE INI. KENAPA ADA YANG MENCARIKU DI KEBUN?', 'khawatir', { name: 'HENDRA MUDA' }),
  say('B06_rival_cepat', 'SERAHKAN KUNCI KOTAK PIALA, ANAK PANITIA!', 'marah', { name: SENIORS }),
  say(MUDA, 'TIDAK AKAN. PIALA INI MILIK TIGA SEKOLAH, BUKAN MILIK KALIAN.', 'marah', { name: 'HENDRA MUDA' }),
  { c: 'remove', id: 's1' },
];

const halaman: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 190 },
  narasi('KABAR PALSU MENYEBAR: ANAK SEKOLAH LAIN MENGHINA SEKOLAHMU. HALAMAN BERUBAH RICUH.'),
  say(MUDA, 'BERHENTI! KALIAN DIADU DOMBA! SIAPA YANG MENYEBARKAN KABAR INI?', 'terkejut', { name: 'HENDRA MUDA' }),
];

const musik: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 190 },
  narasi('HENDRA BERLARI KE RUANG MUSIK. DI TANGANNYA, PIALA PANJI. IA MENYELIPKANNYA DI BALIK PANEL PIANO.'),
  say(MUDA, 'TEMPAT INI TIDAK AKAN DICARI ORANG. AKU AKAN KEMBALI SETELAH SEMUANYA TENANG.', 'serius', { name: 'HENDRA MUDA' }),
  { c: 'spawn', id: 'senior', char: SENIOR, x: 340, y: 188, face: 'left' },
  say(SENIOR, 'DI MANA PIALANYA, ANAK PANITIA?', 'marah', { name: SENIORS }),
  say(MUDA, 'KALIAN YANG MENYEBAR KERIBUTAN ITU. UNTUK MENCURI PIALA, KAN?', 'marah', { name: 'HENDRA MUDA' }),
  say(SENIOR, 'DIAM! KAMI YANG BERHAK ATAS SEMUA YANG BERHARGA DI SEKOLAH INI!', 'marah', { name: SENIORS }),
  { c: 'remove', id: 'senior' },
];

const musikAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'senior', char: SENIOR, x: 300, y: 192, face: 'left', anim: 'terhuyung' },
  say(SENIOR, 'SIAL... TAPI INI BELUM SELESAI.', 'khawatir', { name: SENIORS }),
  narasi('GURU-GURU DATANG. SEMUA ORANG BERTERIAK DAN SALING MENYALAHKAN.'),
  say(SENIOR, 'BAPAK! DIA YANG MENGAMBIL PIALANYA! KAMI MELIHATNYA SENDIRI!', 'marah', { name: SENIORS }),
  say(MUDA, 'TIDAK! AKU MENYEMBUNYIKANNYA UNTUK... TUNGGU...', 'terkejut', { name: 'HENDRA MUDA' }),
  narasi('TIDAK ADA YANG PERCAYA. FESTIVAL DIBUBARKAN, DAN NAMA HENDRA DICORET DARI DAFTAR PANITIA.'),
  narasi('MALAM ITU, HENDRA MENULIS DI BUKU SAKUNYA...'),
  { c: 'giveArchive', id: 'arsip_08' },
  { c: 'fade', dir: 'out', ms: 700 },
];

const musikKini: Cmd[] = [
  { c: 'fade', dir: 'in', ms: 700 },
  narasi('KINI. RUANG MUSIK NORTH HALL. DEBU TIPIS MENUTUPI PIANO TUA.'),
  { c: 'move', id: 'player', x: 130, y: 188 },
  { c: 'spawn', id: 'hendra', char: HENDRA, x: 320, y: 190, face: 'left' },
  say(HENDRA, 'ITULAH SELURUHNYA, RAKA. SAYA MENYEMBUNYIKAN PIALA ITU DI SINI.', 'khawatir'),
  say(HENDRA, 'KEESOKAN HARINYA RUANGAN INI DIKUNCI DAN SAYA DILARANG MASUK. SAYA TIDAK PERNAH BERANI MENCARINYA LAGI.', 'khawatir'),
  say(RAKA, 'BAPAK DISALAHKAN ATAS SESUATU YANG TIDAK BAPAK LAKUKAN SELAMA DUA PULUH TAHUN.', 'serius'),
  say(HENDRA, 'SEJARAH MEMANG SUKA BERULANG. SEKARANG GILIRAN KAMU YANG DISALAHKAN OLEH ORANG YANG SAMA.', 'serius'),
  say(RAKA, 'SENIOR-SENIOR ITU... APA ADA YANG MASIH TINGGAL DI KOTA INI?', 'serius'),
  say(HENDRA, 'SAYA TIDAK TAHU. TAPI SEORANG BERNAMA HARIS DI EAST BLOCK MEMILIKI WAJAH YANG SANGAT MIRIP.', 'serius'),
  say(RAKA, 'KITA CARI TAHU. DAN SETELAH ITU, KITA CARI PIALA ITU BERSAMA.', 'percaya_diri'),
  { c: 'setFlag', key: 'tahu_kebenaran' },
  { c: 'unlock', what: 'location:kebun_sekolah' },
  { c: 'fade', dir: 'out', ms: 500 },
];

const SEPIA = { filter: 'sepia' as const, playerChar: MUDA, playerName: 'HENDRA', music: 'kilas_balik' };

export const CH05: ChapterDef = {
  id: 'ch05',
  title: 'BAB 5: KILAS BALIK',
  next: 'ch06',
  hub: true,
  screens: [
    { id: 'ch05_kini1', stage: 'kebun_sekolah', label: 'KEBUN SEKOLAH', spawns: [], cutsceneOnly: true, music: 'sekolah', before: kebunKini },
    {
      id: 'ch05_kebun', stage: 'kebun_sekolah', label: 'KEBUN SEKOLAH LAMA', ...SEPIA,
      spawns: [{ enemy: 'senior_cepat', side: 'right' }, { enemy: 'senior_agresif', side: 'right', delay: 40 }, { enemy: 'senior_cepat', side: 'left', delay: 40 }],
      before: kebun,
    },
    {
      id: 'ch05_halaman', stage: 'halaman', label: 'HALAMAN LAMA', ...SEPIA,
      spawns: [{ enemy: 'senior_agresif', side: 'right' }, { enemy: 'senior_tank', side: 'left', delay: 40 }, { enemy: 'senior_cepat', side: 'right', delay: 40 }, { enemy: 'senior_agresif', side: 'left', delay: 40 }],
      before: halaman,
    },
    {
      id: 'ch05_musik', stage: 'ruang_musik', label: 'RUANG MUSIK LAMA', ...SEPIA,
      spawns: [{ enemy: 'senior_cepat', side: 'left' }, { enemy: 'senior_lama', side: 'right', boss: true }],
      before: musik, after: musikAfter,
    },
    { id: 'ch05_kini2', stage: 'ruang_musik', label: 'RUANG MUSIK', spawns: [], cutsceneOnly: true, music: 'sekolah', before: musikKini },
  ],
};
