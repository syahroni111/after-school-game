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
- [ ] M0 — Fondasi proyek
- [ ] M1 — Pipeline aset
- [ ] M2 — Penampil animasi & teks piksel
- [ ] M3 — Pemain & pertarungan inti
- [ ] M4 — Musuh & AI
- [ ] M5 — Stage, transisi, waktu & cuaca, Game Over
- [ ] M6 — Cerita: dialog, cutscene, Prolog & Bab 1
- [ ] M7 — Hub, Kantin, Dojo, Peta, Arsip
- [ ] M8 — Bab 2 sampai Epilog + konten sampingan
- [ ] M9 — Audio, pengaturan, polish
- [ ] M10 — Rilis itch.io

## Keputusan
- **Lokasi paket aset**: paket ternyata ada di `D:\ASET_PIXEL\after-school-game\AFTER_SCHOOL` (metadata.json langsung di dalamnya), bukan `D:\ASET_PIXEL\AFTER_SCHOOL` seperti tertulis di dokumen (folder itu tidak ada; hanya ada ZIP `AFTER_SCHOOL_pixel_action_pack.zip` di `D:\ASET_PIXEL`). `prepare-assets` mencoba berurutan: env `ASSET_SRC` → `D:\ASET_PIXEL\AFTER_SCHOOL` → `<proyek>\AFTER_SCHOOL`. Folder paket di-gitignore (sumber, hanya-baca).
- Verifikasi awal metadata vs ASSET_MAP: 414 file dan 190 entri sheet; nama karakter, stage, potret, dan font cocok. Font 276×7 (46 glyph × 6). Sheet A01 1024×1216 (294 frame, 16 kolom). Tidak ada perbedaan yang menghambat.

## Masalah terbuka
- (belum ada)
