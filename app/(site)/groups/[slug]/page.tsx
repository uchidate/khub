import prisma from '@/lib/prisma'
import { applySeoOverride } from '@/lib/seo/apply-override'
import { cache } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { JsonLd } from '@/components/seo/JsonLd'
import { FavoriteButton } from '@/components/ui/FavoriteButton'
import { ReportButton } from '@/components/ui/ReportButton'
import { AdminQuickEdit } from '@/components/ui/AdminQuickEdit'
import { ViewTracker } from '@/components/features/ViewTracker'
import { fetchGroupThemeColor, buildGroupThemeVars, toRgba } from '@/lib/fetch-group-theme'
import { Globe, Users, Calendar, Building2, Eye, Heart, Music, Instagram, Twitter, Youtube, ExternalLink, Play } from 'lucide-react'
import { AnniversaryCountdown } from '@/components/ui/AnniversaryCountdown'
import { nameToGradient } from '@/lib/utils'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { getTranslation } from '@/lib/translations'
import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'

import { SITE_URL } from '@/lib/constants/site'
import { LojaRelacionados } from '@/components/ui/LojaRelacionados'
import { DiscographySection } from '@/components/features/DiscographySection'
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
                where: { artist: { isHidden: false } },
                include: {
                    artist: {
                        select: {
                            id: true,
                            slug: true,
                            nameRomanized: true,
                            nameHangul: true,
                            primaryImageUrl: true,
                            roles: true, gender: true,
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

    if (!group || group.isHidden) {
        return (
            <div className="py-8 md:py-12 px-4 sm:px-6 lg:px-12">
                <Breadcrumbs items={[{ label: 'Grupos', href: '/groups' }, { label: 'Não Encontrado' }]} />
                <ErrorMessage
                    title="Grupo não encontrado"
                    message="Este grupo pode ter sido removido ou o link está incorreto."
                    showSupport={true}
                />
            </div>
        )
    }

    const activeMembers = group.members.filter(m => m.isActive)
    const formerMembers = group.members.filter(m => !m.isActive)
    const debutYear = group.debutDate ? new Date(group.debutDate).getUTCFullYear() : null
    const disbandYear = group.disbandDate ? new Date(group.disbandDate).getUTCFullYear() : null
    const currentYear = new Date().getFullYear()
    const yearsActive = debutYear ? (disbandYear ?? currentYear) - debutYear : null
    const socialLinks = (group.socialLinks as Record<string, string>) || {}
    const fanClubName = group.fanClubName ?? null
    const officialColorRaw = group.officialColor ?? null
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
            select: { id: true, name: true, profileImageUrl: true, disbandDate: true },
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
            {/* ── HERO ── */}
            <div className="relative h-[60vh] md:h-[75vh] overflow-hidden">
                {/* Background image com blur */}
                {group.profileImageUrl && (
                    <div className="absolute inset-0 scale-110">
                        <Image
                            src={group.profileImageUrl}
                            alt=""
                            fill
                            priority
                            sizes="100vw"
                            className="object-cover blur-sm brightness-40"
                        />
                    </div>
                )}
                {/* Imagem principal */}
                <div className="absolute inset-0">
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
                        <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${toRgba(accent, 0.3)} 0%, #18181b 60%, #000 100%)` }} />
                    )}
                </div>
                {/* Gradientes */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                {/* Glow colorido da marca no rodapé do hero */}
                <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
                    style={{ background: `linear-gradient(to top, ${toRgba(accent, 0.15)}, transparent)` }} />

                {/* Breadcrumbs */}
                <div className="absolute top-24 md:top-28 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
                    <div>
                        <Breadcrumbs items={[{ label: 'Grupos', href: '/groups' }, { label: group.name }]} onDark className="" />
                    </div>
                </div>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pb-10 md:pb-14">
                    <div>
                    <div className="flex flex-col gap-3 max-w-3xl">
                        {/* Status badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {disbandYear ? (
                                <span className="text-xs font-black uppercase px-3 py-1 bg-black/60 backdrop-blur-sm text-white/70 rounded-full border border-white/20">
                                    Disbandado em {disbandYear}
                                </span>
                            ) : (
                                <span className="text-xs font-black uppercase px-3 py-1 backdrop-blur-sm rounded-full border"
                                    style={{ background: toRgba(accent, 0.2), color: accent, borderColor: toRgba(accent, 0.4) }}>
                                    Ativo
                                </span>
                            )}
                            {debutYear && (() => {
                                const genLabel =
                                    debutYear <= 2002 ? '1ª Geração' :
                                    debutYear <= 2011 ? '2ª Geração' :
                                    debutYear <= 2017 ? '3ª Geração' :
                                    debutYear <= 2022 ? '4ª Geração' : '5ª Geração'
                                return (
                                    <span className="text-xs font-bold px-3 py-1 bg-black/40 backdrop-blur-sm text-white/70 rounded-full border border-white/10">
                                        {genLabel}
                                    </span>
                                )
                            })()}
                            {fanClubName && (
                                <span className="text-xs font-black px-3 py-1 backdrop-blur-sm rounded-full border inline-flex items-center gap-1.5"
                                    style={{ background: toRgba(accent, 0.15), color: accent, borderColor: toRgba(accent, 0.3) }}>
                                    <Heart className="w-3 h-3 fill-current" />
                                    {fanClubName}
                                </span>
                            )}
                            {debutYear && (
                                <span className="text-xs font-bold px-3 py-1 bg-black/40 backdrop-blur-sm text-[#999] rounded-full border border-white/10">
                                    Desde {debutYear}
                                </span>
                            )}
                            {group.agency && (
                                <span className="text-xs font-bold px-3 py-1 bg-black/40 backdrop-blur-sm text-[#999] rounded-full border border-white/10">
                                    {group.agency.name}
                                </span>
                            )}
                            {group.debutDate && !disbandYear && (
                                <AnniversaryCountdown
                                    date={group.debutDate.toISOString()}
                                    label="aniversário de debut"
                                    groupName={group.name}
                                />
                            )}
                        </div>

                        {/* Nome */}
                        <div className="flex items-end gap-4">
                            <div>
                                <h1 className="text-5xl md:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-2xl">
                                    {group.name}
                                </h1>
                                {group.nameHangul && (
                                    <p className="text-xl md:text-3xl font-bold mt-1 drop-shadow-lg" style={{ color: accent }}>{group.nameHangul}</p>
                                )}
                                {/* Accent bar — identidade visual do grupo */}
                                <div className="mt-3" style={{ width: '56px', height: '3px', background: accent, borderRadius: '99px', opacity: 0.9 }} />
                            </div>
                            <div className="mb-2 flex items-center gap-2">
                                <AdminQuickEdit href={`/admin/groups/${group.id}?returnTo=${encodeURIComponent(`/groups/${group.id}`)}`} label="Editar" />
                                <ReportButton entityType="group" entityId={group.id} entityName={group.name}
                                    className="bg-black/40 border border-white/10 backdrop-blur-sm" />
                                <FavoriteButton
                                    id={group.id}
                                    itemName={group.name}
                                    itemType="grupo"
                                    className="bg-black/40 border border-white/10 backdrop-blur-sm"
                                />
                            </div>
                        </div>

                        {/* Stats rápidas */}
                        <div className="flex items-center gap-4 flex-wrap mt-1">
                            {[
                                { icon: <Users className="w-3.5 h-3.5" />, text: `${activeMembers.length} membros` },
                                ...(yearsActive !== null ? [{ icon: <Calendar className="w-3.5 h-3.5" />, text: `${yearsActive} ${yearsActive === 1 ? 'ano' : 'anos'} de carreira` }] : []),
                                { icon: <Eye className="w-3.5 h-3.5" />, text: `${group.viewCount.toLocaleString('pt-BR')} views` },
                                { icon: <Heart className="w-3.5 h-3.5" />, text: `${group.favoriteCount.toLocaleString('pt-BR')} fãs` },
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center gap-1.5" style={{ color: toRgba(accent, 0.8) }}>
                                    {stat.icon}
                                    <span className="text-sm font-bold">{stat.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Botão site oficial */}
                        {websiteUrl && (
                            <div className="mt-2">
                                <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black backdrop-blur-sm border transition-all hover:opacity-90"
                                    style={{
                                        background: toRgba(accent, 0.2),
                                        borderColor: toRgba(accent, 0.5),
                                        color: '#fff',
                                    }}>
                                    <Globe className="w-3.5 h-3.5" style={{ color: accent }} />
                                    Site Oficial
                                    <ExternalLink className="w-3 h-3 opacity-60" />
                                </a>
                            </div>
                        )}
                    </div>
                    </div>
                </div>
            </div>
            {/* ── CONTEÚDO ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12">
                <div className="mb-8">
                    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3">Navegação rápida</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {activeMembers.length > 0 && (
                                <a href="#membros" className="px-3 py-1.5 rounded-full border border-border bg-background text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover transition-colors">Membros</a>
                            )}
                            {relatedGroups.length > 0 && (
                                <a href="#relacionados" className="px-3 py-1.5 rounded-full border border-border bg-background text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover transition-colors">Relacionados</a>
                            )}
                            {discographyReleases.length > 0 && (
                                <a href="#discografia" className="px-3 py-1.5 rounded-full border border-border bg-background text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover transition-colors">Discografia</a>
                            )}
                            {relatedPosts.length > 0 && (
                                <a href="#artigos" className="px-3 py-1.5 rounded-full border border-border bg-background text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover transition-colors">Artigos</a>
                            )}
                            {videos.length > 0 && (
                                <a href="#mvs" className="px-3 py-1.5 rounded-full border border-border bg-background text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover transition-colors">MVs</a>
                            )}
                            {formerMembers.length > 0 && (
                                <a href="#ex-membros" className="px-3 py-1.5 rounded-full border border-border bg-background text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-hover transition-colors">Ex-membros</a>
                            )}
                        </div>
                    </div>
                </div>
                <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">

                    {/* ── SIDEBAR ── */}
                    <div className="space-y-8 lg:col-span-1">
                        {/* Bio */}
                        {(bioPt ?? group.bio) && (
                            <div className="p-6 rounded-2xl bg-background relative overflow-hidden"
                                style={{ border: `1px solid ${toRgba(accent, 0.2)}`, borderLeft: `3px solid ${accent}` }}>
                                {/* Decorative quote mark */}
                                <div className="absolute top-1 right-4 text-8xl font-black leading-none pointer-events-none select-none"
                                    style={{ color: toRgba(accent, 0.1), fontFamily: 'Georgia, serif' }}>❝</div>
                                <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-3">Sobre</h3>
                                <p className="text-foreground leading-relaxed text-sm relative z-10">{bioPt ?? group.bio}</p>
                            </div>
                        )}

                        {/* Info */}
                        <div className="p-6 rounded-2xl bg-background border border-border">
                            <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-4">Informações</h3>
                            <div className="space-y-0">
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
                                        value={`${yearsActive} ${yearsActive === 1 ? 'ano' : 'anos'}`}
                                    />
                                )}
                                {group.agency && (
                                    <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
                                        <div className="flex items-center gap-2 text-muted">
                                            <Building2 className="w-3.5 h-3.5" />
                                            <span className="text-xs font-black uppercase tracking-widest">Agência</span>
                                        </div>
                                        <Link href={`/agencies/${group.agency.slug ?? group.agency.id}`} className="text-sm font-bold transition-colors hover:opacity-80"
                                            style={{ color: accent }}>
                                            {group.agency.name}
                                        </Link>
                                    </div>
                                )}
                                <InfoRow
                                    icon={<Users className="w-3.5 h-3.5" />}
                                    label="Membros ativos"
                                    value={String(activeMembers.length)}
                                />
                                {formerMembers.length > 0 && (
                                    <InfoRow
                                        icon={<Users className="w-3.5 h-3.5" />}
                                        label="Ex-membros"
                                        value={String(formerMembers.length)}
                                    />
                                )}
                                {officialColorRaw && (
                                    <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
                                        <div className="flex items-center gap-2 text-muted">
                                            <div className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0"
                                                style={{ background: officialColorRaw }} />
                                            <span className="text-xs font-black uppercase tracking-widest">Cor Oficial</span>
                                        </div>
                                        <span className="text-xs font-bold text-muted font-mono">{officialColorRaw}</span>
                                    </div>
                                )}
                                {fanClubName && (
                                    <div className="flex justify-between items-center py-3 last:border-0">
                                        <div className="flex items-center gap-2 text-muted">
                                            <Heart className="w-3.5 h-3.5" />
                                            <span className="text-xs font-black uppercase tracking-widest">Fandom</span>
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: accent }}>{fanClubName}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {roleBreakdown.length > 0 && (
                            <div className="p-6 rounded-2xl bg-background border border-border">
                                <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-4">Formação atual</h3>
                                <div className="space-y-2.5">
                                    {roleBreakdown.map(([role, count]) => {
                                        const pct = Math.max(8, Math.round((count / activeMembers.length) * 100))
                                        return (
                                            <div key={role}>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="font-semibold text-foreground">{role}</span>
                                                    <span className="text-muted font-bold">{count}</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Site Oficial — card destacado com cor do tema */}
                        {websiteUrl && (
                            <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                                className="block p-5 rounded-2xl border transition-all hover:opacity-90 group/site"
                                style={{
                                    background: `linear-gradient(135deg, ${toRgba(accent, 0.12)}, ${toRgba(accent, 0.05)})`,
                                    borderColor: toRgba(accent, 0.3),
                                }}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-black text-muted uppercase tracking-widest">Site Oficial</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-muted group-hover/site:text-foreground transition-colors" />
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Swatch da cor extraída */}
                                    <div className="w-8 h-8 rounded-lg flex-shrink-0 border border-border"
                                        style={{ background: accent }} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate">
                                            {new URL(websiteUrl).hostname.replace(/^www\./, '')}
                                        </p>
                                        {themeColor && (
                                            <p className="text-[10px] text-muted mt-0.5 font-mono">{themeColor} · cor extraída</p>
                                        )}
                                    </div>
                                </div>
                            </a>
                        )}

                        {/* Spotify oficial vindo do catálogo musical */}
                        {spotifyUrl && (
                            <a href={spotifyUrl} target="_blank" rel="noopener noreferrer"
                                className="block p-5 rounded-2xl border border-green-500/25 bg-green-500/5 hover:bg-green-500/10 transition-all group/spotify">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-black text-muted uppercase tracking-widest">Spotify</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-muted group-hover/spotify:text-green-400 transition-colors" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/15 border border-green-500/20">
                                        <Music className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-foreground">Ouvir no Spotify</p>
                                        <p className="text-[10px] text-muted mt-0.5 truncate">Perfil oficial do grupo</p>
                                    </div>
                                </div>
                            </a>
                        )}

                        {/* Redes Sociais (sem website e sem Spotify — já mostrados acima) */}
                        {visibleSocialLinks.length > 0 && (
                            <div className="p-6 rounded-2xl bg-background border border-border">
                                <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-4">Redes Sociais</h3>
                                <div className="flex flex-col gap-2">
                                    {visibleSocialLinks.map(([platform, url]) => (
                                        <SocialLink key={platform} platform={platform} url={url} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard icon={<Eye className="w-5 h-5" />} label="Visualizações" value={group.viewCount.toLocaleString('pt-BR')} color="text-cyan-400" accent={accent} />
                            <StatCard icon={<Heart className="w-5 h-5" />} label="Fãs" value={group.favoriteCount.toLocaleString('pt-BR')} color="text-pink-400" accent={accent} />
                        </div>

                    </div>

                    {/* ── MAIN ── */}
                    <div className="min-w-0 space-y-10 lg:col-span-2 lg:space-y-14">

                        {/* Membros atuais */}
                        {activeMembers.length > 0 && (
                            <section id="membros">
                                <SectionHeader icon={<Users className="w-5 h-5" />} title="Membros" count={activeMembers.length} accent={accent} />
                                <MemberGrid members={activeMembers} accent={accent} />
                            </section>
                        )}

                        <LojaRelacionados
                            tags={[group.name.toLowerCase(), ...(group.nameHangul ? [group.nameHangul.toLowerCase()] : [])]}
                            title={`Produtos ${group.name}`}
                            compact
                        />

                        {relatedPosts.length > 0 && (
                            <section id="artigos">
                                <SectionHeader icon={<Music className="w-5 h-5" />} title="Artigos Relacionados" count={relatedPosts.length} accent={accent} />
                                <p className="text-[11px] text-muted mb-3">
                                    Artigos com vínculo editorial aparecem primeiro, seguidos por descobertas por relevância.
                                </p>

                                {(() => {
                                    const linked = relatedPosts.filter((post) => post.source === 'linked')
                                    const recommended = relatedPosts.filter((post) => post.source === 'recommended')

                                    const renderPostCard = (post: (typeof relatedPosts)[number]) => (
                                        <Link
                                            key={post.id}
                                            href={`/blog/${post.slug}`}
                                            className="group block rounded-xl border border-border bg-background overflow-hidden hover:border-border transition-colors"
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
                                                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full bg-black/60 text-white/90 backdrop-blur-sm">
                                                        {post.category.name}
                                                    </span>
                                                )}
                                                <span
                                                    className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm border ${
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

                                    return (
                                        <div className="space-y-5">
                                            {linked.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted mb-2">Relacionados no CMS</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {linked.map(renderPostCard)}
                                                    </div>
                                                </div>
                                            )}

                                            {recommended.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted mb-2">Descobertas por relevância</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {recommended.map(renderPostCard)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })()}
                            </section>
                        )}

                        {/* Grupos Relacionados */}
                        {relatedGroups.length > 0 && (
                            <section id="relacionados">
                                <SectionHeader icon={<Users className="w-5 h-5" />} title={group.agencyId ? 'Mesma Agência' : 'Mesma Geração'} count={relatedGroups.length} accent={accent} />
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {relatedGroups.map(rg => (
                                        <Link key={rg.id} href={`/groups/${rg.id}`}
                                            className="related-group-link flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:border-[#d0d0d0] hover:bg-surface transition-all group/rg">
                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
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

                        {/* Discografia Spotify */}
                        {discographyReleases.length > 0 && (
                            <div id="discografia">
                                <DiscographySection albums={discographyReleases} />
                            </div>
                        )}

                        {/* MVs principais */}
                        {videos.length > 0 && (
                            <section id="mvs">
                                <SectionHeader icon={<Play className="w-5 h-5" />} title="MVs Principais" count={videos.length} accent={accent} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {videos.map((mv, i) => {
                                        const videoId = extractYoutubeId(mv.url)
                                        if (!videoId) return null
                                        return (
                                            <a key={i} href={mv.url} target="_blank" rel="noopener noreferrer"
                                                className="mv-card group block rounded-xl overflow-hidden border border-border transition-all">
                                                <div className="relative aspect-video bg-surface">
                                                    <Image
                                                        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                                        alt={mv.title}
                                                        fill
                                                        sizes="(max-width: 640px) 100vw, 50vw"
                                                        className="object-cover brightness-75 group-hover:brightness-90 transition-all"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-110"
                                                            style={{ background: toRgba(accent, 0.85) }}>
                                                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-background" style={{ borderTop: `1px solid ${toRgba(accent, 0.1)}` }}>
                                                    <p className="text-sm font-bold text-foreground group-hover:opacity-80 transition-opacity line-clamp-1">{mv.title}</p>
                                                    <p className="text-[10px] text-muted mt-0.5 uppercase tracking-wider font-bold">YouTube</p>
                                                </div>
                                            </a>
                                        )
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Ex-membros */}
                        {formerMembers.length > 0 && (
                            <section id="ex-membros">
                                <SectionHeader icon={<Users className="w-5 h-5" />} title="Ex-Membros" count={formerMembers.length} muted accent={accent} />
                                <MemberGrid members={formerMembers} faded accent={accent} />
                            </section>
                        )}

                        {/* Estado vazio */}
                        {group.members.length === 0 && (
                            <div className="bg-surface rounded-2xl border border-border p-12 text-center">
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

/* ── Helpers ── */


function extractYoutubeId(url: string): string | null {
    try {
        const u = new URL(url)
        // https://www.youtube.com/watch?v=ID
        const v = u.searchParams.get('v')
        if (v) return v
        // https://youtu.be/ID
        if (u.hostname === 'youtu.be') return u.pathname.slice(1)
        // https://www.youtube.com/embed/ID
        const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/)
        if (embedMatch) return embedMatch[1]
        return null
    } catch {
        return null
    }
}

/* ── Sub-componentes ── */

function SectionHeader({ icon, title, count, muted = false, accent = '#9333ea' }: {
    icon: React.ReactNode
    title: string
    count?: number
    muted?: boolean
    accent?: string
}) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl border"
                style={muted
                    ? { background: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }
                    : { background: toRgba(accent, 0.15), borderColor: toRgba(accent, 0.25) }
                }>
                <span style={{ color: muted ? '#6b6b6b' : accent }}>{icon}</span>
            </div>
            <div>
                <h2 className={`text-xl font-black ${muted ? 'text-muted' : 'text-foreground'}`}>{title}</h2>
                {count !== undefined && (
                    <p className="text-muted text-xs mt-0.5">{count} {count === 1 ? 'pessoa' : 'pessoas'}</p>
                )}
            </div>
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

function StatCard({ icon, label, value, color, accent }: { icon: React.ReactNode; label: string; value: string; color: string; accent?: string }) {
    return (
        <div className="p-4 rounded-xl bg-surface border border-border text-center">
            <div className={`${color} mx-auto mb-1 flex justify-center`}>{icon}</div>
            <div className={`text-2xl font-black ${color}`} style={accent ? { color: accent } : undefined}>{value}</div>
            <p className="text-xs text-muted font-bold uppercase tracking-wider mt-0.5">{label}</p>
        </div>
    )
}

function SocialLink({ platform, url }: { platform: string; url: string }) {
    const icons: Record<string, React.ReactNode> = {
        instagram: <Instagram className="w-4 h-4" />,
        twitter: <Twitter className="w-4 h-4" />,
        x: <Twitter className="w-4 h-4" />,
        youtube: <Youtube className="w-4 h-4" />,
        spotify: <Music className="w-4 h-4" />,
        website: <Globe className="w-4 h-4" />,
    }
    const colors: Record<string, string> = {
        instagram: 'text-pink-500 hover:text-pink-400',
        twitter: 'text-sky-500 hover:text-sky-400',
        x: 'text-sky-500 hover:text-sky-400',
        youtube: 'text-red-500 hover:text-red-400',
        spotify: 'text-green-500 hover:text-green-400',
        website: 'text-muted hover:text-foreground',
    }
    const key = platform.toLowerCase()
    return (
        <a href={url} target="_blank" rel="noopener noreferrer"
            className={`flex items-center justify-between px-4 py-3 rounded-xl bg-surface hover:bg-surface-hover border border-border hover:border-border transition-all ${colors[key] || 'text-muted hover:text-foreground'}`}>
            <div className="flex items-center gap-2.5">
                {icons[key] ?? <ExternalLink className="w-4 h-4" />}
                <span className="text-sm font-bold capitalize">{platform}</span>
            </div>
            <ExternalLink className="w-3 h-3 opacity-50" />
        </a>
    )
}

function MemberGrid({
    members,
    faded = false,
    accent = '#9333ea',
}: {
    members: {
        id: string
        role: string | null
        joinDate: Date | null
        leaveDate: Date | null
        artist: {
            id: string
            slug?: string | null
            nameRomanized: string
            nameHangul: string | null
            primaryImageUrl: string | null
            roles: string[]
        }
    }[]
    faded?: boolean
    accent?: string
}) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {members.map(member => (
                <Link
                    key={member.id}
                    href={`/artists/${member.artist.slug ?? member.artist.id}`}
                    className={`group block ${faded ? 'opacity-50 hover:opacity-90 transition-opacity' : ''}`}
                >
                    <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-surface border border-border member-card-border transition-all duration-300 mb-3 shadow-sm">
                        {member.artist.primaryImageUrl ? (
                            <Image
                                src={member.artist.primaryImageUrl}
                                alt={member.artist.nameRomanized}
                                fill
                                sizes="(max-width: 640px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center"
                                style={{ background: nameToGradient(member.artist.nameRomanized) }}>
                                <span className="text-4xl font-black text-white/80 drop-shadow select-none">
                                    {member.artist.nameRomanized[0]}
                                </span>
                            </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                        {/* Role badge — always visible */}
                        {member.role && (
                            <div className="absolute bottom-2 left-2 right-2">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 backdrop-blur-sm text-white/80 group-hover:text-white rounded-full group-accent-badge transition-colors">
                                    {member.role}
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-sm leading-tight group-hover:text-accent transition-colors">
                            {member.artist.nameRomanized}
                        </h3>
                        {member.artist.nameHangul && (
                            <p className="text-[11px] text-muted mt-0.5">{member.artist.nameHangul}</p>
                        )}
                        {(member.joinDate || member.leaveDate) && (
                            <p className="text-[10px] text-muted mt-1">
                                {member.joinDate ? new Date(member.joinDate).getUTCFullYear() : '?'}
                                {member.leaveDate ? ` – ${new Date(member.leaveDate).getUTCFullYear()}` : ''}
                            </p>
                        )}
                        <p className="text-[10px] font-semibold mt-1.5" style={{ color: accent }}>
                            Ver perfil do artista
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    )
}
