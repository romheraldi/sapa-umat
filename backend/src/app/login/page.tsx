'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const json = await res.json()
        if (!res.ok || json.error) {
          setError(json.error || 'Login gagal. Periksa email dan password Anda.')
          return
        }
        router.push('/admin')
        router.refresh()
      } catch {
        setError('Terjadi kesalahan. Silakan coba lagi.')
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0a0f] via-[#2d1020] to-[#1a0a0f]">
      <div className="w-full max-w-md px-4">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full overflow-hidden shadow-2xl shadow-red-900/50 mb-5 border-2 border-[#C5922E]/50">
            <Image
              src="/paroki-logo.png"
              alt="Logo Gereja St. Arnoldus Janssen"
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Gereja St. Arnoldus Janssen</h1>
          <p className="text-[#C5922E] text-sm mt-1 tracking-wider uppercase font-medium">
            Admin Panel · Paroki Bekasi
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-xl font-semibold mb-6">Masuk ke Dashboard</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 flex items-center gap-2">
              <span className="text-red-400 text-sm">⚠️ {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5 font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent transition"
                placeholder="admin@paroki.or.id"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5 font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#800020] hover:bg-[#a3002a] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-6 py-3.5 transition-all duration-200 shadow-lg shadow-red-900/30 mt-2"
            >
              {isPending ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Gereja Katolik Santo Arnoldus Janssen Bekasi © 2026
        </p>
      </div>
    </div>
  )
}
