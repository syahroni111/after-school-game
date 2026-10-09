# CLAUDE.md — AFTER SCHOOL: Jejak Tiga Sekolah

Kamu (Claude Code) adalah pengembang utama game ini. File ini adalah **aturan tetap** proyek. Baca seluruhnya setiap memulai sesi.

Dokumen pendukung (wajib dibaca sebelum menulis kode yang terkait):
- `docs/GDD.md`: desain game (cerita, bab, pertarungan, musuh, ekonomi). **Sumber kebenaran desain.**
- `docs/ASSET_MAP.md`: nama file aset yang sudah diverifikasi dan pemetaannya ke game.
- `docs/RISET_REFERENSI.md`: alasan desain beserta sumbernya.
- `docs/ROADMAP.md`: milestone, urutan kerja, dan kriteria lulus tiap milestone.
- `docs/PROGRESS.md`: log kerjamu sendiri. **Selalu perbarui file ini.**

---

## 1. Ringkasan proyek
- Beat 'em up berbasis cerita, 2D pixel art, setting tiga SMA fiktif (North Hall, East Block, South Court).
- Target: **web (HTML5)**, diunggah sebagai ZIP ke **itch.io** dan bisa dimainkan langsung di browser.
- Resolusi logika **480×270**, diperbesar dengan **kelipatan bulat saja**.
- Semua grafis berasal dari paket aset `AFTER_SCHOOL` milik pengguna. Audio dibuat **prosedural** (WebAudio), karena paket tidak berisi audio.

## 2. Tech stack (dikunci; jangan ganti tanpa alasan tertulis di PROGRESS.md)
| Bagian | Pilihan |
|---|---|
| Engine | **Phaser 3** (pin versi 3.x terbaru yang stabil, mis. `3.90.x`, dengan versi persis di `package.json`. **Jangan** pindah ke Phaser 4.) |
| Bahasa | **TypeScript** `strict: true` |
| Bundler | **Vite** dengan `base: './'` (wajib: itch.io butuh path relatif) |
| Test unit | **Vitest** (logika murni: frame data, damage, AttackDirector, save, parser cutscene, validasi teks) |
| Test e2e/smoke | **Playwright** (sudah tersedia di banyak lingkungan; jangan unduh browser jika sudah ada) |
| Lint/format | ESLint + Prettier (konfigurasi minimal) |
| Skrip tooling | **Node `.mjs` lintas-platform** (pengguna memakai **Windows**; jangan pakai skrip bash/sh khusus Unix, `rm -rf`, dll. Gunakan `node:fs`/`node:path`). |
| Kemasan | Dependensi zip murni JS (mis. `archiver` atau `adm-zip`), lewat `npm run package:itch` |

Tidak boleh ada dependensi runtime selain Phaser. Tidak boleh memuat apa pun dari CDN/internet saat runtime; semua aset dibundel.

## 3. Struktur folder
```
after-school-game/
├─ CLAUDE.md
├─ docs/ (GDD.md, ASSET_MAP.md, RISET_REFERENSI.md, ROADMAP.md, PROGRESS.md)
├─ tools/
│  ├─ prepare-assets.mjs     # baca paket → salin aset terpilih ke public/assets → tulis manifest
│  ├─ validate-content.mjs   # cek: semua referensi aset/anim/teks valid
│  └─ package-itch.mjs       # build → zip → cek batas itch.io
├─ public/assets/            # HASIL GENERATE (gitignored). Jangan edit manual.
├─ src/
│  ├─ main.ts, config.ts
│  ├─ generated/assetManifest.ts   # HASIL GENERATE (di-commit agar build bisa jalan tanpa paket)
│  ├─ scenes/   Boot, Preload, Title, MainMenu, SaveSelect, Hub, MapSelect, Stage,
│  │            DialogueOverlay, Pause, Result, Shop, Dojo, Archive, Settings, Credits,
│  │            dev/AnimViewer, dev/CombatSandbox
│  ├─ entities/ Fighter.ts (dasar), Player.ts, Enemy.ts, Ally.ts, Npc.ts
│  ├─ combat/   FighterStateMachine.ts, HitSystem.ts, AttackDirector.ts, Damage.ts, ComboBuffer.ts
│  ├─ systems/  InputManager.ts, Cutscene.ts, SaveSystem.ts, Economy.ts, Ranking.ts,
│  │            ScreenFx.ts, DepthSort.ts, EffectPool.ts, TimeWeather.ts
│  ├─ audio/    Sfx.ts (synth), Music.ts (sequencer), songs/*.ts
│  ├─ ui/       PixelText.ts, NineSlice.ts, Hud.ts, DialogBox.ts, Menu.ts, Toast.ts
│  ├─ data/     characters.ts, enemies.ts, frameData.ts, animMap.ts, stages.ts, items.ts,
│  │            moves.ts, sidequests.ts, archives.ts, chapters/ch00_prolog.ts … ch08_epilog.ts
│  └─ util/     math.ts, rng.ts, assert.ts
└─ tests/ unit/*.test.ts, e2e/smoke.spec.ts
```

