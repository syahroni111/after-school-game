# PROGRESS — AFTER SCHOOL: Jejak Tiga Sekolah

Log kerja pengembang. Diperbarui di awal dan akhir setiap milestone.

## Ringkasan pemahaman
- Beat 'em up berbasis cerita, 2D pixel art 480×270, berjalan di browser (Phaser 3 + TypeScript + Vite), dirilis ke itch.io sebagai ZIP HTML5.
- Tiga SMA fiktif di kota Tirtasari: North Hall (pemain, Raka), East Block (rival, Arga/Sekar/Bang Haris), South Court (korban dan NPC).
- Struktur: Prolog, Bab 1–7, Epilog. Tiap bab = dialog pembuka, 2–4 layar arena terkunci, bos, dialog penutup + Arsip Sejarah, lalu Waktu Bebas (hub).
- Pertarungan tangan kosong: kombo 4 hit, pukulan berat, bertahan, tangkis→serangan balik, menghindar, maju selangkah, Dorongan Semangat. Hanya animasi yang ada di paket; tidak ada lompat/tendang/banting/senjata.
- Logika tempur fixed timestep 60 Hz; animasi 12 fps (1 frame anim = 5 tick). Frame aktif/kebal/root-motion ada di `data/frameData.ts`.
- Musuh data-driven; `AttackDirector` membatasi penyerang bersamaan (token 1/2/3 sesuai kesulitan), musuh lain mengitari 70–110 px, selisih kedalaman |Δy| ≤ 10 untuk kena.
- Ekonomi: Rp dari musuh; Kantin (stat permanen pembelian pertama), Dojo (beli jurus, latih tanding), 6 Cerita Sekolah, 12 Arsip Sejarah, ranking S/A/B/C.
- Semua teks KAPITAL dan hanya karakter font 5×7 (`A-Z 0-9 spasi . , ! ? - : / ' &`); divalidasi oleh `validate-content` dan test unit.
- Aset dibaca dari paket (hanya-baca) lewat `tools/prepare-assets.mjs` → `public/assets` + `src/generated/assetManifest.ts`. Audio prosedural WebAudio. Simpan di localStorage (3 slot).
- Konten non-grafis: musuh kalah jatuh, bangkit, lalu pergi. Tidak boleh memakai nama/teks game referensi. Sejarah dalam game fiktif.
- Rilis: `npm run package:itch` → `release/after-school-web-v{versi}.zip` + verifikasi aturan itch.io (index.html di root, path relatif, case-sensitive).

## Milestone
- [x] M0 — Fondasi proyek
- [x] M1 — Pipeline aset
- [x] M2 — Penampil animasi & teks piksel
- [x] M3 — Pemain & pertarungan inti
- [x] M4 — Musuh & AI
- [x] M5 — Stage, transisi, waktu & cuaca, Game Over
- [x] M6 — Cerita: dialog, cutscene, Prolog & Bab 1
- [x] M7 — Hub, Kantin, Dojo, Peta, Arsip
- [ ] M8 — Bab 2 sampai Epilog + konten sampingan
- [ ] M9 — Audio, pengaturan, polish
- [ ] M10 — Rilis itch.io

## Keputusan
- **Lokasi paket aset**: paket ternyata ada di `D:\ASET_PIXEL\after-school-game\AFTER_SCHOOL` (metadata.json langsung di dalamnya), bukan `D:\ASET_PIXEL\AFTER_SCHOOL` seperti tertulis di dokumen (folder itu tidak ada; hanya ada ZIP `AFTER_SCHOOL_pixel_action_pack.zip` di `D:\ASET_PIXEL`). `prepare-assets` mencoba berurutan: env `ASSET_SRC` → `D:\ASET_PIXEL\AFTER_SCHOOL` → `<proyek>\AFTER_SCHOOL`. Folder paket di-gitignore (sumber, hanya-baca).
- Verifikasi awal metadata vs ASSET_MAP: 414 file dan 190 entri sheet; nama karakter, stage, potret, dan font cocok. Font 276×7 (46 glyph × 6). Sheet A01 1024×1216 (294 frame, 16 kolom). Tidak ada perbedaan yang menghambat.

