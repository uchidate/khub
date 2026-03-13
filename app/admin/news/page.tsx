'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import {
    Plus, RefreshCw, Eye, EyeOff, CheckCircle, XCircle, Loader2, ExternalLink, Download, RotateCcw,
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
}

interface NewsStats {
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

function ReprocessButton({ newsId, onDone }: { newsId: string; onDone: (artists: LinkedArtist[]) => void }) {
    const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
    const handle = async (e: React.MouseEvent) => {
        e.stopPropagation()
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
    const [formOpen, setFormOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [editingNews, setEditingNews] = useState<News | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [localArtistsOverride, setLocalArtistsOverride] = useState<Record<string, LinkedArtist[]>>({})

    // Filters
    const [filterSource, setFilterSource] = useState<string>('')
    const [filterStatus, setFilterStatus] = useState<'' | 'visible' | 'hidden'>('')

    // Stats
    const [stats, setStats] = useState<NewsStats | null>(null)

    const fetchStats = useCallback(() => {
        Promise.all([
            fetch('/api/admin/news?take=1').then(r => r.json()),
            fetch('/api/admin/news?take=1&isHidden=true').then(r => r.json()),
            fetch('/api/admin/news?take=1&dateFrom=' + new Date().toISOString().split('T')[0]).then(r => r.json()),
        ]).then(([all, hidden, today]) => {
            setStats({
                total:  all.pagination?.total   ?? 0,
                hidden: hidden.pagination?.total ?? 0,
                today:  today.pagination?.total  ?? 0,
            })
        }).catch(() => {})
    }, [])

    useEffect(() => { fetchStats() }, [fetchStats])

    const extraParams: Record<string, string> = {}
    if (filterSource) extraParams.source = filterSource
    if (filterStatus === 'hidden')  extraParams.isHidden = 'true'
    if (filterStatus === 'visible') extraParams.isHidden = 'false'

    const columns: Column<News>[] = [
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
            render: (news) => news.isHidden
                ? <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/15 text-red-400 rounded text-[11px] font-semibold"><EyeOff size={10} /> Oculta</span>
                : <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded text-[11px] font-semibold"><Eye size={10} /> Visível</span>,
        },
    ]

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
        refetchTable()
        fetchStats()
    }

    const handleDeleteConfirm = async () => {
        const res = await fetch('/api/admin/news', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds }),
        })
        if (!res.ok) {
            const e = await res.json()
            throw new Error(e.error || 'Erro ao deletar notícias')
        }
        refetchTable()
        fetchStats()
    }

    const handleToggleHidden = async (news: News) => {
        await fetch(`/api/admin/news?id=${news.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isHidden: !news.isHidden }),
        })
        refetchTable()
        fetchStats()
    }

    return (
        <AdminLayout title="Notícias">
            <div className="space-y-5">

                {/* ── Stats ────────────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total', value: stats?.total, color: 'text-white' },
                        { label: 'Ocultas', value: stats?.hidden, color: 'text-amber-400' },
                        { label: 'Hoje', value: stats?.today, color: 'text-emerald-400' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-center">
                            <p className={`text-2xl font-black tabular-nums ${color}`}>
                                {value === undefined ? <Loader2 size={18} className="animate-spin mx-auto text-zinc-600" /> : value.toLocaleString('pt-BR')}
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>

                {/* ── Toolbar ──────────────────────────────────────────── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Source filter */}
                        <div className="flex items-center gap-1 flex-wrap">
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
                        </div>

                        {/* Status filter */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setFilterStatus(prev => prev === 'visible' ? '' : 'visible')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                    filterStatus === 'visible'
                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                                }`}
                            >
                                <Eye size={11} /> Visíveis
                            </button>
                            <button
                                onClick={() => setFilterStatus(prev => prev === 'hidden' ? '' : 'hidden')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                    filterStatus === 'hidden'
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                                }`}
                            >
                                <EyeOff size={11} /> Ocultas
                            </button>
                        </div>

                        {(filterSource || filterStatus) && (
                            <button
                                onClick={() => { setFilterSource(''); setFilterStatus('') }}
                                className="text-[11px] text-zinc-600 hover:text-zinc-300 px-2 py-1 rounded-lg hover:bg-zinc-800 transition-colors"
                            >
                                Limpar filtros
                            </button>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/admin/news/import"
                            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-lg hover:border-emerald-500/50 hover:text-emerald-300 transition-all text-sm"
                        >
                            <Download size={14} />
                            Importar
                        </Link>
                        <Link
                            href="/admin/news/reprocess"
                            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-lg hover:border-purple-500/50 hover:text-purple-300 transition-all text-sm"
                        >
                            <RotateCcw size={14} />
                            Reprocessar
                        </Link>
                        <button
                            onClick={() => { setEditingNews(null); setFormOpen(true) }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all text-sm"
                        >
                            <Plus size={15} />
                            Nova
                        </button>
                    </div>
                </div>

                {/* ── Table ────────────────────────────────────────────── */}
                <DataTable<News>
                    columns={columns}
                    apiUrl="/api/admin/news"
                    extraParams={extraParams}
                    editHref={(news) => `/admin/news/${news.id}/edit?returnTo=/admin/news`}
                    onDelete={(ids) => { setSelectedIds(ids); setDeleteOpen(true) }}
                    searchPlaceholder="Buscar por título ou conteúdo..."
                    filters={
                        <></>  // filters are rendered in toolbar above
                    }
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
                                onDone={(artists) => setLocalArtistsOverride(prev => ({ ...prev, [news.id]: artists }))}
                            />
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

            <DeleteConfirm
                open={deleteOpen}
                count={selectedIds.length}
                entityName="notícia"
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
            />
        </AdminLayout>
    )
}
