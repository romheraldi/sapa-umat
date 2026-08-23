import { describe, expect, it } from 'vitest'
import {
  deriveMetode,
  formatPeriode,
  formatRupiah,
  labelMetode,
} from '@/lib/nota/tipe'

describe('deriveMetode', () => {
  it('mengenali pembayaran manual', () => {
    expect(deriveMetode('MANUAL-1755123456-a3f9')).toBe('manual')
  })

  it('mengenali data lama hasil backfill', () => {
    expect(deriveMetode('LEGACY-d41d8cd98f00b204e9800998ecf8427e')).toBe('legacy')
  })

  it('menganggap sisanya pembayaran QRIS', () => {
    expect(deriveMetode('IURAN-1755123456-a3f91b2c')).toBe('qris')
  })
})

describe('labelMetode', () => {
  it('memberi label yang bisa dibaca umat', () => {
    expect(labelMetode('qris')).toBe('QRIS')
    expect(labelMetode('manual')).toBe('Tunai / Manual')
    expect(labelMetode('legacy')).toBe('Tercatat Lunas')
  })
})

describe('formatRupiah', () => {
  it('memakai pemisah ribuan Indonesia', () => {
    expect(formatRupiah(50000)).toBe('Rp 50.000')
  })

  it('menangani nol', () => {
    expect(formatRupiah(0)).toBe('Rp 0')
  })
})

describe('formatPeriode', () => {
  it('menulis nama bulan dan tahun', () => {
    expect(formatPeriode(1, 2026)).toBe('Januari 2026')
    expect(formatPeriode(12, 2026)).toBe('Desember 2026')
  })
})
