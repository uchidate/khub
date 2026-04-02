'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export function AdminRefreshButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function refresh() {
    if (loading) return
    setLoading(true)
    router.refresh()
    setTimeout(() => setLoading(false), 700)
  }

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground border border-border bg-surface hover:bg-surface-hover px-3 py-1.5 rounded-lg transition-all disabled:opacity-60"
      title="Atualizar dashboard"
    >
      <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
      Atualizar
    </button>
  )
}
