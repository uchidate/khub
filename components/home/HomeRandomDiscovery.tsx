import Link from "next/link"
import Image from "next/image"
import { Shuffle, User, Users, Film } from "lucide-react"
import { nameToGradient } from "@/lib/utils"

interface RandomArtist {
    id: string

    slug?: string | null
    nameRomanized: string
    nameHangul?: string | null
    primaryImageUrl?: string | null
}

interface RandomGroup {
    id: string

    slug?: string | null
    name: string
    nameHangul?: string | null
    profileImageUrl?: string | null
}

interface RandomProduction {
    id: string

    slug?: string | null
    titlePt: string
    posterUrl?: string | null
    year?: number | null
}

interface HomeRandomDiscoveryProps {
    artist: RandomArtist | null
    group: RandomGroup | null
    production: RandomProduction | null
}

function DiscoveryCard({
    href,
    label,
    icon: Icon,
    name,
    sub,
    imageUrl,
    fallbackName,
}: {
    href: string
    label: string
    icon: React.ElementType
    name: string
    sub?: string | null
    imageUrl?: string | null
    fallbackName: string
}) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-background p-3 hover:border-accent/40 hover:bg-surface hover:shadow-sm transition-all duration-200"
        >
            <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-border/60">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        sizes="48px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: nameToGradient(fallbackName) }}
                    >
                        <span className="text-lg font-black text-white/80 drop-shadow select-none">
                            {fallbackName[0]}
                        </span>
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon className="w-3 h-3 text-muted flex-shrink-0" />
                    <span className="text-[9px] font-black uppercase tracking-[0.12em] text-muted">{label}</span>
                </div>
                <p className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors">{name}</p>
                {sub && <p className="text-[10px] text-muted mt-0.5 line-clamp-1">{sub}</p>}
            </div>
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    )
}

export function HomeRandomDiscovery({ artist, group, production }: HomeRandomDiscoveryProps) {
    if (!artist && !group && !production) return null

    return (
        <section className="bg-background pt-3 sm:pt-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-border bg-surface/40 px-4 sm:px-6 py-4 sm:py-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Shuffle className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted leading-none">Aleatório do dia</p>
                            <p className="text-sm font-bold text-foreground leading-snug mt-0.5">Descubra algo novo</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                        {artist && (
                            <DiscoveryCard
                                href={`/artists/${artist.slug ?? artist.id}`}
                                label="Artista"
                                icon={User}
                                name={artist.nameRomanized}
                                sub={artist.nameHangul}
                                imageUrl={artist.primaryImageUrl}
                                fallbackName={artist.nameRomanized}
                            />
                        )}
                        {group && (
                            <DiscoveryCard
                                href={`/groups/${group.slug ?? group.id}`}
                                label="Grupo"
                                icon={Users}
                                name={group.name}
                                sub={group.nameHangul}
                                imageUrl={group.profileImageUrl}
                                fallbackName={group.name}
                            />
                        )}
                        {production && (
                            <DiscoveryCard
                                href={`/productions/${production.slug ?? production.id}`}
                                label="Produção"
                                icon={Film}
                                name={production.titlePt}
                                sub={production.year ? String(production.year) : null}
                                imageUrl={production.posterUrl}
                                fallbackName={production.titlePt}
                            />
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
