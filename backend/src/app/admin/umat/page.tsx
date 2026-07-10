'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Keluarga, Umat, UmatInsert, FamilyStatusType, GenderType, MaritalStatusType } from '@/types/database'

interface WilayahWithLingkungan {
  id: number
  nama: string
  lingkungan: { id: number; nama: string }[]
}

interface UserOption {
  id: string
  email: string
  role: string | null
}

interface UserMe {
  role: string
  isAdmin: boolean
  wilayahIds: number[]
  lingkunganIds: number[]
}

const FAMILY_STATUS: FamilyStatusType[] = ['Suami', 'Istri', 'Anak', 'Lainnya']
const MARITAL_STATUS: MaritalStatusType[] = ['Belum Menikah', 'Menikah Katolik', 'Lainnya']

type KeluargaWithStats = Keluarga & { anggota: Umat[] }

const emptyAnggota: Omit<UmatInsert, 'keluarga_id'> = {
  nama_lengkap: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  jenis_kelamin: 'L',
  status_dalam_keluarga: 'Suami',
  status_baptis: false,
  status_krisma: false,
  status_perkawinan: 'Belum Menikah',
  user_id: null,
}

export default function DataUmatPage() {
  const [list, setList] = useState<KeluargaWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<KeluargaWithStats | null>(null)
  const [showAddKeluarga, setShowAddKeluarga] = useState(false)
  const [showAddAnggota, setShowAddAnggota] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Wilayah & Lingkungan data for dropdowns
  const [wilayahList, setWilayahList] = useState<WilayahWithLingkungan[]>([])
  const [scopedWilayahList, setScopedWilayahList] = useState<WilayahWithLingkungan[]>([])
  const [selectedWilayah, setSelectedWilayah] = useState<number>(0)
  const [userOptions, setUserOptions] = useState<UserOption[]>([])

  // User role info
  const [userMe, setUserMe] = useState<UserMe | null>(null)
  const canWrite = userMe ? (userMe.isAdmin || userMe.role === 'ketua_wilayah' || userMe.role === 'ketua_lingkungan') : false

  // Keluarga form
  const [keluargaForm, setKeluargaForm] = useState({ no_kk_katolik: '', lingkungan_id: 0, alamat_lengkap: '', no_telepon: '' })
  // Anggota form
  const [anggotaForm, setAnggotaForm] = useState<Omit<UmatInsert, 'keluarga_id'>>(emptyAnggota)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    const res = await fetch(`/api/umat/keluarga${params}`)
    const json = await res.json()
    setList(json.data ?? [])
    setLoading(false)
  }, [search])

  const fetchWilayah = useCallback(async () => {
    const res = await fetch('/api/umat/wilayah')
    const json = await res.json()
    setWilayahList(json.data ?? [])
  }, [])

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users')
    const json = await res.json()
    setUserOptions((json.data ?? []).map((u: any) => ({ id: u.id, email: u.email, role: u.role })))
  }, [])

  // Fetch user role
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(json => {
        if (json.data) setUserMe(json.data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { fetchWilayah(); fetchUsers() }, [fetchWilayah, fetchUsers])

  // Compute scoped wilayah list based on user role
  useEffect(() => {
    if (!userMe || userMe.isAdmin) {
      setScopedWilayahList(wilayahList)
      return
    }
    if (userMe.role === 'ketua_wilayah') {
      setScopedWilayahList(wilayahList.filter(w => userMe.wilayahIds.includes(w.id)))
    } else if (userMe.role === 'ketua_lingkungan') {
      // Filter wilayah to only those containing the user's lingkungan
      setScopedWilayahList(wilayahList.map(w => ({
        ...w,
        lingkungan: w.lingkungan.filter(l => userMe.lingkunganIds.includes(l.id)),
      })).filter(w => w.lingkungan.length > 0))
    } else {
      setScopedWilayahList([])
    }
  }, [wilayahList, userMe])

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(t)
  }, [fetchData])

  const handleAddKeluarga = async () => {
    if (!keluargaForm.no_kk_katolik || !keluargaForm.alamat_lengkap) {
      setError('Lengkapi No. KK dan alamat.'); return
    }
    if (!keluargaForm.lingkungan_id) {
      setError('Pilih wilayah dan lingkungan.'); return
    }
    setSaving(true); setError(null)
    const res = await fetch('/api/umat/keluarga', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(keluargaForm) })
    const json = await res.json()
    if (json.error) { setError(json.error); setSaving(false); return }
    setSaving(false); setShowAddKeluarga(false); fetchData()
  }

  const handleAddAnggota = async () => {
    if (!selected) return
    if (!anggotaForm.nama_lengkap || !anggotaForm.tanggal_lahir || !anggotaForm.tempat_lahir) {
      setError('Lengkapi nama, tempat, dan tanggal lahir.'); return
    }
    setSaving(true); setError(null)
    const res = await fetch(`/api/umat/keluarga/${selected.no_kk_katolik}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(anggotaForm),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setSaving(false); return }
    setSaving(false); setShowAddAnggota(false)
    // Refresh selected detail
    const res2 = await fetch(`/api/umat/keluarga/${selected.no_kk_katolik}`)
    const json2 = await res2.json()
    if (json2.data) setSelected(json2.data)
    fetchData()
  }

  return (
    <div className="p-8 flex gap-6 h-full">
      {/* LEFT: List */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Data Umat (BASIS)</h1>
            <p className="text-gray-500 text-sm mt-1">Data keluarga dan anggota paroki.</p>
          </div>
          {canWrite && (
            <button onClick={() => { setShowAddKeluarga(true); setError(null) }} className="bg-[#800020] hover:bg-[#a3002a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-red-900/20 flex items-center gap-2">
              <span>+</span> Tambah Keluarga
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="Cari No. KK..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#800020]/40 focus:border-[#800020] bg-white mb-4"
        />

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Memuat data...</div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-3">👨‍👩‍👧‍👦</span>
            <p className="text-sm">Belum ada data keluarga.</p>
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
            {list.map((k) => (
              <button
                key={k.id}
                onClick={() => setSelected(k)}
                className={`w-full text-left bg-white rounded-xl border ${selected?.id === k.id ? 'border-[#800020] ring-2 ring-[#800020]/20' : 'border-gray-100 hover:border-gray-200'} p-4 shadow-sm transition-all`}
              >
                <div className="font-semibold text-gray-800 text-sm">{k.no_kk_katolik}</div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{k.alamat_lengkap}</div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{k.anggota?.length ?? 0} anggota</span>
                  {k.lingkungan && <span className="text-xs text-gray-400">{(k.lingkungan as any)?.nama}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Detail */}
      {selected ? (
        <div className="w-96 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-800">{selected.no_kk_katolik}</div>
              <div className="text-xs text-gray-500 mt-0.5">{selected.alamat_lengkap}</div>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Anggota Keluarga</h3>
              {canWrite && (
                <button onClick={() => { setAnggotaForm(emptyAnggota); setError(null); setShowAddAnggota(true) }} className="text-xs bg-[#800020]/10 text-[#800020] hover:bg-[#800020]/20 px-3 py-1.5 rounded-lg font-medium transition">+ Tambah</button>
              )}
            </div>
            {(!selected.anggota || selected.anggota.length === 0) ? (
              <p className="text-center text-gray-400 text-sm py-8">Belum ada anggota.</p>
            ) : (
              <div className="space-y-2">
                {selected.anggota.map((u) => (
                  <div key={u.id} className="bg-gray-50 rounded-xl p-3.5">
                    <div className="font-medium text-gray-800 text-sm">{u.nama_lengkap}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{u.status_dalam_keluarga} · {u.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {u.status_baptis && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Baptis ✓</span>}
                      {u.status_krisma && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Krisma ✓</span>}
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{u.status_perkawinan}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-96 shrink-0 bg-white rounded-2xl border border-dashed border-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <span className="text-4xl block mb-2">👈</span>
            <p className="text-sm">Pilih keluarga untuk melihat detail</p>
          </div>
        </div>
      )}

      {/* Modal: Tambah Keluarga */}
      {showAddKeluarga && (
        <Modal title="Tambah Keluarga" onClose={() => setShowAddKeluarga(false)}>
          {error && <ErrorBox msg={error} />}
          <Field label="No. KK Katolik *"><input className={inputCls} value={keluargaForm.no_kk_katolik} onChange={(e) => setKeluargaForm({ ...keluargaForm, no_kk_katolik: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Wilayah *">
              <select
                className={inputCls}
                value={selectedWilayah}
                onChange={(e) => {
                  const wId = parseInt(e.target.value)
                  setSelectedWilayah(wId)
                  setKeluargaForm({ ...keluargaForm, lingkungan_id: 0 })
                }}
              >
                <option value={0} disabled>— Pilih Wilayah —</option>
                {scopedWilayahList.map((w) => (
                  <option key={w.id} value={w.id}>{w.nama}</option>
                ))}
              </select>
            </Field>
            <Field label="Lingkungan *">
              <select
                className={inputCls}
                value={keluargaForm.lingkungan_id}
                onChange={(e) => setKeluargaForm({ ...keluargaForm, lingkungan_id: parseInt(e.target.value) })}
                disabled={!selectedWilayah}
              >
                <option value={0} disabled>— Pilih Lingkungan —</option>
                {(scopedWilayahList.find(w => w.id === selectedWilayah)?.lingkungan ?? []).map((l) => (
                  <option key={l.id} value={l.id}>{l.nama}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Alamat Lengkap *"><textarea className={inputCls} rows={2} value={keluargaForm.alamat_lengkap} onChange={(e) => setKeluargaForm({ ...keluargaForm, alamat_lengkap: e.target.value })} /></Field>
          <Field label="No. Telepon"><input className={inputCls} value={keluargaForm.no_telepon} onChange={(e) => setKeluargaForm({ ...keluargaForm, no_telepon: e.target.value })} /></Field>
          <ModalFooter onCancel={() => setShowAddKeluarga(false)} onSave={handleAddKeluarga} saving={saving} />
        </Modal>
      )}

      {/* Modal: Tambah Anggota */}
      {showAddAnggota && (
        <Modal title="Tambah Anggota Keluarga" onClose={() => setShowAddAnggota(false)}>
          {error && <ErrorBox msg={error} />}
          <Field label="Nama Lengkap *"><input className={inputCls} value={anggotaForm.nama_lengkap} onChange={(e) => setAnggotaForm({ ...anggotaForm, nama_lengkap: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status dalam KK">
              <select className={inputCls} value={anggotaForm.status_dalam_keluarga} onChange={(e) => setAnggotaForm({ ...anggotaForm, status_dalam_keluarga: e.target.value as FamilyStatusType })}>
                {FAMILY_STATUS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Jenis Kelamin">
              <select className={inputCls} value={anggotaForm.jenis_kelamin} onChange={(e) => setAnggotaForm({ ...anggotaForm, jenis_kelamin: e.target.value as GenderType })}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tempat Lahir *"><input className={inputCls} value={anggotaForm.tempat_lahir} onChange={(e) => setAnggotaForm({ ...anggotaForm, tempat_lahir: e.target.value })} /></Field>
            <Field label="Tanggal Lahir *"><input type="date" className={inputCls} value={anggotaForm.tanggal_lahir} onChange={(e) => setAnggotaForm({ ...anggotaForm, tanggal_lahir: e.target.value })} /></Field>
          </div>
          <Field label="Status Perkawinan">
            <select className={inputCls} value={anggotaForm.status_perkawinan} onChange={(e) => setAnggotaForm({ ...anggotaForm, status_perkawinan: e.target.value as MaritalStatusType })}>
              {MARITAL_STATUS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <div className="flex gap-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={anggotaForm.status_baptis} onChange={(e) => setAnggotaForm({ ...anggotaForm, status_baptis: e.target.checked })} className="w-4 h-4 accent-[#800020]" />
              <span className="text-sm text-gray-700">Sudah Baptis</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={anggotaForm.status_krisma} onChange={(e) => setAnggotaForm({ ...anggotaForm, status_krisma: e.target.checked })} className="w-4 h-4 accent-[#800020]" />
              <span className="text-sm text-gray-700">Sudah Krisma</span>
            </label>
          </div>
          <Field label="Tautkan Akun Pengguna (Opsional)">
            <select className={inputCls} value={anggotaForm.user_id || ''} onChange={(e) => setAnggotaForm({ ...anggotaForm, user_id: e.target.value || null })}>
              <option value="">— Tidak ditautkan —</option>
              {userOptions.filter(u => u.role === 'umat').map((u) => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hanya pengguna dengan role &quot;Umat&quot; yang bisa ditautkan. Pengguna yang ditautkan dapat melihat data keluarga ini.</p>
          </Field>
          <ModalFooter onCancel={() => setShowAddAnggota(false)} onSave={handleAddAnggota} saving={saving} />
        </Modal>
      )}
    </div>
  )
}

// ─── Shared Sub-components ───────────────────────────────────────────────────
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
