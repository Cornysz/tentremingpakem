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
- Kartu hitung mundur menuju penerjunan, Senin, 19 Oktober 2026. Angkanya berdetak tiap detik dan menghitung naik dari nol saat halaman dibuka. Mulai 19 Oktober kartu berganti sendiri menjadi hitungan hari operasional: "Hari ke-N dari 50" dengan bilah kemajuan dari 19 Oktober sampai 7 Desember dan sisa harinya (hari pertama bertuliskan "Hari penerjunan"). Sesudah 7 Desember kartu menulis bahwa KKN sudah selesai. Tanggal mulai ada di `data-target` dan hari terakhir di `data-end` pada `.countdown`, lengkap dengan zona +07:00, jadi pengunjung di zona waktu lain tetap melihat waktu WIB. Judul tiap keadaan ada di atribut `data-ops` dan `data-done`. Gambar Story di Kilas balik ikut menampilkan keadaan kartu ini.
- Setiap foto jurnal bisa diklik atau diketuk untuk pratinjau besar. Fotonya membesar dari posisinya di kolase, lengkap dengan tanggal dan keterangan. Panah, tombol panah keyboard, dan swipe berpindah antar foto dalam bab yang sama. Tutup lewat tombol, Escape, atau klik area gelap; fokus kembali ke foto asal.
- Tombol ajakan dengan bunga berputar dan percikan bintang kecil; FAB ikon pause/play tanpa teks.
- Ikon SVG tidak bergantung pada font atau emoji iOS. Logo header, favicon PNG, dan Apple Touch Icon menggunakan logo gradasi terbaru dari tim (19 September 2026).
- Logo header (dan tautan Filosofi logo di footer) membuka dialog Filosofi Logo. Logonya dipecah menjadi empat bentuk: matahari, gunung (Merapi beserta lerengnya), huruf P, dan daun. Mengetuk bentuk di logo atau label bernomor di sekelilingnya menyalakan bentuk itu, meredupkan yang lain, dan menampilkan maknanya. Matahari bersinar, Merapi dan lereng diberi label, huruf P diwarnai, dan daun bergoyang. Tombol sebelumnya dan berikutnya, tombol panah keyboard, serta ketukan di area kosong (kembali ke tampilan utuh) ikut bekerja. Setiap kali dibuka, logo menyusun diri: gunung naik, daun tumbuh, matahari terbit dari balik Merapi, lalu huruf P tergambar. Di ponsel, logo menempel di atas teks saat digulir. Mendukung jeda gerakan, reduced motion, Escape, dan pengembalian fokus.
- Favicon bulat tersedia sebagai SVG dan PNG dengan sudut transparan.
- Petunjuk singkat “Ketuk logo, lihat filosofinya.” muncul setelah 2,5 detik idle bersama dua goyangan kecil pada logo, sekali per sesi tab, lalu hilang setelah 6 detik atau saat berinteraksi. Tidak muncul ketika dialog terbuka, tab disembunyikan, atau logo sudah diklik. Goyangan mengikuti tombol jeda dan prefers-reduced-motion.
- Tautan Instagram @tentremingpakem.
- Gambar pratinjau tautan `assets/og-image.jpg` (1200×630, JPEG) untuk WhatsApp dan media sosial. Isinya hero situs yang dirender ulang: latar, logo, dan judul resmi berdaun. Tulisan Segera Hadir sengaja tidak dimasukkan, jadi gambarnya tetap berlaku setelah situs resmi dibuka. Bila gambarnya diganti, naikkan juga nilai `?v=` pada `og:image` di index.html.
- Ajakan "Jelajahi Pakem" di kaki hero: sehelai daun dari logo jatuh mengikuti jejak putus-putus, lalu mendarat di atas tulisan. Bila dalam enam detik pertama pengunjung belum menggulir, mengetuk, menekan tombol, atau menggerakkan kursor, bukit bergerak sekali sebagai ajakan. Di bawah hero tidak ada lagi lembar krem bersudut. Halaman disambung tiga lapis bukit (hutan, sawah bertingkat, kabut), dan bukit tetap terlihat sejak layar pertama. Saat digulir, kabut menebal di atas foto dan bukit belakang turun pelan. Di desktop, bukit ikut bergeser sedikit mengikuti kursor. Setelah hero lewat, muncul navigasi kecil (Pakem, Tema, Lokasi, Jurnal) yang menandai bagian yang sedang dibaca, dengan garis tipis penanda seberapa jauh halaman sudah digulir. Isi di bawah hero muncul perlahan saat terlihat. Setiap judul bagian diberi penanda bundar 01, 02, dan 03 yang terisi warna saat sampai. Tanpa JavaScript atau dengan gerakan dikurangi, semuanya langsung tampil dalam keadaan akhir.
- Bagian Mengenal Pakem (pertama sesudah hero) berlatar kabut lereng dengan garis kontur yang tergambar melingkar ke arah puncak. Isinya letak Pakem, arti nama Tentrem ing Pakem (ketuk tiap kata), dan tiga angka BPS yang menghitung naik: luas wilayah, jumlah kalurahan, dan penduduk. Bilah di bawah luas dan penduduk menunjukkan porsi Purwobinangun dan Candibinangun, dan di samping angka 5 ada peta mini kelima kalurahan. Arahkan kursor ke bagian bilah atau peta untuk menyorot kalurahan yang sama di semua tempat. Klik bagian itu, atau nama kalurahan di keterangan, untuk membukanya langsung di bagian Lokasi. Porsinya dihitung dari angka yang sudah tercantum di halaman dan tidak dituliskan sebagai persen.
- Bagian Tema berupa pita hutan hijau tua, dimasuki lewat siluet pepohonan. Tema resmi KKN tampil di kartu terang. Mengetuk salah satu dari empat frasa bergaris membuka maknanya di dalam kartu itu: kertasnya terbuka dari atas, makna berikutnya bergeser masuk menimpa yang lama, dan kertasnya terlipat saat ditutup (ESD, pangan lokal, berbasis riset, KWT Guyub Rukun), lengkap dengan tautan sumber. Tombol Lanjut berpindah ke makna berikutnya, dan makna terakhir mengantar ke klaster. Dari bawah kartu tumbuh batang hijau yang bercabang ke tiga kartu klaster: Medika, Saintek, dan Soshum, masing-masing dengan subtemanya. Jumlah daun kecil di tiap kartu sama dengan jumlah anggotanya. Tombol Lihat anggota membuka pratinjau anggota: lembar dari bawah di HP (seret turun untuk menutup, geser ke samping untuk pindah klaster), kartu kertas di layar lebar. Nama anggota tidak tampil di halaman utama. Di belakangnya, daun dari logo bergerak pelan saat digulir.
- Bagian Lokasi dibuka dengan sawah bertingkat dan berlatar hijau sage. Isinya peta SVG Kapanewon Pakem dengan lima kalurahan. Candibinangun dan Purwobinangun bisa dipilih lewat peta, penanda, atau tab, dan panelnya berisi luas, padukuhan, penduduk, ketinggian, potensi, serta sumbernya. Kartu peta punya dua tampilan di tempat yang sama, Skematis dan Peta Google, supaya bagian ini tetap pendek. Di HP, keterangan peta ada di samping peta, bukan di bawahnya. Peta Google (satelit atau peta biasa) baru dimuat setelah tombol ditekan, jadi halaman tidak memasang cookie pihak ketiga sebelum pengunjung memilih. Saat kalurahan dipilih, penandanya di peta jatuh sebentar.
- Bagian Perjalanan kami (04) ada sesudah Lokasi. Foto tiap bab jurnal berjajar ke samping dan digeser dengan jari (di laptop ada tombol panah), dengan garis rute dan burung kecil di bawahnya yang mengikuti foto di tengah. Mengetuk foto membuka jurnal di bab itu. Isinya diambil otomatis dari jurnal (foto pertama, tanggal, dan judul tiap bab), jadi bab baru langsung ikut tampil.
- Bagian Sponsor dan mitra (05) ada di antara Perjalanan kami dan footer, berupa panel malam kecil. Judulnya bergulir seperti teks penutup film: "Disponsori oleh", "Didukung oleh", lalu berhenti di "Bermitra". Seekor kunang-kunang menuliskan "dengan:" dengan cahaya, lalu terbang membawa cahayanya ke logo pertama. Sponsor utama dimahkotai: kunang-kunang datang dari segala arah, cahaya berlari dua kali mengelilingi kartunya. Kartu lalu tenang sebagai kaca tipis bergaris emas dengan logo putih. Logo tampil dengan warna aslinya saat kartunya berada di tengah layar, saat kursor diarahkan, atau setelah diketuk. Sponsor lain menyusul satu per satu dengan aura keemasan. Besar logo disamakan otomatis menurut bentuknya. Bagian ini tersembunyi selama belum ada sponsor. Animasinya diputar sekali, ikut tombol jeda, dan langsung tampil utuh bila perangkat meminta gerakan dikurangi.
- Footer dibuka dengan "Senja di Pakem", pemandangan kecil yang bisa dimainkan. Geser ke samping (atau seret dengan mouse) untuk memindahkan matahari, dan langit berubah dari pagi sampai malam. Di siang hari, mengetuk langit juga memindahkan matahari. Di HP arah busurnya dibalik, jadi matahari terbit di atas Merapi dan terbenam di sisi kanan. Di keyboard, matahari adalah slider waktu: panah kanan atau atas untuk lebih sore, Home untuk pagi, End untuk malam. Bila belum disentuh, matahari terbenam sendiri saat pemandangan naik ke tengah layar. Malam membawa bintang, lampu desa di lereng Merapi, dan enam kunang-kunang. Setiap kunang-kunang yang diketuk terbang menjadi bintang, dan keenamnya membentuk rasi setangkai daun seperti di tipografi. Setelah bintang keenam, seluruh layar meredup seperti menemukan rahasia: rasinya terangkat ke tengah layar dan menunggu satu ketukan lagi. Bintang-bintang lalu menapak ke ujung daun, daunnya tumbuh, dan setangkai daun itu terbang ke samping kata Tentrem sementara sebuah bintang menuliskan Tentrem ing Pakem besar-besar. Di bawahnya hanya ada tombol "Kilas balik". Mengetuk area gelap di luar tulisan (atau menekan Escape, atau tombol kembali di Android) menutupnya: tulisan mengecil dan mendarat di pemandangan senja. Ketukan pada detik pertama setelah tulisan jadi diabaikan, supaya ketukan susulan tidak langsung menutupnya. Usap langit untuk angin, ketuk kata untuk artinya. Tombol "Kilas balik" membuka enam kartu tentang malammu, ditutup kartu pos yang bisa dibagikan. Tombol "Bagikan ke Story" membuat gambar 1080×1920 (rasi pengunjung, Tentrem ing Pakem, hitung mundur yang dibaca langsung dari kartu hitung mundur di hero, lalu "KKN PPM UGM PAKEM 2026" dan "Shared from tentremingpakem.com") dan membuka menu bagikan HP; pilih Instagram lalu Story. Situs web tidak bisa membuka editor Story Instagram secara langsung, jadi di browser yang tidak mendukung (desktop atau browser bawaan Instagram) gambarnya tampil dengan petunjuk untuk menyimpannya. SLOTS, TIPS, dan urutan animasinya ada di script.js. Geser vertikal tetap menggulir halaman. Di bawahnya ada lokasi, tautan bagian, jurnal, Filosofi logo, Instagram, dan kembali ke atas.
- Tidak menggunakan analytics, formulir atau layanan berbayar. Cookie pihak ketiga hanya muncul bila pengunjung sendiri memuat peta Google.

