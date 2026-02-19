'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, Calendar, Star, Trophy } from 'lucide-react'

interface LatestProduction {
    id: string
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
    createdAt?: string
}

interface LatestProductionsProps {
    productions: LatestProduction[]
    title?: string
    subtitle?: string
    variant?: 'latest' | 'top'
}

export function LatestProductions({
    productions,
    title,
    subtitle,
    variant = 'latest',
}: LatestProductionsProps) {
    if (productions.length === 0) return null

    const isNew = (createdAt?: string) => {
        if (!createdAt) return false
        const daysSinceAdded = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceAdded < 7
    }

    const displayTitle = title ?? (variant === 'top' ? 'Mais Bem Avaliados' : 'Recém Adicionados')
    const displaySubtitle = subtitle ?? (variant === 'top' ? 'Nota TMDB acima de 7.5' : 'Últimos dramas e filmes no catálogo')
    const Icon = variant === 'top' ? Trophy : Sparkles
    const iconGradient = variant === 'top' ? 'from-yellow-500 to-orange-500' : 'from-purple-600 to-pink-600'

    return (
        <section className="py-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-gradient-to-br ${iconGradient} rounded-xl`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-white">
                            {displayTitle}
                        </h2>
                        <p className="text-zinc-400 text-sm mt-1">
                            {displaySubtitle}
                        </p>
                    </div>
                </div>
                <Link
                    href="/productions"
                    className="text-purple-400 hover:text-purple-300 font-bold text-sm transition-colors hidden md:block"
                >
                    Ver todos →
                </Link>
            </div>

            {/* Grid de Produções */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {productions.map((production, index) => (
                    <motion.div
                        key={production.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                        <Link
                            href={`/productions/${production.id}`}
                            className="group block"
                        >
                            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 mb-3 shadow-lg">
                                {/* New Badge */}
                                {isNew(production.createdAt) && variant === 'latest' && (
                                    <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
                                        <span className="text-white text-xs font-black uppercase">
                                            Novo
                                        </span>
                                    </div>
                                )}

                                {/* Rating Badge */}
                                {production.voteAverage && production.voteAverage > 0 && (
                                    <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                        <span className="text-white text-xs font-bold">
                                            {production.voteAverage.toFixed(1)}
                                        </span>
                                    </div>
                                )}

                                {/* Poster */}
                                {production.imageUrl ? (
                                    <Image
                                        src={production.imageUrl}
                                        alt={production.titlePt}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-4">
                                        <span className="text-white text-center text-sm font-bold line-clamp-3">
                                            {production.titlePt}
                                        </span>
                                    </div>
                                )}

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                                {/* Info on hover */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                                        <span className="px-2 py-0.5 bg-purple-600/80 backdrop-blur-sm rounded-full font-bold">
                                            {production.type}
                                        </span>
                                        {production.year && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span className="font-medium">{production.year}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="px-1">
                                <h3 className="text-white font-bold text-sm group-hover:text-purple-400 transition-colors line-clamp-2 leading-tight">
                                    {production.titlePt}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                                    <span>{production.type}</span>
                                    {production.year && (
                                        <>
                                            <span>•</span>
                                            <span>{production.year}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Ver todos mobile */}
            <div className="mt-6 md:hidden text-center">
                <Link
                    href="/productions"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    Ver todas as produções
                </Link>
            </div>
        </section>
    )
}
