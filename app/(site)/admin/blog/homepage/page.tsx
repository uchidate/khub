'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { AdminButton } from '@/components/admin/AdminButton'
import { Save, Search, X, Star, LayoutGrid, BookMarked, Loader2, Layers } from 'lucide-react'
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

// ─── Slot Picker ──────────────────────────────────────────────────────────────

function SlotPicker({
    label, icon, description,
    selected, onSelect, onRemove,
    blockedIds,
    max = 1,
}: {
    label: string
    icon: React.ReactNode
    description: string
    selected: PostSummary[]
    onSelect: (post: PostSummary) => void
    onRemove: (id: string) => void
    blockedIds?: Set<string>
    max?: number
}) {
    const { query, setQuery, results, loading } = usePostSearch()
    const [open, setOpen] = useState(false)
    const selectedIds = new Set(selected.map(p => p.id))
    const dropdownRef = useRef<HTMLDivElement>(null)

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
                <span className="text-accent">{icon}</span>
                <div>
                    <p className="text-[13px] font-bold text-foreground">{label}</p>
                    <p className="text-[11px] text-muted">{description}</p>
                </div>
                <span className="ml-auto text-[11px] text-muted font-medium">{selected.length}/{max}</span>
            </div>

            <div className="p-3 space-y-2">
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
                                {results.filter(r => !selectedIds.has(r.id) && !(blockedIds?.has(r.id))).map(post => (
                                    <button
                                        key={post.id}
                                        onClick={() => {
                                            onSelect(post)
                                            setQuery('')
                                            setOpen(false)
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-accent-soft transition-colors text-left border-b border-border last:border-b-0"
                                    >
                                        <div className="w-10 h-7 rounded overflow-hidden bg-surface shrink-0">
                                            {post.coverImageUrl ? (
                                                <Image src={post.coverImageUrl} alt={post.title} width={40} height={28} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-muted">{post.title[0]}</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-semibold text-foreground truncate">{post.title}</p>
                                            {post.category && <p className="text-[10px] text-muted">{post.category.name}</p>}
                                        </div>
                                    </button>
                                ))}
                                {results.filter(r => !selectedIds.has(r.id) && !(blockedIds?.has(r.id))).length === 0 && (
                                    <p className="px-3 py-2 text-[11px] text-muted">
                                        Nenhum resultado disponivel (ja usado em outro slot ou ja selecionado).
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

    const featuredId = featuredPost?.id ?? null
    const carouselIds = carouselPosts.map(p => p.id)
    const secondaryIds = secondaryPosts.map(p => p.id)
    const sidebarIds = sidebarPosts.map(p => p.id)

    const blockedForCarousel = new Set([...(featuredId ? [featuredId] : []), ...secondaryIds, ...sidebarIds])
    const blockedForFeatured = new Set([...carouselIds, ...secondaryIds, ...sidebarIds])
    const blockedForSecondary = new Set([...(featuredId ? [featuredId] : []), ...carouselIds, ...sidebarIds])
    const blockedForSidebar = new Set([...(featuredId ? [featuredId] : []), ...carouselIds, ...secondaryIds])

    // Load current config
    useEffect(() => {
        fetch('/api/admin/settings/homepage')
            .then(r => r.json() as Promise<{ config: HomepageConfig; postsById: Record<string, PostSummary> }>)
            .then(({ config, postsById: pById }) => {
                setFeaturedPost(config.homeFeaturedPostId ? (pById[config.homeFeaturedPostId] ?? null) : null)
                setCarouselPosts((config.homeCarouselPostIds ?? []).map(id => pById[id]).filter(Boolean))
                setSecondaryPosts(config.homeSecondaryPostIds.map(id => pById[id]).filter(Boolean))
                setSidebarPosts(config.homeSidebarPostIds.map(id => pById[id]).filter(Boolean))
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
    }, [featuredPost, carouselPosts, secondaryPosts, sidebarPosts, toast])

    if (loading) {
        return (
            <AdminLayout title="Homepage Editorial">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-muted" size={24} />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="Homepage Editorial">
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
                <SlotPicker
                    label="Carrossel do Hero"
                    icon={<Layers size={15} />}
                    description="Até 5 artigos que rotacionam automaticamente no hero da homepage (substitui o Card principal quando preenchido)"
                    selected={carouselPosts}
                    onSelect={p => setCarouselPosts(prev => [...prev, p])}
                    onRemove={id => setCarouselPosts(prev => prev.filter(p => p.id !== id))}
                    blockedIds={blockedForCarousel}
                    max={5}
                />

                {/* Card principal */}
                <SlotPicker
                    label="Card principal (fallback)"
                    icon={<Star size={15} />}
                    description="Usado quando o Carrossel está vazio — artigo em destaque maior no topo"
                    selected={featuredPost ? [featuredPost] : []}
                    onSelect={p => setFeaturedPost(p)}
                    onRemove={() => setFeaturedPost(null)}
                    blockedIds={blockedForFeatured}
                    max={1}
                />

                {/* 4 cards secundários */}
                <SlotPicker
                    label="Cards secundários"
                    icon={<LayoutGrid size={15} />}
                    description="Os 4 cards menores abaixo do card principal"
                    selected={secondaryPosts}
                    onSelect={p => setSecondaryPosts(prev => [...prev, p])}
                    onRemove={id => setSecondaryPosts(prev => prev.filter(p => p.id !== id))}
                    blockedIds={blockedForSecondary}
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
                    blockedIds={blockedForSidebar}
                    max={4}
                />

                {/* Info */}
                <p className="text-[11px] text-muted text-center pb-4">
                    Posts nos slots não aparecem no feed principal. Slots vazios usam os artigos mais recentes automaticamente.
                </p>
            </div>
        </AdminLayout>
    )
}
