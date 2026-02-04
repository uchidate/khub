'use client'

import { useFavorites } from '@/hooks/useFavorites'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function FavoritesPage() {
    const { favorites, isLoaded } = useFavorites()

    if (!isLoaded) {
        return (
            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-500 font-medium">Carregando seus favoritos...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20 min-h-screen">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                    <h1 className="text-4xl md:text-6xl font-black hallyu-gradient-text uppercase tracking-tighter italic">
                        Meus Favoritos
                    </h1>
                </div>
                <p className="text-zinc-500 max-w-xl text-lg font-medium">
                    Sua coleção pessoal salva localmente. {favorites.length} {favorites.length === 1 ? 'item favoritado' : 'itens favoritados'}.
                </p>
            </header>

            {/* Stats */}
            <div className="bg-zinc-900/50 rounded-xl border border-white/5 p-8 mb-8">
                <p className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-2">Total de Favoritos</p>
                <p className="text-5xl font-black text-white">{favorites.length}</p>
            </div>

            {/* Info */}
            {favorites.length === 0 ? (
                <div className="bg-zinc-900/50 rounded-xl border border-white/5 p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                            <Heart className="w-8 h-8 text-zinc-600" />
                        </div>
                        <div>
                            <p className="text-zinc-400 font-bold mb-1">Nenhum favorito ainda</p>
                            <p className="text-zinc-600 text-sm font-medium mb-6">
                                Explore o HallyuHub e adicione seus favoritos clicando no ícone de coração
                            </p>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <Link href="/artists" className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors">
                                Ver Artistas
                            </Link>
                            <Link href="/productions" className="px-6 py-3 bg-zinc-800 text-white rounded-lg font-bold text-sm hover:bg-zinc-700 transition-colors">
                                Ver Produções
                            </Link>
                            <Link href="/news" className="px-6 py-3 bg-zinc-800 text-white rounded-lg font-bold text-sm hover:bg-zinc-700 transition-colors">
                                Ver Notícias
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-6">
                        <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Como visualizar seus favoritos
                        </h3>
                        <p className="text-blue-300/80 text-sm font-medium leading-relaxed">
                            Seus favoritos são salvos localmente no navegador. Visite as páginas de artistas, produções ou notícias
                            para ver seus itens favoritados destacados com o ícone de coração preenchido.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link
                            href="/artists"
                            className="bg-zinc-900/50 rounded-xl border border-white/5 p-8 hover:border-purple-500/30 transition-colors group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-white group-hover:text-purple-500 transition-colors">
                                    Artistas
                                </h3>
                                <svg className="w-6 h-6 text-zinc-600 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <p className="text-zinc-500 text-sm font-medium">
                                Ver todos os artistas e encontrar seus favoritos
                            </p>
                        </Link>

                        <Link
                            href="/productions"
                            className="bg-zinc-900/50 rounded-xl border border-white/5 p-8 hover:border-purple-500/30 transition-colors group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-white group-hover:text-purple-500 transition-colors">
                                    Produções
                                </h3>
                                <svg className="w-6 h-6 text-zinc-600 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <p className="text-zinc-500 text-sm font-medium">
                                Ver todas as produções e encontrar seus favoritos
                            </p>
                        </Link>

                        <Link
                            href="/news"
                            className="bg-zinc-900/50 rounded-xl border border-white/5 p-8 hover:border-purple-500/30 transition-colors group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-white group-hover:text-purple-500 transition-colors">
                                    Notícias
                                </h3>
                                <svg className="w-6 h-6 text-zinc-600 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <p className="text-zinc-500 text-sm font-medium">
                                Ver todas as notícias e encontrar seus favoritos
                            </p>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
