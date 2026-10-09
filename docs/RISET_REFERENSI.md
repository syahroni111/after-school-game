# Riset & Referensi — AFTER SCHOOL: Jejak Tiga Sekolah

Dokumen ini menjelaskan **kenapa** game dirancang seperti di `GDD.md`. Setiap keputusan desain diambil dari game nyata yang sudah terbukti, lalu disesuaikan dengan aset yang benar-benar ada di paket `AFTER_SCHOOL` (karakter 64×64, 22 stage 480×270, tanpa animasi lompat/tendang/banting/senjata).

---

## 1. Kesimpulan riset (ringkas)

**Genre yang dipilih: Story-driven Beat 'em up (belt-scroll, layar-per-layar) dengan elemen RPG ringan, ber-setting sekolah, dibagi per Bab (chapter).**

Alasannya:
1. Aset kita adalah aset **beat 'em up murni**: kuda-kuda, rangkaian pukulan, tangkis, serangan balik, menghindar, terhuyung/terpental/jatuh/bangkit, dan stage 480×270 dengan `walk_area_y` (area lantai untuk gerak kedalaman). Genre yang memakai persis set gerak ini adalah keluarga *Kunio-kun* (Renegade, River City Ransom, River City Girls) dan *Streets of Rage*.
2. Tema "pelajar antar-sekolah" sudah punya tradisi genre yang jelas dan sah: **Renegade/Kunio-kun** (berandal SMA), **River City Ransom/Girls** (geng antar-sekolah + toko + jurus), **Rival Schools** (tim per sekolah + mode cerita per sekolah), **Bully** (kelompok/klik di sekolah + bab per semester), **Lost Judgment** (konflik di sekolah + "School Stories").
3. Permintaan "bertema history/cerita" dijawab dengan **struktur bab + sejarah sekolah yang terungkap pelan-pelan** (arsip, flashback berwarna sepia), dengan nuansa Indonesia seperti **A Space for the Unbound** (game Indonesia, SMA, akhir 90-an), tapi tetap ada aksi di setiap bab.

---

## 2. Referensi utama dan apa yang kita ambil

