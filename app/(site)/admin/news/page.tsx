'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageGuide } from '@/components/admin/PageGuide'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { AdminButton, AdminLinkButton } from '@/components/admin/AdminButton'
import { StatCard } from '@/components/admin'
import { AdminBadge } from '@/components/admin/AdminBadge'
import { AdminIconButton, AdminIconLink } from '@/components/admin/AdminIconButton'
import {
    Plus, RefreshCw, Eye, EyeOff, CheckCircle, XCircle, Loader2, ExternalLink,
    Download, RotateCcw, Send, Check, X, Sparkles, PenSquare, Link2, FileText, ImageOff, TriangleAlert,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LinkedArtist {
    id: string
    nameRomanized: string
    primaryImageUrl: string | null
}

interface NewsArtistLink {
    artistId: string
    artist: LinkedArtist
}

interface News {
    id: string
    title: string
    contentMd: string
    sourceUrl: string
    source: string | null
    imageUrl: string | null
    publishedAt: Date
    tags: string[]
    isHidden: boolean
    contentType: string | null
    readingTimeMin: number | null
    translationStatus: string | null
    createdAt: Date
    updatedAt: Date
    artists: NewsArtistLink[]
    blocks?: unknown[]
    status: string
    editorialNoteGeneratedAt?: Date | null
    blogPostGeneratedAt?: Date | null
    originalContent?: string | null
    author?: string | null
}

interface NewsStats {
    queue: number
    total: number
    hidden: number
    today: number
    translated: number
    withArtists: number
    withEditorialNote: number
    blogGenerated: number
}

type EditorialFilter = '' | 'blog-ready' | 'translated' | 'with-artists' | 'editorial-note' | 'blog-generated' | 'without-artists'
type ImageFilter = '' | 'without-image' | 'broken-image'

async function postWithRetry(url: string, init: RequestInit, retries = 1) {
    let lastError: unknown = null

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, init)
            if (res.ok) return res
            if (attempt < retries && res.status >= 500) continue
            return res
        } catch (error) {
            lastError = error
            if (attempt === retries) throw error
        }
    }

    throw lastError instanceof Error ? lastError : new Error('Falha na requisição')
}

// ─── Display config ───────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Soompi:         { bg: 'bg-purple-500/15', text: 'text-purple-300',  border: 'border-purple-500/30' },
    Koreaboo:       { bg: 'bg-pink-500/15',   text: 'text-pink-300',    border: 'border-pink-500/30'   },
    Dramabeans:     { bg: 'bg-blue-500/15',   text: 'text-blue-300',    border: 'border-blue-500/30'   },
    'Asian Junkie': { bg: 'bg-amber-500/15',  text: 'text-amber-300',   border: 'border-amber-500/30'  },
    HelloKpop:      { bg: 'bg-emerald-500/15',text: 'text-emerald-300', border: 'border-emerald-500/30'},
    Kpopmap:        { bg: 'bg-violet-500/15', text: 'text-violet-300',  border: 'border-violet-500/30' },
}

const CONTENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
    debut:         { bg: 'bg-cyan-500/10',    text: 'text-cyan-300'    },
    comeback:      { bg: 'bg-pink-500/10',    text: 'text-pink-300'    },
    mv:            { bg: 'bg-red-500/10',     text: 'text-red-300'     },
    concert:       { bg: 'bg-orange-500/10',  text: 'text-orange-300'  },
    award:         { bg: 'bg-yellow-500/10',  text: 'text-yellow-300'  },
    collaboration: { bg: 'bg-teal-500/10',    text: 'text-teal-300'    },
    drama:         { bg: 'bg-blue-500/10',    text: 'text-blue-300'    },
    interview:     { bg: 'bg-violet-500/10',  text: 'text-violet-300'  },
    scandal:       { bg: 'bg-rose-500/10',    text: 'text-rose-300'    },
    general:       { bg: 'bg-surface',         text: 'text-muted'       },
}

const SOURCES = ['Soompi', 'Koreaboo', 'Dramabeans', 'Asian Junkie', 'HelloKpop', 'Kpopmap'] as const

