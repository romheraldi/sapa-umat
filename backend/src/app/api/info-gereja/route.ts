import { INFO_GEREJA } from '@/lib/gereja'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/info-gereja — static configuration data
export async function GET(_request: NextRequest) {
  return NextResponse.json({ data: INFO_GEREJA, error: null })
}
