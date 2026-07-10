'use client'

import { useState, useEffect } from 'react'

type Tagihan = {
  id: string
  keluarga_id: string
  iuran_config_id: number
  bulan: number
  tahun: number
  nominal: number
  status: string
  midtrans_order_id: string | null
  midtrans_transaction_id: string | null
  paid_at: string | null
  iuran_config?: {
    nama: string
  }
  keluarga?: {
    no_kk_katolik: string
  }
}

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default function AdminIuranPage() {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const [tagihanList, setTagihanList] = useState<Tagihan[]>([])
  const [loading, setLoading] = useState(false)
  const [bulanFilter, setBulanFilter] = useState(currentMonth.toString())
  const [tahunFilter, setTahunFilter] = useState(currentYear.toString())
  const [generating, setGenerating] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchTagihan = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (bulanFilter) query.append('bulan', bulanFilter)
      if (tahunFilter) query.append('tahun', tahunFilter)
      
      const res = await fetch(`/api/iuran?${query.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setTagihanList(json.data || [])
      } else {
        alert('Gagal memuat data: ' + json.error)
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan saat memuat data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTagihan()
  }, [bulanFilter, tahunFilter])

  const handleGenerate = async () => {
    if (!confirm(`Generate tagihan untuk bulan ${bulanNames[currentMonth]} ${currentYear}?`)) return
    
    setGenerating(true)
    try {
      const res = await fetch('/api/iuran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulan: currentMonth, tahun: currentYear }),
      })
      const json = await res.json()
      if (res.ok) {
        alert(`Berhasil membuat ${json.data.created} tagihan baru. Dilewati: ${json.data.skipped}.`)
        fetchTagihan()
      } else {
        alert('Gagal generate: ' + json.error)
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan.')
    } finally {
      setGenerating(false)
    }
  }

  const handleTandaiLunas = async (id: string) => {
    if (!confirm('Tandai tagihan ini lunas secara manual?')) return

    setActionLoadingId(id)
    try {
      const res = await fetch('/api/iuran/manual-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagihan_ids: [id] }),
      })
      const json = await res.json()
      if (res.ok) {
        fetchTagihan()
      } else {
        alert('Gagal menandai lunas: ' + json.error)
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan.')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Iuran Bulanan</h1>
          <p className="text-gray-500 mt-1 text-sm">Manajemen penagihan dan pembayaran iuran umat.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-[#800020] hover:bg-red-900 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm disabled:opacity-50"
        >
          {generating ? 'Memproses...' : 'Generate Tagihan Bulan Ini'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Bulan</label>
          <select
            value={bulanFilter}
            onChange={(e) => setBulanFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent bg-white text-gray-800"
          >
            <option value="">Semua Bulan</option>
            {bulanNames.map((b, i) => b ? <option key={i} value={i}>{b}</option> : null)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tahun</label>
          <input
            type="number"
            value={tahunFilter}
            onChange={(e) => setTahunFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent bg-white text-gray-800 w-32"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">No. KK</th>
                <th className="px-6 py-4">Periode</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Memuat data...
                  </td>
                </tr>
              ) : tagihanList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Tidak ada tagihan untuk filter ini.
                  </td>
                </tr>
              ) : (
                tagihanList.map((tagihan) => (
                  <tr key={tagihan.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {tagihan.keluarga?.no_kk_katolik ?? tagihan.keluarga_id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {bulanNames[tagihan.bulan]} {tagihan.tahun}
                      <div className="text-xs text-gray-400">{tagihan.iuran_config?.nama}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-medium">
                      Rp {tagihan.nominal.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      {tagihan.status === 'belum_bayar' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Belum Bayar
                        </span>
                      )}
                      {tagihan.status === 'menunggu_pembayaran' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Menunggu
                        </span>
                      )}
                      {tagihan.status === 'lunas' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Lunas
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(tagihan.status === 'belum_bayar' || tagihan.status === 'menunggu_pembayaran') && (
                        <button
                          onClick={() => handleTandaiLunas(tagihan.id)}
                          disabled={actionLoadingId === tagihan.id}
                          className="text-xs font-medium text-[#800020] hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoadingId === tagihan.id ? 'Loading...' : 'Tandai Lunas'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
