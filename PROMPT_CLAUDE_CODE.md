# PROMPT UNTUK CLAUDE CODE — AFTER SCHOOL: Jejak Tiga Sekolah

## A. Persiapan (dilakukan sekali oleh kamu)
1. Pastikan paket aset ada di `D:\ASET_PIXEL\AFTER_SCHOOL` dan `metadata.json` ada di dalamnya (atau di `D:\ASET_PIXEL\AFTER_SCHOOL\AFTER_SCHOOL\`).
2. Buat folder proyek: `D:\ASET_PIXEL\after-school-game\`.
3. Salin file dari paket dokumen ini ke folder proyek:
   ```
   after-school-game\
   ├─ CLAUDE.md
   └─ docs\
      ├─ GDD.md
      ├─ ASSET_MAP.md
      ├─ RISET_REFERENSI.md
      └─ ROADMAP.md
   ```
4. Pasang **Node.js 20 LTS atau lebih baru** dan **Git**. Cek dengan `node -v` dan `git -v`.
5. Buka terminal di `D:\ASET_PIXEL\after-school-game\`, jalankan `claude`, lalu tempel **Prompt Utama** (bagian B).

> Tips: proyek ini panjang (10 milestone). Kalau sesi Claude Code penuh atau terputus, buka sesi baru di folder yang sama dan pakai **Prompt Lanjutkan** (bagian C). Semua status tersimpan di `docs/PROGRESS.md` dan git.

---

## B. PROMPT UTAMA (salin semua di dalam kotak)

```
Kamu adalah lead game developer untuk proyek "AFTER SCHOOL: Jejak Tiga Sekolah", sebuah beat 'em up 2D berbasis cerita yang berjalan di browser dan akan diunggah ke itch.io.

KONTEKS
- Aturan tetap proyek ada di ./CLAUDE.md. Desain lengkap ada di ./docs/GDD.md, peta aset terverifikasi di ./docs/ASSET_MAP.md, dasar riset di ./docs/RISET_REFERENSI.md, dan milestone di ./docs/ROADMAP.md.
- Paket aset pixel art (hanya-baca) ada di D:\ASET_PIXEL\AFTER_SCHOOL (metadata.json di sana atau satu subfolder di bawahnya). Jangan pernah mengubah folder itu.
- Sistem operasi pengguna: Windows. Semua skrip tooling harus Node .mjs lintas-platform.

LANGKAH PERTAMA (sebelum menulis kode)
1. Baca CLAUDE.md dan semua file di docs/ sampai selesai.
2. Periksa folder aset: pastikan metadata.json ada, lalu cocokkan contoh nama di ASSET_MAP.md dengan isi metadata (karakter A01_protagonis, stage halaman, font_piksel_5x7, potret B07_senior_mengintimidasi). Jika ada perbedaan, percayai metadata.json dan catat perbedaannya di docs/PROGRESS.md.
3. Buat docs/PROGRESS.md berisi: ringkasan pemahamanmu tentang game (maks. 15 baris), daftar milestone M0–M10 dengan checkbox, bagian "Keputusan", dan bagian "Masalah terbuka".
4. Inisialisasi git dan buat commit awal berisi dokumen.

EKSEKUSI
- Kerjakan milestone M0 sampai M10 SECARA BERURUTAN, sesuai docs/ROADMAP.md. Satu milestone dianggap selesai hanya jika:
  a) semua kriteria "Lulus jika" terpenuhi,
  b) `npm run check` lulus (typecheck + lint + test + validate), serta `npm run test:e2e` untuk milestone yang menyentuh alur scene,
  c) untuk perubahan visual, kamu sudah menjalankan game atau Playwright, menyimpan screenshot di docs/screens/, dan MELIHAT screenshot itu untuk memastikan hasilnya benar (sprite tidak blur, kaki di lantai, UI terbaca, tidak ada sprite yang hilang),
  d) PROGRESS.md diperbarui dan dibuat commit "M{n}: <ringkasan>".
