/**
 * Valores canônicos de Production.type no banco: 'FILME' | 'SERIE'.
 * Dados antigos podem trazer variantes (Filme, K-Drama, Drama, SHOW, etc.) —
 * normalizamos aqui na leitura para exibição consistente.
 */
export function isMovieProductionType(type?: string | null): boolean {
  const normalized = (type ?? '').trim().toUpperCase()
  return normalized === 'FILME' || normalized === 'MOVIE' || normalized === 'FILM'
}

export function formatProductionType(type?: string | null): string {
  if (!type) return '-'
  return isMovieProductionType(type) ? 'Filme' : 'Série'
}
