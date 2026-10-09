# GDD — AFTER SCHOOL: Jejak Tiga Sekolah

> Game Design Document. Dasar keputusan desain ada di `docs/RISET_REFERENSI.md`.
> Aturan teknis ada di `CLAUDE.md`. Peta aset ada di `docs/ASSET_MAP.md`.

## 1. Ringkasan
| Item | Isi |
|---|---|
| Judul | **AFTER SCHOOL: Jejak Tiga Sekolah** |
| Genre | Beat 'em up berbasis cerita (layar-per-layar, gerak kedalaman) + RPG ringan |
| Platform | Web (HTML5), diunggah ke itch.io. Kontrol keyboard + gamepad. |
| Resolusi | Internal 480×270, diperbesar dengan kelipatan bulat (×2 = 960×540, ×3, ×4) |
| Durasi | Cerita utama ± 60–90 menit; ditambah konten sampingan dan Mode Bebas |
| Bahasa | Indonesia |
| Rating konten | Aksi non-grafis: tanpa darah, luka, atau senjata. Musuh yang kalah **tidak mati**; mereka jatuh, bangkit, lalu mundur atau menyerah. |
| Pilar | 1) Pertarungan tangan kosong yang **terbaca dan berbobot** · 2) **Sejarah sekolah** yang terungkap per bab · 3) Dari **rival jadi kawan** |

**Logline:** Di kota fiktif Tirtasari, tiga SMA (North Hall, East Block, dan South Court) sudah dua puluh tahun saling curiga sejak *Festival Tiga Sekolah* terakhir berakhir ricuh dan pialanya hilang. Raka, siswa North Hall, terseret ke perkelahian yang sengaja dipicu orang lain. Sambil bertahan dari serangan, ia menelusuri arsip sekolah dan menemukan bahwa sejarah itu sedang **diulang** oleh orang yang sama-sama diuntungkan dari permusuhan ini.

## 2. Tokoh (memetakan kunci aset → nama di game)
Nama hanya ada di data game (`src/data/characters.ts`). File aset **tidak diganti namanya**.

| Kunci aset | Nama | Peran | Potret 96×96 | Bisa dimainkan |
|---|---|---|---|---|
| A01_protagonis | **Raka** | Protagonis, North Hall, seimbang | ✅ | Ya (awal) |
| A02_sahabat | **Dimas** | Sahabat; kuat dan lambat | ✅ | Ya (setelah Bab 1) |
| A03_murid_pendiam | **Fajar** | Anak pendiam; di Bab 5 sprite ini dipakai untuk **Hendra muda** (berkacamata, versi sepia) | – (pakai `_ekspresi`) | Bab 5 saja (sebagai Hendra muda) |
| A04_murid_atletis | **Bima** | Kapten basket North Hall | – | Tidak |
| A05_ketua_kelas | **Laras** | Ketua kelas + OSIS; penggerak kebangkitan festival | ✅ | Tidak |
| A06_murid_enerjik | **Tiara** | Anak klub musik; pemberi info | – | Tidak |
| A07_petarung_bertahan | **Gilang** | Ketua Klub Bela Diri, pemilik **Dojo** | – | Tidak (lawan latih tanding) |
| A08_petarung_cepat | **Bayu** | Petarung cepat | ✅ | Ya (setelah Bab 3) |
| B01_pemimpin_rival | **Arga** | Pemimpin East Block; rival yang kemudian jadi sekutu | ✅ | Ya (Mode Bebas, setelah tamat) |
| B02_wakil_rival | **Sekar** | Wakil East Block; ahli serangan balik | ✅ | Tidak |
| B03_rival_atletis | **Rendy** | Petarung dash | – | Tidak |
| B04_rival_agresif | **Jaka** | Agresif dan mudah dipancing | ✅ | Tidak |
| B05_rival_bertahan | **Teguh** | Bertahan keras | – | Tidak |
| B06_rival_cepat | **Yoga** | Cepat dan suka menghindar | – | Tidak |
| B07_senior_mengintimidasi | **Bang Haris** | Senior kelas XII East Block, **dalang**. Di Bab 5 sprite yang sama dipakai untuk **"Senior Angkatan Lama"** (sepia); kemiripannya disengaja sebagai simbol *sejarah yang berulang*. | ✅ | Tidak |
| C01–C07 | Andi, Putri, Wawan, Rizal, Nisa, Eko, Mega | Siswa South Court: NPC, korban pemalakan, pemberi Cerita Sekolah | – | Tidak |
| D01_guru | **Pak Hendra** | Guru sejarah North Hall, saksi festival terakhir | – (pakai `_ekspresi`) | Tidak |