- **Versi tooling** (dipin exact di package.json): Phaser 3.90.0, TypeScript 5.9.3 (typescript-eslint 8 mensyaratkan TS < 6.1, jadi TS 7 tidak dipakai), Vite 7.3.7, Vitest 5.0.3, ESLint 9, Playwright 1.64.0, adm-zip untuk zip.
- **Port dev**: 5273 (dev) dan 4273 (preview), strictPort. Port 5173 default sedang dipakai aplikasi lain milik pengguna (proyek berbeda), jadi tidak dipakai; Playwright memakai `reuseExistingServer: false` agar tidak salah menembak server lain.
- **Playwright memakai Chrome sistem** (`channel: 'chrome'`): Playwright 1.64 meminta Chromium r1248 yang belum terpasang (yang ada r1243). Browser tidak diunduh.
- **Modul logika murni tidak boleh meng-import Phaser (nilai)**, karena Phaser butuh `window` dan tidak bisa dimuat di Vitest/Node. Yang butuh Phaser hanya `scenes/`, `entities/`, `ui/`, dan `main.ts`; import tipe saja (`import type`) boleh.

## M0 — selesai
Rencana: scaffolding Vite+TS strict+Phaser, zoom bulat, scene Boot, ESLint/Prettier/Vitest/Playwright.
- [x] `npm run dev` menampilkan canvas 480×270 dengan zoom bulat (screenshot `docs/screens/M0_boot.png`, zoom ×2 di 960×540).
- [x] `npm run check` lulus (typecheck, lint, 3 test, validate stub); `npm run build` dan `npm run test:e2e` lulus.

## M1 — selesai
Rencana: `prepare-assets` (deteksi metadata, salin selektif, manifest), `validate-content` v1, scene Preload (progress bar + animasi dari indeks manifest), test unit manifest.
- [x] Disalin **245 file** (inti tanpa properti: 234; ≈240 sesuai ROADMAP) ke `public/assets`; manifest 131 spritesheet + 114 gambar. Tidak ada peringatan ukuran PNG vs metadata.
- [x] E2E: tidak ada 404 dan tidak ada error konsol; screenshot `docs/screens/M1_assets.png` (stage halaman + Raka, kaki di titik y=220, piksel tajam).
- [x] Test unit: `A01_protagonis:pukulan_kait` = 10 frame; `D01_guru` tidak punya `pukulan_cepat`; kelompok C tanpa pukulan; 23 karakter, 22 stage; tidak ada tabrakan key animasi; semua indeks frame valid.

Keputusan M1:
- Tile 06 (`aspal`, `rumput`, dst.) tidak disalin: stage sudah dilukis penuh dan tile tidak dipakai (hemat 16 file). Properti disalin lewat daftar putih `PROPS` di `prepare-assets.mjs` (hanya yang dipakai; tambah bila perlu). Formasi NPC: hanya versi `_transparan`. Sampul: hanya 240×135 dan 320×180 (1920×1080 untuk halaman itch, dipakai skrip rilis dari sumber).
- Key animasi karakter semua sheet: `{charKey}:{anim}` (tidak ada tabrakan antar sheet, diuji). Sheet lain: `{sheetKey}:{anim}` (mis. `fx:impact_kecil:main`, `ui:penanda_tujuan:loop`). Sheet `_ekspresi` tidak punya `origin` di metadata; kode memakai default (32,59).
- `validate-content.mjs` memuat modul TS lewat Vite SSR (`ssrLoadModule`), jadi validator murni di `src/` bisa dipakai bersama oleh skrip dan Vitest. Pemeriksaan huruf besar-kecil memakai `readdirSync` (Windows tidak membedakan).
- Cuaca: file `13_WEATHER/{stage}_{cuaca}.png` → key `stage:{stage}:{cuaca}`; overlay hujan = sheet 4 frame vertikal, key `fx:overlay_hujan`.

