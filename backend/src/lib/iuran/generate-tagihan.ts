import type { SupabaseClient } from '@supabase/supabase-js'

export interface GenerateTagihanResult {
  /** Jumlah tagihan yang baru dibuat */
  created: number
  /** Jumlah tagihan yang sudah ada sebelumnya, dilewati */
  skipped: number
  /** Tahun yang digenerate */
  tahun: number
}

/**
 * Pastikan sebuah keluarga punya tagihan bulan 1-12 tahun berjalan untuk setiap
 * iuran_config yang aktif.
 *
 * Idempotent: tagihan yang sudah ada (mis. hasil cron bulanan atau pemanggilan
 * sebelumnya) dilewati, bukan di-insert ulang. Supabase JS tidak mendukung
 * ON CONFLICT pada kolom non-PK, jadi dedup dilakukan di sisi aplikasi —
 * pola yang sama dipakai POST /api/iuran.
 *
 * Dipakai oleh POST /api/umat/keluarga (jalur admin) dan POST /api/umat/klaim
 * (jalur mobile) supaya dua-duanya menghasilkan tagihan yang sama.
 */
export async function generateTagihanTahunBerjalan(
  db: SupabaseClient,
  keluargaId: string
): Promise<GenerateTagihanResult> {
  const tahun = new Date().getFullYear()

  const { data: configs, error: configError } = await db
    .from('iuran_config')
    .select('id, nominal')
    .eq('is_active', true)

  if (configError) {
    throw new Error(`Gagal membaca konfigurasi iuran: ${configError.message}`)
  }

  if (!configs || configs.length === 0) {
    return { created: 0, skipped: 0, tahun }
  }

  const { data: existing, error: existingError } = await db
    .from('tagihan_iuran')
    .select('iuran_config_id, bulan')
    .eq('keluarga_id', keluargaId)
    .eq('tahun', tahun)

  if (existingError) {
    throw new Error(`Gagal membaca tagihan existing: ${existingError.message}`)
  }

  const existingSet = new Set(
    (existing ?? []).map(t => `${t.iuran_config_id}|${t.bulan}`)
  )

  const insertRows: {
    keluarga_id: string
    iuran_config_id: number
    bulan: number
    tahun: number
    nominal: number
    status: string
  }[] = []

  for (const config of configs) {
    for (let bulan = 1; bulan <= 12; bulan++) {
      if (existingSet.has(`${config.id}|${bulan}`)) continue
      insertRows.push({
        keluarga_id: keluargaId,
        iuran_config_id: config.id,
        bulan,
        tahun,
        nominal: config.nominal,
        status: 'belum_bayar',
      })
    }
  }

  if (insertRows.length === 0) {
    return { created: 0, skipped: existingSet.size, tahun }
  }

  const { data: inserted, error: insertError } = await db
    .from('tagihan_iuran')
    .insert(insertRows)
    .select('id')

  if (insertError) {
    throw new Error(`Gagal membuat tagihan: ${insertError.message}`)
  }

  return {
    created: inserted?.length ?? 0,
    skipped: existingSet.size,
    tahun,
  }
}
