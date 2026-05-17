import Link from "next/link"
import Image from "next/image"
import { Film, Shuffle, User, Users } from "lucide-react"
import type { HomeCluster } from "@/lib/home/home-clusters"
import { nameToGradient } from "@/lib/utils"

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
        <Link href={href} className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3 hover:border-accent/35 hover:bg-surface transition-colors">
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
}: {
    cluster: HomeCluster | null
    artist: RandomArtist | null
    group: RandomGroup | null
    production: RandomProduction | null
}) {
    if (!cluster && !artist && !group && !production) return null

    return (
        <section className="bg-background py-4 sm:py-5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`grid overflow-hidden rounded-2xl border border-border bg-background shadow-[0_1px_0_rgba(15,23,42,0.04)] ${cluster ? "lg:grid-cols-[1.2fr_0.8fr]" : ""}`}>
                    {cluster && (
                        <div className="border-b border-border lg:border-b-0 lg:border-r">
                            <div className="border-b border-border px-4 py-3 sm:px-6">
                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">{cluster.eyebrow}</p>
                                <h2 className="mt-0.5 text-[16px] font-bold text-foreground">{cluster.title}</h2>
                            </div>
                            <div className="grid sm:grid-cols-2">
                                {cluster.items.map((item, index) => (
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
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Descobrir</p>
                                <h2 className="mt-0.5 text-[16px] font-bold text-foreground">Um ponto de partida novo</h2>
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