## M2 — selesai
Rencana: `PixelText` (RetroFont dari font 5×7) + `util/text.ts` (aturan teks murni), `NineSlice`, `frameData.ts`, scene `dev/AnimViewer` (`?scene=AnimViewer&char=…&anim=…&frame=…&pause=1`), test yang mengukur piksel sheet asli.
- [x] Screenshot AnimViewer frame aktif: `docs/screens/M2_animviewer_pukulan_berat.png` (+ pukulan_cepat, serangan_balik, dorong). Hitbox merah menutupi kepalan, hurtbox hijau di tubuh, kaki tepat di garis tanah kuning.
- [x] Test `sprites.test.ts` (mengukur PNG asli untuk 15 petarung): kaki di baris 58–59 pada semua frame non-udara; frame aktif tiap serangan = frame lengan paling terentang; hitbox menjangkau kepalan (+2..+4 px); root motion cocok dengan pergeseran sprite (±3 px). Test `text.test.ts`: string huruf kecil / karakter di luar font **gagal** validasi.

Keputusan M2:
- Nilai awal GDD §4.3 ternyata cocok dengan piksel (jendela aktif = frame lengan terentang; root motion −10/+8/−6/−18 cocok). Tidak ada yang dikoreksi; hanya hitbox lokal yang ditentukan dari jangkauan kepalan terukur (A01: jab +24, lurus +26, kait +21, badan +27, berat +30, balik +28, dorong +28 dari titik kaki).
- Perilaku root motion: sprite bergeser di dalam frame selama animasi; posisi entitas digeser di akhir animasi (sesuai CLAUDE.md §6). Sprite `jatuh` frame 0 kembali berdiri di titik yang sama dengan akhir `terpental`, jadi tidak ada loncatan.
- Font: sel 6×7 (glyph 5 + 1 px kosong), warna putih sehingga bisa diwarnai dengan tint. `PixelText` = subclass `BitmapText` (RetroFont), `setText` selalu lewat `sanitizeText`.
- Frame animasi dikendalikan oleh logika (tick), bukan oleh timer Phaser; animasi Phaser dipakai untuk efek, NPC, dan UI.

## M3 — selesai
Rencana: simulasi murni dulu (state machine, combo buffer, damage, `Fighter`, `HitSystem`, `CombatWorld`), baru lapisan Phaser (`InputManager`, `PlayerController`, `SpriteView`, `EffectPool`, `ScreenFx`, `CombatPresenter`) dan scene `dev/CombatSandbox` (`?scene=CombatSandbox&mode=still|jab|heavy|guard`).
- [x] Semua aksi GDD §4.1 berfungsi (diuji unit dan e2e dengan keyboard nyata): gerak 4 arah, kombo 4 hit, berat (tahan = bertenaga), bertahan, tangkis → serangan balik, menghindar mundur/samping, maju selangkah + pukulan lurus dash, pukulan badan (arah belakang + J), Dorongan Semangat (I atau J+K).
- [x] Test: state machine 21 kasus (≥15), input buffer 6 kasus, damage 8 kasus, input/Player 15 kasus, simulasi Fighter 30 kasus (kombo, kedalaman ±10, parry, kebal saat menghindar, KO non-grafis, root motion, simulasi acak 4000 tick tanpa loncatan >20 px/tick). Total unit 108 lulus.
- [x] Screenshot `docs/screens/M3_heavy_hit.png` (efek impact + gelombang kejut saat pukulan berat mendarat, simulasi dibekukan oleh `freezeOnHit`) dan `M3_sandbox.png` (musuh jatuh di tanah).

