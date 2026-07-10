import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import type { PengumumanInsert } from '@/types/database'

// GET /api/pengumuman
// Query params: ?kategori=Liturgi&search=krisma&is_pinned=true&limit=10&page=1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kategori = searchParams.get('kategori')
    const search = searchParams.get('search')
    const isPinned = searchParams.get('is_pinned')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const offset = (page - 1) * limit

    const db = createAdminClient()
    let query = db
      .from('pengumuman')
      .select('*', { count: 'exact' })
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (kategori && kategori !== 'Semua') query = query.eq('kategori', kategori)
    if (search) query = query.or(`judul.ilike.%${search}%,ringkasan.ilike.%${search}%`)
    if (isPinned === 'true') query = query.eq('is_pinned', true)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ data, count: count ?? 0, page, limit, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// POST /api/pengumuman — admin only
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })

    const body: PengumumanInsert = await request.json()
    const db = createAdminClient()

    // Cek apakah user ada di tabel users_roles (hindari FK violation)
    const { data: userRole } = await db
      .from('users_roles')
      .select('id')
      .eq('id', user.id)
      .single()

    // Set author_id hanya jika user terdaftar di users_roles
    const payload = { ...body, author_id: userRole ? user.id : null }

    const { data, error } = await db
      .from('pengumuman')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/pengumuman] Supabase error:', error)
      throw error
    }
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    console.error('[POST /api/pengumuman] Caught error:', err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
