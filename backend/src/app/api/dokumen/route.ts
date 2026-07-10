import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/supabase/auth-helper'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/dokumen — list dokumen milik user yang sedang login
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ data: null, error: 'Tidak terautentikasi.' }, { status: 401 })
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('dokumen_umat')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}

// POST /api/dokumen — simpan metadata dokumen setelah file diupload ke Storage
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ data: null, error: 'Tidak terautentikasi.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { judul, kategori, file_path, file_name, file_size, keterangan } = body

    if (!judul || !file_path || !file_name) {
      return NextResponse.json(
        { data: null, error: 'Judul, file_path, dan file_name wajib diisi.' },
        { status: 400 }
      )
    }

    const db = createAdminClient()
    const { data, error } = await db
      .from('dokumen_umat')
      .insert({
        user_id: user.id,
        judul: judul.trim(),
        kategori: kategori ?? 'Umum',
        file_path,
        file_name,
        file_size: file_size ?? null,
        keterangan: keterangan?.trim() ?? null,
        status: 'pending', // Menunggu verifikasi admin
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
