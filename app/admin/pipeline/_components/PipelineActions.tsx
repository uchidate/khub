'use client'

import { useState } from 'react'
import { Loader2, Eye, Languages, Sparkles, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ActionType = 'publish' | 'translate' | 'enrich' | 'show'
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
  publish:   { label: 'Publicar',   loadLabel: 'Publicando...',  icon: Globe,     cls: 'text-zinc-400 hover:text-white hover:bg-zinc-700/60' },
  translate: { label: 'Traduzir IA', loadLabel: 'Traduzindo...',  icon: Languages, cls: 'text-yellow-400/80 hover:text-yellow-300 hover:bg-yellow-500/10' },
  enrich:    { label: 'Enriquecer IA', loadLabel: 'Gerando...', icon: Sparkles,  cls: 'text-blue-400/80 hover:text-blue-300 hover:bg-blue-500/10' },
  show:      { label: 'Tornar visível', loadLabel: 'Salvando...', icon: Eye,      cls: 'text-zinc-400 hover:text-white hover:bg-zinc-700/60' },
}

export function PipelineActions({ id, type, action }: Props) {
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const router = useRouter()
  const cfg    = ACTION_CONFIG[action]

  async function handleClick() {
    if (loading || done) return
    setLoading(true)

    try {
      let url = ''
      let method: 'GET' | 'POST' | 'PATCH' = 'POST'
      let body: Record<string, unknown> | undefined

      if (action === 'publish' && type === 'news') {
        url    = `/api/admin/news/${id}`
        method = 'PATCH'
        body   = { status: 'published' }
      } else if (action === 'show') {
        const entityPath = type === 'news' ? 'news' : type === 'artist' ? 'artists' : 'productions'
        url    = `/api/admin/${entityPath}/${id}`
        method = 'PATCH'
        body   = { isHidden: false }
      } else if (action === 'translate') {
        if (type === 'news') {
          url  = `/api/admin/translations/single`
          body = { entityType: 'news', entityId: id }
        } else if (type === 'artist') {
          url  = `/api/admin/translations/single`
          body = { entityType: 'artist', entityId: id }
        } else {
          url  = `/api/admin/translations/single`
          body = { entityType: 'production', entityId: id }
        }
      } else if (action === 'enrich') {
        if (type === 'artist') {
          url  = `/api/admin/enrichment`
          body = { target: 'artist_bio', entityId: id }
        } else {
          url  = `/api/admin/enrichment`
          body = { target: 'production_synopsis', entityId: id }
        }
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
      }
    } catch {
      // silently ignore
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
