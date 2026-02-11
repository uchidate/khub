'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Search, X, Loader2, User, Newspaper, Film, TrendingUp } from 'lucide-react'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'

export function GlobalSearch() {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const {
        query,
        setQuery,
        results,
        isLoading,
        isOpen,
        setIsOpen,
        clearSearch
    } = useGlobalSearch()

    // Atalho de teclado Cmd/Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
                setIsOpen(true)
            }

            // ESC para fechar
            if (e.key === 'Escape') {
                setIsOpen(false)
                inputRef.current?.blur()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [setIsOpen])

    // Click outside para fechar
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, setIsOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`)
            setIsOpen(false)
        }
    }

    const hasResults = results.total > 0

    return (
        <div className="relative w-full max-w-2xl" ref={dropdownRef}>
            {/* Search Input */}
            <form onSubmit={handleSubmit} className="relative">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />

                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setIsOpen(true)
                        }}
                        onFocus={() => setIsOpen(true)}
                        placeholder="Buscar artistas, notícias, produções..."
                        className="w-full pl-12 pr-24 py-3 bg-zinc-900/50 border border-white/10 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />

                    {/* Right side icons */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {query && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="p-1 hover:bg-zinc-800 rounded-full transition-colors"
                                aria-label="Limpar busca"
                            >
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        )}

                        {/* Kbd shortcut hint */}
                        <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-zinc-800/50 rounded text-xs text-zinc-500 font-mono">
                            <span>⌘K</span>
                        </div>
                    </div>
                </div>
            </form>

            {/* Results Dropdown */}
            {isOpen && query.trim().length >= 2 && (
                <div className="absolute top-full mt-2 w-full bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 py-8 text-zinc-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Buscando...</span>
                        </div>
                    )}

                    {/* Results */}
                    {!isLoading && hasResults && (
                        <div className="max-h-[500px] overflow-y-auto">
                            {/* Artists */}
                            {results.artists.length > 0 && (
                                <div className="p-3 border-b border-white/5">
                                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wider text-purple-400">
                                        <User className="w-4 h-4" />
                                        Artistas ({results.artists.length})
                                    </div>
                                    <div className="space-y-1">
                                        {results.artists.map((artist) => (
                                            <Link
                                                key={artist.id}
                                                href={`/artists/${artist.id}`}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                                            >
                                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                                                    {artist.primaryImageUrl ? (
                                                        <Image
                                                            src={artist.primaryImageUrl}
                                                            alt={artist.nameRomanized}
                                                            fill
                                                            className="object-cover"
                                                            sizes="40px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                                            {artist.nameRomanized[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                                                        {artist.nameRomanized}
                                                    </p>
                                                    {artist.roles.length > 0 && (
                                                        <p className="text-xs text-zinc-500 truncate">
                                                            {artist.roles[0]}
                                                        </p>
                                                    )}
                                                </div>
                                                {artist.trendingScore > 0 && (
                                                    <TrendingUp className="w-4 h-4 text-orange-400" />
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* News */}
                            {results.news.length > 0 && (
                                <div className="p-3 border-b border-white/5">
                                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wider text-pink-400">
                                        <Newspaper className="w-4 h-4" />
                                        Notícias ({results.news.length})
                                    </div>
                                    <div className="space-y-1">
                                        {results.news.map((newsItem) => (
                                            <Link
                                                key={newsItem.id}
                                                href={`/news/${newsItem.id}`}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-white group-hover:text-pink-400 transition-colors line-clamp-2 leading-tight">
                                                        {newsItem.title}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 mt-1">
                                                        {new Date(newsItem.publishedAt).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: 'short'
                                                        })}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Productions */}
                            {results.productions.length > 0 && (
                                <div className="p-3">
                                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wider text-cyan-400">
                                        <Film className="w-4 h-4" />
                                        Produções ({results.productions.length})
                                    </div>
                                    <div className="space-y-1">
                                        {results.productions.map((production) => (
                                            <Link
                                                key={production.id}
                                                href={`/productions/${production.id}`}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                                                        {production.titlePt}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 truncate">
                                                        {production.type} {production.year && `• ${production.year}`}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ver todos os resultados */}
                            <div className="p-3 border-t border-white/5">
                                <Link
                                    href={`/search?q=${encodeURIComponent(query)}`}
                                    onClick={() => setIsOpen(false)}
                                    className="block w-full py-2 text-center text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    Ver todos os {results.total} resultados →
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !hasResults && (
                        <div className="py-12 text-center">
                            <Search className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                            <p className="text-zinc-400 text-sm">
                                Nenhum resultado para &quot;{query}&quot;
                            </p>
                            <p className="text-zinc-600 text-xs mt-1">
                                Tente buscar por artistas, notícias ou produções
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
