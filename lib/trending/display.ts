/**
 * lib/trending/display.ts
 *
 * Configuração visual dos badges de trending.
 * Separa lógica (badges.ts) de apresentação (tailwind classes/labels).
 *
 * Badges SUBINDO/DESCENDO exibem seta + delta numérico (↑3, ↓2)
 * quando os dados de rank estão disponíveis.
 */

import type { TrendingBadge, ArtistForBadge } from './badges'
import { getArtistBadge, getRankDelta } from './badges'

export interface BadgeDisplay {
  label: string
  className: string
}

const BADGE_BASE: Record<NonNullable<TrendingBadge>, BadgeDisplay> = {
  HOT: {
    label: 'HOT',
    className: 'bg-accent-soft text-accent',
  },
  SUBINDO: {
    label: 'SUBINDO',
    className: 'bg-green-500/10 text-green-500',
  },
  NOVO: {
    label: 'NOVO',
    className: 'bg-amber-500/10 text-amber-500',
  },
}

/** Retorna a config visual do badge, ou null se não há badge. */
export function getBadgeDisplay(badge: TrendingBadge): BadgeDisplay | null {
  if (!badge) return null
  return BADGE_BASE[badge]
}

/**
 * Retorna o badge completo de um artista, com label dinâmico:
 * - SUBINDO com delta → "↑5" (verde)
 * - Falling significativa (≥ 3) → "↓3" (vermelho muted) — mesmo sem badge formal
 * - HOT / NOVO → labels estáticos
 * - null → sem badge
 */
export function getArtistBadgeDisplay(artist: ArtistForBadge): BadgeDisplay | null {
  const badge = getArtistBadge(artist)
  const delta = getRankDelta(artist)

  if (badge === 'SUBINDO') {
    const label = delta !== null && delta > 0 ? `↑${Math.min(delta, 99)}` : '↑'
    return { label, className: BADGE_BASE.SUBINDO.className }
  }

  // Mostra queda apenas quando significativa e não absurda (salto de rank pode ser streaming signal)
  if (!badge && delta !== null && delta <= -8 && delta >= -999) {
    return {
      label: `↓${Math.min(Math.abs(delta), 99)}`,
      className: 'bg-red-500/10 text-red-400',
    }
  }

  return getBadgeDisplay(badge)
}
