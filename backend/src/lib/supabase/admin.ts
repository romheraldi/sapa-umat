import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Admin client menggunakan Service Role Key.
 * HANYA digunakan di server-side (Route Handlers).
 * Mem-bypass Row Level Security (RLS) — aman karena autentikasi
 * diverifikasi secara manual di setiap Route Handler.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.'
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
