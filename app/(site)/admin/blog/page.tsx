'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageGuide } from '@/components/admin/PageGuide'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { useToast } from '@/lib/hooks/useToast'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { AdminTabGroup } from '@/components/admin/AdminTabGroup'
import { AdminButton } from '@/components/admin/AdminButton'
import { AdminIconLink } from '@/components/admin/AdminIconButton'
import { AdminEmptyState } from '@/components/admin'
import {
    CheckCircle, Eye, Archive, BookOpen, Sparkles, Loader2,
    Newspaper, FileText, RefreshCw, ArrowRight, ExternalLink,
    CalendarDays, ChevronLeft, ChevronRight, Star, Clock, TrendingUp,
    AlertTriangle, Copy, SendHorizonal, Trash2, Globe, Tag,
    Download, Plus, Pencil, X, Check, LayoutList,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Author   { id: string; name: string | null; image: string | null }
interface Category { id?: string; name: string; slug: string }

interface BlogPost {
    id: string
    slug: string
    title: string
    excerpt: string | null
    coverImageUrl: string | null
    status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
    featured: boolean
    viewCount: number
    readingTimeMin: number
    tags: string[]
    publishedAt: string | null
    createdAt: string
    updatedAt: string
    author: Author
    category: Category | null
}

interface BlogCategory {
    id: string
    name: string
    slug: string
    createdAt: string
    _count: { posts: number }
}

// Matches QueueItem from /api/admin/enrichment/queue
interface NewsSuggestion {
    id:            string
    name:          string
    imageUrl?:     string
    subtitle?:     string
    missingFields: string[]
    presentFields: string[]
    priority:      number
    estimatedCost: number
}

type Tab = 'suggestions' | 'posts' | 'top' | 'calendar' | 'categories'

// ─── Calendar types ────────────────────────────────────────────────────────────

interface CalendarPost {
    id: string
    slug: string
    title: string
    status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
    publishedAt: string | null
    createdAt: string
    author: { name: string | null }
    category: { name: string } | null
}

const CALENDAR_STATUS_COLORS: Record<string, string> = {
    DRAFT:          'bg-surface text-foreground border-border',
    PENDING_REVIEW: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    PUBLISHED:      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    ARCHIVED:       'bg-red-500/15 text-red-400 border-red-500/20',
}

const MONTH_NAMES = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

// ─── Calendar Component ────────────────────────────────────────────────────────

function CalendarView() {
    const today = new Date()
    const [year,  setYear]  = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth() + 1)
    const [posts, setPosts] = useState<CalendarPost[]>([])
    const [loading, setLoading] = useState(false)

    const fetchCalendar = useCallback(async (y: number, m: number) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/blog/calendar?year=${y}&month=${m}`)
            const data = await res.json()
            setPosts(Array.isArray(data) ? data : [])
        } catch {
            setPosts([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchCalendar(year, month) }, [year, month, fetchCalendar])

    function prevMonth() {
        if (month === 1) { setYear(y => y - 1); setMonth(12) }
        else setMonth(m => m - 1)
    }
    function nextMonth() {
        if (month === 12) { setYear(y => y + 1); setMonth(1) }
        else setMonth(m => m + 1)
    }
    function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth() + 1) }

    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()

    const byDay = new Map<number, CalendarPost[]>()
    for (const post of posts) {
        const date = post.status === 'PUBLISHED' && post.publishedAt
            ? new Date(post.publishedAt)
            : new Date(post.createdAt)
        if (date.getFullYear() === year && date.getMonth() + 1 === month) {
            const d = date.getDate()
            if (!byDay.has(d)) byDay.set(d, [])
            byDay.get(d)!.push(post)
        }
    }

    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
    while (cells.length % 7 !== 0) cells.push(null)

    const isToday = (d: number) =>
        d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear()

    const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length
    const draftCount     = posts.filter(p => p.status === 'DRAFT' || p.status === 'PENDING_REVIEW').length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-base font-bold text-foreground min-w-[160px] text-center">
                        {MONTH_NAMES[month - 1]} {year}
                    </h2>
                    <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={goToday} className="text-xs text-muted hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-surface-hover">
                        Hoje
                    </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400/60 inline-block" />
                        {publishedCount} publicado{publishedCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-400/60 inline-block" />
                        {draftCount} rascunho{draftCount !== 1 ? 's' : ''}
                    </span>
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map(d => (
                    <div key={d} className="text-center text-[11px] font-bold uppercase tracking-widest text-muted py-1">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => (
                    <div
                        key={i}
                        className={`min-h-[80px] rounded-xl p-1.5 border transition-colors ${
                            day === null
                                ? 'border-transparent bg-transparent'
                                : isToday(day)
                                    ? 'border-accent/40 bg-accent/10'
                                    : 'border-border bg-surface hover:border-border'
                        }`}
                    >
                        {day !== null && (
                            <>
                                <p className={`text-[11px] font-bold mb-1 ${isToday(day) ? 'text-accent' : 'text-muted'}`}>
                                    {day}
                                </p>
                                <div className="space-y-0.5">
                                    {(byDay.get(day) ?? []).slice(0, 3).map(post => (
                                        <a
                                            key={post.id}
                                            href={`/admin/blog/${post.id}/edit`}
                                            className={`block truncate text-[10px] font-medium px-1 py-0.5 rounded border ${CALENDAR_STATUS_COLORS[post.status]} hover:opacity-80 transition-opacity`}
                                            title={`${post.title} · ${post.author.name ?? ''}`}
                                        >
                                            {post.title}
                                        </a>
                                    ))}
                                    {(byDay.get(day)?.length ?? 0) > 3 && (
                                        <p className="text-[10px] text-muted pl-1">
                                            +{(byDay.get(day)?.length ?? 0) - 3} mais
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-4 pt-2 border-t border-border flex-wrap">
                {Object.entries({ PUBLISHED: 'Publicado', PENDING_REVIEW: 'Em revisão', DRAFT: 'Rascunho', ARCHIVED: 'Arquivado' }).map(([k, label]) => (
                    <span key={k} className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded border ${CALENDAR_STATUS_COLORS[k]}`}>
                        {label}
                    </span>
                ))}
            </div>
        </div>
    )
}

