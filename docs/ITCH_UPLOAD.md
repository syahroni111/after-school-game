# Panduan unggah ke itch.io

Game: **AFTER SCHOOL: Jejak Tiga Sekolah** (HTML5, Phaser 3). Semua langkah di bawah dikerjakan pengguna di dashboard itch.io;
paket ZIP dibuat dan diverifikasi otomatis oleh `npm run package:itch`.

## 1. Buat paket

```bash
npm run package:itch
```

Skrip membangun `dist/`, mengemas **isi** `dist/` menjadi `release/after-school-web-v{versi}.zip`, lalu memeriksa (gagal bila satu saja tidak lolos):

- `index.html` ada di **akar** zip;
- jumlah file < 1.000, total < 500 MB, tiap file < 200 MB, panjang path ≤ 240 karakter;
- tidak ada path absolut (`src="/…"`, `href="/…"`, `url(/…)`, `"/assets/…"`) di HTML/JS/CSS;
- setiap path aset di manifest cocok **persis (huruf besar-kecil)** dengan file di zip.

Uji tambahan yang meniru itch.io (ekstrak zip, sajikan dari subfolder `/html/12345/`, buka di Chrome, harus sampai Title tanpa 404 atau error konsol):

```bash
npm run verify:zip
```

## 2. Halaman proyek baru

Dashboard → **Create new project**.

| Kolom | Isi |
|---|---|
| Title | AFTER SCHOOL: Jejak Tiga Sekolah |
| Project URL | bebas, mis. `after-school-jejak-tiga-sekolah` |
| Short description | Beat 'em up cerita 2D pixel art: tiga SMA, satu festival yang hilang. |
| Classification | Games |
| **Kind of project** | **HTML** |
| Release status | Released |
| Genre | Fighting / Beat 'em up |
| Tags | `beat-em-up`, `pixel-art`, `2d`, `story-rich`, `school`, `singleplayer`, `keyboard`, `phaser`, `indonesian` |
| Community | Disabled atau Comments (pilihan Anda) |
| Pricing | Free atau "$0 or donate" |

## 3. Unggah berkas

1. **Uploads → Upload files** → pilih `release/after-school-web-v1.0.0.zip`.
2. Centang **This file will be played in the browser**.
3. **Embed options**:
   - Viewport dimensions: **960 × 540** (rasio 16:9, kelipatan bulat dari 480×270);
   - centang **Fullscreen button**;
   - **Mobile friendly**: **tidak** dicentang (kontrol sentuh belum ada; game memakai keyboard atau gamepad);
   - Orientation: default; Scrollbars: tidak; Click to launch in fullscreen: tidak (opsional).
4. Simpan, lalu **Save & view page** dan coba main sekali dari halaman publik sebelum membagikan tautan.

> Game memakai skala layar bulat (480×270 × 2, 3, atau 4). Viewport 960×540 = skala 2 persis; tombol layar penuh memberi skala yang lebih besar tanpa blur.

## 4. Gambar

- **Cover image 630×500**: `docs/itch/cover_630x500.png` (dibuat oleh `node tools/make-cover.mjs` dari sampul 1920×1080 paket aset; subjudul diganti "JEJAK TIGA SEKOLAH").
- **Screenshot** (minimal 3, urutan disarankan), semuanya ada di `docs/screens/`:
  `M6_dialog_potret.png`, `M4_fight.png`, `M8_duet.png`, `M8_sepia.png`, `M8_penonton.png`, `M7_hub_halaman.png`, `M9_settings.png`.

## 5. Teks deskripsi (tempel di kolom Description)

```
AFTER SCHOOL: Jejak Tiga Sekolah adalah beat 'em up berbasis cerita dengan pixel art 2D.

Kamu Raka, murid pindahan di North Hall. Tiga SMA bertetangga (North Hall, East Block, South Court) saling curiga
sejak festival tahunan mereka dibatalkan dua puluh tahun lalu. Ada yang sengaja mengadu domba. Cari tahu siapa
dalangnya, kumpulkan arsip sejarah yang tercecer, dan bawa pulang Piala Panji.

FITUR
- 9 bab cerita (Prolog sampai Epilog), 22 lokasi sekolah, bos yang punya fase.
- Pertarungan berbasis animasi: kombo, tahan, tangkis tepat waktu lalu serangan balik, hindar, Dorongan Semangat.
- Duet Panji bersama Arga di Bab 7 dan kilas balik sepia di Bab 5.
- Waktu Bebas: Kantin, Dojo, peta sekolah, 6 Cerita Sekolah, 12 Arsip Sejarah.
- Mode Bebas dan Boss Rush setelah tamat, dengan tokoh yang sudah terbuka.
- Tanpa darah, tanpa senjata: lawan yang kalah jatuh, bangkit, lalu pergi.
- Musik dan efek suara disintesis langsung di browser (WebAudio), tidak ada berkas audio.

KONTROL (bisa diubah di Pengaturan)
WASD / panah: gerak     J: pukul     K: pukul berat     L: tahan (tepat waktu = tangkis)
Spasi: hindar     I atau J+K: Dorongan Semangat     E: interaksi     Esc / P: jeda
Gamepad standar juga didukung.

TIPS
Klik di dalam game agar keyboard terbaca. Game otomatis dijeda saat tab kehilangan fokus.
Progres tersimpan otomatis di browser (3 slot).

Cerita, tokoh, sekolah, dan kota adalah fiktif. Tidak ada kejadian nyata dalam cerita ini.
```

## 6. Kredit (tempel di bagian bawah deskripsi atau Credits)

- Cerita, desain, dan pemrograman: dikembangkan dengan Claude Code.
- Grafis: paket aset pixel "AFTER SCHOOL" (karakter, stage, efek, NPC, dan antarmuka).
- Audio: sintesis WebAudio orisinal (efek gaya sfxr dan enam lagu chiptune ditulis sebagai data nada).
- Mesin: Phaser 3 (MIT), TypeScript, Vite.

## 7. Sebelum publik

- [ ] Mainkan Prolog sampai Bab 1 dari halaman itch.io (bukan dari file lokal).
- [ ] Coba layar penuh dan ubah ukuran jendela: piksel tetap tajam (zoom bulat).
- [ ] Muat ulang halaman: slot simpan terbaca (localStorage per domain itch).
- [ ] Atur **Visibility** ke Public.

## Menjalankan lokal

```bash
npm install
npm run prepare-assets   # butuh paket aset (D:\ASET_PIXEL\AFTER_SCHOOL atau env ASSET_SRC)
npm run dev              # http://localhost:5273
```
