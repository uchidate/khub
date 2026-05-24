'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, RotateCcw, Clock, Pin, PinOff, ChevronDown, ChevronUp, User } from 'lucide-react'
import type { BlogBlock } from '@/lib/types/blocks'

interface Version {
    id: string
    savedAt: string
    note: string | null
    title: string
    excerpt: string | null
    wordCount: number
    blocksCount: number | null
    pinned: boolean
    label: string | null
    savedBy: { id: string; name: string | null; email: string | null }
}

interface VersionFull extends Version {
    blocks: BlogBlock[]
    contentMd: string
}

interface Props {
    postId: string
    onRestore: (version: Pick<VersionFull, 'title' | 'excerpt' | 'contentMd' | 'blocks'>) => void
}

function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function getBlockPreview(block: BlogBlock): string {
    const b = block as Record<string, unknown>
    if ('text' in b && typeof b.text === 'string') return b.text.slice(0, 80)
    if ('items' in b && Array.isArray(b.items)) return (b.items as string[]).slice(0, 2).join(' / ')
    if ('url' in b && typeof b.url === 'string') return b.url.slice(0, 60)
    if ('images' in b && Array.isArray(b.images)) return `${(b.images as unknown[]).length} imagens`
    if ('stats' in b && Array.isArray(b.stats)) return `${(b.stats as unknown[]).length} stats`
    if ('steps' in b && Array.isArray(b.steps)) return `${(b.steps as unknown[]).length} etapas`
    if ('events' in b && Array.isArray(b.events)) return `${(b.events as unknown[]).length} eventos`
    if ('pros' in b && Array.isArray(b.pros)) return `${(b.pros as string[]).slice(0, 1).join('')}…`
    return ''
}

