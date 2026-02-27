import Image from 'next/image'
import Link from 'next/link'
import { Eye, Flame } from 'lucide-react'
import { getRoleLabel } from '@/lib/utils/role-labels'
import { getStreamingConfig } from '@/lib/config/streaming-platforms'

interface TrendingArtist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
    gender?: number | null
    trendingScore: number
    viewCount: number
    streamingSignals?: { showTitle: string; rank: number; source?: string }[]
}

interface TrendingArtistsProps {
    artists: TrendingArtist[]
}

// Badge de rank para os 3 primeiros
const TOP3_BADGE: Record<number, string> = {
    0: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black',
    1: 'bg-gradient-to-br from-zinc-200 to-zinc-400 text-black',
    2: 'bg-gradient-to-br from-amber-600 to-amber-700 text-white',
}

export function TrendingArtists({ artists }: TrendingArtistsProps) {
    if (artists.length === 0) return null

    return (
        <section className="py-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg shadow-orange-600/30">
                            <Flame className="w-5 h-5 text-white" />
                        </div>
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-black" />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl md:text-4xl font-black dark:text-white text-zinc-900 tracking-tighter">
                                TRENDING
                            </h2>
                            <span className="text-3xl md:text-4xl font-black text-orange-500 tracking-tighter italic">
                                NOW
                            </span>
                        </div>
                        <p className="dark:text-zinc-500 text-zinc-600 text-xs mt-0.5">
                            Artistas mais populares do momento
                        </p>
                    </div>
                </div>
                <Link
                    href="/artists?sortBy=trending"
                    className="hidden md:flex items-center gap-1 text-sm font-bold dark:text-zinc-400 text-zinc-500 dark:hover:text-white hover:text-zinc-900 transition-colors"
                >
                    Ver todos →
                </Link>
            </div>

            {/* Grade única — todos os cards do mesmo tamanho */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-2 md:gap-2.5">
                {artists.map((artist, index) => {
                    const signal = artist.streamingSignals?.[0]
                    const hasSignal = signal && signal.source !== 'internal_production'
                    const role = artist.roles?.[0] ? getRoleLabel(artist.roles[0], artist.gender) : null
                    const badgeClass = TOP3_BADGE[index] ?? 'bg-black/70 text-zinc-300'
                    // Borda "temperatura" para #4+
                    const temperatureBorders = [
                        'border border-orange-500/50',
                        'border border-orange-400/40',
                        'border border-amber-400/35',
                        'border border-yellow-500/30',
                        'border border-lime-500/25',
                        'border border-teal-500/25',
                        'border border-blue-500/20',
                        'border border-indigo-500/20',
                        'border border-purple-500/20',
                    ]
                    const borderClass = index < 3
                        ? 'border border-white/10'
                        : (temperatureBorders[index - 3] ?? 'border border-purple-500/15')

                    return (
                        <Link
                            key={artist.id}
                            href={`/artists/${artist.id}`}
                            className="group block"
                        >
                            <div className={`relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 mb-1.5 ${borderClass}`}>
                                {/* Rank badge */}
                                <div className={`absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center shadow-md ${index < 3 ? `w-6 h-6 text-[10px] ${badgeClass}` : 'bg-black/70 backdrop-blur-sm'}`}>
                                    <span className={index < 3 ? 'text-[10px] font-black' : 'text-[9px] font-black text-zinc-300'}>
                                        {index + 1}
                                    </span>
                                </div>

                                {/* Image */}
                                {artist.primaryImageUrl ? (
                                    <Image
                                        src={artist.primaryImageUrl}
                                        alt={artist.nameRomanized}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 640px) 25vw, (max-width: 768px) 20vw, 11vw"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-800 to-pink-800 flex items-center justify-center">
                                        <span className="text-white text-lg font-black">{artist.nameRomanized[0]}</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                {/* Streaming badge */}
                                {hasSignal && (
                                    <div className="absolute bottom-1.5 left-1 right-1 z-10">
                                        <span className="flex items-center gap-0.5 px-1.5 py-1 rounded-sm bg-red-600 text-[9px] font-black text-white leading-none w-full shadow-md">
                                            <span className="shrink-0">T{signal.rank}</span>
                                            <span className="opacity-50">·</span>
                                            {signal.source && <span className="shrink-0 truncate">{getStreamingConfig(signal.source).label}</span>}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Text below card — altura fixa para uniformidade */}
                            <div className="h-8">
                                <p className="dark:text-white text-zinc-900 font-semibold text-[10px] md:text-xs group-hover:text-orange-400 transition-colors line-clamp-1">
                                    {artist.nameRomanized}
                                </p>
                                {artist.nameHangul ? (
                                    <p className="text-zinc-600 text-[9px] line-clamp-1 mt-0.5">{artist.nameHangul}</p>
                                ) : role ? (
                                    <p className="text-zinc-600 text-[9px] line-clamp-1 mt-0.5">{role}</p>
                                ) : (
                                    <div className="h-[14px]" /> // placeholder para manter altura
                                )}
                            </div>

                            {/* View count — só no hover, mobile hidden */}
                            <div className="hidden md:flex items-center gap-1 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="w-2.5 h-2.5" />
                                <span className="text-[9px] tabular-nums">{artist.viewCount.toLocaleString('pt-BR')}</span>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Ver todos — mobile */}
            <div className="mt-6 md:hidden text-center">
                <Link
                    href="/artists?sortBy=trending"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    Ver todos os trending
                </Link>
            </div>
        </section>
    )
}
