import Link from "next/link"
import Image from "next/image"
import { Cake, Film, Music2, Users } from "lucide-react"
import { nameToGradient } from "@/lib/utils"
import type { HomeCompositionMode } from "@/lib/home/home-composition"
import { SectionTitleBar } from "@/components/ui/SectionTitleBar"

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
    slug?: string | null
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

export function HomeNowStrip({
    artist,
    group,
    production,
    birthday,
    mode,
}: {
    artist: NowArtist | null
    group: NowGroup | null
    production: NowProduction | null
    birthday: NowBirthday | null
    mode: HomeCompositionMode
}) {
    if (!artist && !group && !production && !birthday) return null

    const heading = mode === "watch"
        ? "O que está ganhando tração agora"
        : mode === "editorial"
            ? "Os nomes por trás das conversas de hoje"
            : "O que merece sua atenção hoje"

    const items = [
        artist && { key: "artist", href: `/artists/${artist.slug ?? artist.id}`, eyebrow: "Artista em alta", title: artist.nameRomanized, detail: artist.nameHangul ?? "Ranking da semana", icon: Music2, imageUrl: artist.primaryImageUrl, fallback: artist.nameRomanized },
        group && { key: "group", href: `/groups/${group.slug ?? group.id}`, eyebrow: "Grupo em alta", title: group.name, detail: group.nameHangul ?? "Tendência", icon: Users, imageUrl: group.profileImageUrl, fallback: group.name },
        production && { key: "prod", href: production.id ? `/productions/${production.slug ?? production.id}` : "/productions", eyebrow: "Para assistir", title: production.title, detail: production.year ? String(production.year) : "Em destaque", icon: Film, imageUrl: production.posterUrl, fallback: production.title },
        birthday && { key: "bday", href: `/artists/${birthday.slug ?? birthday.id}`, eyebrow: "Aniversário", title: birthday.nameRomanized, detail: `${birthday.age} anos hoje`, icon: Cake, imageUrl: birthday.primaryImageUrl, fallback: birthday.nameRomanized },
    ].filter(Boolean) as { key: string; href: string; eyebrow: string; title: string; detail: string; icon: React.ElementType; imageUrl: string | null; fallback: string }[]

    return (
        <section className="bg-background">
            <div className="page-wrap border-t border-border py-10">
                <SectionTitleBar
                    eyebrow="Em movimento"
                    title={heading}
                    action={<span className="font-mono text-[10px] text-accent">● ao vivo</span>}
                />
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border/40">
                    {items.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                className="group grid grid-cols-[36px_minmax(0,1fr)] items-center gap-4 py-3 transition-opacity hover:opacity-75 border-b border-border/40 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0 lg:px-6 lg:first:pl-0 lg:last:pr-0"
                            >
                                <div className="relative h-9 w-9 shrink-0 overflow-hidden bg-surface">
                                    {item.imageUrl ? (
                                        <Image src={item.imageUrl} alt={item.title} fill sizes="36px" className="object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white" style={{ background: nameToGradient(item.fallback) }}>
                                            {item.fallback[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="mb-0.5 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                                        <Icon className="h-3 w-3 shrink-0" />
                                        {item.eyebrow}
                                    </div>
                                    <p className="truncate text-[14px] font-bold text-foreground transition-colors group-hover:text-accent">{item.title}</p>
                                    <p className="truncate font-mono text-[10px] text-muted">{item.detail}</p>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
