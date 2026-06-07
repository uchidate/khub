'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getStreamingConfig } from '@/lib/config/streaming-platforms'
import { formatProductionType } from '@/lib/utils/production-type'

type ArtistFilmographyProduction = {
  id: string
  slug: string | null
  titlePt: string
  type: string | null
  year: number | null
  imageUrl: string | null
  voteAverage: number | null
  tmdbId: string | null
}

type StreamingSignal = {
  showTitle: string
  showTmdbId: string
  rank: number
  source: string
}

interface ArtistFilmographyListProps {
  productions: ArtistFilmographyProduction[]
  streamingSignals: StreamingSignal[]
  initialCount?: number
}

export function ArtistFilmographyList({ productions, streamingSignals, initialCount = 10 }: ArtistFilmographyListProps) {
  const [expanded, setExpanded] = useState(false)
  const visibleProductions = expanded ? productions : productions.slice(0, initialCount)
  const hiddenCount = Math.max(productions.length - initialCount, 0)
  const streamingByTmdbId = new Map(streamingSignals.map(signal => [signal.showTmdbId, signal]))

  const toggleLabel = expanded
    ? 'Mostrar menos'
    : `Ver todos os ${productions.length} trabalhos`

  return (
    <>
      <div className="hidden sm:block">
        <div className="grid font-mono text-[10px] text-muted uppercase tracking-[0.08em] py-2.5 border-b border-foreground"
          style={{ gridTemplateColumns: '64px 2fr 1fr 120px 48px' }}>
          <span>Ano</span><span>Título</span><span>Tipo</span><span>Avaliação</span><span className="text-right">★</span>
        </div>
        {visibleProductions.map(production => {
          const rating = production.voteAverage ?? 0
          const streamSignalRaw = production.tmdbId ? streamingByTmdbId.get(production.tmdbId) : null
          const streamSignal = streamSignalRaw?.source !== 'internal_production' ? streamSignalRaw : null
          return (
            <Link key={production.id} href={`/productions/${production.slug ?? production.id}`}
              className="grid items-center py-3.5 border-b border-border/40 text-[14px] hover:bg-surface/50 transition-colors group"
              style={{ gridTemplateColumns: '64px 2fr 1fr 120px 48px' }}>
              <span className="font-mono text-[13px] text-muted">{production.year ?? '-'}</span>
              <span className="font-semibold text-foreground group-hover:text-accent transition-colors pr-4 min-w-0">
                <span className="block truncate">{production.titlePt}</span>
                {streamSignal && (
                  <span className="text-[10px] font-black text-accent font-mono">TOP {streamSignal.rank} · {getStreamingConfig(streamSignal.source).label}</span>
                )}
              </span>
              <span className="text-muted text-[12px] pr-4">{formatProductionType(production.type)}</span>
              <span className="flex items-center gap-2 pr-4">
                <span className="flex-1 h-1 bg-border overflow-hidden">
                  <span className="block h-full" style={{ width: `${Math.min((rating / 10) * 100, 100)}%`, background: rating >= 8 ? 'var(--accent, #ee2244)' : '#0a0a0a' }} />
                </span>
              </span>
              <span className="text-right font-mono font-semibold text-[13px]">{rating > 0 ? rating.toFixed(1) : '-'}</span>
            </Link>
          )
        })}
      </div>

      <div className="sm:hidden flex flex-col gap-2">
        {visibleProductions.map(production => {
          const streamSignalRaw = production.tmdbId ? streamingByTmdbId.get(production.tmdbId) : null
          const streamSignal = streamSignalRaw?.source !== 'internal_production' ? streamSignalRaw : null
          return (
            <Link key={production.id} href={`/productions/${production.slug ?? production.id}`}
              className="flex items-center gap-3 py-3 border-b border-border/40 group">
              <div className="relative w-10 h-[54px] shrink-0 overflow-hidden bg-[#efefef]">
                {production.imageUrl && (
                  <Image src={production.imageUrl} alt={production.titlePt} fill sizes="40px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[14px] text-foreground group-hover:text-accent transition-colors truncate">{production.titlePt}</p>
                <p className="font-mono text-[11px] text-muted">
                  {production.year} · {formatProductionType(production.type)}
                  {production.voteAverage && production.voteAverage > 0 ? ` · ★ ${production.voteAverage.toFixed(1)}` : ''}
                  {streamSignal ? ` · TOP ${streamSignal.rank}` : ''}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {hiddenCount > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
            className="font-mono text-[11px] text-muted hover:text-foreground transition-colors border border-border px-4 py-2 inline-flex items-center gap-1">
            {toggleLabel} {expanded ? '↑' : '↓'}
          </button>
        </div>
      )}
    </>
  )
}
