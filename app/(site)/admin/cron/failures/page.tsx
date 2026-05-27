'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, Bot, CheckCircle2, RefreshCw, RotateCcw, Zap } from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminEmptyState, AdminButton } from '@/components/admin'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import type { FailureEntry } from '@/app/api/admin/cron/failures/route'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  const hr   = Math.floor(diff / 3_600_000)
  if (min < 2)  return 'agora há pouco'
  if (hr  < 1)  return `há ${min}min`
  if (hr  < 24) return `há ${hr}h`
  return `há ${Math.floor(diff / 86_400_000)}d`
}

export default function CronFailuresPage() {
  const toast = useAdminToast()
  const [failures, setFailures] = useState<FailureEntry[]>([])
  const [total, setTotal] = useState(0)
  const [since, setSince] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [retriggering, setRetriggering] = useState<string | null>(null)
  const [retriggered, setRetriggered] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/cron/failures')
      const data = await res.json()
      setFailures(data.failures ?? [])
      setTotal(data.total ?? 0)
      setSince(data.since ?? null)
    } catch {
      toast.error('Erro ao carregar falhas')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  async function retrigger(entry: FailureEntry) {
    if (!entry.jobId || !entry.canRetrigger) return
    const key = `${entry.type}-${entry.jobId}`
    if (retriggering) return
    setRetriggering(key)
    try {
      const res = await fetch('/api/admin/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: entry.jobId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${entry.jobName ?? entry.jobId} disparado`)
        setRetriggered(prev => new Set([...prev, key]))
      } else {
        toast.error(data.error ?? 'Falha ao disparar job')
      }
    } catch {
      toast.error('Erro ao disparar job')
    } finally {
      setRetriggering(null)
    }
  }

  const systemFailures = failures.filter(f => f.type === 'system')
  const aiFailures     = failures.filter(f => f.type === 'ai')

  return (
    <AdminLayout title="Falhas de automação" subtitle="Jobs com erros nas últimas 48h">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/cron" className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors">
            <ArrowLeft size={13} /> Automações
          </Link>
          <div className="flex items-center gap-2">
            {since && (
              <span className="text-[11px] text-muted">Janela: últimas 48h</span>
            )}
            <AdminButton onClick={load} disabled={loading} variant="secondary" size="sm">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </AdminButton>
          </div>
        </div>

        {/* Summary */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Total de erros</p>
              <p className={`text-2xl font-black tabular-nums ${total > 0 ? 'text-red-400' : 'text-green-400'}`}>{total}</p>
              <p className="text-[11px] text-muted mt-0.5">nas últimas 48h</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Serviços afetados</p>
              <p className={`text-2xl font-black tabular-nums ${systemFailures.length > 0 ? 'text-red-400' : 'text-green-400'}`}>{systemFailures.length}</p>
              <p className="text-[11px] text-muted mt-0.5">jobs/serviços do sistema</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Falhas de IA</p>
              <p className={`text-2xl font-black tabular-nums ${aiFailures.length > 0 ? 'text-orange-400' : 'text-green-400'}`}>{aiFailures.length}</p>
              <p className="text-[11px] text-muted mt-0.5">features com erro</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : failures.length === 0 ? (
          <AdminEmptyState
            title="Nenhuma falha nas últimas 48h"
            description="Todos os jobs estão operando normalmente."
            size="md"
            icon={<CheckCircle2 className="w-8 h-8 text-green-400" />}
          />
        ) : (
          <div className="space-y-4">
            {/* System failures */}
            {systemFailures.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={13} className="text-red-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                    Erros de sistema · {systemFailures.reduce((s, f) => s + f.count, 0)} ocorrências
                  </p>
                </div>
                <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
                  {systemFailures.map(entry => {
                    const key = `${entry.type}-${entry.jobId ?? entry.label}`
                    const isRunning = retriggering === key
                    const wasRetriggered = retriggered.has(key)
                    return (
                      <div key={key} className="flex items-start gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {entry.jobName ?? entry.label}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 tabular-nums">
                              {entry.count}×
                            </span>
                            <span className="text-[10px] text-muted">{timeAgo(entry.lastAt)}</span>
                          </div>
                          {entry.lastMessage && (
                            <p className="text-[11px] text-muted font-mono truncate max-w-lg" title={entry.lastMessage}>
                              {entry.lastMessage}
                            </p>
                          )}
                          <p className="text-[10px] text-muted/60">{entry.label}</p>
                        </div>
                        {entry.canRetrigger ? (
                          <AdminButton
                            onClick={() => retrigger(entry)}
                            disabled={!!retriggering || wasRetriggered}
                            variant={wasRetriggered ? 'secondary' : 'primary'}
                            size="sm"
                          >
                            {wasRetriggered ? (
                              <><CheckCircle2 size={12} /> Disparado</>
                            ) : (
                              <><RotateCcw size={12} className={isRunning ? 'animate-spin' : ''} /> Reexecutar</>
                            )}
                          </AdminButton>
                        ) : (
                          <span className="text-[10px] text-muted px-2 py-1 border border-border rounded-lg">Manual</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* AI failures */}
            {aiFailures.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={13} className="text-orange-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                    Falhas de IA · {aiFailures.reduce((s, f) => s + f.count, 0)} ocorrências
                  </p>
                </div>
                <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
                  {aiFailures.map(entry => {
                    const key = `${entry.type}-${entry.label}`
                    const isRunning = retriggering === key
                    const wasRetriggered = retriggered.has(key)
                    return (
                      <div key={key} className="flex items-start gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{entry.label}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 tabular-nums">
                              {entry.count}×
                            </span>
                            <span className="text-[10px] text-muted">{timeAgo(entry.lastAt)}</span>
                          </div>
                          {entry.lastMessage && (
                            <p className="text-[11px] text-muted font-mono truncate max-w-lg" title={entry.lastMessage}>
                              {entry.lastMessage}
                            </p>
                          )}
                          {entry.jobName && (
                            <p className="text-[10px] text-muted/60">via {entry.jobName}</p>
                          )}
                        </div>
                        {entry.canRetrigger ? (
                          <AdminButton
                            onClick={() => retrigger(entry)}
                            disabled={!!retriggering || wasRetriggered}
                            variant={wasRetriggered ? 'secondary' : 'primary'}
                            size="sm"
                          >
                            {wasRetriggered ? (
                              <><CheckCircle2 size={12} /> Disparado</>
                            ) : (
                              <><Zap size={12} className={isRunning ? 'animate-spin' : ''} /> Reexecutar</>
                            )}
                          </AdminButton>
                        ) : (
                          <span className="text-[10px] text-muted px-2 py-1 border border-border rounded-lg">Sem retry</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
