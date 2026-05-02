'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Search, X, Loader2, User, BookOpen, Film, TrendingUp, Users } from 'lucide-react'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { getRoleLabel } from '@/lib/utils/role-labels'

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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false)
                inputRef.current?.blur()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [setIsOpen])

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
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setIsOpen(true)
                        }}
                        onFocus={() => setIsOpen(true)}
                        placeholder="Buscar artistas, dramas…"
                        className="w-full pl-5 pr-32 py-3 bg-surface border border-border rounded-full text-foreground placeholder-[#6b6b6b] focus:outline-none focus:border-accent transition-all text-[13px]"
                    />

                    {/* Right side icons */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {query && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="p-1 hover:bg-surface-hover rounded-full transition-colors"
                                aria-label="Limpar busca"
                            >
                                <X className="w-4 h-4 text-muted" />
                            </button>
                        )}

                        <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-background border border-border rounded text-xs text-muted font-mono shadow-sm">
                            <span>⌘K</span>
                        </div>

                        <Search className="w-4 h-4 text-muted" />
                    </div>
                </div>
            </form>

            {/* Results Dropdown */}
            {isOpen && query.trim().length >= 2 && (
                <div className="absolute top-full mt-2 w-[660px] max-w-[90vw] bg-background border border-border rounded-2xl shadow-xl overflow-hidden z-50">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 py-8 text-muted">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Buscando...</span>
                        </div>
                    )}

                    {/* Results */}
                    {!isLoading && hasResults && (
                        <div className="max-h-[500px] overflow-y-auto">
                            {/* Artists */}
                            {results.artists.length > 0 && (
                                <div className="p-3 border-b border-border">
                                    <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#ff2d78]">
                                        <User className="w-3.5 h-3.5" />
                                        Artistas ({results.artists.length})
                                    </div>
                                    <div className="space-y-0.5">
                                        {results.artists.map((artist) => (
                                            <Link
                                                key={artist.id}
                                                href={`/artists/${artist.slug ?? artist.id}`}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors group"
                                            >
                                                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-surface flex-shrink-0">
                                                    {artist.primaryImageUrl ? (
                                                        <Image
                                                            src={artist.primaryImageUrl}
                                                            alt={artist.nameRomanized}
                                                            fill
                                                            className="object-cover"
                                                            sizes="36px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted font-bold text-sm">
                                                            {artist.nameRomanized[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-foreground text-[13px] group-hover:text-[#ff2d78] transition-colors truncate">
                                                        {artist.nameRomanized}
                                                    </p>
                                                    {artist.roles.length > 0 && (
                                                        <p className="text-xs text-muted truncate">
                                                            {getRoleLabel(artist.roles[0], artist.gender)}
                                                        </p>
                                                    )}
                                                </div>
                                                {artist.trendingScore > 0 && (
                                                    <TrendingUp className="w-3.5 h-3.5 text-[#ff2d78]" />
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Groups */}
                            {results.groups.length > 0 && (
                                <div className="p-3 border-b border-border">
                                    <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#7c3aed]">
                                        <Users className="w-3.5 h-3.5" />
                                        Grupos ({results.groups.length})
                                    </div>
                                    <div className="space-y-0.5">
                                        {results.groups.map((group) => (
                                            <Link
                                                key={group.id}
                                                href={`/groups/${group.slug ?? group.id}`}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors group"
                                            >
                                                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-surface flex-shrink-0">
                                                    {group.profileImageUrl ? (
                                                        <Image
                                                            src={group.profileImageUrl}
                                                            alt={group.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="36px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted font-bold text-sm">
                                                            {group.name[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-foreground text-[13px] group-hover:text-[#7c3aed] transition-colors truncate">
                                                        {group.name}
                                                    </p>
                                                    {group.nameHangul && (
                                                        <p className="text-xs text-muted truncate">{group.nameHangul}</p>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Productions */}
                            {results.productions.length > 0 && (
                                <div className="p-3 border-b border-border">
                                    <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#0ea5e9]">
                                        <Film className="w-3.5 h-3.5" />
                                        Produções ({results.productions.length})
                                    </div>
                                    <div className="space-y-0.5">
                                        {results.productions.map((production) => (
                                            <Link
                                                key={production.id}
                                                href={`/productions/${production.slug ?? production.id}`}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface transition-colors group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-foreground text-[13px] group-hover:text-[#0ea5e9] transition-colors truncate">
                                                        {production.titlePt}
                                                    </p>
                                                    <p className="text-xs text-muted truncate">
                                                        {production.type} {production.year && `• ${production.year}`}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Artigos */}
                            {results.articles.length > 0 && (
                                <div className="p-3">
                                    <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#ff2d78]">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        Artigos ({results.articles.length})
                                    </div>
                                    <div className="space-y-0.5">
                                        {results.articles.map((article) => (
                                            <Link
                                                key={article.id}
                                                href={`/blog/${article.slug}`}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface transition-colors group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-foreground text-[13px] group-hover:text-[#ff2d78] transition-colors line-clamp-2 leading-tight">
                                                        {article.title}
                                                    </p>
                                                    <p className="text-xs text-muted mt-1">
                                                        {new Date(article.publishedAt).toLocaleDateString('pt-BR', {
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

                            {/* Ver todos */}
                            <div className="p-3 border-t border-border">
                                <Link
                                    href={`/search?q=${encodeURIComponent(query)}`}
                                    onClick={() => setIsOpen(false)}
                                    className="block w-full py-2 text-center text-[13px] font-semibold text-[#ff2d78] hover:underline transition-colors"
                                >
                                    Ver todos os {results.total} resultados →
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !hasResults && (
                        <div className="py-12 text-center">
                            <Search className="w-10 h-10 text-border mx-auto mb-3" />
                            <p className="text-muted text-sm">
                                Nenhum resultado para &quot;{query}&quot;
                            </p>
                            <p className="text-muted text-xs mt-1">
                                Tente buscar por artistas, notícias ou produções
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
