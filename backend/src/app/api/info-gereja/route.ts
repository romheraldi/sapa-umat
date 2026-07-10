import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/info-gereja — static configuration data
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    data: {
      nama: 'Gereja Katolik Santo Arnoldus Janssen Bekasi',
      alamat: 'Jl. Insinyur H. Juanda No.164, RT.002/RW.009, Margahayu, Kec. Bekasi Tim., Kota Bks, Jawa Barat 17113',
      telepon: '(021) 8801763',
      email: 'paroki@arnoldusjanssen.or.id',
      website: 'www.arnoldusjanssen.or.id',
      keuskupan_agung: 'Jakarta',
      uskup_agung: 'Ignatius Kardinal Suharyo',
      tahun_renovasi: '25 September 2011',
      jam_sekretariat: [
        { hari: 'Senin - Jumat', jam: '08:00 - 16:00' },
        { hari: 'Sabtu', jam: '08:00 - 12:00' },
        { hari: 'Minggu', jam: 'Tutup' },
      ],
    },
    error: null,
  })
}
