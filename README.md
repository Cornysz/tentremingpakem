# Tentrem ing Pakem — Coming Soon

Website statis satu halaman untuk KKN PPM UGM Periode 3, 2026.

## Memasang ke repo dan Vercel

Repo Cornysz/tentremingpakem sudah terhubung dengan Vercel. Simpan index.html, style.css, script.js, vercel.json, dan folder assets di root repo. Setiap commit ke branch main memicu deployment production otomatis. Tidak memerlukan npm, framework, atau build command. Untuk project baru pilih Framework Preset: Other dan direktori output root proyek.

Domain dan pengaturan DNS tidak perlu diubah. Vercel otomatis memasangkan deployment production yang berhasil ke www.tentremingpakem.com.

## Isi

- Background dawn lanskap terinspirasi Pakem, dibuat dengan Imagegen. Ini visual ilustratif, bukan foto dokumentasi atau representasi geografis yang presisi.
- Burung bergerak dan parallax halus pada perangkat dengan mouse.
- Tombol jeda animasi dan dukungan prefers-reduced-motion.
- Kartu pos Kenalan dengan Pakem kini berisi jurnal KKN: Bakti Kampus dan pertemuan pertama pada 12 September 2026, pertemuan kedua pada 14 September 2026, audiensi di Kapanewon Pakem serta penandatanganan surat kesediaan lokasi di Kalurahan Candibinangun dan Purwobinangun pada 29 September 2026, serta halaman cerita berikutnya yang belum tersedia. Semua foto dokumentasi disediakan oleh tim. Pergantian halaman, teks penghubung, tombol kembali dan lanjut, serta navigasi tanggal menyambungkan perjalanan. Mendukung keyboard, Escape, atau klik di luar panel.
- Judul memakai tipografi resmi KKN (6 Oktober 2026): Tentrem ing Pakem dengan setangkai daun cokelat di kanan Tentrem. Daunnya SVG hasil penelusuran logo resmi, jadi tetap tajam di semua ukuran. Ukuran dan posisinya dalam satuan em, sehingga seluruh judul identik dengan logo pada layar apa pun.
- Animasi pembuka setiap kali halaman dibuka: kabut pagi terangkat dari lanskap, kata Tentrem, ing, dan Pakem muncul bergantian dari samar menjadi tajam, titik cokelat mendarat, lalu daun tumbuh paling akhir. Batangnya memanjang dulu, kemudian empat helai daun membuka satu per satu. Setelah itu daun bergoyang pelan seperti tertiup angin. Durasinya sekitar tiga detik, goyangan ikut tombol jeda, dan semuanya tidak berjalan bila perangkat meminta gerakan dikurangi.
- Kartu hitung mundur menuju penerjunan, Senin, 19 Oktober 2026. Angkanya berdetak tiap detik dan menghitung naik dari nol saat halaman dibuka. Garis di bawahnya adalah lini masa perjalanan: satu titik untuk setiap bab jurnal, lalu titik penerjunan di ujung, dengan burung kecil di posisi hari ini. Titik-titik menyala bergantian saat garis bergerak di awal halaman. Mengklik atau mengetuk titik bab langsung membuka jurnal di bab itu, dan kursor di atas titik menampilkan judul babnya. Titik sengaja berjarak sama supaya mudah diketuk di ponsel; burung bergerak di antara dua titik sesuai tanggal. Bila bab sudah banyak, hanya tanggal ujung yang ditulis. Tanggal penerjunan ada di `data-target` pada `.countdown`, lengkap dengan zona +07:00, jadi pengunjung di zona waktu lain tetap melihat waktu WIB. Pada 19 Oktober kartu berganti menjadi "Hari penerjunan", lalu "Sudah di Pakem" sesudahnya; teksnya ada di atribut `data-today` dan `data-arrived`.
- Setiap foto jurnal bisa diklik atau diketuk untuk pratinjau besar. Fotonya membesar dari posisinya di kolase, lengkap dengan tanggal dan keterangan. Panah, tombol panah keyboard, dan swipe berpindah antar foto dalam bab yang sama. Tutup lewat tombol, Escape, atau klik area gelap; fokus kembali ke foto asal.
- Tombol ajakan dengan bunga berputar dan percikan bintang kecil; FAB ikon pause/play tanpa teks.
- Ikon SVG tidak bergantung pada font atau emoji iOS. Logo header, favicon PNG, dan Apple Touch Icon menggunakan logo gradasi terbaru dari tim (19 September 2026).
- Logo header (dan tautan Filosofi logo di footer) membuka dialog Filosofi Logo. Logonya dipecah menjadi empat bentuk: matahari, gunung (Merapi beserta lerengnya), huruf P, dan daun. Mengetuk bentuk di logo atau label bernomor di sekelilingnya menyalakan bentuk itu, meredupkan yang lain, dan menampilkan maknanya. Matahari bersinar, Merapi dan lereng diberi label, huruf P diwarnai, dan daun bergoyang. Tombol sebelumnya dan berikutnya, tombol panah keyboard, serta ketukan di area kosong (kembali ke tampilan utuh) ikut bekerja. Setiap kali dibuka, logo menyusun diri: gunung naik, daun tumbuh, matahari terbit dari balik Merapi, lalu huruf P tergambar. Di ponsel, logo menempel di atas teks saat digulir. Mendukung jeda gerakan, reduced motion, Escape, dan pengembalian fokus.
- Favicon bulat tersedia sebagai SVG dan PNG dengan sudut transparan.
- Petunjuk singkat “Ketuk logo, lihat filosofinya.” muncul setelah 2,5 detik idle bersama dua goyangan kecil pada logo, sekali per sesi tab, lalu hilang setelah 6 detik atau saat berinteraksi. Tidak muncul ketika dialog terbuka, tab disembunyikan, atau logo sudah diklik. Goyangan mengikuti tombol jeda dan prefers-reduced-motion.
- Tautan Instagram @tentremingpakem.
- Gambar pratinjau tautan `assets/og-image.jpg` (1200×630, JPEG) untuk WhatsApp dan media sosial. Isinya hero situs yang dirender ulang: latar, logo, dan judul resmi berdaun. Tulisan Segera Hadir sengaja tidak dimasukkan, jadi gambarnya tetap berlaku setelah situs resmi dibuka. Bila gambarnya diganti, naikkan juga nilai `?v=` pada `og:image` di index.html.
- Indikator "Scroll" di bawah hero membawa ke bagian berikutnya. Setelah hero lewat, muncul navigasi kecil di atas (Pakem, Tema, Lokasi, Jurnal) yang menandai bagian yang sedang dibaca. Isi di bawah hero muncul perlahan saat terlihat; tanpa JavaScript atau dengan gerakan dikurangi, isinya langsung tampil.
- Bagian Mengenal Pakem (pertama sesudah hero): letak Pakem, arti nama Tentrem ing Pakem (ketuk tiap kata), dan tiga angka BPS yang menghitung naik: luas wilayah, jumlah kalurahan, dan penduduk.
- Bagian Tema: tema resmi KKN dengan empat frasa yang bisa diketuk. Tiap frasa menyalakan kartu penjelasannya (ESD, pangan lokal, berbasis riset, KWT Guyub Rukun), lengkap dengan tautan sumber.
- Bagian Lokasi: peta SVG Kapanewon Pakem dengan lima kalurahan. Candibinangun dan Purwobinangun bisa dipilih lewat peta, penanda, atau tab, dan panelnya berisi luas, padukuhan, penduduk, ketinggian, potensi, serta sumbernya. Peta Google (satelit atau peta biasa) baru dimuat setelah tombol ditekan, jadi halaman tidak memasang cookie pihak ketiga sebelum pengunjung memilih.
- Footer berisi lokasi, tautan bagian, jurnal, Filosofi logo, Instagram, dan kembali ke atas.
- Tidak menggunakan analytics, formulir atau layanan berbayar. Cookie pihak ketiga hanya muncul bila pengunjung sendiri memuat peta Google.

