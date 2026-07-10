import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/logout
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { message: 'Berhasil logout.' }, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
