/**
 * Mock data untuk aplikasi SAPA UMAT
 * Data statis untuk demonstrasi UI tanpa backend
 */

import type {
    InfoGereja,
    JadwalMisa,
    Keluarga,
    Lingkungan,
    Pengumuman,
    QuickAction,
    Wilayah,
} from './types';

// ==================== QUICK ACTIONS ====================

export const quickActions: QuickAction[] = [
    {
        id: '1',
        title: 'Misa Hari Ini',
        icon: 'calendar',
        route: '/jadwal',
        color: '#800020',
    },
    {
        id: '2',
        title: 'Info Gereja',
        icon: 'info.circle.fill',
        route: '/info-gereja',
        color: '#C5922E',
    },
    {
        id: '3',
        title: 'Pengumuman',
        icon: 'megaphone.fill',
        route: '/pengumuman',
        color: '#2E7D32',
    },
    {
        id: '4',
        title: 'Data Umat',
        icon: 'person.3.fill',
        route: '/data-umat',
        color: '#1565C0',
    },
];

// ==================== JADWAL MISA ====================

export const jadwalMisa: JadwalMisa[] = [
    // Minggu
    {
        id: 'misa-1',
        jenisIbadah: 'Misa',
        kategori: 'Mingguan',
        judul: 'Misa Minggu Pagi I',
        hari: 'Minggu',
        waktu: '06:00',
        bahasa: 'Indonesia',
        lokasi: 'Gereja Utama',
        celebran: 'Rm. Siprianus Wagung, SVD',
        deskripsi: 'Misa Kudus Minggu dengan paduan suara paroki',
        isAktif: true,
    },
    {
        id: 'misa-2',
        jenisIbadah: 'Misa',
        kategori: 'Mingguan',
        judul: 'Misa Minggu Pagi II',
        hari: 'Minggu',
        waktu: '08:00',
        bahasa: 'Indonesia',
        lokasi: 'Gereja Utama',
        celebran: 'Rm. Siprianus Wagung, SVD',
        deskripsi: 'Misa Kudus Minggu untuk keluarga',
        isAktif: true,
    },
    {
        id: 'misa-3',
        jenisIbadah: 'Misa',
        kategori: 'Mingguan',
        judul: 'Misa Minggu Siang',
        hari: 'Minggu',
        waktu: '17:00',
        bahasa: 'Indonesia',
        lokasi: 'Gereja Utama',
        celebran: 'Rm. Siprianus Wagung, SVD',
        deskripsi: 'Misa Kudus Minggu sore',
        isAktif: true,
    },
    // Sabtu Malam
    {
        id: 'misa-4',
        jenisIbadah: 'Misa',
        kategori: 'Mingguan',
        judul: 'Misa Sabtu Malam (Ibadat Minggu)',
        hari: 'Sabtu',
        waktu: '18:00',
        bahasa: 'Indonesia',
        lokasi: 'Gereja Utama',
        celebran: 'Rm. Siprianus Wagung, SVD',
        deskripsi: 'Ibadat Malam Minggu',
        isAktif: true,
    },
    // Hari Biasa
    {
        id: 'misa-5',
        jenisIbadah: 'Misa',
        kategori: 'Mingguan',
        judul: 'Misa Harian',
        hari: 'Senin',
        waktu: '05:30',
        bahasa: 'Indonesia',
        lokasi: 'Gereja Utama',
        isAktif: true,
    },
    {
        id: 'misa-6',
        jenisIbadah: 'Misa',
        kategori: 'Mingguan',
        judul: 'Misa Harian',
        hari: 'Selasa',
        waktu: '05:30',
        bahasa: 'Indonesia',
        lokasi: 'Gereja Utama',
        isAktif: true,
    },
    {
        id: 'misa-7',
        jenisIbadah: 'Misa',
        kategori: 'Mingguan',
        judul: 'Misa Harian',
        hari: 'Rabu',
        waktu: '05:30',
        bahasa: 'Indonesia',
        lokasi: 'Gereja Utama',
        isAktif: true,
    },
    {
        id: 'misa-8',
        jenisIbadah: 'Misa',
        kategori: 'Mingguan',
        judul: 'Misa Harian',
        hari: 'Kamis',
        waktu: '05:30',
        bahasa: 'Indonesia',
        lokasi: 'Gereja Utama',
        isAktif: true,
    },
    {
        id: 'misa-9',
        jenisIbadah: 'Misa',
        kategori: 'Mingguan',
        judul: 'Misa Harian',
        hari: 'Jumat',
        waktu: '05:30',
        bahasa: 'Indonesia',
        lokasi: 'Gereja Utama',
        isAktif: true,
    },
    // Adorasi
    {
        id: 'adorasi-1',
        jenisIbadah: 'Adorasi',
        kategori: 'Mingguan',
        judul: 'Adorasi Ekaristi',
        hari: 'Kamis',
        waktu: '19:00',
        lokasi: 'Gereja Utama',
        deskripsi: 'Adorasi Sakramen Mahakudus setiap Kamis malam',
        catatan: 'Diakhiri dengan Benediksi',
        isAktif: true,
    },
    {
        id: 'adorasi-2',
        jenisIbadah: 'Adorasi',
        kategori: 'Mingguan',
        judul: 'Adorasi Jumat Agung',
        hari: 'Jumat',
        waktu: '15:00',
        lokasi: 'Gereja Utama',
        deskripsi: 'Adorasi khusus Jumat pertama setiap bulan',
        isAktif: true,
    },
    // Ibadat Khusus
    {
        id: 'ibadat-1',
        jenisIbadah: 'Ibadat',
        kategori: 'Mingguan',
        judul: 'Rosario Bersama',
        hari: 'Senin',
        waktu: '18:30',
        lokasi: 'Gereja Utama',
        deskripsi: 'Doa Rosario bersama umat',
        isAktif: true,
    },
    {
        id: 'ibadat-2',
        jenisIbadah: 'Ibadat',
        kategori: 'Mingguan',
        judul: 'Novena St. Arnoldus Janssen',
        hari: 'Rabu',
        waktu: '18:30',
        lokasi: 'Gereja Utama',
        deskripsi: 'Novena kepada pelindung paroki',
        isAktif: true,
    },
    // Jadwal Khusus
    {
        id: 'khusus-1',
        jenisIbadah: 'Sakramen',
        kategori: 'Khusus',
        judul: 'Pembaptisan Bayi & Anak',
        tanggal: '2026-02-15',
        waktu: '10:00',
        lokasi: 'Gereja Utama',
        catatan: 'Pendaftaran 2 minggu sebelumnya di sekretariat',
        celebran: 'Rm. Siprianus Wagung, SVD',
        isAktif: true,
    },
    {
        id: 'khusus-2',
        jenisIbadah: 'Kegiatan',
        kategori: 'Khusus',
        judul: 'Rekoleksi Masa Prapaskah',
        tanggal: '2026-03-08',
        waktu: '08:00-15:00',
        lokasi: 'Aula Paroki',
        deskripsi: 'Rekoleksi untuk mempersiapkan diri menyambut Paskah',
        catatan: 'Wajib mendaftar, kuota 200 orang',
        isAktif: true,
    },
];

