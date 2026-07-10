import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// PUT /api/umat/wilayah/:id — update wilayah
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    if (!body.nama) {
      return NextResponse.json({ data: null, error: 'Nama wilayah wajib diisi.' }, { status: 400 })
    }

    const db = createAdminClient()
    const payload: any = { nama: body.nama }
    if (body.ketua_id !== undefined) payload.ketua_id = body.ketua_id

    const { data, error } = await db
      .from('wilayah')
      .update(payload)
      .eq('id', parseInt(id))
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch (err: any) {
    const message = err?.message || 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// DELETE /api/umat/wilayah/:id — hapus wilayah
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const db = createAdminClient()
    const { error } = await db
      .from('wilayah')
      .delete()
      .eq('id', parseInt(id))

    if (error) throw error
    return NextResponse.json({ data: null, error: null })
  } catch (err: any) {
    const message = err?.message || 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
