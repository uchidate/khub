import prisma from "@/lib/prisma"
import { applySeoOverride } from '@/lib/seo/apply-override'
import { getTranslation } from "@/lib/translations"
import Link from "next/link"
import Image from "next/image"
import { notFound, permanentRedirect } from "next/navigation"
import { cache } from "react"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { FavoriteButton } from "@/components/ui/FavoriteButton"
import { WatchButton } from "@/components/ui/WatchButton"
import { ReportButton } from "@/components/ui/ReportButton"
import { AdminQuickEdit } from "@/components/ui/AdminQuickEdit"
import { TrailerModal } from "@/components/features/TrailerModal"
import { ViewTracker } from "@/components/features/ViewTracker"
import { JsonLd } from "@/components/seo/JsonLd"
import { ShareButtons } from "@/components/ui/ShareButtons"
import { AdBanner } from "@/components/ui/AdBanner"
import { Film } from "lucide-react"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import type { Metadata } from "next"

import { SITE_URL } from '@/lib/constants/site'
import { LojaRelacionados } from '@/components/ui/LojaRelacionados'
const BASE_URL = SITE_URL

// ISR: página cacheada 1h no servidor — revalidada sob demanda via revalidatePath no admin
export const revalidate = 3600

// Pré-gera as produções com maior nota no build → first-paint rápido, melhor SEO e Core Web Vitals
export async function generateStaticParams() {
    if (process.env.SKIP_BUILD_STATIC_GENERATION) return []
    const productions = await prisma.production.findMany({
        where: { isHidden: false, flaggedAsNonKorean: false, slug: { not: null } },
        select: { slug: true },
        orderBy: { voteAverage: 'desc' },
        take: 200,
    })
    return productions.map(p => ({ slug: p.slug! }))
}

const isCuid = (s: string) => /^c[a-z0-9]{24}$/.test(s)

// React.cache deduplica a query dentro do mesmo render pass (generateMetadata + page component)
const getProduction = cache(async (slugOrId: string) => {
    const where = isCuid(slugOrId) ? { id: slugOrId } : { slug: slugOrId }
    return prisma.production.findFirst({
        where,
        include: {
            artists: {
                where: { artist: { flaggedAsNonKorean: false } },
                include: { artist: { select: {
                    id: true, slug: true, nameRomanized: true, nameHangul: true,
                    primaryImageUrl: true, roles: true, gender: true,
                } } },
                orderBy: [{ castOrder: 'asc' }, { role: 'asc' }],
                take: 30,
            }
        }
    }).catch(() => null)
})

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const params = await props.params;
    const production = await getProduction(params.slug)

    if (!production) {
        return {
            title: 'Produção não encontrada',
            description: 'Esta produção não foi encontrada em nossa base de dados.'
        }
    }
    if (production.isHidden) return { title: 'Produção não encontrada', robots: { index: false, follow: false } }

    // Conteúdo adulto não deve ser indexado: ageRating='18' ou flagrado pela IA como adulto
    if (production.ageRating === '18' || production.isAdultContent === true) {
        return {
            title: production.titlePt,
            robots: { index: false, follow: false },
        }
    }

    const synopsisMeta = await getTranslation('production', production.id, 'synopsis') ?? production.synopsis
    const description = synopsisMeta || `${production.titlePt} (${production.titleKr}) - ${production.type} ${production.year ? `de ${production.year}` : ''}`
    const castNames = production.artists.slice(0, 3).map(a => a.artist.nameRomanized).join(', ')
    const fullDescription = synopsisMeta
        ? `${synopsisMeta.slice(0, 120)}...${castNames ? ` Elenco: ${castNames}` : ''}`
        : description

    const canonicalUrl = `${BASE_URL}/productions/${production.slug ?? production.id}`
    const isMovie = production.type === 'MOVIE' || production.type === 'FILM'
    const typeLabel = isMovie ? 'Filme' : 'Série'
    const castNamesForKeywords = production.artists.slice(0, 5).map(a => a.artist.nameRomanized)
    const keywords = [
        production.titlePt,
        ...(production.titleKr ? [production.titleKr] : []),
        `${production.titlePt} ${typeLabel}`,
        ...(production.year ? [`${production.titlePt} ${production.year}`] : []),
        ...castNamesForKeywords,
        ...(production.tags ?? []),
        'K-Drama', 'dorama', 'dorama coreano', 'drama coreano', 'HallyuHub',
    ].filter(Boolean).join(', ')

    return applySeoOverride({
        title: production.titleKr
            ? `${production.titlePt} (${production.titleKr})`
            : production.titlePt,
        description: fullDescription.slice(0, 160),
        keywords,
        alternates: {
            canonical: canonicalUrl,
            languages: { 'pt-BR': canonicalUrl, 'x-default': canonicalUrl },
        },
        openGraph: {
            title: `${production.titlePt} | HallyuHub`,
            description: fullDescription.slice(0, 160),
            images: production.imageUrl ? [{
                url: production.imageUrl,
                width: 1200,
                height: 630,
                alt: production.titlePt
            }] : [],
            type: 'video.movie',
            url: `${BASE_URL}/productions/${production.slug ?? production.id}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${production.titlePt} | HallyuHub`,
            description: fullDescription.slice(0, 160),
            images: production.imageUrl ? [production.imageUrl] : []
        }
    }, 'production', production.id)
}

