'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface UserInfo {
  role: string
  isAdmin: boolean
}

const allNavItems = [
  { href: '/admin', label: 'Dashboard', icon: '🏠', exact: true, roles: 'all' },
  { href: '/admin/jadwal', label: 'Jadwal Ibadah', icon: '📅', exact: false, roles: 'admin' },
  { href: '/admin/pengumuman', label: 'Pengumuman', icon: '📢', exact: false, roles: 'admin' },
  { href: '/admin/wilayah', label: 'Wilayah & Lingkungan', icon: '🗺️', exact: false, roles: 'admin_or_ketua_wilayah' },
  { href: '/admin/umat', label: 'Data Umat', icon: '👨‍👩‍👧‍👦', exact: false, roles: 'manage_umat' },
  { href: '/admin/dokumen', label: 'Dokumen Umat', icon: '📄', exact: false, roles: 'admin' },
  { href: '/admin/iuran', label: 'Iuran Umat', icon: '💳', exact: false, roles: 'admin' },
  { href: '/admin/users', label: 'Kelola Pengguna', icon: '👤', exact: false, roles: 'admin' },
]

function getVisibleNavItems(userInfo: UserInfo | null) {
  if (!userInfo) return allNavItems.filter(i => i.roles === 'all')

  return allNavItems.filter(item => {
    if (item.roles === 'all') return true
    if (item.roles === 'admin') return userInfo.isAdmin
    if (item.roles === 'admin_or_ketua_wilayah') {
      return userInfo.isAdmin || userInfo.role === 'ketua_wilayah'
    }
    if (item.roles === 'manage_umat') {
      return userInfo.isAdmin || userInfo.role === 'ketua_wilayah' || userInfo.role === 'ketua_lingkungan'
    }
    return false
  })
}

const ROLE_LABELS: Record<string, string> = {
  admin_paroki: 'Admin Paroki',
  pastor: 'Pastor',
  ketua_wilayah: 'Ketua Wilayah',
  ketua_lingkungan: 'Ketua Lingkungan',
  umat: 'Umat',
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setUserInfo({ role: json.data.role, isAdmin: json.data.isAdmin })
        }
      })
      .catch(() => {})
  }, [])

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navItems = getVisibleNavItems(userInfo)

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#1a0a0f] border-r border-[#2d1020] shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#2d1020]">
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-lg border-2 border-[#C5922E]/40">
          <Image
            src="/paroki-logo.png"
            alt="Logo Gereja St. Arnoldus Janssen"
            width={48}
            height={48}
            className="object-cover w-full h-full"
          />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">St. Arnoldus Janssen</div>
          <div className="text-[#C5922E] text-xs mt-0.5">
            {userInfo ? ROLE_LABELS[userInfo.role] ?? 'Admin Panel' : 'Admin Panel'}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-[#800020] text-white shadow-lg shadow-red-900/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer: Logout */}
      <div className="px-3 py-4 border-t border-[#2d1020]">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all duration-200 disabled:opacity-50"
        >
          <span>🚪</span>
          {loggingOut ? 'Keluar...' : 'Keluar'}
        </button>
      </div>
    </aside>
  )
}
