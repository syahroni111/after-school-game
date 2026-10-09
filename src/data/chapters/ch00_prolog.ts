// PROLOG: HARI PERTAMA. Gerbang utama, halaman, lorong utama. Tutorial: gerak, kombo, bertahan.
import type { ChapterDef } from './types';
import { say, narasi } from '../cutscene';
import type { Cmd } from '../cutscene';

const RAKA = 'A01_protagonis';
const DIMAS = 'A02_sahabat';
const LARAS = 'A05_ketua_kelas';
const WAWAN = 'C03_kutu_buku';
const JAKA = 'B04_rival_agresif';
const YOGA = 'B06_rival_cepat';
const HENDRA = 'D01_guru';
const EAST = 'ANAK EAST BLOCK';

const gerbang: Cmd[] = [
  { c: 'fade', dir: 'in', ms: 600 },
  { c: 'title', text: 'HARI PERTAMA', sub: 'PROLOG' },
  narasi('KOTA TIRTASARI. PAGI PERTAMA SEMESTER BARU. RAKA TIBA DI GERBANG NORTH HALL.'),
  { c: 'move', id: 'player', x: 140, y: 183, wait: true },
  say(RAKA, 'AKHIRNYA SAMPAI. SEKOLAH BARU, KOTA BARU.', 'netral'),
  { c: 'spawn', id: 'laras', char: LARAS, x: 520, y: 182, face: 'left' },
  { c: 'move', id: 'laras', x: 320, y: 182 },
  say(LARAS, 'HEI! KAMU RAKA, MURID PINDAHAN ITU, KAN?', 'percaya_diri'),
  say(LARAS, 'AKU LARAS, KETUA KELAS. SELAMAT DATANG DI NORTH HALL!', 'percaya_diri'),
  say(RAKA, 'TERIMA KASIH. ADA YANG PERLU AKU TAHU TENTANG SEKOLAH INI?', 'netral'),
  say(LARAS, 'SATU HAL. DI KOTA INI ADA TIGA SMA: NORTH HALL, EAST BLOCK, DAN SOUTH COURT.', 'serius'),
  say(LARAS, 'SUDAH DUA PULUH TAHUN KAMI SALING CURIGA. JANGAN MUDAH TERPANCING, YA.', 'khawatir'),
  say(RAKA, 'TENANG. AKU CUMA MAU BELAJAR DENGAN TENANG.', 'netral'),
  say(LARAS, 'SEMOGA BISA. AKU DULUAN KE HALAMAN. SAMPAI NANTI!', 'netral'),
  { c: 'move', id: 'laras', x: 520, y: 182, speed: 90 },
  { c: 'remove', id: 'laras' },
];

const gerbangDuring: Cmd[] = [{ c: 'hint', text: 'GERAK: PANAH ATAU WASD' }, { c: 'waitFor', cond: 'move' }, { c: 'hint', text: 'BAGUS! JALAN KE KANAN UNTUK LANJUT' }];

const halaman: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 185 },
  { c: 'spawn', id: 'wawan', char: WAWAN, x: 400, y: 186, face: 'left' },
  { c: 'spawn', id: 'k1', char: YOGA, x: 340, y: 183, face: 'right' },
  { c: 'spawn', id: 'k2', char: JAKA, x: 340, y: 194, face: 'right' },
  { c: 'spawn', id: 'laras', char: LARAS, x: 80, y: 191, face: 'right' },
  say(LARAS, 'ITU... ANAK SOUTH COURT! DIA DIPEPET ANAK EAST BLOCK!', 'terkejut', { side: 'left' }),
  say(YOGA, 'SERAHKAN UANG SAKUMU, KUTU BUKU!', 'marah', { name: EAST }),
  say(WAWAN, 'A... AKU CUMA PUNYA UANG UNTUK BELI BUKU.', 'khawatir'),
  say(RAKA, 'HEI! LEPASKAN DIA!', 'marah'),
  say(JAKA, 'SIAPA KAMU? ANAK BARU MAU JADI PAHLAWAN?', 'percaya_diri', { name: EAST }),
  say(LARAS, 'RAKA, HATI-HATI! KALAU TERPAKSA, JAGA DIRI!', 'khawatir'),
  { c: 'remove', id: 'k1' },
  { c: 'remove', id: 'k2' },
  { c: 'move', id: 'wawan', x: 440, y: 188, speed: 60 },
];

const halamanDuring: Cmd[] = [
  { c: 'hint', text: 'PUKUL: TEKAN J' },
  { c: 'waitFor', cond: 'hit' },
  { c: 'hint', text: 'KOMBO: TEKAN J BERUNTUN, AKHIRI DENGAN PUKULAN BERAT' },
  { c: 'waitFor', cond: 'combo', times: 3 },
  { c: 'hint', text: 'PUKULAN BERAT: TEKAN K. TAHAN K UNTUK BERTENAGA' },
  { c: 'wait', ms: 4000 },
  { c: 'hintOff' },
];

const halamanAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 185 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'laras', char: LARAS, x: 60, y: 192, face: 'right' },
  { c: 'spawn', id: 'wawan', char: WAWAN, x: 300, y: 188, face: 'left' },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 520, y: 185, face: 'left' },
  { c: 'move', id: 'dimas', x: 360, y: 185, speed: 110 },
  say(DIMAS, 'RAKA! DARI TADI AKU CARI KAMU!', 'percaya_diri'),
  say(RAKA, 'DIMAS! KAMU TERLAMBAT. AKU SUDAH KENA MASALAH.', 'netral'),
  say(LARAS, 'KALIAN SALING KENAL?', 'terkejut'),
  say(DIMAS, 'SAHABATKU SEJAK SMP. AKULAH YANG MENYURUHNYA PINDAH KE TIRTASARI.', 'percaya_diri'),
  say(WAWAN, 'TERIMA KASIH SUDAH MEMBELAKU. AKU WAWAN, SOUTH COURT.', 'khawatir'),
  say(WAWAN, 'KALAU BUTUH BUKU, AKU ADA DI PERPUSTAKAAN.', 'netral'),
  say(LARAS, 'BARU SEHARI DI SINI SUDAH BERURUSAN DENGAN EAST BLOCK. KAMU BERBAKAT.', 'netral'),
  say(DIMAS, 'YANG PENTING SELAMAT. AKU LAPAR. SEBELUM BEL, KANTIN DULU?', 'percaya_diri'),
  { c: 'sfx', name: 'bell' },
  say(LARAS, 'ITU BEL MASUK! AYO KE LORONG UTAMA, KELAS KITA DI SANA.', 'terkejut'),
  { c: 'setFlag', key: 'kenal_dimas' },
  { c: 'setFlag', key: 'kenal_laras' },
  { c: 'setFlag', key: 'kenal_wawan' },
  { c: 'remove', id: 'laras' },
  { c: 'remove', id: 'dimas' },
  { c: 'remove', id: 'wawan' },
];

const lorong: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 185 },
  { c: 'spawn', id: 'jaka', char: JAKA, x: 360, y: 185, face: 'left' },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 60, y: 192, face: 'right' },
  say(JAKA, 'HEH! KAU YANG HAJAR ANAK BUAHKU DI HALAMAN?', 'marah'),
  say(RAKA, 'MEREKA MEMALAK ANAK SOUTH COURT. ITU SALAH.', 'serius'),
  say(JAKA, 'URUSAN BEGITU BUKAN HAKMU! KAMI EAST BLOCK, KAMI YANG ATUR!', 'marah'),
  say(DIMAS, 'RAKA, ORANG INI MUDAH SEKALI TERPANCING. BERTAHAN DULU, BALAS SAAT DIA LENGAH.', 'percaya_diri', { side: 'left' }),
  say(JAKA, 'DIAM! MAJU KALIAN SEMUA!', 'marah'),
  { c: 'move', id: 'dimas', x: -30, y: 192, speed: 140 },
  { c: 'remove', id: 'jaka' },
];

const lorongDuring: Cmd[] = [
  { c: 'hint', text: 'BERTAHAN: TAHAN L' },
  { c: 'waitFor', cond: 'guard' },
  { c: 'hint', text: 'TANGKIS: TEKAN L TEPAT SEBELUM PUKULAN MENGENA' },
  { c: 'wait', ms: 5000 },
  { c: 'hint', text: 'HINDAR: SPASI. KEBAL SESAAT. ARAH ATAU BAWAH UNTUK SAMPING' },
  { c: 'wait', ms: 5000 },
  { c: 'hintOff' },
];

const lorongAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 185 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'jaka', char: JAKA, x: 340, y: 188, face: 'left', anim: 'terhuyung' },
  say(JAKA, 'SIAL... TAPI INI BELUM SELESAI.', 'khawatir'),
  say(JAKA, 'KATA BANG HARIS, NORTH HALL YANG MEMULAI SEMUANYA. KAMI CUMA MEMBALAS!', 'marah'),
  say(RAKA, 'KAMI TIDAK PERNAH MENANTANG SIAPA PUN.', 'serius'),
  { c: 'spawn', id: 'hendra', char: HENDRA, x: 520, y: 180, face: 'left' },
  { c: 'move', id: 'hendra', x: 250, y: 180, speed: 80 },
  say(HENDRA, 'RAMAI SEKALI PAGI INI.', 'serius'),
  { c: 'move', id: 'jaka', x: 520, y: 188, speed: 150 },
  { c: 'remove', id: 'jaka' },
  say(HENDRA, 'DUA PULUH TAHUN LALU, KERIBUTAN SEPERTI INI JUGA DIMULAI DENGAN SALAH PAHAM.', 'serius'),
  say(HENDRA, 'RAKA, YA? TEMUI SAYA DI PERPUSTAKAAN KALAU KAMU MAU TAHU SEJARAHNYA.', 'netral'),
  { c: 'setFlag', key: 'prolog_selesai' },
  { c: 'fade', dir: 'out', ms: 500 },
];

export const CH00: ChapterDef = {
  id: 'ch00',
  title: 'PROLOG: HARI PERTAMA',
  next: 'ch01',
  screens: [
    {
      id: 'ch00_gerbang',
      stage: 'gerbang_utama',
      weather: 'cerah',
      label: 'GERBANG UTAMA',
      spawns: [],
      music: 'sekolah',
      before: gerbang,
      during: gerbangDuring,
    },
    {
      id: 'ch00_halaman',
      stage: 'halaman',
      weather: 'cerah',
      label: 'HALAMAN',
      spawns: [
        { enemy: 'cepat', side: 'right' },
        { enemy: 'agresif', side: 'right', delay: 40 },
      ],
      music: 'tempur',
      before: halaman,
      during: halamanDuring,
      after: halamanAfter,
    },
    {
      id: 'ch00_lorong',
      stage: 'lorong_utama',
      label: 'LORONG UTAMA',
      spawns: [
        { enemy: 'cepat', side: 'right' },
        { enemy: 'jaka', side: 'right', boss: true },
      ],
      music: 'bos',
      before: lorong,
      during: lorongDuring,
      after: lorongAfter,
    },
  ],
};
