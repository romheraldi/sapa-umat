import { getAuthUserWithRole } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { createQrisCharge } from '@/lib/midtrans'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// POST /api/iuran/bayar
// Body: { tagihan_ids: string[] }
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUserWithRole(request)
    if (!auth) {
      return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
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

    // Get tagihan with joined iuran_config
    const { data: tagihans, error: tagihanError } = await db
      .from('tagihan_iuran')
      .select('*, iuran_config(*)')
      .in('id', tagihan_ids)

    if (tagihanError || !tagihans || tagihans.length !== tagihan_ids.length) {
      return NextResponse.json(
        { data: null, error: 'Satu atau lebih tagihan tidak ditemukan.' },
        { status: 404 }
      )
    }

    let totalNominal = 0

    // Validate status and calculate total
    for (const tagihan of tagihans) {
      if (tagihan.status !== 'belum_bayar' && tagihan.status !== 'menunggu_pembayaran' && tagihan.status !== 'kadaluarsa') {
        return NextResponse.json(
          { data: null, error: `Tagihan dengan ID ${tagihan.id} tidak dapat dibayar. Status saat ini: ${tagihan.status}` },
          { status: 400 }
        )
      }
      totalNominal += tagihan.nominal
    }

    // Validate ownership: user must own these tagihan (via keluarga → umat → user_id) OR be admin
    if (!auth.isAdmin) {
      const { data: umatRow } = await db
        .from('umat')
        .select('keluarga_id')
        .eq('user_id', auth.user.id)
        .limit(1)
        .single()

      if (!umatRow) {
         return NextResponse.json(
          { data: null, error: 'Anda tidak memiliki akses ke tagihan ini.' },
          { status: 403 }
        )
      }

      for (const tagihan of tagihans) {
        if (umatRow.keluarga_id !== tagihan.keluarga_id) {
          return NextResponse.json(
            { data: null, error: 'Anda tidak memiliki akses ke beberapa tagihan ini.' },
            { status: 403 }
          )
        }
      }
    }

    // Generate unique order ID
    const randomSuffix = crypto.randomBytes(4).toString('hex')
    const orderId = `IURAN-${Date.now()}-${randomSuffix}`

    const itemName = `Pembayaran Iuran (${tagihan_ids.length} Tagihan)`

    // Call Midtrans to create QRIS charge
    const chargeResponse = await createQrisCharge(orderId, totalNominal, [
      {
        id: `iuran-multi`,
        name: itemName,
        price: totalNominal,
        quantity: 1,
      },
    ])

    // Extract QR URL from actions array
    let qrUrl = ''
    if (chargeResponse.actions && chargeResponse.actions.length > 0) {
      const generateAction = chargeResponse.actions.find(
        (a: any) => a.name === 'generate-qr-code'
      )
      qrUrl = generateAction?.url ?? chargeResponse.actions[0].url
    }

    // Update tagihan status and order_id
    const { error: updateError } = await db
      .from('tagihan_iuran')
      .update({
        status: 'menunggu_pembayaran',
        midtrans_order_id: orderId,
        updated_at: new Date().toISOString(),
      })
      .in('id', tagihan_ids)

    if (updateError) {
      console.error('[POST /api/iuran/bayar] Update error:', updateError.message)
      return NextResponse.json(
        { data: null, error: 'Gagal memperbarui status tagihan.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        qr_url: qrUrl,
        order_id: orderId,
        expiry_time: chargeResponse.expiry_time ?? null,
      },
      error: null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    console.error('[POST /api/iuran/bayar] Caught error:', err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
