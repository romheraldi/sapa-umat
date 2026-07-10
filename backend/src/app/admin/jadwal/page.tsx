'use client'

import { useEffect, useState, useCallback } from 'react'
import type { JadwalIbadah, ScheduleCategoryType } from '@/types/database'

const CATEGORIES: ScheduleCategoryType[] = ['Misa', 'Adorasi', 'Ibadat', 'Sakramen', 'Kegiatan']

/** Returns today's date in YYYY-MM-DD format (local time) */
function getToday(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

type FormState = {
  judul: string
  kategori: ScheduleCategoryType
  tanggal: string
  waktu_mulai: string
  lokasi: string
  keterangan: string
  is_special: boolean
}

/** emptyForm is a function so tanggal always defaults to TODAY */
const makeEmptyForm = (): FormState => ({
  judul: '',
  kategori: 'Misa',
  tanggal: getToday(),
  waktu_mulai: '',
  lokasi: 'Gereja Utama',
  keterangan: '',
  is_special: false,
})

export default function JadwalPage() {
  const [jadwal, setJadwal] = useState<JadwalIbadah[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(makeEmptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filterKategori, setFilterKategori] = useState<string>('Semua')
  const [error, setError] = useState<string | null>(null)

  const fetchJadwal = useCallback(async () => {
    setLoading(true)
    const query = filterKategori !== 'Semua' ? `?kategori=${filterKategori}` : ''
    const res = await fetch(`/api/jadwal${query}`)
    const json = await res.json()
    setJadwal(json.data ?? [])
    setLoading(false)
  }, [filterKategori])

  useEffect(() => { fetchJadwal() }, [fetchJadwal])

  const openAdd = () => { setEditingId(null); setForm(makeEmptyForm()); setError(null); setShowModal(true) }
  const openEdit = (j: JadwalIbadah) => {
    setEditingId(j.id)
    setForm({
      judul: j.judul,
      kategori: j.kategori,
      tanggal: j.tanggal,
      waktu_mulai: j.waktu_mulai,
      lokasi: j.lokasi,
      keterangan: j.keterangan ?? '',
      is_special: j.is_special,
    })
    setError(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    const judul = form.judul.trim()
    const tanggal = form.tanggal.trim()
    const waktu_mulai = form.waktu_mulai.trim()
    const lokasi = form.lokasi.trim()

    if (!judul) { setError('Judul wajib diisi.'); return }
    if (!tanggal) { setError('Tanggal wajib dipilih.'); return }
    if (!waktu_mulai) { setError('Waktu Mulai wajib diisi.'); return }
    if (!lokasi) { setError('Lokasi wajib diisi.'); return }

    setSaving(true); setError(null)

    const payload = {
      judul,
      kategori: form.kategori,
      tanggal,
      waktu_mulai,
      waktu_selesai: null,
      lokasi,
      keterangan: form.keterangan.trim() || null,
      is_special: form.is_special,
    }

    const method = editingId ? 'PUT' : 'POST'
    const url = editingId ? `/api/jadwal/${editingId}` : '/api/jadwal'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setSaving(false); return }
    setSaving(false); setShowModal(false); fetchJadwal()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus jadwal ini?')) return
    setDeleting(id)
    await fetch(`/api/jadwal/${id}`, { method: 'DELETE' })
    setDeleting(null); fetchJadwal()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Jadwal Ibadah</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola jadwal misa, adorasi, dan kegiatan gereja.</p>
        </div>
        <button onClick={openAdd} className="bg-[#800020] hover:bg-[#a3002a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-red-900/20 flex items-center gap-2">
          <span>+</span> Tambah Jadwal
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['Semua', ...CATEGORIES].map((k) => (
          <button key={k} onClick={() => setFilterKategori(k)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterKategori === k ? 'bg-[#800020] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>{k}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Memuat data...</div>
        ) : jadwal.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-3">📅</span>
            <p className="text-sm">Belum ada jadwal. Tambahkan jadwal baru.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3.5 text-gray-500 font-medium">Judul</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">Kategori</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">Tanggal</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">Waktu Mulai</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">Lokasi</th>
                <th className="text-right px-6 py-3.5 text-gray-500 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {jadwal.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{j.judul}</div>
                    {j.is_special && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mt-0.5 inline-block">Khusus</span>}
                  </td>
                  <td className="px-4 py-4"><span className="bg-[#800020]/10 text-[#800020] px-2.5 py-1 rounded-full text-xs font-medium">{j.kategori}</span></td>
                  <td className="px-4 py-4 text-gray-600">{new Date(j.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-4 text-gray-600">{j.waktu_mulai}</td>
                  <td className="px-4 py-4 text-gray-600 max-w-[150px] truncate">{j.lokasi}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openEdit(j)} className="text-blue-600 hover:text-blue-800 font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">Edit</button>
                    <button onClick={() => handleDelete(j.id)} disabled={deleting === j.id} className="text-red-500 hover:text-red-700 font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-40">{deleting === j.id ? '...' : 'Hapus'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

              <Field label="Judul *">
                <input className={inputCls} value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Misa Minggu Pagi" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Kategori *">
                  <select className={inputCls} value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value as ScheduleCategoryType })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Tanggal *">
                  <input
                    type="date"
                    className={inputCls}
                    value={form.tanggal}
                    autoComplete="off"
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    onInput={(e) => {
                      const v = (e.target as HTMLInputElement).value
                      if (v) setForm((prev) => ({ ...prev, tanggal: v }))
                    }}
                  />
                </Field>
              </div>

              <Field label="Waktu Mulai *">
                <input type="time" className={inputCls} value={form.waktu_mulai} onChange={(e) => setForm({ ...form, waktu_mulai: e.target.value })} />
              </Field>

              <Field label="Lokasi *">
                <input className={inputCls} value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
              </Field>

              <Field label="Keterangan">
                <textarea className={inputCls} rows={2} value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
              </Field>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_special} onChange={(e) => setForm({ ...form, is_special: e.target.checked })} className="w-4 h-4 accent-[#800020]" />
                <span className="text-sm text-gray-700">Tandai sebagai jadwal khusus</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>
              <button onClick={handleSave} disabled={saving} className="bg-[#800020] text-white px-5 py-2.5 text-sm rounded-lg font-semibold hover:bg-[#a3002a] transition disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#800020]/40 focus:border-[#800020] transition'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
