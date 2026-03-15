'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import {
    CheckCircle, Eye, Archive, BookOpen, Sparkles, Loader2,
    Newspaper, FileText, RefreshCw, ArrowRight, ExternalLink,
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

type Tab = 'suggestions' | 'posts'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    DRAFT:          { label: 'Rascunho',   color: 'bg-zinc-700 text-zinc-400'         },
    PENDING_REVIEW: { label: 'Em revisão', color: 'bg-yellow-500/20 text-yellow-400'  },
    PUBLISHED:      { label: 'Publicado',  color: 'bg-green-500/20 text-green-400'    },
    ARCHIVED:       { label: 'Arquivado',  color: 'bg-red-500/20 text-red-400'        },
}

// ─── Suggestion Row ───────────────────────────────────────────────────────────

function SuggestionRow({
    item,
    onGenerated,
}: {
    item: NewsSuggestion
    onGenerated: (id: string) => void
}) {
    const toast = useAdminToast()
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
                toast.success('Blog post gerado como rascunho')
                onGenerated(item.id)
            } else {
                toast.error(data.error ?? 'Erro ao gerar blog post')
            }
        } catch {
            toast.error('Erro de rede')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${
            done
                ? 'border-emerald-500/20 bg-emerald-900/5 opacity-60'
                : 'border-white/6 bg-zinc-900/40 hover:border-blue-500/20 hover:bg-zinc-900/60'
        }`}>
            {/* Thumbnail */}
            <div className="w-12 h-9 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-white/6">
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
                        <Newspaper className="w-4 h-4 text-zinc-700" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                {item.subtitle && (
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">{item.subtitle}</p>
                )}
            </div>

            {/* Arrow indicator */}
            <ArrowRight className="w-4 h-4 text-zinc-700 shrink-0 hidden sm:block" />

            {/* Actions */}
            <div className="shrink-0 flex items-center gap-2">
                {done ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Gerado
                    </span>
                ) : (
                    <button
                        onClick={generate}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-all"
                    >
                        {loading
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
                            : <><Sparkles className="w-3.5 h-3.5" /> Gerar Post</>
                        }
                    </button>
                )}
                <a
                    href={`/admin/news/${item.id}/edit`}
                    className="p-1.5 rounded text-zinc-600 hover:text-zinc-400 transition-colors opacity-0 group-hover:opacity-100"
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBlogPage() {
    const toast    = useAdminToast()
    const toastRef = useRef(toast)
    useEffect(() => { toastRef.current = toast })

    const [activeTab,    setActiveTab]   = useState<Tab>('suggestions')
    const [suggestions,  setSuggestions] = useState<NewsSuggestion[]>([])
    const [loading,      setLoading]     = useState(false)
    const [hiddenIds,    setHiddenIds]   = useState<Set<string>>(new Set())
    const [generatingAll, setGeneratingAll] = useState(false)

    const fetchSuggestions = useCallback(async () => {
        setLoading(true)
        try {
            const res  = await fetch('/api/admin/enrichment/queue?tab=news&limit=50')
            const data = await res.json()
            // queue returns items with field 'nota' and 'blog' — filter those missing 'blog'
            const blogPending = (data.items ?? []).filter(
                (i: NewsSuggestion) => i.missingFields.includes('blog')
            )
            setSuggestions(blogPending)
        } catch {
            toastRef.current.error('Erro ao carregar sugestões')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (activeTab === 'suggestions') fetchSuggestions()
    }, [activeTab, fetchSuggestions])

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
                toastRef.current.success(`${data.processed} posts gerados como rascunho`)
                await fetchSuggestions()
            } else {
                toastRef.current.error(data.error ?? 'Erro ao gerar posts')
            }
        } catch {
            toastRef.current.error('Erro de rede')
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
                    <div className="w-[52px] h-9 bg-zinc-800 rounded-lg flex items-center justify-center">
                        <BookOpen size={14} className="text-zinc-600" />
                    </div>
                ),
        },
        {
            key: 'title',
            label: 'Título',
            sortable: true,
            render: (post) => (
                <div className="max-w-sm">
                    <p className="font-medium text-white truncate">{post.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{post.author.name} · {post.category?.name ?? '—'}</p>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (post) => {
                const s = STATUS_LABELS[post.status]
                return <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.color}`}>{s.label}</span>
            },
        },
        {
            key: 'viewCount',
            label: 'Views',
            sortable: true,
            render: (post) => <span className="text-sm text-zinc-400 flex items-center gap-1"><Eye size={11} />{post.viewCount}</span>,
        },
        {
            key: 'publishedAt',
            label: 'Data',
            sortable: true,
            render: (post) => (
                <span className="text-sm text-zinc-400">
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

                {/* Header */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs text-zinc-500">
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
                <div className="flex items-center gap-1 bg-zinc-900/60 border border-white/6 rounded-xl p-1 w-fit">
                    <button
                        onClick={() => setActiveTab('suggestions')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            activeTab === 'suggestions'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Sugestões IA
                        {visibleSuggestions.length > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                activeTab === 'suggestions' ? 'bg-white/20' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                                {visibleSuggestions.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            activeTab === 'posts'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        Posts
                    </button>
                </div>

                {/* Suggestions tab */}
                {activeTab === 'suggestions' && (
                    <div className="space-y-4">
                        {/* Controls */}
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-zinc-500 flex-1">
                                Notícias publicadas sem blog post gerado, ordenadas por recência.
                            </p>
                            <button
                                onClick={fetchSuggestions}
                                disabled={loading}
                                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-800"
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
                        <div className="flex items-center gap-2 text-[11px] text-zinc-600">
                            <Newspaper className="w-3.5 h-3.5" />
                            <span>Notícia publicada</span>
                            <ArrowRight className="w-3 h-3" />
                            <Sparkles className="w-3.5 h-3.5 text-blue-400/60" />
                            <span>Geração IA</span>
                            <ArrowRight className="w-3 h-3" />
                            <FileText className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Rascunho</span>
                            <ArrowRight className="w-3 h-3" />
                            <Eye className="w-3.5 h-3.5 text-emerald-400/60" />
                            <span>Publicar</span>
                        </div>

                        {/* List */}
                        {loading && visibleSuggestions.length === 0 ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
                            </div>
                        ) : visibleSuggestions.length === 0 ? (
                            <div className="text-center py-14 border border-dashed border-white/6 rounded-xl">
                                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                                <p className="text-sm font-medium text-white">Nenhuma sugestão pendente</p>
                                <p className="text-xs text-zinc-500 mt-1">Todas as notícias publicadas já têm blog posts.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {visibleSuggestions.map(item => (
                                    <SuggestionRow
                                        key={item.id}
                                        item={item}
                                        onGenerated={(id) => setHiddenIds(prev => { const next = new Set(prev); next.add(id); return next })}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Posts tab */}
                {activeTab === 'posts' && (
                    <DataTable<BlogPost>
                        columns={columns}
                        apiUrl="/api/admin/blog"
                        searchPlaceholder="Buscar por título..."
                        actions={(post) => (
                            <div className="flex items-center gap-1">
                                <Link
                                    href={`/write?edit=${post.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded text-zinc-400 hover:text-blue-300 hover:bg-blue-400/10 transition-colors"
                                    title="Editar"
                                >
                                    <BookOpen size={14} />
                                </Link>
                                <PublishButton post={post} onDone={refetchTable} />
                                {post.status === 'PUBLISHED' && (
                                    <Link
                                        href={`/blog/${post.slug}`}
                                        target="_blank"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1.5 rounded text-zinc-400 hover:text-green-300 hover:bg-green-400/10 transition-colors"
                                        title="Ver publicado"
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
