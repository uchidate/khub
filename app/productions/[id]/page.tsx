import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { cache } from "react"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { FavoriteButton } from "@/components/ui/FavoriteButton"
import { WatchButton } from "@/components/ui/WatchButton"
import { ReportButton } from "@/components/ui/ReportButton"
import { AdminQuickEdit } from "@/components/ui/AdminQuickEdit"
import { TrailerModal } from "@/components/features/TrailerModal"
import { ViewTracker } from "@/components/features/ViewTracker"
import { JsonLd } from "@/components/seo/JsonLd"
import { Film } from "lucide-react"
import type { Metadata } from "next"

const BASE_URL = 'https://www.hallyuhub.com.br'

// ISR: página cacheada 1h no servidor — revalidada sob demanda via revalidatePath no admin
export const revalidate = 3600

// React.cache deduplica a query dentro do mesmo render pass (generateMetadata + page component)
const getProduction = cache(async (id: string) => {
    return prisma.production.findUnique({
        where: { id },
        include: {
            artists: {
                where: { artist: { flaggedAsNonKorean: false } },
                include: { artist: true },
                orderBy: [{ castOrder: 'asc' }, { role: 'asc' }],
            }
        }
    })
})

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const params = await props.params;
    const production = await getProduction(params.id)

    if (!production) {
        return {
            title: 'Produção não encontrada - HallyuHub',
            description: 'Esta produção não foi encontrada em nossa base de dados.'
        }
    }

    // Conteúdo oculto por faixa etária (18+ ou não classificado) não deve ser indexado
    const SAFE_RATINGS = ['L', '10', '12', '14', '16']
    if (!production.ageRating || !SAFE_RATINGS.includes(production.ageRating)) {
        return {
            title: production.titlePt,
            robots: { index: false, follow: false },
        }
    }

    const description = production.synopsis || `${production.titlePt} (${production.titleKr}) - ${production.type} ${production.year ? `de ${production.year}` : ''}`
    const castNames = production.artists.slice(0, 3).map(a => a.artist.nameRomanized).join(', ')
    const fullDescription = production.synopsis
        ? `${production.synopsis.slice(0, 120)}...${castNames ? ` Elenco: ${castNames}` : ''}`
        : description

    return {
        title: `${production.titlePt} (${production.titleKr}) - HallyuHub`,
        description: fullDescription.slice(0, 160),
        alternates: {
            canonical: `${BASE_URL}/productions/${params.id}`,
        },
        openGraph: {
            title: `${production.titlePt} - HallyuHub`,
            description: fullDescription.slice(0, 160),
            images: production.imageUrl ? [{
                url: production.imageUrl,
                width: 1200,
                height: 630,
                alt: production.titlePt
            }] : [],
            type: 'video.movie',
            url: `${BASE_URL}/productions/${params.id}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${production.titlePt} - HallyuHub`,
            description: fullDescription.slice(0, 160),
            images: production.imageUrl ? [production.imageUrl] : []
        }
    }
}

