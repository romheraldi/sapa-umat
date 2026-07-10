import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import type { JadwalUpdate } from '@/types/database'

type Params = { params: Promise<{ id: string }> }

// GET /api/jadwal/:id
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const db = createAdminClient()
    const { data, error } = await db
      .from('jadwal_ibadah')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return NextResponse.json({ data: null, error: 'Jadwal tidak ditemukan.' }, { status: 404 })
    return NextResponse.json({ data, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// PUT /api/jadwal/:id — admin only
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })

    const body: JadwalUpdate = await request.json()
    const db = createAdminClient()
    const { data, error } = await db
      .from('jadwal_ibadah')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// DELETE /api/jadwal/:id — admin only
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })

    const db = createAdminClient()
    const { error } = await db.from('jadwal_ibadah').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ data: { message: 'Jadwal berhasil dihapus.' }, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
