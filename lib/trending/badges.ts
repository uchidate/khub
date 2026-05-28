/**
 * lib/trending/badges.ts
 *
 * Lógica central de badges para "Artistas em Alta".
 * Fonte única da verdade — usada em componentes públicos e no admin.
 *
 * Hierarquia de decisão:
 *   1. trendingBadgeOverride (admin manual) → prioridade máxima
 *   2. HOT    → rank 1
 *   3. SUBINDO → subiu ≥ 5 posições no último ciclo (ou entrou do nada)
 *   4. NOVO   → artista criado há ≤ 30 dias E em top 20
 *   5. null   → sem badge especial
 */

export type TrendingBadge = 'HOT' | 'SUBINDO' | 'NOVO' | null

export interface ArtistForBadge {
  trendingRank: number | null
  trendingRankPrev: number | null
  trendingBadgeOverride: string | null
  createdAt: Date | string
  trendingScore?: number | null
  trendingBreakdown?: {
    views1d: number
    views7d: number
    favorites7d: number
    streamingBoost: number
    velocityScore: number
    priorScore?: number
  } | null
}

/**
 * SUBINDO_THRESHOLD: quantas posições precisa subir para ganhar badge SUBINDO.
 * Ex: era #12, agora é #6 → subiu 6 → SUBINDO ✓
 */
const SUBINDO_THRESHOLD = 10

/** Artistas criados há X dias ou menos podem ganhar badge NOVO (se em top 20) */
const NOVO_MAX_AGE_DAYS = 30
const HOT_MIN_SCORE = 82
const HOT_MIN_SIGNAL = 10
const RISING_MIN_SIGNAL = 8

function signalVolume(artist: ArtistForBadge): number {
  const b = artist.trendingBreakdown
  if (!b) return 0
  return b.views7d + b.favorites7d * 4 + Math.round(b.streamingBoost)
}

export function getArtistBadge(artist: ArtistForBadge): TrendingBadge {
  // Override manual do admin tem prioridade absoluta
  if (artist.trendingBadgeOverride) {
    const override = artist.trendingBadgeOverride.toUpperCase()
    if (override === 'HOT' || override === 'SUBINDO' || override === 'NOVO') {
      return override as TrendingBadge
    }
  }

  const rank = artist.trendingRank
  if (!rank) return null

  const score = artist.trendingScore ?? 0
  const volume = signalVolume(artist)

  // HOT exige topo + score forte + algum sinal real. Em cold start, evita selo inflado.
  if (rank <= 3 && score >= HOT_MIN_SCORE && volume >= HOT_MIN_SIGNAL) return 'HOT'

  // Detecta velocidade: subiu bastante posições no último ciclo?
  const prevRank = artist.trendingRankPrev ?? 9999
  const delta = prevRank - rank // positivo = subiu

  // Salto absurdo (ex: estava em #15000, agora em top 500) → NOVO, não SUBINDO com número gigante
  if (delta >= 1000 && rank <= 500 && volume >= RISING_MIN_SIGNAL) return 'NOVO'

  if (volume >= RISING_MIN_SIGNAL && (delta >= SUBINDO_THRESHOLD || (prevRank === 9999 && rank <= 10))) {
    return 'SUBINDO'
  }

  // Artista novo na plataforma (< 30 dias) e já em top 20
  if (rank <= 20 && volume >= RISING_MIN_SIGNAL) {
    const ageMs = Date.now() - new Date(artist.createdAt).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    if (ageDays <= NOVO_MAX_AGE_DAYS) return 'NOVO'
  }

  return null
}

/** Retorna delta de posição (positivo = subiu, negativo = caiu, null = sem dados) */
export function getRankDelta(artist: { trendingRank: number | null; trendingRankPrev: number | null }): number | null {
  if (!artist.trendingRank || !artist.trendingRankPrev) return null
  return artist.trendingRankPrev - artist.trendingRank
}