## Isi bagian Pakem, Tema, dan Lokasi

Semua teks ada di index.html, di dalam `section#pakem`, `section#tema`, dan `section#lokasi`. Setiap fakta di sana berasal dari sumber resmi yang ditautkan di bawah kartunya (BPS Sleman, situs resmi kalurahan, UNESCO, UGM, Sekolah Vokasi UGM, dan UU Pangan), dicek pada 6 Oktober 2026. Saat memperbarui angka, ganti juga tahun datanya.

- Angka statistik memakai `data-count`; isi angka asli di atribut itu (titik sebagai pemisah desimal) dan di dalam elemennya.
- Angka Purwobinangun dan Candibinangun juga muncul di bagian Pakem: lebar bilah (`--a` dan `--b` pada `.stat-bar`, yaitu angka kalurahan dibagi total Pakem), teks `data-tip`, dan kalimat `.sr-only` di sebelahnya. Bila angka di panel Lokasi berubah, ubah ketiganya juga. Peta mini di samping angka 5 disalin otomatis oleh script.js dari peta Lokasi, jadi tanpa JavaScript peta mini itu tidak tampil.
- Teks pada peta Google diambil dari `data-query` dan `data-zoom` di tiap `article.place`.
- Bentuk peta berasal dari batas wilayah OpenStreetMap (ODbL), digambar ulang secara skematis. Bentuk itu bukan batas resmi, jadi luas resmi tetap mengikuti angka BPS.