function VersionRow({
    version,
    postId,
    onRestore,
    onPinToggle,
}: {
    version: Version
    postId: string
    onRestore: Props['onRestore']
    onPinToggle: (id: string, pinned: boolean) => void
}) {
    const [restoring, setRestoring] = useState(false)
    const [pinning, setPinning] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [preview, setPreview] = useState<VersionFull | null>(null)
    const [loadingPreview, setLoadingPreview] = useState(false)

    async function handleRestore() {
        setRestoring(true)
        try {
            const r = await fetch(`/api/blog/posts/${postId}/versions/${version.id}/restore`, { method: 'POST' })
            if (r.ok) {
                const full = preview ?? await (await fetch(`/api/blog/posts/${postId}/versions/${version.id}`)).json() as VersionFull
                onRestore({ title: full.title, excerpt: full.excerpt, contentMd: full.contentMd, blocks: full.blocks })
            }
        } finally {
            setRestoring(false)
        }
    }

    async function handlePin() {
        setPinning(true)
        try {
            const r = await fetch(`/api/blog/posts/${postId}/versions/${version.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pinned: !version.pinned }),
            })
            if (r.ok) onPinToggle(version.id, !version.pinned)
        } finally {
            setPinning(false)
        }
    }

    async function handleExpand() {
        const next = !expanded
        setExpanded(next)
        if (next && !preview) {
            setLoadingPreview(true)
            try {
                const r = await fetch(`/api/blog/posts/${postId}/versions/${version.id}`)
                if (r.ok) setPreview(await r.json())
            } finally {
                setLoadingPreview(false)
            }
        }
    }

    return (
        <div className={`border-b border-border last:border-0 ${version.pinned ? 'bg-amber-500/5' : ''}`}>
            <div className="flex items-start gap-2 px-4 py-3 hover:bg-surface/40 transition-colors">
                {/* left: meta */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {version.label && (
                            <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                                {version.label}
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-muted">
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatDate(version.savedAt)}
                        </span>
                        {version.savedBy?.name && (
                            <span className="flex items-center gap-0.5 text-[10px] text-muted/60">
                                <User className="w-2.5 h-2.5" />
                                {version.savedBy.name}
                            </span>
                        )}
                    </div>
                    {version.note && (
                        <p className="text-[11px] text-foreground/80 mt-0.5 truncate">{version.note}</p>
                    )}
                    <div className="flex gap-2 mt-0.5">
                        {version.wordCount > 0 && (
                            <span className="text-[10px] text-muted/50">{version.wordCount} palavras</span>
                        )}
                        {version.blocksCount !== null && (
                            <span className="text-[10px] text-muted/50">{version.blocksCount} blocos</span>
                        )}
                    </div>
                </div>

                {/* right: actions */}
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <button
                        onClick={handlePin}
                        disabled={pinning}
                        title={version.pinned ? 'Despinar' : 'Pinar versão'}
                        className={`p-1 rounded hover:bg-surface transition-colors ${version.pinned ? 'text-amber-400' : 'text-muted/40 hover:text-muted'}`}
                    >
                        {pinning
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : version.pinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />
                        }
                    </button>
                    <button
                        onClick={handleExpand}
                        title="Ver blocos desta versão"
                        className="p-1 rounded hover:bg-surface text-muted/40 hover:text-muted transition-colors"
                    >
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button
                        onClick={handleRestore}
                        disabled={restoring}
                        title="Restaurar esta versão"
                        className="flex items-center gap-1 text-[10px] font-bold text-accent hover:text-accent/80 transition-colors disabled:opacity-50 ml-1"
                    >
                        {restoring
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <RotateCcw className="w-3 h-3" />
                        }
                        restaurar
                    </button>
                </div>
            </div>

            {/* preview panel */}
            {expanded && (
                <div className="px-4 pb-3">
                    {loadingPreview ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted py-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> carregando…
                        </div>
                    ) : preview?.blocks?.length ? (
                        <div className="bg-surface rounded p-2 space-y-0.5 max-h-40 overflow-y-auto">
                            {preview.blocks.map((b, i) => (
                                <div key={i} className="flex gap-2 text-[10px]">
                                    <span className="text-muted/50 w-28 shrink-0 truncate">{b.type.replace('blog_', '')}</span>
                                    <span className="text-foreground/60 truncate">{getBlockPreview(b)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[10px] text-muted/50">Sem blocos nesta versão.</p>
                    )}
                </div>
            )}
        </div>
    )
}

export function VersionHistoryPanel({ postId, onRestore }: Props) {
    const [versions, setVersions] = useState<Version[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/blog/posts/${postId}/versions`)
            .then(r => r.json())
            .then(data => setVersions(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [postId])

    const handlePinToggle = useCallback((id: string, pinned: boolean) => {
        setVersions(vs => vs.map(v => v.id === id ? { ...v, pinned } : v))
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-muted" />
        </div>
    )

    if (versions.length === 0) return (
        <p className="text-xs text-muted text-center py-5">Nenhuma versão salva ainda.</p>
    )

    const pinned = versions.filter(v => v.pinned)
    const unpinned = versions.filter(v => !v.pinned)

    return (
        <div className="max-h-[480px] overflow-y-auto">
            {pinned.length > 0 && (
                <>
                    <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20">
                        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Pinadas</span>
                    </div>
                    {pinned.map(v => (
                        <VersionRow key={v.id} version={v} postId={postId} onRestore={onRestore} onPinToggle={handlePinToggle} />
                    ))}
                </>
            )}
            {unpinned.length > 0 && (
                <>
                    {pinned.length > 0 && (
                        <div className="px-4 py-1.5 bg-surface/50 border-b border-border">
                            <span className="text-[10px] font-semibold text-muted/60 uppercase tracking-wider">Histórico</span>
                        </div>
                    )}
                    {unpinned.map(v => (
                        <VersionRow key={v.id} version={v} postId={postId} onRestore={onRestore} onPinToggle={handlePinToggle} />
                    ))}
                </>
            )}
        </div>
    )
}
