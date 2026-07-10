'use client'

import { useEffect, useState, useCallback } from 'react'

interface UserWithRole {
  id: string
  email: string
  created_at: string
  role: string | null
  ketua_wilayah: { id: number; nama: string }[]
  ketua_lingkungan: { id: number; nama: string }[]
}

const ROLES = [
  { value: 'admin_paroki', label: 'Admin Paroki', color: 'bg-red-100 text-red-700' },
  { value: 'pastor', label: 'Pastor', color: 'bg-purple-100 text-purple-700' },
  { value: 'ketua_wilayah', label: 'Ketua Wilayah', color: 'bg-amber-100 text-amber-700' },
  { value: 'ketua_lingkungan', label: 'Ketua Lingkungan', color: 'bg-blue-100 text-blue-700' },
  { value: 'umat', label: 'Umat', color: 'bg-gray-100 text-gray-600' },
]

function getRoleBadge(role: string | null) {
  const r = ROLES.find(x => x.value === role)
  if (!r) return <span className="text-xs bg-gray-50 text-gray-400 px-2.5 py-1 rounded-full">Belum diset</span>
  return <span className={`text-xs ${r.color} px-2.5 py-1 rounded-full font-medium`}>{r.label}</span>
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modals
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [selectedRole, setSelectedRole] = useState('')

  // Add User Form
  const [addForm, setAddForm] = useState({ email: '', password: '', role: 'admin_paroki' })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const json = await res.json()
    setUsers(json.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openSetRole = (u: UserWithRole) => {
    setSelectedUser(u)
    setSelectedRole(u.role ?? 'umat')
    setError(null)
    setShowRoleModal(true)
  }

  const openAddUser = () => {
    setAddForm({ email: '', password: '', role: 'admin_paroki' })
    setError(null)
    setShowAddModal(true)
  }

  const handleSaveRole = async () => {
    if (!selectedUser) return
    setSaving(selectedUser.id); setError(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_role', user_id: selectedUser.id, role: selectedRole }),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setSaving(null); return }
    setSaving(null); setShowRoleModal(false)
    setSuccess(`Role ${selectedUser.email} berhasil diubah menjadi ${ROLES.find(r => r.value === selectedRole)?.label}.`)
    setTimeout(() => setSuccess(null), 3000)
    fetchUsers()
  }

  const handleAddUser = async () => {
    if (!addForm.email || !addForm.password) {
      setError('Email dan password wajib diisi.')
      return
    }
    setSaving('new'); setError(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...addForm }),
    })
    const json = await res.json()
    if (json.error) { setError(json.error); setSaving(null); return }
    setSaving(null); setShowAddModal(false)
    setSuccess(`Pengguna ${addForm.email} berhasil dibuat dengan role ${ROLES.find(r => r.value === addForm.role)?.label}.`)
    setTimeout(() => setSuccess(null), 3000)
    fetchUsers()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Pengguna & Role</h1>
          <p className="text-gray-500 text-sm mt-1">Atur role pengguna: Admin Paroki, Pastor, Ketua Wilayah, Ketua Lingkungan, atau Umat.</p>
        </div>
        <button
          onClick={openAddUser}
          className="bg-[#800020] hover:bg-[#a3002a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-red-900/20 flex items-center gap-2"
        >
          <span>+</span> Tambah Pengguna Baru
        </button>
      </div>

      {/* Success notification */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <span>✅</span> {success}
        </div>
      )}

      {/* Role Legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ROLES.map(r => (
          <span key={r.value} className={`text-xs ${r.color} px-3 py-1.5 rounded-full font-medium`}>{r.label}</span>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Memuat data pengguna...</div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-3">👤</span>
            <p className="text-sm">Belum ada pengguna terdaftar.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3.5 text-gray-500 font-medium">Email</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">Role</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">Penugasan</th>
                <th className="text-left px-4 py-3.5 text-gray-500 font-medium">Terdaftar</th>
                <th className="text-right px-6 py-3.5 text-gray-500 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{u.email}</div>
                    <div className="text-xs text-gray-400 mt-0.5 font-mono">{u.id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-4 py-4">{getRoleBadge(u.role)}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {u.ketua_wilayah.map(w => (
                        <div key={w.id} className="text-xs text-amber-600">🗺️ {w.nama}</div>
                      ))}
                      {u.ketua_lingkungan.map(l => (
                        <div key={l.id} className="text-xs text-blue-600">🏘️ {l.nama}</div>
                      ))}
                      {u.ketua_wilayah.length === 0 && u.ketua_lingkungan.length === 0 && (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openSetRole(u)}
                      className="text-[#800020] hover:text-[#a3002a] font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-[#800020]/5 transition"
                    >
                      Ubah Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Set Role */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Ubah Role</h2>
              <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1.5">Pengguna</div>
                <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-800">{selectedUser.email}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role *</label>
                <div className="space-y-2">
                  {ROLES.map(r => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                        selectedRole === r.value
                          ? 'border-[#800020] bg-[#800020]/5 ring-1 ring-[#800020]/20'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={selectedRole === r.value}
                        onChange={() => setSelectedRole(r.value)}
                        className="accent-[#800020]"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-800">{r.label}</div>
                        <div className="text-xs text-gray-400">
                          {r.value === 'admin_paroki' && 'Akses penuh ke semua data dan fitur.'}
                          {r.value === 'pastor' && 'Akses penuh, sama seperti Admin Paroki.'}
                          {r.value === 'ketua_wilayah' && 'Kelola data umat & lingkungan di wilayah yang ditugaskan.'}
                          {r.value === 'ketua_lingkungan' && 'Kelola data umat di lingkungan yang ditugaskan.'}
                          {r.value === 'umat' && 'Hanya bisa melihat data keluarga sendiri.'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {(selectedRole === 'ketua_wilayah' || selectedRole === 'ketua_lingkungan') && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg">
                  💡 Setelah mengubah role, tugaskan user ini sebagai ketua di halaman <strong>Wilayah & Lingkungan</strong>.
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowRoleModal(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>
              <button
                onClick={handleSaveRole}
                disabled={saving === selectedUser.id}
                className="bg-[#800020] text-white px-5 py-2.5 text-sm rounded-lg font-semibold hover:bg-[#a3002a] transition disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Tambah Pengguna Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
                <input
                  type="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#800020]/40 focus:border-[#800020] transition bg-white"
                  value={addForm.email}
                  onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="admin@paroki.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password *</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#800020]/40 focus:border-[#800020] transition bg-white"
                  value={addForm.password}
                  onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role *</label>
                <div className="space-y-2">
                  {ROLES.map(r => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                        addForm.role === r.value
                          ? 'border-[#800020] bg-[#800020]/5 ring-1 ring-[#800020]/20'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addRole"
                        value={r.value}
                        checked={addForm.role === r.value}
                        onChange={() => setAddForm({ ...addForm, role: r.value })}
                        className="accent-[#800020]"
                      />
                      <div className="text-sm font-medium text-gray-800">{r.label}</div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>
              <button
                onClick={handleAddUser}
                disabled={saving === 'new'}
                className="bg-[#800020] text-white px-5 py-2.5 text-sm rounded-lg font-semibold hover:bg-[#a3002a] transition disabled:opacity-60"
              >
                {saving === 'new' ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
