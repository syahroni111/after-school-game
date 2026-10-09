// BAB 6: JEJAK YANG SAMA. Ruang OSIS, laboratorium sains, tangga. Malam (kelas malam). Bos: Sekar.
import type { ChapterDef } from './types';
import { say, narasi } from '../cutscene';
import type { Cmd } from '../cutscene';

const RAKA = 'A01_protagonis';
const DIMAS = 'A02_sahabat';
const LARAS = 'A05_ketua_kelas';
const SEKAR = 'B02_wakil_rival';
const SURUHAN = 'SURUHAN HARIS';

const osis: Cmd[] = [
  { c: 'fade', dir: 'in', ms: 500 },
  { c: 'title', text: 'JEJAK YANG SAMA', sub: 'BAB 6' },
  narasi('MALAM HARI. KELAS MALAM NORTH HALL. LAMPU NEON RUANG OSIS BERKEDIP DI SEPANJANG LORONG.'),
  { c: 'move', id: 'player', x: 130, y: 188 },
  { c: 'spawn', id: 'laras', char: LARAS, x: 240, y: 192, face: 'left' },
  say(
    LARAS,
    'LIHAT CATATAN KAS INI. ANGKANYA TIDAK MASUK AKAL. UANG TIGA SEKOLAH MENGALIR KE SATU REKENING.',
    'serius',
  ),
  say(RAKA, 'SIAPA PEMILIK REKENING ITU?', 'serius'),
  say(LARAS, 'NAMANYA TIDAK DITULIS. HANYA INISIAL: H.', 'khawatir'),
  { c: 'spawn', id: 'k1', char: 'B06_rival_cepat', x: 560, y: 190, face: 'left' },
  { c: 'sfx', name: 'door' },
  say('B06_rival_cepat', 'SERAHKAN BERKAS ITU! BANG HARIS TIDAK AKAN SENANG KALAU ISINYA BOCOR!', 'marah', {
    name: SURUHAN,
  }),
  say(LARAS, 'BANG HARIS... JADI NAMANYA HARIS!', 'terkejut'),
  say(RAKA, 'LARAS, MUNDUR. KAMI URUS MEREKA.', 'serius'),
  { c: 'remove', id: 'k1' },
  { c: 'remove', id: 'laras' },
];

const osisAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'laras', char: LARAS, x: 60, y: 194, face: 'right' },
  say(LARAS, 'ADA LAGI DI LABORATORIUM SAINS. SEBAGIAN BERKAS DISIMPAN DI SANA. AYO!', 'terkejut', {
    side: 'left',
  }),
  { c: 'setFlag', key: 'tahu_haris' },
];

const lab: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 190 },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 230, y: 194, face: 'left' },
  say(DIMAS, 'LABORATORIUM MALAM-MALAM... SEREM. TAPI ADA CAHAYA DARI LACI ITU.', 'khawatir', {
    side: 'left',
  }),
  { c: 'spawn', id: 'k1', char: 'B04_rival_agresif', x: 560, y: 196, face: 'left' },
  say('B04_rival_agresif', 'MEREKA SUDAH DI SINI! JANGAN BIARKAN DOKUMEN ITU KELUAR!', 'marah', {
    name: SURUHAN,
  }),
  say(RAKA, 'DIMAS, AMANKAN BERKAS. AKU YANG MENAHAN MEREKA.', 'serius'),
  { c: 'remove', id: 'k1' },
  { c: 'remove', id: 'dimas' },
];

const labAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 60, y: 194, face: 'right' },
  say(
    DIMAS,
    'RAKA, INI DIA! DAFTAR PEMALAKAN. TANGGAL, NAMA KORBAN, DAN SEMUANYA DISETOR KE SATU ORANG.',
    'terkejut',
    { side: 'left' },
  ),
  say(RAKA, 'TULISAN TANGANNYA SAMA DENGAN SURAT PALSU ITU. DALANGNYA BANG HARIS.', 'serius'),
  say(DIMAS, 'TAPI SIAPA YANG MASIH MENGAWASI KITA? AKU MERASA ADA YANG MENGIKUTI.', 'khawatir', {
    side: 'left',
  }),
];