## Isi klaster dan anggota

Subtema dan jumlah anggota ada di `li.cluster` (bagian Tema) dan di panel `dialog#klaster-anggota`. Satu anggota adalah satu `li.member`. Inisial di lingkaran dihitung otomatis dari nama. Bila jumlah anggota berubah, ubah juga jumlah `<i>` dan `--n` pada `.frond`, angka di `.cluster-meta`, angka di tab dialog (`.members-tab-count` dan teks sr-only), serta angka 22 di `.grove-label` dan `.members-note`. Kartu Kilas balik di footer menghitung jumlah anggota sendiri dari dialog itu. Urutan di tiap klaster: Kormater dulu (`is-lead`), lalu Kormanit, Kormasit, Sekretaris, Bendahara, Koordinator Divisi, lalu anggota lain menurut abjad. Nama, prodi, dan peran diambil dari sheet Data Anggota; NIU dan data pribadi lain sengaja tidak dimuat.

## Hiasan lanskap

Bukit di bawah hero, tepi hutan, sawah bertingkat, pemandangan senja di footer, dan kontur Pakem semuanya SVG inline di index.html. Warna langit dan bukit senja dihitung script.js dari daftar warna per waktu (`STOPS`), dan posisi rasi daun ada di `SLOTS` serta path `.senja-lines`. Bentuknya dihitung sekali dengan skrip, lalu ditempel sebagai path statis. Tidak ada gambar baru maupun pustaka tambahan. Bukit hero, kontur, dan daun Tema mengikuti guliran lewat CSS scroll-driven animation. Di browser yang belum mendukungnya, tampilannya tetap utuh tanpa gerak. Matahari senja mengikuti guliran lewat script.js, hanya saat pemandangannya terlihat, dan diam bila gerakan dijeda atau dikurangi.

