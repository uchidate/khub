'use client'

import { useState } from 'react'
import { Loader2, Eye, Languages, Sparkles, Globe, EyeOff, AlertCircle, RotateCcw, CheckCircle2, ShieldAlert, Flag } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ActionType = 'publish' | 'translate' | 'enrich' | 'show' | 'hide' | 'approve' | 'flagAdult' | 'flagNonKorean'
type EntityType = 'news' | 'artist' | 'production'

interface Props {
    id:     string
    type:   EntityType
    action: ActionType
}

const ACTION_CONFIG: Record<ActionType, {
    label:     string
    loadLabel: string
    icon:      React.ElementType
    cls:       string
}> = {
    publish:   { label: 'Publicar',        loadLabel: 'Publicando...',   icon: Globe,     cls: 'text-zinc-400 hover:text-white hover:bg-zinc-700/60' },
    translate: { label: 'Traduzir IA',     loadLabel: 'Traduzindo...',   icon: Languages, cls: 'text-yellow-400/80 hover:text-yellow-300 hover:bg-yellow-500/10' },
    enrich:    { label: 'Enriquecer IA',   loadLabel: 'Gerando...',      icon: Sparkles,  cls: 'text-blue-400/80 hover:text-blue-300 hover:bg-blue-500/10' },
    show:          { label: 'Tornar visível',  loadLabel: 'Salvando...',     icon: Eye,          cls: 'text-zinc-400 hover:text-white hover:bg-zinc-700/60' },
    hide:          { label: 'Ocultar',         loadLabel: 'Ocultando...',    icon: EyeOff,       cls: 'text-red-400/80 hover:text-red-300 hover:bg-red-500/10' },
    approve:       { label: 'Aprovar',          loadLabel: 'Aprovando...',    icon: CheckCircle2, cls: 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10' },
    flagAdult:     { label: 'Adulto 18+',       loadLabel: 'Marcando...',     icon: ShieldAlert,  cls: 'text-red-400/80 hover:text-red-300 hover:bg-red-500/10' },
    flagNonKorean: { label: 'Não coreano',      loadLabel: 'Marcando...',     icon: Flag,         cls: 'text-orange-400/80 hover:text-orange-300 hover:bg-orange-500/10' },
}

export function PipelineActions({ id, type, action }: Props) {
    const [loading, setLoading] = useState(false)
    const [done,    setDone]    = useState(false)
    const [error,   setError]   = useState(false)
    const router = useRouter()
    const cfg    = ACTION_CONFIG[action]

    async function handleClick() {
        if (loading || done) return
        setLoading(true)
        setError(false)

        try {
            let url    = ''
            let method: 'GET' | 'POST' | 'PATCH' = 'POST'
            let body: Record<string, unknown> | undefined

            if (action === 'publish' && type === 'news') {
                url    = `/api/admin/news/${id}`
                method = 'PATCH'
                body   = { status: 'published' }
            } else if (action === 'show' || action === 'hide') {
                if (type === 'production') {
                    url = `/api/admin/productions?id=${id}`
                } else {
                    const entityPath = type === 'news' ? 'news' : 'artists'
                    url = `/api/admin/${entityPath}/${id}`
                }
                method = 'PATCH'
                body   = { isHidden: action === 'hide' }
            } else if (action === 'translate') {
                const entityType = type === 'artist' ? 'artist' : type === 'production' ? 'production' : 'news'
                url  = '/api/admin/translations/single'
                body = { entityType, id }
            } else if (action === 'enrich') {
                if (type === 'artist') {
                    url  = `/api/admin/artists/${id}/generate-editorial`
                    body = { generate: ['bio', 'editorial', 'curiosidades'] }
                } else {
                    url  = '/api/admin/enrichment'
                    body = { target: 'production_review', entityId: id }
                }
            } else if (action === 'approve') {
                url    = `/api/admin/productions?id=${id}`
                method = 'PATCH'
                body   = { needsCuration: false, isAdultContent: false }
            } else if (action === 'flagAdult') {
                url    = `/api/admin/productions?id=${id}`
                method = 'PATCH'
                body   = { needsCuration: false, isAdultContent: true, isHidden: true, ageRating: '18' }
            } else if (action === 'flagNonKorean') {
                url    = `/api/admin/productions?id=${id}`
                method = 'PATCH'
                body   = { needsCuration: false, flaggedAsNonKorean: true }
            }

            if (!url) return

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
            })

            if (res.ok) {
                setDone(true)
                setTimeout(() => router.refresh(), 800)
            } else {
                setError(true)
            }
        } catch {
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    if (done) {
        return (
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Feito
            </div>
        )
    }

    if (error) {
        return (
            <button
                onClick={() => { setError(false); handleClick() }}
                className="flex items-center gap-1.5 text-[11px] text-red-400 hover:text-red-300 transition-colors"
                title="Ocorreu um erro — clique para tentar novamente"
            >
                <AlertCircle size={11} />
                Erro —
                <RotateCcw size={10} />
                tentar novamente
            </button>
        )
    }

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg transition-all disabled:opacity-50 ${cfg.cls}`}
        >
            {loading
                ? <Loader2 size={11} className="animate-spin" />
                : <cfg.icon size={11} />
            }
            {loading ? cfg.loadLabel : cfg.label}
        </button>
    )
}
