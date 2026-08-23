import { describe, expect, it } from 'vitest'
import { bolehAksesNota, type ScopeAkses } from '@/lib/nota/akses'

const TARGET = { keluargaId: 'kel-1', lingkunganId: 7 }

const scope = (over: Partial<ScopeAkses>): ScopeAkses => ({
  isAdmin: false,
  role: 'umat',
  lingkunganIds: [],
  keluargaId: null,
  ...over,
})

describe('bolehAksesNota', () => {
  it('mengizinkan admin paroki', () => {
    expect(bolehAksesNota(scope({ isAdmin: true, role: 'admin_paroki' }), TARGET)).toBe(true)
  })

  it('mengizinkan umat atas nota keluarganya sendiri', () => {
    expect(bolehAksesNota(scope({ keluargaId: 'kel-1' }), TARGET)).toBe(true)
  })

  it('menolak umat atas nota keluarga lain', () => {
    expect(bolehAksesNota(scope({ keluargaId: 'kel-2' }), TARGET)).toBe(false)
  })

  it('menolak umat yang belum tertaut ke keluarga mana pun', () => {
    expect(bolehAksesNota(scope({ keluargaId: null }), TARGET)).toBe(false)
  })

  it('mengizinkan ketua lingkungan atas lingkungan yang diampu', () => {
    expect(
      bolehAksesNota(scope({ role: 'ketua_lingkungan', lingkunganIds: [7, 9] }), TARGET)
    ).toBe(true)
  })

  it('menolak ketua lingkungan di luar lingkungannya', () => {
    expect(
      bolehAksesNota(scope({ role: 'ketua_lingkungan', lingkunganIds: [9] }), TARGET)
    ).toBe(false)
  })

  it('mengizinkan ketua wilayah atas lingkungan di wilayahnya', () => {
    expect(
      bolehAksesNota(scope({ role: 'ketua_wilayah', lingkunganIds: [7] }), TARGET)
    ).toBe(true)
  })

  it('menolak ketua tanpa lingkungan sama sekali', () => {
    expect(
      bolehAksesNota(scope({ role: 'ketua_lingkungan', lingkunganIds: [] }), TARGET)
    ).toBe(false)
  })
})
