'use client'

import { useEffect, useRef } from 'react'
import { Search, X, Command, User, Film, BookOpen, Loader2, TrendingUp, Users, Sparkles, Compass, ShoppingBag, CalendarDays } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { getRoleLabel } from '@/lib/utils/role-labels'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useQuickSearch } from '@/lib/hooks/useQuickSearch'

export function QuickSearch() {
    const modalOpen = useQuickSearch(s => s.isOpen)
    const openModal = useQuickSearch(s => s.open)
    const storeClose = useQuickSearch(s => s.close)
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const { trackSearch } = useAnalytics()

    const { query, setQuery, results, isLoading, clearSearch } = useGlobalSearch()

    const closeModal = () => {
        storeClose()
        clearSearch()
    }

    // CMD+K / CTRL+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                modalOpen ? closeModal() : openModal()
            }
            if (e.key === 'Escape') closeModal()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [modalOpen]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const handleOpen = () => openModal()
        window.addEventListener('quick-search:open', handleOpen)
        return () => window.removeEventListener('quick-search:open', handleOpen)
    }, [openModal])

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

    const handleNavigate = (href: string) => {
        closeModal()
        if (query.trim().length >= 3) trackSearch(query.trim(), 'global')
        router.push(href)
    }

    const scopedHref = (base: string) => {
        const q = query.trim()
        return q ? `${base}?search=${encodeURIComponent(q)}` : base
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const q = query.trim()
        if (!q) return
        handleNavigate(`/search?q=${encodeURIComponent(q)}`)
    }

    const hasResults = results.total > 0

    return (
        <>
            {modalOpen && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center pt-16 md:pt-24 px-4">
                    {/* Backdrop */}
                    <div
                        onClick={closeModal}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
                    />

                    {/* Palette */}
                    <div
                        className="relative w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-background shadow-2xl shadow-black/10 animate-scale-in"
                    >
                        {/* Input */}
                        <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b border-border px-4 py-3">
                            <Search className="text-muted flex-shrink-0" size={18} />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Buscar artistas, grupos, produções, artigos ou loja..."
                                className="flex-1 bg-transparent text-foreground placeholder-[#6b6b6b] focus:outline-none text-base"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            {isLoading && <Loader2 className="text-muted animate-spin flex-shrink-0" size={16} />}
                            {query && !isLoading && (
                                <button type="button" onClick={() => setQuery('')} className="text-muted hover:text-foreground transition-colors flex-shrink-0">
                                    <X size={16} />
                                </button>
                            )}
                            <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-surface rounded text-[10px] font-bold text-muted border border-border flex-shrink-0">
                                <Command size={10} /> K
                            </div>
                            <button type="button" onClick={closeModal} className="text-muted hover:text-foreground transition-colors flex-shrink-0 ml-1">
                                <X size={18} />
                            </button>
                        </form>

                        <div className="flex h-12 items-center gap-2 overflow-x-auto border-b border-border px-4" style={{ scrollbarWidth: 'none' }}>
                            {[
                                { label: 'Artistas', href: scopedHref('/artists'), icon: User },
                                { label: 'Grupos', href: scopedHref('/groups'), icon: Users },
                                { label: 'Produções', href: scopedHref('/productions'), icon: Film },
                                { label: 'Loja', href: scopedHref('/loja'), icon: ShoppingBag },
                                { label: 'Calendário', href: '/calendario', icon: CalendarDays },
                            ].map(item => {
                                const Icon = item.icon
                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => handleNavigate(item.href)}
                                        className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-surface px-3 text-[12px] font-bold text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {item.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Resultados */}
                        <div className="max-h-[65vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e8e8e8 transparent' }}>

                            {/* Estado inicial */}
                            {!isLoading && !hasResults && query.trim().length < 2 && (
                                <div className="p-5">
                                    <div className="rounded-md border border-border bg-surface p-4">
                                        <div className="flex items-start gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-accent">
                                                <Sparkles className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <p className="text-sm font-black text-foreground">Busca global</p>
                                                <p className="mt-1 text-xs leading-5 text-muted">
                                                    Pesquise tudo ou pule direto para uma seção usando a faixa acima.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                        {[
                                            ['Artistas em alta', '/artists'],
                                            ['Grupos ativos', '/groups'],
                                            ['Dramas e filmes', '/productions'],
                                            ['Achados da loja', '/loja'],
                                        ].map(([label, href]) => (
                                            <button
                                                key={href}
                                                onClick={() => handleNavigate(href)}
                                                className="rounded-md border border-border bg-background px-3 py-2 text-left text-xs font-black text-foreground transition-colors hover:border-accent/40 hover:text-accent"
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sem resultados */}
                            {!isLoading && !hasResults && query.trim().length >= 2 && (
                                <div className="py-12 text-center">
                                    <Search className="w-10 h-10 text-[#e8e8e8] mx-auto mb-3" />
                                    <p className="text-muted text-sm">Nenhum resultado para &quot;{query}&quot;</p>
                                    <p className="text-muted text-xs mt-1 opacity-60">Tente artista, grupo, drama, artigo, loja ou agenda</p>
                                </div>
                            )}

                            {/* Resultados agrupados */}
                            {hasResults && (
                                <div className="py-2">
                                    {/* Atalhos */}
                                    {results.shortcuts.length > 0 && (
                                        <div className="p-3 border-b border-border">
                                            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#ff2d78] mb-1">
                                                <Compass className="w-3.5 h-3.5" />
                                                Ir para ({results.shortcuts.length})
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {results.shortcuts.map((shortcut) => (
                                                    <button
                                                        key={shortcut.id}
                                                        onClick={() => handleNavigate(shortcut.href)}
                                                        className="w-full rounded-md border border-border bg-surface/50 p-3 text-left transition-colors hover:border-accent/40 hover:bg-accent-soft/40"
                                                    >
                                                        <p className="text-sm font-black text-foreground">{shortcut.title}</p>
                                                        <p className="mt-1 line-clamp-2 text-xs leading-4 text-muted">{shortcut.description}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Artistas */}
                                    {results.artists.length > 0 && (
                                        <div className="p-3 border-b border-border">
                                            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#ff2d78] mb-1">
                                                <User className="w-3.5 h-3.5" />
                                                Artistas ({results.artists.length})
                                            </div>
                                            <div className="space-y-0.5">
                                                {results.artists.map((artist) => (
                                                    <button
                                                        key={artist.id}
                                                        onClick={() => handleNavigate(`/artists/${artist.id}`)}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-surface transition-colors group text-left"
                                                    >
                                                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface flex-shrink-0">
                                                            {artist.primaryImageUrl ? (
                                                                <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill className="object-cover" sizes="40px" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-muted">
                                                                    <User size={18} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-foreground text-sm group-hover:text-[#ff2d78] transition-colors truncate">
                                                                {artist.nameRomanized}
                                                            </p>
                                                            {artist.roles.length > 0 && (
                                                                <p className="text-xs text-muted truncate">
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
                                        <div className="p-3 border-b border-border">
                                            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#ff2d78] mb-1">
                                                <Users className="w-3.5 h-3.5" />
                                                Grupos ({results.groups.length})
                                            </div>
                                            <div className="space-y-0.5">
                                                {results.groups.map((group) => (
                                                    <button
                                                        key={group.id}
                                                        onClick={() => handleNavigate(`/groups/${group.slug ?? group.id}`)}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-surface transition-colors group text-left"
                                                    >
                                                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface flex-shrink-0">
                                                            {group.profileImageUrl ? (
                                                                <Image src={group.profileImageUrl} alt={group.name} fill className="object-cover" sizes="40px" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-muted">
                                                                    <Users size={18} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-foreground text-sm group-hover:text-[#ff2d78] transition-colors truncate">
                                                                {group.name}
                                                            </p>
                                                            {group.nameHangul && (
                                                                <p className="text-xs text-muted truncate">{group.nameHangul}</p>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Produções */}
                                    {results.productions.length > 0 && (
                                        <div className="p-3 border-b border-border">
                                            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#ff2d78] mb-1">
                                                <Film className="w-3.5 h-3.5" />
                                                Produções ({results.productions.length})
                                            </div>
                                            <div className="space-y-0.5">
                                                {results.productions.map((production) => (
                                                    <button
                                                        key={production.id}
                                                        onClick={() => handleNavigate(`/productions/${production.slug ?? production.id}`)}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-surface transition-colors group text-left"
                                                    >
                                                        <div className="relative w-9 h-[52px] rounded-lg overflow-hidden bg-surface flex-shrink-0">
                                                            {production.imageUrl ? (
                                                                <Image src={production.imageUrl} alt={production.titlePt} fill className="object-cover" sizes="36px" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-muted">
                                                                    <Film size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-foreground text-sm group-hover:text-[#ff2d78] transition-colors truncate">
                                                                {production.titlePt}
                                                            </p>
                                                            <p className="text-xs text-muted truncate">
                                                                {production.type}{production.year ? ` · ${production.year}` : ''}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Artigos */}
                                    {results.articles.length > 0 && (
                                        <div className="p-3">
                                            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#ff2d78] mb-1">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                Artigos ({results.articles.length})
                                            </div>
                                            <div className="space-y-0.5">
                                                {results.articles.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleNavigate(`/blog/${item.slug}`)}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-surface transition-colors group text-left"
                                                    >
                                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                                                            {item.coverImageUrl ? (
                                                                <Image src={item.coverImageUrl} alt={item.title} fill className="object-cover" sizes="40px" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-muted">
                                                                    <BookOpen size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-foreground text-sm group-hover:text-[#ff2d78] transition-colors line-clamp-2 leading-snug">
                                                                {item.title}
                                                            </p>
                                                            <p className="text-xs text-muted mt-0.5">
                                                                {new Date(item.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Loja */}
                                    {results.storeProducts.length > 0 && (
                                        <div className="p-3 border-b border-border">
                                            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#ff2d78] mb-1">
                                                <ShoppingBag className="w-3.5 h-3.5" />
                                                Loja ({results.storeProducts.length})
                                            </div>
                                            <div className="space-y-0.5">
                                                {results.storeProducts.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleNavigate(`/loja?search=${encodeURIComponent(item.name)}`)}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-surface transition-colors group text-left"
                                                    >
                                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                                                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="40px" unoptimized />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-foreground text-sm group-hover:text-[#ff2d78] transition-colors truncate">
                                                                {item.name}
                                                            </p>
                                                            <p className="text-xs text-muted truncate">
                                                                {item.price ? `${item.price} · ` : ''}{item.store}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Ver todos */}
                                    <div className="px-5 py-3 border-t border-border">
                                        <Link
                                            href={`/search?q=${encodeURIComponent(query)}`}
                                            onClick={closeModal}
                                            className="flex items-center justify-center gap-2 py-2 text-sm font-bold text-[#ff2d78] hover:opacity-80 transition-opacity"
                                        >
                                            Ver todos os {results.total} resultados →
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer hints */}
                        <div className="px-5 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted">
                            <span><kbd className="font-mono bg-surface px-1 py-0.5 rounded text-muted border border-border">↵</kbd> selecionar</span>
                            <span><kbd className="font-mono bg-surface px-1 py-0.5 rounded text-muted border border-border">Esc</kbd> fechar</span>
                            <span className="ml-auto"><kbd className="font-mono bg-surface px-1 py-0.5 rounded text-muted border border-border">⌘K</kbd> alternar</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