// ==================== PENGUMUMAN ====================

export const pengumuman: Pengumuman[] = [
    {
        id: 'ann-1',
        judul: 'Pendaftaran Krisma 2026',
        kategori: 'Sakramen',
        prioritas: 'Tinggi',
        tanggalPublikasi: '2026-02-01',
        tanggalBerakhir: '2026-02-28',
        ringkasan: 'Pendaftaran Sakramen Krisma 2026 dibuka untuk usia 17 tahun ke atas.',
        kontenLengkap: `**Pendaftaran Sakramen Krisma 2026**

Paroki Santo Arnoldus Janssen Bekasi membuka pendaftaran Sakramen Krisma 2026 untuk:
- Usia minimal 17 tahun
- Sudah menerima Sakramen Baptis dan Komuni Pertama
- Aktif dalam kegiatan menggereja

**Berkas yang harus disiapkan:**
1. Fotokopi Surat Baptis
2. Fotokopi Surat Komuni Pertama
3. Fotokopi KTP
4. Pas foto 3x4 (2 lembar)
5. Surat rekomendasi dari Ketua Lingkungan

**Jadwal:**
- Pendaftaran: 1-28 Februari 2026
- Katekese: Setiap Sabtu pukul 15:00-17:00 (Maret-Mei 2026)
- Perayaan Krisma: 7 Juni 2026

Informasi lebih lanjut hubungi sekretariat paroki.`,
        isPinned: true,
        author: 'Sekretariat Paroki',
    },
    {
        id: 'ann-2',
        judul: 'Bakti Sosial Ash Wednesday',
        kategori: 'Sosial',
        prioritas: 'Tinggi',
        tanggalPublikasi: '2026-02-05',
        ringkasan: 'Aksi bakti sosial kepada warga kurang mampu dalam rangka Rabu Abu.',
        kontenLengkap: `**Bakti Sosial Rabu Abu**

Dalam semangat tobat dan nawacita Prapaskah, Paroki SAJ Bekasi mengadakan aksi bakti sosial:

**Waktu:** Rabu, 11 Februari 2026 (Rabu Abu)
**Kegiatan:**
- Pembagian sembako kepada 100 keluarga prasejahtera
- Pengobatan gratis
- Cukur rambut gratis

**Donasi yang dibutuhkan:**
- Beras, minyak goreng, gula, telur
- Sembako lainnya
- Donasi uang

Donasi dapat dititipkan di sekretariat atau melalui rekening paroki.

Mari kita wujudkan cinta kasih kepada sesama!`,
        isPinned: true,
        author: 'Komisi Sosial',
    },
    {
        id: 'ann-3',
        judul: 'Perubahan Jadwal Misa Minggu 16 Februari',
        kategori: 'Liturgi',
        prioritas: 'Tinggi',
        tanggalPublikasi: '2026-02-08',
        tanggalBerakhir: '2026-02-16',
        ringkasan: 'Misa pukul 08:00 ditiadakan, diganti dengan Misa tambahan pukul 09:30.',
        kontenLengkap: `**Perubahan Jadwal Misa Minggu 16 Februari 2026**

Sehubungan dengan renovasi sound system gereja, jadwal Misa Minggu 16 Februari 2026 mengalami perubahan:

**Jadwal Baru:**
- 06:00 - Misa Pagi I (tetap)
- ~~08:00~~ - DITIADAKAN
- 09:30 - Misa Tambahan (BARU)
- 17:00 - Misa Sore (tetap)

Mohon untuk menyebarkan informasi ini kepada umat lainnya.

Terima kasih atas pengertiannya.`,
        isPinned: false,
        author: 'Dewan Pastoral Paroki',
    },
    {
        id: 'ann-4',
        judul: 'Retret Kaum Muda - "Called to Rise"',
        kategori: 'Kegiatan',
        prioritas: 'Sedang',
        tanggalPublikasi: '2026-02-07',
        ringkasan: 'Retret 2 hari untuk OMK usia 18-35 tahun dengan tema "Called to Rise".',
        kontenLengkap: `**Retret Kaum Muda: "Called to Rise"**

Orang Muda Katolik (OMK) Paroki SAJ Bekasi mengadakan retret 2 hari:

**Tema:** "Called to Rise - Bangkit Bersama Kristus"
**Tanggal:** 22-23 Februari 2026
**Tempat:** Wisma Karmel, Sentul
**Peserta:** Usia 18-35 tahun
**Biaya:** Rp 350.000 (sudah termasuk akomodasi, makan, materi)
**Kuota:** 50 orang

**Pendaftaran:**
- Melalui link: bit.ly/RetretOMKSAJ2026
- Atau hubungi: Maria (0812-xxxx-xxxx)
- Batas pendaftaran: 18 Februari 2026

Jangan lewatkan kesempatan untuk memperdalam iman dan membangun komunitas!`,
        isPinned: false,
        author: 'OMK Paroki',
    },
    {
        id: 'ann-5',
        judul: 'Syukuran HUT Paroki ke-35',
        kategori: 'Kegiatan',
        prioritas: 'Sedang',
        tanggalPublikasi: '2026-01-20',
        ringkasan: 'Rangkaian acara syukuran HUT ke-35 Paroki Santo Arnoldus Janssen Bekasi.',
        kontenLengkap: `**HUT Paroki ke-35**

Paroki Santo Arnoldus Janssen Bekasi merayakan HUT ke-35 dengan rangkaian acara:

**15 Januari 2026:**
- Misa Syukur pukul 08:00 (Dipimpin Bapak Uskup)
- Pentas seni & lomba setelah Misa
- Makan siang bersama

**Selama Januari 2026:**
- Lomba paduan suara antar wilayah
- Lomba futsal antar lingkungan
- Bakti sosial keliling

Mari kita syukuri kehadiran paroki kita dan terus membangun komunitas iman!`,
        isPinned: false,
        author: 'Panitia HUT Paroki',
    },
];

