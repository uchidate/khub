'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { Users, RefreshCw, Music2 } from 'lucide-react'
import Image from 'next/image'
import { AdminButton, StatCard } from '@/components/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Artist {
  id: string
  nameRomanized: string
  nameHangul: string | null
  primaryImageUrl: string | null
  musicalGroupName: string | null
  musicalGroupId: string | null
  groupSyncAt: string | null
}

interface GroupStats {
  withGroup: number
  noGroup: number
  noGroupUnsynced: number
  noGroupSolo: number
}

type FilterType = '' | 'with_group' | 'no_group' | 'no_group_unsynced' | 'no_group_solo'

type LogLine = { text: string; type: 'info' | 'success' | 'warning' | 'error' | 'done' | 'progress' }

// ─── Log parser (batch sync) ──────────────────────────────────────────────────

function parseLine(line: string): LogLine {
  const [type, ...rest] = line.split(':')
  const payload = rest.join(':')
  switch (type) {
    case 'TOTAL':    return { text: `📋 ${payload} artistas para processar`, type: 'info' }
    case 'PROGRESS': {
      const parts = payload.split(':')
      return { text: `⏳ [${parts[0]}] ${parts.slice(1).join(':')}`, type: 'progress' }
    }
    case 'FOUND': {
      const parts = payload.split(':')
      return { text: `✅ ${parts[0]} → ${parts.slice(1).join(':')}`, type: 'success' }
    }
    case 'MB_FOUND': {
      const parts = payload.split(':')
      return { text: `🔍 ${parts[0]} encontrado via "${parts.slice(1).join(':')}"`, type: 'info' }
    }
    case 'SOLO':      return { text: `➖ Solo: ${payload}`, type: 'warning' }
    case 'NOT_FOUND': return { text: `➖ Não encontrado no MusicBrainz: ${payload}`, type: 'warning' }
    case 'ERROR':     return { text: `❌ Erro: ${payload}`, type: 'error' }
    case 'DONE':
      return {
        text: `🎉 Concluído! ${payload.replace('found=', 'com grupo: ').replace(',solo=', ' | solo/não encontrado: ').replace(',errors=', ' | erros: ')}`,
        type: 'done',
      }
    default: return { text: line, type: 'info' }
  }
}

// ─── Per-artist sync button ───────────────────────────────────────────────────

type BtnState = 'idle' | 'loading' | 'ok' | 'warn' | 'err'

