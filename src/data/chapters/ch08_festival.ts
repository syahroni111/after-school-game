// EPILOG: FESTIVAL TIGA SEKOLAH. Ruang musik (piala ditemukan) dan lapangan olahraga (festival).
import type { ChapterDef } from './types';
import { say, narasi } from '../cutscene';
import type { Cmd } from '../cutscene';

const RAKA = 'A01_protagonis';
const DIMAS = 'A02_sahabat';
const LARAS = 'A05_ketua_kelas';
const TIARA = 'A06_murid_enerjik';
const ARGA = 'B01_pemimpin_rival';
const SEKAR = 'B02_wakil_rival';
const HENDRA = 'D01_guru';
const WAWAN = 'C03_kutu_buku';

const musik: Cmd[] = [
  { c: 'fade', dir: 'in', ms: 600 },
  { c: 'title', text: 'FESTIVAL TIGA SEKOLAH', sub: 'EPILOG' },
  narasi('PAGI HARI. RUANG MUSIK NORTH HALL. PINTU DIBUKA UNTUK PERTAMA KALINYA SETELAH DUA PULUH TAHUN.'),
  { c: 'move', id: 'player', x: 130, y: 188 },
  { c: 'spawn', id: 'hendra', char: HENDRA, x: 300, y: 190, face: 'left' },
  { c: 'spawn', id: 'tiara', char: TIARA, x: 380, y: 196, face: 'left' },
  { c: 'spawn', id: 'laras', char: LARAS, x: 60, y: 194, face: 'right' },
  say(
    HENDRA,
    'SAYA MENYEMBUNYIKANNYA DI TEMPAT YANG TIDAK AKAN DICARI ORANG. DI BALIK PANEL PIANO INI.',
    'khawatir',
  ),
  say(TIARA, 'PANEL INI SUDAH LAMA MACET. AKU TIDAK PERNAH CURIGA ADA SESUATU DI BALIKNYA.', 'terkejut'),
  { c: 'sfx', name: 'door' },
  narasi(
    'PANEL KAYU ITU TERBUKA. DI BALIKNYA, SEBUAH PIALA BERBENTUK TIANG DENGAN PANJI KECIL, TERSELIMUT DEBU.',
  ),
  { c: 'sfx', name: 'unlock' },
  say(LARAS, 'PIALA PANJI... ASLI! DAN LIHAT ISI TULISAN DI DASARNYA.', 'terkejut', { side: 'left' }),
  say(HENDRA, 'MENANG BERSAMA, KALAH BERSAMA. TERNYATA PIALA INI MASIH MENUNGGU KITA.', 'netral'),
  say(RAKA, 'PAK, BAPAK TIDAK PERNAH MENCURINYA. SEMUA ORANG HARUS TAHU.', 'percaya_diri'),
  say(HENDRA, 'SAYA RASA SEKARANG SEMUA ORANG SUDAH TAHU. TERIMA KASIH, RAKA.', 'netral'),
];

const lapangan: Cmd[] = [
  { c: 'fade', dir: 'in', ms: 600 },
  narasi('SIANG. LAPANGAN OLAHRAGA PENUH SESAK. TIGA SEKOLAH BERKUMPUL UNTUK FESTIVAL YANG KEMBALI.'),
  { c: 'move', id: 'player', x: 130, y: 188 },
  { c: 'spawn', id: 'arga', char: ARGA, x: 230, y: 194, face: 'left' },
  { c: 'spawn', id: 'sekar', char: SEKAR, x: 300, y: 186, face: 'left' },
  { c: 'spawn', id: 'hendra', char: HENDRA, x: 360, y: 192, face: 'left' },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 60, y: 196, face: 'right' },
  say(
    LARAS,
    'SELAMAT DATANG DI FESTIVAL TIGA SEKOLAH! DUA PULUH TAHUN KEMUDIAN, KITA KEMBALI BERSAMA!',
    'percaya_diri',
  ),
  say(ARGA, 'EAST BLOCK SIAP BERTANDING DENGAN JUJUR. DAN SIAP KALAH DENGAN TERHORMAT.', 'percaya_diri'),
  say(SEKAR, 'NORTH HALL, SOUTH COURT, EAST BLOCK. TIGA SEKOLAH, SATU PANJI.', 'percaya_diri'),
  say(DIMAS, 'ADA GORENGAN DI SETIAP STAND! INI FESTIVAL TERBAIK SEPANJANG MASA!', 'percaya_diri', {
    side: 'left',
  }),
  say(
    HENDRA,
    'PIALA PANJI KEMBALI KE LAPANGAN INI. DAN NAMA YANG PERNAH DICORET, KEMBALI KE DAFTAR PANITIA.',
    'netral',
  ),
  say(WAWAN, 'KAMI TIGA SEKOLAH TIDAK AKAN LAGI SALING CURIGA. TERIMA KASIH, RAKA.', 'percaya_diri'),
  {
    c: 'ifFlag',
    key: 'arsip_lengkap',
    then: [
      narasi('SEMUA DUA BELAS ARSIP SEJARAH TERKUMPUL. PAK HENDRA MEMBACAKANNYA DI DEPAN TIGA SEKOLAH.'),
      say(
        HENDRA,
        'FESTIVAL INI DULU HILANG BUKAN KARENA KITA BERMUSUHAN. TETAPI KARENA ADA YANG MENGADU DOMBA KITA.',
        'serius',
      ),
      say(
        HENDRA,
        'SEJARAH TIDAK PERNAH HILANG. IA MENUNGGU ADA YANG MAU MEMBACANYA DAN MEMPERBAIKINYA.',
        'netral',
      ),
      narasi('TEPUK TANGAN MENGGEMA DI SELURUH LAPANGAN.'),
    ],
  },
  say(RAKA, 'SELAMA INI AKU HANYA INGIN BELAJAR TENANG. TERNYATA TEMAN-TEMAN BARU LEBIH BERHARGA.', 'netral'),
  say(LARAS, 'DAN SEKARANG, MARI KITA MULAI FESTIVALNYA!', 'percaya_diri'),
  { c: 'sfx', name: 'bell' },
  { c: 'music', song: 'festival' },
  { c: 'unlock', what: 'mode:bebas' },
  { c: 'unlock', what: 'char:B01_pemimpin_rival' },
  narasi('TAMAT. MODE BEBAS DAN BOSS RUSH KINI TERBUKA DI MENU JEDA WAKTU BEBAS.'),
  { c: 'setFlag', key: 'tamat' },
  { c: 'fade', dir: 'out', ms: 900 },
];

export const CH08: ChapterDef = {
  id: 'ch08',
  title: 'EPILOG: FESTIVAL TIGA SEKOLAH',
  hub: true,
  screens: [
    {
      id: 'ch08_musik',
      stage: 'ruang_musik',
      label: 'RUANG MUSIK',
      spawns: [],
      cutsceneOnly: true,
      music: 'sekolah',
      before: musik,
    },
    {
      id: 'ch08_lapangan',
      stage: 'lapangan_olahraga',
      weather: 'cerah',
      label: 'LAPANGAN OLAHRAGA',
      spawns: [],
      cutsceneOnly: true,
      music: 'festival',
      crowd: 'kerumunan_besar',
      before: lapangan,
    },
  ],
};
