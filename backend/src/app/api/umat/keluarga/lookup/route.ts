import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/supabase/auth-helper'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/umat/keluarga/lookup?no_kk=KK-2026-0001
//
// Dipakai layar klaim di mobile untuk menampilkan pilihan nama anggota.
// Sengaja hanya mengembalikan id + nama_lengkap: tanggal lahir dipakai sebagai
// faktor verifikasi di POST /api/umat/klaim, jadi tidak boleh bocor di sini.
// Alamat dan nomor telepon keluarga juga tidak ikut.
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const noKk = searchParams.get('no_kk')?.trim()

    if (!noKk) {
      return NextResponse.json(
        { data: null, error: 'Nomor KK Katolik wajib diisi.' },
        { status: 400 }
      )
    }

    const db = createAdminClient()
    const { data: keluarga, error } = await db
      .from('keluarga')
      .select('id, no_kk_katolik, lingkungan(id, nama, wilayah(id, nama)), anggota:umat!umat_keluarga_id_fkey(id, nama_lengkap, user_id)')
      .eq('no_kk_katolik', noKk)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    if (!keluarga) {
      return NextResponse.json(
        { data: null, error: 'Nomor KK Katolik tidak ditemukan.' },
        { status: 404 }
      )
    }

    const anggota = (keluarga.anggota ?? []) as { id: string; nama_lengkap: string; user_id: string | null }[]

    return NextResponse.json({
      data: {
        no_kk_katolik: keluarga.no_kk_katolik,
        lingkungan: keluarga.lingkungan,
        anggota_tersedia: anggota
          .filter(a => a.user_id === null)
          .map(a => ({ id: a.id, nama_lengkap: a.nama_lengkap })),
      },
      error: null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    console.error('[GET /api/umat/keluarga/lookup] Caught error:', err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
