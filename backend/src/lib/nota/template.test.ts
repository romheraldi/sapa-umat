import { describe, expect, it } from 'vitest'
import { namaBerkasNota, renderNotaPdf } from '@/lib/nota/template'
import type { NotaData } from '@/lib/nota/tipe'

const NOTA: NotaData = {
  nomor: 'NOTA/2026/000123',
  metode: 'qris',
  paidAt: '2026-08-20T07:01:20.000Z',
  orderId: 'IURAN-1755123456-a3f91b2c',
  noKk: '3275-0001',
  alamat: 'Jl. Melati No. 10, Bekasi',
  baris: [
    { nama: 'Iuran Bulanan', bulan: 1, tahun: 2026, nominal: 50000 },
    { nama: 'Iuran Bulanan', bulan: 2, tahun: 2026, nominal: 50000 },
  ],
  total: 100000,
}

describe('namaBerkasNota', () => {
  it('mengganti garis miring supaya aman jadi nama berkas', () => {
    expect(namaBerkasNota('NOTA/2026/000123')).toBe('NOTA-2026-000123.pdf')
  })
})

describe('renderNotaPdf', () => {
  it('menghasilkan berkas PDF yang sah', async () => {
    const buffer = await renderNotaPdf(NOTA)
    expect(buffer.length).toBeGreaterThan(1000)
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  }, 30000)

  it('tetap jalan untuk nota satu baris', async () => {
    const buffer = await renderNotaPdf({ ...NOTA, baris: [NOTA.baris[0]], total: 50000 })
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-')
  }, 30000)
})