Keputusan M3:
- **Parry**: menekan Bertahan ≤ 8 tick (133 ms) sebelum serangan mendarat, dan hanya jika Bertahan tidak baru dilepas (<20 tick, anti-spam). Animasi `tangkis` diputar mulai frame 2 (frame jendela 2–5 di `frameData`), `bertahan` dipakai sebagai reaksi saat serangan ditahan, `kuda_kuda_jaga` sebagai tahan diam.
- **Pukulan berat bertenaga**: wind-up berhenti di frame 5 selama tombol K masih ditahan; ≥ 250 ms tahan = damage ×1,5 dan hitstop lebih panjang. Ketukan cepat tidak ada penundaan (responsif).
- **Chord J+K** diubah menjadi aksi `special` oleh `PlayerController`; `special` boleh memotong 3 frame pertama serangan lain, jadi urutan J lalu K sedikit terlambat tetap jadi Dorongan.
- **Root motion**: `applyRoot()` saat animasi selesai; jika animasi dipotong, `commitDrift()` menerapkan pergeseran yang sudah tampil (tabel khusus `terhuyung`: frame 0 = 0, frame 1 = 85%, frame ≥ 2 = 100%). Pukulan beruntun mengulang `terhuyung` dari frame 2 supaya sprite tidak meloncat. Pergeseran sprite terukur dari piksel: terhuyung −6, terpental −18, mundur −10, maju +8 (cocok dengan GDD).
- Stagger geser (slide) hanya pada pukulan pertama kombo (0,35 px/tick meluruh) supaya rantai kombo tetap menyambung; maju-dash membawa momentum ke pukulan lurus dash (14 tick).
- Frame animasi dikendalikan logika (tick), hitstop membekukan semuanya termasuk animasi karakter; efek Phaser tetap jalan.
- Prettier dijalankan sekali pada seluruh kode (print width 110).

## M4 — selesai
Rencana: `AttackDirector` (token + slot mengitari), `WaveDirector` (maks. 4 di layar, bos saat kroco ≤ 1), data `enemies.ts` (15 musuh/bos) + `difficulty.ts`, `EnemyBrain` (mengitari → mendekat → menyerang rencana; reaksi bertahan/menghindar/tangkis; telegraph merah untuk serangan berat), `Hud`, scene `Stage` (arena terkunci, LANJUT, uang, fase bos), `Profile`/`GameState`.
- [x] Unit: `AttackDirector` (token, cooldown, timeout), `WaveDirector` (batas 4, bos menunggu), data musuh, dan **simulasi 3600 tick, 4 musuh vs pemain di tiga kesulitan: pemegang token dan penyerang aktif tidak pernah melebihi 1/2/3**. Total unit 127 lulus.
- [x] E2E dengan bot yang bermain lewat keyboard nyata: layar `test` (3 kroco + Dash + bos Jaka) dimenangkan; aturan bos masuk saat kroco ≤ 1 terverifikasi; LANJUT muncul hanya setelah semua kalah; layar `kecil` bisa dikalahkan (overlay KALAH). Screenshot: `M4_fight.png`, `M4_clear.png` (KO bos: starburst + garis fokus + vinyet, marker LANJUT, bar bos JAKA), `M4_result.png`, `M4_lose.png`.
- [x] Performa: 56–58 FPS di Chrome headless (WebGL software/SwiftShader, 4–5 petarung + efek), ±51 FPS saat Playwright ikut menembak `evaluate` tiap 70 ms. Belum diprofil di GPU nyata; target 60 FPS dicek lagi di M9.

Keputusan M4:
- Basis waktu AI = `world.tickCount` (bukan tick petarung) supaya sama dengan `AttackDirector`; tick petarung berhenti saat hitstop, sehingga basis berbeda membuat token kedaluwarsa sebelum waktunya (ditemukan oleh test simulasi).
- Marker LANJUT memakai `penanda_tujuan` (cincin sasaran beranimasi) + teks "LANJUT" berkedip. Font tidak punya panah dan menggambar panah dilarang (CLAUDE.md §8: hanya persegi/overlay), jadi tanpa glyph panah.
- Bar "darah sementara" Dorongan Semangat digambar dengan `bar_kesehatan_rival` (merah tua) di segmen yang bisa pulih, karena `bar_kesehatan_setengah` di paket ternyata bar yang terisi separuh, bukan gaya khusus. Papan nama (`papan_nama_*`) memuat nama sekolah, jadi nama musuh ditulis sebagai teks di bawahnya.
- Bos: HP bos selalu tampil di panel kanan; kroco menampilkan bar sesaat setelah dipukul. Fase bos (Arga marah, Haris memanggil suruhan dan gelap) ada di data `phases` dan diproses `Stage.checkPhases`.
- Stage sementara menampilkan overlay MENANG/KALAH/JEDA berlatar gelap. Layar Hasil, Jeda, dan Game Over penuh ada di M5.
- KO dihitung saat pukulan penentu (`stats.kos`), bukan saat musuh selesai berbaring.

