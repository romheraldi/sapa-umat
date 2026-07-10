import { getAuthUserWithRole } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/iuran
// Query params: ?keluarga_id=xxx&bulan=7&tahun=2026&status=belum_bayar
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUserWithRole(request)
    if (!auth) {
      return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const keluargaId = searchParams.get('keluarga_id')
    const bulan = searchParams.get('bulan')
    const tahun = searchParams.get('tahun')
    const status = searchParams.get('status')

    const db = createAdminClient()

    // ─── Role: umat → only their own keluarga's tagihan ───────────────────
    if (auth.role === 'umat') {
      const { data: umatRow } = await db
        .from('umat')
        .select('keluarga_id')
        .eq('user_id', auth.user.id)
        .limit(1)
        .single()

      if (!umatRow) {
        return NextResponse.json({ data: [], error: null })
      }

      let query = db
        .from('tagihan_iuran')
        .select('*, iuran_config(*), keluarga(no_kk_katolik)')
        .eq('keluarga_id', umatRow.keluarga_id)
        .order('tahun', { ascending: false })
        .order('bulan', { ascending: false })

      if (bulan) query = query.eq('bulan', parseInt(bulan))
      if (tahun) query = query.eq('tahun', parseInt(tahun))
      if (status) query = query.eq('status', status)

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ data: null, error: error.message }, { status: 500 })
      }
      return NextResponse.json({ data, error: null })
    }

    // ─── Role: admin / ketua_wilayah / ketua_lingkungan ───────────────────
    let query = db
      .from('tagihan_iuran')
      .select('*, iuran_config(*), keluarga(no_kk_katolik)')
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })

    if (keluargaId) query = query.eq('keluarga_id', keluargaId)
    if (bulan) query = query.eq('bulan', parseInt(bulan))
    if (tahun) query = query.eq('tahun', parseInt(tahun))
    if (status) query = query.eq('status', status)

    // ketua_lingkungan / ketua_wilayah: scope to their lingkungan's keluarga
    if (!auth.isAdmin && auth.lingkunganIds.length > 0) {
      // Get keluarga IDs within their lingkungan scope
      const { data: keluargaData } = await db
        .from('keluarga')
        .select('id')
        .in('lingkungan_id', auth.lingkunganIds)

      const scopedKeluargaIds = (keluargaData ?? []).map(k => k.id)
      if (scopedKeluargaIds.length > 0) {
        query = query.in('keluarga_id', scopedKeluargaIds)
      } else {
        return NextResponse.json({ data: [], error: null })
      }
    } else if (!auth.isAdmin && auth.lingkunganIds.length === 0) {
      return NextResponse.json({ data: [], error: null })
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    console.error('[GET /api/iuran] Caught error:', err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// POST /api/iuran — Admin only: generate tagihan for a given month/year
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUserWithRole(request)
    if (!auth) {
      return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
    }

    if (!auth.isAdmin) {
      return NextResponse.json(
        { data: null, error: 'Hanya admin yang dapat membuat tagihan.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { bulan, tahun, iuran_config_id } = body as {
      bulan: number
      tahun: number
      iuran_config_id?: number
    }

    if (!bulan || !tahun) {
      return NextResponse.json(
        { data: null, error: 'Parameter bulan dan tahun wajib diisi.' },
        { status: 400 }
      )
    }

    if (bulan < 1 || bulan > 12) {
      return NextResponse.json(
        { data: null, error: 'Bulan harus antara 1-12.' },
        { status: 400 }
      )
    }

    const db = createAdminClient()

    // Get active iuran configs (optionally filter by specific id)
    let configQuery = db.from('iuran_config').select('*').eq('is_active', true)
    if (iuran_config_id) {
      configQuery = configQuery.eq('id', iuran_config_id)
    }
    const { data: configs, error: configError } = await configQuery

    if (configError) {
      return NextResponse.json({ data: null, error: configError.message }, { status: 500 })
    }

    if (!configs || configs.length === 0) {
      return NextResponse.json(
        { data: null, error: 'Tidak ada konfigurasi iuran aktif.' },
        { status: 404 }
      )
    }

    // Get all keluarga
    const { data: keluargaList, error: keluargaError } = await db
      .from('keluarga')
      .select('id')

    if (keluargaError) {
      return NextResponse.json({ data: null, error: keluargaError.message }, { status: 500 })
    }

    if (!keluargaList || keluargaList.length === 0) {
      return NextResponse.json(
        { data: null, error: 'Tidak ada data keluarga.' },
        { status: 404 }
      )
    }

    // Get existing tagihan for this month/year to avoid duplicates
    // (Supabase JS client doesn't support ON CONFLICT on non-PK columns)
    const { data: existingTagihan } = await db
      .from('tagihan_iuran')
      .select('keluarga_id, iuran_config_id')
      .eq('bulan', bulan)
      .eq('tahun', tahun)

    const existingSet = new Set(
      (existingTagihan ?? []).map(t => `${t.keluarga_id}|${t.iuran_config_id}`)
    )

    // Build insert rows, skipping existing ones
    const insertRows: {
      keluarga_id: string
      iuran_config_id: number
      bulan: number
      tahun: number
      nominal: number
      status: string
    }[] = []

    for (const config of configs) {
      for (const keluarga of keluargaList) {
        const key = `${keluarga.id}|${config.id}`
        if (!existingSet.has(key)) {
          insertRows.push({
            keluarga_id: keluarga.id,
            iuran_config_id: config.id,
            bulan,
            tahun,
            nominal: config.nominal,
            status: 'belum_bayar',
          })
        }
      }
    }

    if (insertRows.length === 0) {
      return NextResponse.json({
        data: { created: 0, skipped: existingSet.size },
        error: null,
      })
    }

    // Bulk insert in batches (Supabase has a practical limit per request)
    const BATCH_SIZE = 500
    let totalCreated = 0

    for (let i = 0; i < insertRows.length; i += BATCH_SIZE) {
      const batch = insertRows.slice(i, i + BATCH_SIZE)
      const { data: inserted, error: insertError } = await db
        .from('tagihan_iuran')
        .insert(batch)
        .select('id')

      if (insertError) {
        console.error('[POST /api/iuran] Insert error:', insertError.message)
        return NextResponse.json({ data: null, error: insertError.message }, { status: 500 })
      }
      totalCreated += inserted?.length ?? 0
    }

    return NextResponse.json(
      {
        data: {
          created: totalCreated,
          skipped: existingSet.size,
          bulan,
          tahun,
        },
        error: null,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    console.error('[POST /api/iuran] Caught error:', err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