const formFields: FormField[] = [
    { key: 'title',      label: 'Título',              type: 'text',     placeholder: 'Título da notícia',      required: true },
    { key: 'contentMd',  label: 'Conteúdo (Markdown)', type: 'textarea', placeholder: 'Conteúdo em Markdown',   required: true },
    { key: 'sourceUrl',  label: 'URL da Fonte',        type: 'text',     placeholder: 'https://...',            required: true },
    { key: 'imageUrl',   label: 'URL da Imagem',       type: 'text',     placeholder: 'https://...' },
    { key: 'publishedAt',label: 'Data de Publicação',  type: 'date' },
    { key: 'tags',       label: 'Tags',                type: 'tags',     placeholder: 'Separar por vírgula' },
]

// ─── Small components ─────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: string | null }) {
    if (!source) return <span className="text-muted text-xs">—</span>
    const c = SOURCE_COLORS[source] ?? { bg: 'bg-surface', text: 'text-muted', border: 'border-border' }
    return (
        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
            {source}
        </span>
    )
}

function ContentTypeBadge({ type }: { type: string | null }) {
    if (!type) return <span className="text-muted text-xs">—</span>
    const c = CONTENT_TYPE_COLORS[type] ?? CONTENT_TYPE_COLORS.general
    return (
        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium capitalize ${c.bg} ${c.text}`}>
            {type}
        </span>
    )
}

function TranslationBadge({ status, blockCount }: { status: string | null; blockCount: number }) {
    if (status === 'completed') {
        return (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <CheckCircle size={11} /> PT
            </span>
        )
    }
    if (blockCount === 0) {
        return <span className="text-[11px] text-muted">sem blocos</span>
    }
    return <span className="text-[11px] text-muted">EN</span>
}

function NewsThumbnail({ src, title, onBroken }: { src: string | null; title: string; onBroken?: () => void }) {
    const [failed, setFailed] = useState(false)

    if (!src || failed) {
        return (
            <div className="w-[52px] h-[34px] bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] text-muted font-bold">IMG</span>
            </div>
        )
    }

    return (
        <img
            src={src}
            alt={title}
            width={52}
            height={34}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => {
                setFailed(true)
                onBroken?.()
            }}
            className="rounded-lg object-cover flex-shrink-0"
        />
    )
}

function ArtistAvatar({ url, name, onBroken }: { url: string | null; name: string; onBroken?: () => void }) {
    const [failed, setFailed] = useState(false)

    if (!url || failed) {
        return (
            <span className="w-3 h-3 rounded-full bg-purple-500/30 inline-flex items-center justify-center text-[7px] font-black flex-shrink-0">
                {name[0]}
            </span>
        )
    }

    return (
        <img
            src={url}
            alt={name}
            width={12}
            height={12}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => {
                setFailed(true)
                onBroken?.()
            }}
            className="rounded-full object-cover flex-shrink-0"
        />
    )
}

function ArtistsCell({ artists }: { artists: NewsArtistLink[] }) {
    if (artists.length === 0) return <span className="text-xs text-muted italic">nenhum</span>
    const shown = artists.slice(0, 3)
    const extra = artists.length - shown.length
    return (
        <div className="flex items-center gap-1 flex-wrap max-w-[160px]">
            {shown.map(({ artist }) => (
                <span
                    key={artist.id}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-accent/10 text-accent rounded text-[10px] font-medium border border-accent/20"
                >
                    <ArtistAvatar url={artist.primaryImageUrl} name={artist.nameRomanized} />
                    <span className="truncate max-w-[55px]">{artist.nameRomanized}</span>
                </span>
            ))}
            {extra > 0 && <span className="text-[10px] text-muted font-bold">+{extra}</span>}
        </div>
    )
}

function getBlogReadiness(news: News) {
    const hasTranslation = news.translationStatus === 'completed'
    const hasArtists = news.artists.length > 0
    const hasNote = !!news.editorialNoteGeneratedAt
    const hasGeneratedBlog = !!news.blogPostGeneratedAt
    const contentLength = news.contentMd?.trim().length ?? 0

    if (hasGeneratedBlog) {
        return { label: 'Blog gerado', variant: 'published' as const }
    }
    if (hasTranslation && hasArtists && contentLength >= 900) {
        return { label: hasNote ? 'Pronta para artigo' : 'Boa para artigo', variant: 'success' as const }
    }
    if (hasTranslation && (hasArtists || contentLength >= 600)) {
        return { label: 'Base promissora', variant: 'warning' as const }
    }
    if (!hasTranslation) {
        return { label: 'Traduzir antes', variant: 'draft' as const }
    }
    return { label: 'Precisa enriquecer', variant: 'neutral' as const }
}

function ReadinessBadge({ news }: { news: News }) {
    const readiness = getBlogReadiness(news)
    return <AdminBadge variant={readiness.variant} shape="pill">{readiness.label}</AdminBadge>
}

/**
 * ReprocessButton com 2-step inline confirm quando a notícia já está traduzida.
 * Evita window.confirm() e mantém o padrão do admin.
 */
function ReprocessButton({ newsId, translationStatus, onDone }: {
    newsId: string
    translationStatus: string | null
    onDone: (artists: LinkedArtist[]) => void
}) {
    const [state, setState] = useState<'idle' | 'confirm' | 'loading' | 'ok' | 'err'>('idle')

    const execute = async () => {
        setState('loading')
        try {
            const res = await fetch(`/api/admin/news/reprocess?id=${newsId}`, { method: 'POST' })
            const data = await res.json()
            if (!res.ok || !data.ok) { setState('err'); return }
            onDone((data.artists ?? []).map((a: { id: string; name: string }) => ({
                id: a.id, nameRomanized: a.name, primaryImageUrl: null,
            })))
            setState('ok')
        } catch { setState('err') }
        finally { setTimeout(() => setState('idle'), 2500) }
    }

    const handle = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (translationStatus === 'completed' && state === 'idle') {
            setState('confirm')
            return
        }
        execute()
    }

    if (state === 'confirm') {
        return (
            <span className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                <span className="text-[10px] text-amber-400 font-medium mr-0.5">Reprocessar?</span>
                <button
                    onClick={() => execute()}
                    title="Confirmar reprocessamento"
                    className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                >
                    <Check size={12} />
                </button>
                <button
                    onClick={() => setState('idle')}
                    title="Cancelar"
                    className="p-1 rounded text-muted hover:bg-surface transition-colors"
                >
                    <X size={12} />
                </button>
            </span>
        )
    }

    return (
        <button
            onClick={handle}
            disabled={state === 'loading'}
            title="Reprocessar — re-busca conteúdo e re-extrai artistas"
            className={`p-1.5 rounded transition-colors disabled:cursor-wait ${
                state === 'ok'  ? 'text-emerald-400 bg-emerald-400/10' :
                state === 'err' ? 'text-red-400 bg-red-400/10' :
                'text-muted hover:text-foreground hover:bg-surface-hover'
            }`}
        >
            <RefreshCw size={13} className={state === 'loading' ? 'animate-spin' : ''} />
        </button>
    )
}

function GenerateBlogButton({ newsId, onDone }: { newsId: string; onDone: () => void }) {
    const toast = useAdminToast()
    const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')

    const handle = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setState('loading')
        try {
            const res = await postWithRetry(`/api/admin/news/${newsId}/generate-blog-post`, { method: 'POST' }, 1)
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error ?? 'Erro ao gerar blog post')
                setState('err')
            } else {
                toast.success(`Blog post criado como rascunho: "${data.title}"`)
                setState('ok')
                onDone()
            }
        } catch {
            setState('err')
        } finally {
            setTimeout(() => setState('idle'), 3000)
        }
    }

    return (
        <button
            onClick={handle}
            disabled={state === 'loading'}
            title="Gerar blog post a partir desta notícia (salvo como rascunho)"
            className={`p-1.5 rounded transition-colors disabled:cursor-wait ${
                state === 'ok'  ? 'text-emerald-400 bg-emerald-400/10' :
                state === 'err' ? 'text-red-400 bg-red-400/10' :
                'text-muted hover:text-foreground hover:bg-surface-hover'
            }`}
        >
            {state === 'loading'
                ? <Loader2 size={13} className="animate-spin" />
                : <Sparkles size={13} />
            }
        </button>
    )
}

function GenerateEditorialButton({ newsId, hasNote, onDone }: { newsId: string; hasNote: boolean; onDone: () => void }) {
    const toast = useAdminToast()
    const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')

    const handle = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setState('loading')
        try {
            const res = await postWithRetry(`/api/admin/news/${newsId}/generate-editorial`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ overwrite: hasNote }),
            }, 1)
            const data = await res.json().catch(() => ({})) as { error?: string }
            if (!res.ok) {
                toast.error(data.error ?? 'Erro ao gerar nota editorial')
                setState('err')
            } else {
                toast.success(hasNote ? 'Nota editorial atualizada' : 'Nota editorial gerada')
                setState('ok')
                onDone()
            }
        } catch {
            setState('err')
        } finally {
            setTimeout(() => setState('idle'), 3000)
        }
    }

    return (
        <button
            onClick={handle}
            disabled={state === 'loading'}
            title={hasNote ? 'Regenerar nota editorial' : 'Gerar nota editorial'}
            className={`p-1.5 rounded transition-colors disabled:cursor-wait ${
                state === 'ok'  ? 'text-emerald-400 bg-emerald-400/10' :
                state === 'err' ? 'text-red-400 bg-red-400/10' :
                hasNote ? 'text-violet-300 hover:bg-violet-500/10' : 'text-muted hover:text-foreground hover:bg-surface-hover'
            }`}
        >
            {state === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <PenSquare size={13} />}
        </button>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewsAdminPage() {
    const toast = useAdminToast()
    const [formOpen, setFormOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [editingNews, setEditingNews] = useState<News | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [localArtistsOverride, setLocalArtistsOverride] = useState<Record<string, LinkedArtist[]>>({})

    // Filters
    const [filterSource, setFilterSource] = useState<string>('')
    const [filterStatus, setFilterStatus] = useState<'' | 'visible' | 'hidden' | 'queue' | 'today'>('')
    const [editorialFilter, setEditorialFilter] = useState<EditorialFilter>('')
    const [imageFilter, setImageFilter] = useState<ImageFilter>('')
    const [brokenImageNewsIds, setBrokenImageNewsIds] = useState<Record<string, true>>({})

    // Stats
    const [stats, setStats] = useState<NewsStats | null>(null)

    const fetchStats = useCallback(() => {
        fetch('/api/admin/news/stats')
            .then(r => r.json())
            .then(setStats)
            .catch(() => {})
    }, [])

    useEffect(() => { fetchStats() }, [fetchStats])

    // Build extra params for DataTable — memoized so DataTable doesn't re-render on unrelated state changes
    const extraParams = useMemo<Record<string, string>>(() => {
        const p: Record<string, string> = {}
        if (filterSource)                  p.source   = filterSource
        if (filterStatus === 'hidden')     p.isHidden = 'true'
        if (filterStatus === 'visible')    p.isHidden = 'false'
        if (filterStatus === 'queue')      p.status   = 'ready'
        if (filterStatus === 'today') {
            p.dateFrom = new Date().toISOString().split('T')[0]
        }
        if (editorialFilter === 'blog-ready') p.blogEligible = 'true'
        if (editorialFilter === 'translated') p.translation = 'completed'
        if (editorialFilter === 'with-artists') p.artistLinks = 'with'
        if (editorialFilter === 'without-artists') p.artistLinks = 'without'
        if (editorialFilter === 'editorial-note') p.editorial = 'with'
        if (editorialFilter === 'blog-generated') p.blog = 'generated'
        if (imageFilter === 'without-image') p.hasImage = 'missing'
        return p
    }, [filterSource, filterStatus, editorialFilter, imageFilter])

    const markImageAsBroken = useCallback((newsId: string) => {
        setBrokenImageNewsIds((prev) => (prev[newsId] ? prev : { ...prev, [newsId]: true }))
    }, [])

    const columns: Column<News>[] = useMemo(() => [
        {
            key: 'imageUrl',
            label: '',
            render: (news) => <NewsThumbnail src={news.imageUrl} title={news.title} onBroken={() => markImageAsBroken(news.id)} />,
        },
        {
            key: 'title',
            label: 'Título',
            sortable: true,
            className: 'min-w-[320px]',
            render: (news) => (
                <div className="max-w-xs">
                    <p className="font-medium text-foreground leading-snug line-clamp-2 text-sm">{news.title}</p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <ReadinessBadge news={news} />
                        {news.editorialNoteGeneratedAt && <AdminBadge variant="accent" shape="pill"><FileText size={10} /> Nota</AdminBadge>}
                        {news.blogPostGeneratedAt && <AdminBadge variant="success" shape="pill"><Sparkles size={10} /> Blog</AdminBadge>}
                    </div>
                    <p className="text-[10px] text-muted truncate mt-1">{news.author ? `${news.author} · ` : ''}{news.sourceUrl}</p>
                </div>
            ),
        },
        {
            key: 'source',
            label: 'Fonte',
            render: (news) => <SourceBadge source={news.source} />,
        },
        {
            key: 'contentType',
            label: 'Tipo',
            className: 'hidden xl:table-cell',
            render: (news) => <ContentTypeBadge type={news.contentType} />,
        },
        {
            key: 'translationStatus',
            label: 'Idioma',
            className: 'hidden lg:table-cell',
            render: (news) => (
                <TranslationBadge
                    status={news.translationStatus}
                    blockCount={Array.isArray(news.blocks) ? news.blocks.length : 0}
                />
            ),
        },
        {
            key: 'artists',
            label: 'Artistas',
            className: 'hidden lg:table-cell',
            render: (news) => {
                const overridden = localArtistsOverride[news.id]
                const artists = overridden != null
                    ? overridden.map(a => ({ artistId: a.id, artist: a }))
                    : news.artists
                return <ArtistsCell artists={artists} />
            },
        },
        {
            key: 'publishedAt',
            label: 'Publicado',
            sortable: true,
            render: (news) => (
                <span className="text-xs text-muted whitespace-nowrap">
                    {new Date(news.publishedAt).toLocaleDateString('pt-BR')}
                </span>
            ),
        },
        {
            key: 'isHidden',
            label: 'Status',
            render: (news) => {
                if (news.isHidden) return <AdminBadge variant="hidden"><EyeOff size={10} /> Oculta</AdminBadge>
                if (news.status === 'draft')  return <AdminBadge variant="draft">Rascunho</AdminBadge>
                if (news.status === 'ready')  return <AdminBadge variant="pending"><CheckCircle size={10} /> Pronta</AdminBadge>
                return <AdminBadge variant="published"><Eye size={10} /> Visível</AdminBadge>
            },
        },
    ], [localArtistsOverride, markImageAsBroken])

    const handleFormSubmit = async (data: Record<string, unknown>) => {
        if (data.publishedAt && typeof data.publishedAt === 'string') {
            data.publishedAt = new Date(data.publishedAt).toISOString()
        }
        const url = editingNews ? `/api/admin/news?id=${editingNews.id}` : '/api/admin/news'
        const res = await fetch(url, {
            method: editingNews ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        if (!res.ok) {
            const e = await res.json()
            throw new Error(e.error || 'Erro ao salvar notícia')
        }
        toast.saved()
        refetchTable()
        fetchStats()
    }

    const handleDeleteConfirm = async () => {
        setDeleteLoading(true)
        try {
            const res = await fetch('/api/admin/news', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds }),
            })
            if (!res.ok) {
                const e = await res.json()
                toast.error(e.error || 'Erro ao deletar notícias')
                return
            }
            toast.deleted(`${selectedIds.length} notícia${selectedIds.length > 1 ? 's' : ''}`)
            setDeleteOpen(false)
            refetchTable()
            fetchStats()
        } catch (err) {
            toast.error((err as Error).message || 'Erro ao carregar dados')
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleToggleHidden = async (news: News) => {
        const willHide = !news.isHidden
        const res = await fetch(`/api/admin/news?id=${news.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isHidden: willHide }),
        })
        if (!res.ok) { toast.error('Erro ao alterar visibilidade'); return }
        toast.success(willHide ? 'Notícia ocultada' : 'Notícia tornada visível')
        refetchTable()
        fetchStats()
    }

    const handlePublish = async (news: News) => {
        const res = await fetch(`/api/admin/news?id=${news.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'published' }),
        })
        if (!res.ok) { toast.error('Erro ao publicar notícia'); return }
        toast.success('Notícia publicada')
        refetchTable()
        fetchStats()
    }

    const handleBulkPublish = async (ids: string[], clearSelection: () => void) => {
        const res = await fetch('/api/admin/news?bulk=publish', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
        })
        if (!res.ok) { toast.error('Erro ao publicar notícias'); return }
        toast.success(`${ids.length} notícia${ids.length > 1 ? 's publicadas' : ' publicada'}`)
        clearSelection()
        refetchTable()
        fetchStats()
    }

    const clearFilters = () => { setFilterSource(''); setFilterStatus(''); setEditorialFilter(''); setImageFilter('') }
    const hasFilters = !!(filterSource || filterStatus || editorialFilter || imageFilter)

    const STAT_CARDS = [
        {
            label: 'Total',
            value: stats?.total,
            color: 'text-foreground',
            filterValue: '' as const,
            activeColor: 'border-border',
        },
        {
            label: 'Fila',
            value: stats?.queue,
            color: stats?.queue ? 'text-blue-400' : 'text-muted',
            filterValue: 'queue' as const,
            activeColor: 'border-blue-500/40 bg-blue-500/5',
            hint: 'draft + pronta',
        },
        {
            label: 'Ocultas',
            value: stats?.hidden,
            color: stats?.hidden ? 'text-amber-400' : 'text-muted',
            filterValue: 'hidden' as const,
            activeColor: 'border-amber-500/40 bg-amber-500/5',
        },
        {
            label: 'Hoje',
            value: stats?.today,
            color: stats?.today ? 'text-emerald-400' : 'text-muted',
            filterValue: 'today' as const,
            activeColor: 'border-emerald-500/40 bg-emerald-500/5',
        },
        {
            label: 'Traduzidas',
            value: stats?.translated,
            color: stats?.translated ? 'text-violet-400' : 'text-muted',
            filterValue: '' as const,
            activeColor: 'border-violet-500/40 bg-violet-500/5',
            hint: 'PT pronto',
        },
        {
            label: 'Com artistas',
            value: stats?.withArtists,
            color: stats?.withArtists ? 'text-cyan-400' : 'text-muted',
            filterValue: '' as const,
            activeColor: 'border-cyan-500/40 bg-cyan-500/5',
        },
        {
            label: 'Viraram blog',
            value: stats?.blogGenerated,
            color: stats?.blogGenerated ? 'text-pink-400' : 'text-muted',
            filterValue: '' as const,
            activeColor: 'border-pink-500/40 bg-pink-500/5',
        },
    ]

    return (
        <AdminLayout
            title="Notícias"
            subtitle="Gerencie notícias do K-Pop e K-Drama"
            actions={
                <div className="flex items-center gap-2">
                    <AdminLinkButton href="/admin/news/reprocess" size="sm"><RotateCcw size={13} />Reprocessar</AdminLinkButton>
                    <AdminLinkButton href="/admin/news/import" size="sm"><Download size={13} />Importar</AdminLinkButton>
                    <AdminButton variant="primary" onClick={() => { setEditingNews(null); setFormOpen(true) }} size="sm"><Plus size={15} />Nova</AdminButton>
                </div>
            }
        >
            <div className="space-y-4">

                <PageGuide
                    storageKey="news"
                    title="Como funciona a gestão de Notícias"
                    description="Central de todas as notícias importadas pelo bot. Aqui você revisa, publica, traduz e gerencia o conteúdo antes que chegue ao público. Notícias passam por rascunho → publicação → tradução."
                    steps={[
                        { label: 'Importada', description: 'Bot importou, status = draft ou ready', color: 'zinc' },
                        { label: 'Revisar', description: 'Abrir editor, verificar conteúdo e imagem', color: 'blue' },
                        { label: 'Publicar', description: 'Alterar status para "published"', color: 'green' },
                        { label: 'Traduzir', description: 'Gerar versão PT-BR via IA', color: 'purple' },
                        { label: 'Vincular artistas', description: 'Associar artistas mencionados na notícia', color: 'yellow' },
                    ]}
                    tips={[
                        { text: 'Use o Pipeline (/admin/pipeline) para uma visão Kanban do fluxo completo de notícias.' },
                        { text: 'Filtre por status para focar em rascunhos ou notícias sem tradução.' },
                        { text: 'O botão "Reprocessar" (cabeçalho) re-extrai imagem e texto de notícias com falha de importação.' },
                        { text: 'Vincular artistas à notícia ativa a seção "Para Você" na home para usuários com favoritos.' },
                    ]}
                />

                {/* ── Stats ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
                    {STAT_CARDS.map(({ label, value, color, filterValue, hint }) => (
                        <StatCard
                            key={label}
                            label={hint ? `${label} · ${hint}` : label}
                            value={value}
                            color={color}
                            onClick={() => setFilterStatus(prev => prev === filterValue ? '' : filterValue)}
                            active={filterStatus === filterValue && filterValue !== ''}
                        />
                    ))}
                </div>

                {/* ── Filters ───────────────────────────────────────────── */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Source filter pills */}
                    {SOURCES.map(s => {
                        const c = SOURCE_COLORS[s]
                        const active = filterSource === s
                        return (
                            <button
                                key={s}
                                onClick={() => setFilterSource(prev => prev === s ? '' : s)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                    active && c
                                        ? `${c.bg} ${c.text} ${c.border}`
                                        : 'bg-surface border-border text-muted hover:text-foreground hover:border-border'
                                }`}
                            >
                                {s}
                            </button>
                        )
                    })}

                    {/* Separator */}
                    <span className="text-muted select-none">·</span>

                    {/* Status filter pills */}
                    {([
                        { value: 'queue'   as const, label: 'Fila',     icon: <Send size={11} />,    active: 'bg-blue-500/15 text-blue-300 border-blue-500/30'    },
                        { value: 'visible' as const, label: 'Visíveis', icon: <Eye size={11} />,     active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
                        { value: 'hidden'  as const, label: 'Ocultas',  icon: <EyeOff size={11} />, active: 'bg-amber-500/15 text-amber-300 border-amber-500/30'  },
                    ] as const).map(pill => (
                        <button
                            key={pill.value}
                            onClick={() => setFilterStatus(prev => prev === pill.value ? '' : pill.value)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                filterStatus === pill.value
                                    ? pill.active
                                    : 'bg-surface border-border text-muted hover:text-foreground hover:border-border'
                            }`}
                        >
                            {pill.icon} {pill.label}
                        </button>
                    ))}

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-[11px] text-muted hover:text-foreground px-2 py-1 rounded-lg hover:bg-surface-hover transition-colors"
                        >
                            Limpar filtros
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {([
                        { value: 'blog-ready', label: 'Boas para artigo', icon: <Sparkles size={11} />, active: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
                        { value: 'translated', label: 'Traduzidas', icon: <CheckCircle size={11} />, active: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
                        { value: 'with-artists', label: 'Com artistas', icon: <Link2 size={11} />, active: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
                        { value: 'without-artists', label: 'Sem artistas', icon: <XCircle size={11} />, active: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
                        { value: 'editorial-note', label: 'Com nota editorial', icon: <PenSquare size={11} />, active: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
                        { value: 'blog-generated', label: 'Ja viraram blog', icon: <FileText size={11} />, active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
                    ] as const).map(pill => (
                        <button
                            key={pill.value}
                            onClick={() => setEditorialFilter(prev => prev === pill.value ? '' : pill.value)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                editorialFilter === pill.value
                                    ? pill.active
                                    : 'bg-surface border-border text-muted hover:text-foreground hover:border-border'
                            }`}
                        >
                            {pill.icon} {pill.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {([
                        { value: 'without-image', label: 'Sem imagem', icon: <ImageOff size={11} />, active: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30' },
                        { value: 'broken-image', label: 'Imagem quebrada (sessão)', icon: <TriangleAlert size={11} />, active: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
                    ] as const).map(pill => (
                        <button
                            key={pill.value}
                            onClick={() => setImageFilter(prev => prev === pill.value ? '' : pill.value)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                imageFilter === pill.value
                                    ? pill.active
                                    : 'bg-surface border-border text-muted hover:text-foreground hover:border-border'
                            }`}
                        >
                            {pill.icon} {pill.label}
                        </button>
                    ))}
                    {imageFilter === 'broken-image' && (
                        <span className="text-[11px] text-muted">{Object.keys(brokenImageNewsIds).length} item(ns) detectado(s)</span>
                    )}
                </div>

                {/* ── Table ─────────────────────────────────────────────── */}
                <DataTable<News>
                    columns={columns}
                    apiUrl="/api/admin/news"
                    extraParams={extraParams}
                    clientFilter={imageFilter === 'broken-image' ? (news) => !!brokenImageNewsIds[news.id] : undefined}
                    renderSkeletonRow={(i, cols, hasActions, hasDelete) => (
                        <>
                            {hasDelete && (
                                <td className="px-4 py-3.5">
                                    <div className="w-4 h-4 bg-skeleton rounded" />
                                </td>
                            )}
                            <td className="px-4 py-3.5"><div className="w-[52px] h-[34px] bg-skeleton rounded-lg" /></td>
                            <td className="px-4 py-3.5 min-w-[320px]">
                                <div className="space-y-2">
                                    <div className="h-4 w-[82%] bg-skeleton rounded" />
                                    <div className="h-3 w-[65%] bg-skeleton rounded" />
                                </div>
                            </td>
                            {cols.slice(2).map((col) => (
                                <td key={`${col.key}-${i}`} className={`px-4 py-3.5 ${col.className ?? ''}`}>
                                    <div className="h-4 w-[70%] bg-skeleton rounded" />
                                </td>
                            ))}
                            {hasActions && (
                                <td className="sticky right-0 bg-surface border-l border-border/80 px-4 py-3.5">
                                    <div className="w-20 h-6 bg-skeleton rounded-lg ml-auto" />
                                </td>
                            )}
                        </>
                    )}
                    editHref={(news) => `/admin/news/${news.id}/edit?returnTo=/admin/news`}
                    onDelete={(ids) => { setSelectedIds(ids); setDeleteOpen(true) }}
                    searchPlaceholder="Buscar por título ou conteúdo..."
                    bulkActions={(ids, clearSelection) => (
                        <button
                            onClick={() => handleBulkPublish(ids, clearSelection)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                            <Send size={12} />
                            Publicar ({ids.length})
                        </button>
                    )}
                    actions={(news) => (
                        <div className="flex items-center gap-0.5">
                            <AdminIconLink
                                href={`/admin/news/${news.id}/preview`}
                                target="_blank"
                                onClick={e => e.stopPropagation()}
                                title="Preview"
                            >
                                <ExternalLink size={13} />
                            </AdminIconLink>
                            <ReprocessButton
                                newsId={news.id}
                                translationStatus={news.translationStatus}
                                onDone={(artists) => setLocalArtistsOverride(prev => ({ ...prev, [news.id]: artists }))}
                            />
                            <GenerateEditorialButton newsId={news.id} hasNote={!!news.editorialNoteGeneratedAt} onDone={refetchTable} />
                            {!news.blogPostGeneratedAt && (
                                <GenerateBlogButton newsId={news.id} onDone={refetchTable} />
                            )}
                            {news.status !== 'published' && (
                                <AdminIconButton
                                    onClick={e => { e.stopPropagation(); handlePublish(news) }}
                                    title="Publicar no site"
                                >
                                    <Send size={13} />
                                </AdminIconButton>
                            )}
                            <AdminIconButton
                                onClick={e => { e.stopPropagation(); handleToggleHidden(news) }}
                                title={news.isHidden ? 'Tornar visível' : 'Ocultar do site'}
                                variant={news.isHidden ? 'warning' : 'default'}
                            >
                                {news.isHidden ? <XCircle size={13} /> : <CheckCircle size={13} />}
                            </AdminIconButton>
                        </div>
                    )}
                />
            </div>

            <FormModal
                title={editingNews ? 'Editar Notícia' : 'Nova Notícia'}
                fields={formFields}
                initialData={
                    editingNews ? {
                        ...editingNews,
                        publishedAt: new Date(editingNews.publishedAt).toISOString().split('T')[0],
                        tags: editingNews.tags,
                    } as unknown as Record<string, unknown>
                    : undefined
                }
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
            />

            <ConfirmDialog
                open={deleteOpen}
                title={`Excluir ${selectedIds.length} notícia${selectedIds.length > 1 ? 's' : ''}?`}
                description="Esta ação não pode ser desfeita. Os dados serão removidos permanentemente."
                confirmLabel="Excluir"
                variant="danger"
                loading={deleteLoading}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteOpen(false)}
            />
        </AdminLayout>
    )
}
