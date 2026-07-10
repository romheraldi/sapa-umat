import { getAuthUserWithRole } from '@/lib/supabase/auth-helper'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/auth/me — return current user info, role, and scope
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUserWithRole(request)
    if (!auth) {
      return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
    }

    return NextResponse.json({
      data: {
        id: auth.user.id,
        email: auth.user.email,
        role: auth.role,
        isAdmin: auth.isAdmin,
        wilayahIds: auth.wilayahIds,
        lingkunganIds: auth.lingkunganIds,
      },
      error: null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
