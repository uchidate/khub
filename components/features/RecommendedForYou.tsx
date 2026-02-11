'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Calendar, User } from 'lucide-react'

interface RecommendedNews {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: string
    tags: string[]
    artistsCount: number
}

interface RecommendedForYouProps {
    news: RecommendedNews[]
    isAuthenticated: boolean
    favoritesCount: number
}

export function RecommendedForYou({ news, isAuthenticated, favoritesCount }: RecommendedForYouProps) {
    // Não renderiza se usuário não está logado ou não tem favoritos
    if (!isAuthenticated || favoritesCount === 0 || news.length === 0) {
        return null
    }

    return (
        <section className="py-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl">
                        <Heart className="w-6 h-6 text-white fill-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-white">
                            Você Pode Gostar
                        </h2>
                        <p className="text-zinc-400 text-sm mt-1">
                            Baseado nos seus {favoritesCount} artista{favoritesCount > 1 ? 's' : ''} favorito{favoritesCount > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <Link
                    href="/news/feed"
                    className="text-purple-400 hover:text-purple-300 font-bold text-sm transition-colors hidden md:block"
                >
                    Ver feed completo →
                </Link>
            </div>

            {/* Grid de Notícias Recomendadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                        <Link
                            href={`/news/${item.id}`}
                            className="group block bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/5 hover:border-pink-500/30 transition-all hover:shadow-lg hover:shadow-pink-500/10"
                        >
                            {/* Image */}
                            <div className="relative aspect-video overflow-hidden bg-zinc-900">
                                {/* Recommended Badge */}
                                <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center gap-1.5">
                                    <Heart className="w-3 h-3 text-white fill-white" />
                                    <span className="text-white text-xs font-black uppercase">
                                        Para Você
                                    </span>
                                </div>

                                {item.imageUrl ? (
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-pink-900 to-rose-900 flex items-center justify-center">
                                        <Heart className="w-12 h-12 text-white/30" />
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                {/* Tags */}
                                {item.tags.length > 0 && (
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        {item.tags.slice(0, 2).map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2 py-1 bg-pink-600/20 text-pink-400 border border-pink-500/20 text-xs font-black uppercase tracking-wider rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Title */}
                                <h3 className="text-white font-bold text-lg md:text-xl group-hover:text-pink-400 transition-colors line-clamp-2 mb-3 leading-tight">
                                    {item.title}
                                </h3>

                                {/* Meta */}
                                <div className="flex items-center gap-4 text-xs text-zinc-400">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>
                                            {new Date(item.publishedAt).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: 'short'
                                            })}
                                        </span>
                                    </div>
                                    {item.artistsCount > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            <span>
                                                {item.artistsCount} artista{item.artistsCount > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Ver feed completo mobile */}
            <div className="mt-6 md:hidden text-center">
                <Link
                    href="/news/feed"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    Ver feed personalizado
                </Link>
            </div>
        </section>
    )
}
