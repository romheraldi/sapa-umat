import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import type { JadwalInsert } from '@/types/database'

// GET /api/jadwal
// Query params: ?kategori=Misa&start_date=2026-05-01&end_date=2026-05-31
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kategori = searchParams.get('kategori')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    const db = createAdminClient()
    let query = db
      .from('jadwal_ibadah')
      .select('*')
      .order('tanggal', { ascending: true })
      .order('waktu_mulai', { ascending: true })

    if (kategori && kategori !== 'Semua') query = query.eq('kategori', kategori)
    if (startDate) query = query.gte('tanggal', startDate)
    if (endDate) query = query.lte('tanggal', endDate)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// POST /api/jadwal — admin only
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })

    const body: JadwalInsert = await request.json()
    const db = createAdminClient()
    const { data, error } = await db
      .from('jadwal_ibadah')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/jadwal] Supabase error:', error)
      throw error
    }
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    console.error('[POST /api/jadwal] Caught error:', err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
