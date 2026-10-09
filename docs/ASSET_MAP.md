# ASSET MAP — Paket AFTER_SCHOOL → Game

Semua nama di dokumen ini sudah **dicek terhadap `metadata.json` paket** (414 file, ±8,3 MB). Nama file **case-sensitive** dan memakai bahasa Indonesia; jangan diganti nama.

## 0. Lokasi sumber
- Sumber aset: `D:\ASET_PIXEL\AFTER_SCHOOL\` (bisa diatur lewat env `ASSET_SRC`).
- Skrip `tools/prepare-assets.mjs` harus **mendeteksi otomatis** lokasi `metadata.json`. File itu bisa ada di `ASSET_SRC/metadata.json` atau satu tingkat lebih dalam (`ASSET_SRC/AFTER_SCHOOL/metadata.json`), karena isi ZIP aslinya punya folder akar `AFTER_SCHOOL/`.
- Struktur `metadata.json`:
  ```jsonc
  {
    "tile_size": 16, "light_direction": "top-left", "palette": {...},
    "sheets": {
      "01_CHARACTERS/A01_protagonis/A01_protagonis_samping_kanan.png": {
        "frame_w": 64, "frame_h": 64, "columns": 16, "count": 294,
        "origin": [32, 59], "fps": 12,
        "animations": { "siap_tempur": [0,1,2,3,4,5], "...": [] }
      },
      "06_SCHOOL_TILES/stage/halaman.png": { "w": 480, "h": 270, "walk_area_y": [160, 266] },
      "15_UI/font_piksel_5x7.png": { "glyph_w": 5, "glyph_h": 7, "advance": 6,
        "chars": "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?-:/'&" },
      "15_UI/kotak_dialog_9slice.png": { "nine_slice": [8, 8, 8, 8] },
      "16_PORTRAITS/A01_protagonis_potret.png": { "frame_w": 96, "frame_h": 96, "columns": 6,
        "animations": { "netral": [0], "serius": [1], "marah": [2], "percaya_diri": [3], "khawatir": [4], "terkejut": [5] } }
    }
  }
  ```
- Nilai `animations` adalah **daftar indeks frame**; jangan berasumsi frame-nya berurutan. Indeks → posisi: `col = i % columns`, `row = floor(i / columns)`.

## 1. Karakter — `01_CHARACTERS/{key}/`
| File | Isi | Dipakai di game |
|---|---|---|
| `{key}_samping_kanan.png` | 16 kolom × 64×64, origin (32,59), menghadap kanan | **YA** (kiri = `flipX`; origin x=32 simetris) |
| `{key}_samping_kiri.png` | cermin | **TIDAK** disalin (hemat file; `flipX` hasilnya identik) |
| `{key}_depan_belakang.png` | jalan_bawah, jalan_atas, idle_depan, idle_belakang, lihat_sekitar_depan, bicara_depan, jalan_bawah_bawa_kotak, pakai_loker | YA, untuk cutscene/hub |
| `{key}_ekspresi.png` | 11 kolom; anim `samping` [0..10], `depan` [11..21]; urutan: netral, fokus, marah, tekad, terkejut, gugup, percaya_diri, lelah, frustrasi, sakit, teriak | YA, potret darurat untuk tokoh tanpa potret 96×96 |

**Set animasi samping per kelompok**
- **A01–A08, B01–B07** (294 frame): COMBAT (24) + LIFE (10):
  `siap_tempur 6, kuda_kuda_netral 6, kuda_kuda_bertahan 6, kuda_kuda_jaga 6, kuda_kuda_menghindar 6, kuda_kuda_pulih 8, jalan_tempur 8, pukulan_cepat 8, pukulan_berat 14, pukulan_lurus 10, pukulan_kait 10, pukulan_badan 10, tangkis 8, bertahan 6, menghindar_mundur 10, menghindar_samping 10, maju_selangkah 8, serangan_balik 12, dorong 10, terhuyung 10, pulih 10, terpental 12, jatuh 12, bangkit 14, idle_berdiri 8, idle_napas 6, idle_lihat_sekitar 8, idle_geser_kuda_kuda 6, kepal_tangan 6, jalan_samping 8, duduk 8, membaca 8, menoleh_ke_kejadian 8, main_basket 8`
- **C01–C07**: LIFE + `siap_tempur, terhuyung, jatuh, bangkit, menghindar_mundur` (tidak bisa menyerang → **tidak boleh jadi musuh**).
- **D01_guru**: `idle_berdiri, idle_napas, idle_lihat_sekitar, idle_geser_kuda_kuda, kepal_tangan, jalan_samping, menoleh_ke_kejadian`.
- **Tidak ada**: lompat, tendang, banting, senjata, lari cepat khusus. (Lari = `jalan_tempur` dengan `timeScale` 1,5.)

**Pemetaan state → animasi** (`src/data/animMap.ts`)
| State | Animasi | Loop |
|---|---|---|
| Idle tempur | `kuda_kuda_netral` | ✓ |
| Idle setelah menghindar | `kuda_kuda_menghindar` (0,4 detik) | ✓ |
| Idle setelah terhuyung | `kuda_kuda_pulih` (sekali) | – |
| Masuk tempur | `siap_tempur` | ✓ |
| Tahan bertahan | `bertahan` | ✓ |
| Idle sambil menahan tombol bertahan tanpa diserang | `kuda_kuda_jaga` | ✓ |
| Musuh tank menunggu | `kuda_kuda_bertahan` | ✓ |
| Gerak tempur | `jalan_tempur` | ✓ |
| Gerak hub | `jalan_samping` | ✓ |
| Idle hub | `idle_berdiri` / `idle_napas` / `idle_lihat_sekitar` (acak tiap 4–7 detik) | ✓ |
| Pemenang ronde | `kepal_tangan` | – |
| Musuh kabur setelah KO | `bangkit` → `jalan_samping` + alpha → 0 | – |
| Pulih dari pusing | `pulih` | – |

## 2. Potret — `16_PORTRAITS/{key}_potret.png` (96×96 × 6)
Tersedia untuk: A01_protagonis, A02_sahabat, A05_ketua_kelas, A08_petarung_cepat, B01_pemimpin_rival, B02_wakil_rival, B04_rival_agresif, B07_senior_mengintimidasi.
Pemetaan ekspresi dialog → frame potret: `netral, serius, marah, percaya_diri, khawatir, terkejut`.
Fallback (tokoh lain): ekspresi `_ekspresi` tampak depan dengan pemetaan `serius→fokus`, `khawatir→gugup`, `percaya_diri→percaya_diri`, `marah→marah`, `terkejut→terkejut`, `netral→netral`.

## 3. Stage — `06_SCHOOL_TILES/stage/*.png` (480×270, `walk_area_y` [160,266])
| Stage | Bab | Varian cuaca/waktu yang tersedia di `13_WEATHER` | Efek lingkungan disarankan (`14_…`) |
|---|---|---|---|
| gerbang_utama | Prolog | cerah/berawan/hujan/sore/malam | bendera_berkibar, burung_terbang |
| halaman | Prolog, 4, 5, hub | cerah/berawan/hujan/sore/malam | pohon_bergoyang, bendera_berkibar |
| lorong_utama | Prolog | – (overlay) | lampu_neon_berkedip |
| ruang_kelas | 1 | `ruang_kelas_hujan`, `ruang_kelas_malam` | tirai_bergerak, hujan_di_jendela |
| kantin | 1, hub (toko) | – | – |
| area_parkir | 1, 7 | cerah/berawan/hujan/sore/malam | genangan_beriak (hujan) |
| gang_belakang | 1, 7 | cerah/berawan/hujan/sore/malam | lampu_neon_berkedip, genangan_beriak |
| perpustakaan | 2, hub | – | tirai_bergerak |
| lorong_loker | 2 | – | lampu_neon_berkedip |
| area_loker | 2 | – | – |
| lorong_jendela | 2 | – | hujan_di_jendela |
| lapangan_basket | 3, hub | cerah/berawan/hujan/sore/malam | genangan_beriak (hujan) |
| lapangan_olahraga | 3, Epilog | – (overlay) | bendera_berkibar, burung_terbang |
| parkir_sepeda | 3 | – | – |
| gerbang_sekolah | 4 | – | pohon_bergoyang |
| gimnasium | 4, hub (Dojo) | – | – |
| kebun_sekolah | 5 | – (sepia) | pohon_bergoyang, burung_terbang |
| ruang_musik | 5, hub | – | tirai_bergerak |
| ruang_osis | 6 | – (overlay malam) | lampu_neon_berkedip |
| laboratorium_sains | 6 | – (overlay malam) | lampu_neon_berkedip |
| tangga | 6, 7 | – | lampu_neon_berkedip |
| atap | 7 | cerah/berawan/hujan/sore/malam (bos final: `atap_hujan` / `atap_malam` + `overlay_hujan_480x270`) | genangan_beriak |

Nama file cuaca: `13_WEATHER/{stage}_{cerah|berawan|hujan|sore|malam}.png`, `13_WEATHER/ruang_kelas_{hujan|malam}.png`, dan `13_WEATHER/overlay_hujan_480x270.png`. File cuaca **tidak punya entri metadata**; ukurannya 480×270 dan memakai `walk_area_y` milik stage dasarnya.

## 4. Efek — `04_COMBAT_EFFECTS/`
- 64×64, satu animasi `main`: `impact_kecil, impact_sedang, impact_berat (6f, 18fps), impact_arah, impact_lingkaran, ledakan_burst, gelombang_kejut, debu_ledak, serpihan_piksel, kilat_impact, starburst, aksen_energi_biru, aksen_energi_merah, dampak_tanah`. Jumlah frame dan fps dibaca dari metadata.
- `kecepatan/`: `garis_kecepatan_horizontal, garis_kecepatan_vertikal, garis_kecepatan_diagonal, goresan_gerak, jejak_debu, goresan_tanah, partikel_arah`.
- `sinematik_480x270/`: `kilat_layar, gelapkan_latar, vinyet_fokus, kilat_dramatis, indikator_guncang, garis_kecepatan_layar, garis_fokus_radial`.

## 5. NPC — `05_NPC/`
Loop siap pakai (64×64, origin 32,59): `murid_berjalan, murid_mengobrol, murid_duduk, murid_membaca, murid_bawa_ransel, murid_pakai_loker, murid_main_basket, murid_berdiri_berkelompok, murid_melihat_kejadian, guru_berjalan, guru_berjalan_bawah`.
`formasi/` (dengan latar dan `_transparan`): `dua_murid_berhadapan, formasi_kelompok_kecil, kelompok_rival_berhadapan, kerumunan_besar, murid_bereaksi, murid_menonton_dari_jauh, tiga_murid_berkonfrontasi`. Pakai versi `_transparan` sebagai lapisan latar penonton (contoh: Bab 3 dan Epilog).

## 6. Properti — `07_CLASSROOM … 12_PROPS` (PNG statis, tanpa metadata)
Stage sudah dilukis lengkap, jadi properti **opsional**. Gunakan hanya untuk:
- objek interaktif (contoh: `12_PROPS/mesin_minuman.png`, `12_PROPS/konter_kantin.png` = titik toko; `08_HALLWAY/lemari_piala.png` = tempat piala di Epilog; `08_HALLWAY/papan_pengumuman.png` = papan misi);
- lapisan depan (*foreground*) untuk *depth sorting* (contoh: `10_COURTYARD/bangku_taman.png`);
- halaman Arsip Sejarah (ikon kecil `07_CLASSROOM/buku_catatan.png`).

## 7. UI — `15_UI/`
`font_piksel_5x7` · `bar_kesehatan, bar_kesehatan_rival, bar_kesehatan_setengah, bar_kosong, bar_stamina, bar_stamina_setengah` · `bingkai_potret, bingkai_potret_kecil, bingkai_potret_rival` · `kotak_dialog_9slice, panel_9slice` (inset 8) · `papan_nama_{north_hall|east_block|south_court}` · `emblem_{north_hall|east_block|south_court|placeholder}` · `penanda_tim_*` · `status_{bertahan|kuat|lelah|marah|pusing}` · `penanda_misi, penanda_tujuan` · `menu_jeda, panel_inventaris, panel_peta, panel_pengaturan` · `tombol_{lanjutkan|simpan|kembali|mulai}_{normal|hover|tekan}` · `kursor_pilih, bingkai_pilihan` · `hud_contoh` (referensi tata letak HUD, tidak dirender).

> Ukuran setiap PNG UI dibaca saat runtime/build. Jangan menebak ukuran; `prepare-assets` menuliskannya ke manifest.

## 8. Sampul — `17_THUMBNAIL/`
`after_school_cover_240x135.png`, `after_school_cover_320x180.png`, `after_school_cover_1920x1080.png`. Layar judul memakai 240×135 ×2. Halaman itch.io memakai 1920×1080 (cover itch disarankan 630×500, jadi buat crop terpisah lewat skrip build).

## 9. Yang TIDAK disalin ke build
`*_samping_kiri.png`, `02_CHARACTER_ANIMATIONS/*.gif`, `03_COMBAT/*` (hanya referensi), `15_UI/hud_contoh.png`, `README.md`.
Perkiraan isi build: ±340 file aset (termasuk properti opsional dan tile). Jika memakai texture atlas: < 60 file. Keduanya jauh di bawah batas itch.io (1.000 file).
