// BAB 7: ATAP, MALAM HUJAN. Area parkir, gang belakang, tangga, atap. Arga ikut sebagai sekutu; Duet Panji; bos Haris 3 fase.
import type { ChapterDef } from './types';
import { say, narasi } from '../cutscene';
import type { Cmd } from '../cutscene';

const RAKA = 'A01_protagonis';
const ARGA = 'B01_pemimpin_rival';
const SEKAR = 'B02_wakil_rival';
const HARIS = 'B07_senior_mengintimidasi';
const HENDRA = 'D01_guru';

const parkir: Cmd[] = [
  { c: 'fade', dir: 'in', ms: 500 },
  { c: 'title', text: 'ATAP, MALAM HUJAN', sub: 'BAB 7' },
  narasi('MALAM HARI. HUJAN DERAS MENGGUYUR AREA PARKIR NORTH HALL.'),
  { c: 'move', id: 'player', x: 130, y: 188 },
  { c: 'spawn', id: 'arga', char: ARGA, x: 240, y: 194, face: 'left' },
  { c: 'spawn', id: 'sekar', char: SEKAR, x: 330, y: 186, face: 'left' },
  say(ARGA, 'ANAK BUAHKU SUDAH KUKUMPULKAN. KALI INI KAMI DI PIHAKMU, RAKA.', 'percaya_diri'),
  say(SEKAR, 'BANG HARIS ADA DI ATAP. SURUHANNYA MENJAGA SETIAP LANTAI.', 'serius'),
  say(RAKA, 'KALAU BEGITU KITA TEMBUS SATU PER SATU. ARGA, KAMU IKUT AKU.', 'serius'),
  say(ARGA, 'DENGAN SENANG HATI. PANJI KITA SATU: MENANG BERSAMA, KALAH BERSAMA.', 'percaya_diri'),
  { c: 'remove', id: 'sekar' },
  { c: 'remove', id: 'arga' },
];

const gang: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 190 },
  narasi('MEREKA MASUK KE GANG BELAKANG. AIR HUJAN MENGGENANG DI SETIAP SUDUT.'),
  say(RAKA, 'HATI-HATI. SURUHAN INI LEBIH TERLATIH DARI YANG KEMARIN.', 'serius'),
];

const gangDuring: Cmd[] = [
  { c: 'hint', text: 'DUET PANJI: ISI METER DENGAN PUKULAN, LALU TEKAN J DAN K' },
  { c: 'wait', ms: 6000 },
  { c: 'hintOff' },
];

const gangAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'arga', char: ARGA, x: 260, y: 194, face: 'left' },
  say(ARGA, 'ADA KERTAS TERSELIP DI TUMPUKAN PETI ITU. TANDA YANG BERKEDIP. AMBIL, RAKA.', 'serius'),
];

const tangga: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 190 },
  narasi('TANGGA MENUJU ATAP. LAMPU NEON BERKEDIP, SUARA HUJAN MENGGEMA DI SEPANJANG TANGGA.'),
  say(RAKA, 'TINGGAL SATU LANTAI LAGI. SIAP?', 'serius'),
];

const tanggaAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'arga', char: ARGA, x: 260, y: 194, face: 'left' },
  say(
    ARGA,
    'DI ATAS SANA DIA SENDIRIAN. TAPI JANGAN REMEHKAN. DIA PERNAH MENGAJARIKU BERTARUNG.',
    'khawatir',
  ),
  say(RAKA, 'KAMU DULU KAGUM PADANYA.', 'netral'),
  say(ARGA, 'SAYA TERTIPU. SEKARANG SAYA MENEBUS KESALAHAN ITU.', 'serius'),
];

const atap: Cmd[] = [
  { c: 'move', id: 'player', x: 120, y: 190 },
  { c: 'spawn', id: 'arga', char: ARGA, x: 70, y: 196, face: 'right' },
  { c: 'spawn', id: 'haris', char: HARIS, x: 340, y: 188, face: 'left' },
  say(HARIS, 'ANAK BARU DAN PEMIMPIN EAST BLOCK BERSAMA? MENARIK. SANGAT MENARIK.', 'percaya_diri'),
  say(RAKA, 'KAMU DALANGNYA. SURAT PALSU, PEMALAKAN, KERIBUTAN, SEMUANYA.', 'marah'),
  say(HARIS, 'SELAMA TIGA SEKOLAH SALING MEMUSUHI, TIDAK ADA YANG PERNAH MEMERIKSA UANGKU.', 'percaya_diri'),
  say(HARIS, 'FESTIVAL TIDAK BOLEH KEMBALI. KARENA FESTIVAL AKAN MEMBUAT KALIAN BERSATU.', 'serius'),
  say(ARGA, 'KAU MENIPU KAMI SEMUA SELAMA INI, BANG!', 'marah', { side: 'left' }),
  say(
    HARIS,
    'DUA PULUH TAHUN LALU, SENIOR-SENIOR KAMI MELAKUKAN HAL YANG SAMA. AKU HANYA MELANJUTKAN WARISAN.',
    'percaya_diri',
  ),
  say(RAKA, 'WARISAN YANG MENYAKITI ORANG LAIN BUKAN WARISAN. ITU KEJAHATAN.', 'marah'),
  say(HARIS, 'KALAU BEGITU... BUKTIKAN DI ATAS ATAP INI!', 'marah'),
  { c: 'remove', id: 'haris' },
  { c: 'remove', id: 'arga' },
];

const atapAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'haris', char: HARIS, x: 300, y: 192, face: 'left', anim: 'terhuyung' },
  say(HARIS, 'AKU... KALAH. DARI ANAK PINDAHAN.', 'khawatir'),
  { c: 'spawn', id: 'arga', char: ARGA, x: 60, y: 196, face: 'right' },
  { c: 'spawn', id: 'hendra', char: HENDRA, x: 520, y: 190, face: 'left' },
  { c: 'move', id: 'hendra', x: 400, y: 190, speed: 100 },
  say(HENDRA, 'HARIS. SAYA SUDAH MENGHUBUNGI GURU DAN ORANG TUAMU. KAMU TIDAK BISA LARI.', 'serius'),
  say(HARIS, 'PAK HENDRA... ANDA MASIH DI SINI. SETELAH DUA PULUH TAHUN.', 'khawatir'),
  say(
    HENDRA,
    'DAN SAYA AKAN TETAP DI SINI. KALIAN MEMULAI SEMUA INI. SEKARANG KALIAN YANG HARUS MENANGGUNG AKIBATNYA.',
    'serius',
  ),
  { c: 'move', id: 'haris', x: 420, y: 192, speed: 60 },
  narasi('BANG HARIS DISERAHKAN KEPADA GURU. HUJAN PERLAHAN REDA.'),
  say(ARGA, 'UTANGKU PADAMU TIDAK TERBAYAR, RAKA. AKU AKAN MENEBUSNYA.', 'netral', { side: 'left' }),
  say(RAKA, 'KITA SELESAIKAN SEMUA INI DENGAN FESTIVAL. TIGA SEKOLAH, SATU PANJI.', 'percaya_diri'),
  say(ARGA, 'BERES. EAST BLOCK IKUT.', 'percaya_diri', { side: 'left' }),
  { c: 'setFlag', key: 'haris_kalah' },
  { c: 'fade', dir: 'out', ms: 700 },
];

const RAIN = { weather: 'malam' as const, rain: true, allyArga: true };

export const CH07: ChapterDef = {
  id: 'ch07',
  title: 'BAB 7: ATAP, MALAM HUJAN',
  next: 'ch08',
  hub: true,
  screens: [
    {
      id: 'ch07_parkir',
      stage: 'area_parkir',
      label: 'AREA PARKIR',
      music: 'tempur',
      rain: true,
      weather: 'malam',
      spawns: [
        { enemy: 'suruhan_cepat', side: 'right' },
        { enemy: 'suruhan_agresif', side: 'left', delay: 40 },
        { enemy: 'suruhan_tank', side: 'right', delay: 40 },
        { enemy: 'suruhan_cepat', side: 'left', delay: 40 },
      ],
      allyArga: true,
      duet: true,
      before: parkir,
    },
    {
      id: 'ch07_gang',
      stage: 'gang_belakang',
      label: 'GANG BELAKANG',
      music: 'tempur',
      ...RAIN,
      duet: true,
      spawns: [
        { enemy: 'suruhan_agresif', side: 'right' },
        { enemy: 'suruhan_cepat', side: 'left', delay: 40 },
        { enemy: 'dash', side: 'right', delay: 40 },
        { enemy: 'suruhan_tank', side: 'left', delay: 40 },
        { enemy: 'suruhan_agresif', side: 'right', delay: 40 },
      ],
      pickups: [{ id: 'arsip_11', kind: 'arsip', x: 372, y: 224 }],
      before: gang,
      during: gangDuring,
      after: gangAfter,
    },
    {
      id: 'ch07_tangga',
      stage: 'tangga',
      label: 'TANGGA',
      music: 'tempur',
      ...RAIN,
      duet: true,
      spawns: [
        { enemy: 'suruhan_tank', side: 'right' },
        { enemy: 'suruhan_agresif', side: 'left', delay: 40 },
        { enemy: 'suruhan_cepat', side: 'right', delay: 40 },
        { enemy: 'suruhan_tank', side: 'left', delay: 40 },
      ],
      before: tangga,
      after: tanggaAfter,
    },
    {
      id: 'ch07_atap',
      stage: 'atap',
      label: 'ATAP',
      music: 'bos',
      ...RAIN,
      duet: true,
      spawns: [{ enemy: 'haris', side: 'right', boss: true }],
      before: atap,
      after: atapAfter,
    },
  ],
};