## 4. Pipeline aset (paling penting)
1. Paket asli ada di **`D:\ASET_PIXEL\AFTER_SCHOOL`** (override dengan env `ASSET_SRC`). **Jangan pernah mengubah, memindah, atau menghapus file di folder sumber.** Folder itu hanya dibaca.
2. `tools/prepare-assets.mjs`:
   - Cari `metadata.json` di `ASSET_SRC` atau satu subfolder di bawahnya. Gagal dengan pesan jelas jika tidak ketemu.
   - Salin hanya file yang dibutuhkan (daftar di `ASSET_MAP.md` §9) ke `public/assets/` **dengan path relatif yang sama** dan **huruf besar-kecil persis sama**.
   - Baca ukuran PNG (header IHDR, tanpa dependensi berat) dan tulis `src/generated/assetManifest.ts`: daftar key, path, ukuran, `frame_w`/`frame_h`/`columns`/`count`/`origin`/`fps`, `animations` (indeks frame), `walk_area_y`, `nine_slice`, dan info font.
   - Idempoten: boleh dijalankan berulang kali.
3. Phaser memuat semua spritesheet dari manifest (`this.load.spritesheet(key, path, {frameWidth, frameHeight})`) dan **membuat animasi dari daftar indeks di manifest**. Jangan menulis rentang frame secara manual.
4. Key Phaser: `char:{key}:side`, `char:{key}:fb`, `char:{key}:expr`, `portrait:{key}`, `stage:{name}`, `stage:{name}:{cuaca}`, `fx:{name}`, `npc:{name}`, `ui:{name}`, `prop:{folder}/{name}`.
   Key animasi: `{key}:{anim}` (contoh: `A01_protagonis:pukulan_kait`).
5. Hadap kiri = `sprite.setFlipX(true)` dari sheet `_samping_kanan`. Origin sprite karakter = **(32/64, 59/64)** sehingga `sprite.y` = titik kaki.
6. Jika jumlah file melebihi ±600, buat texture atlas di `prepare-assets` (opsional, M9). Sebelum itu tidak perlu.

## 5. Aturan pixel-perfect
- `pixelArt: true`, `roundPixels: true`, `antialias: false`. Scale Manager `FIT` + `autoCenter: CENTER_BOTH`, dengan **zoom bulat**: hitung `zoom = max(1, floor(min(innerWidth/480, innerHeight/270)))`, lalu terapkan ulang saat resize/fullscreen.
- CSS: `image-rendering: pixelated` pada canvas; latar halaman hitam.
- Semua posisi akhir di-*floor* ke piksel bulat saat render. Logika boleh memakai float.
- **Dilarang**: rotasi sprite karakter, scale non-bulat pada sprite (kecuali efek layar sinematik), dan blur.
- Kedalaman gambar: `depth = y kaki` untuk karakter, NPC, dan properti depan. UI di atas semuanya.

