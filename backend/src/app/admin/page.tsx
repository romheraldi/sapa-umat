import { createAdminClient } from '@/lib/supabase/admin'

async function getStats() {
  const supabase = createAdminClient()

  const [jadwal, pengumuman, keluarga, umat] = await Promise.all([
    supabase.from('jadwal_ibadah').select('id', { count: 'exact', head: true }),
    supabase.from('pengumuman').select('id', { count: 'exact', head: true }),
    supabase.from('keluarga').select('id', { count: 'exact', head: true }),
    supabase.from('umat').select('id', { count: 'exact', head: true }),
  ])

  return {
    jadwal: jadwal.count ?? 0,
    pengumuman: pengumuman.count ?? 0,
    keluarga: keluarga.count ?? 0,
    umat: umat.count ?? 0,
  }
}

async function getRecentActivity() {
  const supabase = createAdminClient()
  const [jadwalRecent, pengumumanRecent] = await Promise.all([
    supabase.from('jadwal_ibadah').select('id, judul, tanggal, kategori').order('created_at', { ascending: false }).limit(5),
    supabase.from('pengumuman').select('id, judul, published_at, kategori').order('published_at', { ascending: false }).limit(5),
  ])
  return { jadwal: jadwalRecent.data ?? [], pengumuman: pengumumanRecent.data ?? [] }
}

const statCards = [
  { key: 'jadwal', label: 'Total Jadwal', icon: '📅', color: 'bg-blue-500', href: '/admin/jadwal' },
  { key: 'pengumuman', label: 'Pengumuman', icon: '📢', color: 'bg-green-500', href: '/admin/pengumuman' },
  { key: 'keluarga', label: 'Total KK', icon: '🏠', color: 'bg-amber-500', href: '/admin/umat' },
  { key: 'umat', label: 'Total Jiwa', icon: '👤', color: 'bg-purple-500', href: '/admin/umat' },
] as const

export default async function AdminDashboard() {
  const [stats, activity] = await Promise.all([getStats(), getRecentActivity()])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Selamat datang di panel administrasi SAPA UMAT.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {statCards.map((card) => (
          <a
            key={card.key}
            href={card.href}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center shadow-md text-xl`}>
                {card.icon}
              </div>
              <span className="text-gray-300 group-hover:text-[#800020] transition-colors text-xl">→</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">{stats[card.key]}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </a>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jadwal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Jadwal Terbaru</h2>
            <a href="/admin/jadwal" className="text-xs text-[#800020] hover:underline font-medium">Lihat Semua →</a>
          </div>
          <div className="divide-y divide-gray-50">
            {activity.jadwal.length === 0 ? (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">Belum ada jadwal.</p>
            ) : (
              activity.jadwal.map((j) => (
                <div key={j.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-2 h-2 rounded-full bg-[#800020] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{j.judul}</div>
                    <div className="text-xs text-gray-400">{j.tanggal} · {j.kategori}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Pengumuman */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Pengumuman Terbaru</h2>
            <a href="/admin/pengumuman" className="text-xs text-[#800020] hover:underline font-medium">Lihat Semua →</a>
          </div>
          <div className="divide-y divide-gray-50">
            {activity.pengumuman.length === 0 ? (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">Belum ada pengumuman.</p>
            ) : (
              activity.pengumuman.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{p.judul}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(p.published_at).toLocaleDateString('id-ID')} · {p.kategori}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
