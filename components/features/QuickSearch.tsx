'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Command, User, Film, Newspaper, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface SearchResult {
    id: string
    title: string
    type: 'artist' | 'production' | 'news'
    subtitle?: string
    imageUrl?: string
}

export function QuickSearch() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    // Listen for CMD+K or CTRL+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(true)
            }
            if (e.key === 'Escape') {
                setIsOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
            setQuery('')
            setResults([])
        }
    }, [isOpen])

    // Search logic (mocked for now, will connect to API)
    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            return
        }

        const debounceTimer = setTimeout(async () => {
            setIsLoading(true)
            try {
                // Fetch from predictive API
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
                const data = await response.json()
                setResults(data)
            } catch (error) {
                console.error('Search failed:', error)
            } finally {
                setIsLoading(false)
            }
        }, 300)

        return () => clearTimeout(debounceTimer)
    }, [query])

    const handleSelect = (id: string, type: string) => {
        setIsOpen(false)
        const path = type === 'artist' ? 'artists' : type === 'production' ? 'productions' : 'news'
        router.push(`/${path}/${id}`)
    }

    return (
        <>
            {/* Search Trigger (Floating Badge or Button if needed, here we focus on CMD+K) */}

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 md:p-20">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />

                        {/* Search Palette */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="relative w-full max-w-2xl bg-zinc-900/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center gap-4">
                                <Search className="text-zinc-500" size={20} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Pesquise por artistas, dramas ou notícias..."
                                    className="flex-1 bg-transparent border-none text-white focus:outline-none text-lg font-medium"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <div className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-zinc-500 border border-white/5">
                                    <Command size={10} /> K
                                </div>
                                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {isLoading ? (
                                    <div className="p-8 text-center space-y-4">
                                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                        <p className="text-zinc-500 text-sm font-medium">Buscando no HallyuHub...</p>
                                    </div>
                                ) : results.length > 0 ? (
                                    <div className="p-2 space-y-1">
                                        {results.map((result) => (
                                            <button
                                                key={`${result.type}-${result.id}`}
                                                onClick={() => handleSelect(result.id, result.type)}
                                                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                                            >
                                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                                                    {result.imageUrl ? (
                                                        <Image src={result.imageUrl} alt={result.title} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                                            {result.type === 'artist' ? <User size={20} /> : result.type === 'production' ? <Film size={20} /> : <Newspaper size={20} />}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-white font-bold group-hover:text-purple-400 transition-colors">{result.title}</h4>
                                                        <span className="text-[10px] uppercase font-black text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded border border-white/5">
                                                            {result.type === 'artist' ? 'Artista' : result.type === 'production' ? 'Produção' : 'Notícia'}
                                                        </span>
                                                    </div>
                                                    {result.subtitle && <p className="text-xs text-zinc-500 line-clamp-1">{result.subtitle}</p>}
                                                </div>
                                                <ArrowRight className="text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all" size={16} />
                                            </button>
                                        ))}
                                    </div>
                                ) : query.length >= 2 ? (
                                    <div className="p-12 text-center">
                                        <p className="text-zinc-500 font-medium">Nenhum resultado para "{query}"</p>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center space-y-2">
                                        <p className="text-zinc-500 font-medium">Digite algo para começar a busca</p>
                                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Dica: tente buscar por "Blackpink" ou "The Glory"</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
