import prisma from '@/lib/prisma'
import { applySeoOverride } from '@/lib/seo/apply-override'
import { cache } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import { FavoriteButton } from '@/components/ui/FavoriteButton'
import { ReportButton } from '@/components/ui/ReportButton'
import { AdminQuickEdit } from '@/components/ui/AdminQuickEdit'
import { ViewTracker } from '@/components/features/ViewTracker'
import { fetchGroupThemeColor, buildGroupThemeVars, toRgba } from '@/lib/fetch-group-theme'
import { Globe, Users, Calendar, Eye, Music, ExternalLink, Play } from 'lucide-react'
import { Instagram, Twitter, Youtube } from '@/components/ui/BrandIcons'
import { AnniversaryCountdown } from '@/components/ui/AnniversaryCountdown'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { getTranslation } from '@/lib/translations'
import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'

import { SITE_URL } from '@/lib/constants/site'
import { StoreProductsRail } from '@/components/store/StoreProductsRail'
import { DiscographySection } from '@/components/features/DiscographySection'
import { GroupSpotifyEmbed } from '@/components/groups/GroupSpotifyEmbed'
import { GroupMVPlayer } from '@/components/groups/GroupMVPlayer'
import { GroupAnimatedStats } from '@/components/groups/GroupAnimatedStats'
import { GroupSocialPresence } from '@/components/groups/GroupSocialPresence'
import { GroupTrophyWall } from '@/components/groups/GroupTrophyWall'
import { GroupColorIdentity } from '@/components/groups/GroupColorIdentity'
import { GroupMemberCard } from '@/components/groups/GroupMemberCard'
import { GroupMemberPoll } from '@/components/groups/GroupMemberPoll'
import { GroupErasTimeline } from '@/components/groups/GroupErasTimeline'
import { ExternalMusicEntityType } from '@prisma/client'
const BASE_URL = SITE_URL

// ISR: página cacheada 1h — revalidada sob demanda via revalidatePath no admin
export const revalidate = 3600

// Pré-gera todos os grupos no build → first-paint rápido, melhor SEO e Core Web Vitals
export async function generateStaticParams() {
    if (process.env.SKIP_BUILD_STATIC_GENERATION) return []
    const groups = await prisma.musicalGroup.findMany({
        where: { isHidden: false, slug: { not: null } },
        select: { slug: true },
        orderBy: { updatedAt: 'desc' },
        take: 200,
    })
    return groups.map(g => ({ slug: g.slug! }))
}

// Detecta se o parâmetro é um CUID (legado) ou slug
const isCuid = (param: string) => /^c[a-z0-9]{24}$/.test(param)

// React.cache deduplica a query dentro do mesmo render pass (generateMetadata + page)
const getGroup = cache(async (slugOrId: string) => {
    const where = isCuid(slugOrId) ? { id: slugOrId } : { slug: slugOrId }
    return prisma.musicalGroup.findFirst({
        where,
        include: {
            agency: true,
            members: {
                include: {
                    artist: {
                        select: {
                            id: true,
                            slug: true,
                            nameRomanized: true,
                            nameHangul: true,
                            primaryImageUrl: true,
                            roles: true,
                            gender: true,
                            birthDate: true,
                            height: true,
                            birthName: true,
                        },
                    },
                },
                orderBy: [{ isActive: 'desc' }, { position: 'asc' }, { joinDate: 'asc' }],
            },
        },
    }).catch(() => null)
})

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const params = await props.params;
    const group = await getGroup(params.slug)
    if (!group) return { title: 'Grupo não encontrado' }
    if (group.isHidden) return { title: 'Grupo não encontrado', robots: { index: false, follow: false } }
    const description = group.bio || `${group.name}${group.nameHangul ? ` (${group.nameHangul})` : ''} - Grupo musical K-pop`
    const isThinContent = !group.profileImageUrl && !group.bio
    const canonicalSlug = group.slug ?? group.id
    const canonicalUrl = `${BASE_URL}/groups/${canonicalSlug}`
    const memberNames = group.members?.slice(0, 5).map(m => m.artist.nameRomanized) ?? []
    const keywords = [
        group.name,
        ...(group.nameHangul ? [group.nameHangul] : []),
        `${group.name} K-Pop`,
        `${group.name} membros`,
        ...memberNames,
        'grupo K-Pop', 'K-Pop Brasil', 'HallyuHub',
    ].filter(Boolean).join(', ')
    return applySeoOverride({
        title: `${group.name}${group.nameHangul ? ` (${group.nameHangul})` : ''}`,
        description: description.slice(0, 160),
        keywords,
        alternates: {
            canonical: canonicalUrl,
            languages: { 'pt-BR': canonicalUrl, 'x-default': canonicalUrl },
        },
        ...(isThinContent ? { robots: { index: false, follow: true } } : {}),
        openGraph: {
            title: `${group.name} | HallyuHub`,
            description: description.slice(0, 160),
            images: group.profileImageUrl ? [{ url: group.profileImageUrl, width: 1200, height: 630, alt: group.name }] : [],
            type: 'website',
            url: `${BASE_URL}/groups/${canonicalSlug}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${group.name} | HallyuHub`,
            description: description.slice(0, 160),
            images: group.profileImageUrl ? [group.profileImageUrl] : [],
        },
    }, 'group', group.id)
}