const tangga: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 190 },
  { c: 'spawn', id: 'sekar', char: SEKAR, x: 340, y: 188, face: 'left' },
  say(SEKAR, 'JADI KALIAN YANG MENCURI BERKAS EAST BLOCK DARI LABORATORIUM!', 'marah'),
  say(RAKA, 'KAMI JUSTRU MENCARI KEBENARAN. DENGARKAN DULU.', 'serius'),
  say(SEKAR, 'TIDAK ADA YANG BISA KUPERCAYAI SEKARANG. BUKTIKAN DENGAN KEKUATANMU!', 'marah'),
  { c: 'remove', id: 'sekar' },
];

const tanggaAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'sekar', char: SEKAR, x: 300, y: 192, face: 'left', anim: 'terhuyung' },
  say(SEKAR, 'KAMU MENANGKIS SERANGANKU DENGAN MUDAH... BAIKLAH, AKU DENGARKAN.', 'khawatir'),
  say(RAKA, 'INI BERKAS DARI LABORATORIUM. LIHAT TULISAN TANGANNYA.', 'serius'),
  say(
    SEKAR,
    'INI... TULISAN BANG HARIS. AKU SUDAH LAMA CURIGA. UANG KAS EAST BLOCK SELALU KURANG.',
    'terkejut',
  ),
  say(SEKAR, 'AKU JUGA MENYELIDIKINYA DIAM-DIAM. KAMI PUNYA MUSUH YANG SAMA.', 'percaya_diri'),
  say(RAKA, 'KITA BUTUH SEMUA ORANG. TERMASUK ARGA.', 'serius'),
  say(
    SEKAR,
    'DIA SUDAH TAHU SOAL SURAT PALSU ITU. BESOK MALAM, BANG HARIS BIASANYA BERADA DI ATAP.',
    'serius',
  ),
  narasi('SEMANGAT RAKA MEMUNCAK. JURUS DORONGAN SEMANGAT TERBUKA. TEKAN J DAN K BERSAMAAN.'),
  { c: 'unlock', what: 'move:push' },
  { c: 'setFlag', key: 'sekar_sekutu' },
  { c: 'fade', dir: 'out', ms: 500 },
];

const NIGHT = { weather: 'malam' as const, music: 'tempur' };

export const CH06: ChapterDef = {
  id: 'ch06',
  title: 'BAB 6: JEJAK YANG SAMA',
  next: 'ch07',
  hub: true,
  screens: [
    {
      id: 'ch06_osis',
      stage: 'ruang_osis',
      label: 'RUANG OSIS',
      ...NIGHT,
      spawns: [
        { enemy: 'suruhan_cepat', side: 'right' },
        { enemy: 'suruhan_agresif', side: 'right', delay: 40 },
        { enemy: 'suruhan_cepat', side: 'left', delay: 40 },
      ],
      before: osis,
      after: osisAfter,
    },
    {
      id: 'ch06_lab',
      stage: 'laboratorium_sains',
      label: 'LABORATORIUM SAINS',
      ...NIGHT,
      spawns: [
        { enemy: 'suruhan_agresif', side: 'right' },
        { enemy: 'suruhan_tank', side: 'left', delay: 40 },
        { enemy: 'dash', side: 'right', delay: 40 },
        { enemy: 'suruhan_cepat', side: 'left', delay: 40 },
      ],
      before: lab,
      after: labAfter,
    },
    {
      id: 'ch06_tangga',
      stage: 'tangga',
      label: 'TANGGA',
      weather: 'malam',
      music: 'bos',
      spawns: [
        { enemy: 'suruhan_cepat', side: 'left' },
        { enemy: 'sekar', side: 'right', boss: true },
      ],
      before: tangga,
      after: tanggaAfter,
    },
  ],
};
