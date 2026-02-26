'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Music, Music2, Youtube } from 'lucide-react'

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

const TYPE_COLOR: Record<string, string> = {
    ALBUM: 'text-purple-400 bg-purple-400/10',
    EP: 'text-blue-400 bg-blue-400/10',
    SINGLE: 'text-pink-400 bg-pink-400/10',
}

export function DiscographySection({ albums }: DiscographySectionProps) {
    const [filter, setFilter] = useState<FilterTab>('all')

    const counts = {
        ALBUM: albums.filter(a => a.type === 'ALBUM').length,
        EP: albums.filter(a => a.type === 'EP').length,
        SINGLE: albums.filter(a => a.type === 'SINGLE').length,
    }

    const filtered = filter === 'all' ? albums : albums.filter(a => a.type === filter)

    const tabs = [
        { key: 'all' as FilterTab, label: 'Todos', count: albums.length },
        { key: 'ALBUM' as FilterTab, label: 'Álbuns', count: counts.ALBUM },
        { key: 'EP' as FilterTab, label: 'EPs', count: counts.EP },
        { key: 'SINGLE' as FilterTab, label: 'Singles', count: counts.SINGLE },
    ].filter(t => t.key === 'all' || t.count > 0)

    return (
        <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Discografia
                    <span className="text-zinc-700 font-bold normal-case tracking-normal">
                        {albums.length} lançamento{albums.length !== 1 ? 's' : ''}
                    </span>
                </h3>

                {tabs.length > 2 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {tabs.map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full transition-all ${
                                    filter === key
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                            >
                                {label}
                                {key !== 'all' && (
                                    <span className="ml-1 opacity-60">({count})</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((album) => (
                    <div
                        key={album.id}
                        className="group relative bg-zinc-900 rounded-xl border border-white/5 overflow-hidden hover:border-purple-500/40 transition-all hover:-translate-y-1"
                    >
                        <div className="aspect-square relative bg-zinc-800">
                            {album.coverUrl ? (
                                <Image
                                    src={album.coverUrl}
                                    alt={album.title}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-700">
                                    <Music className="w-8 h-8 opacity-20" />
                                    <span className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-sm ${TYPE_COLOR[album.type] ?? 'text-zinc-500 bg-zinc-800'}`}>
                                        {TYPE_LABEL[album.type] ?? album.type}
                                    </span>
                                </div>
                            )}

                            {/* Streaming links overlay */}
                            {(album.spotifyUrl || album.youtubeUrl || album.appleMusicUrl) && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                    {album.spotifyUrl && (
                                        <a
                                            href={album.spotifyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-green-500 rounded-full hover:scale-110 transition-transform text-black"
                                            title="Ouvir no Spotify"
                                        >
                                            <Music className="w-4 h-4" />
                                        </a>
                                    )}
                                    {album.appleMusicUrl && (
                                        <a
                                            href={album.appleMusicUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-pink-500 rounded-full hover:scale-110 transition-transform text-white"
                                            title="Ouvir no Apple Music"
                                        >
                                            <Music2 className="w-4 h-4" />
                                        </a>
                                    )}
                                    {album.youtubeUrl && (
                                        <a
                                            href={album.youtubeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-red-600 rounded-full hover:scale-110 transition-transform text-white"
                                            title="Ver no YouTube"
                                        >
                                            <Youtube className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-3">
                            <h4 className="font-bold text-white text-sm line-clamp-1">{album.title}</h4>
                            <div className="flex justify-between items-center mt-1">
                                <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded-sm ${TYPE_COLOR[album.type] ?? 'text-zinc-500 bg-zinc-800'}`}>
                                    {TYPE_LABEL[album.type] ?? album.type}
                                </span>
                                {album.releaseDate && (
                                    <span className="text-[10px] font-bold text-zinc-500">
                                        {new Date(album.releaseDate).getUTCFullYear()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
