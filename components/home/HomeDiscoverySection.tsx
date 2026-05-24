import Link from "next/link"
import Image from "next/image"
import { Shuffle } from "lucide-react"
import type { HomeCluster } from "@/lib/home/home-clusters"
import { nameToGradient } from "@/lib/utils"
import type { HomeCompositionMode } from "@/lib/home/home-composition"
import { SectionTitleBar } from "@/components/ui/SectionTitleBar"

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

const SUPPORTING_LABELS = ["Leia também", "Contexto", "Próximo passo", "Relacionado"]

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

    const leadDescription = cluster?.key === "trending"
        ? "Um bom próximo passo para seguir o assunto que está movimentando a comunidade."
        : mode === "editorial"
            ? "Uma conexão forte para continuar a leitura por outros ângulos."
            : "Uma conexão forte para continuar explorando o tema em destaque."

    const [leadClusterItem, ...supportingClusterItems] = cluster?.items ?? []

    const entities = [
        artist && { href: `/artists/${artist.slug ?? artist.id}`, label: "Artista", title: artist.nameRomanized, sub: artist.nameHangul, img: artist.primaryImageUrl },
        group && { href: `/groups/${group.slug ?? group.id}`, label: "Grupo", title: group.name, sub: group.nameHangul, img: group.profileImageUrl },
        production && { href: `/productions/${production.slug ?? production.id}`, label: "Produção", title: production.titlePt, sub: production.year ? String(production.year) : null, img: production.posterUrl },
    ].filter(Boolean) as { href: string; label: string; title: string; sub?: string | null; img?: string | null }[]

    return (
        <section className="bg-background overflow-x-clip">
            <div className="page-wrap border-t border-border py-10">
                <div className={`grid gap-10 ${cluster ? "lg:grid-cols-[1.2fr_0.8fr] lg:gap-0 lg:divide-x lg:divide-border/40" : ""}`}>

                    {cluster && (
                        <div className="lg:pr-10">
                            <SectionTitleBar eyebrow={cluster.eyebrow} title={cluster.title} />

                            {leadClusterItem && (
                                <Link
                                    href={leadClusterItem.href}
                                    className="group mb-4 flex items-start gap-4 pb-4 border-b border-border/40 transition-opacity hover:opacity-75"
                                >
                                    <div className="relative w-24 h-[120px] sm:w-28 sm:h-[140px] shrink-0 overflow-hidden" style={{ background: 'repeating-linear-gradient(135deg, #efefef 0 10px, #e6e6e6 10px 20px)' }}>
                                        {leadClusterItem.imageUrl && (
                                            <Image src={leadClusterItem.imageUrl} alt={leadClusterItem.title} fill sizes="112px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-accent">Destaque relacionado</p>
                                        <h3 className="mt-1.5 font-serif text-[22px] font-medium leading-[1.05] tracking-[-0.04em] text-foreground transition-colors group-hover:text-accent sm:text-[26px] break-words">
                                            {leadClusterItem.title}
                                        </h3>
                                        <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-muted">
                                            {leadDescription}
                                        </p>
                                    </div>
                                </Link>
                            )}

                            {supportingClusterItems.length > 0 && (
                                <div className="grid sm:grid-cols-2 sm:gap-x-6">
                                    {supportingClusterItems.map((item, index) => (
                                        <Link
                                            key={`${cluster.key}-${item.href}`}
                                            href={item.href}
                                            className="group flex items-center gap-3 border-b border-border/40 py-3 transition-opacity last:border-b-0 hover:opacity-75"
                                        >
                                            <div className="relative h-8 w-8 shrink-0 overflow-hidden bg-[#efefef]">
                                                {item.imageUrl ? (
                                                    <Image src={item.imageUrl} alt={item.title} fill sizes="32px" className="object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-muted">
                                                        {item.title[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-muted">{SUPPORTING_LABELS[index] ?? "Relacionado"}</p>
                                                <p className="truncate text-[13px] font-semibold text-foreground transition-colors group-hover:text-accent">{item.title}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="lg:pl-10">
                        <SectionTitleBar
                            eyebrow="Descobrir"
                            title={discoveryTitle}
                            action={<div className="flex h-6 w-6 items-center justify-center text-muted">
                                <Shuffle className="h-3.5 w-3.5" />
                            </div>}
                        />
                        <div>
                            {entities.map((entity, i) => (
                                <Link
                                    key={entity.href}
                                    href={entity.href}
                                    className={`group flex items-center gap-4 py-3 transition-opacity hover:opacity-75 ${i < entities.length - 1 ? "border-b border-border/40" : ""}`}
                                >
                                    <div className="relative h-9 w-9 shrink-0 overflow-hidden bg-[#efefef]">
                                        {entity.img ? (
                                            <Image src={entity.img} alt={entity.title} fill sizes="36px" className="object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white" style={{ background: nameToGradient(entity.title) }}>
                                                {entity.title[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">{entity.label}</p>
                                        <p className="truncate text-[14px] font-bold text-foreground transition-colors group-hover:text-accent">{entity.title}</p>
                                        {entity.sub && <p className="truncate font-mono text-[10px] text-muted">{entity.sub}</p>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
