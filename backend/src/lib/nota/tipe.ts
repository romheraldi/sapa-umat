export type MetodeNota = 'qris' | 'manual' | 'legacy'

export type BarisNota = {
  nama: string
  bulan: number
  tahun: number
  nominal: number
}

export type NotaData = {
  nomor: string
  metode: MetodeNota
  paidAt: string
  orderId: string
  noKk: string
  alamat: string
  baris: BarisNota[]
  total: number
}

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function deriveMetode(orderId: string): MetodeNota {
  if (orderId.startsWith('MANUAL-')) return 'manual'
  if (orderId.startsWith('LEGACY-')) return 'legacy'
  return 'qris'
}

export function labelMetode(metode: MetodeNota): string {
  switch (metode) {
    case 'manual':
      return 'Tunai / Manual'
    case 'legacy':
      return 'Tercatat Lunas'
    default:
      return 'QRIS'
  }
}

export function formatRupiah(nominal: number): string {
  return 'Rp ' + nominal.toLocaleString('id-ID')
}

export function formatPeriode(bulan: number, tahun: number): string {
  return `${BULAN[bulan - 1]} ${tahun}`
}
