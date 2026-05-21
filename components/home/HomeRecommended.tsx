'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { nameToGradient } from "@/lib/utils"
import { SectionTitleBar } from "@/components/ui/SectionTitleBar"

interface RecommendedArtist {
    id: string
    slug?: string | null
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
    gender?: string | number | null
    agency?: { name: string } | null
}

interface PersonalizedData {
    isLoggedIn: boolean
    hasFavorites: boolean
    recommendedArtists: RecommendedArtist[]
}

const ROLE_LABELS: Record<string, [string, string]> = {
    'ATOR':      ['Ator',      'Atriz'],
    'CANTOR':    ['Cantor',    'Cantora'],
    'RAPPER':    ['Rapper',    'Rapper'],
    'DANÇARINO': ['Dançarino', 'Dançarina'],
    'MODELO':    ['Modelo',    'Modelo'],
    'PRODUTOR':  ['Produtor',  'Produtora'],
}

function formatRole(role: string, gender?: string | number | null): string {
    const key = role.toUpperCase()
    const entry = ROLE_LABELS[key]
    if (!entry) return role
    const isFemale = gender === 1 || gender === '1' || gender === 'FEMALE' || gender === 'female'
    return isFemale ? entry[1] : entry[0]
}

function getInitials(name: string): string {
    return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

function HomeRecommendedInner({ artists, hasFavorites }: { artists: RecommendedArtist[], hasFavorites: boolean }) {
    if (artists.length < 2) {
        return (
            <section className="bg-background">
                <div className="page-wrap border-t border-border py-10">
                    <SectionTitleBar eyebrow="Para você" title="Ainda montando suas recomendações" />
                    <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
                        {[
                            { href: "/artists", label: "Explore artistas" },
                            { href: "/productions", label: "Veja produções populares" },
                            { href: "/profile", label: "Complete seu perfil" },
                        ].map(({ href, label }) => (
                            <Link key={href} href={href} className="py-3 sm:px-5 first:pl-0 last:pr-0 text-[13px] font-semibold text-foreground transition-opacity hover:opacity-60">
                                {label} →
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="bg-background">
            <div className="page-wrap border-t border-border py-10">
                <SectionTitleBar
                    eyebrow="Para você"
                    title={hasFavorites ? 'Artistas em alta que você ainda não segue' : 'Artistas para descobrir'}
                    href="/artists"
                />

                <div className="relative">
                    <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-background to-transparent z-10 sm:hidden" />
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-background to-transparent z-10 sm:hidden" />
                    <div className="flex gap-6 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                        {artists.map((artist, idx) => (
                            <Link
                                key={artist.id}
                                href={`/artists/${artist.slug ?? artist.id}`}
                                className={`group flex flex-col items-center gap-2 min-w-[64px] flex-shrink-0 transition-opacity hover:opacity-70 ${idx >= 6 ? 'hidden sm:flex' : ''}`}
                            >
                                <div
                                    className="h-14 w-14 flex-shrink-0 overflow-hidden flex items-center justify-center"
                                    style={{ background: nameToGradient(artist.nameRomanized || artist.nameHangul || String(idx)) }}
                                >
                                    {artist.primaryImageUrl ? (
                                        <Image
                                            src={artist.primaryImageUrl}
                                            alt={artist.nameRomanized || ''}
                                            width={56}
                                            height={56}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <span className="text-white text-sm font-bold">
                                            {getInitials(artist.nameRomanized || artist.nameHangul || '?')}
                                        </span>
                                    )}
                                </div>
                                <div className="text-center min-w-0 w-full">
                                    <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2 text-center">
                                        {artist.nameRomanized || artist.nameHangul}
                                    </p>
                                    {artist.roles?.length > 0 && (
                                        <p className="font-mono text-[9px] text-muted mt-0.5 text-center">
                                            {formatRole(artist.roles[0], artist.gender)}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}

                        <Link
                            href="/artists"
                            className="hidden sm:flex group flex-col items-center gap-2 min-w-[64px] flex-shrink-0 transition-opacity hover:opacity-60"
                        >
                            <div className="flex h-14 w-14 items-center justify-center border border-dashed border-border/60">
                                <span className="text-muted text-lg font-bold">+</span>
                            </div>
                            <p className="font-mono text-[9px] text-muted text-center leading-tight">
                                Ver mais
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

export function HomeRecommended() {
    const [data, setData] = useState<PersonalizedData | null>(null)

    useEffect(() => {
        fetch('/api/home/personalized')
            .then(r => r.ok ? r.json() : null)
            .then(d => setData(d))
            .catch(() => null)
    }, [])

    if (!data?.isLoggedIn) return null

    return <HomeRecommendedInner artists={data.recommendedArtists} hasFavorites={data.hasFavorites} />
}
