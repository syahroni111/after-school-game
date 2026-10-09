// BAB 4: SANG PEMIMPIN EAST BLOCK. Gerbang sekolah, halaman (sore), gimnasium. Bos: Arga.
import type { ChapterDef } from './types';
import { say, narasi } from '../cutscene';
import type { Cmd } from '../cutscene';

const RAKA = 'A01_protagonis';
const DIMAS = 'A02_sahabat';
const LARAS = 'A05_ketua_kelas';
const ARGA = 'B01_pemimpin_rival';
const SEKAR = 'B02_wakil_rival';
const PENJAGA = 'B05_rival_bertahan';
const EAST = 'ANAK EAST BLOCK';

const gerbang: Cmd[] = [
  { c: 'fade', dir: 'in', ms: 500 },
  { c: 'title', text: 'SANG PEMIMPIN EAST BLOCK', sub: 'BAB 4' },
  narasi('SORE HARI. RAKA, LARAS, DAN DIMAS TIBA DI GERBANG EAST BLOCK.'),
  { c: 'move', id: 'player', x: 130, y: 188 },
  { c: 'spawn', id: 'laras', char: LARAS, x: 60, y: 194, face: 'right' },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 215, y: 196, face: 'right' },
  say(LARAS, 'KITA HARUS BICARA LANGSUNG DENGAN PEMIMPIN EAST BLOCK. NAMANYA ARGA.', 'serius', { side: 'left' }),
  say(RAKA, 'DIA TIDAK AKAN MAU MENDENGAR DARI ANAK NORTH HALL.', 'serius'),
  say(DIMAS, 'KALAU TIDAK MAU MENDENGAR, KITA DISAMBUT DENGAN TINJU. SIAP-SIAP SAJA.', 'percaya_diri'),
  { c: 'spawn', id: 'k1', char: PENJAGA, x: 340, y: 190, face: 'left' },
  say(PENJAGA, 'DILARANG MASUK! GERBANG INI HANYA UNTUK ANAK EAST BLOCK!', 'marah', { name: EAST }),
  say(RAKA, 'KAMI DATANG UNTUK BICARA, BUKAN BERKELAHI.', 'serius'),
  say(PENJAGA, 'ARGA TIDAK BICARA DENGAN PENGKHIANAT!', 'marah', { name: EAST }),
  { c: 'remove', id: 'k1' },
];

const gerbangAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 60, y: 196, face: 'right' },
  say(DIMAS, 'ADA SELEMBAR ARSIP TERSELIP DI TIANG GERBANG. ITU TANDA YANG BERKEDIP!', 'terkejut', { side: 'left' }),
];

const halaman: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 190 },
  { c: 'spawn', id: 'sekar', char: SEKAR, x: 340, y: 188, face: 'left' },
  say(SEKAR, 'KAMU YANG MENGALAHKAN PENJAGA GERBANG. AKU SEKAR, WAKIL ARGA.', 'serius'),
  say(SEKAR, 'ARGA MENUNGGU DI GIMNASIUM, TETAPI KALIAN HARUS MELEWATI KAMI DULU.', 'percaya_diri'),
  say(RAKA, 'KALAU ITU CARANYA... BAIKLAH.', 'serius'),
  { c: 'remove', id: 'sekar' },
];

const halamanAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'sekar', char: SEKAR, x: 320, y: 190, face: 'left' },
  say(SEKAR, 'KALAU KAMU SAMPAI SINI, ARGA PERLU MENDENGARMU. TAPI JANGAN HARAP DIA MUDAH.', 'netral'),
  { c: 'move', id: 'sekar', x: 520, y: 190, speed: 90 },
  { c: 'remove', id: 'sekar' },
];

const gym: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 190 },
  { c: 'spawn', id: 'arga', char: ARGA, x: 340, y: 188, face: 'left' },
  say(ARGA, 'KAU BERANI DATANG SENDIRIAN. ATAU MEMANG NEKAT?', 'percaya_diri'),
  say(RAKA, 'AKU DATANG UNTUK BICARA. SOAL PERMUSUHAN YANG DIPAKSAKAN KEPADA KITA.', 'serius'),
  say(ARGA, 'JANGAN BERPURA-PURA. KAU MENANTANG EAST BLOCK LEWAT SURAT. SEKARANG KUJAWAB DENGAN TINJU.', 'marah'),
  say(RAKA, 'SURAT? AKU TIDAK PERNAH MENGIRIM SURAT APA PUN.', 'terkejut'),
  say(ARGA, 'BERHENTI BICARA. BUKTIKAN DIRIMU!', 'marah'),
  { c: 'remove', id: 'arga' },
];

const gymAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'arga', char: ARGA, x: 300, y: 192, face: 'left', anim: 'terhuyung' },
  say(ARGA, 'KUAT... DAN KAMU TIDAK MENYERANG DENGAN KEBENCIAN.', 'khawatir'),
  say(ARGA, 'INI SURAT TANTANGAN ITU. ATAS NAMA NORTH HALL. BACALAH.', 'serius'),
  say(RAKA, 'TULISAN INI BUKAN TULISAN OSIS KAMI. LARAS PUNYA CONTOHNYA, DAN SAMA SEKALI BERBEDA.', 'terkejut'),
  say(ARGA, 'BERARTI ADA PIHAK KETIGA YANG MENGADU DOMBA KITA. SELAMA INI AKU MEMIMPIN ANAK BUAHKU UNTUK MENYERANG ORANG YANG SALAH.', 'khawatir'),
  say(RAKA, 'KITA BERDUA DIPERMAINKAN. TAPI SEKARANG KITA TAHU.', 'serius'),
  say(ARGA, 'AKU BERUTANG PERMINTAAN MAAF PADAMU. DAN PADA SEMUA YANG KAMI GANGGU.', 'netral'),
  { c: 'setFlag', key: 'arga_percaya' },
  say(ARGA, 'KALAU KAU MAU MENCARI DALANGNYA, EAST BLOCK AKAN MEMBANTU. TAPI ORANG ITU BERBAHAYA.', 'serius'),
  { c: 'unlock', what: 'location:ruang_osis' },
  { c: 'fade', dir: 'out', ms: 500 },
];

export const CH04: ChapterDef = {
  id: 'ch04',
  title: 'BAB 4: SANG PEMIMPIN EAST BLOCK',
  next: 'ch05',
  hub: true,
  screens: [
    {
      id: 'ch04_gerbang', stage: 'gerbang_sekolah', weather: 'sore', label: 'GERBANG SEKOLAH', music: 'tempur',
      spawns: [{ enemy: 'cepat', side: 'right' }, { enemy: 'agresif', side: 'right', delay: 40 }, { enemy: 'tank', side: 'right', delay: 40 }],
      pickups: [{ id: 'arsip_06', kind: 'arsip', x: 330, y: 224 }],
      before: gerbang, after: gerbangAfter,
    },
    {
      id: 'ch04_halaman', stage: 'halaman', weather: 'sore', label: 'HALAMAN EAST BLOCK', music: 'tempur',
      spawns: [{ enemy: 'dash', side: 'right' }, { enemy: 'tank', side: 'left', delay: 40 }, { enemy: 'agresif', side: 'right', delay: 40 }, { enemy: 'cepat', side: 'left', delay: 40 }],
      before: halaman, after: halamanAfter,
    },
    {
      id: 'ch04_gym', stage: 'gimnasium', label: 'GIMNASIUM', music: 'bos',
      spawns: [{ enemy: 'arga', side: 'right', boss: true }],
      before: gym, after: gymAfter,
    },
  ],
};
