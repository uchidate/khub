import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { getAiSummary, getAiCostByDay, getAiRecentLogs, getMonthlySpend } from '@/lib/services/ai-stats-service'
import { getAllAiConfigs, FEATURE_LABELS } from '@/lib/services/ai-config-service'
import AiProviderStatus from './_components/AiProviderStatus'
import AiLogsTable from './_components/AiLogsTable'

export const dynamic = 'force-dynamic'

function fmtCost(v: number) {
    if (v === 0) return '$0.00'
    if (v < 0.001) return `$${(v * 1000).toFixed(3)}m`
    return `$${v.toFixed(4)}`
}

function fmtMs(ms: number) {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
    return `${ms}ms`
}

const emptySummary: ReturnType<typeof getAiSummary> extends Promise<infer T> ? T : never = {
    totalCalls: 0, successCalls: 0, errorCalls: 0, successRate: 100,
    totalCostUsd: 0, avgLatencyMs: 0,
    callsByProvider: {}, callsByFeature: {}, costByProvider: {},
}

export default async function AiDashboardPage() {
    console.log('[AI Dashboard] render start')
    const session = await getServerSession(authOptions)
    if (session?.user?.role?.toLowerCase() !== 'admin') redirect('/admin')

    let summary = emptySummary
    let costByDay: Awaited<ReturnType<typeof getAiCostByDay>> = []
    let monthlySpend: Awaited<ReturnType<typeof getMonthlySpend>> = { byProvider: {}, total: 0 }
    let configs: Awaited<ReturnType<typeof getAllAiConfigs>> = []
    let logsResult: Awaited<ReturnType<typeof getAiRecentLogs>> = { logs: [], total: 0, pages: 0 }
    let loadError: string | null = null

    try {
        ;[summary, costByDay, monthlySpend, configs, logsResult] = await Promise.all([
            getAiSummary(30),
            getAiCostByDay(14),
            getMonthlySpend(),
            getAllAiConfigs(),
            getAiRecentLogs({ limit: 25 }),
        ])
        console.log('[AI Dashboard] data loaded — logs:', logsResult.logs.length, 'costByDay:', costByDay.length)
    } catch (err: unknown) {
        loadError = err instanceof Error ? err.message : String(err)
        console.error('[AI Dashboard] LOAD ERROR:', loadError, err instanceof Error ? err.stack : '')
    }

    let maxCost = 0.0001
    let maxCalls = 1
    try {
        maxCost  = Math.max(...costByDay.map(d => d.cost), 0.0001)
        maxCalls = Math.max(...costByDay.map(d => d.calls), 1)
    } catch (err: unknown) {
        console.error('[AI Dashboard] maxCost/maxCalls error:', err)
    }

    const providerColors: Record<string, string> = {
        deepseek: 'bg-blue-500',
        ollama:   'bg-purple-500',
    }

    const featureEntries = Object.entries(summary.callsByFeature)
        .sort((a, b) => b[1] - a[1])
    const totalFeatureCalls = featureEntries.reduce((s, [, c]) => s + c, 0) || 1

    const budgetByFeature = Object.fromEntries(configs.map(c => [c.feature, c.monthlyBudgetUsd]))
    console.log('[AI Dashboard] render JSX start')

    return (
        <AdminLayout title="Dashboard de IA">
            <div className="space-y-6">
                {loadError && (
                    <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
                        <p className="text-xs font-bold text-red-400 mb-1">Erro ao carregar dados do dashboard</p>
                        <p className="text-xs text-red-500/80 font-mono break-all">{loadError}</p>
                        <p className="text-xs text-zinc-600 mt-2">Verifique se as tabelas <code>ai_usage_log</code> e <code>ai_config</code> existem no banco. Execute <code>prisma migrate deploy</code> se necessário.</p>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">Dashboard de IA</h1>
                        <p className="text-xs text-zinc-500 mt-0.5">Últimos 30 dias · atualizado em tempo real</p>
                    </div>
                    <a
                        href="/admin/ai/config"
                        className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 border border-white/10 hover:border-white/20 hover:text-zinc-200 transition-colors"
                    >
                        Configurar providers →
                    </a>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-zinc-900 border border-white/8 rounded-xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Chamadas</p>
                        <p className="text-2xl font-bold text-white tabular-nums">{summary.totalCalls.toLocaleString()}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">{summary.errorCalls} erro{summary.errorCalls !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="bg-zinc-900 border border-white/8 rounded-xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Taxa de sucesso</p>
                        <p className={`text-2xl font-bold tabular-nums ${summary.successRate >= 90 ? 'text-emerald-400' : summary.successRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {summary.successRate}%
                        </p>
                        <p className="text-xs text-zinc-600 mt-0.5">{summary.successCalls} sucessos</p>
                    </div>
                    <div className="bg-zinc-900 border border-white/8 rounded-xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Custo total</p>
                        <p className="text-2xl font-bold text-white tabular-nums">{fmtCost(summary.totalCostUsd)}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">mês: {fmtCost(monthlySpend.total)}</p>
                    </div>
                    <div className="bg-zinc-900 border border-white/8 rounded-xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Latência média</p>
                        <p className="text-2xl font-bold text-white tabular-nums">{fmtMs(summary.avgLatencyMs)}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">por chamada</p>
                    </div>
                </div>

                {/* Provider health (live) */}
                <AiProviderStatus />

                {/* Charts row */}
                <div className="grid lg:grid-cols-3 gap-4">
                    {/* Cost chart */}
                    <div className="lg:col-span-2 bg-zinc-900 border border-white/8 rounded-xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Custo — 14 dias</p>
                        {costByDay.length === 0 ? (
                            <p className="text-xs text-zinc-600 py-8 text-center">Nenhum dado ainda</p>
                        ) : (
                            <div className="flex items-end gap-1 h-32">
                                {costByDay.map(d => {
                                    const heightPct = (d.cost / maxCost) * 100
                                    const label     = d.date.slice(5) // 'MM-DD'
                                    return (
                                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                                            <div className="relative w-full flex flex-col items-center">
                                                <div
                                                    className="w-full bg-purple-500/70 hover:bg-purple-400 rounded-t transition-colors cursor-default"
                                                    style={{ height: `${Math.max(heightPct, 2)}%`, minHeight: '2px', maxHeight: '112px' }}
                                                    title={`${d.date}\n${fmtCost(d.cost)} · ${d.calls} chamadas`}
                                                />
                                            </div>
                                            <span className="text-[8px] text-zinc-700 group-hover:text-zinc-500 transition-colors">{label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        {/* Calls sub-chart */}
                        {costByDay.length > 0 && (
                            <div className="flex items-end gap-1 h-10 mt-2 border-t border-white/6 pt-2">
                                {costByDay.map(d => (
                                    <div key={d.date} className="flex-1 flex flex-col items-center">
                                        <div
                                            className="w-full bg-zinc-700/60 hover:bg-zinc-600 rounded-t transition-colors cursor-default"
                                            style={{ height: `${Math.max((d.calls / maxCalls) * 100, 4)}%`, minHeight: '2px', maxHeight: '32px' }}
                                            title={`${d.calls} chamadas`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-[9px] text-zinc-700 mt-1">barras cinzas = número de chamadas</p>
                    </div>

                    {/* Feature breakdown */}
                    <div className="bg-zinc-900 border border-white/8 rounded-xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Por feature</p>
                        {featureEntries.length === 0 ? (
                            <p className="text-xs text-zinc-600 py-8 text-center">Nenhum dado ainda</p>
                        ) : (
                            <div className="space-y-3">
                                {featureEntries.map(([feat, count]) => {
                                    const pct    = Math.round((count / totalFeatureCalls) * 100)
                                    const label  = FEATURE_LABELS[feat as keyof typeof FEATURE_LABELS] ?? feat
                                    const budget = budgetByFeature[feat]
                                    const spend  = summary.totalCostUsd * (count / totalFeatureCalls)
                                    const over   = budget != null && spend > budget
                                    return (
                                        <div key={feat}>
                                            <div className="flex justify-between text-[10px] mb-1">
                                                <span className={`${over ? 'text-red-400' : 'text-zinc-400'} truncate mr-2`}>{label}</span>
                                                <span className="text-zinc-600 shrink-0">{count} ({pct}%)</span>
                                            </div>
                                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-purple-500/70'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Provider cost breakdown */}
                <div className="bg-zinc-900 border border-white/8 rounded-xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Custo por provider (30d)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {Object.entries(summary.callsByProvider).map(([prov, calls]) => {
                            const cost  = summary.costByProvider[prov] ?? 0
                            const color = providerColors[prov] ?? 'bg-zinc-600'
                            return (
                                <div key={prov} className="bg-zinc-800/60 rounded-lg p-3 border border-white/6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-2 h-2 rounded-full ${color}`} />
                                        <span className="text-xs font-semibold text-zinc-300 capitalize">{prov}</span>
                                    </div>
                                    <p className="text-sm font-bold text-white tabular-nums">{fmtCost(cost)}</p>
                                    <p className="text-[10px] text-zinc-600">{calls} chamadas</p>
                                </div>
                            )
                        })}
                        {Object.keys(summary.callsByProvider).length === 0 && (
                            <p className="col-span-full text-xs text-zinc-600 py-2">Nenhuma chamada registrada ainda</p>
                        )}
                    </div>
                </div>

                {/* Recent logs */}
                <AiLogsTable initialLogs={logsResult.logs.map(l => ({
                    id:         l.id,
                    provider:   l.provider,
                    model:      l.model,
                    feature:    l.feature,
                    tokensIn:   l.tokensIn,
                    tokensOut:  l.tokensOut,
                    cost:       l.cost,
                    durationMs: l.durationMs,
                    status:     l.status,
                    errorMsg:   l.errorMsg,
                    createdAt:  new Date(l.createdAt as unknown as string).toISOString(),
                }))} />
            </div>
        </AdminLayout>
    )
}