## Isi Filosofi Logo

Teks makna ada di index.html, di dalam `dialog#logo-philosophy`: satu `article.makna` untuk tampilan utuh dan satu untuk tiap bentuk (`data-part` matahari, gunung, huruf-p, daun). Label di sekeliling logo dan titik penunjuknya memakai `data-part` yang sama. Tombol sebelumnya dan berikutnya mengambil nama bagian dari teks label itu, jadi cukup ganti labelnya. Tulisan "Mulai dari ..." dan "Lihat utuh" ada di script.js, sedangkan tanda kecil Merapi, Lereng, dan P adalah `.anatomy-tag` dengan `data-for`.

Bentuk logo di dialog adalah SVG hasil penelusuran logo asli dari tim (PNG 1254 px, 7 Oktober 2026). Gradasi warnanya diukur dari file itu, dan hasilnya dicek berimpit dengan aslinya: selisih rata-rata 2 dari 255 per piksel, hanya di tepi. Bila logo resmi berubah, telusuri ulang; jangan menggambar bentuknya dengan tangan. Logo kecil di header tetap memakai `logo.png`.

## Menambah sponsor

Bagian Sponsor ada di index.html, di dalam `section#sponsor`, tepat sesudah bagian Lokasi. Selama belum ada sponsor, bagian ini tidak tampil sama sekali, begitu juga penanda 04 dan tautan "Sponsor dan mitra" di footer. Begitu sponsor pertama ditambahkan, semuanya muncul sendiri bersama animasinya. Tidak ada saklar yang perlu diubah.

