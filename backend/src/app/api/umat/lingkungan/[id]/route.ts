import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUserWithRole } from '@/lib/supabase/auth-helper'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

/**
 * Check if user has permission to manage a specific lingkungan.
 * Returns the lingkungan row or null.
 */
async function checkLingkunganAccess(auth: NonNullable<Awaited<ReturnType<typeof getAuthUserWithRole>>>, lingkunganId: number) {
  const db = createAdminClient()
  const { data: lingkungan } = await db
    .from('lingkungan')
    .select('*, wilayah(id, nama)')
    .eq('id', lingkunganId)
    .single()

  if (!lingkungan) return { allowed: false, reason: 'Lingkungan tidak ditemukan.' }

  if (auth.isAdmin) return { allowed: true, reason: null }

  if (auth.role === 'ketua_wilayah') {
    if (auth.wilayahIds.includes(lingkungan.wilayah_id)) return { allowed: true, reason: null }
    return { allowed: false, reason: 'Lingkungan ini di luar wilayah Anda.' }
  }

  return { allowed: false, reason: 'Anda tidak memiliki izin.' }
}

// PUT /api/umat/lingkungan/:id — update lingkungan
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const auth = await getAuthUserWithRole(request)
    if (!auth) return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })

    const { allowed, reason } = await checkLingkunganAccess(auth, parseInt(id))
    if (!allowed) return NextResponse.json({ data: null, error: reason }, { status: 403 })

    const body = await request.json()
    if (!body.nama) {
      return NextResponse.json({ data: null, error: 'Nama lingkungan wajib diisi.' }, { status: 400 })
    }

    const db = createAdminClient()
    const updatePayload: Record<string, unknown> = { nama: body.nama }
    if (body.wilayah_id) updatePayload.wilayah_id = body.wilayah_id
    if (body.ketua_id !== undefined) updatePayload.ketua_id = body.ketua_id

    const { data, error } = await db
      .from('lingkungan')
      .update(updatePayload)
      .eq('id', parseInt(id))
      .select('*, wilayah(id, nama)')
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch (err: any) {
    const message = err?.message || 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// DELETE /api/umat/lingkungan/:id — hapus lingkungan
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const auth = await getAuthUserWithRole(request)
    if (!auth) return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })

    const { allowed, reason } = await checkLingkunganAccess(auth, parseInt(id))
    if (!allowed) return NextResponse.json({ data: null, error: reason }, { status: 403 })

    const db = createAdminClient()
    const { error } = await db
      .from('lingkungan')
      .delete()
      .eq('id', parseInt(id))

    if (error) throw error
    return NextResponse.json({ data: null, error: null })
  } catch (err: any) {
    const message = err?.message || 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
