'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Command, User, Film, Newspaper, Loader2, TrendingUp, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { getRoleLabel } from '@/lib/utils/role-labels'
import { useAnalytics } from '@/hooks/useAnalytics'

export function QuickSearch() {
    const [modalOpen, setModalOpen] = useState(false)
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const { trackSearch } = useAnalytics()

    const { query, setQuery, results, isLoading, clearSearch } = useGlobalSearch()

    // CMD+K / CTRL+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setModalOpen(prev => !prev)
            }
            if (e.key === 'Escape') closeModal()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Focar + travar scroll
    useEffect(() => {
        if (modalOpen) {
            setTimeout(() => inputRef.current?.focus(), 80)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [modalOpen])

    const closeModal = () => {
        setModalOpen(false)
        clearSearch()
    }

    const handleNavigate = (href: string) => {
        closeModal()
        if (query.trim().length >= 3) trackSearch(query.trim(), 'global')
        router.push(href)
    }

    const hasResults = results.total > 0

    return (
        <AnimatePresence>
            {modalOpen && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center pt-16 md:pt-24 px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={closeModal}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: -12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -12 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="relative w-full max-w-2xl bg-zinc-900/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
                    >
                        {/* Input */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                            <Search className="text-zinc-500 flex-shrink-0" size={18} />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Buscar artistas, grupos, produções ou notícias..."
                                className="flex-1 bg-transparent text-white placeholder-zinc-500 focus:outline-none text-base"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            {isLoading && <Loader2 className="text-zinc-500 animate-spin flex-shrink-0" size={16} />}
                            {query && !isLoading && (
                                <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-white transition-colors flex-shrink-0">
                                    <X size={16} />
                                </button>
                            )}
                            <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-zinc-500 border border-white/5 flex-shrink-0">
                                <Command size={10} /> K
                            </div>
                            <button onClick={closeModal} className="text-zinc-500 hover:text-white transition-colors flex-shrink-0 ml-1">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Resultados */}
                        <div className="max-h-[65vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>

                            {/* Estado inicial */}
                            {!isLoading && !hasResults && query.trim().length < 2 && (
                                <div className="py-12 text-center">
                                    <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-zinc-500 text-sm font-medium">Digite para buscar no HallyuHub</p>
                                    <p className="text-zinc-700 text-xs mt-1">Artistas · Grupos · Produções · Notícias</p>
                                </div>
                            )}

                            {/* Sem resultados */}
                            {!isLoading && !hasResults && query.trim().length >= 2 && (
                                <div className="py-12 text-center">
                                    <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-zinc-400 text-sm">Nenhum resultado para &quot;{query}&quot;</p>
                                    <p className="text-zinc-600 text-xs mt-1">Tente buscar por artistas, notícias ou produções</p>
                                </div>
                            )}

                            {/* Resultados agrupados */}
                            {hasResults && (
                                <div className="py-2">

                                    {/* Artistas */}
                                    {results.artists.length > 0 && (
                                        <div className="p-3 border-b border-white/5">
                                            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-purple-400 mb-1">
                                                <User className="w-3.5 h-3.5" />
                                                Artistas ({results.artists.length})
                                            </div>
                                            <div className="space-y-0.5">
                                                {results.artists.map((artist) => (
                                                    <button
                                                        key={artist.id}
                                                        onClick={() => handleNavigate(`/artists/${artist.id}`)}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
                                                    >
                                                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                                                            {artist.primaryImageUrl ? (
                                                                <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill className="object-cover" sizes="40px" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                                                    <User size={18} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors truncate">
                                                                {artist.nameRomanized}
                                                            </p>
                                                            {artist.roles.length > 0 && (
                                                                <p className="text-xs text-zinc-500 truncate">
                                                                    {getRoleLabel(artist.roles[0], artist.gender)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {artist.trendingScore > 0 && (
                                                            <TrendingUp className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Grupos */}
                                    {results.groups.length > 0 && (
                                        <div className="p-3 border-b border-white/5">
                                            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-violet-400 mb-1">
                                                <Users className="w-3.5 h-3.5" />
                                                Grupos ({results.groups.length})
                                            </div>
                                            <div className="space-y-0.5">
                                                {results.groups.map((group) => (
                                                    <button
                                                        key={group.id}
                                                        onClick={() => handleNavigate(`/groups/${group.id}`)}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
                                                    >
                                                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                                                            {group.profileImageUrl ? (
                                                                <Image src={group.profileImageUrl} alt={group.name} fill className="object-cover" sizes="40px" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                                                    <Users size={18} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-white text-sm group-hover:text-violet-400 transition-colors truncate">
                                                                {group.name}
                                                            </p>
                                                            {group.nameHangul && (
                                                                <p className="text-xs text-zinc-500 truncate">{group.nameHangul}</p>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Produções */}
                                    {results.productions.length > 0 && (
                                        <div className="p-3 border-b border-white/5">
                                            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-1">
                                                <Film className="w-3.5 h-3.5" />
                                                Produções ({results.productions.length})
                                            </div>
                                            <div className="space-y-0.5">
                                                {results.productions.map((production) => (
                                                    <button
                                                        key={production.id}
                                                        onClick={() => handleNavigate(`/productions/${production.id}`)}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
                                                    >
                                                        <div className="relative w-9 h-[52px] rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                                                            {production.imageUrl ? (
                                                                <Image src={production.imageUrl} alt={production.titlePt} fill className="object-cover" sizes="36px" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                                                    <Film size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors truncate">
                                                                {production.titlePt}
                                                            </p>
                                                            <p className="text-xs text-zinc-500 truncate">
                                                                {production.type}{production.year ? ` · ${production.year}` : ''}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Notícias */}
                                    {results.news.length > 0 && (
                                        <div className="p-3">
                                            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-pink-400 mb-1">
                                                <Newspaper className="w-3.5 h-3.5" />
                                                Notícias ({results.news.length})
                                            </div>
                                            <div className="space-y-0.5">
                                                {results.news.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleNavigate(`/news/${item.id}`)}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
                                                    >
                                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                                                            {item.imageUrl ? (
                                                                <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="40px" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                                                    <Newspaper size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-white text-sm group-hover:text-pink-400 transition-colors line-clamp-2 leading-snug">
                                                                {item.title}
                                                            </p>
                                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                                {new Date(item.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Ver todos */}
                                    <div className="px-5 py-3 border-t border-white/5">
                                        <Link
                                            href={`/search?q=${encodeURIComponent(query)}`}
                                            onClick={closeModal}
                                            className="flex items-center justify-center gap-2 py-2 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors"
                                        >
                                            Ver todos os {results.total} resultados →
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer hints */}
                        <div className="px-5 py-2 border-t border-white/5 flex items-center gap-4 text-[10px] text-zinc-600">
                            <span><kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">↵</kbd> selecionar</span>
                            <span><kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">Esc</kbd> fechar</span>
                            <span className="ml-auto"><kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">⌘K</kbd> alternar</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