// ─── Blog stats ───────────────────────────────────────────────────────────────

interface BlogStats {
    published: number
    draft: number
    review: number
    total: number
    seoIssues: number
    seoHealthy: number
}

function useBlogStats(refreshKey: number) {
    const [stats, setStats] = useState<BlogStats | null>(null)

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/blog?limit=1').then(r => r.json()),
            fetch('/api/admin/blog?limit=1&status=PUBLISHED').then(r => r.json()),
            fetch('/api/admin/blog?limit=1&status=DRAFT').then(r => r.json()),
            fetch('/api/admin/blog?limit=1&status=PENDING_REVIEW').then(r => r.json()),
            fetch('/api/admin/blog?limit=1&seo=issues').then(r => r.json()),
            fetch('/api/admin/blog?limit=1&seo=healthy').then(r => r.json()),
        ]).then(([all, pub, draft, review, seoIssues, seoHealthy]) => {
            setStats({
                total:     all.pagination?.total     ?? 0,
                published: pub.pagination?.total     ?? 0,
                draft:     draft.pagination?.total   ?? 0,
                review:    review.pagination?.total  ?? 0,
                seoIssues: seoIssues.pagination?.total ?? 0,
                seoHealthy: seoHealthy.pagination?.total ?? 0,
            })
        }).catch(() => {})
    }, [refreshKey])

    return stats
}

function BlogStatsBar({ stats }: { stats: BlogStats | null }) {
    const items = [
        { label: 'Total',       value: stats?.total,     color: 'text-foreground',  icon: FileText,   bg: 'bg-surface' },
        { label: 'Publicados',  value: stats?.published, color: 'text-emerald-400', icon: Globe,      bg: 'bg-emerald-500/5 border-emerald-500/20' },
        { label: 'Rascunhos',   value: stats?.draft,     color: 'text-muted',       icon: BookOpen,   bg: 'bg-surface' },
        { label: 'Em revisão',  value: stats?.review,    color: 'text-yellow-400',  icon: TrendingUp, bg: 'bg-yellow-500/5 border-yellow-500/20' },
    ]
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {items.map(({ label, value, color, icon: Icon, bg }) => (
                <div key={label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-border ${bg}`}>
                    <Icon size={15} className={`${color} shrink-0`} />
                    <div>
                        <p className={`text-lg font-black leading-none ${color}`}>
                            {value == null ? <span className="text-muted text-sm">—</span> : value.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-[11px] text-muted mt-0.5">{label}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── SEO Health Badge ─────────────────────────────────────────────────────────

function SeoHealthBadge({ post }: { post: BlogPost }) {
    const issues: string[] = []
    if (!post.coverImageUrl)        issues.push('sem capa')
    if (!post.excerpt)              issues.push('sem excerpt')
    if (!post.tags || post.tags.length === 0) issues.push('sem tags')
    if (!post.category)             issues.push('sem categoria')

    if (issues.length === 0) return null

    return (
        <span
            title={`SEO: ${issues.join(', ')}`}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded"
        >
            <AlertTriangle size={9} />
            {issues.length}
        </span>
    )
}

// ─── Stale draft indicator ────────────────────────────────────────────────────

function isStaleDraft(post: BlogPost): boolean {
    if (post.status !== 'DRAFT') return false
    const daysSinceUpdate = (Date.now() - new Date(post.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceUpdate > 7
}

// ─── Bulk action bar ──────────────────────────────────────────────────────────

function BulkActionBar({
    selectedIds,
    onClear,
    onDone,
    showError,
}: {
    selectedIds: string[]
    onClear: () => void
    onDone: () => void
    showError: (msg: string) => void
}) {
    const [loading, setLoading] = useState<string | null>(null)

    const bulkAction = async (action: string, label: string) => {
        if (loading) return
        if (action === 'delete' && !window.confirm(`Excluir ${selectedIds.length} post(s)? Esta ação é irreversível.`)) return
        setLoading(action)
        try {
            const res = await fetch('/api/admin/blog/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, action }),
            })
            const data = await res.json()
            if (!res.ok) { showError(data.error ?? `Erro ao ${label}`); return }
            onDone()
            onClear()
        } catch {
            showError(`Erro de rede ao ${label}`)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="flex items-center gap-2 flex-wrap px-3 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <span className="text-[12px] font-bold text-blue-300">{selectedIds.length} selecionado{selectedIds.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-1.5 ml-2 flex-wrap">
                {[
                    { action: 'publish', label: 'Publicar',          icon: Globe,         cls: 'text-emerald-400 hover:bg-emerald-500/10' },
                    { action: 'review',  label: 'Enviar p/ revisão', icon: SendHorizonal, cls: 'text-yellow-400 hover:bg-yellow-500/10' },
                    { action: 'archive', label: 'Arquivar',          icon: Archive,       cls: 'text-muted hover:bg-surface-hover' },
                    { action: 'delete',  label: 'Excluir',           icon: Trash2,        cls: 'text-red-400 hover:bg-red-500/10' },
                ].map(({ action, label, icon: Icon, cls }) => (
                    <button
                        key={action}
                        onClick={() => bulkAction(action, label)}
                        disabled={!!loading}
                        className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-transparent hover:border-current/20 transition-all disabled:opacity-40 ${cls}`}
                    >
                        {loading === action ? <Loader2 size={11} className="animate-spin" /> : <Icon size={11} />}
                        {label}
                    </button>
                ))}
            </div>
            <button
                onClick={onClear}
                className="ml-auto p-1 rounded text-muted hover:text-foreground transition-colors"
                title="Cancelar seleção"
            >
                <X size={14} />
            </button>
        </div>
    )
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    DRAFT:          { label: 'Rascunho',   color: 'bg-surface text-muted'             },
    PENDING_REVIEW: { label: 'Em revisão', color: 'bg-yellow-500/20 text-yellow-400'  },
    PUBLISHED:      { label: 'Publicado',  color: 'bg-green-500/20 text-green-400'    },
    ARCHIVED:       { label: 'Arquivado',  color: 'bg-red-500/20 text-red-400'        },
}

