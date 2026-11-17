# Pemeriksaan GeoTiles

Tanggal: 17 November 2026.

- **Hard Gate PASS:** build dan tes berhasil; pilihan dataset, daftar fitur, popup, tombol tutup popup, zoom, reset area, checkbox batas tile, unduhan GeoJSON, dan metadata telah diuji di browser. Lebar 390 dan 820 piksel tidak memiliki overflow horizontal. Tab berpindah ke tombol reset dengan outline fokus terlihat. Pasangan hijau/putih memiliki kontras 7,20:1 dan teks sekunder/latar 6,07:1. Loading, kegagalan pemuatan, dan daftar kosong memiliki pesan tersendiri. Konten berasal dari GeoJSON pengguna, tanpa klaim atau aset buatan.
- **Purpose Gate PASS:** warna hijau mempertahankan identitas peta sebelumnya dan membedakan geometri dari basemap; panel datar mengelompokkan pengaturan tanpa mengalihkan perhatian dari peta. Font sistem digunakan agar label dan atribut tetap mudah dibaca. Bayangan hanya dipakai pada pemberitahuan di atas peta. Tidak ada dekorasi, efek latar, atau animasi tambahan.
- **Liveliness PASS:** ENERGY 1 / RHYTHM 1 / MOTION 1. Arah desain adalah alat penjelajah data geospasial untuk tugas SIG; peta menjadi fokus, panel mengatur dataset dan detail, garis hijau menjadi motif yang berulang pada peta dan header. Susunan panel konsisten untuk perbandingan data, lalu berpindah ke bawah peta pada layar kecil.
- **Craftsmanship PASS:** dua dataset dan 28 fitur sumber dikonversi menjadi 519 tile MVT versi 2 pada zoom 12–18. Seluruh tile dapat didekode dan seluruh fitur ditemukan pada zoom maksimum dengan atribut yang sesuai. Tidak ada error/warning console pada sesi uji lokal. GitHub Actions berhasil menjalankan `npm ci`, build, test, dan deploy. Halaman publik, katalog, modul `.mjs`, dan endpoint `.pbf` merespons HTTP 200.

Basemap bergantung pada koneksi ke OpenStreetMap. Generator dibatasi untuk cakupan lokal; persegi tile yang mencakup data sangat luas akan menghasilkan banyak file. Video YouTube belum direkam atau diunggah; urutan tutorial tersedia di README.
