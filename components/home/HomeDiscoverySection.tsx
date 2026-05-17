import Link from "next/link"
import Image from "next/image"
import { Film, Shuffle, User, Users } from "lucide-react"
import type { HomeCluster } from "@/lib/home/home-clusters"
import { nameToGradient } from "@/lib/utils"
import type { HomeCompositionMode } from "@/lib/home/home-composition"

type RandomArtist = {
    id: string
    slug?: string | null
    nameRomanized: string
    nameHangul?: string | null
    primaryImageUrl?: string | null
}

type RandomGroup = {
    id: string
    slug?: string | null
    name: string
    nameHangul?: string | null
    profileImageUrl?: string | null
}

type RandomProduction = {
    id: string
    slug?: string | null
    titlePt: string
    posterUrl?: string | null
    year?: number | null
}

function MiniEntityCard({
    href,
    label,
    title,
    subtitle,
    imageUrl,
    fallback,
    icon: Icon,
}: {
    href: string
    label: string
    title: string
    subtitle?: string | null
    imageUrl?: string | null
    fallback: string
    icon: React.ElementType
}) {
    return (
        <Link href={href} className="group flex items-center gap-3 rounded-xl border border-border bg-background/95 p-3 hover:border-accent/35 hover:bg-surface transition-colors">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-surface">
                {imageUrl ? (
                    <Image src={imageUrl} alt={title} fill sizes="48px" className="object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white" style={{ background: nameToGradient(fallback) }}>
                        {fallback[0]}
                    </div>
                )}
            </div>
            <div className="min-w-0">
                <div className="mb-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                    <Icon className="h-3 w-3" />
                    {label}
                </div>
                <p className="truncate text-[13px] font-bold text-foreground group-hover:text-accent transition-colors">{title}</p>
                {subtitle && <p className="truncate text-[10px] text-muted">{subtitle}</p>}
            </div>
        </Link>
    )
}

export function HomeDiscoverySection({
    cluster,
    artist,
    group,
    production,
    mode,
}: {
    cluster: HomeCluster | null
    artist: RandomArtist | null
    group: RandomGroup | null
    production: RandomProduction | null
    mode: HomeCompositionMode
}) {
    if (!cluster && !artist && !group && !production) return null
    const discoveryTitle = cluster?.key === "trending"
        ? "Continue pelo que está em alta"
        : mode === "editorial"
            ? "Aprofunde o assunto"
            : "Um ponto de partida novo"
    const [leadClusterItem, ...supportingClusterItems] = cluster?.items ?? []
    const leadDescription = cluster?.key === "trending"
        ? "Um bom próximo passo para seguir o assunto que está movimentando a comunidade."
        : mode === "editorial"
            ? "Uma conexão forte para continuar a leitura por outros ângulos."
            : "Uma conexão forte para continuar explorando o tema em destaque."

    return (
        <section className="bg-background py-6 sm:py-7">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`grid overflow-hidden rounded-2xl border border-accent/10 bg-background shadow-sm ${cluster ? "lg:grid-cols-[1.2fr_0.8fr]" : ""}`}>
                    {cluster && (
                        <div className="border-b border-border lg:border-b-0 lg:border-r">
                            <div className="border-b border-accent/15 bg-surface-editorial px-4 py-3.5 sm:px-6">
                                <div className="border-l-2 border-accent pl-3">
                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-accent">{cluster.eyebrow}</p>
                                <h2 className="mt-0.5 text-[16px] font-bold text-foreground">{cluster.title}</h2>
                                </div>
                            </div>
                            {leadClusterItem && (
                                <Link
                                    href={leadClusterItem.href}
                                    className="group grid gap-3 border-b border-border bg-surface-editorial/55 p-4 transition-colors hover:bg-surface-editorial sm:grid-cols-[132px_minmax(0,1fr)] sm:p-5"
                                >
                                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-surface sm:aspect-square">
                                        {leadClusterItem.imageUrl ? (
                                            <Image src={leadClusterItem.imageUrl} alt={leadClusterItem.title} fill sizes="(max-width: 640px) 100vw, 132px" className="object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted">
                                                {leadClusterItem.title[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 self-center">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">{leadClusterItem.reasonLabel}</p>
                                        <h3 className="mt-1 text-[18px] font-bold leading-tight text-foreground transition-colors group-hover:text-accent">
                                            {leadClusterItem.title}
                                        </h3>
                                        <p className="mt-2 text-[11px] leading-relaxed text-muted">
                                            {leadDescription}
                                        </p>
                                    </div>
                                </Link>
                            )}
                            {supportingClusterItems.length > 0 && (
                                <div className="grid sm:grid-cols-2">
                                    {supportingClusterItems.map((item, index) => (
                                        <Link
                                            key={`${cluster.key}-${item.href}`}
                                            href={item.href}
                                            className={`group flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors
                                                ${index % 2 === 0 ? "sm:border-r sm:border-border" : ""}
                                                ${index < 2 ? "border-b border-border" : ""}
                                            `}
                                        >
                                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-surface">
                                                {item.imageUrl ? (
                                                    <Image src={item.imageUrl} alt={item.title} fill sizes="48px" className="object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted">
                                                        {item.title[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">{item.reasonLabel}</p>
                                                <p className="truncate text-[13px] font-bold text-foreground group-hover:text-accent transition-colors">{item.title}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-surface-tint/70">
                        <div className="flex items-center justify-between border-b border-accent/15 bg-surface-tint px-4 py-3.5 sm:px-6">
                            <div className="border-l-2 border-accent pl-3">
                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-accent">Descobrir</p>
                                <h2 className="mt-0.5 text-[16px] font-bold text-foreground">{discoveryTitle}</h2>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                <Shuffle className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="space-y-2.5 p-4 sm:p-5">
                            {artist && (
                                <MiniEntityCard
                                    href={`/artists/${artist.slug ?? artist.id}`}
                                    label="Artista"
                                    title={artist.nameRomanized}
                                    subtitle={artist.nameHangul}
                                    imageUrl={artist.primaryImageUrl}
                                    fallback={artist.nameRomanized}
                                    icon={User}
                                />
                            )}
                            {group && (
                                <MiniEntityCard
                                    href={`/groups/${group.slug ?? group.id}`}
                                    label="Grupo"
                                    title={group.name}
                                    subtitle={group.nameHangul}
                                    imageUrl={group.profileImageUrl}
                                    fallback={group.name}
                                    icon={Users}
                                />
                            )}
                            {production && (
                                <MiniEntityCard
                                    href={`/productions/${production.slug ?? production.id}`}
                                    label="Produção"
                                    title={production.titlePt}
                                    subtitle={production.year ? String(production.year) : null}
                                    imageUrl={production.posterUrl}
                                    fallback={production.titlePt}
                                    icon={Film}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