**Musuh umum (kroco):** variasi B03–B06 dengan nama generik ("ANAK EAST BLOCK", "SURUHAN HARIS") dan tint ringan. Tint hanya dipakai untuk membedakan level dan tidak boleh mengubah identitas warna sekolah.

## 3. Cerita — 7 Bab + Prolog + Epilog
Setiap bab mengikuti pola tetap: **Cerita pembuka (dialog)** → **2–4 layar pertarungan** → **Bos/miniboss** → **Cerita penutup + Arsip Sejarah** → **Waktu Bebas** (hub).
Pola ini mengikuti struktur bab Bully dan mode cerita Rival Schools (lihat riset).

| Bab | Judul | Stage (urutan layar) | Waktu/Cuaca | Musuh / Bos | Hasil & buka |
|---|---|---|---|---|---|
| Prolog | **Hari Pertama** | gerbang_utama → halaman → lorong_utama | pagi, cerah | kroco B06/B04 memalak Wawan (C03) · Miniboss **Jaka** | Tutorial: gerak, kombo, bertahan. Kenal Dimas & Laras. |
| 1 | **Kabar dari Gang Belakang** | ruang_kelas (cerita) → kantin (toko) → area_parkir → gang_belakang | sore | kroco + **Rendy** | Uang saku & Kantin terbuka. Dojo Gilang terbuka (jurus: **Tangkis + Serangan Balik**). Dimas bisa dimainkan. |
| 2 | **Panji yang Hilang** | perpustakaan (Arsip #1) → lorong_loker → area_loker → lorong_jendela | siang, berawan | **Teguh** (bertahan) | Laras mengusulkan Festival Tiga Sekolah dihidupkan lagi. Jurus **Pukulan Badan** (pemecah pertahanan). |
| 3 | **Hujan di Lapangan** | lapangan_basket (hujan) → lapangan_olahraga → parkir_sepeda | hujan → sore | **Yoga + Jaka** (duo) | Pertandingan persahabatan dengan South Court dirusuh orang suruhan. Bayu bisa dimainkan. Jurus **Maju Selangkah**. |
| 4 | **Sang Pemimpin East Block** | gerbang_sekolah → halaman (sore) → gimnasium | sore | **Arga** (bos penuh) | Setelah kalah, Arga menunjukkan surat tantangan palsu atas nama North Hall: **ada pihak ketiga**. |
| 5 | **Kilas Balik: Festival Terakhir** *(sepia)* | kebun_sekolah → halaman → ruang_musik | sore, filter sepia | Main sebagai **Hendra muda** melawan **Senior Angkatan Lama** | Ternyata 20 tahun lalu kericuhan sengaja dipicu kelompok pemalak senior. Hendra muda menyembunyikan piala supaya tidak dicuri, lalu justru ia yang disalahkan. |
| 6 | **Jejak yang Sama** | ruang_osis → laboratorium_sains → tangga | malam (kelas malam), lampu neon | **Sekar** (salah paham → sekutu) | Sekar juga sedang menyelidiki. Bukti mengarah ke **Bang Haris**, yang memalak siswa ketiga sekolah dan butuh permusuhan agar festival tidak pernah kembali. Jurus **Dorongan Semangat**. |
| 7 | **Atap, Malam Hujan** | area_parkir (malam) → gang_belakang (malam) → tangga → atap (hujan/malam) | malam, hujan | Gelombang suruhan → **Bang Haris** (3 fase), **Arga ikut sebagai sekutu AI** | Serangan duet **"Duet Panji"** (Raka + Arga). Haris kalah dan diserahkan ke guru. |
| Epilog | **Festival Tiga Sekolah** | lapangan_olahraga (cerah) | pagi | — | Piala ditemukan di ruang musik dan dikembalikan. Formasi NPC ketiga sekolah, kredit, lalu Mode Bebas + Boss Rush terbuka. |

Ke-22 stage terpakai semua; daftar lengkapnya ada di `ASSET_MAP.md`.

### 3.1 Arsip Sejarah (koleksi)
- **12 halaman arsip** tersebar di stage (ikon `penanda_misi` kecil berkedip; ambil dengan tombol Interaksi).
- Setiap halaman berisi 2–4 baris tentang sejarah fiktif Festival Tiga Sekolah (tahun fiktif "20 tahun lalu"; tidak menyebut peristiwa nyata).
- Mengumpulkan 12/12 membuka **"Galeri Sejarah"** di menu dan satu adegan tambahan di Epilog: Pak Hendra berbicara di depan ketiga sekolah.

### 3.2 Nada dan aturan cerita
- Konflik berpusat pada **salah paham, gengsi, dan manipulasi**, bukan kebencian. Tiga sekolah pada akhirnya berdamai.
- Perundungan/pemalakan ditampilkan sebagai sesuatu yang salah, dan korbannya dibela.
- Humor ringan diperbolehkan (Dimas yang selalu lapar, Jaka yang mudah terpancing).
- Dialog **pendek**: maks. 3 baris per kotak dan ± 40 karakter per baris, karena font 5×7 hanya memiliki huruf kapital (lihat CLAUDE.md §Teks).

## 4. Pertarungan
Semua aksi memetakan animasi yang **sudah ada**. Lompat, tendang, banting, dan senjata **tidak ada** dan tidak boleh ditambahkan.

### 4.1 Kontrol
| Aksi | Keyboard (default) | Gamepad | Animasi |
|---|---|---|---|
| Gerak (kiri/kanan + kedalaman atas/bawah) | Panah / WASD | Stik kiri / D-pad | `jalan_tempur` (dalam tempur), `jalan_samping` (di hub) |
| Pukul (ringan) | J | X / □ | rantai kombo, lihat 4.2 |
| Pukulan Berat (tahan ≥ 250 ms lalu lepas = versi bertenaga) | K | Y / △ | `pukulan_berat` |
| Bertahan (tahan) | L | RB / R1 | `bertahan` (tahan), `kuda_kuda_jaga` (idle saat bertahan) |
| Tangkis (tekan Bertahan tepat sebelum kena, jendela 8 frame logika) | L (tepat waktu) | RB | `tangkis` → bisa diikuti `serangan_balik` |
| Menghindar | Spasi (+ arah atas/bawah = samping) | A / ✕ | `menghindar_mundur`, `menghindar_samping` |
| Maju + Pukul | → → J (atau arah depan + K saat lari) | sama | `maju_selangkah` → `pukulan_lurus` |
| Dorongan Semangat (jurus spesial) | J + K bersamaan | B / ○ | `dorong` + efek `gelombang_kejut` |
| Interaksi / bicara | E | A | – |
| Jeda | Esc / P | Start | `menu_jeda` |

### 4.2 Rangkaian kombo
`pukulan_cepat` → `pukulan_lurus` → `pukulan_kait` → **`pukulan_berat` (finisher, membuat musuh terpental)**
- *Input buffer* 150 ms; tombol berikutnya boleh ditekan saat frame aktif atau pemulihan serangan sebelumnya.
- Arah ke belakang + Pukul = `pukulan_badan` (pemecah pertahanan; setelah dibeli di Dojo).
- Kombo terputus jika pemain berhenti menekan lebih dari 350 ms.

### 4.3 Data frame (dihitung dari keyframe rig asli; indeks **relatif terhadap awal animasi**)
| Animasi | Jml frame | Startup | **Frame aktif (hitbox)** | Root-motion akhir (px, arah hadap) | Catatan |
|---|---|---|---|---|---|
| pukulan_cepat | 8 | 0–2 | **3–4** | 0 | jab cepat, bisa di-cancel ke pukulan berikutnya mulai frame 5 |
| pukulan_lurus | 10 | 0–3 | **4–6** | 0 | |
| pukulan_kait | 10 | 0–3 | **4–6** | 0 | |
| pukulan_badan | 10 | 0–3 | **4–6** | 0 | menghancurkan Guard |
| pukulan_berat | 14 | 0–5 (wind-up) | **6–8** | 0 | finisher → `terpental` |
| serangan_balik | 12 | 0–5 (**kebal**) | **7–9** | 0 | hanya bisa dipakai setelah `tangkis` sukses |
| dorong | 10 | 0–3 | **4–6** (hitbox lebar, 360°) | 0 | |
| tangkis | 8 | – | jendela tangkis **2–5** | 0 | |
| menghindar_mundur | 10 | – | **kebal 1–6** | **−10** | |
| menghindar_samping | 10 | – | **kebal 1–6** | 0 (+ geser kedalaman ±24 px) | |
| maju_selangkah | 8 | – | – | **+8** (+ kecepatan dash) | |
| terhuyung | 10 | – | – | **−6** | hitstun |
| terpental | 12 | – | – | **−18** (+ knockback fisika) | |
| jatuh | 12 | – | – | 0 | lalu diam di tanah 0,6–1,2 detik |
| bangkit | 14 | – | kebal penuh | 0 | |

**Root motion:** sprite bergeser di dalam frame 64×64. Saat animasi selesai, tambahkan offset akhir (× arah hadap) ke posisi entitas lalu ganti ke kuda-kuda supaya tidak ada "loncatan" posisi. Lihat CLAUDE.md §Animasi.

Semua angka di atas adalah **nilai awal**. Pastikan secara visual di scene `AnimViewer` (lihat ROADMAP M2) dan simpan nilai finalnya di `src/data/frameData.ts`.

### 4.4 Sumber daya pemain
- **Darah (HP)**: 100 (Raka), 120 (Dimas), 90 (Bayu), 110 (Arga). Bar `bar_kesehatan`.
- **Stamina**: 100. Bertahan menguras 6/detik + 12 per pukulan yang ditahan; menghindar 18; pulih 25/detik setelah 0,6 detik tanpa memakai stamina. Jika stamina habis saat bertahan → **Guard Break**: status `pusing` selama 1 detik.
- **Dorongan Semangat** (gaya SoR4): memakai 12 HP sebagai **darah sementara** (ditampilkan dengan `bar_kesehatan_setengah`). Darah itu kembali jika pemain mendaratkan 4 pukulan tanpa terkena; jika pemain terkena lebih dulu, darah itu hilang. Jurus ini tidak bisa dipakai bila HP ≤ 12.
- **Duet Panji** (hanya Bab 7, bersama Arga): meteran terisi dari pukulan yang mendarat; saat penuh, Raka dan Arga memakai `dorong` bersamaan dengan efek layar `kilat_dramatis` + `garis_fokus_radial`.

### 4.5 Reaksi dan "rasa pukulan"
| Kejadian | Reaksi target | Efek | Hitstop | Guncangan kamera |
|---|---|---|---|---|
| Pukulan ringan | `terhuyung` (frame 0–3 saja jika masih dalam kombo) | `impact_kecil` | 40 ms | – |
| Pukulan lurus/kait | `terhuyung` | `impact_sedang` + `serpihan_piksel` | 60 ms | 1 px |
| Pukulan berat / finisher | `terpental` → `jatuh` → (diam) → `bangkit` | `impact_berat` + `gelombang_kejut` + `debu_ledak`, saat jatuh `dampak_tanah` | 110 ms | 3 px |
| Serangan balik | `terpental` | `kilat_impact` + `starburst` + layar `kilat_layar` (alpha 0,35) | 140 ms | 3 px |
| Tangkis sukses | penyerang `terhuyung` | `aksen_energi_biru` | 80 ms | – |
| Ditahan | – | `impact_arah` kecil | 30 ms | – |
| Dorongan Semangat | semua dalam radius → `terpental` | `ledakan_burst` + `gelombang_kejut` | 120 ms | 4 px |
| KO musuh | `jatuh` → `bangkit` → jalan pergi (`jalan_samping`, memudar) | `debu_ledak` | 160 ms + slow-mo 0,4× selama 300 ms | 2 px |
| KO bos | sama + `garis_fokus_radial` + `vinyet_fokus` | | 300 ms | 4 px |

### 4.6 Status (ikon `15_UI/status_*`)
`pusing` (guard break, tidak bisa bertindak 1 detik) · `lelah` (stamina < 20) · `marah` (fase akhir bos: damage +25%) · `kuat` (buff makanan: damage +15% selama 20 detik) · `bertahan` (buff: damage masuk −20%).

## 5. Musuh dan AI
### 5.1 Attack Director (token serangan)
- Hanya **N musuh** yang boleh memegang "token serangan" bersamaan: Mudah 1, Normal 2, Sulit 3.
- Musuh tanpa token **mengitari** pemain pada jarak 70–110 px dan bergeser di sumbu kedalaman (`jalan_tempur`, `kuda_kuda_netral`, `idle_geser_kuda_kuda`).
- Token dilepas setelah serangan selesai atau setelah musuh terkena pukulan; *cooldown* per musuh 0,8–1,6 detik.
- Serangan hanya bisa mengenai pemain jika selisih **kedalaman (y)** ≤ 10 px. Ini aturan klasik belt-scroller.
- **Telegraph:** setiap serangan berat musuh diberi wind-up ≥ 250 ms dan kilatan `aksen_energi_merah` 1 frame di atas kepala.

### 5.2 Arketipe
| Arketipe (sprite) | Perilaku | Gerakan |
|---|---|---|
| Kroco Cepat (B06) | Mendekat zig-zag, jab 1–2x, sering menghindar mundur | pukulan_cepat, menghindar_mundur |
| Kroco Agresif (B04) | Kombo 3 hit, jarang bertahan | cepat → lurus → kait |
| Kroco Dash (B03) | Mengambil jarak lalu dash | maju_selangkah → pukulan_lurus |
| Kroco Tank (B05) | Sering bertahan; harus dipecah dengan Pukulan Badan atau dilempar Dorongan | bertahan, pukulan_berat |
| Sekar (B02) | Menangkis pukulan ke-3 pemain lalu membalas | tangkis → serangan_balik |
| Arga (B01) | Campuran semua gerakan, fase 2 di HP < 50% (status `marah`) | semua |
| Bang Haris (B07) | Fase 1: memanggil 2 suruhan · Fase 2: pukulan berat beruntun + dorong · Fase 3 (hujan, HP < 30%): lebih cepat 20%, layar `gelapkan_latar` | semua |
| Senior Angkatan Lama (B07, sepia) | Versi sederhana Haris fase 1–2 | |

### 5.3 Aturan gelombang dan arena (gaya Renegade)
- Setiap layar adalah **arena terkunci**: panah "LANJUT →" (`penanda_tujuan`) hanya muncul setelah semua musuh kalah.
- Musuh masuk dari kiri/kanan layar dengan `jalan_tempur`, maksimal 4 di layar sekaligus.
- **Bos masuk ketika sisa kroco ≤ 1** di layar bos.

## 6. Progres dan ekonomi
- **Uang Saku (Rp)**: kroco memberi Rp 500–1.500, bos Rp 5.000. Uang muncul sebagai teks melayang (tidak perlu sprite koin).
- **Kantin** (stage `kantin`, gaya River City Ransom): makanan memulihkan HP; pembelian **pertama** setiap jenis makanan juga memberi +1 stat permanen.

| Item | Harga | Efek | Bonus pertama kali |
|---|---|---|---|
| Gorengan | 1.000 | HP +15 | Kekuatan +1 |
| Es Teh Manis | 1.500 | HP +20, Stamina penuh | Stamina +5 |
| Roti Bakar | 3.000 | HP +40 | Ketahanan +1 |
| Nasi Goreng | 6.000 | HP penuh | HP maks +10 |
| Susu Kotak | 2.500 | status `kuat` 20 detik | Kecepatan +1 |

- **Dojo Gilang** (stage `gimnasium`, gaya River City Girls): membeli jurus dengan Rp, dibuka per bab:
  Tangkis + Serangan Balik (Bab 1, gratis sebagai tutorial) · Pukulan Badan (Bab 2, 4.000) · Maju Selangkah (Bab 3, 6.000) · Dorongan Semangat (Bab 6, gratis karena cerita) · Kombo +Finisher Ganda (opsional, 12.000: `pukulan_berat` dua kali di akhir kombo).
- **Latih Tanding** di Dojo: melawan Gilang (A07) atau Bima (A04) tanpa risiko; memberi Rp kecil sekali per bab.
- **Ranking per layar & bab** (gaya SoR4): skor dari damage diberikan, kombo terpanjang, waktu, dan HP tersisa → **S/A/B/C**. Ranking tertinggi disimpan.

## 7. Waktu Bebas (hub) dan konten sampingan
- Di antara bab, pemain membuka **Peta Sekolah** (`panel_peta`) dan memilih lokasi yang sudah terbuka.
- Di setiap lokasi hub, pemain berjalan bebas (`jalan_samping`) dan bertemu NPC dari `05_NPC` dan kelompok C (duduk, membaca, main basket, mengobrol). Interaksi memunculkan dialog.
- **Cerita Sekolah** (6 misi sampingan, gaya "School Stories" Lost Judgment). Penanda misi `penanda_misi`:
  1. **Buku yang Hilang** (perpustakaan, Wawan/C03): ambil 3 buku dari lorong_loker dan area_loker.
  2. **Pengganggu Lapangan** (lapangan_basket, Rizal/C04): kalahkan 3 gelombang dalam 90 detik.
  3. **Latihan Band** (ruang_musik, Tiara/A06): kawal Tiara ke ruang musik melewati 2 layar musuh.
  4. **Proposal OSIS** (ruang_osis, Mega/C07): bertarung tanpa terkena lebih dari 3 kali.
  5. **Sepeda Nisa** (parkir_sepeda, Nisa/C05): kejar suruhan; musuh kabur jika tidak dikalahkan dalam 45 detik.
  6. **Kebun Pak Hendra** (kebun_sekolah, Eko/C06): jaga kebun dari 4 gelombang kroco.
  Hadiah: Rp, 1 Arsip Sejarah, dan stat kecil.
- **Pengingat:** Waktu Bebas boleh dilewati. Cerita utama tetap bisa ditamatkan tanpa konten sampingan pada tingkat kesulitan Normal.

## 8. Mode tambahan (setelah tamat)
- **Mode Bebas**: ulangi bab mana pun dengan karakter yang sudah terbuka, termasuk Arga.
- **Boss Rush**: semua bos berurutan, dengan timer.
- *(Stretch)* **2 Pemain Lokal**: P2 memakai gamepad kedua. Kerjakan hanya jika semua milestone utama sudah selesai.

## 9. Presentasi
- **Kamera**: tetap per layar 480×270. Transisi antar-layar berupa fade 200 ms + geser.
- **Waktu/cuaca**: pakai varian di `13_WEATHER` jika ada; jika tidak, pakai stage dasar ditambah overlay warna (sore = oranye 18%, malam = biru gelap 45% + `overlay_hujan_480x270` saat hujan).
- **Flashback (Bab 5)**: shader/pipeline sepia + `vinyet_fokus` + grain halus. Jika postFX tidak tersedia, fallback ke tint.
- **Efek lingkungan**: tirai, neon berkedip, bendera, pohon, burung, dan genangan dari `14_ENVIRONMENT_EFFECTS` dipasang per stage sebagai dekorasi.
- **Dialog**: kotak `kotak_dialog_9slice` di bawah layar; potret 96×96 di dalam `bingkai_potret` (rival: `bingkai_potret_rival`). Tokoh tanpa potret memakai frame tampak depan dari sheet `_ekspresi` di dalam `bingkai_potret_kecil`. Ekspresi potret: netral, serius, marah, percaya_diri, khawatir, terkejut.
- **Cutscene**: dijalankan oleh *script runner* (`src/systems/Cutscene.ts`) dengan perintah: `say`, `move`, `face`, `anim`, `wait`, `fade`, `shake`, `flash`, `setFlag`, `spawn`, `music`, `sfx`. Gunakan animasi depan/belakang (`jalan_bawah`, `bicara_depan`, `idle_depan`, `pakai_loker`, `jalan_bawah_bawa_kotak`) untuk adegan yang menghadap kamera.
- **Judul**: `17_THUMBNAIL/after_school_cover_*` sebagai latar layar judul. Teks "TEKAN ENTER" berkedip.

## 10. Audio (prosedural; paket tidak berisi audio)
- **SFX** disintesis dengan WebAudio, seperti sfxr: pukul ringan, pukul berat, tangkis ("ting"), tahan, jatuh, langkah, menu, uang, dan level up.
- **Musik**: sequencer chiptune kecil buatan sendiri (2 pulse + triangle + noise) dengan 6 lagu: Judul, Hub/Sekolah, Pertarungan, Bos, Kilas Balik (lambat, minor), dan Festival (ceria).
- Volume Musik dan SFX terpisah di `panel_pengaturan`. Audio hanya mulai setelah input pertama (kebijakan autoplay browser).

## 11. Simpan dan pengaturan
- Simpan otomatis di akhir layar/bab ke `localStorage`, dibungkus try/catch. Jika storage tidak tersedia, game tetap jalan dan menampilkan pemberitahuan "TIDAK BISA MENYIMPAN".
- Ada 3 slot. Data yang disimpan: bab, flag cerita, Rp, stat, jurus, arsip, ranking, karakter yang terbuka, dan pengaturan.
- Pengaturan: volume, skala layar (Auto/×2/×3/×4), tingkat kesulitan, tampilkan hitbox (debug, tersembunyi), dan rebind tombol.

## 12. Kriteria "selesai" (Definition of Done) untuk v1.0
1. [x] Prolog sampai Epilog bisa dimainkan dari awal hingga akhir tanpa error. *Diverifikasi di Chrome (e2e cerita utuh dari menu sampai Kredit lalu Hub, tanpa error konsol). Firefox dan Edge belum diuji di lingkungan ini; kode memakai Web API standar (Canvas/WebGL, WebAudio, localStorage) tanpa fitur khusus Chrome.*
2. [~] Stabil 60 FPS di laptop menengah dengan 4 musuh + efek di layar. *Terukur rata-rata 50 FPS di headless Chrome dengan GL perangkat lunak (tanpa GPU) dengan 4–5 petarung; belum diukur di perangkat keras nyata. Logika tetap 60 Hz, efek di-pool.*
3. [x] Semua 22 stage dipakai; tidak ada referensi aset yang hilang (dicek oleh skrip validasi `npm run validate`).
4. [x] ZIP itch.io < 1.000 file dan < 500 MB, `index.html` di root, semua path relatif (`release/after-school-web-v1.0.0.zip`: 247 file, 5,1 MB; dicek `npm run package:itch` dan `npm run verify:zip`).
5. [x] Tidak ada gerakan/animasi yang tidak ada di paket; tidak ada konten grafis (semua animasi dari manifest; validator memeriksa tiap animasi yang dirujuk cerita).
6. [x] Bisa dimainkan penuh dengan keyboard saja (semua e2e memakai keyboard) dan dengan gamepad saja (peta tombol gamepad standar untuk gerak, serangan, menu, dan jeda; Title dan menu merespons konfirmasi gamepad). *Gamepad belum diuji dengan perangkat fisik di lingkungan ini; pemetaan diuji unit.*
