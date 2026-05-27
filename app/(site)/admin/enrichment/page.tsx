'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Film, RefreshCw, ShieldAlert, Sparkles, Users, UsersRound } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminBadge, AdminButton } from '@/components/admin'
import type { EnrichmentPriorityItem } from '@/app/api/admin/enrichment/route'

interface QueueCounts {
    artists: number
    groups: number
    productions: number
}

const QUEUES = [
    {
        key: 'artists' as const,
        label: 'Artistas',
        href: '/admin/artists/enrich',
        icon: Users,
        prompt: 'prompts/idol-enrich.md',
        description: 'Bio, analise editorial, curiosidades e informacoes complementares.',
    },
    {
        key: 'groups' as const,
        label: 'Grupos',
        href: '/admin/groups/enrich',
        icon: UsersRound,
        prompt: 'prompts/group-enrich.md',
        description: 'Perfil do grupo, fandom, cor oficial, redes e conteudo editorial.',
    },
    {
        key: 'productions' as const,
        label: 'Producoes',
        href: '/admin/productions/enrich',
        icon: Film,
        prompt: 'prompts/production-enrich.md',
        description: 'Sinopse, chamada, review, motivos para assistir e curiosidades.',
    },
] as const

export default function EnrichmentPage() {
    const [counts, setCounts] = useState<QueueCounts | null>(null)
    const [staleCounts, setStaleCounts] = useState<QueueCounts | null>(null)
    const [priorityItems, setPriorityItems] = useState<EnrichmentPriorityItem[]>([])
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        setFailed(false)
        try {
            const response = await fetch('/api/admin/enrichment')
            if (!response.ok) throw new Error('failed')
            const data = await response.json() as {
                detailedQueues: QueueCounts
                staleQueues: QueueCounts
                priorityItems: EnrichmentPriorityItem[]
            }
            setCounts(data.detailedQueues)
            setStaleCounts(data.staleQueues)
            setPriorityItems(data.priorityItems ?? [])
        } catch {
            setFailed(true)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { void load() }, [load])

    const total = counts ? Object.values(counts).reduce((sum, value) => sum + value, 0) : null
    const staleTotal = staleCounts ? Object.values(staleCounts).reduce((sum, value) => sum + value, 0) : null

    return (
        <AdminLayout title="Central de enriquecimento" hideTitle>
            <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold text-accent">Curadoria assistida</p>
                        <h1 className="mt-1 text-2xl font-black text-foreground lg:text-3xl">Fila de enriquecimento</h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted">
                            Selecione a entidade, copie o prompt, gere a resposta no Gemini e aplique o JSON revisado.
                        </p>
                    </div>
                    <AdminButton variant="secondary" size="sm" disabled={loading} onClick={load}>
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </AdminButton>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                        <h2 className="text-sm font-bold text-foreground">Geracao automatica por DeepSeek desativada</h2>
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                            O admin nao executa mais enriquecimento editorial automatico. Esta fila preserva a sua revisao manual antes de qualquer gravacao nos campos publicados.
                        </p>
                    </div>
                </div>

                {failed && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-500">
                        Nao foi possivel carregar as filas. Atualize para tentar novamente.
                    </div>
                )}

                <div className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Pendencias para revisar</p>
                            <p className="mt-1 text-xs text-muted">Itens incompletos que podem ser preparados no Gemini.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            <span className="text-2xl font-black tabular-nums text-foreground">{total ?? '-'}</span>
                        </div>
                    </div>
                </div>

                {staleTotal != null && staleTotal > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
                        <div>
                            <p className="text-sm font-bold text-foreground">{staleTotal} pendencia{staleTotal !== 1 ? 's' : ''} em registro{staleTotal !== 1 ? 's' : ''} criado{staleTotal !== 1 ? 's' : ''} ha mais de 7 dias</p>
                            <p className="mt-1 text-[11px] text-muted">
                                Artistas: {staleCounts?.artists ?? 0} · Grupos: {staleCounts?.groups ?? 0} · Producoes: {staleCounts?.productions ?? 0}
                            </p>
                        </div>
                        <AdminBadge variant="warning" shape="pill">Prioridade alta</AdminBadge>
                    </div>
                )}

                <div className="grid gap-3 lg:grid-cols-3">
                    {QUEUES.map(({ key, label, href, icon: Icon, prompt, description }) => {
                        const count = counts?.[key]
                        return (
                            <Link key={key} href={href} className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/35">
                                <div className="flex items-center justify-between gap-3">
                                    <Icon className="h-4 w-4 text-muted transition-colors group-hover:text-accent" />
                                    <AdminBadge variant={count === 0 ? 'success' : 'warning'} shape="pill">
                                        {count ?? '-'}
                                    </AdminBadge>
                                </div>
                                <h2 className="mt-3 text-sm font-bold text-foreground">{label}</h2>
                                <p className="mt-1 text-[11px] leading-relaxed text-muted">{description}</p>
                                <p className="mt-3 text-[10px] font-mono text-muted">{prompt}</p>
                                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent">
                                    Abrir fila <ArrowRight className="h-3 w-3" />
                                </span>
                            </Link>
                        )
                    })}
                </div>

                <section className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
                        <div>
                            <h2 className="text-sm font-bold text-foreground">Comecar por aqui</h2>
                            <p className="mt-1 text-[11px] text-muted">
                                Itens visiveis com mais campos ausentes, priorizados por relevancia dentro de cada catalogo.
                            </p>
                        </div>
                        <AdminBadge variant="info" shape="pill">{priorityItems.length} prioridades</AdminBadge>
                    </div>
                    {priorityItems.length > 0 ? (
                        <div className="space-y-1.5">
                            {priorityItems.map(item => (
                                <Link
                                    key={`${item.type}-${item.id}`}
                                    href={item.href}
                                    className="flex flex-col gap-2 rounded-lg border border-border bg-background/30 px-3 py-2.5 transition-colors hover:border-accent/35 sm:flex-row sm:items-center"
                                >
                                    <AdminBadge variant="neutral" shape="pill" className="w-fit shrink-0">
                                        {item.type === 'artist' ? 'Artista' : item.type === 'group' ? 'Grupo' : 'Producao'}
                                    </AdminBadge>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-foreground">{item.name}</p>
                                        {item.subtitle && <p className="truncate text-[10px] text-muted">{item.subtitle}</p>}
                                    </div>
                                    <p className="text-[10px] text-muted sm:max-w-[42%] sm:text-right">
                                        Falta: {item.missingFields.join(', ')}
                                    </p>
                                    {item.stale && (
                                        <AdminBadge variant="warning" shape="pill" className="w-fit shrink-0">
                                            Criado ha {item.ageDays}d
                                        </AdminBadge>
                                    )}
                                    <ArrowRight className="hidden h-3 w-3 shrink-0 text-accent sm:block" />
                                </Link>
                            ))}
                        </div>
                    ) : !loading && (
                        <p className="py-5 text-center text-xs text-muted">Nenhuma pendencia de curadoria encontrada.</p>
                    )}
                </section>
            </div>
        </AdminLayout>
    )
}
