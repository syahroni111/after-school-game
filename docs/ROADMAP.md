# ROADMAP — Milestone & Kriteria Lulus

Kerjakan berurutan. Setiap milestone selesai = `npm run check` lulus + kriteria di bawah tercentang di `PROGRESS.md` + commit `M{n}: …`.

---

## M0 — Fondasi proyek
- Inisialisasi Vite + TypeScript strict + Phaser 3 (versi dipin), ESLint/Prettier, Vitest, dan Playwright.
- Konfigurasi `vite.config.ts` (`base: './'`), `index.html` (canvas, latar hitam, `image-rendering: pixelated`, cegah scroll tombol).
- Konfigurasi game 480×270, `pixelArt`, zoom bulat, dan scene `Boot` yang menampilkan teks sederhana.
- Buat `docs/PROGRESS.md` dan `.gitignore` (`node_modules`, `dist`, `release`, `public/assets`).
**Lulus jika:** `npm run dev` menampilkan canvas hitam 480×270 yang diskalakan dengan zoom bulat; `npm run check` lulus (minimal 1 test dummy).

## M1 — Pipeline aset
- `tools/prepare-assets.mjs` sesuai CLAUDE.md §4 (deteksi otomatis `metadata.json`, salin selektif, tulis manifest, baca ukuran PNG).
- `tools/validate-content.mjs` (versi awal): setiap path di manifest ada di `public/assets` dengan huruf besar-kecil persis sama.
- Scene `Preload` memuat semua dari manifest dengan progress bar, lalu membuat animasi Phaser dari daftar indeks.
**Lulus jika:** jumlah file yang disalin dicetak (≈340; tanpa properti/tile ±240); tidak ada 404 di konsol; test unit memastikan `A01_protagonis:pukulan_kait` punya 10 frame dan `D01_guru` tidak punya `pukulan_cepat`.

## M2 — Penampil animasi & teks piksel (alat dev)
- `PixelText` (bitmap font dari `font_piksel_5x7`, uppercase + sanitasi) dan `NineSlice`.
- Scene `dev/AnimViewer`: pilih karakter dan animasi, putar/jeda, maju per frame, tampilkan nomor frame, garis tanah y=59, overlay hitbox dari `frameData.ts`, dan toggle flipX.
- Isi `src/data/frameData.ts` (nilai awal dari GDD §4.3), lalu **verifikasi visual** frame aktif setiap serangan dan koreksi bila perlu.
**Lulus jika:** screenshot AnimViewer untuk pukulan_berat di frame aktif disimpan di `docs/screens/`; kaki menempel di garis tanah pada semua frame non-udara; test teks gagal untuk string berhuruf kecil.

## M3 — Pemain & pertarungan inti
- `Fighter` + `FighterStateMachine`, `InputManager` (keyboard + gamepad, rebindable), dan `ComboBuffer`.
- Gerak 4 arah di dalam `walk_area_y`, kombo 4 hit, pukulan berat (tahan), bertahan, tangkis → serangan balik, menghindar mundur/samping (kebal), maju selangkah, dan root motion.
- `HitSystem` (hitbox/hurtbox + toleransi kedalaman), `Damage`, hitstop, guncangan kamera, `EffectPool`, dan efek sesuai GDD §4.5.
- Scene `dev/CombatSandbox`: 1 stage + 1 musuh boneka (diam, bisa diatur supaya menyerang berkala).
**Lulus jika:** semua aksi di GDD §4.1 berfungsi; test unit untuk transisi state machine (minimal 15 kasus), input buffer, dan kalkulasi damage lulus; tidak ada loncatan posisi saat animasi berganti.

## M4 — Musuh & AI
- `Enemy` dengan arketipe di GDD §5.2 (data-driven di `data/enemies.ts`), `AttackDirector` (token), perilaku mengitari, telegraph, dan KO non-grafis (jatuh → bangkit → pergi).
- Gelombang, arena terkunci, panah LANJUT, dan aturan bos masuk.
- HUD: bar HP dan stamina pemain, bar HP musuh/bos dengan papan nama, ikon status, Rp, dan kombo.
**Lulus jika:** 4 musuh di layar tidak pernah menyerang lebih dari jumlah token (diuji unit); 60 FPS stabil; satu layar uji bisa dimenangkan dan dikalahkan.

