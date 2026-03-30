'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, ExternalLink, Eye, EyeOff, Languages } from 'lucide-react'
import { BlockEditor } from '@/components/admin/BlockEditor'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import type { NewsBlock } from '@/lib/types/blocks'

interface NewsForEdit {
    id: string
    title: string
    originalContent: string | null
    contentMd: string
    blocks: NewsBlock[] | null
    source: string | null
    imageUrl: string | null
    isHidden: boolean
}

export default function NewsBlockEditPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ returnTo?: string }>
}) {
    const toast = useAdminToast()
    const [newsId, setNewsId] = useState<string | null>(null)
    const [returnTo, setReturnTo] = useState<string>('/admin/news')
    const [news, setNews] = useState<NewsForEdit | null>(null)
    const [blocks, setBlocks] = useState<NewsBlock[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [translating, setTranslating] = useState(false)
    const [togglingHidden, setTogglingHidden] = useState(false)
    const [showOriginal, setShowOriginal] = useState(true)

    // Dirty state: track whether blocks have unsaved changes
    const savedBlocksRef = useRef<NewsBlock[]>([])
    const isDirty = blocks !== savedBlocksRef.current &&
        JSON.stringify(blocks) !== JSON.stringify(savedBlocksRef.current)

    // Resolve async params
    useEffect(() => {
        Promise.all([params, searchParams]).then(([p, s]) => {
            setNewsId(p.id)
            setReturnTo(s.returnTo || '/admin/news')
        })
    }, [params, searchParams])

    // Load news
    useEffect(() => {
        if (!newsId) return
        setLoading(true)
        fetch(`/api/admin/news/${newsId}`)
            .then(r => r.json())
            .then((data: NewsForEdit) => {
                setNews(data)
                const initial = Array.isArray(data.blocks) ? data.blocks : []
                setBlocks(initial)
                savedBlocksRef.current = initial
            })
            .catch(() => toast.error('Erro ao carregar notícia'))
            .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newsId])

    const handleSave = useCallback(async () => {
        if (!newsId) return
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/news/${newsId}/blocks`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocks }),
            })
            if (!res.ok) { toast.error('Erro ao salvar blocos'); return }
            savedBlocksRef.current = blocks
            toast.saved()
        } catch {
            toast.error('Erro ao salvar blocos')
        } finally {
            setSaving(false)
        }
    }, [newsId, blocks, toast])

    const handleTranslate = useCallback(async () => {
        if (!newsId) return
        setTranslating(true)
        try {
            const res = await fetch(`/api/admin/news/${newsId}/translate`, { method: 'POST' })
            if (!res.ok) {
                let msg = 'Erro ao traduzir'
                try { msg = (await res.json()).error || msg } catch { /* body não é JSON */ }
                toast.error(msg)
                return
            }
            const data = await res.json() as { title: string; blocks: NewsBlock[] }
            setBlocks(data.blocks)
            if (news) setNews({ ...news, title: data.title })
            // Blocks are now dirty — user must save explicitly
            toast.info('Tradução concluída. Salve para confirmar (⌘S).')
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erro ao traduzir')
        } finally {
            setTranslating(false)
        }
    }, [newsId, news, toast])

    const handleToggleHidden = useCallback(async () => {
        if (!newsId || !news) return
        setTogglingHidden(true)
        try {
            const willHide = !news.isHidden
            const res = await fetch(`/api/admin/news?id=${newsId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isHidden: willHide }),
            })
            if (!res.ok) { toast.error('Erro ao alterar visibilidade'); return }
            setNews({ ...news, isHidden: willHide })
            toast.success(willHide ? 'Notícia ocultada' : 'Notícia tornada visível')
        } finally {
            setTogglingHidden(false)
        }
    }, [newsId, news, toast])

    // Keyboard shortcut: Cmd/Ctrl + S
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                handleSave()
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [handleSave])

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-muted animate-spin" />
            </div>
        )
    }

    if (!news) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-muted">
                Notícia não encontrada.
            </div>
        )
    }

    const originalContent = news.originalContent || news.contentMd

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top bar */}
            <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-4 py-2.5 flex items-center gap-3">
                {/* Back + title */}
                <Link
                    href={returnTo}
                    className="flex items-center gap-1.5 text-muted hover:text-foreground text-sm transition-colors shrink-0"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Voltar</span>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <h1 className="text-sm font-semibold text-foreground truncate">{news.title}</h1>
                        {isDirty && (
                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                não salvo
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-muted">Editor de blocos · {blocks.length} bloco{blocks.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Secondary actions — view / original */}
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <Link
                        href={`/news/${news.id}`}
                        target="_blank"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted hover:text-foreground border border-border hover:border-border transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver
                    </Link>
                    <button
                        onClick={() => setShowOriginal(v => !v)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                            showOriginal
                                ? 'text-foreground border-border bg-surface'
                                : 'text-muted border-border hover:text-foreground hover:border-border'
                        }`}
                    >
                        {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        Original
                    </button>
                </div>

                {/* Divider */}
                <span className="hidden sm:block w-px h-5 bg-white/10 shrink-0" />

                {/* Primary actions — translate / visibility / save */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={handleTranslate}
                        disabled={translating || saving}
                        title="Traduzir com DeepSeek-V3"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-foreground border border-border hover:bg-surface-hover disabled:opacity-50 transition-colors"
                    >
                        {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{translating ? 'Traduzindo...' : 'Traduzir'}</span>
                    </button>

                    <button
                        onClick={handleToggleHidden}
                        disabled={togglingHidden}
                        title={news.isHidden ? 'Notícia oculta — clique para publicar' : 'Notícia visível — clique para ocultar'}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border disabled:opacity-50 transition-colors ${
                            news.isHidden
                                ? 'text-amber-400 border-amber-500/30 hover:border-amber-500/50 hover:text-amber-300'
                                : 'text-muted border-border hover:text-foreground hover:border-border'
                        }`}
                    >
                        {togglingHidden
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : news.isHidden
                                ? <EyeOff className="w-3.5 h-3.5" />
                                : <Eye className="w-3.5 h-3.5" />
                        }
                        <span className="hidden sm:inline">{news.isHidden ? 'Oculta' : 'Visível'}</span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving || !isDirty}
                        title="Salvar (⌘S)"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 ${
                            isDirty
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                                : 'bg-surface text-muted border border-border'
                        }`}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span className="hidden sm:inline">Salvar</span>
                    </button>
                </div>
            </header>

            {/* Editor area */}
            <div className={`flex-1 grid ${showOriginal ? 'grid-cols-2' : 'grid-cols-1'} divide-x divide-white/6`}>
                {/* Left: original */}
                {showOriginal && (
                    <div className="overflow-y-auto p-6">
                        <div className="max-w-2xl mx-auto">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                                    Conteúdo original
                                </span>
                                {news.source && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-surface text-muted border border-border">
                                        {news.source}
                                    </span>
                                )}
                            </div>
                            <MarkdownRenderer
                                content={originalContent}
                                coverImageUrl={news.imageUrl ?? undefined}
                                source={news.source}
                            />
                        </div>
                    </div>
                )}

                {/* Right: block editor */}
                <div className="overflow-y-auto p-6">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                                Blocos traduzidos
                            </span>
                            <kbd className="text-[10px] font-mono text-muted">⌘S</kbd>
                        </div>
                        <BlockEditor blocks={blocks} onChange={setBlocks} />
                    </div>
                </div>
            </div>
        </div>
    )
}
