'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { Pengumuman, AnnouncementCategoryType } from '@/types/database'

const CATEGORIES: AnnouncementCategoryType[] = ['Liturgi', 'Kegiatan', 'Sakramen', 'Sosial', 'Umum']

type FormState = {
  judul: string
  kategori: AnnouncementCategoryType
  ringkasan: string
  konten_lengkap: string
  is_pinned: boolean
  image_url: string
  published_at: string
}

const emptyForm: FormState = {
  judul: '',
  kategori: 'Umum',
  ringkasan: '',
  konten_lengkap: '',
  is_pinned: false,
  image_url: '',
  published_at: new Date().toISOString().slice(0, 16),
}

export default function PengumumanPage() {
  const [list, setList] = useState<Pengumuman[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState<string>('Semua')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Upload gambar
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterKategori !== 'Semua') params.set('kategori', filterKategori)
    if (search) params.set('search', search)
    const res = await fetch(`/api/pengumuman?${params}`)
    const json = await res.json()
    setList(json.data ?? [])
    setLoading(false)
  }, [filterKategori, search])

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(t)
  }, [fetchData])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setImagePreview(null)
    setError(null)
    setShowModal(true)
  }

  const openEdit = (p: Pengumuman) => {
    setEditingId(p.id)
    setForm({
      judul: p.judul,
      kategori: p.kategori,
      ringkasan: p.ringkasan,
      konten_lengkap: p.konten_lengkap,
      is_pinned: p.is_pinned,
      image_url: p.image_url ?? '',
      published_at: p.published_at.slice(0, 16),
    })
    setImagePreview(p.image_url ?? null)
    setError(null)
    setShowModal(true)
  }

  // ── Handle file upload ──────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview lokal
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)

    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/pengumuman/upload-image', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.error) {
        setError(`Upload gagal: ${json.error}`)
        setImagePreview(null)
      } else {
        setForm(prev => ({ ...prev, image_url: json.data.url }))
      }
    } catch {
      setError('Upload gagal. Coba lagi.')
      setImagePreview(null)
    } finally {
      setUploading(false)
      // Reset input agar file yang sama bisa diupload ulang
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setForm(prev => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.judul || !form.ringkasan || !form.konten_lengkap) {
      setError('Lengkapi semua field wajib.'); return
    }
    setSaving(true); setError(null)
    const method = editingId ? 'PUT' : 'POST'
    const url = editingId ? `/api/pengumuman/${editingId}` : '/api/pengumuman'
    const payload = { ...form, image_url: form.image_url || null }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json()
    if (json.error) { setError(json.error); setSaving(false); return }
    setSaving(false); setShowModal(false); fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus berita ini?')) return
    setDeleting(id)
    await fetch(`/api/pengumuman/${id}`, { method: 'DELETE' })
    setDeleting(null); fetchData()
  }

  const togglePin = async (p: Pengumuman) => {
    await fetch(`/api/pengumuman/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !p.is_pinned }),
    })
    fetchData()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Berita & Pengumuman</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola berita dan pengumuman paroki.</p>
        </div>
        <button onClick={openAdd} className="bg-[#800020] hover:bg-[#a3002a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-red-900/20 flex items-center gap-2">
          <span>+</span> Tambah Berita
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Cari berita..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#800020]/40 focus:border-[#800020] bg-white"
        />
        <div className="flex gap-2 flex-wrap">
          {['Semua', ...CATEGORIES].map((k) => (
            <button key={k} onClick={() => setFilterKategori(k)} className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${filterKategori === k ? 'bg-[#800020] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>{k}</button>
          ))}
        </div>
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Memuat data...</div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-5xl mb-3">📰</span>
          <p className="text-sm">Belum ada berita.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((p) => (
            <div key={p.id} className={`bg-white rounded-2xl border ${p.is_pinned ? 'border-amber-300 shadow-amber-100' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all overflow-hidden`}>
              <div className="flex items-start gap-4 p-5">
                {/* Thumbnail */}
                {p.image_url && (
                  <img src={p.image_url} alt={p.judul} className="w-20 h-20 object-cover rounded-xl shrink-0 border border-gray-100" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {p.is_pinned && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">📌 Pinned</span>}
                    <span className="text-xs bg-[#800020]/10 text-[#800020] px-2.5 py-0.5 rounded-full font-medium">{p.kategori}</span>
                    <span className="text-xs text-gray-400">{new Date(p.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-base">{p.judul}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.ringkasan}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => togglePin(p)} title={p.is_pinned ? 'Unpin' : 'Pin'} className={`p-2 rounded-lg text-sm transition ${p.is_pinned ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}>📌</button>
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition text-sm">✏️</button>
                  <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition text-sm disabled:opacity-40">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Berita' : 'Tambah Berita'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

              <Field label="Judul *">
                <input className={inputCls} value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Judul berita..." />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Kategori *">
                  <select className={inputCls} value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value as AnnouncementCategoryType })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Tanggal Publikasi *">
                  <input type="datetime-local" className={inputCls} value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} />
                </Field>
              </div>

              <Field label="Ringkasan *">
                <textarea className={inputCls} rows={2} value={form.ringkasan} onChange={(e) => setForm({ ...form, ringkasan: e.target.value })} placeholder="Deskripsi singkat berita..." />
              </Field>

              <Field label="Konten Lengkap *">
                <textarea className={inputCls} rows={5} value={form.konten_lengkap} onChange={(e) => setForm({ ...form, konten_lengkap: e.target.value })} placeholder="Isi berita lengkap..." />
              </Field>

              {/* ── Upload Foto ── */}
              <Field label="Foto Berita (opsional)">
                <div className="space-y-3">
                  {/* Preview */}
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-gray-200" />
                      {uploading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
                          <div className="flex items-center gap-2 text-[#800020] font-medium text-sm">
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Mengupload...
                          </div>
                        </div>
                      )}
                      {!uploading && (
                        <button onClick={removeImage} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition shadow">✕</button>
                      )}
                    </div>
                  )}

                  {/* Upload button */}
                  {!imagePreview && (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#800020] hover:bg-[#800020]/5 transition-all group">
                      <span className="text-3xl mb-2">📷</span>
                      <span className="text-sm font-medium text-gray-600 group-hover:text-[#800020]">Klik untuk upload foto</span>
                      <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · Maks. 5MB</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}

                  {/* Atau input URL manual */}
                  {!imagePreview && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400">atau URL gambar</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  {!imagePreview && (
                    <input
                      className={inputCls}
                      value={form.image_url}
                      onChange={(e) => {
                        setForm({ ...form, image_url: e.target.value })
                        setImagePreview(e.target.value || null)
                      }}
                      placeholder="https://example.com/gambar.jpg"
                    />
                  )}
                </div>
              </Field>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} className="w-4 h-4 accent-[#800020]" />
                <span className="text-sm text-gray-700">Sematkan (Pin) di atas daftar</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>
              <button onClick={handleSave} disabled={saving || uploading} className="bg-[#800020] text-white px-5 py-2.5 text-sm rounded-lg font-semibold hover:bg-[#a3002a] transition disabled:opacity-60 flex items-center gap-2">
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#800020]/40 focus:border-[#800020] transition bg-white'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
