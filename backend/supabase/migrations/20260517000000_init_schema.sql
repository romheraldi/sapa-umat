-- Create custom types
CREATE TYPE role_type AS ENUM ('umat', 'ketua_lingkungan', 'admin_paroki', 'pastor');
CREATE TYPE gender_type AS ENUM ('L', 'P');
CREATE TYPE family_status_type AS ENUM ('Suami', 'Istri', 'Anak', 'Lainnya');
CREATE TYPE marital_status_type AS ENUM ('Belum Menikah', 'Menikah Katolik', 'Lainnya');
CREATE TYPE schedule_category_type AS ENUM ('Misa', 'Adorasi', 'Ibadat', 'Sakramen', 'Kegiatan');
CREATE TYPE announcement_category_type AS ENUM ('Liturgi', 'Kegiatan', 'Sakramen', 'Sosial', 'Umum');

-- Table: users_roles
CREATE TABLE users_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role role_type NOT NULL DEFAULT 'umat',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: wilayah
CREATE TABLE wilayah (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL
);

-- Table: lingkungan
CREATE TABLE lingkungan (
    id SERIAL PRIMARY KEY,
    wilayah_id INT NOT NULL REFERENCES wilayah(id) ON DELETE CASCADE,
    nama VARCHAR(100) NOT NULL,
    ketua_id UUID REFERENCES users_roles(id) ON DELETE SET NULL
);

-- Table: keluarga
CREATE TABLE keluarga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_kk_katolik VARCHAR(50) UNIQUE NOT NULL,
    lingkungan_id INT NOT NULL REFERENCES lingkungan(id) ON DELETE RESTRICT,
    alamat_lengkap TEXT NOT NULL,
    no_telepon VARCHAR(20),
    kepala_keluarga_id UUID, -- Will add FK constraint later after umat table is created
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: umat
CREATE TABLE umat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_id UUID NOT NULL REFERENCES keluarga(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_roles(id) ON DELETE SET NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    tempat_lahir VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin gender_type NOT NULL,
    status_dalam_keluarga family_status_type NOT NULL,
    status_baptis BOOLEAN NOT NULL DEFAULT false,
    status_krisma BOOLEAN NOT NULL DEFAULT false,
    status_perkawinan marital_status_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK for kepala_keluarga_id
ALTER TABLE keluarga 
ADD CONSTRAINT fk_kepala_keluarga 
FOREIGN KEY (kepala_keluarga_id) REFERENCES umat(id) ON DELETE SET NULL;

-- Table: jadwal_ibadah
CREATE TABLE jadwal_ibadah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul VARCHAR(255) NOT NULL,
    kategori schedule_category_type NOT NULL,
    tanggal DATE NOT NULL,
    waktu_mulai TIME NOT NULL,
    waktu_selesai TIME,
    lokasi VARCHAR(255) NOT NULL,
    keterangan TEXT,
    is_special BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: pengumuman
CREATE TABLE pengumuman (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul VARCHAR(255) NOT NULL,
    kategori announcement_category_type NOT NULL,
    ringkasan TEXT NOT NULL,
    konten_lengkap TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    image_url TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    author_id UUID REFERENCES users_roles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS Policies (Basic examples, can be expanded)
ALTER TABLE wilayah ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on wilayah" ON wilayah FOR SELECT USING (true);

ALTER TABLE lingkungan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on lingkungan" ON lingkungan FOR SELECT USING (true);

ALTER TABLE keluarga ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on keluarga" ON keluarga FOR SELECT TO authenticated USING (true);

ALTER TABLE umat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read on umat" ON umat FOR SELECT TO authenticated USING (true);

ALTER TABLE jadwal_ibadah ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on jadwal_ibadah" ON jadwal_ibadah FOR SELECT USING (true);

ALTER TABLE pengumuman ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on pengumuman" ON pengumuman FOR SELECT USING (true);
