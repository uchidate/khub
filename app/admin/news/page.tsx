'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import {
    Plus, RefreshCw, Eye, EyeOff, CheckCircle, XCircle, Loader2, ExternalLink,
    Download, RotateCcw, Send, Check, X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

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
}

interface NewsStats {
    queue: number
    total: number
    hidden: number
    today: number
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
    general:       { bg: 'bg-zinc-700/50',    text: 'text-zinc-400'    },
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
    if (!source) return <span className="text-zinc-700 text-xs">—</span>
    const c = SOURCE_COLORS[source] ?? { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' }
    return (
        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
            {source}
        </span>
    )
}

function ContentTypeBadge({ type }: { type: string | null }) {
    if (!type) return <span className="text-zinc-700 text-xs">—</span>
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
        return <span className="text-[11px] text-zinc-600">sem blocos</span>
    }
    return <span className="text-[11px] text-zinc-500">EN</span>
}

function ArtistsCell({ artists }: { artists: NewsArtistLink[] }) {
    if (artists.length === 0) return <span className="text-xs text-zinc-700 italic">nenhum</span>
    const shown = artists.slice(0, 3)
    const extra = artists.length - shown.length
    return (
        <div className="flex items-center gap-1 flex-wrap max-w-[160px]">
            {shown.map(({ artist }) => (
                <span
                    key={artist.id}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[10px] font-medium border border-purple-500/20"
                >
                    {artist.primaryImageUrl ? (
                        <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} width={12} height={12} className="rounded-full object-cover flex-shrink-0" />
                    ) : (
                        <span className="w-3 h-3 rounded-full bg-purple-500/30 inline-flex items-center justify-center text-[7px] font-black flex-shrink-0">
                            {artist.nameRomanized[0]}
                        </span>
                    )}
                    <span className="truncate max-w-[55px]">{artist.nameRomanized}</span>
                </span>
            ))}
            {extra > 0 && <span className="text-[10px] text-zinc-500 font-bold">+{extra}</span>}
        </div>
    )
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
                    className="p-1 rounded text-zinc-500 hover:bg-zinc-700 transition-colors"
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
                'text-zinc-500 hover:text-purple-300 hover:bg-purple-400/10'
            }`}
        >
            <RefreshCw size={13} className={state === 'loading' ? 'animate-spin' : ''} />
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
        return p
    }, [filterSource, filterStatus])

    const columns: Column<News>[] = useMemo(() => [
        {
            key: 'imageUrl',
            label: '',
            render: (news) => news.imageUrl ? (
                <Image src={news.imageUrl} alt={news.title} width={52} height={34} className="rounded-lg object-cover flex-shrink-0" />
            ) : (
                <div className="w-[52px] h-[34px] bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] text-zinc-600 font-bold">IMG</span>
                </div>
            ),
        },
        {
            key: 'title',
            label: 'Título',
            sortable: true,
            render: (news) => (
                <div className="max-w-xs">
                    <p className="font-medium text-white leading-snug line-clamp-2 text-sm">{news.title}</p>
                    <p className="text-[10px] text-zinc-600 truncate mt-0.5">{news.sourceUrl}</p>
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
                <span className="text-xs text-zinc-400 whitespace-nowrap">
                    {new Date(news.publishedAt).toLocaleDateString('pt-BR')}
                </span>
            ),
        },
        {
            key: 'isHidden',
            label: 'Status',
            render: (news) => {
                if (news.isHidden) return <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/15 text-red-400 rounded text-[11px] font-semibold"><EyeOff size={10} /> Oculta</span>
                if (news.status === 'draft')  return <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-700/60 text-zinc-400 rounded text-[11px] font-semibold">Rascunho</span>
                if (news.status === 'ready')  return <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded text-[11px] font-semibold"><CheckCircle size={10} /> Pronta</span>
                return <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded text-[11px] font-semibold"><Eye size={10} /> Visível</span>
            },
        },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [localArtistsOverride])

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

    const clearFilters = () => { setFilterSource(''); setFilterStatus('') }
    const hasFilters = !!(filterSource || filterStatus)

    const STAT_CARDS = [
        {
            label: 'Total',
            value: stats?.total,
            color: 'text-white',
            filterValue: '' as const,
            activeColor: 'border-zinc-600',
        },
        {
            label: 'Fila',
            value: stats?.queue,
            color: stats?.queue ? 'text-blue-400' : 'text-zinc-600',
            filterValue: 'queue' as const,
            activeColor: 'border-blue-500/40 bg-blue-500/5',
            hint: 'draft + pronta',
        },
        {
            label: 'Ocultas',
            value: stats?.hidden,
            color: stats?.hidden ? 'text-amber-400' : 'text-zinc-600',
            filterValue: 'hidden' as const,
            activeColor: 'border-amber-500/40 bg-amber-500/5',
        },
        {
            label: 'Hoje',
            value: stats?.today,
            color: stats?.today ? 'text-emerald-400' : 'text-zinc-600',
            filterValue: 'today' as const,
            activeColor: 'border-emerald-500/40 bg-emerald-500/5',
        },
    ]

    return (
        <AdminLayout
            title="Notícias"
            subtitle="Gerencie notícias do K-Pop e K-Drama"
            actions={
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/news/reprocess"
                        className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-400 font-medium rounded-lg hover:border-purple-500/50 hover:text-purple-300 transition-all text-xs"
                    >
                        <RotateCcw size={13} />
                        Reprocessar
                    </Link>
                    <Link
                        href="/admin/news/import"
                        className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-400 font-medium rounded-lg hover:border-emerald-500/50 hover:text-emerald-300 transition-all text-xs"
                    >
                        <Download size={13} />
                        Importar
                    </Link>
                    <button
                        onClick={() => { setEditingNews(null); setFormOpen(true) }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all text-sm"
                    >
                        <Plus size={15} />
                        Nova
                    </button>
                </div>
            }
        >
            <div className="space-y-4">

                {/* ── Stats ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {STAT_CARDS.map(({ label, value, color, filterValue, activeColor, hint }) => {
                        const isActive = filterStatus === filterValue && filterValue !== ''
                        return (
                            <button
                                key={label}
                                onClick={() => setFilterStatus(prev => prev === filterValue ? '' : filterValue)}
                                className={`rounded-xl border bg-zinc-900/40 px-4 py-3 text-center transition-colors hover:border-zinc-600 ${
                                    isActive ? activeColor : 'border-zinc-800'
                                }`}
                            >
                                <p className={`text-2xl font-black tabular-nums ${color}`}>
                                    {value === undefined
                                        ? <Loader2 size={18} className="animate-spin mx-auto text-zinc-600" />
                                        : value.toLocaleString('pt-BR')
                                    }
                                </p>
                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                    {label}
                                    {hint && <span className="text-zinc-700 ml-1">· {hint}</span>}
                                </p>
                            </button>
                        )
                    })}
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
                                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                                }`}
                            >
                                {s}
                            </button>
                        )
                    })}

                    {/* Separator */}
                    <span className="text-zinc-700 select-none">·</span>

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
                                    : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                            }`}
                        >
                            {pill.icon} {pill.label}
                        </button>
                    ))}

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-[11px] text-zinc-600 hover:text-zinc-300 px-2 py-1 rounded-lg hover:bg-zinc-800 transition-colors"
                        >
                            Limpar filtros
                        </button>
                    )}
                </div>

                {/* ── Table ─────────────────────────────────────────────── */}
                <DataTable<News>
                    columns={columns}
                    apiUrl="/api/admin/news"
                    extraParams={extraParams}
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
                            <Link
                                href={`/news/${news.id}`}
                                target="_blank"
                                onClick={e => e.stopPropagation()}
                                className="p-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                                title="Ver no site"
                            >
                                <ExternalLink size={13} />
                            </Link>
                            <ReprocessButton
                                newsId={news.id}
                                translationStatus={news.translationStatus}
                                onDone={(artists) => setLocalArtistsOverride(prev => ({ ...prev, [news.id]: artists }))}
                            />
                            {news.status !== 'published' && (
                                <button
                                    onClick={e => { e.stopPropagation(); handlePublish(news) }}
                                    title="Publicar no site"
                                    className="p-1.5 rounded transition-colors text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                >
                                    <Send size={13} />
                                </button>
                            )}
                            <button
                                onClick={e => { e.stopPropagation(); handleToggleHidden(news) }}
                                title={news.isHidden ? 'Tornar visível' : 'Ocultar do site'}
                                className={`p-1.5 rounded transition-colors ${
                                    news.isHidden
                                        ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10'
                                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                                }`}
                            >
                                {news.isHidden ? <XCircle size={13} /> : <CheckCircle size={13} />}
                            </button>
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
