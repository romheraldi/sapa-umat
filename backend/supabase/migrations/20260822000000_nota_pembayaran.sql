-- ─── Tabel penomoran nota ────────────────────────────────────────────────────
CREATE TABLE nota_counter (
    tahun       INT PRIMARY KEY,
    last_number INT NOT NULL DEFAULT 0
);

CREATE TABLE nota_pembayaran (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    VARCHAR(100) UNIQUE NOT NULL,
    nomor       VARCHAR(30)  UNIQUE NOT NULL,
    tahun       INT NOT NULL,
    keluarga_id UUID NOT NULL REFERENCES keluarga(id) ON DELETE CASCADE,
    total       INT NOT NULL,
    metode      VARCHAR(20) NOT NULL,
    paid_at     TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nota_keluarga_id ON nota_pembayaran(keluarga_id);

-- Tertutup untuk klien anon/authenticated. Seluruh akses lewat service role,
-- aturan siapa boleh lihat nota siapa hanya ada di src/lib/nota/akses.ts.
ALTER TABLE nota_counter    ENABLE ROW LEVEL SECURITY;
ALTER TABLE nota_pembayaran ENABLE ROW LEVEL SECURITY;

-- ─── Backfill: lunas lama belum punya order_id ───────────────────────────────
-- Tagihan yang dulu ditandai lunas bersamaan dikelompokkan jadi satu nota,
-- memakai keluarga + detik pembayaran yang sama sebagai kunci.
WITH grup AS (
    SELECT
        id,
        'LEGACY-' || md5(
            keluarga_id::TEXT || '|' ||
            date_trunc('second', COALESCE(paid_at, updated_at, created_at))::TEXT
        ) AS new_order_id
    FROM tagihan_iuran
    WHERE status = 'lunas' AND midtrans_order_id IS NULL
)
UPDATE tagihan_iuran t
SET midtrans_order_id = g.new_order_id
FROM grup g
WHERE t.id = g.id;

-- ─── Fungsi penomoran ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION assign_nota(p_order_id VARCHAR)
RETURNS nota_pembayaran
LANGUAGE plpgsql
AS $$
DECLARE
    v_nota          nota_pembayaran;
    v_jml_keluarga  INT;
    v_keluarga_id   UUID;
    v_total         INT;
    v_paid_at       TIMESTAMPTZ;
    v_belum_lunas   INT;
    v_baris         INT;
    v_tahun         INT;
    v_urutan        INT;
    v_metode        VARCHAR(20);
BEGIN
    -- Kunci per order supaya dua permintaan bersamaan tidak membakar dua nomor.
    PERFORM pg_advisory_xact_lock(hashtext(p_order_id));

    SELECT * INTO v_nota FROM nota_pembayaran WHERE order_id = p_order_id;
    IF FOUND THEN
        RETURN v_nota;
    END IF;

    SELECT
        COUNT(*),
        COUNT(DISTINCT keluarga_id),
        MIN(keluarga_id),
        SUM(nominal),
        MAX(COALESCE(paid_at, updated_at, created_at)),
        COUNT(*) FILTER (WHERE status <> 'lunas')
    INTO v_baris, v_jml_keluarga, v_keluarga_id, v_total, v_paid_at, v_belum_lunas
    FROM tagihan_iuran
    WHERE midtrans_order_id = p_order_id;

    IF v_baris = 0 THEN
        RAISE EXCEPTION 'ORDER_TIDAK_DITEMUKAN';
    END IF;

    IF v_belum_lunas > 0 THEN
        RAISE EXCEPTION 'ORDER_BELUM_LUNAS';
    END IF;

    IF v_jml_keluarga > 1 THEN
        RAISE EXCEPTION 'ORDER_LINTAS_KELUARGA';
    END IF;

    v_tahun := EXTRACT(YEAR FROM v_paid_at)::INT;

    INSERT INTO nota_counter (tahun, last_number)
    VALUES (v_tahun, 1)
    ON CONFLICT (tahun) DO UPDATE
        SET last_number = nota_counter.last_number + 1
    RETURNING last_number INTO v_urutan;

    v_metode := CASE
        WHEN p_order_id LIKE 'MANUAL-%' THEN 'manual'
        WHEN p_order_id LIKE 'LEGACY-%' THEN 'legacy'
        ELSE 'qris'
    END;

    INSERT INTO nota_pembayaran
        (order_id, nomor, tahun, keluarga_id, total, metode, paid_at)
    VALUES (
        p_order_id,
        'NOTA/' || v_tahun || '/' || LPAD(v_urutan::TEXT, 6, '0'),
        v_tahun, v_keluarga_id, v_total, v_metode, v_paid_at
    )
    RETURNING * INTO v_nota;

    RETURN v_nota;
END;
$$;
