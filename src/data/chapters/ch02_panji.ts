// BAB 2: PANJI YANG HILANG. Perpustakaan, lorong loker, area loker, lorong jendela. Siang, berawan.
import type { ChapterDef } from './types';
import { say, narasi } from '../cutscene';
import type { Cmd } from '../cutscene';

const RAKA = 'A01_protagonis';
const DIMAS = 'A02_sahabat';
const LARAS = 'A05_ketua_kelas';
const WAWAN = 'C03_kutu_buku';
const HENDRA = 'D01_guru';
const TEGUH = 'B05_rival_bertahan';
const EAST = 'ANAK EAST BLOCK';

const perpus: Cmd[] = [
  { c: 'fade', dir: 'in', ms: 500 },
  { c: 'title', text: 'PANJI YANG HILANG', sub: 'BAB 2' },
  narasi('SIANG HARI. PERPUSTAKAAN NORTH HALL SEPI, HANYA ADA DEBU DAN BUKU TUA.'),
  { c: 'move', id: 'player', x: 130, y: 188 },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 215, y: 192, face: 'left' },
  { c: 'spawn', id: 'laras', char: LARAS, x: 60, y: 192, face: 'right' },
  { c: 'spawn', id: 'hendra', char: HENDRA, x: 330, y: 186, face: 'left' },
  say(HENDRA, 'KALIAN DATANG JUGA. DUDUKLAH. SAYA AKAN MENCERITAKAN SESUATU YANG JARANG DIBICARAKAN.', 'netral'),
  say(HENDRA, 'DULU, TIGA SEKOLAH ADALAH SATU KELUARGA. SETIAP TAHUN KAMI MENGGELAR FESTIVAL TIGA SEKOLAH.', 'netral'),
  say(HENDRA, 'PEMENANGNYA MEMBAWA PULANG PIALA PANJI. DI DASARNYA TERUKIR: MENANG BERSAMA, KALAH BERSAMA.', 'serius'),
  say(LARAS, 'KENAPA FESTIVAL ITU BERHENTI, PAK?', 'khawatir'),
  say(HENDRA, 'DUA PULUH TAHUN LALU, FINAL DIRUSUHI. PIALA PANJI HILANG DAN FESTIVAL DIBUBARKAN.', 'serius'),
  say(HENDRA, 'SEJAK ITU, TIGA SEKOLAH SALING CURIGA. TIDAK ADA YANG PERNAH MENCARI TAHU KEBENARANNYA.', 'serius'),
  { c: 'giveArchive', id: 'arsip_01' },
  say(DIMAS, 'JADI MUNGKIN PERMUSUHAN SEKARANG INI JUGA... DISENGAJA?', 'terkejut', { side: 'left' }),
  say(RAKA, 'KALAU BEGITU, KITA PERLU BUKTI. APA ADA ARSIP PANITIA?', 'serius'),
  { c: 'spawn', id: 'wawan', char: WAWAN, x: 400, y: 190, face: 'left' },
  say(WAWAN, 'MAAF MENYELA. BUKU KAS FESTIVAL YANG KUSIMPAN SEMALAM SUDAH HILANG DARI RAK!', 'terkejut'),
  say(HENDRA, 'DOKUMEN PANITIA YANG LAIN TERSIMPAN DI LORONG LOKER. CARILAH SEBELUM ADA YANG MENGHILANGKANNYA.', 'serius'),
  say(LARAS, 'FESTIVAL HARUS DIHIDUPKAN LAGI! KALAU TIGA SEKOLAH BERSATU, SIAPA PUN YANG MENGADU DOMBA AKAN KETAHUAN.', 'percaya_diri', { side: 'left' }),
  say(RAKA, 'SETUJU. KITA MULAI DARI LOKER.', 'percaya_diri'),
  { c: 'setFlag', key: 'tahu_festival' },
];

const loker: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 190 },
  { c: 'spawn', id: 'k1', char: 'B06_rival_cepat', x: 330, y: 188, face: 'left' },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 60, y: 194, face: 'right' },
  say('B06_rival_cepat', 'BERHENTI! LORONG INI DILARANG BAGI ANAK NORTH HALL!', 'marah', { name: EAST }),
  say(RAKA, 'KAMI CUMA MENCARI DOKUMEN PANITIA FESTIVAL.', 'serius'),
  say('B06_rival_cepat', 'JUSTRU ITU! KAMI DISURUH MENJAGA LOKER. JANGAN ADA YANG MENYENTUH ARSIPNYA!', 'marah', { name: EAST }),
  say(DIMAS, 'RAKA, HATI-HATI. ADA YANG TIDAK INGIN KITA MEMBACA SEJARAH.', 'khawatir', { side: 'left' }),
  { c: 'remove', id: 'k1' },
];

const lokerAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 140, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'laras', char: LARAS, x: 60, y: 194, face: 'right' },
  say(LARAS, 'ADA SELEMBAR ARSIP DI SALAH SATU LOKER! TANDA YANG BERKEDIP ITU. TEKAN E UNTUK MENGAMBIL.', 'terkejut', { side: 'left' }),
];

const areaLoker: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 192 },
  { c: 'spawn', id: 'k1', char: 'B05_rival_bertahan', x: 340, y: 190, face: 'left' },
  say('B05_rival_bertahan', 'MASIH ADA YANG BERANI? AREA INI SUDAH KAMI AMANKAN.', 'percaya_diri', { name: EAST }),
  say(RAKA, 'AMANKAN DARI SIAPA? KAMI BUKAN MUSUH KALIAN.', 'serius'),
  { c: 'remove', id: 'k1' },
];

const areaLokerAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 192 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'dimas', char: DIMAS, x: 60, y: 196, face: 'right' },
  say(DIMAS, 'LOKER INI KOSONG. SEMUA BERKAS PANITIA SUDAH DIBAWA PERGI.', 'khawatir', { side: 'left' }),
  say(RAKA, 'BERARTI ADA YANG LEBIH DULU. DAN DIA TAHU KITA AKAN DATANG.', 'serius'),
];

const jendela: Cmd[] = [
  { c: 'move', id: 'player', x: 130, y: 190 },
  { c: 'spawn', id: 'teguh', char: TEGUH, x: 340, y: 190, face: 'left' },
  say(TEGUH, 'SUDAH CUKUP. AKU TEGUH, DAN KAMU TIDAK AKAN MELEWATI LORONG INI.', 'serius', { name: 'TEGUH' }),
  say(RAKA, 'KAMU YANG MENGAMBIL BERKAS PANITIA?', 'serius'),
  say(TEGUH, 'AKU HANYA IKUT PERINTAH. KATANYA NORTH HALL INGIN MENGHANCURKAN EAST BLOCK DENGAN MENCURI ARSIP KAMI.', 'marah', { name: 'TEGUH' }),
  say(RAKA, 'KAMI TIDAK PERNAH MELAKUKAN ITU!', 'marah'),
  say(TEGUH, 'BUKTIKAN LEWAT TINJUMU! MAJU!', 'marah', { name: 'TEGUH' }),
  { c: 'remove', id: 'teguh' },
];

const jendelaAfter: Cmd[] = [
  { c: 'move', id: 'player', x: 150, y: 190 },
  { c: 'face', id: 'player', dir: 'right' },
  { c: 'spawn', id: 'teguh', char: TEGUH, x: 300, y: 192, face: 'left', anim: 'terhuyung' },
  say(TEGUH, 'KUAT... DAN KAMU TIDAK PERNAH BERNIAT MENYERANG LEBIH DULU.', 'khawatir', { name: 'TEGUH' }),
  say(RAKA, 'KARENA KAMI BUKAN YANG MEMULAI.', 'serius'),
  say(TEGUH, 'KALAU BEGITU, SIAPA YANG BOHONG PADAKU? SUDAH LAMA AKU CURIGA, TAPI TIDAK ADA BUKTI.', 'khawatir', { name: 'TEGUH' }),
  { c: 'spawn', id: 'laras', char: LARAS, x: 60, y: 194, face: 'right' },
  say(LARAS, 'TEGUH, KALAU KAMU MAU MENCARI KEBENARANNYA, BANTU KAMI. FESTIVAL HARUS KEMBALI.', 'percaya_diri', { side: 'left' }),
  say(TEGUH, 'AKAN KUPIKIRKAN. SEMENTARA ITU... JAGA DIRI.', 'netral', { name: 'TEGUH' }),
  { c: 'move', id: 'teguh', x: 520, y: 192, speed: 100 },
  { c: 'remove', id: 'teguh' },
  say(LARAS, 'SATU DEMI SATU, PIHAK EAST BLOCK MULAI RAGU. INI PERTANDA BAIK.', 'percaya_diri', { side: 'left' }),
  say(RAKA, 'TAPI SIAPA YANG MEMEGANG TALINYA? KITA BELUM TAHU.', 'serius'),
  { c: 'setFlag', key: 'teguh_ragu' },
  { c: 'unlock', what: 'location:perpustakaan' },
  { c: 'fade', dir: 'out', ms: 500 },
];

export const CH02: ChapterDef = {
  id: 'ch02',
  title: 'BAB 2: PANJI YANG HILANG',
  next: 'ch03',
  hub: true,
  screens: [
    { id: 'ch02_perpus', stage: 'perpustakaan', weather: 'berawan', label: 'PERPUSTAKAAN', spawns: [], cutsceneOnly: true, music: 'sekolah', before: perpus },
    {
      id: 'ch02_loker', stage: 'lorong_loker', weather: 'berawan', label: 'LORONG LOKER', music: 'tempur',
      spawns: [{ enemy: 'cepat', side: 'right' }, { enemy: 'agresif', side: 'left', delay: 40 }, { enemy: 'cepat', side: 'right', delay: 40 }],
      pickups: [{ id: 'arsip_02', kind: 'arsip', x: 250, y: 214 }],
      before: loker, after: lokerAfter,
    },
    {
      id: 'ch02_area_loker', stage: 'area_loker', weather: 'berawan', label: 'AREA LOKER', music: 'tempur',
      spawns: [{ enemy: 'tank', side: 'right' }, { enemy: 'agresif', side: 'left', delay: 40 }, { enemy: 'cepat', side: 'right', delay: 40 }, { enemy: 'dash', side: 'left', delay: 40 }],
      before: areaLoker, after: areaLokerAfter,
    },
    {
      id: 'ch02_jendela', stage: 'lorong_jendela', weather: 'berawan', label: 'LORONG JENDELA', music: 'bos',
      spawns: [{ enemy: 'cepat', side: 'left' }, { enemy: 'teguh', side: 'right', boss: true }],
      before: jendela, after: jendelaAfter,
    },
  ],
};
