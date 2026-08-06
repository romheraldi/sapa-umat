import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUserWithRole } from '@/lib/supabase/auth-helper'
import { generateTagihanTahunBerjalan, type GenerateTagihanResult } from '@/lib/iuran/generate-tagihan'
import { NextRequest, NextResponse } from 'next/server'
import type { FamilyStatusType, GenderType, MaritalStatusType } from '@/types/database'

interface KlaimExistingBody {
  mode: 'existing'
  umat_id: string
  tanggal_lahir: string
}

interface KlaimNewBody {
  mode: 'new'
  keluarga: {
    lingkungan_id: number
    alamat_lengkap: string
    no_telepon?: string | null
  }
  data_diri: {
    tempat_lahir: string
    tanggal_lahir: string
    jenis_kelamin: GenderType
    status_dalam_keluarga: FamilyStatusType
    status_perkawinan: MaritalStatusType
    status_baptis: boolean
    status_krisma: boolean
  }
}

type KlaimBody = KlaimExistingBody | KlaimNewBody

const GENDER: GenderType[] = ['L', 'P']
const FAMILY_STATUS: FamilyStatusType[] = ['Suami', 'Istri', 'Anak', 'Lainnya']
const MARITAL_STATUS: MaritalStatusType[] = ['Belum Menikah', 'Menikah Katolik', 'Lainnya']

/** Samakan format tanggal ke YYYY-MM-DD supaya bisa dibandingkan apa adanya. */
function normalizeTanggal(value: string): string {
  return value.trim().slice(0, 10)
}