| # | Game (tahun, studio) | Fakta yang relevan | Yang kita adopsi | Sumber |
|---|---|---|---|---|
| 1 | **Renegade / Nekketsu Kōha Kunio-kun** (1986, Technōs Japan) | Cikal bakal beat 'em up; tokoh berandal SMA; stage berupa arena yang hampir satu layar; **bos muncul setelah anak buahnya tinggal sedikit**. | Stage satu layar 480×270 (cocok dengan aset), aturan "bos masuk saat musuh tersisa ≤ N", tema pelajar. | [Wikipedia — Renegade](https://en.wikipedia.org/wiki/Renegade_(video_game)) |
| 2 | **River City Ransom** (1989, Technōs Japan) | Beat 'em up + RPG: kota terbuka, **uang dari musuh**, **toko yang menaikkan statistik**, **buku/teknik** untuk membuka jurus baru, geng-geng sekolah. | Uang saku dari musuh yang kalah, kantin = toko stat, "buku teknik" = membuka jurus, peta antar-lokasi. | [Wikipedia — River City Ransom](https://en.wikipedia.org/wiki/River_City_Ransom) |
| 3 | **River City Girls** (2019, WayForward) | Interpretasi modern Kunio-kun: dunia saling terhubung, **dojo untuk membeli jurus**, naik level membuka gerakan, **cerita penuh dialog potret**, tokoh siswi SMA. | Dojo di gimnasium, dialog dengan potret, quest utama + sampingan, nada cerita ringan-humor. | [Wikipedia — River City Girls](https://en.wikipedia.org/wiki/River_City_Girls); [Nintendo Life — wawancara WayForward](https://3ds.nintendolife.com/news/2019/08/feature_wayforward_on_river_city_girls_its_crazy_interpretation_of_the_kunio-kun_brand) |
| 4 | **Rival Schools: United by Fate** (1997, Capcom) | Pertarungan antar-SMA; **mode cerita per sekolah**; sistem **Tardy Counter** (serangan balik langsung dari posisi bertahan); tim-up. | Mekanik **Tangkis → Serangan Balik** (animasi `tangkis` + `serangan_balik` tersedia), identitas visual per sekolah, serangan duet di bab akhir. | [Wikipedia — Rival Schools](https://en.wikipedia.org/wiki/Rival_Schools) |
| 5 | **Streets of Rage 4** (2020, Dotemu/Lizardcube/Guard Crush) | **Jurus spesial memakan darah**, tapi darah itu bisa **dipulihkan dengan terus memukul tanpa terkena**; **ranking** di akhir stage; desain beat 'em up modern yang adil. | Jurus `dorong` "Dorongan Semangat" memakai darah-sementara yang bisa dipulihkan; ranking S/A/B/C per stage. | [Wikipedia — Streets of Rage 4](https://en.wikipedia.org/wiki/Streets_of_Rage_4) |
| 6 | **Bully** (2006, Rockstar Vancouver) | Dunia sekolah; **klik/kelompok** dengan reputasi; cerita dibagi **bab** sepanjang tahun ajaran; tokoh dalang yang memanipulasi. | Struktur bab, tokoh antagonis **manipulator** (bukan "monster"), tiga kelompok sekolah dengan reputasi. | [PC Gamer — Reinstall: Bully](https://www.pcgamer.com/uk/reinstall-bully) |
| 7 | **Lost Judgment** (2021, RGG Studio) | Cerita kriminal yang berporos di SMA dengan tema **perundungan**; konten sampingan **"School Stories"** (klub-klub sekolah). | Tema anti-perundungan dan konten sampingan "Cerita Sekolah" (klub, OSIS, perpustakaan, basket). | [Wikipedia — Lost Judgment](https://en.wikipedia.org/wiki/Lost_Judgment) |
| 8 | **A Space for the Unbound** (2023, Mojiken — Indonesia) | Pixel art, **SMA di kota kecil Indonesia akhir 1990-an**, cerita *slice-of-life* yang emosional. | Nuansa Indonesia (nama tokoh, kantin, OSIS, upacara, hujan sore), tempo cerita yang memberi ruang untuk momen tenang di antara pertarungan. | [Wikipedia — A Space for the Unbound](https://en.wikipedia.org/wiki/A_Space_for_the_Unbound) |

### Referensi desain sistem (AI musuh)
| Topik | Inti | Yang kita adopsi | Sumber |
|---|---|---|---|
| **Attack token** | Batasi jumlah musuh yang boleh menyerang bersamaan; musuh lain mengitari/menunggu. Pertarungan keroyokan jadi adil dan terbaca. | `AttackDirector`: maks. 2 token (Normal), 1 (Mudah), 3 (Sulit). | [Signals & Light — "What IS an enemy attack?"](https://signalsandlight.substack.com/p/what-is-an-enemy-attack); [StraySpark — Attack token system](https://www.strayspark.studio/blog/attack-token-system-ue5-group-combat-that-feels-fair) |
| **Telegraph & keterbacaan** | Serangan musuh harus punya antisipasi yang terlihat dan respons pemain yang adil. | Setiap serangan berat musuh punya *wind-up* ≥ 250 ms + kilatan `aksen_energi_merah`. | [lghts — Making combat feel good: fair, readable AI](https://lghts.itch.io/iron-reclamation/devlog/1092177/making-combat-feel-good-fair-readable-and-responsive-ai) |

### Referensi teknis (platform)
| Topik | Fakta | Sumber |
|---|---|---|
| itch.io HTML5 | ZIP berisi `index.html` di root; **maks. 1.000 file**, **maks. 500 MB** setelah diekstrak, **maks. 200 MB per file**, path ≤ 240 karakter, **nama file case-sensitive**, **wajib path relatif** (path absolut `/…` gagal). Mode *Embed* wajib isi ukuran viewport; pengunjung mobile selalu mode fullscreen. | [itch.io — Uploading HTML5 games](https://itch.io/docs/creators/html5) |
| Phaser 3 | `GameConfig.pixelArt: true` (filter nearest, *roundPixels*), Scale Manager untuk *fit*/zoom bulat. | [Phaser docs — GameConfig](https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig) |

---

## 3. Pemetaan referensi → aset yang ada (validasi kecocokan)

| Kebutuhan genre | Ada di paket? | Keterangan |
|---|---|---|
| Kombo pukulan 3–4 hit | ✅ `pukulan_cepat` → `pukulan_lurus` → `pukulan_kait` → `pukulan_berat` | Semua diawali & diakhiri kuda-kuda yang sama → bisa dirangkai mulus. |
| Serangan pemecah pertahanan | ✅ `pukulan_badan` | |
| Bertahan + counter (Rival Schools) | ✅ `bertahan`, `tangkis`, `serangan_balik` | |
| Menghindar / ganti jalur kedalaman | ✅ `menghindar_mundur`, `menghindar_samping` | |
| Dash/maju | ✅ `maju_selangkah` | |
| Jurus pembersih kerumunan (SoR4) | ✅ `dorong` + efek `gelombang_kejut`, `debu_ledak` | |
| Reaksi kena / jatuh / bangun | ✅ `terhuyung`, `pulih`, `terpental`, `jatuh`, `bangkit` | |
| Stage dengan area jalan kedalaman | ✅ 22 stage, `walk_area_y` [160,266] | |
| Waktu & cuaca untuk suasana bab | ✅ 6 lokasi luar × cerah/berawan/hujan/sore/malam + kelas hujan/malam | |
| Dialog berpotret | ✅ 8 potret 96×96 × 6 ekspresi; karakter lain lewat sheet `_ekspresi` | |
| UI (HP, stamina, dialog, menu, peta, tombol) | ✅ `15_UI` lengkap | |
| NPC latar | ✅ `05_NPC` + kelompok C (South Court) | |
| Lompat / tendang / banting / senjata | ❌ tidak ada | **Sengaja tidak dipakai di desain.** Jangan membuat animasi palsu. |
| Audio | ❌ tidak ada | Dibuat prosedural dengan WebAudio (lihat CLAUDE.md). |

**Kesimpulan:** desain di GDD hanya memakai aksi yang tersedia, sehingga game bisa dibangun tanpa aset tambahan.

---

## 4. Hal yang sengaja dihindari
- Meniru nama, tokoh, logo, alur, atau dialog dari game referensi. Kita hanya mengambil **pola desain umum** (kombo, counter, token serangan, struktur bab).
- Kekerasan grafis: tidak ada darah, luka, senjata. Musuh yang kalah **tidak mati** — mereka jatuh, bangkit, lalu mundur/menyerah.
- Peristiwa sejarah nyata yang sensitif. "Sejarah" di game ini adalah **sejarah fiktif tiga sekolah** di sebuah kota fiktif.
