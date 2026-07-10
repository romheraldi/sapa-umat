import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUserWithRole } from '@/lib/supabase/auth-helper'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/dokumen/signed-url?id=... — get signed URL for viewing
export async function GET(request: NextRequest) {
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
    return NextResponse.json({ data: null, error: 'ID diperlukan.' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data: doc } = await db
    .from('dokumen_umat')
    .select('file_path')
    .eq('id', id)
    .single()

  if (!doc) {
    return NextResponse.json({ data: null, error: 'Dokumen tidak ditemukan.' }, { status: 404 })
  }

  const { data: signedUrl, error } = await db.storage
    .from('dokumen-umat')
    .createSignedUrl(doc.file_path, 3600)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { signed_url: signedUrl?.signedUrl }, error: null })
}
