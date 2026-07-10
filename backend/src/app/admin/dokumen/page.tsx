'use client'

import { useCallback, useEffect, useState } from 'react'

interface DokumenRow {
  id: string
  user_id: string
  judul: string
  kategori: string
  file_path: string
  file_name: string
  file_size: number | null
  keterangan: string | null
  status: string
  created_at: string
  users_roles: {
    nama_lengkap: string | null
    role: string
  }
}

const KATEGORI_OPTIONS = ['Semua', 'Umum', 'Sakramen', 'Administrasi', 'Keuangan', 'Lainnya']

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminDokumenPage() {
  const [dokumen, setDokumen] = useState<DokumenRow[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [kategoriFilter, setKategoriFilter] = useState('Semua')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const LIMIT = 20

  const fetchDokumen = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
    })
    if (search) params.set('search', search)
    if (kategoriFilter !== 'Semua') params.set('kategori', kategoriFilter)

    const res = await fetch(`/api/admin/dokumen?${params}`)
    const json = await res.json()
    setDokumen(json.data ?? [])
    setCount(json.count ?? 0)
    setLoading(false)
  }, [page, search, kategoriFilter])

  useEffect(() => { fetchDokumen() }, [fetchDokumen])

  const handleDelete = async (doc: DokumenRow) => {
    if (!confirm(`Hapus dokumen "${doc.judul}"? Tindakan ini tidak dapat dibatalkan.`)) return
    setDeletingId(doc.id)
    setErrorMsg(null)
    const res = await fetch(`/api/admin/dokumen?id=${doc.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.error) {
      setErrorMsg(json.error)
    } else {
      setSuccessMsg(`Dokumen "${doc.judul}" berhasil dihapus.`)
      setTimeout(() => setSuccessMsg(null), 3000)
      fetchDokumen()
    }
    setDeletingId(null)
  }

  const handleVerify = async (doc: DokumenRow, status: 'aktif' | 'ditolak') => {
    const action = status === 'aktif' ? 'menyetujui' : 'menolak'
    if (!confirm(`Apakah Anda yakin ingin ${action} dokumen "${doc.judul}"?`)) return
    setVerifyingId(doc.id)
    setErrorMsg(null)
    const res = await fetch(`/api/admin/dokumen`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: doc.id, status })
    })
    const json = await res.json()
    if (json.error) {
      setErrorMsg(json.error)
    } else {
      setSuccessMsg(`Dokumen "${doc.judul}" berhasil di${status === 'aktif' ? 'setujui' : 'tolak'}.`)
      setTimeout(() => setSuccessMsg(null), 3000)
      fetchDokumen()
    }
    setVerifyingId(null)
  }

  const handleViewFile = async (doc: DokumenRow) => {
    // Open signed URL in new tab
    const res = await fetch(`/api/admin/dokumen/signed-url?id=${doc.id}`)
    const json = await res.json()
    if (json.data?.signed_url) {
      window.open(json.data.signed_url, '_blank')
    } else {
      setErrorMsg('Gagal membuka file. Coba lagi.')
    }
  }

  const totalPages = Math.ceil(count / LIMIT)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dokumen Umat</h1>
        <p className="text-gray-500 text-sm mt-1">
          Semua dokumen PDF yang diupload oleh umat. Total: <span className="font-semibold text-gray-700">{count}</span> dokumen.
        </p>
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <span>✅</span> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <span>❌</span> {errorMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="🔍 Cari judul atau nama file..."
          className="flex-1 min-w-[240px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] bg-white"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/30"
          value={kategoriFilter}
          onChange={e => { setKategoriFilter(e.target.value); setPage(1) }}
        >
          {KATEGORI_OPTIONS.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            Memuat data dokumen...
          </div>
        ) : dokumen.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-3">📄</span>
            <p className="text-sm">Belum ada dokumen yang diupload.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3.5 text-gray-500 font-medium">Dokumen</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">Pengunggah</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">Kategori</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">Ukuran</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">Tanggal Upload</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">Status</th>
                <th className="text-right px-6 py-3.5 text-gray-500 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dokumen.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <span className="text-lg">📄</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{doc.judul}</div>
                        <div className="text-xs text-gray-400 mt-0.5 font-mono truncate max-w-[200px]">{doc.file_name}</div>
                        {doc.keterangan && (
                          <div className="text-xs text-gray-400 mt-0.5 italic">{doc.keterangan}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-700">
                      {doc.users_roles?.nama_lengkap ?? '—'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {doc.users_roles?.role === 'umat' ? 'Umat' : doc.users_roles?.role}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                      {doc.kategori}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-xs">
                    {formatBytes(doc.file_size)}
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-xs">
                    {new Date(doc.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      doc.status === 'aktif' ? 'bg-green-50 text-green-600' :
                      doc.status === 'ditolak' ? 'bg-red-50 text-red-600' :
                      'bg-yellow-50 text-yellow-600'
                    }`}>
                      {doc.status === 'aktif' ? 'Aktif' :
                       doc.status === 'ditolak' ? 'Ditolak' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewFile(doc)}
                          className="text-[#800020] hover:text-[#a3002a] font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-[#800020]/5 transition"
                        >
                          👁 Lihat
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          disabled={deletingId === doc.id}
                          className="text-red-500 hover:text-red-700 font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                        >
                          {deletingId === doc.id ? '...' : '🗑 Hapus'}
                        </button>
                      </div>
                      {(!doc.status || doc.status === 'pending') && (
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => handleVerify(doc, 'aktif')}
                            disabled={verifyingId === doc.id}
                            className="bg-green-100 text-green-700 hover:bg-green-200 font-medium text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                          >
                            ✓ Setujui
                          </button>
                          <button
                            onClick={() => handleVerify(doc, 'ditolak')}
                            disabled={verifyingId === doc.id}
                            className="bg-red-100 text-red-700 hover:bg-red-200 font-medium text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                          >
                            ✕ Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-gray-500">
            Menampilkan {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, count)} dari {count} dokumen
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
            >
              ← Sebelumnya
            </button>
            <span className="text-sm text-gray-600 px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