// ─── Suggestion Row ───────────────────────────────────────────────────────────

function SuggestionRow({
    item,
    onGenerated,
    onError,
    onSuccess,
}: {
    item:        NewsSuggestion
    onGenerated: (id: string) => void
    onError:     (msg: string) => void
    onSuccess:   (msg: string) => void
}) {
    const [loading, setLoading] = useState(false)
    const [done,    setDone]    = useState(false)

    async function generate() {
        if (loading || done) return
        setLoading(true)
        try {
            const res = await fetch('/api/admin/enrichment', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ target: 'news_blog_post', entityId: item.id }),
            })
            const data = await res.json()
            if (res.ok && data.processed > 0) {
                setDone(true)
                onSuccess('Blog post gerado como rascunho')
                onGenerated(item.id)
            } else {
                onError(data.error ?? 'Erro ao gerar blog post')
            }
        } catch {
            onError('Erro de rede')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${
            done
                ? 'border-emerald-500/20 bg-emerald-900/5 opacity-60'
                : 'border-border bg-surface hover:bg-surface-hover'
        }`}>
            <div className="w-12 h-9 rounded-lg overflow-hidden bg-surface shrink-0 border border-border">
                {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} width={48} height={36} className="object-cover w-full h-full" unoptimized />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Newspaper className="w-4 h-4 text-muted" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                {item.subtitle && (
                    <p className="text-[11px] text-muted truncate mt-0.5">{item.subtitle}</p>
                )}
            </div>
            <ArrowRight className="w-4 h-4 text-muted shrink-0 hidden sm:block" />
            <div className="shrink-0 flex items-center gap-2">
                {done ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Gerado
                    </span>
                ) : (
                    <AdminButton onClick={generate} disabled={loading} size="sm">
                        {loading
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
                            : <><Sparkles className="w-3.5 h-3.5" /> Gerar Post</>
                        }
                    </AdminButton>
                )}
                <a
                    href={`/admin/news/${item.id}/edit`}
                    className="p-1.5 rounded text-muted hover:text-muted transition-colors opacity-0 group-hover:opacity-100"
                    title="Ver notícia"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>
        </div>
    )
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab({ showError, showSuccess }: { showError: (m: string) => void; showSuccess: (m: string) => void }) {
    const [categories, setCategories] = useState<BlogCategory[]>([])
    const [loading,    setLoading]    = useState(true)
    const [newName,    setNewName]    = useState('')
    const [creating,   setCreating]   = useState(false)
    const [editId,     setEditId]     = useState<string | null>(null)
    const [editName,   setEditName]   = useState('')
    const [savingId,   setSavingId]   = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const editRef = useRef<HTMLInputElement>(null)

    const load = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/blog/categories')
            setCategories(await res.json())
        } catch {
            showError('Erro ao carregar categorias')
        } finally {
            setLoading(false)
        }
    }, [showError])

    useEffect(() => { load() }, [load])

    useEffect(() => {
        if (editId) editRef.current?.focus()
    }, [editId])

    async function create() {
        if (!newName.trim() || creating) return
        setCreating(true)
        try {
            const res = await fetch('/api/admin/blog/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() }),
            })
            const data = await res.json()
            if (!res.ok) { showError(data.error ?? 'Erro ao criar'); return }
            setNewName('')
            showSuccess(`Categoria "${newName.trim()}" criada`)
            load()
        } catch {
            showError('Erro de rede')
        } finally {
            setCreating(false)
        }
    }

    async function save(id: string) {
        if (!editName.trim() || savingId) return
        setSavingId(id)
        try {
            const res = await fetch(`/api/admin/blog/categories/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim() }),
            })
            if (!res.ok) { showError('Erro ao renomear'); return }
            setEditId(null)
            showSuccess('Categoria renomeada')
            load()
        } catch {
            showError('Erro de rede')
        } finally {
            setSavingId(null)
        }
    }

    async function remove(id: string, name: string) {
        if (deletingId || !window.confirm(`Remover categoria "${name}"? Os posts associados perderão a categoria.`)) return
        setDeletingId(id)
        try {
            await fetch(`/api/admin/blog/categories/${id}`, { method: 'DELETE' })
            showSuccess(`Categoria removida`)
            load()
        } catch {
            showError('Erro de rede')
        } finally {
            setDeletingId(null)
        }
    }

    if (loading) return (
        <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
    )

    return (
        <div className="space-y-4 max-w-lg">
            {/* Create */}
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Nome da nova categoria..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && create()}
                    className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                />
                <button
                    onClick={create}
                    disabled={creating || !newName.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-all"
                >
                    {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Criar
                </button>
            </div>

            {/* List */}
            {categories.length === 0 ? (
                <AdminEmptyState
                    icon={<Tag className="w-8 h-8 text-muted" />}
                    title="Nenhuma categoria"
                    description="Crie categorias para organizar os posts do blog."
                    bordered
                />
            ) : (
                <div className="space-y-1.5">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-surface">
                            {editId === cat.id ? (
                                <>
                                    <input
                                        ref={editRef}
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') save(cat.id); if (e.key === 'Escape') setEditId(null) }}
                                        className="flex-1 bg-transparent text-sm text-foreground focus:outline-none border-b border-accent"
                                    />
                                    <button onClick={() => save(cat.id)} disabled={!!savingId} className="p-1 text-emerald-400 hover:text-emerald-300">
                                        {savingId === cat.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                    </button>
                                    <button onClick={() => setEditId(null)} className="p-1 text-muted hover:text-foreground">
                                        <X size={13} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Tag size={13} className="text-muted shrink-0" />
                                    <span className="flex-1 text-sm font-medium text-foreground">{cat.name}</span>
                                    <span className="text-[11px] text-muted">{cat._count.posts} post{cat._count.posts !== 1 ? 's' : ''}</span>
                                    <button
                                        onClick={() => { setEditId(cat.id); setEditName(cat.name) }}
                                        className="p-1 text-muted hover:text-foreground transition-colors"
                                        title="Renomear"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        onClick={() => remove(cat.id, cat.name)}
                                        disabled={deletingId === cat.id}
                                        className="p-1 text-muted hover:text-red-400 transition-colors"
                                        title="Remover"
                                    >
                                        {deletingId === cat.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

async function exportCSV(showError: (m: string) => void) {
    try {
        const res  = await fetch('/api/admin/blog?limit=1000')
        const data = await res.json() as { data?: BlogPost[] }
        const posts = data.data ?? []

        const rows = [
            ['ID', 'Título', 'Status', 'Categoria', 'Tags', 'Views', 'Leitura (min)', 'Publicado em', 'Criado em'],
            ...posts.map(p => [
                p.id,
                `"${p.title.replace(/"/g, '""')}"`,
                p.status,
                p.category?.name ?? '',
                p.tags.join(';'),
                String(p.viewCount),
                String(p.readingTimeMin),
                p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('pt-BR') : '',
                new Date(p.createdAt).toLocaleDateString('pt-BR'),
            ]),
        ]

        const csv  = rows.map(r => r.join(',')).join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `blog-posts-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    } catch {
        showError('Erro ao exportar CSV')
    }
}

// ─── Inline action buttons ────────────────────────────────────────────────────

function PublishButton({ post, onDone }: { post: BlogPost; onDone: () => void }) {
    const [loading, setLoading] = useState(false)

    const toggle = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setLoading(true)
        const publish = post.status !== 'PUBLISHED'
        await fetch(`/api/blog/posts/${post.id}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publish }),
        })
        setLoading(false)
        onDone()
    }

    if (post.status === 'DRAFT' || post.status === 'ARCHIVED') return null

    return (
        <button
            onClick={toggle}
            disabled={loading}
            title={post.status === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}
            className={`p-1.5 rounded transition-colors disabled:cursor-wait ${
                post.status === 'PUBLISHED'
                    ? 'text-green-400 hover:text-red-400 hover:bg-red-400/10'
                    : 'text-yellow-400 hover:text-green-400 hover:bg-green-400/10'
            }`}
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : post.status === 'PUBLISHED' ? <Archive size={14} /> : <CheckCircle size={14} />}
        </button>
    )
}

function SubmitReviewButton({ post, onDone }: { post: BlogPost; onDone: () => void }) {
    const [loading, setLoading] = useState(false)

    if (post.status !== 'DRAFT') return null

    const submit = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setLoading(true)
        await fetch('/api/admin/blog/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [post.id], action: 'review' }),
        })
        setLoading(false)
        onDone()
    }

    return (
        <button
            onClick={submit}
            disabled={loading}
            title="Enviar para revisão"
            className="p-1.5 rounded text-muted hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors disabled:cursor-wait"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
        </button>
    )
}

function DuplicateButton({ post, onDone, showError }: { post: BlogPost; onDone: (newId: string) => void; showError: (m: string) => void }) {
    const [loading, setLoading] = useState(false)

    const dupe = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setLoading(true)
        try {
            const res  = await fetch(`/api/admin/blog/${post.id}/duplicate`, { method: 'POST' })
            const data = await res.json()
            if (!res.ok) { showError(data.error ?? 'Erro ao duplicar'); return }
            onDone(data.id)
        } catch {
            showError('Erro de rede')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={dupe}
            disabled={loading}
            title="Duplicar post"
            className="p-1.5 rounded text-muted hover:text-blue-400 hover:bg-blue-400/10 transition-colors disabled:cursor-wait"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
        </button>
    )
}

function DeleteButton({ post, onDone, showError }: { post: BlogPost; onDone: () => void; showError: (m: string) => void }) {
    const [loading, setLoading] = useState(false)

    const del = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!window.confirm(`Excluir "${post.title}"? Esta ação é irreversível.`)) return
        setLoading(true)
        try {
            const res  = await fetch('/api/admin/blog/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [post.id], action: 'delete' }),
            })
            const data = await res.json()
            if (!res.ok) { showError(data.error ?? 'Erro ao excluir'); return }
            onDone()
        } catch {
            showError('Erro de rede')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={del}
            disabled={loading}
            title="Excluir post"
            className="p-1.5 rounded text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:cursor-wait"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
    )
}

