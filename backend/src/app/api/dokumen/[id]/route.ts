import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/supabase/auth-helper'
import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/dokumen/[id] — hapus dokumen milik user yang sedang login
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ data: null, error: 'Tidak terautentikasi.' }, { status: 401 })
  }

  const { id } = await params
  const db = createAdminClient()

  // Verify the document belongs to this user
  const { data: dokumen, error: fetchError } = await db
    .from('dokumen_umat')
    .select('id, file_path, user_id')
    .eq('id', id)
    .single()

  if (fetchError || !dokumen) {
    return NextResponse.json({ data: null, error: 'Dokumen tidak ditemukan.' }, { status: 404 })
  }

  if (dokumen.user_id !== user.id) {
    return NextResponse.json({ data: null, error: 'Tidak memiliki akses ke dokumen ini.' }, { status: 403 })
  }

  // Delete file from Storage
  const { error: storageError } = await db.storage
    .from('dokumen-umat')
    .remove([dokumen.file_path])

  if (storageError) {
    console.error('Storage delete error:', storageError)
    // Continue to delete DB record even if storage delete fails
  }

  // Delete metadata from DB
  const { error: deleteError } = await db
    .from('dokumen_umat')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ data: null, error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id }, error: null })
}

// GET /api/dokumen/[id] — get dokumen detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ data: null, error: 'Tidak terautentikasi.' }, { status: 401 })
  }

  const { id } = await params
  const db = createAdminClient()

  const { data, error } = await db
    .from('dokumen_umat')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ data: null, error: 'Dokumen tidak ditemukan.' }, { status: 404 })
  }

  // Generate a signed URL for downloading
  const { data: signedUrl } = await db.storage
    .from('dokumen-umat')
    .createSignedUrl(data.file_path, 3600) // 1 hour expiry

  return NextResponse.json({
    data: { ...data, signed_url: signedUrl?.signedUrl ?? null },
    error: null,
  })
}
