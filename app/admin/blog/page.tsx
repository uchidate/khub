'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageGuide } from '@/components/admin/PageGuide'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { useToast } from '@/lib/hooks/useToast'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { AdminTabGroup } from '@/components/admin/AdminTabGroup'
import { AdminButton, AdminLinkButton } from '@/components/admin/AdminButton'
import { AdminIconLink } from '@/components/admin/AdminIconButton'
import {
    CheckCircle, Eye, Archive, BookOpen, Sparkles, Loader2,
    Newspaper, FileText, RefreshCw, ArrowRight, ExternalLink,
    CalendarDays, ChevronLeft, ChevronRight, Star,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Author   { id: string; name: string | null; image: string | null }
interface Category { name: string; slug: string }

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
    author: Author
    category: Category | null
}

// Matches QueueItem from /api/admin/enrichment/queue
interface NewsSuggestion {
    id:            string
    name:          string  // news title
    imageUrl?:     string
    subtitle?:     string  // "source · contentType"
    missingFields: string[]
    presentFields: string[]
    priority:      number  // recency score
    estimatedCost: number
}

type Tab = 'suggestions' | 'posts' | 'calendar'

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
    const [month, setMonth] = useState(today.getMonth() + 1) // 1-based
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

    // Build calendar grid
    const firstDay = new Date(year, month - 1, 1).getDay() // 0=Sun
    const daysInMonth = new Date(year, month, 0).getDate()

    // Group posts by day
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

    // Build grid cells: blanks + days
    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
    // Pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null)

    const isToday = (d: number) =>
        d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear()

    const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length
    const draftCount     = posts.filter(p => p.status === 'DRAFT' || p.status === 'PENDING_REVIEW').length

    return (
        <div className="space-y-4">
            {/* Header row */}
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

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map(d => (
                    <div key={d} className="text-center text-[11px] font-bold uppercase tracking-widest text-muted py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => (
                    <div
                        key={i}
                        className={`min-h-[80px] rounded-xl p-1.5 border transition-colors ${
                            day === null
                                ? 'border-transparent bg-transparent'
                                : isToday(day)
                                    ? 'border-purple-500/40 bg-purple-900/10'
                                    : 'border-border bg-surface hover:border-border'
                        }`}
                    >
                        {day !== null && (
                            <>
                                <p className={`text-[11px] font-bold mb-1 ${isToday(day) ? 'text-purple-400' : 'text-muted'}`}>
                                    {day}
                                </p>
                                <div className="space-y-0.5">
                                    {(byDay.get(day) ?? []).slice(0, 3).map(post => (
                                        <a
                                            key={post.id}
                                            href={`/write?edit=${post.id}`}
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

            {/* Legend */}
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

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    DRAFT:          { label: 'Rascunho',   color: 'bg-surface text-muted'             },
    PENDING_REVIEW: { label: 'Em revisão', color: 'bg-yellow-500/20 text-yellow-400'  },
    PUBLISHED:      { label: 'Publicado',  color: 'bg-green-500/20 text-green-400'    },
    ARCHIVED:       { label: 'Arquivado',  color: 'bg-red-500/20 text-red-400'        },
}

// ─── Suggestion Row ───────────────────────────────────────────────────────────
// Does NOT use any global hook — receives stable callbacks from parent

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
            {/* Thumbnail */}
            <div className="w-12 h-9 rounded-lg overflow-hidden bg-surface shrink-0 border border-border">
                {item.imageUrl ? (
                    <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={48}
                        height={36}
                        className="object-cover w-full h-full"
                        unoptimized
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Newspaper className="w-4 h-4 text-muted" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                {item.subtitle && (
                    <p className="text-[11px] text-muted truncate mt-0.5">{item.subtitle}</p>
                )}
            </div>

            {/* Arrow indicator */}
            <ArrowRight className="w-4 h-4 text-muted shrink-0 hidden sm:block" />

            {/* Actions */}
            <div className="shrink-0 flex items-center gap-2">
                {done ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Gerado
                    </span>
                ) : (
                    <AdminButton
                        onClick={generate}
                        disabled={loading}
                        size="sm"
                    >
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

// ─── Publish Button ───────────────────────────────────────────────────────────

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
            {post.status === 'PUBLISHED' ? <Archive size={14} /> : <CheckCircle size={14} />}
        </button>
    )
}

// ─── Featured Button ──────────────────────────────────────────────────────────

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
            <Star size={14} className={post.featured ? 'fill-yellow-400' : ''} />
        </button>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBlogPage() {
    // Use Zustand selector → addToast is stable, component won't re-render on toast changes
    const addToast = useToast(s => s.addToast)
    const showError   = useCallback((msg: string) => addToast({ type: 'error',   message: msg, duration: 5000 }), [addToast])
    const showSuccess = useCallback((msg: string) => addToast({ type: 'success', message: msg, duration: 3000 }), [addToast])

    const [activeTab,     setActiveTab]    = useState<Tab>('suggestions')
    const [suggestions,   setSuggestions]  = useState<NewsSuggestion[]>([])
    const [loading,       setLoading]      = useState(false)
    const [hiddenIds,     setHiddenIds]    = useState<Set<string>>(new Set())
    const [generatingAll, setGeneratingAll] = useState(false)

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
    }, [])

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

    const columns: Column<BlogPost>[] = [
        {
            key: 'coverImageUrl',
            label: '',
            render: (post) =>
                post.coverImageUrl ? (
                    <Image src={post.coverImageUrl} alt={post.title} width={52} height={36} className="rounded-lg object-cover" unoptimized />
                ) : (
                    <div className="w-[52px] h-9 bg-surface rounded-lg flex items-center justify-center">
                        <BookOpen size={14} className="text-muted" />
                    </div>
                ),
        },
        {
            key: 'title',
            label: 'Título',
            sortable: true,
            render: (post) => (
                <div className="max-w-sm">
                    <p className="font-medium text-foreground truncate">{post.title}</p>
                    <p className="text-xs text-muted truncate">{post.author.name} · {post.category?.name ?? '—'}</p>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (post) => {
                const s = STATUS_LABELS[post.status] ?? { label: post.status, color: 'bg-surface text-muted' }
                return <AdminStatusBadge label={s.label} color={s.color} />
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
            render: (post) => <span className="text-sm text-muted flex items-center gap-1"><Eye size={11} />{post.viewCount}</span>,
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

    return (
        <AdminLayout title="Blog Pipeline">
            <div className="space-y-5">

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
                        { text: 'O campo "Tempo de leitura" é calculado automaticamente a partir do conteúdo.' },
                        { text: 'Categorias e tags ajudam no SEO e na navegação do leitor.' },
                        { text: 'Posts arquivados ficam no banco mas não aparecem no site — útil para conteúdo sazonal.' },
                        { text: 'A IA usa o conteúdo original da notícia + contexto do artista para gerar o post — mais contexto = melhor resultado.' },
                    ]}
                />

                {/* Header */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs text-muted">
                        Gerencie posts publicados e converta notícias em conteúdo editorial com IA.
                    </p>
                    <Link
                        href="/write"
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all text-xs shadow-lg shadow-blue-500/20"
                    >
                        <BookOpen size={13} />
                        Novo Artigo
                    </Link>
                </div>

                {/* Tabs */}
                <AdminTabGroup
                    tabs={[
                        { key: 'suggestions', label: 'Sugestões IA', icon: <Sparkles className="w-3.5 h-3.5" />, badge: visibleSuggestions.length },
                        { key: 'posts',       label: 'Posts',        icon: <FileText className="w-3.5 h-3.5" /> },
                        { key: 'calendar',    label: 'Calendário',   icon: <CalendarDays className="w-3.5 h-3.5" /> },
                    ]}
                    active={activeTab}
                    onChange={v => setActiveTab(v as Tab)}
                    activeClass="bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                />

                {/* Suggestions tab */}
                {activeTab === 'suggestions' && (
                    <div className="space-y-4">
                        {/* Controls */}
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

                        {/* Pipeline legend */}
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

                        {/* List */}
                        {loading && visibleSuggestions.length === 0 ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-6 h-6 text-muted animate-spin" />
                            </div>
                        ) : visibleSuggestions.length === 0 ? (
                            <div className="text-center py-14 border border-dashed border-border rounded-xl">
                                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                                <p className="text-sm font-medium text-foreground">Nenhuma sugestão pendente</p>
                                <p className="text-xs text-muted mt-1">Todas as notícias publicadas já têm blog posts.</p>
                            </div>
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

                {/* Calendar tab */}
                {activeTab === 'calendar' && <CalendarView />}

                {/* Posts tab */}
                {activeTab === 'posts' && (
                    <DataTable<BlogPost>
                        columns={columns}
                        apiUrl="/api/admin/blog"
                        searchPlaceholder="Buscar por título..."
                        actions={(post) => (
                            <div className="flex items-center gap-1">
                                <AdminIconLink
                                    href={`/write?edit=${post.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    title="Editar"
                                >
                                    <BookOpen size={14} />
                                </AdminIconLink>
                                <FeaturedButton post={post} onDone={refetchTable} />
                                <PublishButton post={post} onDone={refetchTable} />
                                {post.status === 'PUBLISHED' && (
                                    <Link
                                        href={(post as unknown as { isPrivate?: boolean }).isPrivate ? `/blog/preview/${post.slug}` : `/blog/${post.slug}`}
                                        target="_blank"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1.5 rounded text-muted hover:text-green-300 hover:bg-green-400/10 transition-colors"
                                        title={(post as unknown as { isPrivate?: boolean }).isPrivate ? 'Ver prévia privada' : 'Ver publicado'}
                                    >
                                        <Eye size={14} />
                                    </Link>
                                )}
                            </div>
                        )}
                    />
                )}
            </div>
        </AdminLayout>
    )
}
