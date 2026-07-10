import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUserWithRole } from '@/lib/supabase/auth-helper'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/users — list all users with their roles
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUserWithRole(request)
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
    }

    const db = createAdminClient()

    // Get all users from auth.users via admin API
    const { data: { users }, error: authErr } = await db.auth.admin.listUsers({ perPage: 200 })
    if (authErr) throw authErr

    // Get all roles
    const { data: roles } = await db.from('users_roles').select('*')
    const roleMap = new Map((roles ?? []).map(r => [r.id, r.role]))

    // Get ketua assignments
    const { data: wilayahData } = await db.from('wilayah').select('id, nama, ketua_id')
    const { data: lingkunganData } = await db.from('lingkungan').select('id, nama, ketua_id, wilayah_id')

    const result = users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      role: roleMap.get(u.id) ?? null,
      // Where this user is ketua
      ketua_wilayah: (wilayahData ?? []).filter(w => w.ketua_id === u.id).map(w => ({ id: w.id, nama: w.nama })),
      ketua_lingkungan: (lingkunganData ?? []).filter(l => l.ketua_id === u.id).map(l => ({ id: l.id, nama: l.nama })),
    }))

    return NextResponse.json({ data: result, error: null })
  } catch (err: any) {
    console.error('[GET /api/admin/users] Error:', err)
    return NextResponse.json({ data: null, error: err?.message || 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

// POST /api/admin/users
// Body: { action: 'update_role', user_id: string, role: string } OR { action: 'create', email: string, password: string, role: string }
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUserWithRole(request)
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json()
    const { action, role } = body
    
    if (!role) {
      return NextResponse.json({ data: null, error: 'Role wajib diisi.' }, { status: 400 })
    }

    const validRoles = ['umat', 'ketua_lingkungan', 'ketua_wilayah', 'admin_paroki', 'pastor']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ data: null, error: `Role tidak valid. Pilih: ${validRoles.join(', ')}` }, { status: 400 })
    }

    const db = createAdminClient()

    if (action === 'create') {
      const { email, password } = body
      if (!email || !password) {
        return NextResponse.json({ data: null, error: 'Email dan password wajib diisi untuk membuat pengguna baru.' }, { status: 400 })
      }

      // Create user in auth.users
      const { data: authData, error: authError } = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (authError) throw authError

      // Set role in users_roles
      const { error: roleError } = await db
        .from('users_roles')
        .upsert({ id: authData.user.id, role }, { onConflict: 'id' })
      if (roleError) throw roleError

      return NextResponse.json({ data: authData.user, error: null })
    } 
    else if (action === 'update_role' || !action) {
      const { user_id } = body
      if (!user_id) {
        return NextResponse.json({ data: null, error: 'user_id wajib diisi.' }, { status: 400 })
      }

      // Upsert into users_roles
      const { data, error } = await db
        .from('users_roles')
        .upsert({ id: user_id, role }, { onConflict: 'id' })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ data, error: null })
    } 
    
    return NextResponse.json({ data: null, error: 'Aksi tidak valid.' }, { status: 400 })
  } catch (err: any) {
    console.error('[POST /api/admin/users] Error:', err)
    return NextResponse.json({ data: null, error: err?.message || 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