## M5 — selesai
Rencana: `TimeWeather` (pilih gambar latar/tint/hujan), `Backdrop` (latar + dekorasi + burung + hujan + sepia), `Ranking`, `ui/Menu` + `Panel`, scene `Pause`, `Result`, `GameOver`, `dev/DebugMenu`; `Stage` memakai semuanya.
- [x] Semua 22 stage terbuka dari menu debug / `?scene=Stage&stage=ID&weather=…` tanpa 404 dan tanpa error konsol (e2e membuka satu per satu).
- [x] Screenshot kombinasi cuaca/waktu: `M5_halaman_cerah/hujan/sore.png`, `M5_lapangan_basket_malam.png`, `M5_lorong_utama_malam.png` (tint biru 45% karena tanpa gambar varian), `M5_gang_belakang_hujan.png`, `M5_atap_berawan.png`. Juga `M5_pause.png`, `M5_result.png`, `M5_gameover.png`, `M5_debugmenu.png`.
- [x] Ranking dihitung fungsi murni `Ranking.ts` (skor dari damage, kombo, waktu vs waktu acuan, HP tersisa, jumlah kena; batas S ≥ 2300, A ≥ 1700, B ≥ 1100) dengan 8 test. Total unit 144 lulus.

Keputusan M5:
- **Dekorasi beranimasi** dipasang tepat di atas elemen lukisan (koordinat diukur dengan mencocokkan piksel sprite ke gambar stage: bendera halaman (220,56) skor 1.00, pohon halaman (34,72) dan (364,72), pohon gerbang_utama (−6,92) dan (414,92), pohon gerbang_sekolah (104,68), strip neon di (40/160/280/400, 14), riak genangan di atas genangan yang sudah dilukis pada varian hujan). Efek hanya dipasang pada gambar dasar/cerah (varian cuaca memiliki warna lukisan berbeda).
- **`tirai_bergerak` dan `hujan_di_jendela` tidak dipakai**: ukuran sprite (48×56) tidak sama dengan jendela yang dilukis di stage (±64×68, kelas dan lorong), jadi menimpa akan terlihat jendela di dalam jendela. Hujan di interior sudah tergambar pada `ruang_kelas_hujan`. Dicatat sebagai penyimpangan dari GDD §9. `bendera_berkibar` di gerbang_utama/lapangan_olahraga juga tidak dipasang karena stage itu tidak punya tiang bendera. Burung melintas di stage luar saat cerah/berawan/sore.
- Stage tanpa varian cuaca memakai overlay warna sesuai GDD §9 (sore oranye 18%, malam biru gelap 45%; berawan/hujan ditambah tint ringan) dan overlay hujan beranimasi (`fx:overlay_hujan`, alpha 0,55) untuk cuaca hujan.
- Filter sepia (Bab 5) = `postFX.addColorMatrix().sepia()` di WebGL, fallback overlay cokelat 40% + vinyet; belum dipakai sampai M8.
- UI: `Menu` teks dengan kursor `kursor_pilih`, sorotan persegi, dukungan pointer. Aset `tombol_*`, `menu_jeda`, dan `panel_pengaturan` punya teks/knob yang dipanggang di gambar, jadi hanya dipakai bila labelnya cocok (tombol MULAI/LANJUTKAN/SIMPAN/KEMBALI di Title) atau sebagai latar dengan area yang ditimpa; menu lain memakai `panel_9slice`.
- Callback layar Hasil/Game Over: scene menghentikan dirinya sebelum memanggil callback (ditemukan saat e2e: scene lama tetap aktif di atas scene baru bila tidak dihentikan).

