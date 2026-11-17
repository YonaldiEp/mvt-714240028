# GeoTiles

Penampil data geospasial dengan layanan **Mapbox Vector Tile (MVT) statis** untuk GitHub Pages. data dapat ditambah melalui `datasets.json`.

Tugas Sistem Informasi Geografis, Semester 5 · Yonaldi Ernanda P (714240028).

**Aplikasi:** [GeoTiles di GitHub Pages](https://yonaldiep.github.io/mvt-714240028/).

**Repositori:** [YonaldiEp/mvt-714240028](https://github.com/YonaldiEp/mvt-714240028).

Deployment melalui GitHub Actions sudah berhasil. Setiap push berikutnya ke `main` membuat ulang tile, menjalankan pengujian, dan memperbarui situs.

## Hasil tugas

- Backend penyajian tile statis: `tiles/{z}/{x}/{y}.pbf` di GitHub Pages.
- Frontend peta untuk menampilkan MVT, memilih dataset, melihat atribut fitur, mengunduh data sumber, dan menampilkan batas tile.
- Metadata `tiles.json` dan katalog dataset `catalog.json`.
- GitHub Actions untuk membuat tile, menjalankan pengujian, dan menerbitkan folder `dist/`.
- Panduan rekaman video YouTube di bawah. Video perlu direkam dan diunggah oleh pengumpul tugas.

## Cara kerjanya

```text
GeoJSON → geojson-vt (proyeksi, pemotongan, penyederhanaan)
        → vt-pbf (encoding MVT versi 2)
        → dist/tiles/z/x/y.pbf
        → GitHub Pages
        → browser meminta tile sesuai area dan zoom
        → MapLibre GL JS menggambar geometri
```

`z` adalah tingkat zoom, `x` kolom, dan `y` baris pada skema XYZ/Web Mercator. Pada zoom 0 dunia menempati satu tile; setiap kenaikan zoom membagi satu tile menjadi empat tile anak.

**Raster tile berbeda dengan vector tile.** Raster tile berisi gambar PNG/JPG yang sudah digambar. MVT berisi geometri dan atribut dalam Protobuf, kemudian digambar oleh browser. Pola URL `z/x/y` berlaku untuk keduanya.

GitHub Pages melayani file yang sudah dibuat saat build. Tidak ada proses server Node.js/Python yang berjalan di GitHub Pages dan tidak ada pembuatan tile saat permintaan datang. Inilah peran backend statis pada tugas ini.

Basemap gambar berasal dari OpenStreetMap; tile vektor kampus dan jalan dihasilkan sendiri dari GeoJSON lalu dilayani oleh GitHub Pages. Aplikasi tidak menyalin atau menghosting ulang basemap OSM. Atribusi OSM tetap ditampilkan.

## Data saat ini

| Sumber | Dataset | Isi |
|---|---|---|
| `714240028.geojson` | Kampus ULBI | 26 Polygon gedung/fasilitas dan 1 LineString batas kampus |
| `jalan-714240028.geojson` | Kartini - Pasar Antri | 1 LineString rute jalan dengan 17 titik |

Total 28 fitur. Data sumber dipertahankan, termasuk nama yang berulang dan ejaan aslinya. `Kampus ULBI` tetap berupa LineString sesuai sumber. Tarif ojek dari proyek sebelumnya tidak digunakan karena tidak berlaku untuk seluruh dataset.

Build saat ini menghasilkan **519 file MVT pada zoom 12–18**. Jumlah file dihitung ulang ketika sumber berubah. Zoom tampilan 19–20 menggunakan tile zoom 18 (overzoom). Browser tidak memuat GeoJSON sumber untuk menggambar peta; tautan GeoJSON hanya untuk unduhan.

Untuk menghindari 404 di antara dua area data, build juga menulis tile kosong yang valid pada seluruh persegi cakupan data. Di luar bounds sumber, frontend tidak meminta MVT. Batas tile yang ditampilkan mencakup sumber peta yang sedang dimuat, termasuk raster basemap.

## Menjalankan lokal

Prasyarat: Node.js 22 atau lebih baru, npm, Python 3, dan browser dengan WebGL. Internet diperlukan saat instalasi dependensi dan untuk basemap OSM.

```bash
npm ci
npm run build
npm test
npm start
```

Buka [pratinjau lokal](http://127.0.0.1:8000). Server lokal melayani `dist/`, dengan MIME modul `.mjs` yang sesuai pada Windows. Jangan membuka `index.html` langsung atau melayani root repositori sebelum build.

`npm run build` membuat ulang folder `dist/`; jangan menyimpan perubahan manual di dalamnya. Library MapLibre beserta worker dan lisensinya disalin ke `dist/vendor/`, sehingga browser tidak bergantung pada CDN JavaScript.

## Publikasi GitHub Pages

1. Unggah seluruh kode sumber, `package.json`, `package-lock.json`, kedua GeoJSON, dan folder `.github/` ke branch `main` repositori `YonaldiEp/mvt-714240028`.
2. Buka **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Buka tab **Actions**, pilih workflow **Publish GeoTiles**, lalu jalankan **Run workflow** jika belum otomatis berjalan.
4. Tunggu job `build` dan `deploy` berhasil. Folder `dist/` dibuat di Actions dan diunggah sebagai artefak Pages; `node_modules/` dan `dist/` tidak perlu di-commit.
5. Buka URL yang ditampilkan oleh job deployment.

Jika repositori lokal belum memiliki commit:

```bash
git add .
git commit -m "feat: add GeoTiles static MVT service"
git push -u origin main
```

Push memerlukan autentikasi GitHub dan izin menulis repositori. Jangan menimpa riwayat remote dengan force push. Jika remote telah memiliki commit, integrasikan riwayatnya dahulu.

Alamat yang diharapkan setelah deployment:

```text
https://yonaldiep.github.io/mvt-714240028/
https://yonaldiep.github.io/mvt-714240028/catalog.json
https://yonaldiep.github.io/mvt-714240028/tiles.json
https://yonaldiep.github.io/mvt-714240028/tiles/{z}/{x}/{y}.pbf
```

URL terakhir adalah template; ganti `{z}`, `{x}`, `{y}` dengan tile yang benar. Tautan **Permintaan terakhir** di aplikasi menampilkan contoh tile yang benar-benar telah dimuat. `tiles.json` memakai template relatif terhadap direktori situs; klien eksternal perlu mengubahnya menjadi URL absolut sesuai alamat publikasi.

## Menambah atau mengganti data

1. Tambahkan GeoJSON bertipe `FeatureCollection` ke repositori. Gunakan koordinat bujur/lintang WGS84 dengan lintang dalam rentang Web Mercator (sekitar ±85,0511°).
2. Daftarkan sumber di `datasets.json`:

```json
[
  { "id": "kampus", "name": "Kampus ULBI", "file": "714240028.geojson" },
  { "id": "jalan", "name": "Kartini - Pasar Antri", "file": "jalan-714240028.geojson" },
  { "id": "lokasi-baru", "name": "Lokasi Baru", "file": "lokasi-baru.geojson" }
]
```

3. Gunakan `id` unik berupa huruf kecil, angka, atau tanda hubung. Properti `Nama` menjadi nama fitur yang tampil di peta; fitur tanpa nama mendapat label pengganti.
4. Jalankan build dan test, lalu push. Daftar dataset, bounds, jumlah fitur, dan tile dibuat ulang otomatis.

Point/MultiPoint, LineString/MultiLineString, dan Polygon/MultiPolygon didukung. GeometryCollection belum didukung. Semua fitur ditempatkan pada source-layer `features`, dengan atribut tambahan `dataset` dan `geometry_type`.

**Batas cakupan:** generator ini ditujukan untuk data lokal tugas. Ia membuat seluruh persegi cakupan pada zoom 12–18; data berjauhan atau cakupan sangat luas bisa menghasilkan terlalu banyak file. Untuk cakupan provinsi/negara, ubah strategi cakupan dan zoom, atau gunakan generator tileset skala besar.

## Membuktikan tile diminta berdasarkan z/x/y

1. Buka aplikasi, lalu Developer Tools → **Network**.
2. Filter `pbf` dan muat ulang halaman. Aktifkan Disable cache bila ingin melihat permintaan baru.
3. Pilih Kampus ULBI, lakukan zoom dan geser peta.
4. Tunjukkan permintaan `tiles/z/x/y.pbf` yang berubah sesuai area/zoom dan berstatus HTTP 200.
5. Aktifkan **Tampilkan batas tile** untuk melihat pembagian tile. Batas ini merupakan alat debug MapLibre dan dapat mencakup basemap juga.
6. Klik gedung atau garis jalan. Nama, dataset, dan jenis geometri muncul. Daftar fitur menyediakan akses detail melalui keyboard.
7. Bandingkan request `.pbf` milik situs sendiri dengan `.png` milik basemap OSM. Tidak ada request GeoJSON saat menggambar layer vektor.

Pada zoom rendah, geometri kecil dapat disederhanakan atau belum terlihat. Dekatkan ke area kampus untuk melihat bangunan. Daftar fitur berasal dari tile yang telah dimuat selama sesi, sehingga bukan daftar seluruh fitur sumber pada setiap zoom.

## Alur video tutorial YouTube

Perkiraan durasi 6–9 menit:

1. **Tujuan tugas:** jelaskan masalah memuat data peta utuh serta pembagian tile berdasarkan XYZ.
2. **Raster dan vektor:** bedakan tile gambar dengan MVT; jelaskan peran GitHub Pages sebagai penyaji file statis.
3. **Data sumber:** buka kedua GeoJSON dan `datasets.json`, tunjukkan Polygon serta LineString.
4. **Proses build:** jalankan `npm ci`, `npm run build`, dan `npm test`. Buka struktur `dist/tiles/` dan metadata.
5. **Demo lokal:** pilih dataset, zoom/pan, klik fitur, aktifkan batas tile, dan perlihatkan request `.pbf` berstatus 200 di Network.
6. **Deployment:** tunjukkan Settings Pages dengan GitHub Actions, workflow yang berhasil, lalu buka situs publik.
7. **Bukti hasil:** ulangi request tile pada domain GitHub Pages, kemudian jelaskan cara menambahkan data baru lewat katalog.

Judul video yang dapat dipakai: **Membuat Backend Map Vector Tile di GitHub Pages dengan GeoTiles**.

Isi deskripsi video dengan identitas mahasiswa, tautan repositori, dan URL GitHub Pages yang sudah berhasil dibuka. Tautan YouTube belum tersedia sampai video direkam dan diunggah.

## Struktur proyek

```text
.github/workflows/pages.yml  Build, test, dan deploy Pages
scripts/build.mjs           GeoJSON → MVT dan situs siap publikasi
scripts/serve.py             Server pratinjau lokal
 tests/tiles.test.mjs        Dekode tile dan periksa seluruh fitur sumber
 datasets.json              Daftar sumber data
 index.html / index.js      Antarmuka dan logika MapLibre
 style.css                  Tampilan responsif
 *.geojson                  Data sumber
 dist/                      Hasil build (diabaikan Git)
```

## Pengujian

`npm test` memerlukan build terlebih dahulu. Pengujian mendekode seluruh `.pbf`, memeriksa versi MVT dan extent, mencocokkan jumlah file dengan katalog, serta memastikan setiap fitur sumber tersedia pada zoom maksimum dengan nama, dataset, dan jenis geometri yang sesuai.

## Referensi

- [Spesifikasi Mapbox Vector Tile](https://mapbox.github.io/vector-tile-spec/)
- [geojson-vt](https://github.com/mapbox/geojson-vt)
- [vt-pbf](https://github.com/mapbox/vt-pbf)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Ketentuan penggunaan tile OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/)
