'use client'

import { useEffect, useState, useCallback } from 'react'

interface UserOption {
  id: string
  email: string
  role: string | null
}

interface Wilayah {
  id: number
  nama: string
  ketua_id: string | null
  lingkungan: Lingkungan[]
}

interface Lingkungan {
  id: number
  nama: string
  wilayah_id: number
  ketua_id: string | null
  wilayah?: { id: number; nama: string }
}

export default function WilayahLingkunganPage() {
  const [wilayahList, setWilayahList] = useState<Wilayah[]>([])
  const [userOptions, setUserOptions] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Wilayah modal
  const [showWilayahModal, setShowWilayahModal] = useState(false)
  const [editingWilayah, setEditingWilayah] = useState<Wilayah | null>(null)
  const [wilayahForm, setWilayahForm] = useState({ nama: '', ketua_id: '' })
  const [saving, setSaving] = useState(false)

  // Lingkungan modal
  const [showLingkunganModal, setShowLingkunganModal] = useState(false)
  const [editingLingkungan, setEditingLingkungan] = useState<Lingkungan | null>(null)
  const [lingkunganForm, setLingkunganForm] = useState({ nama: '', wilayah_id: 0, ketua_id: '' })

  // Expanded wilayah
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/umat/wilayah')
    const json = await res.json()
    setWilayahList(json.data ?? [])
    setLoading(false)
  }, [])

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users')
    const json = await res.json()
    setUserOptions((json.data ?? []).map((u: any) => ({ id: u.id, email: u.email, role: u.role })))
  }, [])

  useEffect(() => { fetchData(); fetchUsers() }, [fetchData, fetchUsers])

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const getUserEmail = (userId: string | null) => {
    if (!userId) return null
    return userOptions.find(u => u.id === userId)?.email ?? userId.slice(0, 8) + '...'
  }

  // ─── Wilayah CRUD ───────────────────────────────────────────────────────────
  const openAddWilayah = () => {
    setEditingWilayah(null)
    setWilayahForm({ nama: '', ketua_id: '' })
    setError(null)
    setShowWilayahModal(true)
  }

  const openEditWilayah = (w: Wilayah) => {
    setEditingWilayah(w)
    setWilayahForm({ nama: w.nama, ketua_id: w.ketua_id ?? '' })
    setError(null)
    setShowWilayahModal(true)
  }

  const handleSaveWilayah = async () => {
    if (!wilayahForm.nama.trim()) { setError('Nama wilayah wajib diisi.'); return }
    setSaving(true); setError(null)
    const method = editingWilayah ? 'PUT' : 'POST'
    const url = editingWilayah ? `/api/umat/wilayah/${editingWilayah.id}` : '/api/umat/wilayah'
    const payload: any = { nama: wilayahForm.nama.trim() }
    if (wilayahForm.ketua_id) payload.ketua_id = wilayahForm.ketua_id
    else payload.ketua_id = null
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setSaving(false); return }
    setSaving(false); setShowWilayahModal(false); fetchData()
  }

  const handleDeleteWilayah = async (w: Wilayah) => {
    if (w.lingkungan && w.lingkungan.length > 0) {
      alert('Tidak bisa menghapus wilayah yang masih memiliki lingkungan. Hapus lingkungan terlebih dahulu.')
      return
    }
    if (!confirm(`Hapus wilayah "${w.nama}"?`)) return
    await fetch(`/api/umat/wilayah/${w.id}`, { method: 'DELETE' })
    fetchData()
  }

  // ─── Lingkungan CRUD ────────────────────────────────────────────────────────
  const openAddLingkungan = (wilayahId: number) => {
    setEditingLingkungan(null)
    setLingkunganForm({ nama: '', wilayah_id: wilayahId, ketua_id: '' })
    setError(null)
    setShowLingkunganModal(true)
  }

  const openEditLingkungan = (l: Lingkungan) => {
    setEditingLingkungan(l)
    setLingkunganForm({ nama: l.nama, wilayah_id: l.wilayah_id, ketua_id: l.ketua_id ?? '' })
    setError(null)
    setShowLingkunganModal(true)
  }

  const handleSaveLingkungan = async () => {
    if (!lingkunganForm.nama.trim()) { setError('Nama lingkungan wajib diisi.'); return }
    if (!lingkunganForm.wilayah_id) { setError('Pilih wilayah.'); return }
    setSaving(true); setError(null)
    const method = editingLingkungan ? 'PUT' : 'POST'
    const url = editingLingkungan ? `/api/umat/lingkungan/${editingLingkungan.id}` : '/api/umat/lingkungan'
    const payload: any = { nama: lingkunganForm.nama.trim(), wilayah_id: lingkunganForm.wilayah_id }
    if (lingkunganForm.ketua_id) payload.ketua_id = lingkunganForm.ketua_id
    else payload.ketua_id = null
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setSaving(false); return }
    setSaving(false); setShowLingkunganModal(false); fetchData()
  }

  const handleDeleteLingkungan = async (l: Lingkungan) => {
    if (!confirm(`Hapus lingkungan "${l.nama}"?`)) return
    const res = await fetch(`/api/umat/lingkungan/${l.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.error) { alert(json.error); return }
    fetchData()
  }

  // Filter users by role for dropdowns
  const ketuaWilayahUsers = userOptions.filter(u => u.role === 'ketua_wilayah')
  const ketuaLingkunganUsers = userOptions.filter(u => u.role === 'ketua_lingkungan')

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Wilayah & Lingkungan</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola struktur wilayah, lingkungan, dan penugasan ketua.</p>
        </div>
        <button
          onClick={openAddWilayah}
          className="bg-[#800020] hover:bg-[#a3002a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-red-900/20 flex items-center gap-2"
        >
          <span>+</span> Tambah Wilayah
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Memuat data...</div>
        ) : wilayahList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-3">🗺️</span>
            <p className="text-sm">Belum ada data wilayah. Tambahkan wilayah baru.</p>
          </div>
        ) : (
          wilayahList.map((w) => {
            const isExpanded = expanded.has(w.id)
            return (
              <div key={w.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">
                {/* Wilayah Header */}
                <div className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => toggleExpand(w.id)}>
                  <span className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▸</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800">{w.nama}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500">{w.lingkungan?.length ?? 0} lingkungan</span>
                      {w.ketua_id && (
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                          👤 {getUserEmail(w.ketua_id)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openAddLingkungan(w.id)} className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition">+ Lingkungan</button>
                    <button onClick={() => openEditWilayah(w)} className="text-blue-600 hover:text-blue-800 font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">Edit</button>
                    <button onClick={() => handleDeleteWilayah(w)} className="text-red-500 hover:text-red-700 font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Hapus</button>
                  </div>
                </div>

                {/* Lingkungan List */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {(!w.lingkungan || w.lingkungan.length === 0) ? (
                      <div className="px-6 py-8 text-center text-gray-400 text-sm">Belum ada lingkungan di wilayah ini.</div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {w.lingkungan.map((l) => (
                          <div key={l.id} className="flex items-center gap-4 px-6 py-3.5 pl-14 hover:bg-gray-50/50 transition-colors">
                            <div className="w-2 h-2 rounded-full bg-[#800020] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-700">{l.nama}</span>
                              {l.ketua_id && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full ml-2">
                                  👤 {getUserEmail(l.ketua_id)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEditLingkungan({ ...l, wilayah_id: w.id })} className="text-blue-600 hover:text-blue-800 font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">Edit</button>
                              <button onClick={() => handleDeleteLingkungan({ ...l, wilayah_id: w.id })} className="text-red-500 hover:text-red-700 font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Hapus</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Modal: Wilayah */}
      {showWilayahModal && (
        <Modal title={editingWilayah ? 'Edit Wilayah' : 'Tambah Wilayah'} onClose={() => setShowWilayahModal(false)}>
          {error && <ErrorBox msg={error} />}
          <Field label="Nama Wilayah *">
            <input className={inputCls} value={wilayahForm.nama} onChange={(e) => setWilayahForm({ ...wilayahForm, nama: e.target.value })} placeholder="Contoh: Wilayah I" autoFocus />
          </Field>
          <Field label="Ketua Wilayah">
            <select className={inputCls} value={wilayahForm.ketua_id} onChange={(e) => setWilayahForm({ ...wilayahForm, ketua_id: e.target.value })}>
              <option value="">— Belum ditugaskan —</option>
              {ketuaWilayahUsers.map(u => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
            {ketuaWilayahUsers.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">💡 Belum ada user dengan role &quot;Ketua Wilayah&quot;. Set role di menu Kelola Pengguna.</p>
            )}
          </Field>
          <ModalFooter onCancel={() => setShowWilayahModal(false)} onSave={handleSaveWilayah} saving={saving} />
        </Modal>
      )}

      {/* Modal: Lingkungan */}
      {showLingkunganModal && (
        <Modal title={editingLingkungan ? 'Edit Lingkungan' : 'Tambah Lingkungan'} onClose={() => setShowLingkunganModal(false)}>
          {error && <ErrorBox msg={error} />}
          <Field label="Nama Lingkungan *">
            <input className={inputCls} value={lingkunganForm.nama} onChange={(e) => setLingkunganForm({ ...lingkunganForm, nama: e.target.value })} placeholder="Contoh: St. Yosef" autoFocus />
          </Field>
          <Field label="Wilayah *">
            <select className={inputCls} value={lingkunganForm.wilayah_id} onChange={(e) => setLingkunganForm({ ...lingkunganForm, wilayah_id: parseInt(e.target.value) })}>
              <option value={0} disabled>— Pilih Wilayah —</option>
              {wilayahList.map((w) => (
                <option key={w.id} value={w.id}>{w.nama}</option>
              ))}
            </select>
          </Field>
          <Field label="Ketua Lingkungan">
            <select className={inputCls} value={lingkunganForm.ketua_id} onChange={(e) => setLingkunganForm({ ...lingkunganForm, ketua_id: e.target.value })}>
              <option value="">— Belum ditugaskan —</option>
              {ketuaLingkunganUsers.map(u => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
            {ketuaLingkunganUsers.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">💡 Belum ada user dengan role &quot;Ketua Lingkungan&quot;. Set role di menu Kelola Pengguna.</p>
            )}
          </Field>
          <ModalFooter onCancel={() => setShowLingkunganModal(false)} onSave={handleSaveLingkungan} saving={saving} />
        </Modal>
      )}
    </div>
  )
}

// ─── Shared Sub-components ────────────────────────────────────────────────────
const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#800020]/40 focus:border-[#800020] transition bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{msg}</div>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function ModalFooter({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
      <button onClick={onCancel} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>
      <button onClick={onSave} disabled={saving} className="bg-[#800020] text-white px-5 py-2.5 text-sm rounded-lg font-semibold hover:bg-[#a3002a] transition disabled:opacity-60">
        {saving ? 'Menyimpan...' : 'Simpan'}
      </button>
    </div>
  )
}