## M6 — selesai
Rencana: `SaveSystem` + `Settings`, perintah cutscene bertipe + pelaksana (`Cutscene.ts`) + `CutsceneHost` (aktor, dialog, gerak, judul, petunjuk tutorial), `DialogBox` (potret, ketik 40 cps), integrasi di `Stage` (skrip `before` / `during` / `after`), `ChapterRunner`, scene Title/MainMenu/SaveSelect/Credits, validator konten, tulis Prolog dan Bab 1.
- [x] **Prolog → Bab 1 bisa dimainkan dari menu sampai tersimpan.** E2E bot (`?debug=1&god=1&fast=1&power=8`) memainkan 3 layar Prolog + 4 layar Bab 1 (termasuk bos Jaka dan Rendy), layar Hasil, lalu kembali ke menu; slot simpan berisi bab `ch02`, flag `prolog_selesai`/`ch01_selesai`, jurus Tangkis + Serangan Balik, Dimas terbuka, uang > 3.000. E2E kedua (tanpa cheat): menu → Mulai Baru → slot → kesulitan → kartu judul → dialog pertama dengan potret.
- [x] `validate-content` memeriksa semua teks bab (karakter font, ≤ 3 baris pada lebar kotak dialog), semua key tokoh/animasi/stage/musuh/sfx/lagu/unlock, id layar unik, dan flag yang dibaca tetapi tidak pernah diset (gagal bila ada pelanggaran; 17 test negatif/positif). Total unit 184 lulus.
- [x] Screenshot: `M6_title.png`, `M6_mainmenu.png`, `M6_saveselect.png`, `M6_dialog_narasi.png`, `M6_dialog_potret.png`, `M6_halaman_dialog_kanan.png` (potret kecil dari sheet `_ekspresi` untuk Wawan), `M6_halaman_hint.png` (petunjuk tutorial), `M6_result_*.png`.

Keputusan M6:
- **Tutorial interaktif lewat skrip `during` + `hint` + `waitFor`** (gerak, pukul, kombo 3, bertahan, tangkis, hindar). Syarat dipantau dari aksi pemain (bukan waktu). Layar tanpa musuh yang punya `during` menahan marker LANJUT sampai skrip selesai; layar bermusuh membatalkan `during` saat arena bersih.
- **Tampilan dialog**: kotak `kotak_dialog_9slice` di bawah, potret 96×96 di bingkai yang menonjol ke atas (kiri atau kanan menurut posisi pembicara; East Block memakai bingkai merah). Tokoh tanpa potret: wajah dari sheet `_ekspresi` (frame depan, dipotong 32×32) di `bingkai_potret_kecil`. Maks. 3 baris; lebar teks dihitung dari kotak (56 karakter dengan potret, 74 tanpa); halaman ekstra otomatis bila lebih. Aktor cutscene ditempatkan di y 180–196 agar tubuhnya tetap terlihat di atas kotak dialog (y ≥ 200). Skip: tahan K (back) mempercepat dan melewati; Enter/J/E melanjutkan; klik juga melanjutkan.
- **Judul**: sampul 240×135 di-skala ×2 (bulat). Teks bawaan "PIXEL ACTION ASSET PACK" ditimpa persegi warna + subjudul "JEJAK TIGA SEKOLAH" (diizinkan CLAUDE.md §8: persegi overlay).
- `DialogueOverlay` sebagai scene terpisah **tidak dibuat**: `DialogBox` adalah komponen yang dimiliki scene mana pun (Stage sekarang, Hub di M7). Fungsinya sama dan lebih sederhana (satu kali penanganan input per frame).
- **Cerita**: Raka murid pindahan (alasan pemain belajar sejarah tiga sekolah dari Laras dan Pak Hendra); Dimas sahabat sejak SMP; Jaka mengutip "kata Bang Haris, North Hall yang memulai" (benih manipulasi); Rendy menyebut "disuruh senior". Piala bernama PIALA PANJI (dipakai Bab 2).
- **Simpan**: `afterschool.save.v1.{0,1,2}` + `afterschool.settings.v1`; akses dibungkus try/catch; jika `localStorage` tak tersedia game jalan tanpa slot dan menampilkan "TIDAK BISA MENYIMPAN". Simpan otomatis di akhir tiap layar dan bab. Data lama dimigrasi/dilengkapi oleh `migrateProfile`; data rusak/versi lebih baru ditolak tanpa crash.
- **Cheat debug** (`?debug=1`): `god=1` (kebal), `fast=1` (dialog dan gerak cutscene cepat), `power=N` (damage pemain ×N), `chapter=ch02&step=0` (lompat; efek bab dilewati diterapkan oleh `applyScriptEffects`), `money=N`.

