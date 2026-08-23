import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUserWithRole } from '@/lib/supabase/auth-helper'
import { bolehAksesNota, type ScopeAkses } from '@/lib/nota/akses'
import { deriveMetode, type BarisNota, type NotaData } from '@/lib/nota/tipe'

export type HasilNota =
  | { ok: true; nota: NotaData }
  | { ok: false; status: 400 | 403 | 404 | 500; pesan: string }

export async function ambilNota(
  request: NextRequest,
  orderId: string
): Promise<HasilNota> {
  const auth = await getAuthUserWithRole(request)
  if (!auth) {
    return { ok: false, status: 403, pesan: 'Anda harus masuk untuk mengunduh nota.' }
  }

  const db = createAdminClient()

  const { data: tagihans, error: tagihanError } = await db
    .from('tagihan_iuran')
    .select('id, bulan, tahun, nominal, status, keluarga_id, iuran_config(nama)')
    .eq('midtrans_order_id', orderId)
    .order('tahun', { ascending: true })
    .order('bulan', { ascending: true })

  if (tagihanError) {
    console.error('[ambilNota] Query tagihan gagal:', tagihanError.message)
    return { ok: false, status: 500, pesan: 'Gagal mengambil data tagihan.' }
  }

  if (!tagihans || tagihans.length === 0) {
    return { ok: false, status: 404, pesan: 'Nota tidak ditemukan.' }
  }

  if (tagihans.some(t => t.status !== 'lunas')) {
    return { ok: false, status: 400, pesan: 'Nota hanya tersedia untuk pembayaran yang sudah lunas.' }
  }

  const keluargaId = tagihans[0].keluarga_id
  if (tagihans.some(t => t.keluarga_id !== keluargaId)) {
    console.error('[ambilNota] Order lintas keluarga:', orderId)
    return { ok: false, status: 500, pesan: 'Data pembayaran tidak konsisten.' }
  }

  const { data: keluarga, error: keluargaError } = await db
    .from('keluarga')
    .select('no_kk_katolik, alamat_lengkap, lingkungan_id')
    .eq('id', keluargaId)
    .single()

  if (keluargaError || !keluarga) {
    return { ok: false, status: 404, pesan: 'Data keluarga tidak ditemukan.' }
  }

  // Umat perlu keluarga_id miliknya sendiri untuk dibandingkan.
  let keluargaMilikPengguna: string | null = null
  if (auth.role === 'umat') {
    const { data: umatRow } = await db
      .from('umat')
      .select('keluarga_id')
      .eq('user_id', auth.user.id)
      .limit(1)
      .maybeSingle()
    keluargaMilikPengguna = umatRow?.keluarga_id ?? null
  }

  const scope: ScopeAkses = {
    isAdmin: auth.isAdmin,
    role: auth.role,
    lingkunganIds: auth.lingkunganIds,
    keluargaId: keluargaMilikPengguna,
  }

  if (!bolehAksesNota(scope, { keluargaId, lingkunganId: keluarga.lingkungan_id })) {
    return { ok: false, status: 403, pesan: 'Anda tidak berhak mengunduh nota ini.' }
  }

  const { data: notaRow, error: notaError } = await db
    .rpc('assign_nota', { p_order_id: orderId })
    .single<{ nomor: string; paid_at: string }>()

  if (notaError || !notaRow) {
    console.error('[ambilNota] assign_nota gagal:', notaError?.message)
    return { ok: false, status: 500, pesan: 'Gagal menerbitkan nomor nota.' }
  }

  const baris: BarisNota[] = tagihans.map(t => ({
    nama: (t.iuran_config as { nama?: string } | null)?.nama ?? 'Iuran Bulanan',
    bulan: t.bulan,
    tahun: t.tahun,
    nominal: t.nominal,
  }))

  return {
    ok: true,
    nota: {
      nomor: notaRow.nomor,
      metode: deriveMetode(orderId),
      paidAt: notaRow.paid_at,
      orderId,
      noKk: keluarga.no_kk_katolik,
      alamat: keluarga.alamat_lengkap,
      baris,
      total: baris.reduce((sum, b) => sum + b.nominal, 0),
    },
  }
}
