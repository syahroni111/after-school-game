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
- [ ] M5 — Stage, transisi, waktu & cuaca, Game Over
- [ ] M6 — Cerita: dialog, cutscene, Prolog & Bab 1
- [ ] M7 — Hub, Kantin, Dojo, Peta, Arsip
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

## Masalah terbuka
- (belum ada)