export default async function ProductionDetailPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;

    const production = await getProduction(params.slug)

    if (!production || production.isHidden) {
        notFound()
    }

    // Redireciona ID puro para URL canônica com slug (301 permanente para SEO)
    if (isCuid(params.slug) && production.slug && production.slug !== params.slug) {
        permanentRedirect(`/productions/${production.slug}`)
    }

    const tags = (production.tags || []) as string[]
    const artistIds = production.artists.map(a => a.artist.id)

    const relatedSelect = {
        id: true, slug: true, titlePt: true, titleKr: true, type: true,
        year: true, imageUrl: true, backdropUrl: true, voteAverage: true,
    } as const

    // Priority 1: shared cast (strongest signal — "more with this actor")
    const byArtist = artistIds.length > 0
        ? await prisma.production.findMany({
            where: {
                id: { not: production.id },
                isHidden: false,
                flaggedAsNonKorean: false,
                artists: { some: { artistId: { in: artistIds } } },
            },
            orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
            take: 6,
            select: relatedSelect,
        }).catch(() => [])
        : []

    // Priority 2: shared tags (fill remaining slots)
    const byArtistIds = byArtist.map(p => p.id)
    const needByTag = 6 - byArtist.length
    const byTag = tags.length > 0 && needByTag > 0
        ? await prisma.production.findMany({
            where: {
                id: { notIn: [production.id, ...byArtistIds] },
                isHidden: false,
                flaggedAsNonKorean: false,
                tags: { hasSome: tags },
            },
            orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
            take: needByTag,
            select: relatedSelect,
        }).catch(() => [])
        : []

    // Priority 3: same type (fallback)
    const usedIds = [production.id, ...byArtistIds, ...byTag.map(p => p.id)]
    const needByType = 6 - byArtist.length - byTag.length
    const byType = needByType > 0
        ? await prisma.production.findMany({
            where: {
                id: { notIn: usedIds },
                isHidden: false,
                flaggedAsNonKorean: false,
                type: production.type,
            },
            orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
            take: needByType,
            select: relatedSelect,
        }).catch(() => [])
        : []

    const relatedProductions = [...byArtist, ...byTag, ...byType]

    // Total real de artistas (pode ser maior que o take:30)
    const totalCast = production.artists.length < 30
        ? production.artists.length
        : await prisma.artistProduction.count({ where: { productionId: production.id, artist: { flaggedAsNonKorean: false } } }).catch(() => production.artists.length)

    // Busca sinopse traduzida (PT-BR) — fallback para o campo original
    const synopsisPt = await getTranslation('production', production.id, 'synopsis').catch(() => null)
    const synopsis = synopsisPt ?? production.synopsis

    const galleryUrls = (production.galleryUrls as string[] | null) || []

    const heroImageMobile = production.imageUrl || production.backdropUrl
    const heroImageDesktop = production.backdropUrl || production.imageUrl

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
        "url": `${BASE_URL}/artists/${a.artist.slug ?? a.artist.id}`,
    }))

    return (
        <div className="min-h-screen bg-background">
            <ViewTracker productionId={production.id} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": schemaType,
                "name": production.titlePt,
                "alternateName": production.titleKr ?? undefined,
                "description": synopsis?.slice(0, 300) ?? undefined,
                "image": production.backdropUrl ?? production.imageUrl ?? undefined,
                "url": `${BASE_URL}/productions/${production.slug ?? production.id}`,
                "inLanguage": "ko",
                "countryOfOrigin": { "@type": "Country", "name": "Korea, Republic of" },
                ...(production.year ? { "datePublished": String(production.year) } : {}),
                ...(production.releaseDate ? { "startDate": new Date(production.releaseDate).toISOString().split('T')[0] } : {}),
                ...(production.episodeCount && !isMovie ? { "numberOfEpisodes": production.episodeCount } : {}),
                ...(production.seasonCount && !isMovie ? { "numberOfSeasons": production.seasonCount } : {}),
                ...(production.network ? { "productionCompany": { "@type": "Organization", "name": production.network } } : {}),
                ...(castActors.length ? { "actor": castActors } : {}),
                ...(production.tags?.length ? { "genre": production.tags } : {}),
                ...(production.ageRating ? { "contentRating": production.ageRating === 'L' ? 'Livre' : `${production.ageRating}+` } : {}),
                ...(production.trailerUrl ? {
                    "trailer": {
                        "@type": "VideoObject",
                        "name": `Trailer — ${production.titlePt}`,
                        "embedUrl": production.trailerUrl,
                        "thumbnailUrl": production.imageUrl ?? undefined,
                        "uploadDate": production.releaseDate
                            ? new Date(production.releaseDate).toISOString().split('T')[0]
                            : production.year
                                ? `${production.year}-01-01`
                                : new Date().toISOString().split('T')[0],
                        "description": `Trailer oficial de ${production.titlePt}`,
                    }
                } : {}),
                ...(production.voteAverage && production.voteAverage > 0 && production.voteCount && production.voteCount > 0 ? {
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": production.voteAverage.toFixed(1),
                        "bestRating": "10",
                        "worstRating": "0",
                        "ratingCount": production.voteCount,
                    }
                } : {}),
            }} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Produções", "item": `${BASE_URL}/productions` },
                    { "@type": "ListItem", "position": 2, "name": production.titlePt, "item": `${BASE_URL}/productions/${production.slug ?? production.id}` },
                ],
            }} />
            {/* Cinematic Hero — flexbox layout to prevent overlap on small viewports */}
            <div className="relative min-h-[88vh] md:min-h-[65vh] bg-[#080808] flex flex-col overflow-hidden">
                {/* Background image (contained, never clips content) */}
                <div className="absolute inset-0">
                    {/* Mobile: poster (imageUrl) */}
                    {heroImageMobile && (
                        <Image src={heroImageMobile} alt={production.titlePt} fill priority sizes="100vw" className="object-cover md:hidden" />
                    )}
                    {/* Desktop: backdrop (backdropUrl) */}
                    {heroImageDesktop ? (
                        <Image src={heroImageDesktop} alt={production.titlePt} fill priority sizes="100vw" className="object-cover hidden md:block" />
                    ) : !heroImageMobile && (
                        <>
                            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff2d78]/5 rounded-full blur-3xl" />
                            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#ff2d78]/5 rounded-full blur-3xl" />
                        </>
                    )}
                    <div className="absolute inset-0 hero-gradient" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                </div>

                {/* Breadcrumbs + actions */}
                <div className="relative z-10 pt-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                    <Breadcrumbs
                        items={[
                            { label: 'Produções', href: '/productions' },
                            { label: production.titlePt }
                        ]}
                        onDark
                        className=""
                    />
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                        <AdminQuickEdit href={`/admin/productions/${production.id}?returnTo=${encodeURIComponent(`/productions/${production.id}`)}`} label="Editar" />
                        <ReportButton entityType="production" entityId={production.id} entityName={production.titlePt}
                            className="bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-sm" />
                        <FavoriteButton
                            id={production.id}
                            itemName={production.titlePt}
                            itemType="produção"
                            className="bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-sm"
                        />
                    </div>
                </div>

                {/* Hero content */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pb-10 md:pb-16 mt-auto">
                    <div className="flex items-end gap-6 md:gap-10">
                        {/* Main info — fills remaining space */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4">
                                {production.year && <span className="text-[#ff2d78] font-bold text-sm">{production.year}</span>}
                                <span className="w-1 h-1 bg-white/40 rounded-full" />
                                <span className="uppercase tracking-widest text-xs font-black px-2 py-0.5 border border-white/20 rounded-sm text-white/70">{production.type}</span>
                                {production.episodeCount && (
                                    <span className="text-xs font-bold text-white/70">{production.episodeCount} ep.</span>
                                )}
                                {production.episodeRuntime && (
                                    <span className="text-xs font-bold text-white/70">{formatRuntime(production.episodeRuntime)}/ep</span>
                                )}
                                {!production.episodeCount && production.runtime && (
                                    <span className="text-xs font-bold text-white/70">{formatRuntime(production.runtime)}</span>
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
                                    <span key={p} className="text-xs font-bold text-white bg-white/10 px-3 py-0.5 rounded-sm border border-white/10">{p}</span>
                                ))}
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-none tracking-tighter">{production.titlePt}</h1>
                            {production.titleKr && <p className="text-xl text-[#ff2d78] font-bold mt-1">{production.titleKr}</p>}
                            {production.tagline && <p className="text-base text-white/60 italic mt-1 mb-8">&ldquo;{production.tagline}&rdquo;</p>}
                            {!production.tagline && <div className="mb-6" />}

                            <div className="mt-6 flex items-center gap-2">
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-6 pb-16 md:py-16">
                <div className="grid md:grid-cols-3 gap-16">
                    {/* Main column */}
                    <div className="md:col-span-2 space-y-10">
                        {synopsis && (
                            <div>
                                <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-3">Sinopse</h3>
                                <p className="text-muted leading-relaxed font-medium text-lg">{synopsis}</p>
                            </div>
                        )}

                        {/* Nossa Análise Editorial */}
                        {(production.whyWatch || production.editorialReview) && (
                            <div className="space-y-6 border-t border-border pt-8">
                                {production.whyWatch && (
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-[#ff2d78]/5 border border-[#ff2d78]/20">
                                        <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-[#ff2d78]/10 flex items-center justify-center">
                                            <span className="text-[#ff2d78] text-xs font-black">▶</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#ff2d78] mb-1">Por que assistir</p>
                                            <p className="text-sm text-muted leading-relaxed">{production.whyWatch}</p>
                                        </div>
                                    </div>
                                )}
                                {production.editorialReview && (
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <h3 className="text-xs font-black text-muted uppercase tracking-widest">Nossa Análise</h3>
                                            {production.editorialRating != null && (
                                                <span className="px-2 py-0.5 rounded bg-[#ff2d78]/10 text-[#ff2d78] text-xs font-black border border-[#ff2d78]/30">
                                                    {production.editorialRating.toFixed(1)}/10
                                                </span>
                                            )}
                                            <div className="flex-1 h-px bg-[#e8e8e8]" />
                                        </div>
                                        <div className="space-y-3 text-muted leading-relaxed text-sm">
                                            {production.editorialReview.split('\n\n').map((p, i) => (
                                                <p key={i}>{p}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {tags.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-3">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="text-xs font-bold text-muted bg-surface px-3 py-1.5 rounded-sm border border-border">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Loja: produtos relacionados à produção */}
                        {/* Ad 1 — in-article após sinopse/tags, posição de maior atenção */}
                        <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FLUID!} variant="fluid" className="my-4"  devLabel="Produção · In-Article" />

                        {/* Cast */}
                        {production.artists.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-6">Elenco</h3>
                                {(() => {
                                    const ordered = [...production.artists].sort(
                                        (a, b) => (a.castOrder ?? 999) - (b.castOrder ?? 999)
                                    )
                                    return (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {ordered.map(({ artist, role }) => (
                                                <Link key={artist.id} href={`/artists/${artist.slug ?? artist.id}`} className="group">
                                                    <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-surface border border-border hover:border-[#ff2d78]/30 transition-colors">
                                                        {artist.primaryImageUrl ? (
                                                            <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-[0.75] group-hover:brightness-90" />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-muted font-black text-sm">{artist.nameRomanized}</div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                                            <p className="text-sm font-black text-white">{artist.nameRomanized}</p>
                                                            {role && <p className="text-xs font-bold truncate text-[#ff2d78]">{role}</p>}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )
                                })()}
                            </div>
                        )}

                        {/* Gallery */}
                        {galleryUrls.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-6">Galeria</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {galleryUrls.map((url, i) => (
                                        <div key={i} className="aspect-video relative rounded-lg overflow-hidden border border-border">
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

                        {/* Compartilhar */}
                        <ShareButtons
                            title={production.titlePt}
                            url={`${BASE_URL}/productions/${production.slug ?? production.id}`}
                        />

                        {/* Loja: após elenco, usuário já conhece o drama e o elenco */}
                        <LojaRelacionados
                            tags={[
                                ...tags,
                                ...production.artists.slice(0, 3).map(a => a.artist.nameRomanized.toLowerCase()),
                                isMovie ? 'kfilm' : 'kdrama',
                            ]}
                            title={`Produtos — ${production.titlePt}`}
                        />

                        {/* Ad 2 — após elenco/galeria, antes das recomendações */}
                        <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_AUTO!} variant="auto" minimal className="my-6"  devLabel="Produção · Meio Conteúdo" />

                        {/* Related productions */}
                        {relatedProductions.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-black text-muted uppercase tracking-widest flex items-center gap-2">
                                        <Film className="w-4 h-4" />
                                        Você também pode gostar
                                    </h3>
                                    <Link href="/productions" className="text-xs font-bold text-[#ff2d78] hover:underline transition-colors">
                                        Ver tudo →
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {relatedProductions.map((rel) => (
                                        <Link key={rel.id} href={`/productions/${rel.slug ?? rel.id}`} className="group block">
                                            <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-surface border border-border hover:border-[#ff2d78]/30 transition-all mb-2">
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
                                                        <Film className="w-8 h-8 text-muted/40" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                                {rel.voteAverage && rel.voteAverage > 0 && (
                                                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[10px] font-black text-yellow-400">
                                                        ★ {rel.voteAverage.toFixed(1)}
                                                    </div>
                                                )}
                                                <div className="absolute bottom-2 left-2">
                                                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-white/70">
                                                        {rel.type}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-[#ff2d78] transition-colors">{rel.titlePt}</p>
                                                <p className="text-[10px] text-muted font-bold mt-0.5">
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
                        <div className="sticky top-24 flex flex-col gap-4">
                        <div className="bg-background rounded-2xl border border-border p-6">
                            {production.voteAverage && production.voteAverage > 0 && (
                                <div className="flex justify-between py-3 border-b border-border items-center">
                                    <span className="text-xs font-black text-muted uppercase tracking-widest">Nota TMDB</span>
                                    <span className={`text-sm font-black ${
                                        production.voteAverage >= 7 ? 'text-green-600' :
                                        production.voteAverage >= 5 ? 'text-amber-500' :
                                        'text-red-500'
                                    }`}>★ {production.voteAverage.toFixed(1)}<span className="text-muted font-normal text-xs">/10</span></span>
                                </div>
                            )}
                            {production.releaseDate && (
                                <div className="flex justify-between py-3 border-b border-border">
                                    <span className="text-xs font-black text-muted uppercase tracking-widest">Estreia</span>
                                    <span className="text-sm font-bold text-foreground">
                                        {new Date(production.releaseDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                                    </span>
                                </div>
                            )}
                            {!production.releaseDate && production.year && (
                                <div className="flex justify-between py-3 border-b border-border">
                                    <span className="text-xs font-black text-muted uppercase tracking-widest">Ano</span>
                                    <span className="text-sm font-bold text-foreground">{production.year}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-3 border-b border-border">
                                <span className="text-xs font-black text-muted uppercase tracking-widest">Tipo</span>
                                <span className="text-sm font-bold text-foreground uppercase">{production.type}</span>
                            </div>
                            {production.runtime && production.runtime > 0 && !production.episodeCount && (
                                <div className="flex justify-between py-3 border-b border-border">
                                    <span className="text-xs font-black text-muted uppercase tracking-widest">Duração</span>
                                    <span className="text-sm font-bold text-foreground">{formatRuntime(production.runtime)}</span>
                                </div>
                            )}
                            {production.episodeCount && (
                                <div className="flex justify-between py-3 border-b border-border">
                                    <span className="text-xs font-black text-muted uppercase tracking-widest">Episódios</span>
                                    <span className="text-sm font-bold text-foreground">{production.episodeCount} ep.</span>
                                </div>
                            )}
                            {production.seasonCount && production.seasonCount > 1 && (
                                <div className="flex justify-between py-3 border-b border-border">
                                    <span className="text-xs font-black text-muted uppercase tracking-widest">Temporadas</span>
                                    <span className="text-sm font-bold text-foreground">{production.seasonCount}</span>
                                </div>
                            )}
                            {production.episodeRuntime && (
                                <div className="flex justify-between py-3 border-b border-border">
                                    <span className="text-xs font-black text-muted uppercase tracking-widest">Ep. Duração</span>
                                    <span className="text-sm font-bold text-foreground">{formatRuntime(production.episodeRuntime)}</span>
                                </div>
                            )}
                            {production.network && (
                                <div className="flex justify-between py-3 border-b border-border">
                                    <span className="text-xs font-black text-muted uppercase tracking-widest">Canal</span>
                                    <span className="text-sm font-bold text-foreground">{production.network}</span>
                                </div>
                            )}
                            {production.productionStatus && (
                                <div className="flex justify-between py-3 border-b border-border items-center">
                                    <span className="text-xs font-black text-muted uppercase tracking-widest">Status</span>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-sm ${
                                        production.productionStatus === 'Returning Series'
                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                            : production.productionStatus === 'Ended'
                                            ? 'bg-surface text-muted border border-border'
                                            : production.productionStatus === 'In Production'
                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                            : 'bg-surface text-muted border border-border'
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
                                <div className="flex justify-between py-3 border-b border-border items-center">
                                    <span className="text-xs font-black text-muted uppercase tracking-widest">Classificação</span>
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
                                <div className="flex justify-between py-3 border-b border-border items-center">
                                    <span className="text-xs font-black text-muted uppercase tracking-widest">Streaming</span>
                                    <div className="flex flex-wrap gap-1.5 justify-end">
                                        {production.streamingPlatforms.map(p => (
                                            <span key={p} className="text-xs font-black text-foreground bg-surface px-2 py-0.5 rounded-sm border border-border">{p}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between py-3">
                                <span className="text-xs font-black text-muted uppercase tracking-widest">Elenco</span>
                                <span className="text-sm font-bold text-foreground">{totalCast} artistas</span>
                            </div>
                        </div>

                        <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR!} variant="auto" minimal hideLabel  devLabel="Produção · Sidebar" />
                        </div>
                    </div>
                </div>
            </div>
            <ScrollToTop />
        </div>
    )
}
