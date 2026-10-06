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
- Kartu hitung mundur menuju penerjunan, Senin, 19 Oktober 2026. Angkanya berdetak tiap detik dan menghitung naik dari nol saat halaman dibuka. Garis di bawahnya menunjukkan perjalanan sejak 12 September dengan burung kecil di posisi hari ini. Tanggal target dan awal ada di `data-target` dan `data-start` pada `.countdown`, lengkap dengan zona +07:00, jadi pengunjung di zona waktu lain tetap melihat waktu WIB. Pada 19 Oktober kartu berganti menjadi "Hari penerjunan", lalu "Sudah di Pakem" sesudahnya; teksnya ada di atribut `data-today` dan `data-arrived`.
- Setiap foto jurnal bisa diklik atau diketuk untuk pratinjau besar. Fotonya membesar dari posisinya di kolase, lengkap dengan tanggal dan keterangan. Panah, tombol panah keyboard, dan swipe berpindah antar foto dalam bab yang sama. Tutup lewat tombol, Escape, atau klik area gelap; fokus kembali ke foto asal.
- Tombol ajakan dengan bunga berputar dan percikan bintang kecil; FAB ikon pause/play tanpa teks.
- Ikon SVG tidak bergantung pada font atau emoji iOS. Logo header, favicon PNG, dan Apple Touch Icon menggunakan logo gradasi terbaru dari tim (19 September 2026).
- Logo header membuka preview Filosofi Logo — Segera Hadir, dengan animasi logo, daun, orbit, dan bintang SVG. Mendukung jeda gerakan, reduced motion, keyboard, Escape, serta pengembalian fokus.
- Favicon bulat tersedia sebagai SVG dan PNG dengan sudut transparan.
- Petunjuk singkat “Ketuk logo, lihat filosofinya.” muncul setelah 2,5 detik idle bersama dua goyangan kecil pada logo, sekali per sesi tab, lalu hilang setelah 6 detik atau saat berinteraksi. Tidak muncul ketika dialog terbuka, tab disembunyikan, atau logo sudah diklik. Goyangan mengikuti tombol jeda dan prefers-reduced-motion.
- Tautan Instagram @tentremingpakem.
- Gambar pratinjau tautan `assets/og-image.jpg` (1200×630, JPEG) untuk WhatsApp dan media sosial. Isinya hero situs yang dirender ulang: latar, logo, dan judul resmi berdaun. Tulisan Segera Hadir sengaja tidak dimasukkan, jadi gambarnya tetap berlaku setelah situs resmi dibuka. Bila gambarnya diganti, naikkan juga nilai `?v=` pada `og:image` di index.html.
- Tidak menggunakan analytics, cookies, formulir atau layanan berbayar.

## Menambah bab jurnal

Semua perubahan ada di index.html. Sisipkan tiga blok berurutan, selalu sebelum halaman "Nanti, ya":

1. Tab di `.story-tabs`, misalnya `<button id="tab-5-oktober" role="tab" aria-selected="false" aria-controls="panel-5-oktober" tabindex="-1">`.
2. Panel di `.story-panels` dengan `data-next`, yaitu tulisan tombol menuju bab sesudahnya.
3. Foto di `.journal-view`: `figure.journal-spread` dengan `hidden`. Kelas `journal-collage-pair` untuk dua foto bertumpuk, `journal-collage` untuk tiga foto.

Penghitung halaman dan tulisan tombol berikutnya dihitung otomatis dari urutan itu. Foto di dalam `.journal-collage` otomatis bisa diperbesar, dan keterangan pratinjaunya diambil dari teks `alt` foto. Jangan lupa perbarui juga kalimat `journey-connection` dan `data-next` pada bab sebelumnya supaya ceritanya tetap nyambung.

## Sumber informasi Pakem

- https://slemankab.go.id/profil-kabupaten-sleman/geografi/karakteristik-wilayah/
- https://perindag.slemankab.go.id/pasar-pakem-pusat-tradisi-ekonomi-dan-wisata-lereng-merapi/

## Prompt aset — built-in Imagegen

Background: Cinematic natural editorial landscape inspired by rural Pakem, Yogyakarta, on southern slopes of Merapi; atmospheric illustration rather than documentary claim. Bottom 40 percent: wet green rice paddies, narrow winding earthen walking path from lower right into distance, distant volcanic silhouette slightly right of center in lower middle. Upper 60 percent: quiet luminous pale misty sage-ivory sky with thin subtle clouds and clean negative space for centered dark serif website title added later. A few out-of-focus dark leaves only at extreme upper corners, no intrusive canopy. Photographic organic realism, restrained film grading, atmospheric depth, dawn soft mist, subtle warm glow, muted olive greens. No text, logos, buildings, signs, people, UI, or borders.

Bird: One single distant swallow bird, dark olive silhouette, side view flying with wings raised, elegant natural flight pose, graceful slender wings and forked tail. Minimal readable silhouette, natural proportions, not emoji/cartoon. Genuinely transparent background with alpha, no landscape, sky, shadow, text, logos or border. Dark muted olive #344033.