// ==================== WILAYAH & LINGKUNGAN ====================

export const wilayah: Wilayah[] = [
    {
        id: 'w1',
        nama: 'Wilayah Santo Petrus',
        ketua: 'Bapak Andreas Wijaya',
        lingkungan: ['l1', 'l2', 'l3'],
    },
    {
        id: 'w2',
        nama: 'Wilayah Santo Paulus',
        ketua: 'Ibu Maria Kusuma',
        lingkungan: ['l4', 'l5', 'l6'],
    },
    {
        id: 'w3',
        nama: 'Wilayah Santo Yohanes',
        ketua: 'Bapak Yohanes Budiman',
        lingkungan: ['l7', 'l8'],
    },
];

export const lingkungan: Lingkungan[] = [
    { id: 'l1', nama: 'Santa Maria', ketua: 'Bapak Thomas', wilayah: 'w1', jumlahKeluarga: 45 },
    { id: 'l2', nama: 'Santo Yoseph', ketua: 'Ibu Theresia', wilayah: 'w1', jumlahKeluarga: 52 },
    { id: 'l3', nama: 'Santo Fransiskus', ketua: 'Bapak Anton', wilayah: 'w1', jumlahKeluarga: 38 },
    { id: 'l4', nama: 'Santo Ignatius', ketua: 'Ibu Agnes', wilayah: 'w2', jumlahKeluarga: 41 },
    { id: 'l5', nama: 'Santa Clara', ketua: 'Bapak Gabriel', wilayah: 'w2', jumlahKeluarga: 47 },
    { id: 'l6', nama: 'Santa Katarina', ketua: 'Ibu Cecilia', wilayah: 'w2', jumlahKeluarga: 50 },
    { id: 'l7', nama: 'Santo Thomas Aquinas', ketua: 'Bapak Lukas', wilayah: 'w3', jumlahKeluarga: 35 },
    { id: 'l8', nama: 'Santo Dominikus', ketua: 'Ibu Rosa', wilayah: 'w3', jumlahKeluarga: 42 },
];