## 6. Arsitektur pertarungan
- **Logika fixed timestep 60 Hz** (akumulator di `Stage.update`). Animasi sprite berjalan pada fps metadata (12). Satu frame animasi = 5 tick logika; konversinya ada di `frameData.ts`.
- **Animasi menentukan kapan sebuah serangan aktif.** Frame aktif, frame kebal, dan root motion ada di `src/data/frameData.ts` (nilai awal di GDD §4.3). Hitbox hanya aktif pada frame aktif.
- **Hitbox/hurtbox**: persegi dalam koordinat lokal (relatif titik kaki, dicerminkan saat menghadap kiri) + **toleransi kedalaman |Δy| ≤ 10 px**.
- **State machine per Fighter** (sebuah kelas, bukan if-else tersebar): `idle, walk, attack(n), block, parry, counter, dodge, dash, hitstun, knockback, down, getup, dizzy, ko, cutscene`. Setiap transisi tercatat dan bisa diuji.
- **Root motion**: saat animasi selesai, `x += rootMotion * facing`, lalu set animasi kuda-kuda. Jangan biarkan sprite "meloncat".
- **AttackDirector**: token serangan (Mudah 1 / Normal 2 / Sulit 3), cooldown, dan aturan mengitari pemain. Musuh **wajib** memakai token sebelum menyerang.
- **Hit feel**: hitstop, guncangan kamera, efek, dan slow-mo KO memakai tabel di GDD §4.5. Semua nilai ada di `data/`, bukan angka ajaib di kode.
- **Pooling**: efek, teks melayang, dan musuh di-pool; jangan membuat objek baru setiap pukulan.

## 7. Cerita, teks, dan font
- Font game = `15_UI/font_piksel_5x7.png` (glyph 5×7, advance 6). Daftar karakter yang didukung **hanya**: `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?-:/'&`.
- Karena itu **semua teks dalam game ditulis HURUF KAPITAL** dan hanya memakai karakter di atas. Tidak boleh ada tanda kutip ganda, kurung, titik koma, %, atau elipsis "…" (pakai "..."). `PixelText` me-*uppercase* otomatis dan mengganti karakter tak dikenal dengan spasi, **tetapi** `validate-content.mjs` + test unit harus **gagal** jika data cerita memuat karakter yang tidak didukung.
- Dialog: maks. 3 baris per kotak, ± 40 karakter per baris (dihitung otomatis dari lebar kotak), efek ketik 40 karakter/detik, tombol untuk mempercepat atau melewati.
- Data bab ditulis sebagai **data TypeScript bertipe** (`chapters/chXX.ts`) berisi daftar perintah cutscene (`say`, `move`, `face`, `anim`, `wait`, `fade`, `shake`, `flash`, `setFlag`, `ifFlag`, `spawnWave`, `music`, `sfx`, `giveMoney`, `giveArchive`, `unlock`). Logika dan teks cerita tidak boleh bercampur dengan kode scene.
- Nama tokoh dan pemetaannya ke kunci aset ada di `data/characters.ts` sesuai GDD §2.

## 8. Konten — aturan wajib
- **Non-grafis**: tidak ada darah, luka, senjata, rokok, alkohol, atau kata kasar. Musuh yang kalah tidak mati; mereka jatuh, bangkit, lalu pergi atau menyerah.
- **Hanya animasi yang ada di paket.** Dilarang menambah lompat, tendang, banting, lempar, senjata, atau sprite baru yang meniru karakter. Jika sebuah fitur butuh animasi yang tidak ada, **ubah desain fiturnya** dan catat di PROGRESS.md.
- Tidak boleh memakai nama, logo, atau teks dari game referensi (River City, Rival Schools, SoR, Bully, Judgment, dll.).
- Sejarah dalam game bersifat **fiktif**. Jangan menyebut peristiwa sejarah nyata.
- Grafis tambahan yang **boleh** dibuat lewat kode: persegi fade/overlay warna, garis debug hitbox, partikel piksel 1–2 px, dan filter sepia. Tidak boleh lebih dari itu.

## 9. Audio
- `audio/Sfx.ts`: synth gaya sfxr (osilator + envelope + noise) untuk pukul ringan, pukul berat, tangkis, tahan, jatuh, langkah, UI, uang, dan buka jurus.
- `audio/Music.ts`: sequencer pola (2 pulse, 1 triangle, 1 noise) dengan 6 lagu (lihat GDD §10). Komposisinya orisinal dan ditulis sebagai data nada.
- AudioContext dibuat/di-*resume* setelah input pertama. Volume musik dan SFX terpisah dan tersimpan di pengaturan.

