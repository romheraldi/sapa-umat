import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/umat/wilayah — semua wilayah beserta lingkungan-nya
export async function GET() {
  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from('wilayah')
      .select('*, lingkungan(*)')
      .order('id', { ascending: true })

    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// POST /api/umat/wilayah — tambah wilayah baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.nama) {
      return NextResponse.json({ data: null, error: 'Nama wilayah wajib diisi.' }, { status: 400 })
    }

    const db = createAdminClient()
    const payload: any = { nama: body.nama }
    if (body.ketua_id !== undefined) payload.ketua_id = body.ketua_id

    const { data, error } = await db
      .from('wilayah')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch (err: any) {
    const message = err?.message || 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
