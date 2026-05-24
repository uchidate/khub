'use client'

import { useState, useEffect } from 'react'
import { Loader2, RotateCcw, Clock } from 'lucide-react'
import type { BlogBlock } from '@/lib/types/blocks'

interface Version {
    id: string
    savedAt: string
    note: string | null
    title: string
    blocks: BlogBlock[]
}

interface Props {
    postId: string
    onRestore: (version: Version) => void
}

export function VersionHistoryPanel({ postId, onRestore }: Props) {
    const [versions, setVersions] = useState<Version[]>([])
    const [loading, setLoading] = useState(true)
    const [restoring, setRestoring] = useState<string | null>(null)

    useEffect(() => {
        fetch(`/api/blog/posts/${postId}/versions`)
            .then(r => r.json())
            .then(data => setVersions(Array.isArray(data.versions) ? data.versions : []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [postId])

    function handleRestore(v: Version) {
        if (!v.blocks?.length) return
        setRestoring(v.id)
        onRestore(v)
        setTimeout(() => setRestoring(null), 1000)
    }

    function formatDate(iso: string) {
        const d = new Date(iso)
        return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    }

    if (loading) return (
        <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-muted" />
        </div>
    )

    if (versions.length === 0) return (
        <p className="text-xs text-muted text-center py-5">Nenhuma versão salva ainda.</p>
    )

    return (
        <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {versions.map(v => (
                <div key={v.id} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-surface/50 transition-colors">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted">
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatDate(v.savedAt)}
                        </div>
                        {v.note && <p className="text-[11px] text-foreground mt-0.5 truncate">{v.note}</p>}
                        <p className="text-[10px] text-muted/60 mt-0.5 truncate">{v.title}</p>
                    </div>
                    {v.blocks?.length > 0 && (
                        <button
                            onClick={() => handleRestore(v)}
                            disabled={restoring === v.id}
                            title="Restaurar esta versão"
                            className="flex items-center gap-1 text-[10px] font-bold text-accent hover:text-accent/80 transition-colors shrink-0 disabled:opacity-50"
                        >
                            {restoring === v.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <RotateCcw className="w-3 h-3" />
                            }
                            restaurar
                        </button>
                    )}
                </div>
            ))}
        </div>
    )
}
