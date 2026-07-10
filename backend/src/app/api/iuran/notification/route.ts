import { createAdminClient } from '@/lib/supabase/admin'
import { verifyNotificationSignature } from '@/lib/midtrans'
import { NextRequest, NextResponse } from 'next/server'
import type { MidtransNotificationBody } from '@/lib/midtrans'

// POST /api/iuran/notification
// Midtrans Webhook — NO authentication required (Midtrans calls this)
export async function POST(request: NextRequest) {
  try {
    const body: MidtransNotificationBody = await request.json()

    const {
      order_id,
      transaction_status,
      transaction_id,
      status_code,
      gross_amount,
      signature_key,
      fraud_status,
    } = body

    // Verify notification signature
    const isValid = verifyNotificationSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    )

    if (!isValid) {
      console.error('[POST /api/iuran/notification] Invalid signature for order:', order_id)
      return NextResponse.json(
        { status: 'error', message: 'Invalid signature' },
        { status: 403 }
      )
    }

    const db = createAdminClient()

    // Determine new status based on transaction_status
    let newStatus: string
    let paidAt: string | null = null

    if (
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept')
    ) {
      newStatus = 'lunas'
      paidAt = new Date().toISOString()
    } else if (
      transaction_status === 'expire' ||
      transaction_status === 'cancel' ||
      transaction_status === 'deny'
    ) {
      newStatus = 'kadaluarsa'
    } else if (transaction_status === 'pending') {
      newStatus = 'menunggu_pembayaran'
    } else {
      // Unknown status, log and acknowledge
      console.warn(
        '[POST /api/iuran/notification] Unknown transaction_status:',
        transaction_status,
        'for order:',
        order_id
      )
      return NextResponse.json({ status: 'ok' })
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      status: newStatus,
      midtrans_transaction_id: transaction_id,
      updated_at: new Date().toISOString(),
    }

    if (paidAt) {
      updateData.paid_at = paidAt
    }

    // Update tagihan by midtrans_order_id
    const { error: updateError } = await db
      .from('tagihan_iuran')
      .update(updateData)
      .eq('midtrans_order_id', order_id)

    if (updateError) {
      console.error(
        '[POST /api/iuran/notification] Update error for order:',
        order_id,
        updateError.message
      )
      return NextResponse.json(
        { status: 'error', message: 'Failed to update tagihan' },
        { status: 500 }
      )
    }

    console.log(
      `[POST /api/iuran/notification] Updated order ${order_id}: status=${newStatus}`
    )

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[POST /api/iuran/notification] Caught error:', err)
    return NextResponse.json(
      { status: 'error', message },
      { status: 500 }
    )
  }
}
