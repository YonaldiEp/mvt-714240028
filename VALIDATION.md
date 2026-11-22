# Pemeriksaan UI/UX GeoTiles

## Tema hitam, 22 November 2026

- **Keterbacaan.** Pada permukaan kontrol `#242424`, rasio kontras teks utama sebesar 13,98:1 dan teks sekunder 7,72:1. Batas fokus kuning memiliki kontras 10,81:1 terhadap permukaan tersebut.
- **Hierarki.** Nama dataset berada di pemilih, geometri tampil setelah objek dipilih, dan daftar fungsi dapat dibuka dari header. Basemap dibuat monokrom. Isian kuning dan garis yang lebih tebal membedakan objek pilihan pada render kampus.
- **Interaksi.** Di browser, menu fitur dapat dibuka dan ditutup, pemilihan dataset memperbarui daftar, dan pencarian tanpa hasil menampilkan pesan. Escape menghapus kueri. Enter memilih objek. Tombol tutup detail mengembalikan fokus ke pencarian. Kontrol zoom, reset area, fokus objek, dan batas tile dapat dioperasikan. Tautan PBF dan GeoJSON menunjuk ke file dataset yang diuji.
- **Ponsel.** Pada viewport 390 × 844, menu muat di layar dan lebar konten sama dengan lebar area dokumen. Setelah memilih Gedung Raflesia, tombol fokus menggulir peta ke tepi atas layar.
- **Proyek.** Build menghasilkan 519 tile dari 28 objek. Ketiga pengujian otomatis lulus, termasuk pendekodean PBF dan pencocokan objek sumber.

## Pemeriksaan versi 18 November 2026

- **Hard Gate PASS:** build dan tiga tes otomatis lulus. Pencarian, pemilihan dataset, pilihan fitur melalui Enter, popup dan tombol tutup, fokus fitur, zoom, reset area, batas tile, unduhan GeoJSON, serta pembukaan informasi tile telah diuji di browser. Tidak ada luapan horizontal pada viewport 390 × 844, 820 × 900, dan 1487 × 1058. Fokus kembali ke pencarian setelah detail ditutup. Hijau/putih memiliki kontras 7,20:1; teks sekunder/putih 6,00:1. Keadaan loading, hasil kosong, kegagalan katalog, dan pemulihan lewat muat ulang telah diperiksa.
- **Purpose Gate PASS:** hijau mempertahankan identitas GeoTiles dan menghubungkan pilihan daftar dengan geometri. Panel datar mengelompokkan kontrol; bayangan dibatasi pada overlay peta. Segoe UI dipakai untuk keterbacaan label dan atribut. Tidak ada aset gambar, logo baru, metrik, atau testimoni buatan pada aplikasi.
- **Liveliness PASS:** ENERGY 1 / RHYTHM 1 / MOTION 1. Peta adalah fokus utama. Panel mengikuti alur pilih dataset, cari fitur, dan periksa detail. Detail teknis disimpan dalam disclosure; ponsel menumpuk peta di atas panel. Transisi warna kontrol hanya memberi umpan balik singkat dan mengikuti reduced motion.
- **Craftsmanship PASS:** 28 fitur sumber tetap menghasilkan 519 tile MVT. Pengujian mendekode tile dan memeriksa fitur sumber, pencarian lintas dataset, nama berulang, aksen, nama numerik, dan batas geometri. Sesi penggunaan normal tidak menghasilkan error/warning console. Kesalahan 404 katalog hanya dibuat dalam fixture lokal untuk menguji pesan kesalahan dan pemulihannya.

Acuan visual dibandingkan dengan render desktop pada ukuran yang sama. Peta asli, urutan alfabetis, ukuran huruf, dan susunan detail sengaja disesuaikan dengan data dan kontrol sebenarnya; tidak ada klaim kecocokan piksel sempurna.

Bukti lokal, hash sumber, langkah pengujian, dan catatan perbandingan tersimpan dalam `.design/visual-evidence.json` (diabaikan Git dan tidak dipublikasikan). Tangkapan WebGL satu halaman penuh pada ponsel tidak selalu lengkap; bukti ponsel dibatasi pada kontrol, fokus, dan tata letak yang diuji. Render peta juga telah diamati melalui tampilan browser.

Basemap tetap bergantung pada koneksi OpenStreetMap. Daftar fitur berisi data yang sudah dimuat selama sesi, dan fokus memakai gabungan batas geometri yang tersedia dari tile. Tidak ada dependensi baru. Video YouTube belum direkam atau diunggah.
