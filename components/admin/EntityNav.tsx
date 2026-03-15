'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * EntityNav
 *
 * Navegação entre itens de uma lista dentro de uma página de detalhe.
 * Ex: "← Artista anterior | Artista 47 de 2.180 | Próximo artista →"
 *
 * Uso:
 *   // No server component, buscar prev/next do banco:
 *   const [prev, next] = await Promise.all([
 *     prisma.artist.findFirst({ where: { createdAt: { lt: artist.createdAt } }, orderBy: { createdAt: 'desc' }, select: { id: true, nameRomanized: true } }),
 *     prisma.artist.findFirst({ where: { createdAt: { gt: artist.createdAt } }, orderBy: { createdAt: 'asc' }, select: { id: true, nameRomanized: true } }),
 *   ])
 *
 *   <EntityNav
 *     prevHref={prev ? `/admin/artists/${prev.id}` : undefined}
 *     prevLabel={prev?.nameRomanized}
 *     nextHref={next ? `/admin/artists/${next.id}` : undefined}
 *     nextLabel={next?.nameRomanized}
 *     currentIndex={index}   // opcional
 *     total={totalArtists}   // opcional
 *     entityLabel="artista"
 *   />
 */

interface EntityNavProps {
  prevHref?: string
  prevLabel?: string
  nextHref?: string
  nextLabel?: string
  currentIndex?: number
  total?: number
  entityLabel?: string
  className?: string
}

export function EntityNav({
  prevHref,
  prevLabel,
  nextHref,
  nextLabel,
  currentIndex,
  total,
  entityLabel = 'item',
  className,
}: EntityNavProps) {
  if (!prevHref && !nextHref) return null

  return (
    <div className={`flex items-center justify-between gap-4 ${className ?? ''}`}>
      {/* Anterior */}
      {prevHref ? (
        <Link
          href={prevHref}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-3 py-2 rounded-lg transition-all max-w-[40%] group"
        >
          <ChevronLeft size={13} className="flex-shrink-0" />
          <span className="truncate">{prevLabel ?? `${entityLabel} anterior`}</span>
        </Link>
      ) : (
        <div />
      )}

      {/* Contador central */}
      {currentIndex !== undefined && total !== undefined && (
        <span className="text-xs text-zinc-600 text-center flex-shrink-0 tabular-nums">
          {currentIndex} de {total.toLocaleString('pt-BR')} {entityLabel}s
        </span>
      )}

      {/* Próximo */}
      {nextHref ? (
        <Link
          href={nextHref}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-3 py-2 rounded-lg transition-all max-w-[40%] group"
        >
          <span className="truncate">{nextLabel ?? `próximo ${entityLabel}`}</span>
          <ChevronRight size={13} className="flex-shrink-0" />
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
}
