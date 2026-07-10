import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/pengumuman/upload-image
 * Upload gambar untuk pengumuman ke Supabase Storage bucket 'pengumuman-images'
 * Returns: { data: { url: string }, error: null }
 */
export async function POST(request: NextRequest) {
  try {
    // Verifikasi auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ data: null, error: 'File tidak ditemukan.' }, { status: 400 })
    }

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ data: null, error: 'Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP.' }, { status: 400 })
    }

    // Validasi ukuran (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ data: null, error: 'Ukuran file maksimal 5MB.' }, { status: 400 })
    }

    const db = createAdminClient()

    // Generate nama file unik
    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const filePath = `pengumuman/${fileName}`

    // Upload ke Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await db.storage
      .from('pengumuman-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[upload-image] Storage error:', uploadError)
      // Jika bucket belum ada, buat bucket terlebih dahulu
      if (uploadError.message?.includes('Bucket not found')) {
        await db.storage.createBucket('pengumuman-images', { public: true })
        // Coba upload ulang
        const { error: retryError } = await db.storage
          .from('pengumuman-images')
          .upload(filePath, buffer, { contentType: file.type, upsert: false })
        if (retryError) throw retryError
      } else {
        throw uploadError
      }
    }

    // Dapatkan public URL
    const { data: urlData } = db.storage
      .from('pengumuman-images')
      .getPublicUrl(filePath)

    return NextResponse.json({
      data: { url: urlData.publicUrl, path: filePath },
      error: null,
    }, { status: 201 })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal mengupload gambar.'
    console.error('[upload-image] Error:', err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