Sponsor yang sudah terpasang: Hassa Batik dan PT Sandang Andalan Indonesia (keduanya Sponsor utama, logo saja tanpa nama di bawahnya). Di bawah logo ada ajakan "Ingin bermitra? Kirim proposal ke kkn@tentremingpakem.com" (`p.sponsor-cta`); tombolnya membuka email dengan subjek yang sudah terisi. Jangan pernah memasang logo contoh atau sponsor yang belum pasti di index.html. Push ke main langsung tayang.

1. Siapkan logo.
   - Simpan di folder `assets/sponsor/`. Buat foldernya saat menambah logo pertama. Nama berkas huruf kecil dengan tanda hubung, misalnya `assets/sponsor/nama-sponsor.svg`.
   - Paling bagus SVG. Kalau tidak ada, PNG atau WebP selebar sekitar 600 px.
   - Latar transparan atau putih sama-sama boleh. Ruang kosong di sekeliling logo tidak perlu dipotong.
   - Logo putih di latar transparan otomatis dipasang di kartu gelap.
   - Pakai berkas logo resmi dari sponsor. Jangan menggambar ulang, mengubah warna, atau menautkan gambar dari situs lain.
2. Pilih kelompok. Di dalam `section#sponsor` ada tiga kelompok: `utama` (Sponsor utama), `pendukung` (Sponsor pendukung), dan `mitra` (Mitra media). Masing-masing punya satu `<ul class="sponsor-list">`. Bila sponsor tidak perlu dikelompokkan, masukkan semuanya ke `pendukung`. Kelompok yang kosong tidak tampil. Judul kelompok tampil bila dua kelompok atau lebih terisi, atau bila yang terisi hanya Sponsor utama. Kartu Sponsor utama mendapat bingkai emas dan sambutan kunang-kunang yang lebih ramai.
3. Salin blok ini ke dalam `<ul>` kelompoknya. Satu blok untuk satu sponsor.

   Sponsor yang punya situs:

       <li class="sponsor">
         <a class="sponsor-card" href="https://alamat-situs-sponsor" target="_blank" rel="noopener noreferrer">
           <img src="assets/sponsor/nama-berkas.svg" alt="" loading="lazy" decoding="async">
           <span class="sponsor-name">Nama Sponsor</span>
         </a>
       </li>

   Sponsor tanpa situs:

       <li class="sponsor">
         <div class="sponsor-card">
           <img src="assets/sponsor/nama-berkas.png" alt="" loading="lazy" decoding="async">
           <span class="sponsor-name">Nama Sponsor</span>
         </div>
       </li>

4. Ganti tiga hal: alamat di `href` (lengkap dengan `https://`), nama berkas di `src`, dan nama resmi sponsor di `sponsor-name`, persis seperti yang disetujui sponsor. Nama itu tampil di bawah logo dan dibacakan pembaca layar, jadi `alt` sengaja dikosongkan.
5. Urutan di HTML adalah urutan tampil dan urutan kunang-kunang mendarat. Taruh sponsor terbesar paling atas.
6. Ukuran logo, jumlah kolom, dan animasi menyesuaikan sendiri dari 1 sampai sekitar 24 sponsor. Tidak ada angka yang perlu diisi.

Pilihan tambahan
- Bila tautannya bukan situs resmi (misalnya LinkedIn, seperti kartu Hassa Batik), pakai kartu tanpa tautan (`<div class="sponsor-card">`) dan taruh tautannya sebagai ikon kecil di dalam kartu: `<a class="sponsor-via" href="..." target="_blank" rel="noopener noreferrer" aria-label="Nama Sponsor di LinkedIn, membuka tab baru">` berisi ikonnya (contohnya di kartu Hassa Batik). Ikon tampil di pojok kanan atas; mengetuk kartunya hanya menampilkan warna asli logo.
- Logo PT Sandang Andalan Indonesia aslinya memakai teks dengan font Plus Jakarta Sans. Di `assets/sponsor/` teksnya sudah diubah jadi garis (outline), supaya tampil sama di semua HP tanpa memuat font.
- Logo terlalu pucat di kartu krem, atau logo putih yang tidak terdeteksi: `<li class="sponsor" data-latar="gelap">`. Sebaliknya, `data-latar="terang"` memaksa kartu krem.
- Menyembunyikan nama di bawah logo (misalnya bila logonya sudah memuat nama): tambahkan `data-nama="sembunyi"` pada `<li class="sponsor">` untuk satu sponsor (seperti Hassa Batik), atau pada `<section id="sponsor" ...>` untuk semuanya. Nama tetap dibacakan pembaca layar, dan logonya membesar mengisi tempat nama.
- Bila berkas logo gagal dimuat, kartunya menampilkan nama sponsor dengan huruf miring. Cek lagi nama berkas dan foldernya. Konsol browser juga menulis "Logo sponsor tidak bisa dimuat".
- Logo yang sangat lebar (lebih dari 5 kali tingginya) jadi kecil bila sponsor lebih dari 8. Minta versi logo yang lebih ringkas atau bertumpuk.
- Kalimat judul ada di `h2#sponsor-title`. Tiga kalimat yang bergulir ada di `.sponsor-slot` (Disponsori oleh, Didukung oleh, Bermitra); yang terakhir (kelas `is-final`) yang tetap tampil. Setiap kalimat paling panjang 15 huruf supaya muat di HP kecil. Baris kedua ada di `.sponsor-wipe`. Jangan menaruh tautan di dalam judul.

