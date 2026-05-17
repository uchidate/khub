'use client'

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Brain, RefreshCw, Sparkles } from "lucide-react"
import { AdminButton, AdminEmptyState, AdminLayout, SectionHeader } from "@/components/admin"
import type { HomeCluster } from "@/lib/home/home-clusters"
import { useAdminToast } from "@/lib/hooks/useAdminToast"

type HomeClusterInsightsResponse = {
    generatedAt: string
    featuredPost: { id: string; slug: string; title: string } | null
    clusters: HomeCluster[]
    editorialMeta: {
        carousel: EditorialMeta | null
        secondary: EditorialMeta | null
        feed: EditorialMeta
    }
}

type EditorialMeta = {
    requested: number
    selected: number
    maxPerCategory: number
    categoryCounts: Record<string, number>
    relaxedCategoryCap: boolean
}

const SCORE_LABELS = [
    ["base", "Base"],
    ["trend", "Tendência"],
    ["quality", "Qualidade"],
    ["freshness", "Atualidade"],
    ["rank", "Ranking"],
] as const

function formatDateTime(iso: string | null) {
    if (!iso) return "Ainda não calculado"
    return new Date(iso).toLocaleString("pt-BR")
}

function EditorialMetaCard({
    title,
    meta,
}: {
    title: string
    meta: EditorialMeta | null
}) {
    return (
        <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{title}</p>
            {meta ? (
                <>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-full border border-border px-2 py-1 text-muted">
                            {meta.selected}/{meta.requested} selecionados
                        </span>
                        <span className="rounded-full border border-border px-2 py-1 text-muted">
                            até {meta.maxPerCategory} por categoria
                        </span>
                        <span className={`rounded-full px-2 py-1 font-semibold ${meta.relaxedCategoryCap ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                            {meta.relaxedCategoryCap ? "cap relaxado" : "cap preservado"}
                        </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(meta.categoryCounts).map(([category, count]) => (
                            <span key={category} className="rounded-full bg-surface px-2 py-1 text-[11px] text-foreground">
                                {category}: {count}
                            </span>
                        ))}
                    </div>
                </>
            ) : (
                <p className="mt-2 text-[13px] text-muted">Seleção manual ativa neste bloco.</p>
            )}
        </div>
    )
}

export default function AdminHomeClustersPage() {
    const toast = useAdminToast()
    const [data, setData] = useState<HomeClusterInsightsResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)

        try {
            const response = await fetch("/api/admin/home-clusters", { cache: "no-store" })
            if (!response.ok) throw new Error("Falha ao carregar inteligência da home")
            setData(await response.json())
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao carregar inteligência da home")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [toast])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return (
        <AdminLayout title="Inteligência da Home">
            <div className="space-y-5">
                <SectionHeader
                    title="Inteligência da Home"
                    subtitle="Veja quais relações a home está montando agora e quanto cada sinal contribuiu para a escolha."
                    icon={<Brain size={18} />}
                    actions={(
                        <AdminButton onClick={() => fetchData(true)} disabled={refreshing}>
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                            Atualizar
                        </AdminButton>
                    )}
                />

                <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Base editorial atual</p>
                    {data?.featuredPost ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
                            <span className="font-semibold text-foreground">{data.featuredPost.title}</span>
                            <Link href={`/blog/${data.featuredPost.slug}`} className="text-accent hover:underline">
                                Abrir artigo
                            </Link>
                        </div>
                    ) : (
                        <p className="mt-2 text-[13px] text-muted">Nenhum artigo de destaque disponível.</p>
                    )}
                    <p className="mt-2 text-[11px] text-muted">Calculado em {formatDateTime(data?.generatedAt ?? null)}</p>
                </div>

                {data && (
                    <div className="grid gap-4 lg:grid-cols-3">
                        <EditorialMetaCard title="Composição do carrossel" meta={data.editorialMeta.carousel} />
                        <EditorialMetaCard title="Composição dos secundários" meta={data.editorialMeta.secondary} />
                        <EditorialMetaCard title="Composição do feed" meta={data.editorialMeta.feed} />
                    </div>
                )}

                {loading ? (
                    <div className="rounded-xl border border-border bg-background p-6 text-[13px] text-muted">
                        Carregando clusters...
                    </div>
                ) : data && data.clusters.length > 0 ? (
                    <div className="space-y-4">
                        {data.clusters.map((cluster) => (
                            <section key={cluster.key} className="overflow-hidden rounded-xl border border-border bg-background">
                                <div className="border-b border-border bg-surface/50 px-4 py-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{cluster.eyebrow}</p>
                                    <h2 className="mt-0.5 text-[16px] font-bold text-foreground">{cluster.title}</h2>
                                </div>
                                <div className="divide-y divide-border">
                                    {cluster.items.map((item) => (
                                        <div key={`${cluster.key}-${item.href}`} className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(220px,1fr)_auto]">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent">
                                                        <Sparkles size={11} />
                                                        {item.reasonLabel}
                                                    </span>
                                                    <span className="rounded-full border border-border px-2 py-1 text-[10px] font-semibold uppercase text-muted">
                                                        {item.type}
                                                    </span>
                                                    <span className="rounded-full bg-foreground px-2 py-1 text-[10px] font-bold text-background">
                                                        score {item.score}
                                                    </span>
                                                </div>
                                                <Link href={item.href} className="mt-2 block truncate text-[14px] font-semibold text-foreground hover:text-accent">
                                                    {item.title}
                                                </Link>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                                {SCORE_LABELS.map(([key, label]) => (
                                                    <div key={key} className="min-w-[84px] rounded-lg border border-border bg-surface/40 px-3 py-2">
                                                        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">{label}</p>
                                                        <p className="mt-1 text-[14px] font-bold text-foreground">{item.scoreBreakdown[key]}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <AdminEmptyState
                        title="Nenhum cluster ativo"
                        description="Ainda não há relações suficientes para montar blocos inteligentes na home."
                    />
                )}
            </div>
        </AdminLayout>
    )
}
