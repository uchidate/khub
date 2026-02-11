'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

interface TrendingArtist {
    id: string
    nameRomanized: string
    primaryImageUrl: string | null
    roles: string[]
    trendingScore: number
    viewCount: number
}

interface TrendingArtistsProps {
    artists: TrendingArtist[]
}

export function TrendingArtists({ artists }: TrendingArtistsProps) {
    if (artists.length === 0) return null

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

            {/* Grid de Artistas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {artists.map((artist, index) => (
                    <motion.div
                        key={artist.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                        <Link
                            href={`/artists/${artist.id}`}
                            className="group block"
                        >
                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 mb-3">
                                {/* Trending Badge */}
                                <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-white" />
                                    <span className="text-white text-xs font-black">
                                        #{index + 1}
                                    </span>
                                </div>

                                {/* Image */}
                                {artist.primaryImageUrl ? (
                                    <Image
                                        src={artist.primaryImageUrl}
                                        alt={artist.nameRomanized}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                        <span className="text-white text-4xl font-black">
                                            {artist.nameRomanized[0]}
                                        </span>
                                    </div>
                                )}

                                {/* Gradient Overlay on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {/* Info */}
                            <div className="px-1">
                                <h3 className="text-white font-bold text-sm md:text-base group-hover:text-purple-400 transition-colors line-clamp-1">
                                    {artist.nameRomanized}
                                </h3>
                                {artist.roles && artist.roles.length > 0 && (
                                    <p className="text-zinc-500 text-xs mt-1 line-clamp-1">
                                        {artist.roles[0]}
                                    </p>
                                )}
                                <div className="flex items-center gap-1 mt-2">
                                    <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                                            style={{ width: `${Math.min(artist.trendingScore / 10, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Ver todos mobile */}
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