// ==================== INFO GEREJA ====================

export const infoGereja: InfoGereja = {
    namaParoki: 'Paroki Santo Arnoldus Janssen',
    namaPelindung: 'Santo Arnoldus Janssen (Pendiri SVD)',
    alamatLengkap: 'Jl. Insinyur H. Juanda No.164, RT.002/RW.009, Margahayu, Kec. Bekasi Tim., Kota Bks, Jawa Barat 17113',
    telepon: '(021) 8801763',
    email: 'sekretariat@parokisajbekasi.or.id',
    website: 'https://parokisajbekasi.or.id',
    keuskupanAgung: 'Jakarta',
    uskupAgung: 'Ignatius Kardinal Suharyo',
    tahunRenovasi: '25 September 2011',
    pastor: [
        {
            nama: 'Rm. Siprianus Wagung, SVD',
            jabatan: 'Pastor Paroki',
        },
    ],
    sejarahSingkat: `Paroki Santo Arnoldus Janssen Bekasi didirikan pada tanggal 15 Januari 1991. \n Paroki ini merupakan bagian dari Keuskupan Agung Jakarta. \nDipercayakan kepada Serikat Sabda Allah (SVD), paroki ini melayani umat Katolik di wilayah Bekasi Timur dengan semangat "Berbagi Sabda Allah" sesuai dengan karism SVD. Gedung gereja direnovasi dan selesai pada 25 September 2011.`,
    koordinatMap: {
        latitude: -6.2381,
        longitude: 106.9996,
    },
    jamOperasionalSekretariat: [
        { hari: 'Senin - Sabtu', jam: '08.00 - 15.00 WIB' },
        { hari: 'Minggu', jam: '07.00 - 12.00 WIB' },
    ],
    galeri: [], // akan diisi dengan hasil generate_image nantinya
};

// ==================== DATA KELUARGA (SAMPLE) ====================