function SyncGroupButton({ artist, onSynced }: {
  artist: Artist
  onSynced: (id: string, groupName: string | null, groupId: string | null) => void
}) {
  const [state, setState] = useState<BtnState>('idle')
  const [label, setLabel] = useState('')

  const handle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    setState('loading')
    try {
      const res = await fetch('/api/admin/artists/sync-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId: artist.id }),
      })
      const data = await res.json()
      if (!res.ok) { setState('err'); setLabel('Erro HTTP'); return }
      if (data.reason === 'found') {
        onSynced(artist.id, data.groupName, data.groupId)
        setState('ok')
        setLabel(`→ ${data.groupName}`)
      } else {
        onSynced(artist.id, null, null)
        setState('warn')
        setLabel(data.reason === 'not_found' ? 'Não encontrado' : 'Solo')
      }
    } catch { setState('err'); setLabel('Erro de rede') }
    finally { setTimeout(() => { setState('idle'); setLabel('') }, 4000) }
  }, [artist.id, onSynced])

  const colorClass =
    state === 'ok'   ? 'text-green-400 border-green-500/30'
    : state === 'warn' ? 'text-yellow-400 border-yellow-500/30'
    : state === 'err'  ? 'text-red-400 border-red-500/30'
    : 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10'

  return (
    <button
      onClick={handle}
      disabled={state === 'loading'}
      title={label || 'Buscar grupo via MusicBrainz'}
      className={`inline-flex items-center gap-1.5 px-2 py-1 border rounded text-xs font-medium transition-colors disabled:cursor-wait ${colorClass}`}
    >
      <Music2 size={11} className={state === 'loading' ? 'animate-pulse' : ''} />
      {state === 'ok' ? label : state === 'warn' ? label : state === 'err' ? label : state === 'loading' ? '...' : 'MBrainz'}
    </button>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats, filter, onFilter }: {
  stats: GroupStats | null
  filter: FilterType
  onFilter: (f: FilterType) => void
}) {
  const isNoGroup = filter === 'no_group' || filter === 'no_group_unsynced' || filter === 'no_group_solo'

  const mainTabs = [
    { label: 'Todos',     value: '' as FilterType,          count: null,                    dot: 'bg-border' },
    { label: 'Com grupo', value: 'with_group' as FilterType, count: stats?.withGroup ?? null, dot: 'bg-accent' },
    { label: 'Sem grupo', value: 'no_group' as FilterType,   count: stats?.noGroup ?? null,   dot: 'bg-amber-400' },
  ]

  const subTabs = [
    {
      label: 'Pendentes',
      value: 'no_group_unsynced' as FilterType,
      count: stats?.noGroupUnsynced ?? null,
      title: 'Nunca tentado — clique "MBrainz" para buscar',
      color: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20',
      activeColor: 'text-orange-300 border-orange-400/50 bg-orange-500/20',
    },
    {
      label: 'Solo / Não encontrado',
      value: 'no_group_solo' as FilterType,
      count: stats?.noGroupSolo ?? null,
      title: 'Já processado — MusicBrainz não encontrou grupo',
      color: 'text-muted border-border bg-surface hover:bg-surface',
      activeColor: 'text-foreground border-border bg-surface',
    },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {mainTabs.map((tab) => {
          const isActive = tab.value === '' ? filter === ''
            : tab.value === 'no_group' ? isNoGroup
            : filter === tab.value
          return (
            <button key={tab.value} onClick={() => onFilter(tab.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isActive
                  ? 'bg-accent border-transparent text-white'
                  : 'bg-surface border-border text-muted hover:border-border hover:text-foreground'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
              {tab.label}
              {tab.count != null && (
                <span className={`font-mono tabular-nums ${isActive ? 'text-white/80' : 'text-muted'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {isNoGroup && (
        <div className="flex items-center gap-1.5 flex-wrap pl-1">
          <span className="text-[10px] font-black text-muted uppercase tracking-widest mr-1">↳</span>
          {subTabs.map((sub) => {
            const isActive = filter === sub.value
            return (
              <button key={sub.value}
                onClick={() => onFilter(isActive ? 'no_group' : sub.value)}
                title={sub.title}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition-all border ${isActive ? sub.activeColor : sub.color}`}
              >
                {sub.label}
                {sub.count != null && <span className="font-mono tabular-nums opacity-80">{sub.count}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Batch sync panel ─────────────────────────────────────────────────────────

function BatchSyncPanel({ onDone }: { onDone: () => void }) {
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<LogLine[]>([])
  const [syncLimit, setSyncLimit] = useState(50)
  const [onlyMissing, setOnlyMissing] = useState(true)
  const [resultStats, setResultStats] = useState<{ found: number; solo: number; errors: number } | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const scrollLog = () => setTimeout(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, 50)

  const startSync = useCallback(async () => {
    setRunning(true)
    setOpen(true)
    setLog([{ text: '🚀 Iniciando busca de grupos via MusicBrainz...', type: 'info' }])
    setResultStats(null)

    try {
      const res = await fetch('/api/admin/sync-artist-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: syncLimit, onlyMissing }),
      })

      if (!res.ok || !res.body) {
        setLog(prev => [...prev, { text: `❌ Erro HTTP ${res.status}`, type: 'error' }])
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const result = await reader.read()
        if (result.done) break
        buffer += decoder.decode(result.value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          const parsed = parseLine(line)
          setLog(prev => [...prev, parsed])
          scrollLog()

          if (line.startsWith('DONE:')) {
            const match = line.match(/found=(\d+),solo=(\d+),errors=(\d+)/)
            if (match) {
              setResultStats({ found: parseInt(match[1]), solo: parseInt(match[2]), errors: parseInt(match[3]) })
              onDone()
            }
          }
        }
      }
    } catch (e) {
      setLog(prev => [...prev, { text: `❌ Erro: ${e}`, type: 'error' }])
    } finally {
      setRunning(false)
    }
  }, [syncLimit, onlyMissing, onDone])

  const lineColor = (type: LogLine['type']) => {
    if (type === 'success')  return 'text-green-400'
    if (type === 'error')    return 'text-red-400'
    if (type === 'warning')  return 'text-yellow-400'
    if (type === 'done')     return 'text-accent font-bold'
    if (type === 'progress') return 'text-muted'
    return 'text-foreground'
  }

  return (
    <div className="bg-surface border border-accent/20 rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Music2 className="w-5 h-5 text-accent flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-foreground">Sync em lote via MusicBrainz</p>
            <p className="text-xs text-muted mt-0.5">Busca relação "member of band" para múltiplos artistas</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
            <input type="checkbox" checked={onlyMissing} onChange={e => setOnlyMissing(e.target.checked)}
              disabled={running} className="accent-accent" />
            Apenas não sincronizados
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">Limite:</span>
            <select value={syncLimit} onChange={e => setSyncLimit(Number(e.target.value))} disabled={running}
              className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-accent/50 disabled:opacity-50">
              {[20, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <AdminButton variant="primary" size="md" onClick={startSync} disabled={running}>
            {running
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sincronizando...</>
              : <><Users className="w-4 h-4" /> Sincronizar Lote</>
            }
          </AdminButton>
        </div>
      </div>

      {resultStats && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Com grupo" value={resultStats.found} color="text-green-400" />
          <StatCard label="Solo / não encontrado" value={resultStats.solo} color="text-yellow-400" />
          <StatCard label="Erros" value={resultStats.errors} color="text-red-400" />
        </div>
      )}

      {open && log.length > 0 && (
        <div ref={logRef}
          className="bg-background rounded-lg p-4 max-h-52 overflow-y-auto font-mono text-xs space-y-0.5 border border-border">
          {log.map((line, i) => (
            <div key={i} className={lineColor(line.type)}>{line.text}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArtistGroupsAdminPage() {
  const [filter, setFilter] = useState<FilterType>('')
  const [stats, setStats] = useState<GroupStats | null>(null)
  const [groupOverrides, setGroupOverrides] = useState<Record<string, { name: string | null; id: string | null }>>({})

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin/artists/stats')
    if (res.ok) {
      const data = await res.json()
      setStats({
        withGroup: data.withGroup ?? 0,
        noGroup: data.noGroup ?? 0,
        noGroupUnsynced: data.noGroupUnsynced ?? 0,
        noGroupSolo: data.noGroupSolo ?? 0,
      })
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const handleSynced = useCallback((artistId: string, groupName: string | null, groupId: string | null) => {
    setGroupOverrides(prev => ({ ...prev, [artistId]: { name: groupName, id: groupId } }))
    fetchStats()
    refetchTable()
  }, [fetchStats])

  const handleBatchDone = useCallback(() => {
    fetchStats()
    refetchTable()
    setGroupOverrides({})
  }, [fetchStats])

  const columns: Column<Artist>[] = [
    {
      key: 'photo', label: 'Foto',
      render: (artist) => artist.primaryImageUrl
        ? <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} width={36} height={36} className="rounded-full object-cover" />
        : <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-xs font-black text-muted">{artist.nameRomanized[0]}</div>,
    },
    {
      key: 'nameRomanized', label: 'Nome', sortable: true,
      render: (artist) => (
        <div>
          <p className="font-bold text-foreground text-sm">{artist.nameRomanized}</p>
          {artist.nameHangul && <p className="text-xs text-muted">{artist.nameHangul}</p>}
        </div>
      ),
    },
    {
      key: 'musicalGroupName', label: 'Grupo',
      render: (artist) => {
        const override = groupOverrides[artist.id]
        const groupName = override !== undefined ? override.name : artist.musicalGroupName
        if (groupName) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 border border-accent/20 text-accent rounded-full text-xs font-bold">
              <Music2 className="w-3 h-3" />
              {groupName}
            </span>
          )
        }
        const hasSynced = override !== undefined ? true : !!artist.groupSyncAt
        if (hasSynced) {
          return <span className="text-xs text-muted">Solo / não encontrado</span>
        }
        return <span className="text-xs text-amber-500/70 font-semibold">Não sincronizado</span>
      },
    },
    {
      key: 'groupSyncAt', label: 'Último sync',
      render: (artist) => artist.groupSyncAt
        ? <span className="text-xs text-muted">{new Date(artist.groupSyncAt).toLocaleDateString('pt-BR')}</span>
        : <span className="text-xs text-muted">—</span>,
    },
  ]

  return (
    <AdminLayout title="Grupos Musicais dos Artistas">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-3">
            <p className="text-muted text-sm">Sincronize e gerencie vínculos de artistas com grupos K-Pop via MusicBrainz</p>
            <StatsBar stats={stats} filter={filter} onFilter={setFilter} />
          </div>
        </div>

        <BatchSyncPanel onDone={handleBatchDone} />

        <DataTable<Artist>
          columns={columns}
          apiUrl="/api/admin/artists"
          extraParams={filter ? { filter } : undefined}
          searchPlaceholder="Buscar por nome ou grupo..."
          actions={(artist) => (
            <SyncGroupButton artist={artist} onSynced={handleSynced} />
          )}
        />
      </div>
    </AdminLayout>
  )
}
