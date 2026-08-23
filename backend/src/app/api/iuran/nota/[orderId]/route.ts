import { NextRequest, NextResponse } from 'next/server'
import { ambilNota } from '@/lib/nota/data'
import { namaBerkasNota, renderNotaPdf } from '@/lib/nota/template'

export const runtime = 'nodejs'

// GET /api/iuran/nota/[orderId] — unduh nota PDF untuk satu transaksi lunas
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { data: null, error: 'Parameter orderId wajib diisi.' },
        { status: 400 }
      )
    }

    const hasil = await ambilNota(request, orderId)
    if (!hasil.ok) {
      return NextResponse.json(
        { data: null, error: hasil.pesan },
        { status: hasil.status }
      )
    }

    const pdf = await renderNotaPdf(hasil.nota)

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(pdf.length),
        'Content-Disposition': `attachment; filename="${namaBerkasNota(hasil.nota.nomor)}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    const pesan = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    console.error('[GET /api/iuran/nota] Caught error:', pesan)
    return NextResponse.json(
      { data: null, error: 'Gagal membuat nota.' },
      { status: 500 }
    )
  }
}
