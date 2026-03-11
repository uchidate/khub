'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, CheckCircle, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { BlockEditor } from '@/components/admin/BlockEditor'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
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
    const router = useRouter()
    const [newsId, setNewsId] = useState<string | null>(null)
    const [returnTo, setReturnTo] = useState<string>('/admin/news')
    const [news, setNews] = useState<NewsForEdit | null>(null)
    const [blocks, setBlocks] = useState<NewsBlock[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showOriginal, setShowOriginal] = useState(true)

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
                setBlocks(Array.isArray(data.blocks) ? data.blocks : [])
            })
            .catch(() => setError('Erro ao carregar notícia'))
            .finally(() => setLoading(false))
    }, [newsId])

    const handleSave = useCallback(async () => {
        if (!newsId) return
        setSaving(true)
        setSaved(false)
        setError(null)
        try {
            const res = await fetch(`/api/admin/news/${newsId}/blocks`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocks }),
            })
            if (!res.ok) throw new Error('Erro ao salvar')
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch {
            setError('Erro ao salvar blocos')
        } finally {
            setSaving(false)
        }
    }, [newsId, blocks])

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
                <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
            </div>
        )
    }

    if (!news) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">
                Notícia não encontrada.
            </div>
        )
    }

    const originalContent = news.originalContent || news.contentMd

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            {/* Top bar */}
            <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur border-b border-white/8 px-4 py-3 flex items-center gap-3">
                <Link
                    href={returnTo}
                    className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </Link>

                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-semibold text-white truncate">{news.title}</h1>
                    <p className="text-[11px] text-zinc-600">Editor de blocos</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* View public */}
                    <Link
                        href={`/news/${news.id}`}
                        target="_blank"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 border border-white/8 hover:border-white/15 transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver
                    </Link>

                    {/* Toggle original panel */}
                    <button
                        onClick={() => setShowOriginal(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 border border-white/8 hover:border-white/15 transition-colors"
                    >
                        {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        Original
                    </button>

                    {/* Save */}
                    {error && <span className="text-xs text-red-400">{error}</span>}
                    {saved && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Salvo
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-colors"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar
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
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                    Conteúdo original
                                </span>
                                {news.source && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-white/8">
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
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                Blocos traduzidos
                            </span>
                            <span className="text-[10px] text-zinc-700">
                                {blocks.length} bloco{blocks.length !== 1 ? 's' : ''}
                                {' '}·{' '}
                                <kbd className="font-mono text-zinc-700">⌘S</kbd> para salvar
                            </span>
                        </div>
                        <BlockEditor blocks={blocks} onChange={setBlocks} />
                    </div>
                </div>
            </div>
        </div>
    )
}
