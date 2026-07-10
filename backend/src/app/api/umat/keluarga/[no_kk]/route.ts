import { getAuthUserWithRole, hasLingkunganAccess } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import type { KeluargaUpdate, UmatInsert } from '@/types/database'

type Params = { params: Promise<{ no_kk: string }> }

/**
 * Helper: fetch keluarga by no_kk and check role-based access.
 * Returns the keluarga row or an error response.
 */
async function getKeluargaWithAccess(
  request: NextRequest,
  noKk: string,
  requireWrite: boolean = false
) {
  const auth = await getAuthUserWithRole(request)
  if (!auth) {
    return { auth: null, keluarga: null, errorResponse: NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 }) }
  }

  const db = createAdminClient()
  const { data: keluarga, error } = await db
    .from('keluarga')
    .select('*, lingkungan(id, nama, wilayah(id, nama)), anggota:umat(*)')
    .eq('no_kk_katolik', noKk)
    .single()

  if (error || !keluarga) {
    return { auth, keluarga: null, errorResponse: NextResponse.json({ data: null, error: 'Keluarga tidak ditemukan.' }, { status: 404 }) }
  }

  // Check access based on role
  if (auth.isAdmin) {
    return { auth, keluarga, errorResponse: null }
  }

  if (auth.role === 'umat') {
    if (requireWrite) {
      return { auth, keluarga: null, errorResponse: NextResponse.json({ data: null, error: 'Anda tidak memiliki izin.' }, { status: 403 }) }
    }
    // Umat can only view their own keluarga
    const isOwnFamily = keluarga.anggota?.some((u: any) => u.user_id === auth.user.id)
    if (!isOwnFamily) {
      return { auth, keluarga: null, errorResponse: NextResponse.json({ data: null, error: 'Anda tidak memiliki akses ke data ini.' }, { status: 403 }) }
    }
    return { auth, keluarga, errorResponse: null }
  }

  // ketua_wilayah / ketua_lingkungan — check lingkungan scope
  if (!hasLingkunganAccess(auth, keluarga.lingkungan_id)) {
    return { auth, keluarga: null, errorResponse: NextResponse.json({ data: null, error: 'Data ini di luar wilayah/lingkungan Anda.' }, { status: 403 }) }
  }

  return { auth, keluarga, errorResponse: null }
}

// GET /api/umat/keluarga/:no_kk
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { no_kk } = await params
    const { keluarga, errorResponse } = await getKeluargaWithAccess(request, no_kk)
    if (errorResponse) return errorResponse
    return NextResponse.json({ data: keluarga, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// PUT /api/umat/keluarga/:no_kk — update data keluarga
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { no_kk } = await params
    const { auth, errorResponse } = await getKeluargaWithAccess(request, no_kk, true)
    if (errorResponse) return errorResponse

    const body: KeluargaUpdate = await request.json()

    // If changing lingkungan_id, check access to the new lingkungan
    if (body.lingkungan_id && !auth!.isAdmin && !hasLingkunganAccess(auth!, body.lingkungan_id)) {
      return NextResponse.json({ data: null, error: 'Anda tidak memiliki akses ke lingkungan tujuan.' }, { status: 403 })
    }

    const db = createAdminClient()
    const { data, error } = await db
      .from('keluarga')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('no_kk_katolik', no_kk)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// PATCH /api/umat/keluarga/:no_kk — tambah anggota ke keluarga
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { no_kk } = await params
    const { keluarga, errorResponse } = await getKeluargaWithAccess(request, no_kk, true)
    if (errorResponse) return errorResponse

    const body: Omit<UmatInsert, 'keluarga_id'> = await request.json()
    const db = createAdminClient()
    const { data, error } = await db
      .from('umat')
      .insert({ ...body, keluarga_id: keluarga!.id })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