## M7 — selesai
Rencana: `Profile` (HP terbawa, buff, lokasi hub), `Economy` murni (beli makanan/jurus, HP antar layar), data `items`, `dojo`, `hub` (9 lokasi, NPC bertingkat menurut progres), `archives` (12 halaman), `sidequests` (6 misi, dipakai M8); scene `Hub`, `MapSelect`, `Shop`, `Dojo`, `Archive`; `Stage` mendukung `free`, `practice`, `pickups`, `timeLimit`, `maxHits`, `escort`.
- [x] Membeli makanan/jurus mengubah statistik/kemampuan dan **tersimpan** (e2e: `Shop` dengan slot 0 → `localStorage` berisi bonus Kekuatan dan uang terkini; `Dojo`: Pukulan Badan terbeli, Maju Selangkah ditolak karena terkunci, latih tanding memberi Rp 750 sekali dan tidak mengubah HP terbawa). Test `economy.test.ts` (13 kasus). Total unit 197 lulus.
- [x] Hub: jalan bebas, NPC dari kelompok A/C/D dengan idle bergantian, Interaksi (E/Enter) memicu dialog berpotret, titik interaksi Kantin, NPC Gilang → Dojo, menu jeda (peta, ganti karakter, arsip, pengaturan, simpan, keluar), keluar ke kanan = Peta. Screenshot `M7_hub_halaman/dialog/menu.png`, `M7_peta.png`, `M7_kantin.png`, `M7_dojo.png`, `M7_arsip.png`.
- [x] Validator memeriksa data hub (karakter, animasi, posisi, percakapan bawaan, syarat bab), misi, Kantin/Dojo, dan arsip (teks, ≤ 4 baris × 46 karakter). Karakter yang tidak ada di font (mis. `+`, `(`) tertangkap oleh validator dan oleh peringatan DEV di `PixelText`; semuanya diganti ("NAIK 1", "PULIH 15", "- DI SINI").

Keputusan M7:
- **HP terbawa antar layar** (GDD §6 mensyaratkan makanan memulihkan HP): `profile.hp` dibawa; menang di layar memulihkan +25% HP maks; awal bab dan mengulang setelah kalah memberi lantai 70% (tidak ada macet total); Susu Kotak = buff Kuat 20 detik untuk layar berikutnya. Latih tanding: HP penuh dan tidak dibawa.
- **Karakter pilihan hanya untuk konten bebas** (misi sampingan, latih tanding, Mode Bebas; `ScreenDef.free`). Layar cerita selalu Raka karena dialog dan potret memakai Raka.
- **Peta**: `panel_peta` punya label tercetak untuk 6 area (KELAS, LAB, GYM, TAMAN, KANTIN, ATAP) yang tidak cocok dengan 9 lokasi hub, jadi Peta memakai `panel_9slice` dan daftar lokasi (terkunci tampil ???). Tombol `tombol_*` dan `menu_jeda` juga bergambar teks tetap, sehingga menu memakai `Menu` teks.
- Jurus Dojo dibuka lewat flag selesai-bab: Pukulan Badan setelah Bab 1 (4.000), Maju Selangkah setelah Bab 2 (6.000), Kombo Finisher Ganda setelah Bab 3 (12.000); Tangkis+Serangan Balik (Bab 1) dan Dorongan Semangat (Bab 6) gratis dari cerita.
- Dialog yang ditutup dengan Enter tidak langsung membuka percakapan baru (jeda 350 ms); `InputManager` menggabungkan penekanan tombol yang sama dalam satu frame (test memberi jeda).

## Masalah terbuka
- (belum ada)
