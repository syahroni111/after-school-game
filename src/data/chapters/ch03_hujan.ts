// BAB 3: HUJAN DI LAPANGAN. Lapangan basket (hujan), lapangan olahraga, parkir sepeda. Hujan lalu sore.
import type { ChapterDef } from './types';
import { say, narasi } from '../cutscene';
import type { Cmd } from '../cutscene';

const RAKA = 'A01_protagonis';
const DIMAS = 'A02_sahabat';
const BAYU = 'A08_petarung_cepat';
const BIMA = 'A04_murid_atletis';
const RIZAL = 'C04_murid_olahraga';
const YOGA = 'B06_rival_cepat';
const JAKA = 'B04_rival_agresif';
const SURUHAN = 'SURUHAN SENIOR';

const lapangan: Cmd[] = [
  { c: 'fade', dir: 'in', ms: 500 },
  { c: 'title', text: 'HUJAN DI LAPANGAN', sub: 'BAB 3' },
  narasi('HARI PERTANDINGAN PERSAHABATAN NORTH HALL LAWAN SOUTH COURT. AWAN GELAP MULAI MENUTUP LANGIT.'),
  { c: 'move', id: 'player', x: 130, y: 188 },
  { c: 'spawn', id: 'bima', char: BIMA, x: 230, y: 194, face: 'left' },
  { c: 'spawn', id: 'rizal', char: RIZAL, x: 330, y: 186, face: 'left' },
  say(
    BIMA,
    'PERTANDINGAN SEPERTI INI SUDAH LAMA TIDAK ADA. ANAK SOUTH COURT, JANGAN TAKUT KALAH!',
    'percaya_diri',
  ),
  say(RIZAL, 'KAMI SIAP! TAPI HUJANNYA DERAS SEKALI... SEMOGA TIDAK BATAL.', 'khawatir'),
  say(
    RAKA,
    'LARAS BILANG KEDUA SEKOLAH SUDAH SETUJU. INI LANGKAH PERTAMA MENGHIDUPKAN FESTIVAL.',
    'percaya_diri',
  ),
  { c: 'spawn', id: 'k1', char: YOGA, x: 540, y: 190, face: 'left' },
  { c: 'spawn', id: 'k2', char: JAKA, x: 560, y: 206, face: 'left' },
  { c: 'move', id: 'k1', x: 400, y: 190, speed: 120, wait: false },
  { c: 'move', id: 'k2', x: 420, y: 206, speed: 120 },
  say(YOGA, 'BUBARKAN PERMAINAN INI! ATAS PERINTAH SENIOR!', 'marah', { name: SURUHAN }),
  say(RIZAL, 'SIAPA KALIAN? INI PERTANDINGAN PERSAHABATAN!', 'marah'),
  say(BIMA, 'RAKA, KAMI BANTU. TAPI JANGAN SAMPAI ADA YANG TERLUKA.', 'serius'),
  say(RAKA, 'SERAHKAN PADAKU. KALIAN LINDUNGI SEMUA ORANG.', 'serius'),
  { c: 'remove', id: 'k1' },
  { c: 'remove', id: 'k2' },
];

const lapanganAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'bima', char: BIMA, x: 240, y: 194, face: 'left' },
  say(BIMA, 'MEREKA KABUR KE LAPANGAN OLAHRAGA! AYO KEJAR, RAKA!', 'marah'),
];

const olahraga: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 190 },
  narasi('HUJAN MEREDA MENJADI GERIMIS SORE. MEREKA MENCOBA MENGHILANG DI BALIK TRIBUN.'),
  say(RAKA, 'MEREKA TIDAK AKAN BERHENTI SEBELUM PERTANDINGAN BUBAR. HADANG MEREKA!', 'serius'),
];

const olahragaAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 60, y: 194, face: 'right' },
  say(
    DIMAS,
    'RAKA! MASIH ADA DUA ORANG LAGI DI PARKIR SEPEDA. MEREKA YANG MEMBAWA ARAHAN SENIOR ITU!',
    'terkejut',
    { side: 'left' },
  ),
];

