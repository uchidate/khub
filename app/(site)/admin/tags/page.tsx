'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { FilterPills } from '@/components/admin/FilterPills'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { AdminModalOverlay } from '@/components/admin/AdminModalOverlay'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminTableRow } from '@/components/admin/AdminTableRow'
import { AdminIconButton } from '@/components/admin/AdminIconButton'
import { StatCard } from '@/components/admin'
import {
    Tag, RefreshCw, Pencil, Trash2, Check, X, Search,
    Newspaper, Film, GitMerge, AlertTriangle, ArrowUpDown, SortAsc,
    ChevronDown, ChevronUp, BookOpen, ShoppingBag, ExternalLink, Loader2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TagEntry {
    tag: string
    newsCount: number
    productionCount: number
    blogCount: number
    storeCount: number
    total: number
}

type FilterType = 'all' | 'news' | 'productions' | 'blog' | 'store' | 'unused'
type SortType = 'usage' | 'az' | 'za'

interface TagContent {
    news: { id: string; title: string; slug: string }[]
    productions: { id: string; title: string; slug: string }[]
    blogPosts: { id: string; title: string; slug: string }[]
    storeProducts: { id: string; name: string }[]
}

// ─── Tag Content Modal (click-through) ────────────────────────────────────────

function TagContentModal({ tag, onClose }: { tag: string; onClose: () => void }) {
    const [content, setContent] = useState<TagContent | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/admin/tags?tag=${encodeURIComponent(tag)}`)
            .then(r => r.json())
            .then(setContent)
            .finally(() => setLoading(false))
    }, [tag])

    return (
        <AdminModalOverlay
            open={true}
            onClose={onClose}
            title={`Conteúdos com "${tag}"`}
            maxWidth="md"
            icon={<Tag className="w-4 h-4 text-accent" />}
        >
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted" />
                </div>
            ) : !content ? (
                <p className="text-sm text-muted text-center py-6">Erro ao carregar conteúdos.</p>
            ) : (
                <div className="space-y-4">
                    {content.news.length > 0 && (
                        <ContentSection
                            icon={<Newspaper className="w-3.5 h-3.5 text-blue-400" />}
                            label="Notícias"
                            items={content.news.map(n => ({ label: n.title, href: `/noticias/${n.slug}` }))}
                        />
                    )}
                    {content.productions.length > 0 && (
                        <ContentSection
                            icon={<Film className="w-3.5 h-3.5 text-accent" />}
                            label="Produções"
                            items={content.productions.map(p => ({ label: p.title, href: `/producoes/${p.slug}` }))}
                        />
                    )}
                    {content.blogPosts.length > 0 && (
                        <ContentSection
                            icon={<BookOpen className="w-3.5 h-3.5 text-green-400" />}
                            label="Blog"
                            items={content.blogPosts.map(b => ({ label: b.title, href: `/blog/${b.slug}` }))}
                        />
                    )}
                    {content.storeProducts.length > 0 && (
                        <ContentSection
                            icon={<ShoppingBag className="w-3.5 h-3.5 text-purple-400" />}
                            label="Loja"
                            items={content.storeProducts.map(s => ({ label: s.name }))}
                        />
                    )}
                    {content.news.length + content.productions.length + content.blogPosts.length + content.storeProducts.length === 0 && (
                        <p className="text-sm text-muted text-center py-4">Nenhum conteúdo encontrado.</p>
                    )}
                </div>
            )}
        </AdminModalOverlay>
    )
}

function ContentSection({
    icon, label, items,
}: {
    icon: React.ReactNode
    label: string
    items: { label: string; href?: string }[]
}) {
    return (
        <div>
            <div className="flex items-center gap-1.5 mb-1.5">
                {icon}
                <span className="text-xs font-bold text-muted uppercase tracking-wider">{label}</span>
                <span className="text-xs text-muted">({items.length})</span>
            </div>
            <div className="space-y-1">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-surface text-sm">
                        <span className="text-foreground truncate">{item.label}</span>
                        {item.href && (
                            <a href={item.href} target="_blank" rel="noreferrer" className="flex-shrink-0 text-muted hover:text-accent transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Merge Modal ──────────────────────────────────────────────────────────────

function MergeModal({
    source,
    allTags,
    onClose,
    onConfirm,
}: {
    source: string
    allTags: TagEntry[]
    onClose: () => void
    onConfirm: (source: string, target: string) => Promise<void>
}) {
    const [targetSearch, setTargetSearch] = useState('')
    const [selected, setSelected] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const options = useMemo(() =>
        allTags
            .filter(t => t.tag !== source)
            .filter(t => !targetSearch || t.tag.toLowerCase().includes(targetSearch.toLowerCase()))
            .slice(0, 20),
        [allTags, source, targetSearch],
    )

    const handle = async () => {
        if (!selected) return
        setSaving(true)
        try { await onConfirm(source, selected) }
        finally { setSaving(false) }
    }

    return (
        <AdminModalOverlay
            open={true}
            onClose={onClose}
            title="Mesclar tag"
            maxWidth="sm"
            icon={<GitMerge className="w-4 h-4 text-accent" />}
        >
            <div className="space-y-4">
                <p className="text-sm text-muted">
                    Mesclar <span className="font-mono font-bold text-foreground bg-surface px-1.5 py-0.5 rounded">{source}</span> em:
                </p>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                    <input
                        type="text"
                        value={targetSearch}
                        onChange={e => setTargetSearch(e.target.value)}
                        placeholder="Buscar tag destino..."
                        className="w-full px-4 pr-10 py-2 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
                        autoFocus
                    />
                </div>
                <div className="max-h-44 overflow-y-auto space-y-1 rounded-lg border border-border">
                    {options.length === 0 ? (
                        <p className="text-center text-muted text-xs py-6">Nenhuma tag encontrada</p>
                    ) : options.map(t => (
                        <button key={t.tag} onClick={() => setSelected(t.tag)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                selected === t.tag
                                    ? 'bg-accent/20 text-accent'
                                    : 'text-foreground hover:bg-surface'
                            }`}>
                            <span className="font-mono truncate">{t.tag}</span>
                            <span className="text-xs text-muted ml-2 flex-shrink-0">{t.total}×</span>
                        </button>
                    ))}
                </div>
                {selected && (
                    <p className="text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                        Todos os usos de <strong>{source}</strong> serão movidos para <strong>{selected}</strong>. Irreversível.
                    </p>
                )}
                <div className="flex gap-3 pt-1">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-lg border border-border text-muted text-sm font-bold hover:border-border transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handle} disabled={!selected || saving}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                        {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
                        Mesclar
                    </button>
                </div>
            </div>
        </AdminModalOverlay>
    )
}

