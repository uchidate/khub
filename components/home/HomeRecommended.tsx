'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { nameToGradient } from "@/lib/utils"

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
            <section className="bg-background pt-4 pb-2 sm:pt-5 sm:pb-3">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border border-border bg-background shadow-sm">
                        <div className="px-4 sm:px-6 lg:px-12 py-4 sm:py-5">
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-accent">Para voce</p>
                            <h3 className="text-[15px] sm:text-[17px] font-bold text-foreground mt-1">Ainda estamos montando suas recomendacoes</h3>
                            <p className="text-[12px] text-muted mt-1.5">Enquanto isso, estes caminhos ajudam voce a descobrir mais rapido.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-4">
                                <Link href="/artists" className="rounded-xl border border-border bg-surface px-3 py-3 hover:bg-background transition-colors text-[12.5px] font-semibold text-foreground">
                                    Explore artistas
                                </Link>
                                <Link href="/productions" className="rounded-xl border border-border bg-surface px-3 py-3 hover:bg-background transition-colors text-[12.5px] font-semibold text-foreground">
                                    Veja producoes populares
                                </Link>
                                <Link href="/profile" className="rounded-xl border border-border bg-surface px-3 py-3 hover:bg-background transition-colors text-[12.5px] font-semibold text-foreground">
                                    Complete seu perfil de interesses
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="bg-background pt-4 pb-2 sm:pt-5 sm:pb-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-border bg-background shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6 lg:px-12">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-accent">
                            Para você
                        </p>
                        <p className="text-[11px] text-muted/60 mt-0.5">
                            {hasFavorites
                                ? 'Artistas em alta que você ainda não segue'
                                : 'Artistas para descobrir'}
                        </p>
                    </div>
                    <Link
                        href="/artists"
                        className="text-[9px] font-semibold text-accent hover:text-foreground transition-colors"
                    >
                        Ver todos →
                    </Link>
                </div>

                {/* Horizontal scroll */}
                <div className="relative">
                    <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-background to-transparent z-10 sm:hidden" />
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-background to-transparent z-10 sm:hidden" />
                    <div
                        className="flex gap-4 px-4 sm:px-6 lg:px-12 py-4 overflow-x-auto scrollbar-hide"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {artists.map((artist, idx) => (
                            <Link
                                key={artist.id}
                                href={`/artists/${artist.slug ?? artist.id}`}
                                className={`group flex flex-col items-center gap-2 min-w-[72px] max-w-[72px] flex-shrink-0 ${idx >= 6 ? 'hidden sm:flex' : ''}`}
                            >
                                {/* Avatar */}
                                <div
                                    className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ring-2 ring-transparent group-hover:ring-accent/40 transition-all duration-200"
                                    style={{ background: nameToGradient(artist.nameRomanized || artist.nameHangul || String(idx)) }}
                                >
                                    {artist.primaryImageUrl ? (
                                        <Image
                                            src={artist.primaryImageUrl}
                                            alt={artist.nameRomanized || ''}
                                            width={56}
                                            height={56}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <span className="text-white text-sm font-bold">
                                            {getInitials(artist.nameRomanized || artist.nameHangul || '?')}
                                        </span>
                                    )}
                                </div>
                                {/* Name */}
                                <div className="text-center min-w-0 w-full">
                                    <p className="text-[11px] font-semibold text-foreground group-hover:text-foreground/80 transition-colors leading-tight line-clamp-2 text-center">
                                        {artist.nameRomanized || artist.nameHangul}
                                    </p>
                                    {artist.roles?.length > 0 && (
                                        <p className="text-[9px] text-muted mt-0.5 text-center">
                                            {formatRole(artist.roles[0], artist.gender)}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}

                        {/* CTA card */}
                        <Link
                            href="/artists"
                            className="hidden sm:flex group flex-col items-center gap-2 min-w-[72px] max-w-[72px] flex-shrink-0"
                        >
                            <div className="w-14 h-14 rounded-full border-2 border-dashed border-border flex items-center justify-center group-hover:border-accent/50 transition-colors">
                                <span className="text-muted group-hover:text-foreground text-lg font-bold transition-colors">+</span>
                            </div>
                            <p className="text-[10px] text-muted group-hover:text-foreground transition-colors text-center leading-tight">
                                Ver mais
                            </p>
                        </Link>
                    </div>
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
