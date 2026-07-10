CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION generate_tagihan_bulanan()
RETURNS void AS $$
DECLARE
    v_bulan INTEGER;
    v_tahun INTEGER;
BEGIN
    v_bulan := EXTRACT(MONTH FROM CURRENT_DATE);
    v_tahun := EXTRACT(YEAR FROM CURRENT_DATE);

    INSERT INTO tagihan_iuran (keluarga_id, iuran_config_id, bulan, tahun, nominal)
    SELECT k.id, ic.id, v_bulan, v_tahun, ic.nominal
    FROM keluarga k
    CROSS JOIN iuran_config ic
    WHERE ic.is_active = true
    ON CONFLICT (keluarga_id, iuran_config_id, bulan, tahun) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Schedule to run on the 1st of every month at midnight (00:00)
SELECT cron.schedule('generate_iuran_bulanan_cron', '0 0 1 * *', 'SELECT generate_tagihan_bulanan();');