## Isi bagian Pakem, Tema, dan Lokasi

Semua teks ada di index.html, di dalam `section#pakem`, `section#tema`, dan `section#lokasi`. Setiap fakta di sana berasal dari sumber resmi yang ditautkan di bawah kartunya (BPS Sleman, situs resmi kalurahan, UNESCO, UGM, Sekolah Vokasi UGM, dan UU Pangan), dicek pada 6 Oktober 2026. Saat memperbarui angka, ganti juga tahun datanya.

- Angka statistik memakai `data-count`; isi angka asli di atribut itu (titik sebagai pemisah desimal) dan di dalam elemennya.
- Teks pada peta Google diambil dari `data-query` dan `data-zoom` di tiap `article.place`.
- Bentuk peta berasal dari batas wilayah OpenStreetMap (ODbL), digambar ulang secara skematis. Bentuk itu bukan batas resmi, jadi luas resmi tetap mengikuti angka BPS.

## Isi Filosofi Logo

Teks makna ada di index.html, di dalam `dialog#logo-philosophy`: satu `article.makna` untuk tampilan utuh dan satu untuk tiap bentuk (`data-part` matahari, gunung, huruf-p, daun). Label di sekeliling logo dan titik penunjuknya memakai `data-part` yang sama. Tombol sebelumnya dan berikutnya mengambil nama bagian dari teks label itu, jadi cukup ganti labelnya. Tulisan "Mulai dari ..." dan "Lihat utuh" ada di script.js, sedangkan tanda kecil Merapi, Lereng, dan P adalah `.anatomy-tag` dengan `data-for`.

