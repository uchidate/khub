'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { Sparkles, Loader2, Play, RefreshCw, AlertCircle, CheckCircle, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
type EnrichmentTarget = 'artist_bio' | 'artist_editorial' | 'artist_curiosidades' | 'production_review' | 'news_editorial_note' | 'news_blog_post'

interface DryRunData {
    counts: Record<EnrichmentTarget, number>
    estimates: Record<EnrichmentTarget, number>
    totalEstimate: number
    budgets: Record<string, {
        budgetUsd: number | null
        spentUsd: number
        remainingUsd: number | null
        exceeded: boolean
        enabled: boolean
    }>
}

interface RunResult {
    target: EnrichmentTarget
    processed: number
    failed: number
    totalCostUsd: number
    failures?: { id: string; error: string }[]
}

const TARGET_LABELS: Record<EnrichmentTarget, string> = {
    artist_bio:           'Bio de Artista',
    artist_editorial:     'Análise Editorial de Artista',
    artist_curiosidades:  'Curiosidades sobre Artista',
    production_review:    'Review Editorial de Produção',
    news_editorial_note:  'Nota Editorial de Notícia',
    news_blog_post:       'Blog Post a partir de Notícia',
}

const TARGET_FEATURE: Record<EnrichmentTarget, string> = {
    artist_bio:           'artist_bio_enrichment',
    artist_editorial:     'artist_editorial',
    artist_curiosidades:  'artist_curiosidades',
    production_review:    'production_review',
    news_editorial_note:  'news_editorial_note',
    news_blog_post:       'blog_post_generation',
}

const TARGET_DESCRIPTION: Record<EnrichmentTarget, string> = {
    artist_bio:           'Gera bio extensa (400+ palavras) em PT-BR para artistas sem bio.',
    artist_editorial:     'Gera análise editorial original sobre carreira e impacto do artista.',
    artist_curiosidades:  'Gera 6 curiosidades autorais sobre cada artista.',
    production_review:    'Gera review editorial + nota + "por que assistir" para doramas/filmes.',
    news_editorial_note:  'Gera nota contextual (100-150 palavras) para notícias traduzidas.',
    news_blog_post:       'Gera blog post completo (500-700 palavras) a partir de notícias publicadas. Salvo como rascunho.',
}

