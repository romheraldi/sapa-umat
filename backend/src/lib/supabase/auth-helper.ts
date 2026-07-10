import { createClient } from './server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from './admin'
import { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import type { RoleType } from '@/types/database'

/**
 * Authenticate a user from either:
 *   1. Cookies (admin web panel / browser)
 *   2. Authorization: Bearer <token> header (mobile app / external API)
 *
 * Returns the authenticated User or null if both methods fail.
 */
export async function getAuthUser(request: NextRequest): Promise<User | null> {
  // 1. Try cookie-based auth (works for admin web panel)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user
  } catch {
    // Cookie-based auth failed, try header-based
  }

  // 2. Try Authorization header (works for mobile app)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) return user
    } catch {
      // Token-based auth also failed
    }
  }

  return null
}

// ─── Role-Based Auth Context ─────────────────────────────────────────────────

export interface AuthContext {
  user: User
  role: RoleType
  /** Wilayah IDs the user manages (ketua_wilayah) or belongs to */
  wilayahIds: number[]
  /** Lingkungan IDs the user can access */
  lingkunganIds: number[]
  /** true if admin_paroki or pastor */
  isAdmin: boolean
}

/**
 * Get authenticated user with their role and scope.
 * Returns AuthContext or null if not authenticated.
 *
 * Role hierarchy:
 *   - admin_paroki / pastor → full access to all data
 *   - ketua_wilayah → access to all lingkungan within their wilayah
 *   - ketua_lingkungan → access to their specific lingkungan only
 *   - umat → access to their own family data only
 */
export async function getAuthUserWithRole(request: NextRequest): Promise<AuthContext | null> {
  const user = await getAuthUser(request)
  if (!user) return null

  const db = createAdminClient()

  // Fetch user role from users_roles table
  const { data: userRole } = await db
    .from('users_roles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role: RoleType = userRole?.role ?? 'umat'
  const isAdmin = role === 'admin_paroki' || role === 'pastor'

  let wilayahIds: number[] = []
  let lingkunganIds: number[] = []

  if (isAdmin) {
    // Admin/pastor: no filtering needed, leave arrays empty (means "all")
  } else if (role === 'ketua_wilayah') {
    // Get wilayah where this user is ketua
    const { data: wilayahData } = await db
      .from('wilayah')
      .select('id')
      .eq('ketua_id', user.id)

    wilayahIds = (wilayahData ?? []).map(w => w.id)

    // Get all lingkungan in those wilayah
    if (wilayahIds.length > 0) {
      const { data: lingkunganData } = await db
        .from('lingkungan')
        .select('id')
        .in('wilayah_id', wilayahIds)

      lingkunganIds = (lingkunganData ?? []).map(l => l.id)
    }
  } else if (role === 'ketua_lingkungan') {
    // Get lingkungan where this user is ketua
    const { data: lingkunganData } = await db
      .from('lingkungan')
      .select('id, wilayah_id')
      .eq('ketua_id', user.id)

    lingkunganIds = (lingkunganData ?? []).map(l => l.id)
    wilayahIds = [...new Set((lingkunganData ?? []).map(l => l.wilayah_id))]
  }
  // For 'umat' role: wilayahIds and lingkunganIds stay empty
  // The route handlers will use user.id to find their keluarga

  return { user, role, wilayahIds, lingkunganIds, isAdmin }
}

/**
 * Check if auth context has access to a specific lingkungan_id.
 * Admins always have access.
 */
export function hasLingkunganAccess(auth: AuthContext, lingkunganId: number): boolean {
  if (auth.isAdmin) return true
  if (auth.role === 'ketua_wilayah' || auth.role === 'ketua_lingkungan') {
    return auth.lingkunganIds.includes(lingkunganId)
  }
  return false
}
