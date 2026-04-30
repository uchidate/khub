/**
 * Scoring de posts para seleção automática de destaques editoriais.
 *
 * A pontuação combina três sinais:
 *   - featured: bônus forte nos primeiros 30 dias, depois zera (auto-expiração)
 *   - recência: decai linearmente — 100 pts hoje, 0 após ~67 dias
 *   - popularidade: viewCount, limitado a 300 pts para não monopolizar
 *
 * Exemplos de score:
 *   post featured de ontem, 0 views  → ~599
 *   post featured de 1 semana, 100v  → ~689
 *   post featured de 35 dias, 0v     → ~47  (bônus expirou)
 *   post trending: 3 dias, 300v      → ~396
 *   post recente: hoje, 50v          → ~149
 */

export type ScoringInput = {
  featured: boolean
  publishedAt: Date | null
  viewCount: number
}

const FEATURED_BONUS = 500
const FEATURED_TTL_DAYS = 30
const RECENCY_MAX = 100
const RECENCY_DECAY_PER_DAY = 1.5   // zera após ~67 dias
const VIEW_WEIGHT = 1
const VIEW_CAP = 300

export function scorePost(post: ScoringInput, now = Date.now()): number {
  const daysSince = post.publishedAt
    ? (now - new Date(post.publishedAt).getTime()) / 86_400_000
    : 9_999

  const featuredBonus =
    post.featured && daysSince < FEATURED_TTL_DAYS ? FEATURED_BONUS : 0
  const recencyScore = Math.max(0, RECENCY_MAX - daysSince * RECENCY_DECAY_PER_DAY)
  const viewScore = Math.min(VIEW_CAP, post.viewCount * VIEW_WEIGHT)

  return featuredBonus + recencyScore + viewScore
}

/** Retorna cópia do array ordenada por score decrescente */
export function rankPosts<T extends ScoringInput>(posts: T[], now = Date.now()): T[] {
  return [...posts].sort((a, b) => scorePost(b, now) - scorePost(a, now))
}

/** Pontuação formatada para debug/admin */
export function describeScore(post: ScoringInput): string {
  const now = Date.now()
  const daysSince = post.publishedAt
    ? (now - new Date(post.publishedAt).getTime()) / 86_400_000
    : 9_999
  const f = post.featured && daysSince < FEATURED_TTL_DAYS ? FEATURED_BONUS : 0
  const r = Math.max(0, RECENCY_MAX - daysSince * RECENCY_DECAY_PER_DAY)
  const v = Math.min(VIEW_CAP, post.viewCount * VIEW_WEIGHT)
  return `score=${Math.round(f + r + v)} (f=${Math.round(f)} r=${Math.round(r)} v=${Math.round(v)})`
}
