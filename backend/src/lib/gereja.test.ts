import { describe, expect, it } from 'vitest'
import { INFO_GEREJA } from '@/lib/gereja'

describe('INFO_GEREJA', () => {
  it('punya nama paroki', () => {
    expect(INFO_GEREJA.nama).toBe('Gereja Katolik Santo Arnoldus Janssen Bekasi')
  })

  it('punya alamat dan telepon untuk kop nota', () => {
    expect(INFO_GEREJA.alamat).toContain('Bekasi')
    expect(INFO_GEREJA.telepon).toBe('(021) 8801763')
  })

  it('mendaftar minimal satu pastor', () => {
    expect(INFO_GEREJA.pastor.length).toBeGreaterThan(0)
    expect(INFO_GEREJA.pastor[0].jabatan).toBe('Pastor Paroki')
  })
})
