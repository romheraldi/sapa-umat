import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import type { PengumumanUpdate } from '@/types/database'

type Params = { params: Promise<{ id: string }> }

// GET /api/pengumuman/:id
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const db = createAdminClient()
    const { data, error } = await db
      .from('pengumuman')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return NextResponse.json({ data: null, error: 'Pengumuman tidak ditemukan.' }, { status: 404 })
    return NextResponse.json({ data, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// PUT /api/pengumuman/:id — admin only
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })

    const body: PengumumanUpdate = await request.json()
    const db = createAdminClient()
    const { data, error } = await db
      .from('pengumuman')
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

// DELETE /api/pengumuman/:id — admin only
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })

    const db = createAdminClient()
    const { error } = await db.from('pengumuman').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ data: { message: 'Pengumuman berhasil dihapus.' }, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
