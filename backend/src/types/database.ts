// ─── Enums ────────────────────────────────────────────────────────────────────
export type RoleType = 'umat' | 'ketua_lingkungan' | 'ketua_wilayah' | 'admin_paroki' | 'pastor';
export type GenderType = 'L' | 'P';
export type FamilyStatusType = 'Suami' | 'Istri' | 'Anak' | 'Lainnya';
export type MaritalStatusType = 'Belum Menikah' | 'Menikah Katolik' | 'Lainnya';
export type ScheduleCategoryType = 'Misa' | 'Adorasi' | 'Ibadat' | 'Sakramen' | 'Kegiatan';
export type AnnouncementCategoryType = 'Liturgi' | 'Kegiatan' | 'Sakramen' | 'Sosial' | 'Umum';

// ─── Table Row Types ──────────────────────────────────────────────────────────
export interface UserRole {
  id: string;
  role: RoleType;
  nama_lengkap: string | null;
  registered_at: string | null;
  created_at: string;
}

export interface Wilayah {
  id: number;
  nama: string;
  ketua_id: string | null;
}

export interface Lingkungan {
  id: number;
  wilayah_id: number;
  nama: string;
  ketua_id: string | null;
  // Joined
  wilayah?: Wilayah;
}

export interface Keluarga {
  id: string;
  no_kk_katolik: string;
  lingkungan_id: number;
  alamat_lengkap: string;
  no_telepon: string | null;
  kepala_keluarga_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  lingkungan?: Lingkungan;
  anggota?: Umat[];
}

export interface Umat {
  id: string;
  keluarga_id: string;
  user_id: string | null;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: GenderType;
  status_dalam_keluarga: FamilyStatusType;
  status_baptis: boolean;
  status_krisma: boolean;
  status_perkawinan: MaritalStatusType;
  created_at: string;
  updated_at: string;
}

export interface JadwalIbadah {
  id: string;
  judul: string;
  kategori: ScheduleCategoryType;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string | null;
  lokasi: string;
  keterangan: string | null;
  is_special: boolean;
  created_at: string;
}

export interface Pengumuman {
  id: string;
  judul: string;
  kategori: AnnouncementCategoryType;
  ringkasan: string;
  konten_lengkap: string;
  is_pinned: boolean;
  image_url: string | null;
  published_at: string;
  author_id: string | null;
  created_at: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
}

// ─── Insert / Update Payload Types ───────────────────────────────────────────
export type JadwalInsert = Omit<JadwalIbadah, 'id' | 'created_at'>;
export type JadwalUpdate = Partial<JadwalInsert>;

export type PengumumanInsert = Omit<Pengumuman, 'id' | 'created_at'>;
export type PengumumanUpdate = Partial<PengumumanInsert>;

export type KeluargaInsert = Omit<Keluarga, 'id' | 'created_at' | 'updated_at' | 'lingkungan' | 'anggota'>;
export type KeluargaUpdate = Partial<KeluargaInsert>;

export type UmatInsert = Omit<Umat, 'id' | 'created_at' | 'updated_at'>;
export type UmatUpdate = Partial<UmatInsert>;

// ─── Dokumen ──────────────────────────────────────────────────────────────────
export interface DokumenUmat {
  id: string;
  user_id: string;
  judul: string;
  kategori: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  keterangan: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  // Joined
  users_roles?: Pick<UserRole, 'nama_lengkap' | 'role'>;
}

export type DokumenInsert = Omit<DokumenUmat, 'id' | 'created_at' | 'updated_at' | 'status' | 'users_roles'>;

// ─── Iuran Bulanan ────────────────────────────────────────────────────────────
export type PaymentStatusType = 'belum_bayar' | 'menunggu_pembayaran' | 'lunas' | 'kadaluarsa';

export interface IuranConfig {
  id: number;
  nama: string;
  nominal: number;
  deskripsi: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TagihanIuran {
  id: string;
  keluarga_id: string;
  iuran_config_id: number;
  bulan: number;
  tahun: number;
  nominal: number;
  status: PaymentStatusType;
  midtrans_order_id: string | null;
  midtrans_transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  keluarga?: Keluarga;
  iuran_config?: IuranConfig;
}

export type TagihanInsert = Omit<TagihanIuran, 'id' | 'created_at' | 'updated_at' | 'keluarga' | 'iuran_config'>;