const parkir: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 192 },
  { c: 'spawn', id: 'jaka', char: JAKA, x: 340, y: 186, face: 'left' },
  { c: 'spawn', id: 'yoga', char: YOGA, x: 380, y: 204, face: 'left' },
  say(JAKA, 'HEH, KAU LAGI! PERNAH KAU KALAHKAN AKU, TAPI KALI INI KAMI BERDUA!', 'marah'),
  say(YOGA, 'KAMI SUDAH DIJANJIKAN SESUATU KALAU BERHASIL. JANGAN HALANGI KAMI.', 'serius', { name: 'YOGA' }),
  say(RAKA, 'DIJANJIKAN APA? DAN OLEH SIAPA?', 'serius'),
  say(YOGA, 'BUKAN URUSANMU! SERANG!', 'marah', { name: 'YOGA' }),
  { c: 'remove', id: 'jaka' },
  { c: 'remove', id: 'yoga' },
];

const parkirAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 192 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'yoga', char: YOGA, x: 290, y: 196, face: 'left', anim: 'terhuyung' },
  say(YOGA, 'KAMI DISURUH SENIOR. KATANYA KALAU KALIAN AKRAB, KAMI SEMUA DIHUKUM.', 'khawatir', {
    name: 'YOGA',
  }),
  say(RAKA, 'DIHUKUM SIAPA? APA YANG DIA TAKUTKAN DARI PERSAHABATAN KITA?', 'serius'),
  say(YOGA, 'AKU TIDAK TAHU... TAPI DIA SELALU MENAGIH UANG DARI KAMI SEMUA.', 'khawatir', { name: 'YOGA' }),
  { c: 'move', id: 'yoga', x: 520, y: 196, speed: 130 },
  { c: 'remove', id: 'yoga' },
  { c: 'spawn', id: 'bayu', char: BAYU, x: 520, y: 192, face: 'left' },
  { c: 'move', id: 'bayu', x: 300, y: 192, speed: 160 },
  say(BAYU, 'WAH, KAMU YANG DISEBUT-SEBUT ANAK PINDAHAN ITU? AKU BAYU, KELAS SEBELAH.', 'percaya_diri'),
  say(
    BAYU,
    'AKU MENONTON DARI TRIBUN. GERAKANMU BAGUS, TAPI KURANG CEPAT. MAU BELAJAR DARIKU?',
    'percaya_diri',
  ),
  { c: 'unlock', what: 'char:A08_petarung_cepat' },
  say(RAKA, 'KALAU KAMU MAU MEMBANTU, AKU TERIMA DENGAN SENANG HATI.', 'netral'),
  narasi('JURUS MAJU SELANGKAH KINI BISA DIPELAJARI DI DOJO GILANG.'),
  { c: 'setFlag', key: 'kenal_bayu' },
  { c: 'unlock', what: 'location:lapangan_basket' },
  { c: 'unlock', what: 'location:ruang_musik' },
  { c: 'unlock', what: 'location:parkir_sepeda' },
  { c: 'fade', dir: 'out', ms: 500 },
];

export const CH03: ChapterDef = {
  id: 'ch03',
  title: 'BAB 3: HUJAN DI LAPANGAN',
  next: 'ch04',
  hub: true,
  screens: [
    {
      id: 'ch03_basket',
      stage: 'lapangan_basket',
      weather: 'hujan',
      label: 'LAPANGAN BASKET',
      music: 'tempur',
      spawns: [
        { enemy: 'cepat', side: 'right' },
        { enemy: 'agresif', side: 'left', delay: 40 },
        { enemy: 'dash', side: 'right', delay: 40 },
        { enemy: 'cepat', side: 'left', delay: 40 },
      ],
      before: lapangan,
      after: lapanganAfter,
    },
    {
      id: 'ch03_olahraga',
      stage: 'lapangan_olahraga',
      weather: 'sore',
      rain: true,
      label: 'LAPANGAN OLAHRAGA',
      music: 'tempur',
      spawns: [
        { enemy: 'tank', side: 'right' },
        { enemy: 'agresif', side: 'left', delay: 40 },
        { enemy: 'dash', side: 'right', delay: 40 },
        { enemy: 'cepat', side: 'left', delay: 40 },
      ],
      crowd: 'murid_menonton_dari_jauh',
      before: olahraga,
      after: olahragaAfter,
    },
    {
      id: 'ch03_parkir',
      stage: 'parkir_sepeda',
      weather: 'sore',
      label: 'PARKIR SEPEDA',
      music: 'bos',
      spawns: [
        { enemy: 'cepat', side: 'right' },
        { enemy: 'jaka', side: 'right', delay: 60 },
        { enemy: 'yoga', side: 'left', boss: true },
      ],
      pickups: [{ id: 'arsip_04', kind: 'arsip', x: 360, y: 232 }],
      before: parkir,
      after: parkirAfter,
    },
  ],
};
