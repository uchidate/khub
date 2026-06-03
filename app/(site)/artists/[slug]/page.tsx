import prisma from "@/lib/prisma"
import { applySeoOverride } from '@/lib/seo/apply-override'
import { cache } from "react"
import Image from "next/image"
import Link from "next/link"
import { getRoleLabels } from "@/lib/utils/role-labels"
import { getStreamingConfig } from "@/lib/config/streaming-platforms"
import { ViewTracker } from "@/components/features/ViewTracker"
import { DiscographySection } from "@/components/features/DiscographySection"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { FavoriteButton } from "@/components/ui/FavoriteButton"
import { ReportButton } from "@/components/ui/ReportButton"
import { AdminQuickEdit } from "@/components/ui/AdminQuickEdit"
import { JsonLd } from "@/components/seo/JsonLd"
import { ShareButtons } from "@/components/ui/ShareButtons"
import { AnniversaryCountdown } from "@/components/ui/AnniversaryCountdown"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { getTranslation, getTranslations } from "@/lib/translations"
import { buildArtistSeoDescription, buildArtistSeoTitle } from "@/lib/seo/metadata-builders"
import { Music, Globe } from 'lucide-react'
import { Instagram, Twitter, Youtube } from '@/components/ui/BrandIcons'
import type { Metadata } from "next"
import { permanentRedirect } from "next/navigation"
import { ExternalMusicEntityType } from "@prisma/client"

import { SITE_URL } from '@/lib/constants/site'
import { StoreProductsRail } from '@/components/store/StoreProductsRail'
import { inferContentType } from '@/lib/store/product-matcher'
import { BrandDot } from '@/components/ui/BrandDot'
const BASE_URL = SITE_URL

type ArtistWithExtras = Awaited<ReturnType<typeof getArtist>> & {
  seoTags?: string[]
  deathDate?: Date | null
  debutDate?: Date | null
  awards?: Array<{ premio: string; categoria: string; ano: number }>
  faq?: Array<{ pergunta: string; resposta: string }>
}

// ISR: página cacheada 1h — revalidada sob demanda via revalidatePath no admin
// ISR ativo — revalidate abaixo substitui force-dynamic
export const revalidate = 3600

// Pré-gera os top artistas no build → first-paint rápido, melhor SEO e Core Web Vitals
export async function generateStaticParams() {
    if (process.env.SKIP_BUILD_STATIC_GENERATION) return []
    const artists = await prisma.artist.findMany({
        where: { isHidden: false, flaggedAsNonKorean: false, slug: { not: null } },
        select: { slug: true },
        orderBy: { trendingScore: 'desc' },
        take: 200,
    })
    return artists.map(a => ({ slug: a.slug! }))
}

const isCuid = (s: string) => /^c[a-z0-9]{24}$/.test(s)

// React.cache deduplica a query dentro do mesmo render pass (generateMetadata + page)
const getArtist = cache(async (slugOrId: string) => {
    const where = isCuid(slugOrId) ? { id: slugOrId } : { slug: slugOrId }
    return prisma.artist.findFirst({
        where,
        include: {
            agency: { select: { id: true, name: true, slug: true, logoUrl: true } },
            albums: { orderBy: { releaseDate: 'desc' }, take: 20 },
            productions: {
                where: {
                    production: {
                        flaggedAsNonKorean: false,
                        isHidden: false,
                        AND: [
                            { OR: [{ ageRating: null }, { ageRating: { not: '18' } }] },
                            { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
                        ],
                    }
                },
                include: { production: { select: {
                    id: true, slug: true, titlePt: true, type: true, year: true, imageUrl: true,
                    voteAverage: true, synopsis: true, tmdbId: true, releaseDate: true,
                    ageRating: true, isAdultContent: true,
                } } },
                orderBy: [
                    { production: { releaseDate: { sort: 'desc', nulls: 'last' } } },
                    { production: { year: { sort: 'desc', nulls: 'last' } } },
                    { production: { createdAt: 'desc' } },
                ],
                take: 24,
            },
            memberships: {
                include: { group: { select: { id: true, slug: true, name: true, nameHangul: true, profileImageUrl: true } } },
                orderBy: [{ isActive: 'desc' }, { joinDate: 'asc' }],
            },
            streamingSignals: {
                where: { expiresAt: { gt: new Date() } },
                select: { showTitle: true, showTmdbId: true, rank: true, source: true },
                orderBy: { rank: 'asc' },
            },
        }
    }).catch(() => null)
})

interface SocialPlatform {
    icon: React.ElementType | string
    label: string
    action: string
    color: string
    bg: string
}

const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
    instagram:  { icon: Instagram, label: 'Instagram', action: 'Seguir',    color: 'text-pink-400',    bg: 'hover:border-pink-500/50 hover:bg-pink-500/10' },
    twitter:    { icon: Twitter,   label: 'Twitter / X', action: 'Seguir',  color: 'text-sky-400',     bg: 'hover:border-sky-500/50 hover:bg-sky-500/10' },
    youtube:    { icon: Youtube,   label: 'YouTube',   action: 'Inscrever', color: 'text-red-400',     bg: 'hover:border-red-500/50 hover:bg-red-500/10' },
    tiktok:     { icon: '▶',       label: 'TikTok',    action: 'Seguir',    color: 'text-white',       bg: 'hover:border-white/30 hover:bg-white/5' },
    weverse:    { icon: '⬡',       label: 'Weverse',   action: 'Entrar',    color: 'text-green-400',   bg: 'hover:border-green-500/50 hover:bg-green-500/10' },
    fancafe:    { icon: '☕',       label: 'Fancafe',   action: 'Entrar',    color: 'text-yellow-400',  bg: 'hover:border-yellow-500/50 hover:bg-yellow-500/10' },
    naverBlog:  { icon: 'N',       label: 'Naver Blog', action: 'Visitar',  color: 'text-emerald-400', bg: 'hover:border-emerald-500/50 hover:bg-emerald-500/10' },
    spotify:    { icon: Music,     label: 'Spotify',   action: 'Ouvir',     color: 'text-green-500',   bg: 'hover:border-green-500/50 hover:bg-green-500/10' },
}

