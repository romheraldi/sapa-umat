import { getAuthUserWithRole, hasLingkunganAccess } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import type { KeluargaInsert } from '@/types/database'

// GET /api/umat/keluarga
// Query params: ?search=SAJ-001&lingkungan_id=1&limit=20&page=1
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUserWithRole(request)
    if (!auth) return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const lingkunganId = searchParams.get('lingkungan_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const offset = (page - 1) * limit

    const db = createAdminClient()

    // ─── Role: umat → only their own keluarga ─────────────────────────────
    if (auth.role === 'umat') {
      // Find keluarga_id via umat table where user_id matches
      const { data: umatRow } = await db
        .from('umat')
        .select('keluarga_id')
        .eq('user_id', auth.user.id)
        .limit(1)
        .single()

      if (!umatRow) {
        return NextResponse.json({ data: [], count: 0, page, limit, error: null })
      }

      const { data, error } = await db
        .from('keluarga')
        .select('*, lingkungan(id, nama, wilayah(id, nama)), anggota:umat(*)')
        .eq('id', umatRow.keluarga_id)

      if (error) {
        return NextResponse.json({ data: null, error: error.message }, { status: 500 })
      }
      return NextResponse.json({ data, count: data?.length ?? 0, page: 1, limit, error: null })
    }

    // ─── Role: admin / ketua_wilayah / ketua_lingkungan ───────────────────
    let query = db
      .from('keluarga')
      .select('*, lingkungan(id, nama, wilayah(id, nama)), anggota:umat(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) query = query.ilike('no_kk_katolik', `%${search}%`)

    // Apply lingkungan filter from query param
    if (lingkunganId) {
      query = query.eq('lingkungan_id', parseInt(lingkunganId))
    }

    // Apply scope-based filtering for non-admin roles
    if (!auth.isAdmin && auth.lingkunganIds.length > 0) {
      query = query.in('lingkungan_id', auth.lingkunganIds)
    } else if (!auth.isAdmin && auth.lingkunganIds.length === 0) {
      // ketua_wilayah/ketua_lingkungan with no assigned area → no data
      return NextResponse.json({ data: [], count: 0, page, limit, error: null })
    }

    let { data, error, count } = await query

    // Fallback to simple query if join fails
    if (error) {
      console.error('[GET /api/umat/keluarga] Join error:', error.message, '— fallback')
      let simpleQuery = db
        .from('keluarga')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) simpleQuery = simpleQuery.ilike('no_kk_katolik', `%${search}%`)
      if (lingkunganId) simpleQuery = simpleQuery.eq('lingkungan_id', parseInt(lingkunganId))
      if (!auth.isAdmin && auth.lingkunganIds.length > 0) {
        simpleQuery = simpleQuery.in('lingkungan_id', auth.lingkunganIds)
      }

      const fallback = await simpleQuery
      if (fallback.error) {
        return NextResponse.json({ data: null, error: fallback.error.message }, { status: 500 })
      }
      data = fallback.data
      count = fallback.count
    }

    return NextResponse.json({ data, count: count ?? 0, page, limit, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    console.error('[GET /api/umat/keluarga] Caught error:', err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// POST /api/umat/keluarga — admin / ketua_wilayah / ketua_lingkungan
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUserWithRole(request)
    if (!auth) return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })

    // umat cannot create keluarga
    if (auth.role === 'umat') {
      return NextResponse.json({ data: null, error: 'Anda tidak memiliki izin untuk menambah data keluarga.' }, { status: 403 })
    }

    const body: KeluargaInsert = await request.json()

    // Check scope: non-admin must have access to the target lingkungan
    if (!auth.isAdmin && !hasLingkunganAccess(auth, body.lingkungan_id)) {
      return NextResponse.json({
        data: null,
        error: 'Anda tidak memiliki akses ke lingkungan ini.',
      }, { status: 403 })
    }

    const db = createAdminClient()
    const { data, error } = await db
      .from('keluarga')
      .insert(body)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/umat/keluarga] Error:', err)
    const message = err?.message || (typeof err === 'string' ? err : 'Terjadi kesalahan server.')
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