## 10. Simpan
- `SaveSystem`: 3 slot di `localStorage` dengan key `afterschool.save.v1.{slot}` + `afterschool.settings.v1`. Setiap akses dibungkus try/catch; jika gagal, game tetap jalan (mode tanpa simpan + toast).
- Data simpan diberi `version`; sediakan fungsi migrasi meski masih v1.

## 11. Build & rilis itch.io
- `npm run dev`: dev server. `npm run build`: `vite build` → `dist/`.
- `npm run package:itch`: build, lalu zip **isi** `dist/` (bukan foldernya) menjadi `release/after-school-web-v{versi}.zip`. Setelah itu verifikasi:
  - `index.html` ada di **root** zip;
  - jumlah file < 1.000, total < 500 MB, tiap file < 200 MB, path ≤ 240 karakter;
  - **tidak ada path absolut** (`src="/…"` atau `href="/…"`) di `index.html`/JS/CSS;
  - setiap path aset di manifest cocok **persis (case-sensitive)** dengan file di zip.
  Gagalkan skrip jika satu saja syarat tidak terpenuhi.
- Pengaturan itch yang disarankan (tulis di `docs/ITCH_UPLOAD.md` saat M10): Kind = HTML, "This file will be played in the browser", Embed 960×540, centang Fullscreen button, Mobile friendly = **tidak** (kecuali kontrol sentuh sudah dibuat).

## 12. Perintah npm wajib
`dev`, `build`, `preview`, `prepare-assets`, `validate`, `test` (vitest), `test:e2e` (playwright smoke), `lint`, `typecheck`, `check` (= typecheck + lint + test + validate), `package:itch`.

## 13. Cara bekerja (wajib diikuti)
1. Kerjakan milestone **berurutan** sesuai `docs/ROADMAP.md`. Jangan lompat ke fitur milestone berikutnya.
2. Di awal tiap milestone, tulis rencana singkat di `docs/PROGRESS.md`.
3. Di akhir tiap milestone, jalankan `npm run check` (dan `npm run test:e2e` jika milestone menyentuh alur scene). Semua harus lulus. Lalu centang kriteria lulus di PROGRESS.md dan buat **git commit** dengan pesan `M{n}: …`.
4. Untuk perubahan visual, jalankan game atau Playwright, ambil screenshot ke `docs/screens/M{n}_*.png`, dan **lihat screenshot itu** sebelum menyatakan selesai.
5. Jika keputusan desain dari GDD tidak bisa diterapkan dengan aset yang ada, pilih alternatif terdekat yang paling sederhana, catat di PROGRESS.md bagian "Keputusan", lalu lanjutkan. Jangan berhenti untuk bertanya kecuali keputusannya tidak bisa dibatalkan.
6. Jangan menghapus atau menulis ulang besar-besaran kode yang sudah lulus tanpa alasan yang dicatat.
7. Fungsi kecil, nama jelas, tanpa angka ajaib (taruh di `data/` atau konstanta), dan komentar hanya untuk "kenapa". Bahasa kode/identifier: Inggris. Teks pemain dan dokumen: Indonesia.

## 14. Kualitas dan performa
- Target 60 FPS dengan 4 musuh + 10 efek aktif. Ukur dengan overlay FPS debug (tombol F3 di build dev).
- Tidak ada error/warning di konsol saat bermain normal.
- Waktu muat pertama < 5 detik di koneksi biasa. Tampilkan progress bar di Preload.
- Fokus input: klik di canvas untuk fokus (itch iframe); cegah scroll halaman oleh tombol panah/spasi.
- Saat tab kehilangan fokus, game otomatis jeda.

## 15. Larangan singkat (checklist)
- ❌ Mengubah folder aset sumber · ❌ path absolut · ❌ CDN/runtime network · ❌ animasi/sprite palsu · ❌ konten grafis · ❌ huruf kecil/karakter di luar font dalam teks game · ❌ zoom non-bulat · ❌ melompati milestone · ❌ menyatakan selesai tanpa `npm run check` lulus.
