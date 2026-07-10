import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/register
// Registers a new umat user with role 'umat'
export async function POST(request: NextRequest) {
  try {
    const { email, password, nama_lengkap } = await request.json()

    if (!email || !password || !nama_lengkap) {
      return NextResponse.json(
        { data: null, error: 'Email, password, dan nama lengkap wajib diisi.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { data: null, error: 'Password minimal 6 karakter.' },
        { status: 400 }
      )
    }

    // Use admin client to create user (bypasses email confirmation requirement)
    const supabase = createAdminClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // auto-confirm email
    })

    if (authError) {
      // Provide user-friendly error messages
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json(
          { data: null, error: 'Email sudah terdaftar. Silakan login atau gunakan email lain.' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { data: null, error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { data: null, error: 'Gagal membuat akun. Silakan coba lagi.' },
        { status: 500 }
      )
    }

    // Insert into users_roles with role 'umat'
    const { error: roleError } = await supabase
      .from('users_roles')
      .insert({
        id: authData.user.id,
        role: 'umat',
        nama_lengkap: nama_lengkap.trim(),
      })

    if (roleError) {
      // Rollback: delete the auth user if role insert fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { data: null, error: 'Gagal menyimpan data pengguna.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          nama_lengkap: nama_lengkap.trim(),
          role: 'umat',
        },
      },
      error: null,
    }, { status: 201 })

  } catch {
    return NextResponse.json(
      { data: null, error: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