export default async function ProductionDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const production = await getProduction(params.id)

    if (!production) {
        notFound()
    }

    const tags = (production.tags || []) as string[]
    const artistIds = production.artists.map(a => a.artist.id)

    const relatedSelect = {
        id: true, titlePt: true, titleKr: true, type: true,
        year: true, imageUrl: true, backdropUrl: true, voteAverage: true,
    } as const

    // Priority 1: shared cast (strongest signal — "more with this actor")
    const byArtist = artistIds.length > 0
        ? await prisma.production.findMany({
            where: {
                id: { not: production.id },
                flaggedAsNonKorean: false,
                artists: { some: { artistId: { in: artistIds } } },
            },
            orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
            take: 6,
            select: relatedSelect,
        })
        : []

    // Priority 2: shared tags (fill remaining slots)
    const byArtistIds = byArtist.map(p => p.id)
    const needByTag = 6 - byArtist.length
    const byTag = tags.length > 0 && needByTag > 0
        ? await prisma.production.findMany({
            where: {
                id: { notIn: [production.id, ...byArtistIds] },
                flaggedAsNonKorean: false,
                tags: { hasSome: tags },
            },
            orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
            take: needByTag,
            select: relatedSelect,
        })
        : []

    // Priority 3: same type (fallback)
    const usedIds = [production.id, ...byArtistIds, ...byTag.map(p => p.id)]
    const needByType = 6 - byArtist.length - byTag.length
    const byType = needByType > 0
        ? await prisma.production.findMany({
            where: {
                id: { notIn: usedIds },
                flaggedAsNonKorean: false,
                type: production.type,
            },
            orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
            take: needByType,
            select: relatedSelect,
        })
        : []

    const relatedProductions = [...byArtist, ...byTag, ...byType]

    const galleryUrls = (production.galleryUrls as string[] | null) || []

    const heroImageUrl = production.imageUrl || production.backdropUrl

    function formatRuntime(minutes: number | null): string | null {
        if (!minutes) return null
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        if (h === 0) return `${m}min`
        return m === 0 ? `${h}h` : `${h}h ${m}min`
    }

    const isMovie = production.type === 'MOVIE' || production.type === 'FILM'
    const schemaType = isMovie ? 'Movie' : 'TVSeries'
    const castActors = production.artists.slice(0, 10).map(a => ({
        "@type": "Person",
        "name": a.artist.nameRomanized,
        "url": `${BASE_URL}/artists/${a.artist.id}`,
    }))

    return (
        <div className="min-h-screen">
            <ViewTracker productionId={production.id} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": schemaType,
                "name": production.titlePt,
                "alternateName": production.titleKr ?? undefined,
                "description": production.synopsis?.slice(0, 300) ?? undefined,
                "image": production.imageUrl ?? undefined,
                "url": `${BASE_URL}/productions/${production.id}`,
                "inLanguage": "ko",
                "countryOfOrigin": { "@type": "Country", "name": "Korea, Republic of" },
                ...(production.year ? { "datePublished": String(production.year) } : {}),
                ...(castActors.length ? { "actor": castActors } : {}),
                ...(production.tags?.length ? { "genre": production.tags } : {}),
            }} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Produções", "item": `${BASE_URL}/productions` },
                    { "@type": "ListItem", "position": 2, "name": production.titlePt, "item": `${BASE_URL}/productions/${production.id}` },
                ],
            }} />
            {/* Cinematic Hero — flexbox layout to prevent overlap on small viewports */}
            <div className="relative min-h-[88vh] md:min-h-[65vh] bg-black flex flex-col overflow-hidden">
                {/* Background image (contained, never clips content) */}
                <div className="absolute inset-0">
                    {heroImageUrl ? (
                        <Image src={heroImageUrl} alt={production.titlePt} fill priority sizes="100vw" className="object-cover" />
                    ) : (
                        <>
                            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
                            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl" />
                        </>
                    )}
                    <div className="absolute inset-0 hero-gradient" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                </div>

                {/* Breadcrumbs */}
                <div className="relative z-10 pt-24 md:pt-28 px-4 sm:px-12 md:px-20 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                    <Breadcrumbs items={[
                        { label: 'Produções', href: '/productions' },
                        { label: production.titlePt }
                    ]} />
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                        <AdminQuickEdit href={`/admin/productions/${production.id}?returnTo=${encodeURIComponent(`/productions/${production.id}`)}`} label="Editar" />
                        <ReportButton entityType="production" entityId={production.id} entityName={production.titlePt}
                            className="bg-black/50 backdrop-blur-sm hover:bg-black/70" />
                        <FavoriteButton
                            id={production.id}
                            itemName={production.titlePt}
                            itemType="produção"
                            className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
                        />
                    </div>
                </div>

                {/* Spacer — pushes hero content to the bottom */}
                <div className="flex-1 min-h-[24px]" />

                {/* Hero content */}
                <div className="relative z-10 px-4 sm:px-12 md:px-20 pb-10 md:pb-16">
                    <div className="flex items-end gap-6 md:gap-10">
                        {/* Main info — fills remaining space */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4">
                                {production.year && <span className="text-purple-500 font-bold text-sm">{production.year}</span>}
                                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                <span className="uppercase tracking-widest text-xs font-black px-2 py-0.5 border border-zinc-700 rounded-sm text-zinc-400">{production.type}</span>
                                {production.episodeCount && (
                                    <span className="text-xs font-bold text-zinc-400">{production.episodeCount} ep.</span>
                                )}
                                {production.episodeRuntime && (
                                    <span className="text-xs font-bold text-zinc-400">{formatRuntime(production.episodeRuntime)}/ep</span>
                                )}
                                {!production.episodeCount && production.runtime && (
                                    <span className="text-xs font-bold text-zinc-400">{formatRuntime(production.runtime)}</span>
                                )}
                                {production.ageRating && (
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-sm ${
                                        production.ageRating === 'L'  ? 'bg-green-700/60 text-green-300 border border-green-600/40' :
                                        production.ageRating === '10' ? 'bg-blue-700/60 text-blue-300 border border-blue-600/40' :
                                        production.ageRating === '12' ? 'bg-yellow-700/60 text-yellow-300 border border-yellow-600/40' :
                                        production.ageRating === '14' ? 'bg-orange-700/60 text-orange-300 border border-orange-600/40' :
                                        production.ageRating === '16' ? 'bg-red-700/60 text-red-300 border border-red-600/40' :
                                        'bg-red-950/80 text-red-400 border border-red-800/60'
                                    }`}>
                                        {production.ageRating === 'L' ? 'Livre' : `${production.ageRating}+`}
                                    </span>
                                )}
                                {production.voteAverage && production.voteAverage > 0 && (
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-sm ${
                                        production.voteAverage >= 7 ? 'text-green-400 bg-green-950/50 border border-green-800/40' :
                                        production.voteAverage >= 5 ? 'text-yellow-400 bg-yellow-950/50 border border-yellow-800/40' :
                                        'text-red-400 bg-red-950/50 border border-red-800/40'
                                    }`}>
                                        ★ {production.voteAverage.toFixed(1)}
                                    </span>
                                )}
                                {production.streamingPlatforms && production.streamingPlatforms.map(p => (
                                    <span key={p} className="text-xs font-bold text-white bg-zinc-800 px-3 py-0.5 rounded-sm border border-white/5">{p}</span>
                                ))}
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-none tracking-tighter">{production.titlePt}</h1>
                            {production.titleKr && <p className="text-xl text-purple-500 font-bold mt-1">{production.titleKr}</p>}
                            {production.tagline && <p className="text-base text-zinc-400 italic mt-1 mb-8">&ldquo;{production.tagline}&rdquo;</p>}
                            {!production.tagline && <div className="mb-6" />}

                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                {production.trailerUrl && (
                                    <TrailerModal trailerUrl={production.trailerUrl} title={production.titlePt} />
                                )}
                                <WatchButton productionId={production.id} productionName={production.titlePt} />
                            </div>
                        </div>

                        {/* Poster — shown on md+ only when a separate poster exists alongside a backdrop */}
                        {production.backdropUrl && production.imageUrl && production.backdropUrl !== production.imageUrl && (
                            <div className="hidden md:block flex-shrink-0 self-end pb-1">
                                <div className="w-36 lg:w-44 aspect-[2/3] relative rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl ring-1 ring-white/5">
                                    <Image
                                        src={production.imageUrl}
                                        alt={`Poster — ${production.titlePt}`}
                                        fill
                                        sizes="176px"
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-12 md:px-20 py-16">
                <div className="grid md:grid-cols-3 gap-16">
                    {/* Main column */}
                    <div className="md:col-span-2 space-y-10">
                        {production.synopsis && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-3">Sinopse</h3>
                                <p className="text-zinc-400 leading-relaxed font-medium text-lg">{production.synopsis}</p>
                            </div>
                        )}

                        {tags.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-3">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="text-xs font-bold text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-sm border border-white/5">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cast */}
                        {production.artists.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6">Elenco</h3>
                                {(() => {
                                    const hasOrder = production.artists.some(a => a.castOrder !== null)

                                    // Dynamic tier detection: find natural "gaps" in castOrder values
                                    // A significant gap between consecutive cast positions marks a tier boundary
                                    let leads: typeof production.artists
                                    let secondary: typeof production.artists
                                    let supporting: typeof production.artists

                                    if (hasOrder) {
                                        const ordered = [...production.artists].sort(
                                            (a, b) => (a.castOrder ?? 999) - (b.castOrder ?? 999)
                                        )
                                        const n = ordered.length

                                        if (n <= 2) {
                                            leads = ordered; secondary = []; supporting = []
                                        } else {
                                            // Compute gaps between consecutive cast orders
                                            const gaps = ordered.slice(1).map((a, i) => ({
                                                boundaryAt: i + 1,
                                                size: (a.castOrder ?? 999) - (ordered[i].castOrder ?? 999),
                                            }))
                                            const avgGap = gaps.reduce((s, g) => s + g.size, 0) / gaps.length

                                            // A gap is "significant" if ≥ 2 AND at least 1.5× the average gap
                                            const boundaries = gaps
                                                .filter(g => g.size >= Math.max(2, avgGap * 1.5))
                                                .sort((a, b) => b.size - a.size)
                                                .slice(0, 2)
                                                .sort((a, b) => a.boundaryAt - b.boundaryAt)
                                                .map(g => g.boundaryAt)

                                            if (boundaries.length >= 1) {
                                                // Natural tier boundaries found — use gap-based split
                                                const [b1, b2] = boundaries
                                                leads = ordered.slice(0, b1)
                                                secondary = ordered.slice(b1, b2)
                                                supporting = b2 != null ? ordered.slice(b2) : []
                                            } else {
                                                // No natural gaps (continuous ordering, e.g. 0,1,2,3...)
                                                // Fall back to billing position thresholds
                                                leads = ordered.filter(a => (a.castOrder ?? 999) <= 1)
                                                secondary = ordered.filter(a => { const o = a.castOrder ?? 999; return o >= 2 && o <= 5 })
                                                supporting = ordered.filter(a => (a.castOrder ?? 999) >= 6)
                                                // Safety: if somehow leads is empty, put first 2 in leads
                                                if (leads.length === 0) {
                                                    leads = ordered.slice(0, 2)
                                                    secondary = ordered.slice(2, 6)
                                                    supporting = ordered.slice(6)
                                                }
                                            }
                                        }
                                    } else {
                                        // Fallback when no TMDB order: positional split
                                        const n = production.artists.length
                                        leads = production.artists.slice(0, Math.min(2, n))
                                        secondary = production.artists.slice(2, Math.min(6, n))
                                        supporting = production.artists.slice(6)
                                    }

                                    const CastCard = ({ artist, role }: { artist: typeof leads[0]['artist'], role: string | null }) => (
                                        <Link href={`/artists/${artist.id}`} className="group">
                                            <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-zinc-900 border border-white/5 hover:border-purple-500/30 transition-colors">
                                                {artist.primaryImageUrl ? (
                                                    <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-[0.75] group-hover:brightness-90" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-zinc-700 font-black text-sm">{artist.nameRomanized}</div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                                    <p className="text-sm font-black text-white">{artist.nameRomanized}</p>
                                                    {role && <p className="text-xs font-bold truncate text-purple-500">{role}</p>}
                                                </div>
                                            </div>
                                        </Link>
                                    )

                                    return (
                                        <>
                                            {/* Protagonistas */}
                                            {leads.length > 0 && (
                                                <div className="mb-8">
                                                    <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3">Protagonistas</p>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {leads.map(({ artist, role }) => (
                                                            <CastCard key={artist.id} artist={artist} role={role} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Secundários */}
                                            {secondary.length > 0 && (
                                                <div className="mb-8">
                                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Elenco Secundário</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                        {secondary.map(({ artist, role }) => (
                                                            <CastCard key={artist.id} artist={artist} role={role} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Coadjuvantes */}
                                            {supporting.length > 0 && (
                                                <div>
                                                    {(leads.length > 0 || secondary.length > 0) && (
                                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Coadjuvantes</p>
                                                    )}
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                        {supporting.map(({ artist, role }) => (
                                                            <CastCard key={artist.id} artist={artist} role={role} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )
                                })()}
                            </div>
                        )}

                        {/* Gallery */}
                        {galleryUrls.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6">Galeria</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {galleryUrls.map((url, i) => (
                                        <div key={i} className="aspect-video relative rounded-lg overflow-hidden border border-white/5">
                                            <Image
                                                src={url}
                                                alt={`${production.titlePt} - imagem ${i + 1}`}
                                                fill
                                                sizes="(max-width: 640px) 50vw, 33vw"
                                                className="object-cover hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Related productions */}
                        {relatedProductions.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                        <Film className="w-4 h-4" />
                                        Você também pode gostar
                                    </h3>
                                    <Link href="/productions" className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
                                        Ver tudo →
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {relatedProductions.map((rel) => (
                                        <Link key={rel.id} href={`/productions/${rel.id}`} className="group block">
                                            <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-purple-500/30 transition-all mb-2">
                                                {rel.imageUrl || rel.backdropUrl ? (
                                                    <Image
                                                        src={rel.imageUrl || rel.backdropUrl!}
                                                        alt={rel.titlePt}
                                                        fill
                                                        sizes="(max-width: 640px) 50vw, 33vw"
                                                        className="object-cover brightness-75 group-hover:brightness-90 group-hover:scale-105 transition-all duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Film className="w-8 h-8 text-zinc-700" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                                {rel.voteAverage && rel.voteAverage > 0 && (
                                                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[10px] font-black text-yellow-400">
                                                        ★ {rel.voteAverage.toFixed(1)}
                                                    </div>
                                                )}
                                                <div className="absolute bottom-2 left-2">
                                                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-zinc-400">
                                                        {rel.type}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">{rel.titlePt}</p>
                                                <p className="text-[10px] text-zinc-600 font-bold mt-0.5">
                                                    {rel.titleKr || rel.year}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div>
                        <div className="bg-zinc-900 rounded-lg border border-white/5 p-6 sticky top-24">
                            {production.voteAverage && production.voteAverage > 0 && (
                                <div className="flex justify-between py-3 border-b border-white/5 items-center">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Nota TMDB</span>
                                    <span className={`text-sm font-black ${
                                        production.voteAverage >= 7 ? 'text-green-400' :
                                        production.voteAverage >= 5 ? 'text-yellow-400' :
                                        'text-red-400'
                                    }`}>★ {production.voteAverage.toFixed(1)}<span className="text-zinc-600 font-normal text-xs">/10</span></span>
                                </div>
                            )}
                            {production.releaseDate && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Estreia</span>
                                    <span className="text-sm font-bold text-zinc-300">
                                        {new Date(production.releaseDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                                    </span>
                                </div>
                            )}
                            {!production.releaseDate && production.year && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Ano</span>
                                    <span className="text-sm font-bold text-zinc-300">{production.year}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-3 border-b border-white/5">
                                <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Tipo</span>
                                <span className="text-sm font-bold text-zinc-300 uppercase">{production.type}</span>
                            </div>
                            {production.runtime && production.runtime > 0 && !production.episodeCount && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Duração</span>
                                    <span className="text-sm font-bold text-zinc-300">{formatRuntime(production.runtime)}</span>
                                </div>
                            )}
                            {production.episodeCount && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Episódios</span>
                                    <span className="text-sm font-bold text-zinc-300">{production.episodeCount} ep.</span>
                                </div>
                            )}
                            {production.seasonCount && production.seasonCount > 1 && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Temporadas</span>
                                    <span className="text-sm font-bold text-zinc-300">{production.seasonCount}</span>
                                </div>
                            )}
                            {production.episodeRuntime && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Ep. Duração</span>
                                    <span className="text-sm font-bold text-zinc-300">{formatRuntime(production.episodeRuntime)}</span>
                                </div>
                            )}
                            {production.network && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Canal</span>
                                    <span className="text-sm font-bold text-zinc-300">{production.network}</span>
                                </div>
                            )}
                            {production.productionStatus && (
                                <div className="flex justify-between py-3 border-b border-white/5 items-center">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Status</span>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-sm ${
                                        production.productionStatus === 'Returning Series'
                                            ? 'bg-green-900/50 text-green-400 border border-green-700/40'
                                            : production.productionStatus === 'Ended'
                                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700/40'
                                            : production.productionStatus === 'In Production'
                                            ? 'bg-blue-900/50 text-blue-400 border border-blue-700/40'
                                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700/40'
                                    }`}>
                                        {production.productionStatus === 'Returning Series' ? 'Em exibição' :
                                         production.productionStatus === 'Ended' ? 'Encerrada' :
                                         production.productionStatus === 'Cancelled' ? 'Cancelada' :
                                         production.productionStatus === 'In Production' ? 'Em produção' :
                                         production.productionStatus}
                                    </span>
                                </div>
                            )}
                            {production.ageRating && (
                                <div className="flex justify-between py-3 border-b border-white/5 items-center">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Classificação</span>
                                    <span className={`text-xs font-black px-2.5 py-1 rounded ${
                                        production.ageRating === 'L'  ? 'bg-green-600 text-white' :
                                        production.ageRating === '10' ? 'bg-blue-600 text-white' :
                                        production.ageRating === '12' ? 'bg-yellow-500 text-black' :
                                        production.ageRating === '14' ? 'bg-orange-500 text-white' :
                                        production.ageRating === '16' ? 'bg-red-600 text-white' :
                                        'bg-red-900 text-red-100'
                                    }`}>
                                        {production.ageRating === 'L' ? 'Livre' : `${production.ageRating} anos`}
                                    </span>
                                </div>
                            )}
                            {production.streamingPlatforms && production.streamingPlatforms.length > 0 && (
                                <div className="flex justify-between py-3 border-b border-white/5 items-center">
                                    <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Streaming</span>
                                    <div className="flex flex-wrap gap-1.5 justify-end">
                                        {production.streamingPlatforms.map(p => (
                                            <span key={p} className="text-xs font-black text-white bg-zinc-800 px-2 py-0.5 rounded-sm border border-white/5">{p}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between py-3">
                                <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Elenco</span>
                                <span className="text-sm font-bold text-zinc-300">{production.artists.length} artistas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