Bentuk logo di dialog adalah SVG hasil penelusuran logo asli dari tim (PNG 1254 px, 7 Oktober 2026). Gradasi warnanya diukur dari file itu, dan hasilnya dicek berimpit dengan aslinya: selisih rata-rata 2 dari 255 per piksel, hanya di tepi. Bila logo resmi berubah, telusuri ulang; jangan menggambar bentuknya dengan tangan. Logo kecil di header tetap memakai `logo.png`.

## Menambah bab jurnal

Semua perubahan ada di index.html. Sisipkan tiga blok berurutan, selalu sebelum halaman "Nanti, ya":

1. Tab di `.story-tabs`, misalnya `<button id="tab-5-oktober" role="tab" aria-selected="false" aria-controls="panel-5-oktober" tabindex="-1">`.
2. Panel di `.story-panels` dengan `data-next`, yaitu tulisan tombol menuju bab sesudahnya.
3. Foto di `.journal-view`: `figure.journal-spread` dengan `hidden`. Kelas `journal-collage-pair` untuk dua foto bertumpuk, `journal-collage` untuk tiga foto.

Penghitung halaman dan tulisan tombol berikutnya dihitung otomatis dari urutan itu. Titik di garis hitung mundur juga muncul sendiri, dari tanggal `<time datetime>` di panel dan judul foto bab itu. Foto di dalam `.journal-collage` otomatis bisa diperbesar, dan keterangan pratinjaunya diambil dari teks `alt` foto. Jangan lupa perbarui juga kalimat `journey-connection` dan `data-next` pada bab sebelumnya supaya ceritanya tetap nyambung.

## Sumber informasi Pakem

- https://slemankab.go.id/profil-kabupaten-sleman/geografi/karakteristik-wilayah/
- https://perindag.slemankab.go.id/pasar-pakem-pusat-tradisi-ekonomi-dan-wisata-lereng-merapi/

## Prompt aset — built-in Imagegen

Background: Cinematic natural editorial landscape inspired by rural Pakem, Yogyakarta, on southern slopes of Merapi; atmospheric illustration rather than documentary claim. Bottom 40 percent: wet green rice paddies, narrow winding earthen walking path from lower right into distance, distant volcanic silhouette slightly right of center in lower middle. Upper 60 percent: quiet luminous pale misty sage-ivory sky with thin subtle clouds and clean negative space for centered dark serif website title added later. A few out-of-focus dark leaves only at extreme upper corners, no intrusive canopy. Photographic organic realism, restrained film grading, atmospheric depth, dawn soft mist, subtle warm glow, muted olive greens. No text, logos, buildings, signs, people, UI, or borders.

Bird: One single distant swallow bird, dark olive silhouette, side view flying with wings raised, elegant natural flight pose, graceful slender wings and forked tail. Minimal readable silhouette, natural proportions, not emoji/cartoon. Genuinely transparent background with alpha, no landscape, sky, shadow, text, logos or border. Dark muted olive #344033.