function getSocialPlatform(key: string): SocialPlatform {
    const lower = key.toLowerCase()
    if (SOCIAL_PLATFORMS[lower]) return SOCIAL_PLATFORMS[lower]
    if (lower.includes('instagram')) return SOCIAL_PLATFORMS.instagram
    if (lower.includes('twitter') || lower.includes('x.com')) return SOCIAL_PLATFORMS.twitter
    if (lower.includes('youtube')) return SOCIAL_PLATFORMS.youtube
    if (lower.includes('tiktok')) return SOCIAL_PLATFORMS.tiktok
    if (lower.includes('weverse')) return SOCIAL_PLATFORMS.weverse
    if (lower.includes('cafe.daum') || lower.includes('fancafe')) return SOCIAL_PLATFORMS.fancafe
    if (lower.includes('naver')) return SOCIAL_PLATFORMS.naverBlog
    if (lower.includes('spotify')) return SOCIAL_PLATFORMS.spotify
    return { icon: Globe, label: key, action: 'Visitar', color: 'text-muted', bg: 'hover:border-border' }
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const params = await props.params;
    const artist = await getArtist(params.slug) as ArtistWithExtras

    if (!artist) {
        return {
            title: 'Artista não encontrado',
            description: 'Este artista não foi encontrado em nossa base de dados.'
        }
    }
    if (artist.isHidden) return { title: 'Artista não encontrado', robots: { index: false, follow: false } }

    // URL com ID puro não deve ser indexada (redirect já redireciona quando há slug)
    // Página renderiza normalmente para AdSense, mas noindex evita validação no Search Console
    if (!artist.slug || (isCuid(params.slug) && artist.slug !== params.slug)) return {
        title: artist.nameRomanized,
        robots: { index: false, follow: false },
    }

    const roles = artist.roles || []
    const GENERIC_BIO = /conhecido\(a\) na ind[uú]stria|talentoso\(a\).*ind[uú]stria|de destaque na ind[uú]stria/i
    const cleanBio = artist.bio && !GENERIC_BIO.test(artist.bio) ? artist.bio : null
    const description = cleanBio || `${artist.nameRomanized}${artist.nameHangul ? ` (${artist.nameHangul})` : ''} - ${roles.join(', ')}${artist.agency ? ` · ${artist.agency.name}` : ''}`
    const isThinContent = !artist.primaryImageUrl && !cleanBio

    const canonicalUrl = `${BASE_URL}/artists/${artist.slug ?? artist.id}`
    const primaryGroup = artist.memberships?.find(m => m.isActive)?.group ?? artist.memberships?.[0]?.group ?? null
    const roleLabels = getRoleLabels(roles)
    const seoTitle = buildArtistSeoTitle({
        name: artist.nameRomanized,
        hangul: artist.nameHangul,
        roleLabels,
        agencyName: artist.agency?.name,
        groupNames: artist.memberships?.map(m => m.group.name),
        productions: artist.productions?.map(item => ({
            titlePt: item.production.titlePt,
            year: item.production.year,
        })),
    })
    const seoDescription = buildArtistSeoDescription({
        name: artist.nameRomanized,
        hangul: artist.nameHangul,
        roleLabels,
        agencyName: artist.agency?.name,
        groupNames: artist.memberships?.map(m => m.group.name),
        productions: artist.productions?.map(item => ({
            titlePt: item.production.titlePt,
            year: item.production.year,
        })),
    })
    const keywords = [
        artist.nameRomanized,
        ...(artist.nameHangul ? [artist.nameHangul] : []),
        ...roles.map(r => `${artist.nameRomanized} ${r}`),
        ...(primaryGroup ? [`${primaryGroup.name}`, `${artist.nameRomanized} ${primaryGroup.name}`] : []),
        ...(artist.seoTags ?? []),
        'K-Pop', 'artista coreano', 'HallyuHub',
    ].filter(Boolean).join(', ')

    return applySeoOverride({
        title: seoTitle,
        description: seoDescription,
        keywords,
        alternates: {
            canonical: canonicalUrl,
            languages: { 'pt-BR': canonicalUrl, 'x-default': canonicalUrl },
        },
        ...(isThinContent ? { robots: { index: false, follow: true } } : {}),
        openGraph: {
            title: `${artist.nameRomanized} | HallyuHub`,
            description: description.slice(0, 160),
            type: 'profile',
            url: `${BASE_URL}/artists/${artist.slug ?? artist.id}`,
            images: artist.primaryImageUrl ? [{ url: artist.primaryImageUrl, width: 1200, height: 630, alt: artist.nameRomanized }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${artist.nameRomanized} | HallyuHub`,
            description: description.slice(0, 160),
            images: artist.primaryImageUrl ? [artist.primaryImageUrl] : [],
        }
    }, 'artist', artist.id)
}

// ── Editorial block renderer ──────────────────────────────────────────────────
// Parses [QUOTE]...[/QUOTE], [DESTAQUE]...[/DESTAQUE] and plain paragraphs
// from the analiseEditorial field and renders rich visual blocks.

type EditorialBlock =
    | { type: 'quote'; text: string }
    | { type: 'destaque'; text: string }
    | { type: 'paragraph'; text: string }

function parseEditorialBlocks(raw: string): EditorialBlock[] {
    const blocks: EditorialBlock[] = []
    let remaining = raw.trim()

    while (remaining.length > 0) {
        const quoteStart = remaining.indexOf('[QUOTE]')
        const destaqueStart = remaining.indexOf('[DESTAQUE]')

        const nextSpecial = [
            quoteStart >= 0 ? quoteStart : Infinity,
            destaqueStart >= 0 ? destaqueStart : Infinity,
        ].reduce((a, b) => Math.min(a, b))

        if (nextSpecial === Infinity) {
            const text = remaining.trim()
            if (text) blocks.push({ type: 'paragraph', text })
            break
        }

        if (nextSpecial > 0) {
            const text = remaining.slice(0, nextSpecial).trim()
            if (text) blocks.push({ type: 'paragraph', text })
            remaining = remaining.slice(nextSpecial)
            continue
        }

        if (remaining.startsWith('[QUOTE]')) {
            const end = remaining.indexOf('[/QUOTE]')
            if (end === -1) { blocks.push({ type: 'paragraph', text: remaining.trim() }); break }
            const text = remaining.slice(7, end).trim()
            if (text) blocks.push({ type: 'quote', text })
            remaining = remaining.slice(end + 8).trim()
            continue
        }

        if (remaining.startsWith('[DESTAQUE]')) {
            const end = remaining.indexOf('[/DESTAQUE]')
            if (end === -1) { blocks.push({ type: 'paragraph', text: remaining.trim() }); break }
            const text = remaining.slice(10, end).trim()
            if (text) blocks.push({ type: 'destaque', text })
            remaining = remaining.slice(end + 11).trim()
            continue
        }

        break
    }

    return blocks
}

function renderEditorialBlocks(raw: string) {
    const blocks = parseEditorialBlocks(raw)
    return blocks.map((block, i) => {
        if (block.type === 'quote') {
            return (
                <blockquote key={i} className="relative pl-5 border-l-2 border-accent my-6">
                    <span className="absolute -top-4 -left-1 text-[72px] leading-none text-accent/20 font-black select-none">"</span>
                    <p className="text-[18px] sm:text-[20px] italic leading-[1.5] text-foreground font-medium">
                        {block.text}
                    </p>
                </blockquote>
            )
        }
        if (block.type === 'destaque') {
            return (
                <div key={i} className="bg-accent/5 border-l-4 border-accent px-5 py-4 my-4">
                    <p className="text-[15px] sm:text-[16px] font-semibold leading-[1.6] text-foreground">
                        {block.text}
                    </p>
                </div>
            )
        }
        // plain paragraph — drop-cap on first
        if (i === 0 || blocks.slice(0, i).every(b => b.type !== 'paragraph')) {
            return (
                <p key={i} className="text-[16px] sm:text-[17px] leading-[1.6] text-[#222] dark:text-[#ccc]">
                    <span className="float-left text-[72px] font-black leading-[0.8] mr-2.5 mt-1 tracking-[-3px] text-foreground">{block.text[0]}</span>
                    {block.text.slice(1)}
                </p>
            )
        }
        return (
            <p key={i} className="text-[16px] sm:text-[17px] leading-[1.6] text-[#222] dark:text-[#ccc]">
                {block.text}
            </p>
        )
    })
}

export default async function ArtistDetailPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    // Step 1: fetch artist (deduplica com generateMetadata via React.cache)
    const artist = await getArtist(params.slug) as ArtistWithExtras

    // Redireciona ID puro para URL canônica com slug (301 permanente para SEO)
    if (artist && isCuid(params.slug) && artist.slug && artist.slug !== params.slug) {
        permanentRedirect(`/artists/${artist.slug}`)
    }

    if (!artist || artist.isHidden) {
        return (
            <div className="pb-20 px-4 sm:px-6 lg:px-12">
                <Breadcrumbs items={[{ label: 'Artistas', href: '/artists' }, { label: 'Não Encontrado' }]} />
                <ErrorMessage
                    title="Artista não encontrado"
                    message="Este artista pode ter sido removido ou o link está incorreto."
                    showSupport={true}
                />
            </div>
        )
    }

    // Step 2: queries secundárias todas em paralelo (incluindo relatedArtists)
    const activeGroupId = artist.memberships.find(m => m.isActive)?.group?.id ?? null
    const productionIds = artist.productions.map(ap => ap.production.id)
    const productionWhere = {
        artistId: artist.id,
        production: {
            flaggedAsNonKorean: false, isHidden: false,
            AND: [
                { OR: [{ ageRating: null }, { ageRating: { not: '18' } }] },
                { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
            ],
        },
    }
    const [_newsCount, bioPt, _productionTranslations, relatedArtists, blogArticles, totalProductions, catalogReleases] = await Promise.all([
        prisma.news.count({ where: { isHidden: false, status: 'published', artists: { some: { artistId: artist.id } } } }).catch(() => 0),
        getTranslation('artist', artist.id, 'bio', 'pt-BR').catch(() => null),
        getTranslations('production', productionIds, ['synopsis']).catch(() => new Map<string, Map<string, string>>()),
        activeGroupId
            ? prisma.artist.findMany({
                where: {
                    id: { not: artist.id },
                    isHidden: false,
                    flaggedAsNonKorean: false,
                    memberships: { some: { groupId: activeGroupId, isActive: true } },
                },
                take: 8,
                select: { id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true, roles: true, gender: true },
                orderBy: { trendingScore: 'desc' },
            }).catch(() => [])
            : Promise.resolve([]),
        prisma.blogPost.findMany({
            where: {
                status: 'PUBLISHED',
                isPrivate: false,
                relatedArtists: { some: { artistId: artist.id } },
            },
            select: { slug: true, title: true, excerpt: true, coverImageUrl: true, publishedAt: true, readingTimeMin: true },
            orderBy: { publishedAt: 'desc' },
            take: 6,
        }).catch(() => []),
        prisma.artistProduction.count({ where: productionWhere }).catch(() => artist.productions.length),
        prisma.musicRelease.findMany({
            where: {
                credits: {
                    some: {
                        musicCatalogArtist: { artistId: artist.id },
                    },
                },
                externalLinks: {
                    some: {
                        entityType: ExternalMusicEntityType.RELEASE,
                        platform: { slug: 'spotify' },
                    },
                },
            },
            select: {
                id: true,
                title: true,
                releaseType: true,
                releaseDate: true,
                coverUrl: true,
                externalLinks: {
                    where: {
                        entityType: ExternalMusicEntityType.RELEASE,
                        platform: { slug: 'spotify' },
                    },
                    select: { url: true },
                    take: 1,
                },
                tracks: {
                    orderBy: [{ discNumber: 'asc' }, { trackNumber: 'asc' }],
                    select: {
                        id: true,
                        title: true,
                        trackNumber: true,
                        durationMs: true,
                        externalLinks: {
                            where: {
                                entityType: ExternalMusicEntityType.TRACK,
                                platform: { slug: 'spotify' },
                            },
                            select: { url: true },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { releaseDate: 'desc' },
            take: 20,
        }).catch(() => []),
    ])

    const discographyReleases = catalogReleases.map(release => ({
        id: release.id,
        title: release.title,
        type: release.releaseType,
        releaseDate: release.releaseDate,
        coverUrl: release.coverUrl,
        spotifyUrl: release.externalLinks[0]?.url ?? null,
        appleMusicUrl: null,
        youtubeUrl: null,
        mbid: null,
        tracks: release.tracks.map(track => ({
            id: track.id,
            title: track.title,
            trackNumber: track.trackNumber,
            durationMs: track.durationMs,
            spotifyUrl: track.externalLinks[0]?.url ?? null,
        })),
    }))

    // Mapa de tmdbId → sinal de streaming (melhor rank por produção)
    const streamingByTmdbId = new Map(
        (artist.streamingSignals ?? []).map(s => [s.showTmdbId, s])
    )

    const roles = artist.roles || []
    const stageNames = artist.stageNames || []
    const socialLinks = (artist.socialLinks as Record<string, string>) || {}
    const birthDate = artist.birthDate ? new Date(artist.birthDate) : null
    const deathDate = artist.deathDate ? new Date(artist.deathDate) : null
    const birthDateFormatted = birthDate?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    const _deathDateFormatted = deathDate?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    const ageRef = deathDate ?? new Date()
    const age = birthDate ? Math.floor((ageRef.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null

    const activeGroup = artist.memberships.find(m => m.isActive)?.group ?? null
    const allGroups = artist.memberships

    // Profile sections: bio as "Perfil" + analiseEditorial sections
    const GENERIC_BIO_RE = /conhecido\(a\) na ind[uú]stria|talentoso\(a\).*ind[uú]stria|de destaque na ind[uú]stria/i
    const profileSections: { title: string; content: string }[] = []
    const cleanBioPt = bioPt && !GENERIC_BIO_RE.test(bioPt) ? bioPt : null
    const cleanBioRaw = artist.bio && !GENERIC_BIO_RE.test(artist.bio) ? artist.bio : null
    const bioText = cleanBioPt ?? cleanBioRaw
    if (artist.analiseEditorial) {
        const pattern = /\*\*([^*\n]{1,30})\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/g
        let m: RegExpExecArray | null
        while ((m = pattern.exec(artist.analiseEditorial)) !== null) {
            const content = m[2].trim()
            if (content) profileSections.push({ title: m[1].trim(), content })
        }
    }
    // Adiciona bio como "Perfil" apenas se analise não tiver essa seção (evita duplicata)
    const hasPerfilInAnalise = profileSections.some(s => s.title.toLowerCase() === 'perfil')
    if (bioText && !hasPerfilInAnalise) profileSections.unshift({ title: 'Perfil', content: bioText })

    const primaryBio = profileSections[0]?.content ?? bioText ?? null
    const debutYear = artist.debutDate ? new Date(artist.debutDate).getUTCFullYear() : null
    const yearsActive = debutYear ? new Date().getFullYear() - debutYear : null
    const dramaCount = artist.productions.filter(({ production: p }) =>
        ['drama', 'mini-série', 'série', 'k-drama', 'sitcom'].some(t => p.type?.toLowerCase().includes(t))
    ).length
    const filmCount = artist.productions.filter(({ production: p }) =>
        ['filme', 'film', 'movie'].some(t => p.type?.toLowerCase().includes(t))
    ).length
    const avgRating = (() => {
        const rated = artist.productions.filter(({ production: p }) => p.voteAverage && p.voteAverage > 0)
        if (!rated.length) return null
        return (rated.reduce((sum, { production: p }) => sum + (p.voteAverage ?? 0), 0) / rated.length)
    })()
    const awardsData = artist.awards as Array<{ premio: string; categoria: string; ano: number }> | null
    const awardsCount = awardsData?.length ?? 0
    const statsBar = [
        { label: 'Avaliação', value: avgRating ? (avgRating / 2).toFixed(1) : '—', sub: avgRating ? `de 5.0 · ${totalProductions} produções` : null },
        { label: 'Favoritos', value: artist.favoriteCount > 999 ? `${(artist.favoriteCount / 1000).toFixed(1)}k` : String(artist.favoriteCount), sub: 'fãs no HallyuHub' },
        { label: 'Prêmios', value: String(awardsCount), sub: awardsCount === 1 ? 'premiação' : 'premiações' },
        { label: 'Telas', value: String(totalProductions), sub: totalProductions === 1 ? 'produção' : 'produções' },
        { label: 'Discografia', value: String(discographyReleases.length), sub: discographyReleases.length === 1 ? 'lançamento' : 'lançamentos' },
        { label: 'Artigos', value: String(blogArticles.length), sub: blogArticles.length === 1 ? 'artigo publicado' : 'artigos publicados' },
    ]
    const quickFacts = [
        ['Nascimento', birthDateFormatted ?? '—'],
        ['Local', artist.placeOfBirth ?? '—'],
        ['Altura', artist.height ? `${artist.height} cm` : '—'],
        ['Agência', artist.agency?.name ?? '—'],
        ['Estreia', debutYear ? String(debutYear) : '—'],
        ['Anos ativos', yearsActive ? String(yearsActive) : '—'],
        ['Dramas', String(dramaCount)],
        ['Filmes', String(filmCount)],
    ] as [string, string][]

    return (
        <div className="min-h-screen bg-background">
            <ViewTracker artistId={artist.id} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": artist.roles?.some(r => ['singer', 'rapper', 'dancer', 'vocalist', 'idol'].includes(r.toLowerCase()))
                    ? ["Person", "MusicArtist"] : "Person",
                "name": artist.nameRomanized,
                "alternateName": [
                    ...(artist.nameHangul ? [artist.nameHangul] : []),
                    ...(artist.stageNames ?? []),
                ].filter(Boolean),
                "description": (artist.bio ?? artist.analiseEditorial)?.slice(0, 300) ?? undefined,
                "image": artist.primaryImageUrl ?? undefined,
                "url": `${BASE_URL}/artists/${artist.slug ?? artist.id}`,
                "birthDate": artist.birthDate ? new Date(artist.birthDate).toISOString().split('T')[0] : undefined,
                "deathDate": deathDate ? deathDate.toISOString().split('T')[0] : undefined,
                "birthPlace": artist.placeOfBirth ? { "@type": "Place", "name": artist.placeOfBirth } : undefined,
                "jobTitle": artist.roles?.[0] ?? undefined,
                ...(artist.debutDate ? { "foundingDate": new Date(artist.debutDate).toISOString().split('T')[0] } : {}),
                "nationality": { "@type": "Country", "name": "Korea, Republic of" },
                ...(activeGroup ? { "memberOf": { "@type": "MusicGroup", "name": activeGroup.name, "url": `${BASE_URL}/groups/${activeGroup.slug ?? activeGroup.id}` } } : {}),
                ...(artist.agency ? { "worksFor": { "@type": "Organization", "name": artist.agency.name } } : {}),
                ...(() => {
                    const links = (artist.socialLinks as Record<string, string> | null) ?? {}
                    const sameAs = Object.values(links).filter(Boolean)
                    return sameAs.length > 0 ? { "sameAs": sameAs } : {}
                })(),
            }} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Artistas", "item": `${BASE_URL}/artists` },
                    { "@type": "ListItem", "position": 2, "name": artist.nameRomanized, "item": `${BASE_URL}/artists/${artist.slug ?? artist.id}` },
                ],
            }} />

            {(() => {
                const faq = artist.faq as { pergunta: string; resposta: string }[] | null
                if (!faq?.length) return null
                return (
                    <JsonLd data={{
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": faq.map(f => ({
                            "@type": "Question",
                            "name": f.pergunta,
                            "acceptedAnswer": { "@type": "Answer", "text": f.resposta },
                        })),
                    }} />
                )
            })()}

            {/* ── BREADCRUMB ── */}
            <div className="border-b border-border/40">
                <div className="page-wrap flex items-center gap-3 py-3">
                    <Breadcrumbs items={[{ label: 'Artistas', href: '/artists' }, { label: artist.nameRomanized }]} className="min-w-0" />
                    <AdminQuickEdit href={`/admin/artists/${artist.id}?returnTo=${encodeURIComponent(`/artists/${artist.id}`)}`} label="Editar" />
                    <span className="ml-auto hidden sm:block text-muted/50">
                        {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* ── HERO ── */}
            <section className="page-wrap py-9">
                <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:gap-10">
                    {/* Portrait */}
                    <div className="relative aspect-[3/4] w-full max-w-[280px] sm:max-w-[360px] mx-auto lg:mx-0 overflow-hidden"
                        style={{ background: 'repeating-linear-gradient(135deg, #f0f0f0 0 12px, #e8e8e8 12px 24px)' }}>
                        {artist.primaryImageUrl && (
                            <Image
                                src={artist.primaryImageUrl}
                                alt={artist.nameRomanized}
                                fill
                                priority
                                sizes="(max-width: 640px) 280px, (max-width: 1024px) 360px, 360px"
                                className="object-cover object-top"
                            />
                        )}
                        {artist.nameHangul && (
                            <div className="absolute top-3.5 left-3.5 bg-foreground text-background font-mono text-[10px] px-2 py-1 leading-none">
                                {artist.nameHangul}
                            </div>
                        )}
                    </div>

                    {/* Hero content */}
                    <div className="flex flex-col min-w-0">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {getRoleLabels(roles, artist.gender).map(role => (
                                <span key={role} className="font-mono text-[11px] px-2 py-1 border border-border rounded-full text-muted">{role}</span>
                            ))}
                            {activeGroup && (
                                <Link href={`/groups/${activeGroup.slug ?? activeGroup.id}`}
                                    className="font-mono text-[11px] px-2 py-1 border border-accent/40 rounded-full text-accent hover:bg-accent/5 transition-colors">
                                    {activeGroup.name}
                                </Link>
                            )}
                            {artist.birthDate && (
                                <AnniversaryCountdown
                                    date={new Date(artist.birthDate).toISOString()}
                                    label="aniversário"
                                    groupName={artist.nameRomanized}
                                />
                            )}
                        </div>

                        {/* Name */}
                        <h1 className="font-black tracking-[-0.04em] leading-[0.92] text-[clamp(48px,7vw,88px)]">
                            {artist.nameRomanized}<BrandDot />
                        </h1>
                        {artist.nameHangul && (
                            <div className="text-[20px] sm:text-[22px] text-muted mt-2 font-medium">
                                {artist.nameHangul}
                                {stageNames.length > 0 && <span className="text-[16px]"> · {stageNames.join(', ')}</span>}
                                {age !== null && <span className="text-[16px]"> · {age} anos{deathDate ? ' †' : ''}</span>}
                            </div>
                        )}

                        {/* Bio blurb */}
                        {primaryBio && (
                            <p className="text-[16px] sm:text-[17px] leading-[1.5] mt-6 text-[#333] dark:text-[#ccc] max-w-[620px]">
                                {primaryBio.slice(0, 320)}
                            </p>
                        )}

                        {/* Quick facts grid 4×2 */}
                        <div className="mt-auto pt-8 grid grid-cols-2 sm:grid-cols-4">
                            {quickFacts.map(([k, v], i) => (
                                <div key={k} className={`border-t border-border py-3 ${i % 2 === 0 ? 'pr-4 sm:pr-0' : ''} ${i % 4 !== 3 ? 'sm:border-r sm:border-border sm:pr-4' : ''}`}>
                                    <div className="font-mono text-[10px] text-muted uppercase tracking-[0.06em]">{k}</div>
                                    <div className="text-[15px] font-semibold mt-1 text-foreground">{v}</div>
                                </div>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-3 mt-6">
                            {/* Row 1: favorite + share + report */}
                            <div className="flex flex-wrap items-center gap-2">
                                <FavoriteButton id={artist.id} itemName={artist.nameRomanized} itemType="artista" />
                                <ShareButtons title={artist.nameRomanized} url={`${BASE_URL}/artists/${artist.slug ?? artist.id}`} />
                                <ReportButton entityType="artist" entityId={artist.id} entityName={artist.nameRomanized} />
                            </div>
                            {/* Row 2: social follow links */}
                            {Object.keys(socialLinks).length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-[10px] text-muted uppercase tracking-[0.08em]">Seguir</span>
                                    {Object.entries(socialLinks).map(([key, url]) => {
                                        const platform = getSocialPlatform(key)
                                        const Icon = typeof platform.icon === 'string' ? null : platform.icon
                                        return (
                                            <a key={key} href={url as string} target="_blank" rel="noopener noreferrer"
                                                className={`flex items-center gap-1.5 px-3 py-2 border border-border text-[12px] font-semibold text-muted transition-colors ${platform.bg} ${platform.color}`}>
                                                {Icon ? <Icon className="w-3.5 h-3.5" /> : <span className="text-sm leading-none">{platform.icon as string}</span>}
                                                {platform.label}
                                            </a>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STATS BAR ── */}
            <section className="border-t border-foreground border-b border-foreground">
                <div className="page-wrap grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                    {statsBar.map((stat, i) => (
                        <div key={stat.label} className={`px-5 py-5 ${i < statsBar.length - 1 ? 'border-r border-border/60' : ''}`}>
                            <div className="font-mono text-[10px] text-muted uppercase tracking-[0.08em]">{stat.label}</div>
                            <div className="text-[38px] sm:text-[42px] font-bold tracking-[-0.04em] leading-none mt-1.5 text-foreground">{stat.value}</div>
                            {stat.sub && <div className="font-mono text-[11px] text-muted mt-1">{stat.sub}</div>}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FILMOGRAFIA ── */}
            {artist.productions.length > 0 && (
                <section id="filmografia" className="page-wrap scroll-mt-20 py-14">
                    <div className="mb-7">
                        <div className="font-mono text-[11px] text-muted tracking-[0.06em]">01 · FILMOGRAFIA</div>
                        <h2 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.04em] leading-tight mt-1.5">Toda a obra, listada</h2>
                    </div>

                    {/* Table — desktop */}
                    <div className="hidden sm:block">
                        <div className="grid font-mono text-[10px] text-muted uppercase tracking-[0.08em] py-2.5 border-b border-foreground"
                            style={{ gridTemplateColumns: '64px 2fr 1fr 120px 48px' }}>
                            <span>Ano</span><span>Título</span><span>Tipo</span><span>Avaliação</span><span className="text-right">★</span>
                        </div>
                        {artist.productions.map(({ production }) => {
                            const rating = production.voteAverage ?? 0
                            const streamSignalRaw = production.tmdbId ? streamingByTmdbId.get(production.tmdbId) : null
                            const streamSignal = streamSignalRaw?.source !== 'internal_production' ? streamSignalRaw : null
                            return (
                                <Link key={production.id} href={`/productions/${production.slug ?? production.id}`}
                                    className="grid items-center py-3.5 border-b border-border/40 text-[14px] hover:bg-surface/50 transition-colors group"
                                    style={{ gridTemplateColumns: '64px 2fr 1fr 120px 48px' }}>
                                    <span className="font-mono text-[13px] text-muted">{production.year ?? '—'}</span>
                                    <span className="font-semibold text-foreground group-hover:text-accent transition-colors pr-4 min-w-0">
                                        <span className="block truncate">{production.titlePt}</span>
                                        {streamSignal && (
                                            <span className="text-[10px] font-black text-accent font-mono">TOP {streamSignal.rank} · {getStreamingConfig(streamSignal.source).label}</span>
                                        )}
                                    </span>
                                    <span className="text-muted text-[12px] pr-4">{production.type}</span>
                                    <span className="flex items-center gap-2 pr-4">
                                        <span className="flex-1 h-1 bg-border overflow-hidden">
                                            <span className="block h-full" style={{ width: `${Math.min((rating / 10) * 100, 100)}%`, background: rating >= 8 ? 'var(--accent, #ee2244)' : '#0a0a0a' }} />
                                        </span>
                                    </span>
                                    <span className="text-right font-mono font-semibold text-[13px]">{rating > 0 ? rating.toFixed(1) : '—'}</span>
                                </Link>
                            )
                        })}
                    </div>

                    {/* Mobile: compact list */}
                    <div className="sm:hidden flex flex-col gap-2">
                        {artist.productions.map(({ production }) => {
                            const streamSignalRaw = production.tmdbId ? streamingByTmdbId.get(production.tmdbId) : null
                            const streamSignal = streamSignalRaw?.source !== 'internal_production' ? streamSignalRaw : null
                            return (
                                <Link key={production.id} href={`/productions/${production.slug ?? production.id}`}
                                    className="flex items-center gap-3 py-3 border-b border-border/40 group">
                                    <div className="relative w-10 h-[54px] shrink-0 overflow-hidden bg-[#efefef]">
                                        {production.imageUrl && (
                                            <Image src={production.imageUrl} alt={production.titlePt} fill sizes="40px" className="object-cover" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-[14px] text-foreground group-hover:text-accent transition-colors truncate">{production.titlePt}</p>
                                        <p className="font-mono text-[11px] text-muted">
                                            {production.year} · {production.type}
                                            {production.voteAverage && production.voteAverage > 0 ? ` · ★ ${production.voteAverage.toFixed(1)}` : ''}
                                            {streamSignal ? ` · TOP ${streamSignal.rank}` : ''}
                                        </p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>

                    {totalProductions > 24 && (
                        <div className="mt-6">
                            <Link href={`/productions?artistId=${artist.id}`}
                                className="font-mono text-[11px] text-muted hover:text-foreground transition-colors border border-border px-4 py-2 inline-flex items-center gap-1">
                                Ver todos os {totalProductions} trabalhos →
                            </Link>
                        </div>
                    )}
                </section>
            )}

            {/* ── BIOGRAFIA ── */}
            {(primaryBio || (artist.curiosidades && artist.curiosidades.length > 0)) && (
                <section className="border-t border-border/40 bg-[#fafafa] dark:bg-surface">
                    <div className="page-wrap py-14">
                        <div className="font-mono text-[11px] text-muted tracking-[0.06em]">02 · BIOGRAFIA</div>
                        <h2 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.04em] leading-tight mt-1.5 mb-8">
                            {artist.nameRomanized}, em profundidade
                        </h2>
                        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
                            {/* Long bio — with rich editorial blocks */}
                            <div className="space-y-5">
                                {renderEditorialBlocks(artist.analiseEditorial ?? primaryBio ?? '')}
                            </div>

                            {/* Curiosidades */}
                            {artist.curiosidades && artist.curiosidades.length > 0 && (
                                <div>
                                    <div className="font-mono text-[10px] text-muted uppercase tracking-[0.08em] mb-3.5">Curiosidades</div>
                                    <ul className="divide-y divide-border/40">
                                        {artist.curiosidades.map((c, i) => {
                                            const historicoMatch = c.match(/^HISTÓRICO\|(\d{4})\|\s*(.+)$/)
                                            if (historicoMatch) {
                                                return (
                                                    <li key={i} className="flex gap-3 py-3.5">
                                                        <span className="font-mono text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 h-fit shrink-0 leading-tight">
                                                            {historicoMatch[1]}
                                                        </span>
                                                        <span className="text-[14px] leading-[1.5] text-[#222] dark:text-[#ccc]">{historicoMatch[2]}</span>
                                                    </li>
                                                )
                                            }
                                            return (
                                                <li key={i} className="flex gap-4 py-3.5 text-[14px] leading-[1.5] text-[#222] dark:text-[#ccc]">
                                                    <span className="font-mono text-[11px] text-muted/60 min-w-[24px] shrink-0 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                                                    <span>{c}</span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Discography */}
                        {discographyReleases.length > 0 && (
                            <div id="discografia" className="scroll-mt-20 mt-12 pt-10 border-t border-border/40">
                                <DiscographySection albums={discographyReleases} />
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ── PRÊMIOS ── */}
            {awardsData && awardsData.length > 0 && (
                <section className="page-wrap py-14">
                    <div className="font-mono text-[11px] text-muted tracking-[0.06em]">03 · PRÊMIOS</div>
                    <h2 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.04em] leading-tight mt-1.5 mb-8">O que já ganhou</h2>
                    <div className="grid sm:grid-cols-2">
                        {awardsData.map((a, i) => (
                            <div key={i} className={`flex gap-4 py-5 border-t border-border/40 ${i % 2 === 0 ? 'sm:pr-7 sm:border-r sm:border-border/40' : 'sm:pl-7'}`}>
                                <div className="font-mono text-[13px] text-accent font-semibold min-w-[44px] shrink-0">{a.ano}</div>
                                <div>
                                    <div className="text-[15px] font-semibold text-foreground">{a.categoria}</div>
                                    <div className="text-[13px] text-muted mt-0.5">{a.premio}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── GRUPOS & CONEXÕES ── */}
            {(relatedArtists.length > 0 || allGroups.length > 0) && (
                <section className="page-wrap border-t border-border/40 py-14">
                    <div className="font-mono text-[11px] text-muted tracking-[0.06em]">
                        {activeGroup ? '04 · CONEXÕES' : '04 · GRUPOS'}
                    </div>
                    <h2 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.04em] leading-tight mt-1.5 mb-8">
                        {relatedArtists.length > 0 && activeGroup ? `Membros de ${activeGroup.name}` : 'Grupos'}
                    </h2>

                    {relatedArtists.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-6">
                            {relatedArtists.map(ra => (
                                <Link key={ra.id} href={`/artists/${ra.id}`} className="group flex flex-col gap-3">
                                    <div className="relative aspect-square overflow-hidden bg-[#efefef]"
                                        style={{ background: 'repeating-linear-gradient(135deg, #f0f0f0 0 10px, #e8e8e8 10px 20px)' }}>
                                        {ra.primaryImageUrl && (
                                            <Image src={ra.primaryImageUrl} alt={ra.nameRomanized} fill sizes="200px" className="object-cover object-top" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-[15px] font-semibold text-foreground group-hover:text-accent transition-colors">{ra.nameRomanized}</div>
                                        {ra.nameHangul && <div className="text-[12px] text-muted mt-0.5">{ra.nameHangul}</div>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {allGroups.length > 0 && relatedArtists.length === 0 && (
                        <div className="flex flex-col divide-y divide-border/40">
                            {allGroups.map(m => {
                                const startYear = m.joinDate ? new Date(m.joinDate).getFullYear() : null
                                const endYear = m.leaveDate ? new Date(m.leaveDate).getFullYear() : null
                                const period = startYear ? (endYear ? `${startYear}–${endYear}` : `${startYear}–presente`) : m.isActive ? 'Ativo' : null
                                return (
                                    <Link key={m.id} href={`/groups/${m.group.slug ?? m.group.id}`}
                                        className="flex items-center gap-4 py-4 group hover:opacity-75 transition-opacity">
                                        <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-[#efefef]">
                                            {m.group.profileImageUrl && (
                                                <Image src={m.group.profileImageUrl} alt={m.group.name} fill sizes="40px" className="object-cover object-top" />
                                            )}
                                        </div>
                                        <div>
                                            <div className={`text-[15px] font-semibold ${m.isActive ? 'text-accent' : 'text-foreground'}`}>{m.group.name}</div>
                                            <div className="font-mono text-[11px] text-muted">{[m.role, period].filter(Boolean).join(' · ')}</div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </section>
            )}

            {/* ── ARTIGOS ── */}
            {blogArticles.length > 0 && (
                <section id="artigos" className="page-wrap scroll-mt-20 border-t border-border/40 py-14">
                    <div className="font-mono text-[11px] text-muted tracking-[0.06em]">05 · LEITURAS</div>
                    <h2 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.04em] leading-tight mt-1.5 mb-8">Artigos publicados</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                        {blogArticles.map((article, i) => (
                            <Link key={article.slug} href={`/blog/${article.slug}`}
                                className={`group flex gap-4 py-5 border-b border-border/40 hover:opacity-75 transition-opacity ${i < 3 ? 'border-t border-border/40' : ''}`}>
                                {article.coverImageUrl && (
                                    <div className="relative h-16 w-[88px] shrink-0 overflow-hidden bg-[#efefef]">
                                        <img src={article.coverImageUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-[14px] font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">{article.title}</p>
                                    <p className="font-mono text-[10px] text-muted mt-1.5">{article.readingTimeMin} min</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ── LOJA ── */}
            <div id="loja" className="scroll-mt-20 border-t border-border/40">
                <div className="page-wrap py-14">
                    <StoreProductsRail
                        entityType="artist"
                        entityId={artist.id}
                        names={[
                            artist.nameRomanized,
                            ...(artist.nameHangul ? [artist.nameHangul] : []),
                            ...(activeGroup ? [activeGroup.name] : []),
                        ]}
                        contentType={inferContentType(artist.roles ?? [], artist.productions.map(ap => ap.production))}
                        title={`Produtos — ${artist.nameRomanized}`}
                        limit={6}
                    />
                </div>
            </div>

            <ScrollToTop />
        </div>
    )
}
