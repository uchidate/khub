import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

interface TrendingArtist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
    trendingScore: number
    viewCount: number
}

interface TrendingArtistsProps {
    artists: TrendingArtist[]
}

const RANK_BADGE: Record<number, string> = {
    0: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-yellow-500/50',
    1: 'bg-gradient-to-br from-zinc-300 to-zinc-400 text-black shadow-zinc-400/50',
    2: 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-amber-700/50',
}

export function TrendingArtists({ artists }: TrendingArtistsProps) {
    if (artists.length === 0) return null

    const maxScore = Math.max(...artists.map(a => a.trendingScore), 1)

    return (
        <section className="py-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-white">
                            Trending Now
                        </h2>
                        <p className="text-zinc-400 text-sm mt-1">
                            Artistas mais populares do momento
                        </p>
                    </div>
                </div>
                <Link
                    href="/artists?sortBy=trending"
                    className="text-purple-400 hover:text-purple-300 font-bold text-sm transition-colors hidden md:block"
                >
                    Ver todos →
                </Link>
            </div>

            {/* Grid — portrait 2:3 */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
                {artists.map((artist, index) => {
                    const barWidth = Math.round((artist.trendingScore / maxScore) * 100)
                    const badgeClass = RANK_BADGE[index] ?? 'bg-black/60 backdrop-blur-sm text-zinc-300 border border-white/20'

                    return (
                        <Link
                            key={artist.id}
                            href={`/artists/${artist.id}`}
                            className="group block"
                        >
                            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 mb-2.5">
                                {/* Rank Badge */}
                                <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg ${badgeClass}`}>
                                    {index + 1}
                                </div>

                                {/* Image */}
                                {artist.primaryImageUrl ? (
                                    <Image
                                        src={artist.primaryImageUrl}
                                        alt={artist.nameRomanized}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 17vw"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                        <span className="text-white text-4xl font-black">
                                            {artist.nameRomanized[0]}
                                        </span>
                                    </div>
                                )}

                                {/* Bottom gradient + bar */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
                                    <div className="w-full bg-black/40 rounded-full h-0.5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="px-0.5">
                                <h3 className="text-white font-bold text-xs md:text-sm group-hover:text-purple-400 transition-colors line-clamp-1">
                                    {artist.nameRomanized}
                                </h3>
                                {artist.nameHangul && (
                                    <p className="text-zinc-600 text-[10px] line-clamp-1 mt-0.5">
                                        {artist.nameHangul}
                                    </p>
                                )}
                                {artist.roles && artist.roles.length > 0 && (
                                    <p className="text-zinc-500 text-[10px] mt-0.5 line-clamp-1">
                                        {artist.roles[0]}
                                    </p>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Ver todos — mobile */}
            <div className="mt-6 md:hidden text-center">
                <Link
                    href="/artists?sortBy=trending"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    Ver todos os trending
                </Link>
            </div>
        </section>
    )
}
