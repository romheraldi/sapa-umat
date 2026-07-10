import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ data: null, error: 'Email dan password wajib diisi.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ data: null, error: 'Email atau password salah.' }, { status: 401 })
    }

    // Fetch role and nama_lengkap from users_roles
    const adminClient = createAdminClient()
    const { data: userRole } = await adminClient
      .from('users_roles')
      .select('role, nama_lengkap')
      .eq('id', data.user.id)
      .single()

    return NextResponse.json({
      data: {
        user: {
          ...data.user,
          role: userRole?.role ?? 'umat',
          nama_lengkap: userRole?.nama_lengkap ?? null,
        },
        session: data.session,
      },
      error: null,
    })
  } catch {
    return NextResponse.json({ data: null, error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