export default function EnrichmentPage() {
    const toast = useAdminToast()
    const [dryRun, setDryRun] = useState<DryRunData | null>(null)
    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState<EnrichmentTarget | null>(null)
    const [results, setResults] = useState<Record<string, RunResult>>({})
    const [limits, setLimits] = useState<Record<EnrichmentTarget, number>>({
        artist_bio:           10,
        artist_editorial:     10,
        artist_curiosidades:  10,
        production_review:    5,
        news_editorial_note:  20,
        news_blog_post:       5,
    })
    const [overwrite, setOverwrite] = useState(false)
    const [expandedFailures, setExpandedFailures] = useState<string | null>(null)

    const fetchDryRun = useCallback(async () => {
        setLoading(true)
        try {
            const r = await fetch('/api/admin/enrichment')
            const data = await r.json()
            setDryRun(data)
        } catch {
            toast.error('Erro ao carregar dados de enriquecimento')
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => { fetchDryRun() }, [fetchDryRun])

    async function runEnrichment(target: EnrichmentTarget) {
        const count = dryRun?.counts[target] ?? 0
        const limit = limits[target]
        const estimate = (dryRun?.estimates[target] ?? 0) * (limit / (count || 1))

        if (!confirm(
            `Gerar "${TARGET_LABELS[target]}" para ${Math.min(limit, count)} itens?\n` +
            `Custo estimado: $${estimate.toFixed(4)}\n\n` +
            `Esta ação não pode ser desfeita.`
        )) return

        setRunning(target)
        try {
            const res = await fetch('/api/admin/enrichment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target, limit, overwrite }),
            })
            const data = await res.json() as RunResult & { error?: string }

            if (!res.ok) {
                toast.error(data.error ?? 'Erro ao executar enriquecimento')
                return
            }

            setResults(prev => ({ ...prev, [target]: data }))
            toast.success(`${data.processed} itens gerados • $${data.totalCostUsd.toFixed(4)}`)
            await fetchDryRun()
        } catch {
            toast.error('Erro ao executar enriquecimento')
        } finally {
            setRunning(null)
        }
    }

    const targets: EnrichmentTarget[] = [
        'artist_bio',
        'artist_editorial',
        'artist_curiosidades',
        'production_review',
        'news_editorial_note',
        'news_blog_post',
    ]

    return (
        <AdminLayout title="Enriquecimento de Conteúdo">
            <div className="space-y-6">

                {/* Intro */}
                <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-white mb-1">Geração de conteúdo editorial via DeepSeek-V3</p>
                            <p className="text-xs text-zinc-400">
                                Gera conteúdo autoral original (bios, análises, reviews, notas) para satisfazer requisitos
                                do Google AdSense (300-500 palavras por página). O custo é rastreado individualmente por feature.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overwrite toggle */}
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={overwrite}
                            onChange={e => setOverwrite(e.target.checked)}
                            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500"
                        />
                        <span className="text-sm text-zinc-300">Sobrescrever conteúdo existente</span>
                    </label>
                    <button
                        onClick={fetchDryRun}
                        disabled={loading}
                        className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>

                {/* Cards por target */}
                {loading && !dryRun ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {targets.map(target => {
                            const count    = dryRun?.counts[target] ?? 0
                            const estimate = dryRun?.estimates[target] ?? 0
                            const feature  = TARGET_FEATURE[target]
                            const budget   = dryRun?.budgets[feature]
                            const result   = results[target]
                            const isRunning = running === target
                            const exceeded  = budget?.exceeded ?? false
                            const limit     = limits[target]
                            const estimateForLimit = count > 0 ? estimate * (Math.min(limit, count) / count) : 0

                            return (
                                <div key={target} className={`border rounded-xl p-4 transition-colors ${
                                    exceeded
                                        ? 'border-red-500/30 bg-red-900/10'
                                        : 'border-white/8 bg-zinc-900/40'
                                }`}>
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-semibold text-white">
                                                    {TARGET_LABELS[target]}
                                                </h3>
                                                {exceeded && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                                                        Budget esgotado
                                                    </span>
                                                )}
                                                {result && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        {result.processed} gerados
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-0.5">{TARGET_DESCRIPTION[target]}</p>
                                        </div>

                                        {/* Stats */}
                                        <div className="shrink-0 text-right">
                                            <div className="text-sm font-bold text-white">{count.toLocaleString()}</div>
                                            <div className="text-[11px] text-zinc-500">itens pendentes</div>
                                        </div>
                                    </div>

                                    {/* Budget bar */}
                                    {budget?.budgetUsd != null && (
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                                                <span>Budget mensal: ${budget.budgetUsd.toFixed(2)}</span>
                                                <span className={exceeded ? 'text-red-400' : 'text-zinc-400'}>
                                                    gasto: ${budget.spentUsd.toFixed(4)} / restante: ${(budget.remainingUsd ?? 0).toFixed(4)}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${exceeded ? 'bg-red-500' : 'bg-purple-500'}`}
                                                    style={{ width: `${Math.min(100, (budget.spentUsd / budget.budgetUsd) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Controls */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-zinc-500">Limite:</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={50}
                                                value={limit}
                                                onChange={e => setLimits(prev => ({ ...prev, [target]: parseInt(e.target.value) || 1 }))}
                                                className="w-16 px-2 py-1 rounded bg-zinc-800 border border-white/8 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>

                                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                                            <DollarSign className="w-3 h-3" />
                                            ~${estimateForLimit.toFixed(4)}
                                        </div>

                                        <button
                                            onClick={() => runEnrichment(target)}
                                            disabled={isRunning || !!running || count === 0 || exceeded}
                                            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors"
                                        >
                                            {isRunning
                                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
                                                : <><Play className="w-3.5 h-3.5" /> Gerar {Math.min(limit, count)}</>
                                            }
                                        </button>
                                    </div>

                                    {/* Failures */}
                                    {result?.failed > 0 && (
                                        <div className="mt-3">
                                            <button
                                                onClick={() => setExpandedFailures(expandedFailures === target ? null : target)}
                                                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
                                            >
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                {result.failed} erro{result.failed !== 1 ? 's' : ''}
                                                {expandedFailures === target ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </button>
                                            {expandedFailures === target && result.failures && (
                                                <div className="mt-2 space-y-1">
                                                    {result.failures.map(f => (
                                                        <div key={f.id} className="text-[10px] font-mono text-red-400/70 bg-red-900/10 rounded px-2 py-1">
                                                            {f.id}: {f.error}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Total estimate */}
                {dryRun && (
                    <div className="border border-white/8 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-zinc-500">Custo total estimado (todos os itens pendentes)</p>
                            <p className="text-sm font-bold text-white mt-0.5">${dryRun.totalEstimate.toFixed(4)}</p>
                        </div>
                        <div className="text-xs text-zinc-600 text-right">
                            <p>Budget configurado em</p>
                            <p className="text-zinc-500">/admin/ai/config</p>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