- Jangan berhenti untuk bertanya di antara milestone. Jika ada keputusan kecil yang tidak dijelaskan dokumen, pilih opsi paling sederhana yang sesuai GDD, catat di PROGRESS.md bagian "Keputusan", lalu lanjutkan.
- Jika fitur di GDD membutuhkan animasi yang tidak ada di paket, JANGAN membuat sprite atau animasi palsu. Ubah fiturnya agar memakai animasi yang ada, lalu catat.
- Tulis cerita lengkap (Prolog, Bab 1–7, Epilog) dalam Bahasa Indonesia, SEMUA HURUF KAPITAL, hanya memakai karakter yang didukung font (lihat CLAUDE.md §7). Dialog singkat, hidup, dan sesuai karakter di GDD §2–3. Nada positif: rival menjadi kawan, anti-perundungan, dan tanpa kekerasan grafis.
- Audio dibuat prosedural dengan WebAudio (CLAUDE.md §9). Jangan mengunduh file audio.
- Prioritas kualitas: (1) pertarungan terasa responsif dan berbobot (hitstop, efek, guncangan kamera, input buffer), (2) tidak ada bug yang menghentikan progres, (3) performa 60 FPS, (4) baru setelah itu konten tambahan.

PELAPORAN
- Di akhir setiap milestone, cetak ringkasan 3–6 baris: apa yang selesai, hasil test, dan hal yang perlu dicek pengguna.
- Di akhir M10, tampilkan: lokasi file zip rilis, hasil verifikasi itch.io (jumlah file, ukuran, index.html di root, path relatif), cara menjalankan lokal (`npm run dev`), dan isi docs/ITCH_UPLOAD.md secara ringkas.

Mulai sekarang dari LANGKAH PERTAMA.
```

---

## C. PROMPT LANJUTKAN (untuk sesi baru atau setelah terputus)
```
Lanjutkan proyek AFTER SCHOOL. Baca CLAUDE.md, docs/ROADMAP.md, dan docs/PROGRESS.md. Jalankan `git log --oneline -15` dan `npm run check` untuk melihat kondisi terakhir. Lanjutkan dari milestone pertama yang belum tercentang, dengan aturan yang sama: berurutan, check harus lulus, screenshot dilihat, PROGRESS.md diperbarui, dan commit per milestone. Jangan mengulang pekerjaan yang sudah lulus.
```

## D. PROMPT AUDIT KUALITAS (opsional, setelah M8 atau M10)
```
Lakukan audit menyeluruh pada game AFTER SCHOOL tanpa menambah fitur baru:
1. Mainkan seluruh alur via Playwright dengan ?debug=1 (lompat bab) dan catat error konsol.
2. Cek setiap bab: apakah memakai stage, cuaca, dan bos sesuai docs/GDD.md §3? Buat tabel temuan.
3. Cek rasa pertarungan: input buffer, hitstop, root motion (tidak ada loncatan), token AttackDirector, dan frame kebal saat menghindar.
4. Cek aturan konten (CLAUDE.md §8) dan aturan teks (§7).
5. Jalankan `npm run package:itch` dan laporkan hasil verifikasinya.
Perbaiki semua temuan berat dan sedang, buat commit "audit: …", lalu laporkan temuan ringan yang tersisa.
```

## E. PROMPT RILIS ITCH.IO (jika ingin rilis ulang setelah perubahan)
```
Naikkan versi patch di package.json, jalankan `npm run check`, `npm run test:e2e`, dan `npm run package:itch`. Ekstrak zip ke folder sementara, sajikan dengan server statis dari subfolder (bukan root domain), lalu jalankan smoke test Playwright terhadapnya. Laporkan nama file zip, jumlah file, ukuran, dan hasil test. Perbarui changelog di docs/ITCH_UPLOAD.md.
```

---

## F. Setelah selesai: cara unggah ke itch.io (ringkas)
1. Buka itch.io → **Upload new project** → *Kind of project*: **HTML**.
2. Unggah `release\after-school-web-v1.0.0.zip` lalu centang **"This file will be played in the browser"**.
3. *Embed options*: **Embed in page**, ukuran **960 × 540**, centang **Fullscreen button**.
4. Isi cover (630×500), screenshot dari `docs\screens\`, deskripsi, dan tag (beat-em-up, pixel-art, story-rich, indonesia).
5. Simpan sebagai **Draft**, coba mainkan di halaman pratinjau, lalu **Public** jika sudah oke.
