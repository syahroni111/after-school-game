// BAB 1: KABAR DARI GANG BELAKANG. Ruang kelas, kantin, area parkir, gang belakang. Sore hari.
import type { ChapterDef } from './types';
import { say, narasi } from '../cutscene';
import type { Cmd } from '../cutscene';

const RAKA = 'A01_protagonis';
const DIMAS = 'A02_sahabat';
const LARAS = 'A05_ketua_kelas';
const GILANG = 'A07_petarung_bertahan';
const RENDY = 'B03_rival_atletis';
const ANDI = 'C01_murid_pria';
const EAST = 'ANAK EAST BLOCK';

const kelas: Cmd[] = [
  { c: 'fade', dir: 'in', ms: 500 },
  { c: 'title', text: 'KABAR DARI GANG BELAKANG', sub: 'BAB 1' },
  narasi('SORE HARI. BEL PULANG SUDAH BERBUNYI, KELAS HAMPIR KOSONG.'),
  { c: 'move', id: 'player', x: 130, y: 183 },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 230, y: 188, face: 'left' },
  { c: 'spawn', id: 'laras', char: LARAS, x: 520, y: 180, face: 'left' },
  { c: 'move', id: 'laras', x: 320, y: 180 },
  say(LARAS, 'RAKA, DIMAS, ADA KABAR BURUK DARI WAWAN.', 'khawatir'),
  say(
    LARAS,
    'PEMALAKAN DI AREA PARKIR DAN GANG BELAKANG MAKIN SERING. KORBANNYA ANAK TIGA SEKOLAH.',
    'serius',
  ),
  say(DIMAS, 'TIGA SEKOLAH? BERARTI BUKAN CUMA ANAK EAST BLOCK YANG KENA?', 'terkejut', { side: 'left' }),
  say(RAKA, 'KALAU BEGITU, SIAPA YANG DIUNTUNGKAN?', 'serius'),
  say(LARAS, 'ITU YANG MAU KUCARI TAHU. TAPI GANG BELAKANG TIDAK AMAN UNTUK SENDIRIAN.', 'khawatir'),
  say(DIMAS, 'AKU IKUT. TAPI ISI PERUT DULU, YA.', 'percaya_diri', { side: 'left' }),
  say(
    LARAS,
    'HA HA. INI UANG KAS KELAS. BELI MAKAN DI KANTIN. JANGAN PINGSAN SEBELUM BERTARUNG.',
    'percaya_diri',
  ),
  { c: 'giveMoney', amount: 3000 },
  { c: 'unlock', what: 'location:kantin' },
  say(RAKA, 'TERIMA KASIH, LARAS.', 'netral'),
  { c: 'setFlag', key: 'kantin_terbuka' },
];

const kantin: Cmd[] = [
  { c: 'fade', dir: 'in', ms: 400 },
  { c: 'move', id: 'player', x: 150, y: 183 },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 300, y: 185, face: 'left' },
  say(DIMAS, 'GORENGAN, ES TEH, ROTI BAKAR... SEMUA ENAK DI SINI!', 'percaya_diri'),
  say(RAKA, 'KAMU BAHAGIA SEKALI KALAU SOAL MAKANAN.', 'netral'),
  say(DIMAS, 'MAKAN ENAK BIKIN PUKULAN LEBIH KUAT. SUNGGUH! COBA SAJA.', 'percaya_diri'),
  narasi('KANTIN SEKARANG TERBUKA. BELI MAKANAN UNTUK MEMULIHKAN DARAH DAN MENAMBAH KEKUATAN.'),
  say(RAKA, 'BAIKLAH. TAPI SETELAH INI KITA PERIKSA GANG BELAKANG.', 'serius'),
];

const parkir: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 183 },
  { c: 'spawn', id: 'andi', char: ANDI, x: 300, y: 188, face: 'right' },
  { c: 'spawn', id: 'k1', char: 'B04_rival_agresif', x: 360, y: 185, face: 'left' },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 60, y: 193, face: 'right' },
  say('B04_rival_agresif', 'INI PARKIRAN KAMI. YANG LEWAT HARUS BAYAR!', 'percaya_diri', { name: EAST }),
  say(ANDI, 'AKU CUMA MAU AMBIL SEPEDA... TOLONG...', 'khawatir'),
  say(RAKA, 'MINGGIR. ANAK ITU TIDAK PUNYA URUSAN DENGAN KALIAN.', 'serius'),
  say(DIMAS, 'RAKA, AKU JAGA SEPEDA MOTOR INI SAJA YA. EH, ITU PERUTKU.', 'terkejut', { side: 'left' }),
  { c: 'remove', id: 'k1' },
  { c: 'remove', id: 'andi' },
];

const parkirAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 185 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'andi', char: ANDI, x: 310, y: 188, face: 'left' },
  say(ANDI, 'TERIMA KASIH! AKU ANDI, SOUTH COURT.', 'netral'),
  say(ANDI, 'HATI-HATI DI GANG BELAKANG. ADA YANG LEBIH GALAK DARI MEREKA.', 'khawatir'),
  { c: 'remove', id: 'andi' },
];

const gang: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 185 },
  { c: 'spawn', id: 'rendy', char: RENDY, x: 360, y: 185, face: 'left' },
  say(RENDY, 'TIDAK ADA YANG BOLEH LEWAT GANG INI, ANAK NORTH HALL.', 'serius', { name: 'RENDY' }),
  say(RAKA, 'KAMI CUMA MENCARI TAHU SIAPA YANG MEMERINTAHKAN PEMALAKAN.', 'serius'),
  say(RENDY, 'AKU TIDAK TAHU APA-APA. AKU CUMA DISURUH MENJAGA.', 'netral', { name: 'RENDY' }),
  say(RAKA, 'DISURUH SIAPA?', 'marah'),
  say(RENDY, 'MAJU SAJA!', 'marah', { name: 'RENDY' }),
  { c: 'remove', id: 'rendy' },
];

const gangAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 185 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'rendy', char: RENDY, x: 300, y: 187, face: 'left', anim: 'terhuyung' },
  say(RENDY, 'AKU... DISURUH SENIOR. KATANYA KALIAN YANG MENGHINA EAST BLOCK DULUAN.', 'khawatir', {
    name: 'RENDY',
  }),
  say(RAKA, 'KAMI TIDAK PERNAH MENGHINA SIAPA PUN. SENIOR SIAPA?', 'serius'),
  say(RENDY, 'AKU TIDAK BERANI BILANG...', 'khawatir', { name: 'RENDY' }),
  { c: 'spawn', id: 'gilang', char: GILANG, x: 520, y: 180, face: 'left' },
  { c: 'move', id: 'gilang', x: 340, y: 180, speed: 90 },
  say(GILANG, 'CUKUP. DIA SUDAH KALAH.', 'serius'),
  { c: 'move', id: 'rendy', x: -30, y: 187, speed: 130 },
  { c: 'remove', id: 'rendy' },
  say(GILANG, 'AKU GILANG, KETUA KLUB BELA DIRI. KAMU RAKA, YANG MURID PINDAHAN ITU.', 'netral'),
  say(
    GILANG,
    'REFLEKSMU BAGUS, TAPI TANGKISANMU MASIH KASAR. DATANGLAH KE DOJO DI GIMNASIUM.',
    'percaya_diri',
  ),
  say(GILANG, 'AKU AJARKAN TANGKIS DAN SERANGAN BALIK. GRATIS, SEBAGAI PERKENALAN.', 'percaya_diri'),
  { c: 'unlock', what: 'move:counter' },
  { c: 'unlock', what: 'location:gimnasium' },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 60, y: 191, face: 'right' },
  say(DIMAS, 'AKU JUGA MAU BELAJAR! KALAU CUMA LAPAR, AKU JUARA!', 'percaya_diri', { side: 'left' }),
  { c: 'unlock', what: 'char:A02_sahabat' },
  say(RAKA, 'KITA BELUM TAHU SIAPA SENIOR ITU. TAPI KITA PASTI KETEMU.', 'serius'),
  { c: 'setFlag', key: 'ch01_selesai' },
  { c: 'fade', dir: 'out', ms: 500 },
];

export const CH01: ChapterDef = {
  id: 'ch01',
  title: 'BAB 1: KABAR DARI GANG BELAKANG',
  next: 'ch02',
  hub: true,
  screens: [
    {
      id: 'ch01_kelas',
      stage: 'ruang_kelas',
      weather: 'sore',
      label: 'RUANG KELAS',
      spawns: [],
      cutsceneOnly: true,
      music: 'sekolah',
      before: kelas,
    },
    {
      id: 'ch01_kantin',
      stage: 'kantin',
      label: 'KANTIN',
      spawns: [],
      cutsceneOnly: true,
      music: 'sekolah',
      before: kantin,
    },
    {
      id: 'ch01_parkir',
      stage: 'area_parkir',
      weather: 'sore',
      label: 'AREA PARKIR',
      spawns: [
        { enemy: 'cepat', side: 'right' },
        { enemy: 'agresif', side: 'left', delay: 40 },
        { enemy: 'dash', side: 'right', delay: 40 },
      ],
      music: 'tempur',
      before: parkir,
      after: parkirAfter,
    },
    {
      id: 'ch01_gang',
      stage: 'gang_belakang',
      weather: 'sore',
      label: 'GANG BELAKANG',
      spawns: [
        { enemy: 'agresif', side: 'left' },
        { enemy: 'cepat', side: 'right', delay: 40 },
        { enemy: 'tank', side: 'right', delay: 40 },
        { enemy: 'rendy', side: 'right', boss: true },
      ],
      music: 'bos',
      before: gang,
      after: gangAfter,
    },
  ],
};
