'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Flag, MessageSquare, ChevronRight, RefreshCw, Bot, Zap, CheckCircle2, AlertCircle } from 'lucide-react'

// ─── Urgências ao vivo ────────────────────────────────────────────────────────

interface UrgentCounts {
  reports: number
  comments: number
}

/**
 * LiveUrgentPanel
 * Substitui os cards de urgência estáticos do dashboard.
 * Faz polling a cada 30s e atualiza document.title quando há pendências.
 */
export function LiveUrgentPanel({ initial }: { initial: UrgentCounts }) {
  const [counts, setCounts] = useState<UrgentCounts>(initial)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    try {
      const res = await fetch('/api/admin/pending-counts')
      if (res.ok) {
        const data: UrgentCounts = await res.json()
        setCounts(data)
        setLastUpdated(new Date())

        // Atualiza o título da aba quando há pendências
        const total = data.reports + data.comments
        if (total > 0) {
          document.title = `(${total}) HallyuHub Admin`
        } else {
          document.title = 'HallyuHub Admin'
        }
      }
    } finally {
      if (showSpinner) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    // Polling a cada 30s
    const interval = setInterval(() => refresh(), 30_000)
    return () => {
      clearInterval(interval)
      document.title = 'HallyuHub Admin'
    }
  }, [refresh])

  const total = counts.reports + counts.comments
  if (total === 0) return null

  const urgentItems = [
    counts.reports > 0 && {
      label: 'Reportes pendentes',
      count: counts.reports,
      href: '/admin/reports?status=PENDING',
      icon: Flag,
    },
    counts.comments > 0 && {
      label: 'Comentários flagados',
      count: counts.comments,
      href: '/admin/comments?status=FLAGGED',
      icon: MessageSquare,
    },
  ].filter(Boolean) as Array<{ label: string; count: number; href: string; icon: React.ElementType }>

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-red-400/70">
          Urgente
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-700">
            atualizado {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => refresh(true)}
            disabled={refreshing}
            className="text-zinc-700 hover:text-zinc-400 transition-colors"
            title="Atualizar agora"
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {urgentItems.map(item => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/30 hover:bg-red-500/10 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
                <item.icon className="w-3.5 h-3.5 text-red-400" />
              </div>
              <span className="text-sm font-bold text-red-300">{item.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-red-400">{item.count}</span>
              <ChevronRight className="w-4 h-4 text-red-500/60 group-hover:text-red-400 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Widget IA ────────────────────────────────────────────────────────────────

interface AiWidgetData {
  lastJobAt: string | null
  lastJobStatus: 'success' | 'failed' | null
  lastJobType: string | null
  totalJobsToday: number
  activeProviders: string[]
}

export function AiWidget() {
  const [data, setData] = useState<AiWidgetData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/ai/widget')
        if (res.ok) setData(await res.json())
      } catch {}
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-zinc-600" />
          <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-3 bg-zinc-800 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const statusIcon = data.lastJobStatus === 'success'
    ? <CheckCircle2 className="w-3 h-3 text-green-400" />
    : data.lastJobStatus === 'failed'
      ? <AlertCircle className="w-3 h-3 text-red-400" />
      : null

  return (
    <Link
      href="/admin/ai"
      className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">IA</span>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
      </div>

      <div className="space-y-2">
        {data.totalJobsToday > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">Jobs hoje</span>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-xs font-bold text-zinc-300">{data.totalJobsToday}</span>
            </div>
          </div>
        )}

        {data.lastJobType && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">Último job</span>
            <div className="flex items-center gap-1">
              {statusIcon}
              <span className="text-xs text-zinc-400 truncate max-w-[120px]">{data.lastJobType}</span>
            </div>
          </div>
        )}

        {data.activeProviders.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">Providers</span>
            <div className="flex gap-1">
              {data.activeProviders.slice(0, 3).map(p => (
                <span key={p} className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