export const dataKeluarga: Keluarga[] = [
    {
        id: 'kel-001',
        noKartuKeluargaKatolik: 'SAJ-BKS-001-2020',
        namaKepalaKeluarga: 'Andreas Wijaya',
        alamat: {
            jalan: 'Jl. Flamboyan No. 15',
            rt: '003',
            rw: '007',
            kelurahan: 'Aren Jaya',
            kecamatan: 'Bekasi Timur',
            kota: 'Bekasi',
            kodePos: '17111',
        },
        lingkungan: 'Santa Maria',
        wilayah: 'Wilayah Santo Petrus',
        paroki: 'Paroki Santo Arnoldus Janssen',
        statusTempatTinggal: 'Milik Sendiri',
        nomorTelepon: '0812-3456-7890',
        anggotaKeluarga: [
            {
                id: 'angg-001-1',
                namaLengkap: 'Andreas Wijaya',
                namaPanggilan: 'Andreas',
                namaBaptis: 'Andreas',
                tempatLahir: 'Jakarta',
                tanggalLahir: '1985-05-12',
                jenisKelamin: 'L',
                hubunganDalamKeluarga: 'KK',
                statusPernikahan: 'Katolik',
                golonganDarah: 'A',
                pendidikanTerakhir: 'S1 Teknik Informatika',
                pekerjaan: 'Karyawan Swasta',
                sakramen: {
                    baptis: {
                        tanggal: '1985-07-15',
                        gereja: 'Paroki Katedral Jakarta',
                        nomorSurat: 'B-123/1985',
                    },
                    komuniPertama: {
                        tanggal: '1993-05-20',
                        gereja: 'Paroki Katedral Jakarta',
                    },
                    krisma: {
                        tanggal: '2000-06-10',
                        gereja: 'Paroki Katedral Jakarta',
                    },
                    pernikahan: {
                        tanggal: '2010-11-20',
                        gereja: 'Paroki Santo Yakobus, Jakarta',
                        bukuNomor: 'N-45/2010',
                    },
                },
                statusKeanggotaan: 'Aktif',
                nomorTelepon: '0812-3456-7890',
                email: 'andreas.w@email.com',
            },
            {
                id: 'angg-001-2',
                namaLengkap: 'Maria Theresia Kusuma',
                namaPanggilan: 'Maria',
                namaBaptis: 'Maria Theresia',
                tempatLahir: 'Bandung',
                tanggalLahir: '1988-08-25',
                jenisKelamin: 'P',
                hubunganDalamKeluarga: 'Istri',
                statusPernikahan: 'Katolik',
                golonganDarah: 'B',
                pendidikanTerakhir: 'S1 Ekonomi',
                pekerjaan: 'Guru',
                sakramen: {
                    baptis: {
                        tanggal: '1988-10-10',
                        gereja: 'Paroki Santo Petrus, Bandung',
                        nomorSurat: 'B-234/1988',
                    },
                    komuniPertama: {
                        tanggal: '1996-06-15',
                        gereja: 'Paroki Santo Petrus, Bandung',
                    },
                    krisma: {
                        tanggal: '2003-05-25',
                        gereja: 'Paroki Santo Petrus, Bandung',
                    },
                    pernikahan: {
                        tanggal: '2010-11-20',
                        gereja: 'Paroki Santo Yakobus, Jakarta',
                        bukuNomor: 'N-45/2010',
                    },
                },
                statusKeanggotaan: 'Aktif',
                nomorTelepon: '0813-4567-8901',
                email: 'maria.kusuma@email.com',
            },
            {
                id: 'angg-001-3',
                namaLengkap: 'Gabriel Wijaya',
                namaPanggilan: 'Gabriel',
                namaBaptis: 'Gabriel',
                tempatLahir: 'Bekasi',
                tanggalLahir: '2012-03-15',
                jenisKelamin: 'L',
                hubunganDalamKeluarga: 'Anak',
                statusPernikahan: 'Belum Menikah',
                golonganDarah: 'A',
                pendidikanTerakhir: 'SMP',
                pekerjaan: 'Pelajar',
                sakramen: {
                    baptis: {
                        tanggal: '2012-05-20',
                        gereja: 'Paroki Santo Arnoldus Janssen, Bekasi',
                        nomorSurat: 'B-056/2012',
                    },
                    komuniPertama: {
                        tanggal: '2020-10-11',
                        gereja: 'Paroki Santo Arnoldus Janssen, Bekasi',
                    },
                },
                statusKeanggotaan: 'Aktif',
            },
        ],
        tanggalDaftar: '2020-01-15',
    },
];