Sebelum push
- Pastikan setiap logo, nama, dan tautan sudah disetujui sponsornya.
- Buka di HP (lebar 360 sampai 430 px) dan di laptop. Pastikan semua logo terbaca dan tautan membuka situs yang benar. Kirim tangkapan layar dulu.
- Menambah sponsor saja tidak perlu mengubah `?v=`. Naikkan `?v=` pada style.css dan script.js hanya bila kode bagian ini berubah.

## Menambah bab jurnal

Semua perubahan ada di index.html. Sisipkan tiga blok berurutan, selalu sebelum halaman "Nanti, ya":

1. Tab di `.story-tabs`, misalnya `<button id="tab-5-oktober" role="tab" aria-selected="false" aria-controls="panel-5-oktober" tabindex="-1"><span class="tab-day">5</span> <span class="tab-month">Okt</span></button>`. Tanggal tampil besar dan bulan kecil di bawahnya.
2. Panel di `.story-panels` dengan `data-next`, yaitu tulisan tombol menuju bab sesudahnya.
3. Foto di `.journal-view`: `figure.journal-spread` dengan `hidden`. Kelas `journal-collage-pair` untuk dua foto bertumpuk, `journal-collage` untuk tiga foto.

Penghitung halaman dan tulisan tombol berikutnya dihitung otomatis dari urutan itu. Kartu bab di bagian Perjalanan kami juga muncul sendiri, dari foto pertama, tanggal, dan judul foto bab itu. Foto di dalam `.journal-collage` otomatis bisa diperbesar, dan keterangan pratinjaunya diambil dari teks `alt` foto. Jangan lupa perbarui juga kalimat `journey-connection` dan `data-next` pada bab sebelumnya supaya ceritanya tetap nyambung.

## Sumber informasi Pakem

- https://slemankab.go.id/profil-kabupaten-sleman/geografi/karakteristik-wilayah/
- https://perindag.slemankab.go.id/pasar-pakem-pusat-tradisi-ekonomi-dan-wisata-lereng-merapi/

## Prompt aset — built-in Imagegen

Background: Cinematic natural editorial landscape inspired by rural Pakem, Yogyakarta, on southern slopes of Merapi; atmospheric illustration rather than documentary claim. Bottom 40 percent: wet green rice paddies, narrow winding earthen walking path from lower right into distance, distant volcanic silhouette slightly right of center in lower middle. Upper 60 percent: quiet luminous pale misty sage-ivory sky with thin subtle clouds and clean negative space for centered dark serif website title added later. A few out-of-focus dark leaves only at extreme upper corners, no intrusive canopy. Photographic organic realism, restrained film grading, atmospheric depth, dawn soft mist, subtle warm glow, muted olive greens. No text, logos, buildings, signs, people, UI, or borders.

Bird: One single distant swallow bird, dark olive silhouette, side view flying with wings raised, elegant natural flight pose, graceful slender wings and forked tail. Minimal readable silhouette, natural proportions, not emoji/cartoon. Genuinely transparent background with alpha, no landscape, sky, shadow, text, logos or border. Dark muted olive #344033.
