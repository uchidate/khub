'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export function AdminRefreshButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(0)

  function emitRefreshSignal() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-dashboard-refresh'))
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('admin-auto-refresh-sec')
    const sec = Number(saved)
    if (sec === 30 || sec === 60) setAutoRefreshSec(sec)
  }, [])

  useEffect(() => {
    localStorage.setItem('admin-auto-refresh-sec', String(autoRefreshSec))
    if (autoRefreshSec <= 0) return
    const timer = setInterval(() => {
      emitRefreshSignal()
      router.refresh()
      setLastUpdated(new Date())
    }, autoRefreshSec * 1000)
    return () => clearInterval(timer)
  }, [autoRefreshSec, router])

  async function refresh() {
    if (loading) return
    setLoading(true)
    emitRefreshSignal()
    router.refresh()
    setLastUpdated(new Date())
    setTimeout(() => setLoading(false), 700)
  }

  return (
    <div className="inline-flex items-center gap-1.5 border border-border bg-surface rounded-lg px-2 py-1.5">
      <button
        type="button"
        onClick={refresh}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground px-1.5 py-0.5 rounded transition-all disabled:opacity-60"
        title="Atualizar dashboard"
      >
        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        Atualizar
      </button>

      <span className="text-[10px] text-muted border-l border-border pl-2">
        {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>

      <select
        value={autoRefreshSec}
        onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
        className="text-[10px] text-muted bg-background border border-border rounded px-1.5 py-0.5"
        title="Auto-refresh"
      >
        <option value={0}>Manual</option>
        <option value={30}>30s</option>
        <option value={60}>60s</option>
      </select>
    </div>
  )
}