// ─── Duplicate Groups Panel ───────────────────────────────────────────────────

function DuplicatesPanel({
    groups,
    tagMap,
    onMerge,
}: {
    groups: string[][]
    tagMap: Map<string, TagEntry>
    onMerge: (source: string, target: string) => Promise<void>
}) {
    const [expanded, setExpanded] = useState(true)
    const [merging, setMerging] = useState<string | null>(null)
    const [resolvingAll, setResolvingAll] = useState(false)

    const handleQuickMerge = async (source: string, target: string) => {
        setMerging(source)
        try { await onMerge(source, target) }
        finally { setMerging(null) }
    }

    const handleResolveAll = async () => {
        setResolvingAll(true)
        try {
            for (const group of groups) {
                const sorted = [...group].sort((a, b) => {
                    const ua = tagMap.get(a)?.total ?? 0
                    const ub = tagMap.get(b)?.total ?? 0
                    return ub - ua || a.localeCompare(b)
                })
                const [preferred, ...variants] = sorted
                for (const v of variants) {
                    await onMerge(v, preferred)
                }
            }
        } finally {
            setResolvingAll(false)
        }
    }

    const totalVariants = groups.reduce((acc, g) => acc + g.length - 1, 0)

    return (
        <div className="bg-amber-500/5 border border-amber-500/25 rounded-xl overflow-hidden">
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-500/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-amber-300 text-sm">
                        {groups.length} grupo{groups.length !== 1 ? 's' : ''} de tags duplicadas detectadas
                    </span>
                    <span className="text-xs text-amber-500/70 font-normal">
                        (mesclagem recomendada)
                    </span>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-amber-500" />}
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-2">
                    {/* Resolve all button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleResolveAll}
                            disabled={resolvingAll}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors disabled:opacity-50"
                        >
                            {resolvingAll
                                ? <><RefreshCw className="w-3 h-3 animate-spin" /> Resolvendo...</>
                                : <><GitMerge className="w-3 h-3" /> Resolver todos ({totalVariants} variantes)</>
                            }
                        </button>
                    </div>

                    {groups.map((group) => {
                        const sorted = [...group].sort((a, b) => {
                            const ua = tagMap.get(a)?.total ?? 0
                            const ub = tagMap.get(b)?.total ?? 0
                            return ub - ua || a.localeCompare(b)
                        })
                        const [preferred, ...variants] = sorted
                        return (
                            <div key={group.join('|')} className="bg-surface border border-border rounded-lg px-3 py-2.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-muted font-bold uppercase tracking-wider">Manter:</span>
                                    <span className="font-mono text-sm font-bold text-foreground bg-surface px-2 py-0.5 rounded">
                                        {preferred}
                                        <span className="text-muted font-normal ml-1 text-xs">{tagMap.get(preferred)?.total ?? 0}×</span>
                                    </span>
                                    <span className="text-xs text-muted">←</span>
                                    {variants.map(v => (
                                        <button
                                            key={v}
                                            onClick={() => handleQuickMerge(v, preferred)}
                                            disabled={merging === v || resolvingAll}
                                            title={`Mesclar "${v}" em "${preferred}"`}
                                            className="inline-flex items-center gap-1 font-mono text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                                        >
                                            {merging === v
                                                ? <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                                : <GitMerge className="w-2.5 h-2.5" />
                                            }
                                            {v}
                                            <span className="text-muted ml-0.5">{tagMap.get(v)?.total ?? 0}×</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TagsAdminPage() {
    const toast = useAdminToast()
    const [tags, setTags] = useState<TagEntry[]>([])
    const [duplicateGroups, setDuplicateGroups] = useState<string[][]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState<FilterType>('all')
    const [sortType, setSortType] = useState<SortType>('usage')

    // Rename
    const [editingTag, setEditingTag] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [saving, setSaving] = useState(false)
    const [mergeConflict, setMergeConflict] = useState<{ oldTag: string; newTag: string } | null>(null)

    // Merge modal
    const [mergingTag, setMergingTag] = useState<string | null>(null)

    // Delete
    const [deletingTag, setDeletingTag] = useState<string | null>(null)
    const [deletingUnused, setDeletingUnused] = useState(false)

    // Click-through
    const [viewingTag, setViewingTag] = useState<string | null>(null)

    const fetchTags = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/tags')
            const data = await res.json()
            setTags(data.tags || [])
            setDuplicateGroups(data.duplicateGroups || [])
        } catch (err) {
            toast.error((err as Error).message || 'Erro ao carregar tags')
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => { fetchTags() }, [fetchTags])

    const tagMap = useMemo(() => new Map(tags.map(t => [t.tag, t])), [tags])

    const filtered = useMemo(() => {
        let list = tags
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(t => t.tag.toLowerCase().includes(q))
        }
        if (filterType === 'news') list = list.filter(t => t.newsCount > 0)
        if (filterType === 'productions') list = list.filter(t => t.productionCount > 0)
        if (filterType === 'blog') list = list.filter(t => t.blogCount > 0)
        if (filterType === 'store') list = list.filter(t => t.storeCount > 0)
        if (filterType === 'unused') list = list.filter(t => t.total === 0)
        if (sortType === 'az') list = [...list].sort((a, b) => a.tag.localeCompare(b.tag))
        if (sortType === 'za') list = [...list].sort((a, b) => b.tag.localeCompare(a.tag))
        return list
    }, [tags, search, filterType, sortType])

    const maxUsage = useMemo(() => Math.max(...filtered.map(t => t.total), 1), [filtered])

    // Stats
    const totalUsage = tags.reduce((acc, t) => acc + t.total, 0)
    const unusedCount = tags.filter(t => t.total === 0).length
    const shared = tags.filter(t => {
        const sources = [t.newsCount > 0, t.productionCount > 0, t.blogCount > 0, t.storeCount > 0].filter(Boolean).length
        return sources > 1
    }).length

    // ── Rename ──
    const startEdit = (tag: string) => {
        setEditingTag(tag)
        setEditValue(tag)
    }
    const cancelEdit = () => { setEditingTag(null); setEditValue(''); setMergeConflict(null) }

    const saveRename = async (oldTag: string, force = false) => {
        const newTag = editValue.trim().toLowerCase().replace(/\s+/g, ' ')
        if (!newTag || newTag === oldTag) { cancelEdit(); return }
        setSaving(true)
        try {
            const res = await fetch('/api/admin/tags', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldTag, newTag, merge: force }),
            })
            const data = await res.json()
            if (!res.ok) {
                if (data.conflict) {
                    setMergeConflict({ oldTag, newTag })
                    return
                }
                toast.error(data.error || 'Erro ao renomear')
                return
            }
            toast.success(force ? `Tag mesclada em "${newTag}"` : `Tag renomeada para "${newTag}"`)
            cancelEdit()
            await fetchTags()
        } catch (err) {
            toast.error((err as Error).message || 'Erro ao renomear tag')
        } finally {
            setSaving(false)
        }
    }

    // ── Merge ──
    const handleMerge = async (source: string, target: string) => {
        const res = await fetch('/api/admin/tags', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldTag: source, newTag: target, merge: true }),
        })
        if (!res.ok) {
            const err = await res.json()
            toast.error(err.error || 'Erro ao mesclar')
            throw new Error(err.error)
        }
        toast.success(`"${source}" mesclada em "${target}"`)
        setMergingTag(null)
        cancelEdit()
        await fetchTags()
    }

    // ── Delete ──
    const confirmDelete = async (tag: string) => {
        const res = await fetch('/api/admin/tags', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag }),
        })
        if (!res.ok) {
            const err = await res.json()
            toast.error(err.error || 'Erro ao deletar tag')
            return
        }
        toast.deleted('Tag')
        setDeletingTag(null)
        await fetchTags()
    }

    // ── Bulk delete unused ──
    const unusedTags = useMemo(() => tags.filter(t => t.total === 0).map(t => t.tag), [tags])

    const confirmDeleteUnused = async () => {
        if (unusedTags.length === 0) return
        const res = await fetch('/api/admin/tags', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags: unusedTags }),
        })
        if (!res.ok) {
            const err = await res.json()
            toast.error(err.error || 'Erro ao deletar tags')
            return
        }
        toast.success(`${unusedTags.length} tags sem uso removidas`)
        setDeletingUnused(false)
        await fetchTags()
    }

    return (
        <AdminLayout
            title="Gestão de Tags"
            subtitle="Taxonomia compartilhada entre notícias, produções, blog e loja — com foco em limpeza, deduplicação e consistência editorial."
            actions={
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/admin/blog/categories"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                    >
                        <Tag className="w-4 h-4" />
                        Categorias do blog
                    </Link>
                    <button
                        onClick={fetchTags}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>
            }
        >
            <div className="space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Tags únicas"  value={tags.length}   color="text-foreground" />
                    <StatCard label="Usos totais"  value={totalUsage}    color="text-accent" />
                    <StatCard label="Partilhadas"  value={shared}        color="text-blue-400" />
                    <StatCard label="Sem uso"      value={unusedCount}   color="text-red-400" />
                </div>

                {/* Duplicates panel */}
                {!loading && duplicateGroups.length > 0 && (
                    <DuplicatesPanel
                        groups={duplicateGroups}
                        tagMap={tagMap}
                        onMerge={handleMerge}
                    />
                )}

                {/* Filters + Sort + Search */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar tag..."
                            className="w-full px-4 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
                        />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        <FilterPills
                            pills={[
                                { value: 'all' as const, label: 'Todas' },
                                { value: 'news' as const, label: 'Notícias' },
                                { value: 'productions' as const, label: 'Produções' },
                                { value: 'blog' as const, label: 'Blog' },
                                { value: 'store' as const, label: 'Loja' },
                                { value: 'unused' as const, label: 'Sem uso' },
                            ]}
                            active={filterType}
                            onChange={setFilterType}
                        />
                        <button
                            onClick={() => setSortType(s => s === 'usage' ? 'az' : s === 'az' ? 'za' : 'usage')}
                            title={sortType === 'usage' ? 'Ordenado por uso' : sortType === 'az' ? 'A → Z' : 'Z → A'}
                            className="px-3 py-2 rounded-xl text-xs font-bold transition-colors border bg-surface border-border text-muted hover:border-border hover:text-foreground flex items-center gap-1.5"
                        >
                            {sortType === 'usage' ? <ArrowUpDown className="w-3.5 h-3.5" /> : <SortAsc className="w-3.5 h-3.5" />}
                            {sortType === 'usage' ? 'Uso' : sortType === 'az' ? 'A→Z' : 'Z→A'}
                        </button>
                        <button onClick={fetchTags} disabled={loading}
                            className="px-3 py-2 bg-surface border border-border hover:border-border text-muted rounded-lg transition-colors disabled:opacity-50">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Result count + bulk delete unused */}
                {!loading && (
                    <div className="flex items-center justify-between -mt-2">
                        <p className="text-xs text-muted">
                            {filtered.length === tags.length
                                ? `${tags.length} tags`
                                : `${filtered.length} de ${tags.length} tags`}
                        </p>
                        {unusedCount > 0 && (
                            <button
                                onClick={() => setDeletingUnused(true)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 transition-colors"
                            >
                                <Trash2 className="w-3 h-3" />
                                Limpar {unusedCount} sem uso
                            </button>
                        )}
                    </div>
                )}

                {/* Tag list */}
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-14 bg-surface border border-border rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <AdminEmptyState
                        icon={<Tag className="w-8 h-8" />}
                        title="Nenhuma tag encontrada"
                        size="lg"
                    />
                ) : (
                    <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                        {filtered.map(entry => (
                            <AdminTableRow
                                key={entry.tag}
                                backgroundBar={{ width: (entry.total / maxUsage) * 100, color: 'bg-accent/5' }}
                                actions={
                                    editingTag === entry.tag ? (
                                        <div className="flex gap-1 flex-shrink-0">
                                            {mergeConflict ? (
                                                <>
                                                    <button
                                                        onClick={() => saveRename(entry.tag, true)}
                                                        disabled={saving}
                                                        title="Confirmar mesclagem"
                                                        className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors disabled:opacity-50"
                                                    >
                                                        {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-surface hover:bg-surface text-muted transition-colors">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => saveRename(entry.tag)}
                                                        disabled={saving}
                                                        className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors disabled:opacity-50"
                                                    >
                                                        {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-surface hover:bg-surface text-muted transition-colors">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <AdminIconButton onClick={() => startEdit(entry.tag)} title="Renomear">
                                                <Pencil size={14} />
                                            </AdminIconButton>
                                            <AdminIconButton onClick={() => setMergingTag(entry.tag)} title="Mesclar em outra tag">
                                                <GitMerge size={14} />
                                            </AdminIconButton>
                                            <AdminIconButton variant="danger" onClick={() => setDeletingTag(entry.tag)} title="Remover de todos os conteúdos">
                                                <Trash2 size={14} />
                                            </AdminIconButton>
                                        </>
                                    )
                                }
                            >
                                <div className="flex items-center gap-3">
                                    <Tag className="w-3.5 h-3.5 text-muted flex-shrink-0" />

                                    {editingTag === entry.tag ? (
                                        <div className="flex-1 flex items-center gap-2 min-w-0">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') saveRename(entry.tag)
                                                    if (e.key === 'Escape') cancelEdit()
                                                }}
                                                autoFocus
                                                className="flex-1 min-w-0 bg-background border border-accent/50 rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-accent/50"
                                            />
                                            {mergeConflict && (
                                                <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1 flex-shrink-0 hidden sm:inline">
                                                    Tag existe — mesclar?
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setViewingTag(entry.tag)}
                                            className="flex-1 text-sm font-bold text-foreground font-mono truncate text-left hover:text-accent transition-colors"
                                            title="Ver conteúdos com esta tag"
                                        >
                                            {entry.tag}
                                        </button>
                                    )}

                                    {/* Usage badges */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {entry.newsCount > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">
                                                <Newspaper className="w-3 h-3" />
                                                <span className="tabular-nums">{entry.newsCount}</span>
                                            </span>
                                        )}
                                        {entry.productionCount > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-accent bg-accent/10 border border-accent/20 rounded-full px-2 py-0.5">
                                                <Film className="w-3 h-3" />
                                                <span className="tabular-nums">{entry.productionCount}</span>
                                            </span>
                                        )}
                                        {entry.blogCount > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                                                <BookOpen className="w-3 h-3" />
                                                <span className="tabular-nums">{entry.blogCount}</span>
                                            </span>
                                        )}
                                        {entry.storeCount > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-2 py-0.5">
                                                <ShoppingBag className="w-3 h-3" />
                                                <span className="tabular-nums">{entry.storeCount}</span>
                                            </span>
                                        )}
                                        <span className="text-xs text-muted w-7 text-right tabular-nums hidden sm:block">
                                            {entry.total}×
                                        </span>
                                    </div>
                                </div>
                            </AdminTableRow>
                        ))}
                    </div>
                )}
            </div>

            {/* Click-through modal */}
            {viewingTag && (
                <TagContentModal tag={viewingTag} onClose={() => setViewingTag(null)} />
            )}

            {/* Merge modal */}
            {mergingTag && (
                <MergeModal
                    source={mergingTag}
                    allTags={tags}
                    onClose={() => setMergingTag(null)}
                    onConfirm={handleMerge}
                />
            )}

            {/* Delete confirm modal */}
            <ConfirmDialog
                open={!!deletingTag}
                title="Remover tag"
                description={`Remover "${deletingTag}"? Esta ação não pode ser desfeita.`}
                confirmLabel="Remover"
                variant="danger"
                onConfirm={() => { if (deletingTag) confirmDelete(deletingTag) }}
                onCancel={() => setDeletingTag(null)}
            />

            {/* Bulk delete unused confirm */}
            <ConfirmDialog
                open={deletingUnused}
                title="Limpar tags sem uso"
                description={`Remover ${unusedTags.length} tags que não estão associadas a nenhum conteúdo? Esta ação não pode ser desfeita.`}
                confirmLabel={`Remover ${unusedTags.length} tags`}
                variant="danger"
                onConfirm={confirmDeleteUnused}
                onCancel={() => setDeletingUnused(false)}
            />
        </AdminLayout>
    )
}
