-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║  Migration: Iuran Bulanan (Monthly Church Dues)                             ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝

-- Enum for payment status
CREATE TYPE payment_status_type AS ENUM (
    'belum_bayar',
    'menunggu_pembayaran',
    'lunas',
    'kadaluarsa'
);

-- ─── Table: iuran_config ─────────────────────────────────────────────────────
-- Master table for types of iuran (dues). Each parish can define multiple iuran types.
CREATE TABLE iuran_config (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    nominal INTEGER NOT NULL,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table: tagihan_iuran ────────────────────────────────────────────────────
-- Each row is a bill for a specific keluarga, for a specific month/year + iuran type.
CREATE TABLE tagihan_iuran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_id UUID NOT NULL REFERENCES keluarga(id) ON DELETE CASCADE,
    iuran_config_id INTEGER NOT NULL REFERENCES iuran_config(id) ON DELETE RESTRICT,
    bulan INTEGER NOT NULL CHECK (bulan >= 1 AND bulan <= 12),
    tahun INTEGER NOT NULL CHECK (tahun >= 2020),
    nominal INTEGER NOT NULL,
    status payment_status_type NOT NULL DEFAULT 'belum_bayar',
    midtrans_order_id VARCHAR(100),
    midtrans_transaction_id VARCHAR(100),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- A keluarga can only have one tagihan per iuran type per month/year
    CONSTRAINT uq_tagihan_keluarga_iuran_period UNIQUE (keluarga_id, iuran_config_id, bulan, tahun)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_tagihan_keluarga_id ON tagihan_iuran(keluarga_id);
CREATE INDEX idx_tagihan_status ON tagihan_iuran(status);
CREATE INDEX idx_tagihan_bulan_tahun ON tagihan_iuran(bulan, tahun);

-- ─── RLS: iuran_config ──────────────────────────────────────────────────────
ALTER TABLE iuran_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read iuran_config (public info about iuran types)
CREATE POLICY "Allow public read access on iuran_config"
    ON iuran_config FOR SELECT
    USING (true);

-- ─── RLS: tagihan_iuran ─────────────────────────────────────────────────────
ALTER TABLE tagihan_iuran ENABLE ROW LEVEL SECURITY;

-- Umat (authenticated) can read tagihan for their own keluarga
CREATE POLICY "Allow umat read own tagihan"
    ON tagihan_iuran FOR SELECT TO authenticated
    USING (
        keluarga_id IN (
            SELECT u.keluarga_id FROM umat u WHERE u.user_id = auth.uid()
        )
    );

-- Admin & ketua can read all tagihan
CREATE POLICY "Allow admin and ketua read all tagihan"
    ON tagihan_iuran FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users_roles ur
            WHERE ur.id = auth.uid()
              AND ur.role IN ('admin_paroki', 'pastor', 'ketua_lingkungan', 'ketua_wilayah')
        )
    );

-- ─── Default seed data ──────────────────────────────────────────────────────
INSERT INTO iuran_config (nama, nominal, deskripsi, is_active)
VALUES ('Iuran Bulanan Paroki', 50000, 'Iuran bulanan wajib untuk setiap keluarga aktif', true);
