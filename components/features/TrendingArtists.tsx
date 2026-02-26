import Image from 'next/image'
import Link from 'next/link'
import { Eye, Flame } from 'lucide-react'
import { getRoleLabel } from '@/lib/utils/role-labels'

interface TrendingArtist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
    gender?: number | null
    trendingScore: number
    viewCount: number
    streamingSignals?: { showTitle: string; rank: number }[]
}

interface TrendingArtistsProps {
    artists: TrendingArtist[]
}

const FEATURED_BADGE: Record<number, string> = {
    0: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black',
    1: 'bg-gradient-to-br from-zinc-200 to-zinc-400 text-black',
    2: 'bg-gradient-to-br from-amber-600 to-amber-700 text-white',
}

const FEATURED_GLOW: Record<number, string> = {
    0: 'hover:shadow-yellow-500/20',
    1: 'hover:shadow-zinc-300/10',
    2: 'hover:shadow-amber-600/15',
}

// Borda "temperatura" — do mais quente (laranja, #4) ao mais frio (roxo, #12)
const COMPACT_BORDER = [
    'border border-orange-500/50',   // #4
    'border border-orange-400/40',   // #5
    'border border-amber-400/35',    // #6
    'border border-yellow-500/30',   // #7
    'border border-lime-500/25',     // #8
    'border border-teal-500/25',     // #9
    'border border-blue-500/20',     // #10
    'border border-indigo-500/20',   // #11
    'border border-purple-500/20',   // #12
]

export function TrendingArtists({ artists }: TrendingArtistsProps) {
    if (artists.length === 0) return null

    const featured = artists.slice(0, 3)
    const rest = artists.slice(3)

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

            {/* Top 3 — featured */}
            <div className="grid grid-cols-3 gap-3 md:gap-5 mb-3">
                {featured.map((artist, index) => {
const badgeClass = FEATURED_BADGE[index] ?? 'bg-black/60 text-zinc-300'
                    const glowClass = FEATURED_GLOW[index] ?? ''
                    const role = artist.roles?.[0] ? getRoleLabel(artist.roles[0], artist.gender) : null
                    const signal = artist.streamingSignals?.[0]

                    return (
                        <Link
                            key={artist.id}
                            href={`/artists/${artist.id}`}
                            className={`group relative block rounded-2xl overflow-hidden bg-zinc-900 shadow-xl hover:shadow-2xl ${glowClass} transition-shadow duration-500`}
                        >
                            <div className="aspect-[2/3] relative">
                                {/* Image */}
                                {artist.primaryImageUrl ? (
                                    <Image
                                        src={artist.primaryImageUrl}
                                        alt={artist.nameRomanized}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 18vw"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                                        <span className="text-white text-5xl font-black">
                                            {artist.nameRomanized[0]}
                                        </span>
                                    </div>
                                )}

                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                                {/* Rank badge */}
                                <div className={`absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg ${badgeClass}`}>
                                    {index + 1}
                                </div>

                                {/* Streaming signal badge */}
                                {signal && (
                                    <div className="absolute top-2.5 right-2.5 z-10 max-w-[calc(100%-3.5rem)]">
                                        <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500/95 backdrop-blur-sm text-[10px] font-black text-white leading-none shadow-lg">
                                            <span className="shrink-0">TOP {signal.rank}</span>
                                            <span className="opacity-60">·</span>
                                            <span className="truncate">{signal.showTitle}</span>
                                        </span>
                                    </div>
                                )}

                                {/* Bottom overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <h3 className="text-white font-black text-sm md:text-base leading-tight group-hover:text-orange-300 transition-colors line-clamp-1">
                                        {artist.nameRomanized}
                                    </h3>
                                    {artist.nameHangul && (
                                        <p className="text-zinc-400 text-[10px] mt-0.5 line-clamp-1">{artist.nameHangul}</p>
                                    )}
                                    {role && (
                                        <p className="text-zinc-500 text-[10px] mt-0.5">{role}</p>
                                    )}

                                    {/* View count */}
                                    <div className="mt-1.5 flex items-center gap-1 text-zinc-500">
                                        <Eye className="w-2.5 h-2.5" />
                                        <span className="text-[9px] font-medium tabular-nums">
                                            {artist.viewCount.toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* #4-12 — compact */}
            {rest.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-2 md:gap-2.5">
                    {rest.map((artist, i) => {
                        const index = i + 3
                        const borderClass = COMPACT_BORDER[i] ?? 'border border-purple-500/15'
                        const compactSignal = artist.streamingSignals?.[0]

                        return (
                            <Link
                                key={artist.id}
                                href={`/artists/${artist.id}`}
                                className="group block"
                            >
                                <div className={`relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 mb-1.5 ${borderClass}`}>
                                    {/* Rank */}
                                    <div className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center">
                                        <span className="text-[9px] font-black text-zinc-300">{index + 1}</span>
                                    </div>

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
                                    {compactSignal && (
                                        <div className="absolute bottom-1.5 left-1 right-1 z-10">
                                            <span className="flex items-center gap-0.5 px-1.5 py-1 rounded-sm bg-orange-500/95 backdrop-blur-sm text-[9px] font-black text-white leading-none w-full shadow-md">
                                                <span className="shrink-0">T{compactSignal.rank}</span>
                                                <span className="opacity-50">·</span>
                                                <span className="truncate">{compactSignal.showTitle}</span>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <p className="dark:text-white text-zinc-900 font-semibold text-[10px] md:text-xs group-hover:text-orange-400 transition-colors line-clamp-1">
                                    {artist.nameRomanized}
                                </p>
                                {artist.nameHangul && (
                                    <p className="text-zinc-600 text-[9px] line-clamp-1 mt-0.5">{artist.nameHangul}</p>
                                )}
                            </Link>
                        )
                    })}
                </div>
            )}

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
