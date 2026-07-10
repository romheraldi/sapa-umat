import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUserWithRole } from '@/lib/supabase/auth-helper'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/umat/lingkungan — semua lingkungan (opsional filter by wilayah_id)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wilayahId = searchParams.get('wilayah_id')

    const db = createAdminClient()
    let query = db
      .from('lingkungan')
      .select('*, wilayah(id, nama)')
      .order('wilayah_id', { ascending: true })
      .order('nama', { ascending: true })

    if (wilayahId) query = query.eq('wilayah_id', parseInt(wilayahId))

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch (err: any) {
    const message = err?.message || 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// POST /api/umat/lingkungan — tambah lingkungan baru
// Allowed: admin_paroki, pastor, ketua_wilayah (only in their wilayah)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUserWithRole(request)
    if (!auth) return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })

    const body = await request.json()
    if (!body.nama || !body.wilayah_id) {
      return NextResponse.json({ data: null, error: 'Nama lingkungan dan wilayah wajib diisi.' }, { status: 400 })
    }

    // Check permission
    if (!auth.isAdmin) {
      if (auth.role === 'ketua_wilayah') {
        if (!auth.wilayahIds.includes(body.wilayah_id)) {
          return NextResponse.json({ data: null, error: 'Anda hanya bisa menambah lingkungan di wilayah Anda.' }, { status: 403 })
        }
      } else {
        return NextResponse.json({ data: null, error: 'Anda tidak memiliki izin.' }, { status: 403 })
      }
    }

    const db = createAdminClient()
    const payload: any = { nama: body.nama, wilayah_id: body.wilayah_id }
    if (body.ketua_id !== undefined) payload.ketua_id = body.ketua_id

    const { data, error } = await db
      .from('lingkungan')
      .insert(payload)
      .select('*, wilayah(id, nama)')
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch (err: any) {
    const message = err?.message || 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
