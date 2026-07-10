import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUserWithRole } from '@/lib/supabase/auth-helper'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/dokumen — list semua dokumen (admin only)
export async function GET(request: NextRequest) {
  const auth = await getAuthUserWithRole(request)
  if (!auth) {
    return NextResponse.json({ data: null, error: 'Tidak terautentikasi.' }, { status: 401 })
  }
  if (!auth.isAdmin) {
    return NextResponse.json({ data: null, error: 'Akses ditolak.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const search = searchParams.get('search') ?? ''
  const kategori = searchParams.get('kategori') ?? ''
  const from = (page - 1) * limit
  const to = from + limit - 1

  const db = createAdminClient()

  let query = db
    .from('dokumen_umat')
    .select(`
      *,
      users_roles!inner(nama_lengkap, role)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(`judul.ilike.%${search}%,file_name.ilike.%${search}%`)
  }
  if (kategori && kategori !== 'Semua') {
    query = query.eq('kategori', kategori)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    count: count ?? 0,
    page,
    limit,
    error: null,
  })
}

// DELETE /api/admin/dokumen?id=... — admin hapus dokumen
export async function DELETE(request: NextRequest) {
  const auth = await getAuthUserWithRole(request)
  if (!auth) {
    return NextResponse.json({ data: null, error: 'Tidak terautentikasi.' }, { status: 401 })
  }
  if (!auth.isAdmin) {
    return NextResponse.json({ data: null, error: 'Akses ditolak.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ data: null, error: 'ID dokumen diperlukan.' }, { status: 400 })
  }

  const db = createAdminClient()

  // Get file path first
  const { data: dokumen } = await db
    .from('dokumen_umat')
    .select('file_path')
    .eq('id', id)
    .single()

  if (!dokumen) {
    return NextResponse.json({ data: null, error: 'Dokumen tidak ditemukan.' }, { status: 404 })
  }

  // Delete from storage
  await db.storage.from('dokumen-umat').remove([dokumen.file_path])

  // Delete from DB
  const { error } = await db.from('dokumen_umat').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id }, error: null })
}

// PATCH /api/admin/dokumen — admin verifikasi (update status) dokumen
export async function PATCH(request: NextRequest) {
  const auth = await getAuthUserWithRole(request)
  if (!auth) {
    return NextResponse.json({ data: null, error: 'Tidak terautentikasi.' }, { status: 401 })
  }
  if (!auth.isAdmin) {
    return NextResponse.json({ data: null, error: 'Akses ditolak.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ data: null, error: 'ID dokumen dan status wajib diisi.' }, { status: 400 })
    }

    if (!['aktif', 'ditolak', 'pending', 'arsip'].includes(status)) {
      return NextResponse.json({ data: null, error: 'Status tidak valid.' }, { status: 400 })
    }

    const db = createAdminClient()
    const { data, error } = await db
      .from('dokumen_umat')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
