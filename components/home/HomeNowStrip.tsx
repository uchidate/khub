import Link from "next/link"
import Image from "next/image"
import { Cake, Film, Music2, Users } from "lucide-react"
import { nameToGradient } from "@/lib/utils"

interface NowArtist {
    id: string
    slug?: string | null
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
}

interface NowGroup {
    id: string
    slug?: string | null
    name: string
    nameHangul: string | null
    profileImageUrl: string | null
}

interface NowProduction {
    id?: string
    title: string
    posterUrl: string | null
    year: number | null
}

interface NowBirthday {
    id: string
    slug: string | null
    nameRomanized: string
    primaryImageUrl: string | null
    age: number
}

function Avatar({
    src,
    alt,
    fallback,
}: {
    src: string | null
    alt: string
    fallback: string
}) {
    return (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-surface">
            {src ? (
                <Image src={src} alt={alt} fill sizes="48px" className="object-cover" />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white" style={{ background: nameToGradient(fallback) }}>
                    {fallback[0]}
                </div>
            )}
        </div>
    )
}

function NowCard({
    href,
    eyebrow,
    title,
    detail,
    icon: Icon,
    image,
}: {
    href: string
    eyebrow: string
    title: string
    detail: string
    icon: React.ElementType
    image: React.ReactNode
}) {
    return (
        <Link href={href} className="group flex min-h-[84px] items-center gap-3 px-4 py-3 hover:bg-surface transition-colors">
            {image}
            <div className="min-w-0">
                <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                    <Icon className="h-3 w-3" />
                    {eyebrow}
                </div>
                <p className="truncate text-[13px] font-bold text-foreground group-hover:text-accent transition-colors">{title}</p>
                <p className="truncate text-[10px] text-muted">{detail}</p>
            </div>
        </Link>
    )
}

export function HomeNowStrip({
    artist,
    group,
    production,
    birthday,
}: {
    artist: NowArtist | null
    group: NowGroup | null
    production: NowProduction | null
    birthday: NowBirthday | null
}) {
    if (!artist && !group && !production && !birthday) return null

    return (
        <section className="bg-background pb-4 sm:pb-5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                    <div className="border-b border-border px-4 py-3">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Em movimento</p>
                        <p className="mt-0.5 text-[15px] sm:text-[17px] font-bold text-foreground">O que merece sua atenção hoje</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:[&>*:nth-child(n+3)]:border-t lg:[&>*:nth-child(n+3)]:border-t-0 lg:divide-x divide-border">
                        {artist && (
                            <NowCard
                                href={`/artists/${artist.slug ?? artist.id}`}
                                eyebrow="Artista em alta"
                                title={artist.nameRomanized}
                                detail={artist.nameHangul ?? "Ranking da semana"}
                                icon={Music2}
                                image={<Avatar src={artist.primaryImageUrl} alt={artist.nameRomanized} fallback={artist.nameRomanized} />}
                            />
                        )}
                        {group && (
                            <NowCard
                                href={`/groups/${group.slug ?? group.id}`}
                                eyebrow="Grupo em alta"
                                title={group.name}
                                detail={group.nameHangul ?? "Tendência da comunidade"}
                                icon={Users}
                                image={<Avatar src={group.profileImageUrl} alt={group.name} fallback={group.name} />}
                            />
                        )}
                        {production && (
                            <NowCard
                                href={production.id ? `/productions/${production.id}` : "/productions"}
                                eyebrow="Para assistir"
                                title={production.title}
                                detail={production.year ? String(production.year) : "Em destaque"}
                                icon={Film}
                                image={<Avatar src={production.posterUrl} alt={production.title} fallback={production.title} />}
                            />
                        )}
                        {birthday && (
                            <NowCard
                                href={`/artists/${birthday.slug ?? birthday.id}`}
                                eyebrow="Aniversário"
                                title={birthday.nameRomanized}
                                detail={`${birthday.age} anos hoje`}
                                icon={Cake}
                                image={<Avatar src={birthday.primaryImageUrl} alt={birthday.nameRomanized} fallback={birthday.nameRomanized} />}
                            />
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
