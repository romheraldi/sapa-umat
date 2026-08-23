export type ScopeAkses = {
  isAdmin: boolean
  role: string
  lingkunganIds: number[]
  keluargaId: string | null
}

export function bolehAksesNota(
  scope: ScopeAkses,
  target: { keluargaId: string; lingkunganId: number }
): boolean {
  if (scope.isAdmin) return true

  if (scope.role === 'ketua_lingkungan' || scope.role === 'ketua_wilayah') {
    return scope.lingkunganIds.includes(target.lingkunganId)
  }

  if (scope.role === 'umat') {
    return scope.keluargaId !== null && scope.keluargaId === target.keluargaId
  }

  return false
}
