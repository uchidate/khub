'use client'

import { useState } from 'react'
import { Loader2, Zap, CheckCircle2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

type BatchActionType = 'publish' | 'translate' | 'enrich'
type EntityType      = 'news' | 'artist' | 'production'

interface Props {
    ids:    string[]
    type:   EntityType
    action: BatchActionType
}

async function processItem(id: string, type: EntityType, action: BatchActionType) {
    if (action === 'publish' && type === 'news') {
        return fetch(`/api/admin/news/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'published' }),
        })
    }
    if (action === 'translate') {
        if (type === 'news') {
            return fetch(`/api/admin/news/${id}/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
        }
        const entityType = type === 'artist' ? 'artist' : 'production'
        return fetch('/api/admin/translations/single', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entityType, id }),
        })
    }
    if (action === 'enrich' && type === 'artist') {
        return fetch(`/api/admin/artists/${id}/generate-editorial`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generate: ['bio', 'editorial', 'curiosidades'] }),
        })
    }
    if (action === 'enrich' && type === 'production') {
        return fetch('/api/admin/enrichment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: 'production_synopsis', entityId: id }),
        })
    }
    return null
}

const BATCH_LABELS: Record<BatchActionType, string> = {
    publish:   'Publicar todos',
    translate: 'Traduzir todos',
    enrich:    'Enriquecer todos',
}

export function PipelineBatchAction({ ids, type, action }: Props) {
    const [state,    setState]    = useState<'idle' | 'running' | 'done'>('idle')
    const [progress, setProgress] = useState(0)
    const [errors,   setErrors]   = useState(0)
    const router = useRouter()

    if (ids.length === 0) return null

    async function handleBatch() {
        if (state === 'running') return
        if (ids.length > 20 && !window.confirm(`Processar ${ids.length} itens em lote? Isso pode levar alguns minutos.`)) return
        setState('running')
        setProgress(0)
        setErrors(0)

        let done = 0
        let errs = 0

        for (const id of ids) {
            try {
                const res = await processItem(id, type, action)
                if (!res?.ok) errs++
            } catch {
                errs++
            }
            done++
            setProgress(done)
            setErrors(errs)
        }

        setState('done')
        setTimeout(() => router.refresh(), 800)
    }

    if (state === 'done') {
        const ok = progress - errors
        return (
            <div className={`flex items-center gap-1 text-[10px] font-medium ${errors > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {errors > 0
                    ? <AlertCircle size={10} />
                    : <CheckCircle2 size={10} />
                }
                {ok}/{progress} ok{errors > 0 ? `, ${errors} erro(s)` : ''}
            </div>
        )
    }

    if (state === 'running') {
        return (
            <div className="flex items-center gap-1.5 text-[10px] text-muted">
                <Loader2 size={10} className="animate-spin" />
                {progress}/{ids.length}
            </div>
        )
    }

    return (
        <button
            onClick={handleBatch}
            className="flex items-center gap-1 text-[10px] text-muted hover:text-accent transition-colors font-medium"
            title={`${BATCH_LABELS[action]} (${ids.length} itens)`}
        >
            <Zap size={10} />
            {BATCH_LABELS[action]} ({ids.length})
        </button>
    )
}
