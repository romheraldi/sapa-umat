/**
 * TypeScript types untuk aplikasi SAPA UMAT
 * Struktur data mengikuti standar BASIS Keuskupan
 */

// ==================== DATA UMAT (BASIS) ====================

export type HubunganKeluarga = 'KK' | 'Istri' | 'Anak' | 'Orang Tua' | 'Lainnya';
export type StatusPernikahan = 'Belum Menikah' | 'Katolik' | 'Campur' | 'Sipil' | 'Adat';
export type JenisKelamin = 'L' | 'P';
export type GolonganDarah = 'A' | 'B' | 'AB' | 'O' | 'Tidak Tahu';
export type StatusKeanggotaan = 'Aktif' | 'Pindah' | 'Meninggal';
export type StatusTempatTinggal = 'Milik Sendiri' | 'Kontrak' | 'Sewa' | 'Menumpang' | 'Lainnya';

export interface DataSakramen {
    baptis?: {
        tanggal: string;
        gereja: string;
        nomorSurat?: string;
    };
    komuniPertama?: {
        tanggal: string;
        gereja: string;
    };
    krisma?: {
        tanggal: string;
        gereja: string;
    };
    pernikahan?: {
        tanggal: string;
        gereja: string;
        bukuNomor?: string;
    };
}

export interface AnggotaKeluarga {
    id: string;
    namaLengkap: string;
    namaPanggilan?: string;
    namaBaptis?: string;
    tempatLahir: string;
    tanggalLahir: string;
    jenisKelamin: JenisKelamin;
    hubunganDalamKeluarga: HubunganKeluarga;
    statusPernikahan: StatusPernikahan;
    golonganDarah?: GolonganDarah;
    pendidikanTerakhir?: string;
    pekerjaan?: string;
    sakramen: DataSakramen;
    statusKeanggotaan: StatusKeanggotaan;
    nomorTelepon?: string;
    email?: string;
}

export interface Keluarga {
    id: string;
    noKartuKeluargaKatolik: string;
    namaKepalaKeluarga: string;
    alamat: {
        jalan: string;
        rt: string;
        rw: string;
        kelurahan: string;
        kecamatan: string;
        kota: string;
        kodePos: string;
    };
    lingkungan: string;
    wilayah: string;
    paroki: string;
    statusTempatTinggal: StatusTempatTinggal;
    nomorTelepon?: string;
    anggotaKeluarga: AnggotaKeluarga[];
    tanggalDaftar: string;
}

// ==================== JADWAL IBADAH ====================

export type JenisIbadah = 'Misa' | 'Adorasi' | 'Ibadat' | 'Sakramen' | 'Kegiatan';
export type KategoriJadwal = 'Mingguan' | 'Hari Raya' | 'Khusus';
export type BahasaMisa = 'Indonesia' | 'Inggris' | 'Latin' | 'Campuran';
export type HariDalamSeminggu = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';

export interface JadwalMisa {
    id: string;
    jenisIbadah: JenisIbadah;
    kategori: KategoriJadwal;
    judul: string;
    hari?: HariDalamSeminggu;
    tanggal?: string; // untuk jadwal khusus
    waktu: string;
    bahasa?: BahasaMisa;
    lokasi: string; // 'Gereja Utama' / 'Kapel' / 'Aula'
    celebran?: string;
    deskripsi?: string;
    catatan?: string;
    isAktif: boolean;
}

// ==================== PENGUMUMAN ====================

export type KategoriPengumuman = 'Liturgi' | 'Kegiatan' | 'Sakramen' | 'Sosial' | 'Umum';
export type PrioritasPengumuman = 'Tinggi' | 'Sedang' | 'Rendah';

export interface Pengumuman {
    id: string;
    judul: string;
    kategori: KategoriPengumuman;
    prioritas: PrioritasPengumuman;
    tanggalPublikasi: string;
    tanggalBerakhir?: string;
    ringkasan: string;
    kontenLengkap: string;
    gambar?: string;
    isPinned: boolean;
    author?: string;
}

// ==================== INFORMASI GEREJA ====================

export interface Lingkungan {
    id: string;
    nama: string;
    ketua: string;
    wilayah: string;
    jumlahKeluarga: number;
}

export interface Wilayah {
    id: string;
    nama: string;
    ketua: string;
    lingkungan: string[]; // array of lingkungan IDs
}

export interface Pastor {
    nama: string;
    jabatan: 'Pastor Paroki' | 'Vikaris' | 'Administrator';
    fotoUrl?: string;
}

export interface InfoGereja {
    namaParoki: string;
    namaPelindung: string;
    alamatLengkap: string;
    telepon: string;
    email: string;
    website?: string;
    pastor: Pastor[];
    sejarahSingkat: string;
    koordinatMap?: {
        latitude: number;
        longitude: number;
    };
    jamOperasionalSekretariat: {
        hari: string;
        jam: string;
    }[];
    galeri: string[]; // array of image URLs
}

// ==================== UI HELPERS ====================

export interface QuickAction {
    id: string;
    title: string;
    icon: string;
    route: string;
    color: string;
}
