'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { AdminButton } from '@/components/admin/AdminButton'
import { Save, Search, X, Star, LayoutGrid, BookMarked, Loader2, Layers, Sparkles, Trash2 } from 'lucide-react'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostSummary {
    id: string
    title: string
    slug: string
    coverImageUrl: string | null
    publishedAt: string | null
    category: { name: string; slug: string } | null
}

interface HomepageConfig {
    homeFeaturedPostId: string | null
    homeSecondaryPostIds: string[]
    homeSidebarPostIds: string[]
    homeCarouselPostIds: string[]
    homeSpotlightArtistId: string | null
}

interface ArtistSummary {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    agency?: { name: string } | null
}

// ─── Post Search ──────────────────────────────────────────────────────────────

function usePostSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<PostSummary[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (query.trim().length < 2) { setResults([]); return }
        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/admin/blog?search=${encodeURIComponent(query)}&status=PUBLISHED&limit=8`)
                const data = await res.json() as { data?: PostSummary[] }
                setResults(data.data ?? [])
            } catch { setResults([]) }
            finally { setLoading(false) }
        }, 300)
        return () => clearTimeout(timer)
    }, [query])

    return { query, setQuery, results, loading }
}

function useArtistSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<ArtistSummary[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (query.trim().length < 2) { setResults([]); return }
        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/admin/artists?search=${encodeURIComponent(query)}&limit=8&sortBy=trendingScore&sortOrder=desc`)
                const data = await res.json() as { data?: ArtistSummary[] }
                setResults(data.data ?? [])
            } catch { setResults([]) }
            finally { setLoading(false) }
        }, 300)
        return () => clearTimeout(timer)
    }, [query])

    return { query, setQuery, results, loading }
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, onRemove, label }: { post: PostSummary; onRemove: () => void; label?: string }) {
    return (
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-surface group">
            <div className="w-12 h-9 rounded overflow-hidden bg-background border border-border/60 shrink-0">
                {post.coverImageUrl ? (
                    <Image src={post.coverImageUrl} alt={post.title} width={48} height={36} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-muted">
                        {post.title[0]}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                {label && <p className="text-[9px] font-bold uppercase tracking-wider text-muted mb-0.5">{label}</p>}
                <p className="text-[12px] font-semibold text-foreground truncate leading-tight">{post.title}</p>
                {post.category && (
                    <p className="text-[10px] text-muted truncate">{post.category.name}</p>
                )}
            </div>
            <button
                onClick={onRemove}
                className="shrink-0 p-1 rounded hover:bg-red-500/10 hover:text-red-400 text-muted transition-colors"
            >
                <X size={13} />
            </button>
        </div>
    )
}

function ArtistCard({ artist, onRemove }: { artist: ArtistSummary; onRemove: () => void }) {
    return (
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-surface group">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-background border border-border/60 shrink-0">
                {artist.primaryImageUrl ? (
                    <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} width={48} height={48} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-muted">
                        {artist.nameRomanized[0]}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate leading-tight">{artist.nameRomanized}</p>
                {artist.nameHangul && (
                    <p className="text-[10px] text-muted truncate">{artist.nameHangul}</p>
                )}
                {artist.agency?.name && (
                    <p className="text-[10px] text-muted truncate">{artist.agency.name}</p>
                )}
            </div>
            <button
                onClick={onRemove}
                className="shrink-0 p-1 rounded hover:bg-red-500/10 hover:text-red-400 text-muted transition-colors"
            >
                <X size={13} />
            </button>
        </div>
    )
}

function ArtistSpotlightPicker({
    selected,
    onSelect,
    onRemove,
}: {
    selected: ArtistSummary | null
    onSelect: (artist: ArtistSummary) => void
    onRemove: () => void
}) {
    const { query, setQuery, results, loading } = useArtistSearch()
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const visibleResults = results.filter(artist => artist.id !== selected?.id)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    return (
        <div className="rounded-xl border border-border bg-background">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-surface rounded-t-xl">
                <span className="text-accent"><Star size={15} /></span>
                <div>
                    <p className="text-[13px] font-bold text-foreground">Artista da semana</p>
                    <p className="text-[11px] text-muted">Defina manualmente o destaque da semana ou deixe vazio para usar a rotação automática do trending</p>
                </div>
            </div>

            <div className="p-3 space-y-2">
                {selected ? (
                    <ArtistCard artist={selected} onRemove={onRemove} />
                ) : (
                    <div className="rounded-lg border border-dashed border-border bg-surface/40 px-3 py-2 text-[11px] text-muted">
                        Sem override manual. A home usa a rotação semanal automática entre artistas em alta.
                    </div>
                )}

                <div className="relative" ref={dropdownRef}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-accent/50 transition-colors bg-surface/50">
                        <Search size={13} className="text-muted shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar artista..."
                            value={query}
                            onChange={e => { setQuery(e.target.value); setOpen(true) }}
                            onFocus={() => setOpen(true)}
                            className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted focus:outline-none"
                        />
                        {loading && <Loader2 size={12} className="text-muted animate-spin shrink-0" />}
                    </div>

                    {open && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-background shadow-xl overflow-hidden">
                            {visibleResults.map(artist => (
                                <button
                                    key={artist.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(artist)
                                        setQuery('')
                                        setOpen(false)
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left border-b border-border last:border-b-0 hover:bg-accent-soft transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface shrink-0">
                                        {artist.primaryImageUrl ? (
                                            <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} width={40} height={40} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-muted">{artist.nameRomanized[0]}</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-semibold truncate">{artist.nameRomanized}</p>
                                        {artist.nameHangul && <p className="text-[10px] text-muted truncate">{artist.nameHangul}</p>}
                                    </div>
                                </button>
                            ))}
                            {visibleResults.length === 0 && (
                                <p className="px-3 py-2 text-[11px] text-muted">
                                    Nenhum artista encontrado para sua busca.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Slot Picker ──────────────────────────────────────────────────────────────

function SlotPicker({
    label, icon, description,
    selected, onSelect, onRemove,
    blockedBySlot,
    max = 1,
    hideHeader = false,
}: {
    label: string
    icon: React.ReactNode
    description: string
    selected: PostSummary[]
    onSelect: (post: PostSummary) => void
    onRemove: (id: string) => void
    blockedBySlot?: Map<string, string>
    max?: number
    hideHeader?: boolean
}) {
    const { query, setQuery, results, loading } = usePostSearch()
    const [open, setOpen] = useState(false)
    const [filterMode, setFilterMode] = useState<'all' | 'available' | 'blocked'>('all')
    const selectedIds = new Set(selected.map(p => p.id))
    const dropdownRef = useRef<HTMLDivElement>(null)
    const candidateResults = results.filter(r => !selectedIds.has(r.id))
    const availableCount = candidateResults.filter(r => !blockedBySlot?.has(r.id)).length
    const blockedCount = candidateResults.length - availableCount
    const visibleResults = candidateResults.filter(post => {
        const isBlocked = !!blockedBySlot?.get(post.id)
        if (filterMode === 'available') return !isBlocked
        if (filterMode === 'blocked') return isBlocked
        return true
    })

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    return (
        <div className={hideHeader ? 'space-y-2' : 'rounded-xl border border-border bg-background'}>
            {!hideHeader && (
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-surface rounded-t-xl">
                    <span className="text-accent">{icon}</span>
                    <div>
                        <p className="text-[13px] font-bold text-foreground">{label}</p>
                        <p className="text-[11px] text-muted">{description}</p>
                    </div>
                    <span className="ml-auto text-[11px] text-muted font-medium">{selected.length}/{max}</span>
                </div>
            )}

            <div className={hideHeader ? 'space-y-2' : 'p-3 space-y-2'}>
                {/* Selected posts */}
                {selected.map((post, idx) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onRemove={() => onRemove(post.id)}
                        label={max > 1 ? `#${idx + 1}` : undefined}
                    />
                ))}

                {/* Add slot if not full */}
                {selected.length < max && (
                    <div className="relative" ref={dropdownRef}>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-accent/50 transition-colors bg-surface/50">
                            <Search size={13} className="text-muted shrink-0" />
                            <input
                                type="text"
                                placeholder="Buscar artigo publicado..."
                                value={query}
                                onChange={e => { setQuery(e.target.value); setOpen(true) }}
                                onFocus={() => setOpen(true)}
                                className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted focus:outline-none"
                            />
                            {loading && <Loader2 size={12} className="text-muted animate-spin shrink-0" />}
                        </div>

                        {open && (
                            <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-background shadow-xl overflow-hidden">
                                {candidateResults.length > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-surface/60">
                                        {[
                                            { key: 'all', label: `Tudo (${candidateResults.length})` },
                                            { key: 'available', label: `Disponiveis (${availableCount})` },
                                            { key: 'blocked', label: `Bloqueados (${blockedCount})` },
                                        ].map(tab => (
                                            <button
                                                key={tab.key}
                                                type="button"
                                                onClick={() => setFilterMode(tab.key as 'all' | 'available' | 'blocked')}
                                                className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                                                    filterMode === tab.key
                                                        ? 'bg-accent-soft text-foreground'
                                                        : 'text-muted hover:text-foreground hover:bg-surface'
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {visibleResults.map(post => {
                                    const blockedReason = blockedBySlot?.get(post.id)
                                    const isBlocked = !!blockedReason
                                    return (
                                        <button
                                            key={post.id}
                                            type="button"
                                            disabled={isBlocked}
                                            onClick={() => {
                                                if (isBlocked) return
                                                onSelect(post)
                                                setQuery('')
                                                setOpen(false)
                                            }}
                                            className={[
                                                'w-full flex items-center gap-2.5 px-3 py-2 text-left border-b border-border last:border-b-0 transition-colors',
                                                isBlocked
                                                    ? 'bg-surface/60 text-muted/70 cursor-not-allowed'
                                                    : 'hover:bg-accent-soft'
                                            ].join(' ')}
                                        >
                                            <div className="w-10 h-7 rounded overflow-hidden bg-surface shrink-0">
                                                {post.coverImageUrl ? (
                                                    <Image src={post.coverImageUrl} alt={post.title} width={40} height={28} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-muted">{post.title[0]}</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-semibold truncate">{post.title}</p>
                                                {post.category && <p className="text-[10px] text-muted">{post.category.name}</p>}
                                            </div>
                                            {isBlocked && (
                                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 shrink-0">
                                                    Em {blockedReason}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                                {candidateResults.length === 0 && (
                                    <p className="px-3 py-2 text-[11px] text-muted">
                                        Nenhum resultado para sua busca.
                                    </p>
                                )}
                                {candidateResults.length > 0 && visibleResults.length === 0 && (
                                    <p className="px-3 py-2 text-[11px] text-muted">
                                        Nenhum item no filtro selecionado.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomepageConfigPage() {
    const toast = useAdminToast()
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)

    const [featuredPost, setFeaturedPost] = useState<PostSummary | null>(null)
    const [carouselPosts, setCarouselPosts] = useState<PostSummary[]>([])
    const [secondaryPosts, setSecondaryPosts] = useState<PostSummary[]>([])
    const [sidebarPosts, setSidebarPosts] = useState<PostSummary[]>([])
    const [spotlightArtist, setSpotlightArtist] = useState<ArtistSummary | null>(null)
    const [autoPreview, setAutoPreview] = useState<PostSummary[]>([])

    useEffect(() => {
        fetch('/api/admin/blog?status=PUBLISHED&limit=5&sortBy=publishedAt&sortOrder=desc')
            .then(r => r.json() as Promise<{ data?: PostSummary[] }>)
            .then(d => setAutoPreview(d.data ?? []))
            .catch(() => {})
    }, [])

    const featuredId = featuredPost?.id ?? null
    const carouselIds = carouselPosts.map(p => p.id)
    const secondaryIds = secondaryPosts.map(p => p.id)
    const sidebarIds = sidebarPosts.map(p => p.id)

    const blockedForCarousel = new Map<string, string>([
        ...(featuredId ? [[featuredId, 'Card principal']] as [string, string][] : []),
        ...secondaryIds.map(id => [id, 'Cards secundarios'] as [string, string]),
        ...sidebarIds.map(id => [id, 'Artigos em destaque'] as [string, string]),
    ])
    const blockedForFeatured = new Map<string, string>([
        ...carouselIds.map(id => [id, 'Carrossel'] as [string, string]),
        ...secondaryIds.map(id => [id, 'Cards secundarios'] as [string, string]),
        ...sidebarIds.map(id => [id, 'Artigos em destaque'] as [string, string]),
    ])
    const blockedForSecondary = new Map<string, string>([
        ...(featuredId ? [[featuredId, 'Card principal']] as [string, string][] : []),
        ...carouselIds.map(id => [id, 'Carrossel'] as [string, string]),
        ...sidebarIds.map(id => [id, 'Artigos em destaque'] as [string, string]),
    ])
    const blockedForSidebar = new Map<string, string>([
        ...(featuredId ? [[featuredId, 'Card principal']] as [string, string][] : []),
        ...carouselIds.map(id => [id, 'Carrossel'] as [string, string]),
        ...secondaryIds.map(id => [id, 'Cards secundarios'] as [string, string]),
    ])

    // Load current config
    useEffect(() => {
        fetch('/api/admin/settings/homepage')
            .then(r => r.json() as Promise<{ config: HomepageConfig; postsById: Record<string, PostSummary>; artistsById: Record<string, ArtistSummary> }>)
            .then(({ config, postsById: pById, artistsById: aById }) => {
                setFeaturedPost(config.homeFeaturedPostId ? (pById[config.homeFeaturedPostId] ?? null) : null)
                setCarouselPosts((config.homeCarouselPostIds ?? []).map(id => pById[id]).filter(Boolean))
                setSecondaryPosts(config.homeSecondaryPostIds.map(id => pById[id]).filter(Boolean))
                setSidebarPosts(config.homeSidebarPostIds.map(id => pById[id]).filter(Boolean))
                setSpotlightArtist(config.homeSpotlightArtistId ? (aById[config.homeSpotlightArtistId] ?? null) : null)
            })
            .catch(() => toast.error('Erro ao carregar configuração'))
            .finally(() => setLoading(false))
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSave = useCallback(async () => {
        const allIds = [
            ...(featuredPost?.id ? [featuredPost.id] : []),
            ...carouselPosts.map(p => p.id),
            ...secondaryPosts.map(p => p.id),
            ...sidebarPosts.map(p => p.id),
        ]
        if (new Set(allIds).size !== allIds.length) {
            toast.error('Um mesmo post nao pode aparecer em mais de um slot editorial.')
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings/homepage', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    homeFeaturedPostId: featuredPost?.id ?? null,
                    homeCarouselPostIds: carouselPosts.map(p => p.id),
                    homeSecondaryPostIds: secondaryPosts.map(p => p.id),
                    homeSidebarPostIds: sidebarPosts.map(p => p.id),
                    homeSpotlightArtistId: spotlightArtist?.id ?? null,
                }),
            })
            const data = await res.json().catch(() => ({})) as { error?: string }
            if (!res.ok) {
                toast.error(data.error ?? 'Erro ao salvar configuracao')
                return
            }
            toast.success('Configuração salva! A home será atualizada em até 2 minutos.')
        } catch {
            toast.error('Erro ao salvar configuração')
        } finally {
            setSaving(false)
        }
    }, [featuredPost, carouselPosts, secondaryPosts, sidebarPosts, spotlightArtist?.id, toast])

    if (loading) {
        return (
            <AdminLayout title="Homepage Editorial" subtitle="Gerencie os destaques editoriais exibidos na página inicial">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-muted" size={24} />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="Homepage Editorial" subtitle="Gerencie os destaques editoriais exibidos na página inicial">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[20px] font-extrabold tracking-tight text-foreground">Homepage Editorial</h1>
                        <p className="text-[12px] text-muted mt-0.5">
                            Controle quais artigos aparecem nos destaques da página inicial.
                            Posts não configurados usam os mais recentes automaticamente.
                        </p>
                    </div>
                    <AdminButton onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Salvar
                    </AdminButton>
                </div>

                {/* Carrossel do Hero */}
                <div className="rounded-xl border border-border bg-background overflow-hidden">
                    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-surface">
                        <span className="text-accent"><Layers size={15} /></span>
                        <div className="flex-1">
                            <p className="text-[13px] font-bold text-foreground">Carrossel do Hero</p>
                            <p className="text-[11px] text-muted">Até 5 artigos que rotacionam no hero. Vazio = site preenche automaticamente com os mais recentes.</p>
                        </div>
                        <span className="text-[11px] text-muted font-medium">{carouselPosts.length}/5</span>
                        {carouselPosts.length > 0 && (
                            <button
                                onClick={() => setCarouselPosts([])}
                                className="flex items-center gap-1 text-[10px] font-semibold text-muted hover:text-red-400 transition-colors px-2 py-1 rounded border border-border hover:border-red-400/40"
                            >
                                <Trash2 size={10} /> Limpar
                            </button>
                        )}
                    </div>

                    {carouselPosts.length === 0 && (
                        <div className="px-4 py-3 border-b border-dashed border-border bg-accent/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={12} className="text-accent" />
                                <span className="text-[11px] font-bold text-accent uppercase tracking-wider">Modo automático ativo</span>
                            </div>
                            <p className="text-[11px] text-muted mb-2">O carrossel será preenchido automaticamente com os 5 artigos mais recentes:</p>
                            <div className="space-y-1">
                                {autoPreview.map((p, i) => (
                                    <div key={p.id} className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-muted/50 w-3">{i + 1}</span>
                                        <span className="text-[11px] text-muted truncate">{p.title}</span>
                                        {p.category && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface border border-border text-muted shrink-0">{p.category.name}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-3">
                        <SlotPicker
                            label=""
                            icon={null}
                            description=""
                            selected={carouselPosts}
                            onSelect={p => setCarouselPosts(prev => [...prev, p])}
                            onRemove={id => setCarouselPosts(prev => prev.filter(p => p.id !== id))}
                            blockedBySlot={blockedForCarousel}
                            max={5}
                            hideHeader
                        />
                    </div>
                </div>

                {/* Card principal */}
                <SlotPicker
                    label="Card principal (fallback)"
                    icon={<Star size={15} />}
                    description="Usado quando o Carrossel está vazio — artigo em destaque maior no topo"
                    selected={featuredPost ? [featuredPost] : []}
                    onSelect={p => setFeaturedPost(p)}
                    onRemove={() => setFeaturedPost(null)}
                    blockedBySlot={blockedForFeatured}
                    max={1}
                />

                <ArtistSpotlightPicker
                    selected={spotlightArtist}
                    onSelect={setSpotlightArtist}
                    onRemove={() => setSpotlightArtist(null)}
                />

                {/* 4 cards secundários */}
                <SlotPicker
                    label="Cards secundários"
                    icon={<LayoutGrid size={15} />}
                    description="Os 4 cards menores abaixo do card principal"
                    selected={secondaryPosts}
                    onSelect={p => setSecondaryPosts(prev => [...prev, p])}
                    onRemove={id => setSecondaryPosts(prev => prev.filter(p => p.id !== id))}
                    blockedBySlot={blockedForSecondary}
                    max={4}
                />

                {/* Sidebar artigos em destaque */}
                <SlotPicker
                    label="Artigos em destaque"
                    icon={<BookMarked size={15} />}
                    description="Sidebar do feed — aparece no widget lateral"
                    selected={sidebarPosts}
                    onSelect={p => setSidebarPosts(prev => [...prev, p])}
                    onRemove={id => setSidebarPosts(prev => prev.filter(p => p.id !== id))}
                    blockedBySlot={blockedForSidebar}
                    max={8}
                />

                {/* Info */}
                <p className="text-[11px] text-muted text-center pb-4">
                    Posts nos slots não aparecem no feed principal. Slots vazios usam os artigos mais recentes automaticamente.
                </p>
            </div>
        </AdminLayout>
    )
}
