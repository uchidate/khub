'use client'

import { useEffect, useState, useCallback } from 'react'
import {
    RefreshCw, Server, Clock, Loader2, Zap, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ConfirmDialog, AdminEmptyState } from '@/components/admin'

interface AppStatus {
    uuid: string
    name: string
    status: string
    fqdn: string | null
    updated_at: string
}

interface ScheduledTask {
    uuid: string
    name: string
    command: string
    frequency: string
    enabled: boolean
    timeout: number
    last_run_at?: string | null
    last_run_status?: string | null
}

type Env = 'production' | 'staging'

const ENV_LABELS: Record<Env, { label: string; color: string; dot: string }> = {
    production: { label: 'Production', color: 'text-green-400', dot: 'bg-green-400' },
    staging:    { label: 'Staging',    color: 'text-yellow-400', dot: 'bg-yellow-400' },
}

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase()
    if (s === 'running') return (
        <span className="flex items-center gap-1 text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Running
        </span>
    )
    if (s === 'stopped' || s === 'exited') return (
        <span className="flex items-center gap-1 text-xs text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Stopped
        </span>
    )
    return (
        <span className="flex items-center gap-1 text-xs text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
            {status || 'Unknown'}
        </span>
    )
}

export default function InfrastructurePage() {
    const [env, setEnv] = useState<Env>('production')
    const [app, setApp] = useState<AppStatus | null>(null)
    const [tasks, setTasks] = useState<ScheduledTask[]>([])
    const [loading, setLoading] = useState(true)
    const [deploying, setDeploying] = useState(false)
    const [confirmDeploy, setConfirmDeploy] = useState(false)
    const [togglingTask, setTogglingTask] = useState<string | null>(null)
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
    const [loadError, setLoadError] = useState<{ error: string; hint?: string } | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setLoadError(null)
        try {
            const res = await fetch(`/api/admin/infrastructure?env=${env}`)
            const data = await res.json()
            if (!res.ok) {
                setLoadError({ error: data.error ?? 'Erro desconhecido', hint: data.hint })
                return
            }
            setApp(data.app)
            setTasks(data.tasks)
            setLastRefresh(new Date())
        } catch (err) {
            setLoadError({ error: err instanceof Error ? err.message : 'Falha na requisição' })
        } finally {
            setLoading(false)
        }
    }, [env])

    useEffect(() => { load() }, [load])

    async function handleDeploy() {
        setDeploying(true)
        try {
            await fetch('/api/admin/infrastructure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deploy', env }),
            })
            setTimeout(load, 3000)
        } finally {
            setDeploying(false)
        }
    }

    async function handleToggleTask(task: ScheduledTask) {
        setTogglingTask(task.uuid)
        try {
            const res = await fetch('/api/admin/infrastructure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle-task',
                    env,
                    taskUuid: task.uuid,
                    enabled: !task.enabled,
                }),
            })
            if (res.ok) {
                setTasks(prev => prev.map(t =>
                    t.uuid === task.uuid ? { ...t, enabled: !t.enabled } : t
                ))
            }
        } finally {
            setTogglingTask(null)
        }
    }

    const envConfig = ENV_LABELS[env]

    return (
        <AdminLayout title="Infraestrutura" subtitle="Status de deploy, scheduled tasks e configurações de ambiente">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                            <Server className="w-6 h-6 text-pink-400" />
                            Infraestrutura
                        </h1>
                        <p className="text-xs text-muted mt-1">
                            Status e agendamentos — gerenciado pelo Coolify
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Env switcher */}
                        <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                            {(['production', 'staging'] as Env[]).map(e => (
                                <button
                                    key={e}
                                    onClick={() => setEnv(e)}
                                    className={`px-3 py-1.5 font-medium transition-colors ${
                                        env === e
                                            ? 'bg-surface-hover text-foreground'
                                            : 'text-muted hover:text-foreground'
                                    }`}
                                >
                                    {ENV_LABELS[e].label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={load}
                            disabled={loading}
                            className="p-2 rounded-lg border border-border text-muted hover:text-foreground transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Erro de conexão */}
                {loadError && (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/8 p-4 space-y-1">
                        <p className="text-sm font-bold text-red-400">Erro ao conectar com o Coolify</p>
                        <p className="text-xs text-red-300/80">{loadError.error}</p>
                        {loadError.hint && (
                            <p className="text-xs text-muted mt-2">{loadError.hint}</p>
                        )}
                    </div>
                )}

                {/* App Status */}
                {!loadError && (<div className="bg-surface border border-border rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${envConfig.dot}`} />
                            <div>
                                <p className={`text-sm font-bold ${envConfig.color}`}>{envConfig.label}</p>
                                <p className="text-xs text-muted">{app?.fqdn || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {app && <StatusBadge status={app.status} />}
                            <button
                                onClick={() => setConfirmDeploy(true)}
                                disabled={deploying}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-xs font-bold rounded-lg transition-colors"
                            >
                                {deploying
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Zap className="w-3.5 h-3.5" />
                                }
                                Deploy
                            </button>
                        </div>
                    </div>
                    {lastRefresh && (
                        <p className="text-[10px] text-muted mt-3">
                            Atualizado às {lastRefresh.toLocaleTimeString('pt-BR')}
                        </p>
                    )}
                </div>)}

                {/* Scheduled Tasks */}
                {!loadError &&
                <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Scheduled Tasks ({tasks.length})
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-5 h-5 animate-spin text-muted" />
                        </div>
                    ) : tasks.length === 0 ? (
                        <AdminEmptyState title="Nenhuma scheduled task configurada" size="sm" />
                    ) : (
                        <div className="space-y-2">
                            {tasks.map(task => (
                                <div
                                    key={task.uuid}
                                    className={`bg-surface border rounded-xl p-4 transition-colors ${
                                        task.enabled ? 'border-border' : 'border-border opacity-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-foreground">{task.name}</span>
                                                <span className="text-[10px] font-mono text-pink-400 bg-pink-400/10 px-1.5 py-0.5 rounded">
                                                    {task.frequency}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted font-mono truncate">{task.command}</p>
                                            {task.last_run_at && (
                                                <p className="text-[10px] text-muted mt-1">
                                                    Último run: {new Date(task.last_run_at).toLocaleString('pt-BR')}
                                                    {task.last_run_status && (
                                                        <span className={`ml-1 ${task.last_run_status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                                            ({task.last_run_status})
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleToggleTask(task)}
                                            disabled={togglingTask === task.uuid}
                                            className="shrink-0 text-muted hover:text-foreground transition-colors"
                                            title={task.enabled ? 'Desativar' : 'Ativar'}
                                        >
                                            {togglingTask === task.uuid
                                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                                : task.enabled
                                                    ? <ToggleRight className="w-5 h-5 text-green-400" />
                                                    : <ToggleLeft className="w-5 h-5" />
                                            }
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>}
            </div>
            <ConfirmDialog
                open={confirmDeploy}
                title={`Deploy ${env}?`}
                description="Isso vai iniciar um novo deploy na plataforma Coolify."
                confirmLabel="Deploy"
                variant="default"
                onConfirm={() => { setConfirmDeploy(false); handleDeploy() }}
                onCancel={() => setConfirmDeploy(false)}
            />
        </AdminLayout>
    )
}