// POST /api/umat/klaim
//
// Menautkan akun umat ke sebuah keluarga, lalu menggenerate tagihan iuran
// 12 bulan tahun berjalan.
//
//   mode 'existing' → klaim anggota keluarga yang sudah didata admin
//   mode 'new'      → daftarkan keluarga baru (ditandai belum terverifikasi)
//
// Dipanggil saat registrasi maupun dari layar "lengkapi data" di dalam app,
// sehingga alurnya identik di kedua pintu masuk.
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUserWithRole(request)
    if (!auth) {
      return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
    }

    if (auth.role !== 'umat') {
      return NextResponse.json(
        { data: null, error: 'Fitur ini hanya untuk akun umat.' },
        { status: 403 }
      )
    }

    const db = createAdminClient()

    // Satu akun hanya boleh tertaut ke satu anggota.
    const { data: existingUmat } = await db
      .from('umat')
      .select('id')
      .eq('user_id', auth.user.id)
      .maybeSingle()

    if (existingUmat) {
      return NextResponse.json(
        { data: null, error: 'Akun Anda sudah tertaut ke sebuah keluarga.' },
        { status: 409 }
      )
    }

    const body = (await request.json()) as KlaimBody

    if (body?.mode === 'existing') {
      return await klaimExisting(db, auth.user.id, body)
    }
    if (body?.mode === 'new') {
      return await daftarKeluargaBaru(db, auth.user.id, body)
    }

    return NextResponse.json(
      { data: null, error: 'Mode tidak valid. Pilih "existing" atau "new".' },
      { status: 400 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    console.error('[POST /api/umat/klaim] Caught error:', err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

// ─── Mode: klaim keluarga existing ───────────────────────────────────────────

type AdminDb = ReturnType<typeof createAdminClient>

async function klaimExisting(db: AdminDb, userId: string, body: KlaimExistingBody) {
  if (!body.umat_id || !body.tanggal_lahir) {
    return NextResponse.json(
      { data: null, error: 'Anggota dan tanggal lahir wajib diisi.' },
      { status: 400 }
    )
  }

  const { data: umat } = await db
    .from('umat')
    .select('id, keluarga_id, tanggal_lahir, user_id')
    .eq('id', body.umat_id)
    .maybeSingle()

  // Pesan sengaja generik dan sama untuk semua kegagalan validasi, supaya
  // nomor KK tidak bisa dipakai menebak tanggal lahir anggota.
  const tidakCocok = NextResponse.json(
    { data: null, error: 'Data tidak cocok.' },
    { status: 400 }
  )

  if (!umat || umat.user_id !== null) return tidakCocok
  if (normalizeTanggal(umat.tanggal_lahir) !== normalizeTanggal(body.tanggal_lahir)) {
    return tidakCocok
  }

  // Guard balapan: hanya menang kalau saat update user_id masih kosong.
  const { data: updated, error: updateError } = await db
    .from('umat')
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .eq('id', umat.id)
    .is('user_id', null)
    .select('id, keluarga_id')

  if (updateError) {
    return NextResponse.json({ data: null, error: updateError.message }, { status: 500 })
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { data: null, error: 'Anggota ini baru saja ditautkan ke akun lain.' },
      { status: 409 }
    )
  }

  const { data: keluarga } = await db
    .from('keluarga')
    .select('no_kk_katolik')
    .eq('id', umat.keluarga_id)
    .single()

  return respondSukses(db, umat.keluarga_id, keluarga?.no_kk_katolik ?? null)
}

// ─── Mode: daftar keluarga baru ──────────────────────────────────────────────

async function daftarKeluargaBaru(db: AdminDb, userId: string, body: KlaimNewBody) {
  const { keluarga: formKeluarga, data_diri: formDiri } = body

  if (!formKeluarga?.lingkungan_id || !formKeluarga?.alamat_lengkap?.trim()) {
    return NextResponse.json(
      { data: null, error: 'Lingkungan dan alamat lengkap wajib diisi.' },
      { status: 400 }
    )
  }

  if (
    !formDiri?.tempat_lahir?.trim() ||
    !formDiri?.tanggal_lahir ||
    !GENDER.includes(formDiri.jenis_kelamin) ||
    !FAMILY_STATUS.includes(formDiri.status_dalam_keluarga) ||
    !MARITAL_STATUS.includes(formDiri.status_perkawinan)
  ) {
    return NextResponse.json(
      { data: null, error: 'Data diri belum lengkap atau tidak valid.' },
      { status: 400 }
    )
  }

  const { data: lingkungan } = await db
    .from('lingkungan')
    .select('id')
    .eq('id', formKeluarga.lingkungan_id)
    .maybeSingle()

  if (!lingkungan) {
    return NextResponse.json({ data: null, error: 'Lingkungan tidak valid.' }, { status: 400 })
  }

  // nama_lengkap diambil dari akun, bukan dari body, supaya konsisten dengan
  // nama yang dipakai saat registrasi.
  const { data: userRole } = await db
    .from('users_roles')
    .select('nama_lengkap')
    .eq('id', userId)
    .maybeSingle()

  const namaLengkap = userRole?.nama_lengkap?.trim()
  if (!namaLengkap) {
    return NextResponse.json(
      { data: null, error: 'Nama lengkap akun belum terisi. Hubungi admin paroki.' },
      { status: 400 }
    )
  }

  const { data: noKk, error: noKkError } = await db.rpc('next_no_kk_katolik')
  if (noKkError || !noKk) {
    return NextResponse.json(
      { data: null, error: noKkError?.message ?? 'Gagal membuat nomor KK Katolik.' },
      { status: 500 }
    )
  }

  const { data: keluargaBaru, error: keluargaError } = await db
    .from('keluarga')
    .insert({
      no_kk_katolik: noKk,
      lingkungan_id: formKeluarga.lingkungan_id,
      alamat_lengkap: formKeluarga.alamat_lengkap.trim(),
      no_telepon: formKeluarga.no_telepon?.trim() || null,
      is_verified: false,
      created_by: userId,
    })
    .select('id, no_kk_katolik')
    .single()

  if (keluargaError || !keluargaBaru) {
    return NextResponse.json(
      { data: null, error: keluargaError?.message ?? 'Gagal menyimpan data keluarga.' },
      { status: 500 }
    )
  }

  const { data: umatBaru, error: umatError } = await db
    .from('umat')
    .insert({
      keluarga_id: keluargaBaru.id,
      user_id: userId,
      nama_lengkap: namaLengkap,
      tempat_lahir: formDiri.tempat_lahir.trim(),
      tanggal_lahir: normalizeTanggal(formDiri.tanggal_lahir),
      jenis_kelamin: formDiri.jenis_kelamin,
      status_dalam_keluarga: formDiri.status_dalam_keluarga,
      status_perkawinan: formDiri.status_perkawinan,
      status_baptis: !!formDiri.status_baptis,
      status_krisma: !!formDiri.status_krisma,
    })
    .select('id')
    .single()

  if (umatError || !umatBaru) {
    // Rollback: keluarga tanpa anggota tidak berguna dan mengotori data admin.
    await db.from('keluarga').delete().eq('id', keluargaBaru.id)
    return NextResponse.json(
      { data: null, error: umatError?.message ?? 'Gagal menyimpan data diri.' },
      { status: 500 }
    )
  }

  const { error: kepalaError } = await db
    .from('keluarga')
    .update({ kepala_keluarga_id: umatBaru.id, updated_at: new Date().toISOString() })
    .eq('id', keluargaBaru.id)

  if (kepalaError) {
    await db.from('umat').delete().eq('id', umatBaru.id)
    await db.from('keluarga').delete().eq('id', keluargaBaru.id)
    return NextResponse.json({ data: null, error: kepalaError.message }, { status: 500 })
  }

  return respondSukses(db, keluargaBaru.id, keluargaBaru.no_kk_katolik)
}

// ─── Response bersama ────────────────────────────────────────────────────────

/**
 * Tautan keluarga adalah hasil utama endpoint ini, jadi kegagalan generate
 * tagihan tidak membatalkan klaim — dilaporkan lewat `warning`. Tagihan masih
 * bisa disusul cron bulanan atau POST /api/iuran.
 */
async function respondSukses(db: AdminDb, keluargaId: string, noKk: string | null) {
  let tagihan: GenerateTagihanResult | null = null
  let warning: string | null = null

  try {
    tagihan = await generateTagihanTahunBerjalan(db, keluargaId)
  } catch (err) {
    warning = err instanceof Error ? err.message : 'Gagal membuat tagihan iuran.'
    console.error('[POST /api/umat/klaim] Error generating tagihan:', err)
  }

  return NextResponse.json(
    {
      data: { keluarga_id: keluargaId, no_kk_katolik: noKk, tagihan, warning },
      error: null,
    },
    { status: 201 }
  )
}