function FeaturedButton({ post, onDone }: { post: BlogPost; onDone: () => void }) {
    const [loading, setLoading] = useState(false)

    const toggle = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setLoading(true)
        await fetch(`/api/blog/posts/${post.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ featured: !post.featured }),
        })
        setLoading(false)
        onDone()
    }

    return (
        <button
            onClick={toggle}
            disabled={loading}
            title={post.featured ? 'Remover destaque' : 'Marcar como destaque'}
            className={`p-1.5 rounded transition-colors disabled:cursor-wait ${
                post.featured
                    ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10'
                    : 'text-muted hover:text-yellow-400 hover:bg-yellow-400/10'
            }`}
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} className={post.featured ? 'fill-yellow-400' : ''} />}
        </button>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBlogPage() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const addToast    = useToast(s => s.addToast)
    const showError   = useCallback((msg: string) => addToast({ type: 'error',   message: msg, duration: 5000 }), [addToast])
    const showSuccess = useCallback((msg: string) => addToast({ type: 'success', message: msg, duration: 3000 }), [addToast])

    const [statsKey,      setStatsKey]     = useState(0)
    const blogStats = useBlogStats(statsKey)

    const [activeTab,     setActiveTab]    = useState<Tab>('posts')
    const [suggestions,   setSuggestions]  = useState<NewsSuggestion[]>([])
    const [loading,       setLoading]      = useState(false)
    const [hiddenIds,     setHiddenIds]    = useState<Set<string>>(new Set())
    const [generatingAll, setGeneratingAll] = useState(false)
    const [statusFilter,  setStatusFilter] = useState<string>('')
    const [seoFilter,     setSeoFilter]    = useState<string>('')
    const [selectedIds,   setSelectedIds]  = useState<string[]>([])
    const [urlReady,      setUrlReady]     = useState(false)

    const refreshStats = useCallback(() => setStatsKey(k => k + 1), [])

    useEffect(() => {
        const tabParam = searchParams.get('tab')
        const statusParam = searchParams.get('status')
        const seoParam = searchParams.get('seo')

        const validTab = (['suggestions', 'posts', 'top', 'calendar', 'categories'] as const).includes(tabParam as Tab)
            ? (tabParam as Tab)
            : 'posts'
        const validStatus = ['', 'PUBLISHED', 'DRAFT', 'PENDING_REVIEW', 'ARCHIVED'].includes(statusParam ?? '')
            ? (statusParam ?? '')
            : ''
        const validSeo = ['', 'issues', 'healthy'].includes(seoParam ?? '')
            ? (seoParam ?? '')
            : ''

        setActiveTab(validTab)
        setStatusFilter(validStatus)
        setSeoFilter(validSeo)
        setUrlReady(true)
    }, [searchParams])

    useEffect(() => {
        if (!urlReady) return
        const params = new URLSearchParams(window.location.search)

        if (activeTab === 'posts') params.delete('tab')
        else params.set('tab', activeTab)

        if (statusFilter) params.set('status', statusFilter)
        else params.delete('status')

        if (seoFilter) params.set('seo', seoFilter)
        else params.delete('seo')

        const next = params.toString() ? `${pathname}?${params.toString()}` : pathname
        const current = `${pathname}${window.location.search}`
        if (next !== current) router.replace(next, { scroll: false })
    }, [activeTab, statusFilter, seoFilter, pathname, router, urlReady])

    const fetchSuggestions = useCallback(async () => {
        setLoading(true)
        try {
            const res  = await fetch('/api/admin/enrichment/queue?tab=news&limit=20')
            const data = await res.json()
            setSuggestions(
                (data.items ?? []).filter((i: NewsSuggestion) => i.missingFields.includes('blog'))
            )
        } catch {
            showError('Erro ao carregar sugestões')
        } finally {
            setLoading(false)
        }
    }, [showError])

    useEffect(() => {
        if (activeTab === 'suggestions') fetchSuggestions()
    }, [activeTab, fetchSuggestions])

    const handleGenerated = useCallback((id: string) => {
        setHiddenIds(prev => { const next = new Set(prev); next.add(id); return next })
        refreshStats()
    }, [refreshStats])

    async function generateBatch() {
        setGeneratingAll(true)
        try {
            const res = await fetch('/api/admin/enrichment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target: 'news_blog_post', limit: 5 }),
            })
            const data = await res.json()
            if (res.ok) {
                showSuccess(`${data.processed} posts gerados como rascunho`)
                await fetchSuggestions()
                refreshStats()
            } else {
                showError(data.error ?? 'Erro ao gerar posts')
            }
        } catch {
            showError('Erro de rede')
        } finally {
            setGeneratingAll(false)
        }
    }

    const visibleSuggestions = suggestions.filter(s => !hiddenIds.has(s.id))

    // ── Columns (Posts tab) ──────────────────────────────────────────────────

    const columns: Column<BlogPost>[] = [
        {
            key: 'id',
            label: '',
            render: (post) => (
                <input
                    type="checkbox"
                    checked={selectedIds.includes(post.id)}
                    onChange={e => {
                        e.stopPropagation()
                        setSelectedIds(prev =>
                            e.target.checked ? [...prev, post.id] : prev.filter(id => id !== post.id)
                        )
                    }}
                    onClick={e => e.stopPropagation()}
                    className="w-3.5 h-3.5 accent-blue-500 cursor-pointer"
                />
            ),
        },
        {
            key: 'coverImageUrl',
            label: '',
            render: (post) =>
                post.coverImageUrl ? (
                    <Image src={post.coverImageUrl} alt={post.title} width={52} height={36} className="rounded-lg object-cover" unoptimized />
                ) : (
                    <div className="w-[52px] h-9 bg-surface rounded-lg flex items-center justify-center border border-border/50">
                        <BookOpen size={14} className="text-muted" />
                    </div>
                ),
        },
        {
            key: 'title',
            label: 'Título',
            sortable: true,
            className: 'min-w-[340px]',
            render: (post) => (
                <div className="max-w-sm">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`font-medium truncate ${isStaleDraft(post) ? 'text-orange-300' : 'text-foreground'}`}>
                            {post.title}
                        </p>
                        {isStaleDraft(post) && (
                            <span title="Rascunho sem edição há mais de 7 dias" className="text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1 py-0.5 rounded shrink-0">
                                ANTIGO
                            </span>
                        )}
                        <SeoHealthBadge post={post} />
                    </div>
                    <p className="text-xs text-muted truncate">{post.author.name} · {post.category?.name ?? '—'}</p>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            className: 'min-w-[140px]',
            render: (post) => {
                const s = STATUS_LABELS[post.status] ?? { label: post.status, color: 'bg-surface text-muted' }
                return <AdminStatusBadge label={s.label} color={s.color} variant="pill" />
            },
        },
        {
            key: 'featured',
            label: 'Destaque',
            render: (post) => post.featured
                ? <span className="flex items-center gap-1 text-xs font-bold text-yellow-400"><Star size={11} className="fill-yellow-400" /> Sim</span>
                : <span className="text-xs text-muted">—</span>,
        },
        {
            key: 'viewCount',
            label: 'Views',
            sortable: true,
            render: (post) => <span className="text-sm text-muted flex items-center gap-1"><Eye size={11} />{post.viewCount.toLocaleString('pt-BR')}</span>,
        },
        {
            key: 'readingTimeMin',
            label: 'Leitura',
            render: (post) => (
                <span className="text-sm text-muted flex items-center gap-1">
                    <Clock size={11} />
                    {post.readingTimeMin > 0 ? `${post.readingTimeMin}min` : '—'}
                </span>
            ),
        },
        {
            key: 'publishedAt',
            label: 'Data',
            sortable: true,
            render: (post) => (
                <span className="text-sm text-muted">
                    {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('pt-BR')
                        : new Date(post.createdAt).toLocaleDateString('pt-BR')}
                </span>
            ),
        },
    ]

    // ── Columns (Top Posts tab) ──────────────────────────────────────────────

    const topColumns: Column<BlogPost>[] = [
        {
            key: 'coverImageUrl',
            label: '',
            render: (post) =>
                post.coverImageUrl ? (
                    <Image src={post.coverImageUrl} alt={post.title} width={52} height={36} className="rounded-lg object-cover" unoptimized />
                ) : (
                    <div className="w-[52px] h-9 bg-surface rounded-lg flex items-center justify-center border border-border/50">
                        <BookOpen size={14} className="text-muted" />
                    </div>
                ),
        },
        {
            key: 'title',
            label: 'Título',
            render: (post) => (
                <div className="max-w-sm">
                    <p className="font-medium text-foreground truncate">{post.title}</p>
                    <p className="text-xs text-muted truncate">{post.category?.name ?? '—'} · {post.author.name}</p>
                </div>
            ),
        },
        {
            key: 'viewCount',
            label: 'Views',
            sortable: true,
            render: (post) => (
                <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-emerald-400" />
                    {post.viewCount.toLocaleString('pt-BR')}
                </span>
            ),
        },
        {
            key: 'readingTimeMin',
            label: 'Leitura',
            render: (post) => (
                <span className="text-sm text-muted flex items-center gap-1">
                    <Clock size={11} />
                    {post.readingTimeMin > 0 ? `${post.readingTimeMin}min` : '—'}
                </span>
            ),
        },
        {
            key: 'publishedAt',
            label: 'Publicado',
            render: (post) => (
                <span className="text-sm text-muted">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pt-BR') : '—'}
                </span>
            ),
        },
    ]

    return (
        <AdminLayout title="Blog Pipeline">
            <div className="space-y-5">

                <BlogStatsBar stats={blogStats} />

                <PageGuide
                    storageKey="blog"
                    title="Como funciona o Blog Pipeline"
                    description="Gerencia o conteúdo editorial do blog: posts criados manualmente e posts gerados automaticamente a partir de notícias importadas. O blog é o conteúdo de maior valor para SEO."
                    steps={[
                        { label: 'Notícia importada', description: 'Bot importou notícia com potencial editorial', color: 'zinc' },
                        { label: 'Converter com IA', description: 'IA transforma notícia em post editorial completo', color: 'purple' },
                        { label: 'Rascunho', description: 'Post gerado, aguarda revisão e ajustes', color: 'yellow' },
                        { label: 'Revisar', description: 'Editor revisa título, SEO, imagem e corpo', color: 'blue' },
                        { label: 'Publicar', description: 'Status PUBLISHED — aparece no blog e home', color: 'green' },
                    ]}
                    tips={[
                        { text: 'Posts "Destaque" aparecem na home com prioridade — marque apenas os melhores.' },
                        { text: 'O ícone laranja no título indica problema de SEO (sem capa, excerpt, tags ou categoria).' },
                        { text: 'Rascunhos marcados como "ANTIGO" não foram editados há mais de 7 dias.' },
                        { text: 'Use bulk actions (checkboxes) para publicar/arquivar/excluir vários posts de uma vez.' },
                        { text: 'A IA usa o conteúdo original da notícia + contexto do artista para gerar o post.' },
                    ]}
                />

                {/* Header */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs text-muted">
                        Gerencie posts publicados e converta notícias em conteúdo editorial com IA.
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => exportCSV(showError)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted hover:text-foreground rounded-lg text-xs font-semibold transition-all"
                            title="Exportar lista como CSV"
                        >
                            <Download size={13} />
                            CSV
                        </button>
                        <Link
                            href="/write"
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all text-xs shadow-lg shadow-blue-500/20"
                        >
                            <BookOpen size={13} />
                            Novo Artigo
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <AdminTabGroup
                    tabs={[
                        { key: 'posts',       label: 'Posts',        icon: <FileText className="w-3.5 h-3.5" /> },
                        { key: 'top',         label: 'Top Posts',    icon: <TrendingUp className="w-3.5 h-3.5" /> },
                        { key: 'calendar',    label: 'Calendário',   icon: <CalendarDays className="w-3.5 h-3.5" /> },
                        { key: 'categories',  label: 'Categorias',   icon: <Tag className="w-3.5 h-3.5" /> },
                        { key: 'suggestions', label: 'Sugestões IA', icon: <Sparkles className="w-3.5 h-3.5" />, badge: visibleSuggestions.length },
                    ]}
                    active={activeTab}
                    onChange={v => { setActiveTab(v as Tab); setSelectedIds([]) }}
                    activeClass="bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                />

                {/* ── Suggestions tab ────────────────────────────────── */}
                {activeTab === 'suggestions' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-muted flex-1">
                                Notícias publicadas sem blog post gerado, ordenadas por recência.
                            </p>
                            <button
                                onClick={fetchSuggestions}
                                disabled={loading}
                                className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-surface-hover"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                Atualizar
                            </button>
                            <button
                                onClick={generateBatch}
                                disabled={generatingAll || loading || visibleSuggestions.length === 0}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-all shadow-lg shadow-blue-500/20"
                            >
                                {generatingAll
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
                                    : <><Sparkles className="w-3.5 h-3.5" /> Gerar próximos 5</>
                                }
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-muted">
                            <Newspaper className="w-3.5 h-3.5" />
                            <span>Notícia publicada</span>
                            <ArrowRight className="w-3 h-3" />
                            <Sparkles className="w-3.5 h-3.5 text-blue-400/60" />
                            <span>Geração IA</span>
                            <ArrowRight className="w-3 h-3" />
                            <FileText className="w-3.5 h-3.5 text-muted" />
                            <span>Rascunho</span>
                            <ArrowRight className="w-3 h-3" />
                            <Eye className="w-3.5 h-3.5 text-emerald-400/60" />
                            <span>Publicar</span>
                        </div>

                        {loading && visibleSuggestions.length === 0 ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-6 h-6 text-muted animate-spin" />
                            </div>
                        ) : visibleSuggestions.length === 0 ? (
                            <AdminEmptyState
                                icon={<CheckCircle className="w-8 h-8 text-emerald-500" />}
                                title="Nenhuma sugestão pendente"
                                description="Todas as notícias publicadas já têm blog posts."
                                bordered
                            />
                        ) : (
                            <div className="space-y-2">
                                {visibleSuggestions.map(item => (
                                    <SuggestionRow
                                        key={item.id}
                                        item={item}
                                        onGenerated={handleGenerated}
                                        onError={showError}
                                        onSuccess={showSuccess}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Calendar tab ───────────────────────────────────── */}
                {activeTab === 'calendar' && <CalendarView />}

                {/* ── Categories tab ─────────────────────────────────── */}
                {activeTab === 'categories' && (
                    <CategoriesTab showError={showError} showSuccess={showSuccess} />
                )}

                {/* ── Top Posts tab ──────────────────────────────────── */}
                {activeTab === 'top' && (
                    <DataTable<BlogPost>
                        columns={topColumns}
                        apiUrl="/api/admin/blog"
                        searchPlaceholder="Buscar por título..."
                        extraParams={{ status: 'PUBLISHED', sortBy: 'viewCount', sortOrder: 'desc' }}
                        actions={(post) => (
                            <div className="flex items-center gap-1">
                                <AdminIconLink href={`/admin/blog/${post.id}/edit`} onClick={(e) => e.stopPropagation()} title="Editar">
                                    <BookOpen size={14} />
                                </AdminIconLink>
                                <FeaturedButton post={post} onDone={refetchTable} />
                                <Link
                                    href={`/blog/${post.slug}`}
                                    target="_blank"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded text-muted hover:text-green-300 hover:bg-green-400/10 transition-colors"
                                    title="Ver publicado"
                                >
                                    <Globe size={14} />
                                </Link>
                            </div>
                        )}
                    />
                )}

                {/* ── Posts tab ──────────────────────────────────────── */}
                {activeTab === 'posts' && (
                    <div className="space-y-3">
                        {/* Status filter chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                                { value: '',               label: 'Todos',      count: blogStats?.total },
                                { value: 'PUBLISHED',      label: 'Publicado',  count: blogStats?.published },
                                { value: 'DRAFT',          label: 'Rascunho',   count: blogStats?.draft },
                                { value: 'PENDING_REVIEW', label: 'Em revisão', count: blogStats?.review },
                                { value: 'ARCHIVED',       label: 'Arquivado',  count: undefined },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setStatusFilter(opt.value); setSelectedIds([]) }}
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                                        statusFilter === opt.value
                                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                            : 'text-muted border-border hover:text-foreground hover:border-border'
                                    }`}
                                >
                                    {opt.label}
                                    {opt.count != null && (
                                        <span className="ml-1 opacity-70 font-normal">{opt.count}</span>
                                    )}
                                </button>
                            ))}
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="ml-1 text-[11px] text-muted hover:text-foreground flex items-center gap-1"
                                >
                                    <LayoutList size={11} />
                                    Limpar seleção ({selectedIds.length})
                                </button>
                            )}
                        </div>

                        {/* SEO filter chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                                { value: '',        label: 'SEO: Todos',         count: blogStats?.total },
                                { value: 'issues',  label: 'Com pendências SEO', count: blogStats?.seoIssues },
                                { value: 'healthy', label: 'SEO saudável',       count: blogStats?.seoHealthy },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setSeoFilter(opt.value); setSelectedIds([]) }}
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                                        seoFilter === opt.value
                                            ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                                            : 'text-muted border-border hover:text-foreground hover:border-border'
                                    }`}
                                >
                                    {opt.label}
                                    {opt.count != null && (
                                        <span className="ml-1 opacity-70 font-normal">{opt.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Bulk action bar */}
                        {selectedIds.length > 0 && (
                            <BulkActionBar
                                selectedIds={selectedIds}
                                onClear={() => setSelectedIds([])}
                                onDone={() => { refetchTable(); refreshStats() }}
                                showError={showError}
                            />
                        )}

                        <DataTable<BlogPost>
                            columns={columns}
                            apiUrl="/api/admin/blog"
                            searchPlaceholder="Buscar por título..."
                            extraParams={{
                                ...(statusFilter ? { status: statusFilter } : {}),
                                ...(seoFilter ? { seo: seoFilter } : {}),
                            }}
                            actions={(post) => (
                                <div className="flex items-center gap-1">
                                    <AdminIconLink href={`/admin/blog/${post.id}/edit`} onClick={(e) => e.stopPropagation()} title="Editar">
                                        <BookOpen size={14} />
                                    </AdminIconLink>
                                    <FeaturedButton post={post} onDone={() => { refetchTable(); refreshStats() }} />
                                    <SubmitReviewButton post={post} onDone={() => { refetchTable(); refreshStats() }} />
                                    <PublishButton post={post} onDone={() => { refetchTable(); refreshStats() }} />
                                    <DuplicateButton
                                        post={post}
                                        onDone={(newId) => {
                                            showSuccess('Post duplicado como rascunho')
                                            refetchTable()
                                            refreshStats()
                                            window.open(`/admin/blog/${newId}/edit`, '_blank')
                                        }}
                                        showError={showError}
                                    />
                                    {(post.status === 'PUBLISHED' || post.status === 'DRAFT' || post.status === 'PENDING_REVIEW') && (
                                        <Link
                                            href={post.status === 'PUBLISHED' ? `/blog/${post.slug}` : `/blog/preview/${post.slug}`}
                                            target="_blank"
                                            onClick={(e) => e.stopPropagation()}
                                            className={`p-1.5 rounded transition-colors ${
                                                post.status === 'PUBLISHED'
                                                    ? 'text-muted hover:text-green-300 hover:bg-green-400/10'
                                                    : 'text-muted hover:text-blue-300 hover:bg-blue-400/10'
                                            }`}
                                            title={post.status === 'PUBLISHED' ? 'Ver publicado' : 'Ver prévia'}
                                        >
                                            <Eye size={14} />
                                        </Link>
                                    )}
                                    <DeleteButton
                                        post={post}
                                        onDone={() => { refetchTable(); refreshStats() }}
                                        showError={showError}
                                    />
                                </div>
                            )}
                        />
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
