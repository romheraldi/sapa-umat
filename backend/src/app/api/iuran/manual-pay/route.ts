import { getAuthUserWithRole } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/iuran/manual-pay
// Body: { tagihan_ids: string[] }
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUserWithRole(request)
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ data: null, error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const body = await request.json()
    const { tagihan_ids } = body as { tagihan_ids: string[] }

    if (!tagihan_ids || !Array.isArray(tagihan_ids) || tagihan_ids.length === 0) {
      return NextResponse.json(
        { data: null, error: 'Parameter tagihan_ids wajib diisi dan berupa array tidak kosong.' },
        { status: 400 }
      )
    }

    const db = createAdminClient()

    const { error: updateError } = await db
      .from('tagihan_iuran')
      .update({
        status: 'lunas',
        midtrans_transaction_id: 'MANUAL',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', tagihan_ids)

    if (updateError) {
      console.error('[POST /api/iuran/manual-pay] Update error:', updateError.message)
      return NextResponse.json(
        { data: null, error: 'Gagal memperbarui status tagihan menjadi lunas.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: 'success', error: null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    console.error('[POST /api/iuran/manual-pay] Caught error:', err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