export default async function GroupDetailPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const group = await getGroup(params.slug)

    // Redireciona ID puro para URL canônica com slug (301 permanente para SEO)
    if (group && isCuid(params.slug) && group.slug && group.slug !== params.slug) {
        permanentRedirect(`/groups/${group.slug}`)
    }

    if (!group || group.isHidden) notFound()

    const activeMembers = group.members.filter(m => m.isActive)
    const formerMembers = group.members.filter(m => !m.isActive)
    const curiosidades = group.curiosidades ?? []
    const analiseEditorial = group.analiseEditorial ?? null
    const debutYear = group.debutDate ? new Date(group.debutDate).getUTCFullYear() : null
    const disbandYear = group.disbandDate ? new Date(group.disbandDate).getUTCFullYear() : null
    const currentYear = new Date().getFullYear()
    const yearsActive = debutYear ? (disbandYear ?? currentYear) - debutYear : null
    const socialLinks = (group.socialLinks as Record<string, string>) || {}
    const fanClubName = group.fanClubName ?? null
    const officialColorRaw = group.officialColor ?? null
    const nameMeaning = group.nameMeaning ?? null
    const videos = (group.videos as Array<{ title: string; url: string }>) || []
    const websiteUrl = socialLinks.website ?? socialLinks.Website ?? socialLinks.official ?? null
    const roleBreakdown = Array.from(
        activeMembers.reduce((map, member) => {
            const role = member.role?.trim() || 'Membro'
            map.set(role, (map.get(role) ?? 0) + 1)
            return map
        }, new Map<string, number>())
    )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)

    const postSelect = {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImageUrl: true,
        publishedAt: true,
        readingTimeMin: true,
        category: { select: { name: true } },
    } as const

    const relevanceTerms = [group.name, group.nameHangul].filter(Boolean) as string[]

    // Step 2: queries secundárias todas em paralelo
    const [bioPt, themeColorFetched, relatedGroups, linkedPosts, fallbackPosts, catalogReleases, spotifyProfileLink] = await Promise.all([
        getTranslation('group', group.id, 'bio', 'pt-BR').catch(() => null),
        !officialColorRaw && websiteUrl ? fetchGroupThemeColor(websiteUrl) : Promise.resolve(null),
        prisma.musicalGroup.findMany({
            where: {
                id: { not: group.id },
                isHidden: false,
                ...(group.agencyId
                    ? { agencyId: group.agencyId }
                    : debutYear
                        ? { debutDate: { gte: new Date(`${debutYear - 3}-01-01`), lte: new Date(`${debutYear + 3}-12-31`) } }
                        : { id: 'never' }
                ),
            },
            take: 6,
            orderBy: { trendingScore: 'desc' },
            select: { id: true, slug: true, name: true, profileImageUrl: true, disbandDate: true },
        }).catch(() => []),
        prisma.blogPost.findMany({
            where: {
                status: 'PUBLISHED',
                isPrivate: false,
                relatedGroups: { some: { groupId: group.id } },
            },
            take: 6,
            orderBy: { publishedAt: 'desc' },
            select: postSelect,
        }).catch(() => []),
        relevanceTerms.length > 0
            ? prisma.blogPost.findMany({
                where: {
                    status: 'PUBLISHED',
                    isPrivate: false,
                    OR: relevanceTerms.flatMap((term) => [
                        { title: { contains: term, mode: 'insensitive' } },
                        { excerpt: { contains: term, mode: 'insensitive' } },
                        { contentMd: { contains: term, mode: 'insensitive' } },
                        { tags: { has: term } },
                    ]),
                },
                take: 10,
                orderBy: { publishedAt: 'desc' },
                select: postSelect,
            }).catch(() => [])
            : Promise.resolve([]),
        prisma.musicRelease.findMany({
            where: {
                credits: {
                    some: {
                        musicCatalogArtist: { groupId: group.id },
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
        prisma.externalMusicEntity.findFirst({
            where: {
                entityType: ExternalMusicEntityType.ARTIST,
                musicCatalogArtist: { groupId: group.id },
                platform: { slug: 'spotify' },
            },
            select: { url: true },
        }).catch(() => null),
    ])

    const linkedPostIds = new Set(linkedPosts.map((p) => p.id))
    const relatedPosts = [
        ...linkedPosts.map((p) => ({ ...p, source: 'linked' as const })),
        ...fallbackPosts
            .filter((p) => !linkedPostIds.has(p.id))
            .map((p) => ({ ...p, source: 'recommended' as const })),
    ].slice(0, 6)
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
    const spotifyUrl = spotifyProfileLink?.url ?? null
    const visibleSocialLinks = Object.entries(socialLinks)
        .filter(([key]) => !['website', 'Website', 'official'].includes(key))
        .filter(([key]) => !key.toLowerCase().includes('spotify'))
    const sameAsLinks = [
        ...Object.entries(socialLinks)
            .filter(([key]) => !key.toLowerCase().includes('spotify'))
            .map(([, url]) => url),
        ...(spotifyUrl ? [spotifyUrl] : []),
    ].filter(Boolean)

    const themeColor = officialColorRaw ?? themeColorFetched
    const accent = themeColor ?? '#9333ea'
    const themeVars = buildGroupThemeVars(themeColor)

    const memberPersons = activeMembers.slice(0, 15).map(m => ({
        "@type": "Person",
        "name": m.artist.nameRomanized,
        "url": `${BASE_URL}/artists/${m.artist.slug ?? m.artist.id}`,
    }))

    return (
        <div className="min-h-screen overflow-x-hidden bg-background" style={themeVars}>
            <ViewTracker groupId={group.id} />
            {/* Estilos dinâmicos baseados na cor do grupo */}
            <style dangerouslySetInnerHTML={{ __html: `
                .group:hover .group-accent-badge { background: ${toRgba(accent, 0.85)}; }
                .group:hover .member-card-border { border-color: ${toRgba(accent, 0.45)}; box-shadow: 0 20px 40px ${toRgba(accent, 0.1)}; }
                .news-card:hover { border-color: ${toRgba(accent, 0.35)} !important; }
                .album-card:hover { border-color: ${toRgba(accent, 0.35)} !important; box-shadow: 0 0 20px ${toRgba(accent, 0.15)}; }
                .album-title { transition: color 0.2s; }
                .album-title:hover { color: ${accent}; }
                .related-group-link:hover .related-group-name { color: ${accent}; }
                .mv-card:hover { border-color: ${toRgba(accent, 0.4)} !important; }
            ` }} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "MusicGroup",
                "name": group.name,
                "alternateName": group.nameHangul ?? undefined,
                "description": group.bio?.slice(0, 300) ?? undefined,
                "image": group.profileImageUrl ?? undefined,
                "url": `${BASE_URL}/groups/${group.slug ?? group.id}`,
                "genre": "K-Pop",
                "foundingLocation": { "@type": "Country", "name": "Korea, Republic of" },
                ...(debutYear ? { "foundingDate": String(debutYear) } : {}),
                ...(disbandYear ? { "dissolutionDate": String(disbandYear) } : {}),
                ...(group.agency ? { "memberOf": { "@type": "Organization", "name": group.agency.name } } : {}),
                ...(memberPersons.length ? { "member": memberPersons } : {}),
                ...(sameAsLinks.length > 0 ? { "sameAs": sameAsLinks } : {}),
            }} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Grupos", "item": `${BASE_URL}/groups` },
                    { "@type": "ListItem", "position": 2, "name": group.name, "item": `${BASE_URL}/groups/${group.slug ?? group.id}` },
                ],
            }} />
            {/* ── BREADCRUMB ── */}
            <div className="border-b border-border/40">
                <div className="page-wrap flex items-center gap-3 py-3">
                    <Breadcrumbs items={[{ label: 'Grupos', href: '/groups' }, { label: group.name }]} className="min-w-0" />
                    <AdminQuickEdit href={`/admin/groups/${group.id}?returnTo=${encodeURIComponent(`/groups/${group.id}`)}`} label="Editar" />
                </div>
            </div>

            {/* ── HERO FULL-BLEED ── */}
            <div className="relative w-full overflow-hidden" style={{ minHeight: '480px', maxHeight: '600px', height: '60vh' }}>
                {group.profileImageUrl ? (
                    <Image
                        src={group.profileImageUrl}
                        alt={group.name}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover object-top"
                    />
                ) : (
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${toRgba(accent, 0.3)}, ${toRgba(accent, 0.05)})` }} />
                )}
                {/* Multi-layer gradient overlay */}
                <div className="absolute inset-0" style={{
                    background: `linear-gradient(to bottom, ${toRgba(accent, 0.15)} 0%, transparent 25%, rgba(0,0,0,0.15) 55%, var(--color-background, #0a0a0a) 100%)`
                }} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                {/* Left accent stripe */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: accent }} />
                {/* Content overlay */}
                <div className="absolute inset-0 flex flex-col justify-end">
                    <div className="page-wrap pb-8 sm:pb-10">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="border border-white/25 bg-black/50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/80 backdrop-blur-sm">
                                {disbandYear ? `disbandado · ${disbandYear}` : 'ativo'}
                            </span>
                            {debutYear && (() => {
                                const genLabel =
                                    debutYear <= 2002 ? '1ª geração' :
                                    debutYear <= 2011 ? '2ª geração' :
                                    debutYear <= 2017 ? '3ª geração' :
                                    debutYear <= 2022 ? '4ª geração' : '5ª geração'
                                return (
                                    <span className="border border-white/25 bg-black/50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/80 backdrop-blur-sm">
                                        {genLabel}
                                    </span>
                                )
                            })()}
                            {group.agency && (
                                <span className="border border-white/25 bg-black/50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white/80 backdrop-blur-sm">
                                    {group.agency.name}
                                </span>
                            )}
                        </div>
                        <h1 className="font-display font-black leading-[0.82] tracking-[-0.06em] text-white drop-shadow-2xl"
                            style={{ fontSize: 'clamp(52px, 10vw, 140px)' }}>
                            {group.name}
                        </h1>
                        {group.nameHangul && (
                            <p className="mt-2 text-xl font-semibold sm:text-2xl drop-shadow" style={{ color: accent }}>{group.nameHangul}</p>
                        )}
                        {fanClubName && (
                            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">
                                fandom: <strong className="text-white/90">{fanClubName}</strong>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── STATS BAR — animado ── */}
            <GroupAnimatedStats
                accent={accent}
                stats={[
                    { label: 'membros ativos', value: activeMembers.length.toLocaleString('pt-BR') },
                    ...(debutYear ? [{ label: 'ano de debut', value: String(debutYear) }] : []),
                    ...(yearsActive !== null ? [{ label: 'anos de carreira', value: `${yearsActive}a` }] : []),
                    ...(group.viewCount > 0 ? [{ label: 'visualizações', value: group.viewCount.toLocaleString('pt-BR') }] : []),
                    ...(group.favoriteCount > 0 ? [{ label: 'fãs', value: group.favoriteCount.toLocaleString('pt-BR') }] : []),
                ]}
            />

            {/* ── ACTIONS ── */}
            <div className="border-b border-border/50">
                <div className="page-wrap py-3 flex flex-wrap items-center gap-2">
                    <ReportButton entityType="group" entityId={group.id} entityName={group.name} />
                    <FavoriteButton id={group.id} itemName={group.name} itemType="grupo" />
                    {websiteUrl && (
                        <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs font-bold text-muted transition-colors hover:border-foreground hover:text-foreground">
                            <Globe className="h-3.5 w-3.5" />
                            Site oficial
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    )}
                    {spotifyUrl && (
                        <a href={spotifyUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-bold text-green-400 transition-colors hover:bg-green-500/20">
                            <Music className="h-3.5 w-3.5" />
                            Spotify
                        </a>
                    )}
                    {group.debutDate && !disbandYear && (
                        <div className="ml-auto">
                            <AnniversaryCountdown
                                date={group.debutDate.toISOString()}
                                label="aniversário de debut"
                                groupName={group.name}
                            />
                        </div>
                    )}
                </div>
            </div>
            {/* ── CONTEÚDO ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
                <div className="mb-8">
                    <div className="border-y border-foreground bg-background py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3">Navegação rápida</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {activeMembers.length > 0 && (
                                <a href="#membros" className="border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground">Membros</a>
                            )}
                            {activeMembers.length >= 2 && (
                                <a href="#poll" className="border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground">Votação</a>
                            )}
                            {relatedGroups.length > 0 && (
                                <a href="#relacionados" className="border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground">Relacionados</a>
                            )}
                            {discographyReleases.length > 0 && (
                                <a href="#discografia" className="border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground">Discografia</a>
                            )}
                            {relatedPosts.length > 0 && (
                                <a href="#artigos" className="border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground">Artigos</a>
                            )}
                            {videos.length > 0 && (
                                <a href="#mvs" className="border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground">MVs</a>
                            )}
                            {curiosidades.length > 0 && (
                                <a href="#conquistas" className="border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground">Hall da Fama</a>
                            )}
                            {analiseEditorial && (
                                <a href="#analise" className="border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground">Análise</a>
                            )}
                            {officialColorRaw && (
                                <a href="#identidade" className="border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground">Identidade</a>
                            )}
                            {curiosidades.some(c => c.startsWith('HISTÓRICO|')) && (
                                <a href="#timeline" className="border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground">Timeline</a>
                            )}
                            {(Object.keys(socialLinks).length > 0 || spotifyUrl) && (
                                <a href="#redes" className="border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground">Redes</a>
                            )}
                            {formerMembers.length > 0 && (
                                <a href="#ex-membros" className="border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground">Ex-membros</a>
                            )}
                        </div>
                    </div>
                </div>
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">

                    {/* ── SIDEBAR ── */}
                    <div className="order-2 space-y-5 lg:order-2">

                        {/* Identidade visual — cor oficial + fandom */}
                        {(officialColorRaw || fanClubName) && (
                            <div className="border border-border overflow-hidden">
                                {officialColorRaw && (
                                    <div className="h-2 w-full" style={{ background: `linear-gradient(to right, ${officialColorRaw}, ${toRgba(officialColorRaw, 0.4)})` }} />
                                )}
                                <div className="p-4 flex items-center gap-4 bg-background">
                                    {officialColorRaw && (
                                        <div className="h-12 w-12 flex-shrink-0 border border-border/50"
                                            style={{ background: officialColorRaw }} />
                                    )}
                                    <div className="min-w-0">
                                        {officialColorRaw && (
                                            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted">Cor oficial</p>
                                        )}
                                        {officialColorRaw && (
                                            <p className="text-sm font-black text-foreground font-mono">{officialColorRaw}</p>
                                        )}
                                        {fanClubName && (
                                            <p className="text-xs text-muted mt-0.5">Fandom: <strong className="text-foreground">{fanClubName}</strong></p>
                                        )}
                                    </div>
                                    {group.agency && (
                                        <div className="ml-auto text-right shrink-0">
                                            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted">Agência</p>
                                            <Link href={`/agencies/${group.agency.slug ?? group.agency.id}`}
                                                className="text-sm font-black transition-colors hover:opacity-80"
                                                style={{ color: accent }}>
                                                {group.agency.name}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bio */}
                        {(bioPt ?? group.bio) && (
                            <div className="relative border border-border bg-background p-5" style={{ borderTopColor: accent, borderTopWidth: 2 }}>
                                <h3 className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">Sobre o grupo</h3>
                                <p className="text-sm leading-relaxed text-foreground">{bioPt ?? group.bio}</p>
                            </div>
                        )}

                        {/* Info compacta */}
                        <div className="border border-border bg-background divide-y divide-border">
                            <div className="px-4 py-2">
                                <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Informações</p>
                            </div>
                            {debutYear && (
                                <InfoRow
                                    icon={<Calendar className="w-3.5 h-3.5" />}
                                    label="Debut"
                                    value={group.debutDate ? new Date(group.debutDate).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : String(debutYear)}
                                />
                            )}
                            {disbandYear && (
                                <InfoRow
                                    icon={<Calendar className="w-3.5 h-3.5" />}
                                    label="Disbandado"
                                    value={String(disbandYear)}
                                />
                            )}
                            {yearsActive !== null && (
                                <InfoRow
                                    icon={<Music className="w-3.5 h-3.5" />}
                                    label="Carreira"
                                    value={`${yearsActive} ${yearsActive === 1 ? 'ano' : 'anos'} de atividade`}
                                />
                            )}
                            <InfoRow
                                icon={<Users className="w-3.5 h-3.5" />}
                                label="Membros"
                                value={`${activeMembers.length} ativo${activeMembers.length !== 1 ? 's' : ''}${formerMembers.length > 0 ? ` · ${formerMembers.length} ex` : ''}`}
                            />
                            {(group.viewCount > 0 || group.favoriteCount > 0) && (
                                <div className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-2 text-muted">
                                        <Eye className="w-3.5 h-3.5" />
                                        <span className="text-xs font-black uppercase tracking-widest">Engajamento</span>
                                    </div>
                                    <div className="text-right">
                                        {group.viewCount > 0 && <span className="text-xs font-bold text-foreground">{group.viewCount.toLocaleString('pt-BR')} views</span>}
                                        {group.viewCount > 0 && group.favoriteCount > 0 && <span className="mx-1.5 text-muted">·</span>}
                                        {group.favoriteCount > 0 && <span className="text-xs font-bold text-foreground">{group.favoriteCount.toLocaleString('pt-BR')} fãs</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Formação — role breakdown */}
                        {roleBreakdown.length > 0 && (
                            <div className="border border-border bg-background p-4">
                                <h3 className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">Composição atual</h3>
                                <div className="space-y-2">
                                    {roleBreakdown.map(([role, count]) => {
                                        const pct = Math.max(8, Math.round((count / activeMembers.length) * 100))
                                        return (
                                            <div key={role}>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="font-semibold text-foreground">{role}</span>
                                                    <span className="text-muted font-mono">{count}</span>
                                                </div>
                                                <div className="h-1 overflow-hidden bg-surface">
                                                    <div className="h-full transition-all" style={{ width: `${pct}%`, background: accent }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Links externos — compacto */}
                        {(websiteUrl || spotifyUrl || visibleSocialLinks.length > 0) && (
                            <div className="border border-border bg-background divide-y divide-border">
                                <div className="px-4 py-2">
                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Links</p>
                                </div>
                                {websiteUrl && (
                                    <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-4 w-4 flex-shrink-0 border border-border" style={{ background: accent }} />
                                            <span className="text-sm font-bold text-foreground">
                                                {(() => { try { return new URL(websiteUrl).hostname.replace(/^www\./, '') } catch { return 'Site oficial' } })()}
                                            </span>
                                        </div>
                                        <ExternalLink className="w-3.5 h-3.5 text-muted" />
                                    </a>
                                )}
                                {spotifyUrl && (
                                    <a href={spotifyUrl} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface">
                                        <div className="flex items-center gap-2.5">
                                            <Music className="w-4 h-4 text-green-500" />
                                            <span className="text-sm font-bold text-foreground">Spotify</span>
                                        </div>
                                        <ExternalLink className="w-3.5 h-3.5 text-muted" />
                                    </a>
                                )}
                                {visibleSocialLinks.map(([platform, url]) => (
                                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface">
                                        <div className="flex items-center gap-2.5">
                                            <SocialIcon platform={platform} />
                                            <span className="text-sm font-bold text-foreground">{PLATFORM_LABEL[platform.toLowerCase()] ?? platform}</span>
                                        </div>
                                        <ExternalLink className="w-3.5 h-3.5 text-muted" />
                                    </a>
                                ))}
                            </div>
                        )}

                    </div>

                    {/* ── MAIN ── */}
                    <div className="order-1 min-w-0 space-y-10 lg:order-1 lg:space-y-14">

                        {/* Membros atuais */}
                        {activeMembers.length > 0 && (
                            <section id="membros">
                                <SectionHeader icon={<Users className="w-5 h-5" />} title="Membros" count={activeMembers.length} countLabel={activeMembers.length === 1 ? 'membro' : 'membros'} accent={accent} />
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                    {activeMembers.map(member => (
                                        <GroupMemberCard
                                            key={member.id}
                                            member={member}
                                            accent={accent}
                                            isLeader={member.role?.toLowerCase().includes('leader') || member.role?.toLowerCase().includes('líder')}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ── POLL — membro favorito ── */}
                        {activeMembers.length >= 2 && (
                            <GroupMemberPoll
                                members={activeMembers.map(m => ({
                                    id: m.artist.id,
                                    slug: m.artist.slug,
                                    nameRomanized: m.artist.nameRomanized,
                                    nameHangul: m.artist.nameHangul,
                                    primaryImageUrl: m.artist.primaryImageUrl,
                                    role: m.role,
                                }))}
                                accent={accent}
                                groupName={group.name}
                            />
                        )}

                        {/* ── NÚMEROS DE IMPACTO — extraído dos facts (não HISTÓRICO) ── */}
                        {(() => {
                            const allNumRegex = /(\d[\d.,]*\s*(?:bilhões|bilhão|milhões|milhão|bi|mi)?(?:h(?=\s|$))?)/g
                            const isYear = (n: string) => /^\d{4}$/.test(n.trim()) && parseInt(n) <= 2100
                            const factsOnly = curiosidades.filter(c => !c.startsWith('HISTÓRICO|'))
                            const impactFacts = factsOnly
                                .map(c => {
                                    // Encontrar o primeiro número que NÃO seja um ano
                                    const matches = [...c.matchAll(allNumRegex)]
                                    const hit = matches.find(m => !isYear(m[1]))
                                    if (!hit) return null
                                    const numStr = hit[1].trim()
                                    const idx = hit.index ?? c.indexOf(numStr)
                                    const after = c.slice(idx + numStr.length).trim()
                                    const label = after.split(/[,;.]/)[0].trim().slice(0, 55) || c.slice(0, 45)
                                    const sub = c.slice(0, 90)
                                    return { number: numStr, label, sub }
                                })
                                .filter(Boolean)
                                .slice(0, 3)

                            if (impactFacts.length === 0) return null
                            return (
                                <section id="numeros">
                                    <SectionHeader icon={<Eye className="w-5 h-5" />} title="Em Números" accent={accent} />
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {impactFacts.map((f, i) => (
                                            <div key={i} className="relative overflow-hidden border border-border bg-background p-5"
                                                style={{ borderTopColor: accent, borderTopWidth: 2 }}>
                                                <div className="absolute -bottom-2 -right-1 font-display text-[72px] font-black leading-none opacity-[0.05] select-none pointer-events-none"
                                                    style={{ color: accent }}>{f!.number}</div>
                                                <p className="font-display text-4xl font-black leading-none mb-2" style={{ color: accent }}>{f!.number}</p>
                                                <p className="text-xs font-black text-foreground uppercase tracking-widest leading-snug">{f!.label}</p>
                                                <p className="text-[10px] text-muted mt-2 leading-relaxed line-clamp-2">{f!.sub}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )
                        })()}

                        {/* ── TROPHY WALL ── */}
                        {curiosidades.length > 0 && (
                            <GroupTrophyWall curiosidades={curiosidades} accent={accent} groupName={group.name} />
                        )}

                        {/* ── ANÁLISE EDITORIAL — parsing de blocos ── */}
                        {analiseEditorial && (
                            <section id="analise">
                                <SectionHeader icon={<Music className="w-5 h-5" />} title="Análise Editorial" accent={accent} />
                                <div className="space-y-4">
                                    {analiseEditorial.split('\n\n').map((para, i) => {
                                        const quoteMatch = para.match(/^\[QUOTE\]([\s\S]*?)\[\/QUOTE\]/)
                                        const destaqueMatch = para.match(/^\[DESTAQUE\]([\s\S]*?)\[\/DESTAQUE\]/)
                                        if (quoteMatch) {
                                            return (
                                                <blockquote key={i} className="pl-5 py-4 pr-5 italic"
                                                    style={{ borderLeft: `4px solid ${accent}`, background: toRgba(accent, 0.05) }}>
                                                    <p className="text-sm leading-relaxed sm:text-base" style={{ color: accent }}>
                                                        &ldquo;{quoteMatch[1].trim()}&rdquo;
                                                    </p>
                                                </blockquote>
                                            )
                                        }
                                        if (destaqueMatch) {
                                            return (
                                                <div key={i} className="py-8 px-6 text-center"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${toRgba(accent, 0.07)}, ${toRgba(accent, 0.02)})`,
                                                        border: `1px solid ${toRgba(accent, 0.2)}`,
                                                    }}>
                                                    <p className="text-xl sm:text-2xl font-black leading-snug text-foreground italic">
                                                        &ldquo;{destaqueMatch[1].trim()}&rdquo;
                                                    </p>
                                                </div>
                                            )
                                        }
                                        return (
                                            <p key={i} className="text-sm leading-[1.9] text-foreground sm:text-[15px]">{para}</p>
                                        )
                                    })}
                                    <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${toRgba(accent, 0.15)}` }}>
                                        <div className="h-0.5 w-6 flex-shrink-0" style={{ background: accent }} />
                                        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted">Editorial HallyuHub — análise independente</p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* ── LINHA DO TEMPO ── */}
                        <GroupErasTimeline
                            historico={curiosidades}
                            accent={accent}
                            groupName={group.name}
                        />

                        <StoreProductsRail
                            entityType="group"
                            entityId={group.id}
                            names={[
                                group.name,
                                ...(group.nameHangul ? [group.nameHangul] : []),
                            ]}
                            contentType="kpop"
                            title={`Produtos — ${group.name}`}
                            limit={6}
                        />

                        {relatedPosts.length > 0 && (
                            <section id="artigos">
                                {(() => {
                                    const linked = relatedPosts.filter((post) => post.source === 'linked')
                                    const recommended = relatedPosts.filter((post) => post.source === 'recommended')
                                    // Se tem 4+ artigos vinculados, não mostrar recomendados (evita artigos não relacionados)
                                    const showRecommended = linked.length < 4

                                    const renderPostCard = (post: (typeof relatedPosts)[number]) => (
                                        <Link
                                            key={post.id}
                                            href={`/blog/${post.slug}`}
                                            className="group block overflow-hidden border border-border bg-background transition-colors hover:border-foreground/50"
                                        >
                                            <div className="relative aspect-[16/9] bg-surface">
                                                {post.coverImageUrl ? (
                                                    <Image
                                                        src={post.coverImageUrl}
                                                        alt={post.title}
                                                        fill
                                                        sizes="(max-width: 640px) 100vw, 50vw"
                                                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center" style={{ background: toRgba(accent, 0.12) }}>
                                                        <Music className="w-7 h-7" style={{ color: toRgba(accent, 0.7) }} />
                                                    </div>
                                                )}
                                                {post.category?.name && (
                                                    <span className="absolute left-2 top-2 bg-black/60 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-white/90">
                                                        {post.category.name}
                                                    </span>
                                                )}
                                                <span
                                                    className={`absolute right-2 top-2 border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] ${
                                                        post.source === 'linked'
                                                            ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/35'
                                                            : 'bg-sky-500/20 text-sky-100 border-sky-400/35'
                                                    }`}
                                                >
                                                    {post.source === 'linked' ? 'Vinculado' : 'Recomendado'}
                                                </span>
                                            </div>
                                            <div className="p-3.5">
                                                <h3 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                                                    {post.title}
                                                </h3>
                                                {post.excerpt && (
                                                    <p className="text-xs text-muted line-clamp-2 mt-1.5">{post.excerpt}</p>
                                                )}
                                                <div className="flex items-center gap-2 text-[10px] text-muted mt-2.5">
                                                    {post.publishedAt && (
                                                        <span>{new Date(post.publishedAt).toLocaleDateString('pt-BR')}</span>
                                                    )}
                                                    <span>·</span>
                                                    <span>{post.readingTimeMin} min</span>
                                                </div>
                                            </div>
                                        </Link>
                                    )

                                    const totalVisible = linked.length + (showRecommended ? recommended.length : 0)
                                    return (
                                        <div>
                                            <SectionHeader icon={<Music className="w-5 h-5" />} title="Artigos Relacionados" count={totalVisible} accent={accent} />
                                            <div className="space-y-5">
                                                {linked.length > 0 && (
                                                    <div>
                                                        {showRecommended && <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Vinculados</p>}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {linked.map(renderPostCard)}
                                                        </div>
                                                    </div>
                                                )}
                                                {showRecommended && recommended.length > 0 && (
                                                    <div>
                                                        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Descobertas por relevância</p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {recommended.map(renderPostCard)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })()}
                            </section>
                        )}

                        {/* Grupos Relacionados */}
                        {relatedGroups.length > 0 && (
                            <section id="relacionados">
                                <SectionHeader icon={<Users className="w-5 h-5" />} title={group.agencyId ? 'Mesma Agência' : 'Mesma Geração'} count={relatedGroups.length} countLabel={relatedGroups.length === 1 ? 'grupo' : 'grupos'} accent={accent} />
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {relatedGroups.map(rg => (
                                        <Link key={rg.id} href={`/groups/${rg.slug ?? rg.id}`}
                                            className="related-group-link group/rg flex items-center gap-3 border border-border bg-background p-3 transition-colors hover:border-foreground/50 hover:bg-surface">
                                            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden bg-surface">
                                                {rg.profileImageUrl ? (
                                                    <Image src={rg.profileImageUrl} alt={rg.name} fill sizes="40px" className="object-cover group-hover/rg:scale-105 transition-transform" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-sm font-black text-muted">{rg.name[0]}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="related-group-name text-sm font-bold text-foreground truncate transition-colors">{rg.name}</p>
                                                {rg.disbandDate && (
                                                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Disbandado</p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Spotify embed */}
                        {spotifyUrl && (
                            <GroupSpotifyEmbed spotifyUrl={spotifyUrl} groupName={group.name} accent={accent} />
                        )}

                        {/* Discografia Spotify */}
                        {discographyReleases.length > 0 && (
                            <div id="discografia">
                                <DiscographySection albums={discographyReleases} />
                            </div>
                        )}

                        {/* ── IDENTIDADE VISUAL ── */}
                        {officialColorRaw && (
                            <GroupColorIdentity
                                officialColor={officialColorRaw}
                                groupName={group.name}
                                fanClubName={fanClubName}
                                nameMeaning={nameMeaning}
                            />
                        )}

                        {/* MVs — player interativo */}
                        {videos.length > 0 && (
                            <GroupMVPlayer videos={videos} accent={accent} />
                        )}

                        {/* Presença digital — redes sociais */}
                        {(Object.keys(socialLinks).length > 0 || spotifyUrl) && (
                            <GroupSocialPresence
                                socialLinks={socialLinks}
                                spotifyUrl={spotifyUrl}
                                accent={accent}
                                groupName={group.name}
                            />
                        )}

                        {/* Ex-membros */}
                        {formerMembers.length > 0 && (
                            <section id="ex-membros">
                                <SectionHeader icon={<Users className="w-5 h-5" />} title="Ex-Membros" count={formerMembers.length} countLabel={formerMembers.length === 1 ? 'membro' : 'membros'} muted accent={accent} />
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                    {formerMembers.map(member => (
                                        <GroupMemberCard key={member.id} member={member} faded accent={accent} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Estado vazio */}
                        {group.members.length === 0 && (
                            <div className="border border-border bg-surface p-12 text-center">
                                <Users className="w-12 h-12 text-muted mx-auto mb-4" />
                                <p className="text-muted font-bold">Nenhum membro vinculado</p>
                                <p className="text-muted text-sm mt-1">Sincronize via Admin → Grupos Musicais</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ScrollToTop />
        </div>
    );
}

/* ── Sub-componentes ── */

function SectionHeader({ icon, title, count, countLabel, muted = false, accent = '#9333ea' }: {
    icon: React.ReactNode
    title: string
    count?: number
    countLabel?: string
    muted?: boolean
    accent?: string
}) {
    return (
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-foreground pb-3">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center border border-border bg-background">
                    <span style={{ color: muted ? '#6b6b6b' : accent }}>{icon}</span>
                </div>
                <div className="min-w-0">
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Dossiê</p>
                    <h2 className={`text-xl font-black tracking-[-0.03em] ${muted ? 'text-muted' : 'text-foreground'}`}>{title}</h2>
                </div>
            </div>
            {count !== undefined && (
                <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    {count} {countLabel ?? (count === 1 ? 'item' : 'itens')}
                </p>
            )}
        </div>
    )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
            <div className="flex items-center gap-2 text-muted">
                {icon}
                <span className="text-xs font-black uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-sm font-bold text-foreground">{value}</span>
        </div>
    )
}

const PLATFORM_LABEL: Record<string, string> = {
    instagram: 'Instagram', twitter: 'Twitter / X', x: 'X (Twitter)',
    youtube: 'YouTube', spotify: 'Spotify', tiktok: 'TikTok',
    facebook: 'Facebook', website: 'Site oficial', weverse: 'Weverse',
    vlive: 'V Live', fancafe: 'Fan Café',
}

function SocialIcon({ platform }: { platform: string }) {
    const key = platform.toLowerCase()
    const cls: Record<string, string> = {
        instagram: 'text-pink-500', twitter: 'text-sky-500', x: 'text-foreground',
        youtube: 'text-red-500', spotify: 'text-green-500', tiktok: 'text-foreground',
        facebook: 'text-blue-500', website: 'text-muted', weverse: 'text-purple-400',
    }
    const icons: Record<string, React.ReactNode> = {
        instagram: <Instagram className="w-4 h-4" />,
        twitter: <Twitter className="w-4 h-4" />,
        x: <Twitter className="w-4 h-4" />,
        youtube: <Youtube className="w-4 h-4" />,
        spotify: <Music className="w-4 h-4" />,
        tiktok: <Play className="w-4 h-4" />,
        website: <Globe className="w-4 h-4" />,
        weverse: <Globe className="w-4 h-4" />,
    }
    return <span className={cls[key] ?? 'text-muted'}>{icons[key] ?? <ExternalLink className="w-4 h-4" />}</span>
}
