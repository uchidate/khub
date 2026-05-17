'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { CalendarDays, ExternalLink, Music, Play } from 'lucide-react'

type AlbumType = 'ALBUM' | 'EP' | 'SINGLE'

interface Album {
    id: string
    title: string
    type: string
    releaseDate: Date | string | null
    coverUrl: string | null
    spotifyUrl: string | null
    appleMusicUrl: string | null
    youtubeUrl: string | null
    mbid: string | null
    tracks?: Array<{
        id: string
        title: string
        trackNumber: number | null
        durationMs: number | null
        spotifyUrl: string | null
    }>
}

interface DiscographySectionProps {
    albums: Album[]
}

type FilterTab = 'all' | AlbumType

const TYPE_LABEL: Record<string, string> = {
    ALBUM: 'Álbum',
    EP: 'EP',
    SINGLE: 'Single',
}

const TYPE_STYLE: Record<string, string> = {
    ALBUM: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-400/20',
    EP: 'bg-sky-500/10 text-sky-300 border-sky-400/20',
    SINGLE: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
}

function formatYear(date: Album['releaseDate']) {
    return date ? new Date(date).getUTCFullYear() : null
}

function formatDuration(durationMs: number | null) {
    if (!durationMs) return null
    const totalSeconds = Math.round(durationMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function DiscographySection({ albums }: DiscographySectionProps) {
    const [filter, setFilter] = useState<FilterTab>('all')
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    const counts = useMemo(() => ({
        ALBUM: albums.filter(album => album.type === 'ALBUM').length,
        EP: albums.filter(album => album.type === 'EP').length,
        SINGLE: albums.filter(album => album.type === 'SINGLE').length,
    }), [albums])

    const filtered = filter === 'all' ? albums : albums.filter(album => album.type === filter)
    const totalTracks = albums.reduce((sum, album) => sum + (album.tracks?.length ?? 0), 0)
    const tabs = [
        { key: 'all' as FilterTab, label: 'Todos', count: albums.length },
        { key: 'ALBUM' as FilterTab, label: 'Álbuns', count: counts.ALBUM },
        { key: 'EP' as FilterTab, label: 'EPs', count: counts.EP },
        { key: 'SINGLE' as FilterTab, label: 'Singles', count: counts.SINGLE },
    ].filter(tab => tab.key === 'all' || tab.count > 0)

    const toggleExpanded = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    return (
        <section>
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-black text-muted uppercase">
                            <Music className="w-4 h-4" />
                            Discografia
                        </div>
                        <p className="mt-1 text-sm text-muted">
                            {albums.length} lançamento{albums.length !== 1 ? 's' : ''}
                            {totalTracks > 0 ? ` · ${totalTracks} faixa${totalTracks !== 1 ? 's' : ''}` : ''}
                        </p>
                    </div>

                    {tabs.length > 1 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {tabs.map(({ key, label, count }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                                        filter === key
                                            ? 'bg-accent/10 text-accent border-accent/30'
                                            : 'bg-surface text-muted border-border hover:text-foreground'
                                    }`}
                                >
                                    {label}
                                    {key !== 'all' && <span className="ml-1 opacity-70">({count})</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {filtered.map(album => {
                    const tracks = album.tracks ?? []
                    const visibleTracks = expandedIds.has(album.id) ? tracks : tracks.slice(0, 4)
                    const remainingTracks = tracks.length - visibleTracks.length
                    const year = formatYear(album.releaseDate)

                    return (
                        <article
                            key={album.id}
                            className="overflow-hidden rounded-lg border border-border bg-background"
                        >
                            <div className="flex flex-col sm:flex-row">
                                <div className="relative w-full sm:w-32 aspect-square sm:aspect-auto sm:min-h-32 bg-surface flex-shrink-0">
                                    {album.coverUrl ? (
                                        <Image
                                            src={album.coverUrl}
                                            alt={album.title}
                                            fill
                                            sizes="(max-width: 640px) 100vw, 128px"
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Music className="w-7 h-7 text-muted/40" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase ${TYPE_STYLE[album.type] ?? 'bg-surface text-muted border-border'}`}>
                                                    {TYPE_LABEL[album.type] ?? album.type}
                                                </span>
                                                {year && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                                                        <CalendarDays className="w-3 h-3" />
                                                        {year}
                                                    </span>
                                                )}
                                                {tracks.length > 0 && (
                                                    <span className="text-xs text-muted">
                                                        {tracks.length} faixa{tracks.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-base font-bold text-foreground leading-snug">{album.title}</h4>
                                        </div>

                                        {album.spotifyUrl && (
                                            <a
                                                href={album.spotifyUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/15 text-xs font-bold whitespace-nowrap"
                                            >
                                                <Play className="w-3.5 h-3.5" />
                                                Ouvir no Spotify
                                            </a>
                                        )}
                                    </div>

                                    {tracks.length > 0 && (
                                        <div className="mt-4 border-t border-border pt-3">
                                            <div className="space-y-1">
                                                {visibleTracks.map(track => (
                                                    <div
                                                        key={track.id}
                                                        className="grid grid-cols-[24px_minmax(0,1fr)_auto_auto] items-center gap-2 py-1.5 text-sm"
                                                    >
                                                        <span className="text-xs text-muted tabular-nums text-right">
                                                            {track.trackNumber ?? '·'}
                                                        </span>
                                                        <span className="truncate text-foreground">{track.title}</span>
                                                        <span className="text-xs text-muted tabular-nums">
                                                            {formatDuration(track.durationMs)}
                                                        </span>
                                                        {track.spotifyUrl && (
                                                            <a
                                                                href={track.spotifyUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                                                            >
                                                                Ouvir
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {tracks.length > 4 && (
                                                <button
                                                    onClick={() => toggleExpanded(album.id)}
                                                    className="mt-2 text-xs font-semibold text-muted hover:text-foreground"
                                                >
                                                    {expandedIds.has(album.id)
                                                        ? 'Mostrar menos'
                                                        : `Ver mais ${remainingTracks} faixa${remainingTracks !== 1 ? 's' : ''}`}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>
                    )
                })}
            </div>
        </section>
    )
}