## M5 — Stage, transisi, waktu & cuaca, layar Game Over
- `data/stages.ts`: 22 stage, varian cuaca, overlay, efek lingkungan, dan dekorasi depan. `TimeWeather` + overlay hujan.
- Alur layar-per-layar dengan fade, layar Hasil (ranking S/A/B/C), dan Game Over (Coba Lagi/Keluar).
**Lulus jika:** semua 22 stage bisa dibuka dari menu debug; screenshot 5 kombinasi cuaca tersimpan; ranking dihitung oleh fungsi murni yang punya test.

## M6 — Cerita: dialog, cutscene, Prolog & Bab 1
- `DialogBox` (potret + fallback ekspresi, efek ketik, skip), `Cutscene` runner + tipe perintah, flag cerita.
- Scene `Title`, `MainMenu`, `SaveSelect`, dan `SaveSystem` (3 slot).
- Tulis **Prolog dan Bab 1 lengkap** (cutscene + layar pertarungan + bos), termasuk tutorial di Prolog.
**Lulus jika:** Prolog → Bab 1 bisa dimainkan dari menu sampai tersimpan; `validate-content` memeriksa semua teks bab (charset), semua key tokoh/animasi/stage yang dirujuk cutscene; smoke test Playwright memulai game baru dan melewati dialog pertama.

## M7 — Hub, Kantin, Dojo, Peta, Arsip
- `Hub` (jalan bebas + NPC + interaksi), `MapSelect` (`panel_peta`), `Shop` (Kantin, GDD §6), `Dojo` (beli jurus + latih tanding), dan `Archive` (Galeri Sejarah).
- Ekonomi Rp, stat permanen, buka jurus, dan karakter yang bisa dipilih di hub (Raka/Dimas/Bayu sesuai progres).
**Lulus jika:** membeli item/jurus mengubah stat atau kemampuan dan tersimpan; test Economy lulus.

## M8 — Bab 2 sampai Epilog + konten sampingan
- Tulis Bab 2–7 dan Epilog sesuai tabel GDD §3, termasuk filter sepia Bab 5 (main sebagai Hendra muda), sekutu AI Arga dan Duet Panji di Bab 7, serta bos Haris 3 fase.
- 6 Cerita Sekolah dan 12 Arsip Sejarah. Mode Bebas + Boss Rush terbuka setelah tamat.
**Lulus jika:** seluruh cerita tamat tanpa error (jalankan dengan cheat debug `?debug=1` untuk lompat bab + 1x playthrough normal); semua 22 stage terpakai (dicek oleh validate); kredit tampil.

## M9 — Audio, pengaturan, polish
- `Sfx` + `Music` (6 lagu), `Settings` (volume, skala, kesulitan, rebind, tampilkan hitbox), jeda otomatis saat tab tidak fokus, dan fokus canvas di iframe.
- Balancing (HP/damage/token per kesulitan), aksesibilitas (opsi kurangi guncangan/kilat layar), dan atlas tekstur bila perlu.
**Lulus jika:** tidak ada error konsol selama 1 playthrough; opsi tersimpan; profil performa 60 FPS dicatat di PROGRESS.md.

## M10 — Rilis itch.io
- `tools/package-itch.mjs` + verifikasi (CLAUDE.md §11), `docs/ITCH_UPLOAD.md` (langkah unggah, pengaturan embed 960×540, teks deskripsi halaman, tag, kredit, dan cover 630×500 hasil crop).
- Uji `dist/` lewat `npm run preview` **dan** dengan menyajikan isi zip yang diekstrak dari subfolder (mensimulasikan itch, path relatif).
- Bump versi ke `1.0.0`.
**Lulus jika:** `release/after-school-web-v1.0.0.zip` lolos semua cek otomatis; smoke test Playwright terhadap hasil ekstrak zip lulus; Definition of Done di GDD §12 tercentang semua.
