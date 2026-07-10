import { getAuthUserWithRole } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTransactionStatus } from '@/lib/midtrans'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/iuran/status/[orderId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const auth = await getAuthUserWithRole(request)
    if (!auth) {
      return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
    }

    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { data: null, error: 'Parameter orderId wajib diisi.' },
        { status: 400 }
      )
    }

    // Get tagihan from DB by midtrans_order_id
    const db = createAdminClient()
    const { data: tagihan } = await db
      .from('tagihan_iuran')
      .select('id, status, paid_at, keluarga_id')
      .eq('midtrans_order_id', orderId)
      .single()

    // Get transaction status from Midtrans
    let midtransStatus
    try {
      midtransStatus = await getTransactionStatus(orderId)
    } catch (err) {
      console.error('[GET /api/iuran/status] Midtrans error:', err)
      // Return DB status even if Midtrans call fails
      return NextResponse.json({
        data: {
          transaction_status: null,
          tagihan_status: tagihan?.status ?? null,
          paid_at: tagihan?.paid_at ?? null,
          midtrans_error: err instanceof Error ? err.message : 'Gagal mengambil status dari Midtrans',
        },
        error: null,
      })
    }

    return NextResponse.json({
      data: {
        transaction_status: midtransStatus.transaction_status,
        tagihan_status: tagihan?.status ?? null,
        paid_at: tagihan?.paid_at ?? null,
      },
      error: null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    console.error('[GET /api/iuran/status] Caught error:', err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
