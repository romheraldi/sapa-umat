-- ╔═══════════════════════════════════════════════════════════════════════════════╗
-- ║  Migration: Registrasi Keluarga Mandiri dari Mobile                          ║
-- ║  Date: 2026-07-30                                                            ║
-- ╚═══════════════════════════════════════════════════════════════════════════════╝
-- Umat dapat menautkan akunnya ke keluarga (klaim) atau mendaftarkan keluarga baru
-- langsung dari aplikasi mobile, tanpa menunggu admin.

-- ─── keluarga: penanda data hasil registrasi mandiri ─────────────────────────
-- Default true supaya baris lama dan data yang dibuat admin tetap dianggap
-- terverifikasi. Jalur mobile mengeset false secara eksplisit.
ALTER TABLE keluarga
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_keluarga_is_verified ON keluarga(is_verified);

-- ─── umat: satu akun hanya boleh tertaut ke satu anggota ─────────────────────
-- GET /api/iuran dan GET /api/umat/keluarga sudah memakai .limit(1).single()
-- dengan asumsi ini, tapi selama ini tidak dijamin oleh skema.
CREATE UNIQUE INDEX IF NOT EXISTS uq_umat_user_id
    ON umat(user_id) WHERE user_id IS NOT NULL;

-- ─── Generator No. KK Katolik ────────────────────────────────────────────────
-- Format: KK-{tahun}-{urutan 4 digit}, mis. KK-2026-0001.
-- Sequence dipakai supaya aman dari race condition saat dua umat mendaftar
-- keluarga baru bersamaan.
CREATE SEQUENCE IF NOT EXISTS seq_no_kk_katolik;

CREATE OR REPLACE FUNCTION next_no_kk_katolik()
RETURNS TEXT AS $$
DECLARE
    v_no_kk TEXT;
BEGIN
    LOOP
        v_no_kk := 'KK-'
                   || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT
                   || '-'
                   || LPAD(nextval('seq_no_kk_katolik')::TEXT, 4, '0');

        -- Sequence baru mulai dari 1, sementara paroki bisa saja sudah punya
        -- nomor dengan format sama dari data lama. Lewati yang sudah terpakai.
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM keluarga WHERE no_kk_katolik = v_no_kk
        );
    END LOOP;

    RETURN v_no_kk;
END;
$$ LANGUAGE plpgsql;
