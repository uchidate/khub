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
import { Instagram, Twitter, Youtube, Music, Globe, User, Ruler, Sparkles, ExternalLink, Newspaper, Eye, Heart, Users, MapPin, Film, Disc3 } from "lucide-react"
import type { Metadata } from "next"
import { permanentRedirect } from "next/navigation"

import { SITE_URL } from '@/lib/constants/site'
import { LojaRelacionados } from '@/components/ui/LojaRelacionados'
const BASE_URL = SITE_URL

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
            agency: true,
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
                orderBy: { isActive: 'desc' },
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
    const artist = await getArtist(params.slug)

    if (!artist) {
        return {
            title: 'Artista não encontrado',
            description: 'Este artista não foi encontrado em nossa base de dados.'
        }
    }
    if (artist.isHidden) return { title: 'Artista não encontrado', robots: { index: false, follow: false } }

    const roles = artist.roles || []
    const description = artist.bio || `${artist.nameRomanized}${artist.nameHangul ? ` (${artist.nameHangul})` : ''} - ${roles.join(', ')}${artist.agency ? ` · ${artist.agency.name}` : ''}`
    const isThinContent = !artist.primaryImageUrl && !artist.bio

    const canonicalUrl = `${BASE_URL}/artists/${artist.slug ?? artist.id}`
    const primaryGroup = artist.memberships?.find(m => m.isActive)?.group ?? artist.memberships?.[0]?.group ?? null
    const keywords = [
        artist.nameRomanized,
        ...(artist.nameHangul ? [artist.nameHangul] : []),
        ...roles.map(r => `${artist.nameRomanized} ${r}`),
        ...(primaryGroup ? [`${primaryGroup.name}`, `${artist.nameRomanized} ${primaryGroup.name}`] : []),
        'K-Pop', 'artista coreano', 'HallyuHub',
    ].filter(Boolean).join(', ')

    return applySeoOverride({
        title: `${artist.nameRomanized}${artist.nameHangul ? ` (${artist.nameHangul})` : ''}`,
        description: description.slice(0, 160),
        keywords,
        alternates: {
            canonical: canonicalUrl,
            languages: { 'pt-BR': canonicalUrl, 'x-default': canonicalUrl },
        },
        ...(isThinContent ? { robots: { index: false, follow: true } } : {}),
        openGraph: {
            title: `${artist.nameRomanized} | HallyuHub`,
            description: description.slice(0, 160),
            images: artist.primaryImageUrl ? [{ url: artist.primaryImageUrl, width: 1200, height: 630, alt: artist.nameRomanized }] : [],
            type: 'profile',
            url: `${BASE_URL}/artists/${artist.slug ?? artist.id}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${artist.nameRomanized} | HallyuHub`,
            description: description.slice(0, 160),
            images: artist.primaryImageUrl ? [artist.primaryImageUrl] : []
        }
    }, 'artist', artist.id)
}

export default async function ArtistDetailPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    // Step 1: fetch artist (deduplica com generateMetadata via React.cache)
    const artist = await getArtist(params.slug)

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
    const [newsCount, bioPt, productionTranslations, relatedArtists, blogArticles, totalProductions, totalAlbums] = await Promise.all([
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
        prisma.album.count({ where: { artistId: artist.id } }).catch(() => artist.albums.length),
    ])

    // Mapa de tmdbId → sinal de streaming (melhor rank por produção)
    const streamingByTmdbId = new Map(
        (artist.streamingSignals ?? []).map(s => [s.showTmdbId, s])
    )

    const roles = artist.roles || []
    const stageNames = artist.stageNames || []
    const socialLinks = (artist.socialLinks as Record<string, string>) || {}
    const birthDate = artist.birthDate ? new Date(artist.birthDate) : null
    const birthDateFormatted = birthDate?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null

    const activeGroup = artist.memberships.find(m => m.isActive)?.group ?? null
    const allGroups = artist.memberships

    // Profile sections: bio as "Perfil" + analiseEditorial sections
    const profileSections: { title: string; content: string }[] = []
    const bioText = bioPt ?? artist.bio
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
                "birthPlace": artist.placeOfBirth ? { "@type": "Place", "name": artist.placeOfBirth } : undefined,
                "jobTitle": artist.roles?.[0] ?? undefined,
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

            {/* ── HERO ── */}
            <div className="relative h-[65vh] md:h-[75vh] overflow-hidden">
                {/* Blurred background */}
                {artist.primaryImageUrl && (
                    <div className="absolute inset-0 scale-110">
                        <Image src={artist.primaryImageUrl} alt="" fill priority sizes="100vw" className="object-cover blur-sm brightness-30" />
                    </div>
                )}
                {/* Main image — blurred backdrop (not crisp, portrait card handles crisp) */}
                <div className="absolute inset-0">
                    {artist.primaryImageUrl ? (
                        <Image src={artist.primaryImageUrl} alt="" fill priority sizes="100vw" className="object-cover object-[50%_15%]" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent/10 via-surface to-border" />
                    )}
                </div>
                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black from-0% via-black/60 via-[35%] to-transparent to-[65%]" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

                {/* Breadcrumbs + Favorite */}
                <div className="absolute top-4 md:top-5 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 z-10"><div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                    <Breadcrumbs items={[{ label: 'Artistas', href: '/artists' }, { label: artist.nameRomanized }]} onDark className="" />
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                        <AdminQuickEdit href={`/admin/artists/${artist.id}?returnTo=${encodeURIComponent(`/artists/${artist.id}`)}`} label="Editar" />
                        <ReportButton entityType="artist" entityId={artist.id} entityName={artist.nameRomanized}
                            className="bg-black/40 border border-white/10 backdrop-blur-sm" />
                        <FavoriteButton id={artist.id} itemName={artist.nameRomanized} itemType="artista"
                            className="bg-black/40 border border-white/10 backdrop-blur-sm" />
                    </div>
                </div></div>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pb-10 md:pb-14">
                    <div className="flex items-end gap-8">
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                        {/* Roles + group + birthday countdown */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {getRoleLabels(roles, artist.gender).map(role => (
                                <span key={role} className="text-xs font-black uppercase px-3 py-1 bg-white/10 backdrop-blur-sm text-white rounded-full border border-white/20">
                                    {role}
                                </span>
                            ))}
                            {activeGroup && (
                                <Link href={`/groups/${activeGroup.slug ?? activeGroup.id}`}
                                    className="text-xs font-black px-3 py-1 bg-accent/20 backdrop-blur-sm text-white rounded-full border border-accent/50 hover:bg-accent/30 transition-colors">
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

                        {/* Nome */}
                        <div>
                            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-2xl">
                                {artist.nameRomanized}
                            </h1>
                            {artist.nameHangul && (
                                <p className="text-lg md:text-3xl font-bold mt-1 text-accent drop-shadow-lg flex items-baseline gap-2 flex-wrap">
                                    <span>{artist.nameHangul}</span>
                                    {age !== null && (
                                        <span className="text-sm md:text-xl font-semibold text-white/70">{age} anos</span>
                                    )}
                                </p>
                            )}
                            {stageNames.length > 0 && (
                                <p className="hidden md:block text-white/60 text-sm font-medium mt-1.5">
                                    Também conhecido como: {stageNames.join(', ')}
                                </p>
                            )}
                        </div>


                        {/* Stats — só desktop */}
                        <div className="hidden md:flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-1.5 text-white/80">
                                <Eye className="w-3.5 h-3.5" />
                                <span className="text-sm font-bold">{artist.viewCount.toLocaleString('pt-BR')} views</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-accent/80">
                                <Heart className="w-3.5 h-3.5" />
                                <span className="text-sm font-bold">{artist.favoriteCount.toLocaleString('pt-BR')} fãs</span>
                            </div>
                        </div>

                    </div>

                    {/* Portrait card — só desktop, igual ao poster das produções */}
                    {artist.primaryImageUrl && (
                        <div className="hidden md:block shrink-0 pb-1">
                            <div className="w-44 lg:w-52 aspect-[3/4] relative rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
                                <Image
                                    src={artist.primaryImageUrl}
                                    alt={artist.nameRomanized}
                                    fill
                                    priority
                                    sizes="(max-width: 1024px) 176px, 208px"
                                    className="object-cover object-top"
                                />
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </div>

            {/* ── CONTEÚDO ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
                <div className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">

                    {/* ── SIDEBAR ── */}
                    <div className="space-y-4 lg:space-y-6 lg:sticky lg:top-24 lg:self-start">


                        {/* Informações */}
                        <div className="rounded-2xl bg-background border border-border overflow-hidden">
                            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-accent" />
                                <h3 className="text-[10px] font-black text-muted uppercase tracking-widest">Informações</h3>
                            </div>
                            <div className="p-4 md:p-5">
                            <div className="space-y-0">
                                {artist.birthName && (
                                    <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Nome Real" value={artist.birthName} />
                                )}
                                {birthDateFormatted && (
                                    <InfoRow icon={<Sparkles className="w-3.5 h-3.5" />} label="Nascimento" value={birthDateFormatted} />
                                )}
                                {artist.placeOfBirth && (
                                    <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Naturalidade" value={artist.placeOfBirth} />
                                )}
                                {artist.height && (
                                    <InfoRow icon={<Ruler className="w-3.5 h-3.5" />} label="Altura" value={artist.height} />
                                )}
                                {artist.zodiacSign && (
                                    <InfoRow icon={<Sparkles className="w-3.5 h-3.5" />} label="Signo" value={artist.zodiacSign} />
                                )}
                                {artist.agency && (
                                    <div className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                                        <div className="flex items-center gap-2 text-muted">
                                            <Globe className="w-3.5 h-3.5" />
                                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Agência</span>
                                        </div>
                                        <Link href={`/agencies/${artist.agency.slug ?? artist.agency.id}`} className="text-xs md:text-sm font-bold text-accent hover:underline transition-colors">
                                            {artist.agency.name}
                                        </Link>
                                    </div>
                                )}
                                {/* Grupos */}
                                {allGroups.map(m => (
                                    <div key={m.id} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                                        <div className="flex items-center gap-2 text-muted">
                                            <Music className="w-3.5 h-3.5" />
                                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">
                                                {m.isActive ? 'Grupo' : 'Ex-grupo'}
                                            </span>
                                        </div>
                                        <Link href={`/groups/${m.group.slug ?? m.group.id}`} className={`text-xs md:text-sm font-bold transition-colors ${m.isActive ? 'text-accent hover:underline' : 'text-muted hover:text-foreground'}`}>
                                            {m.group.name}
                                        </Link>
                                    </div>
                                ))}
                            </div>
                            </div>
                        </div>

                        {/* Redes Sociais */}
                        {Object.keys(socialLinks).length > 0 && (
                            <div className="rounded-2xl bg-background border border-border overflow-hidden">
                                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-accent" />
                                    <h3 className="text-[10px] font-black text-muted uppercase tracking-widest">Redes Sociais</h3>
                                </div>
                                <div className="p-3 grid grid-cols-2 md:grid-cols-1 gap-1.5">
                                    {Object.entries(socialLinks).map(([key, url]) => {
                                        const platform = getSocialPlatform(key)
                                        const Icon = typeof platform.icon === 'string' ? null : platform.icon
                                        return (
                                            <a key={key} href={url as string} target="_blank" rel="noopener noreferrer"
                                                className={`group flex items-center gap-2 px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl bg-surface border border-border hover:border-border transition-all ${platform.bg}`}>
                                                <span className={`flex-shrink-0 ${platform.color}`}>
                                                    {Icon ? <Icon className="w-3.5 h-3.5" /> : <span className="text-sm leading-none">{platform.icon as string}</span>}
                                                </span>
                                                <span className="text-xs font-bold text-foreground truncate flex-1">{platform.label}</span>
                                                <ExternalLink className="w-2.5 h-2.5 text-muted group-hover:text-foreground transition-colors flex-shrink-0" />
                                            </a>
                                        )
                                    })}
                                </div>
                            </div>
                        )}


                    </div>

                    {/* ── MAIN ── */}
                    <div className="space-y-10 lg:space-y-16">

                        {/* Perfil Biográfico */}
                        {profileSections.length >= 1 && (() => {
                            const sectionIcons = [User, Film, Sparkles]
                            return (
                                <section>
                                    <div className="space-y-5">
                                        {profileSections.map((sec, i) => {
                                            const Icon = sectionIcons[i] ?? Sparkles
                                            return (
                                                <div key={i}>
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                                                            <Icon className="w-2.5 h-2.5" />
                                                        </span>
                                                        <span className="text-sm font-black text-foreground uppercase tracking-widest">{sec.title}</span>
                                                        <div className="flex-1 h-px bg-border" />
                                                    </div>
                                                    <p className="text-sm text-muted leading-relaxed pl-8 text-justify">{sec.content}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>
                            )
                        })()}

                        {/* Curiosidades */}
                        {artist.curiosidades && artist.curiosidades.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-5">
                                    <span className="text-sm font-black text-foreground uppercase tracking-widest">Curiosidades</span>
                                    <div className="flex-1 h-px bg-border" />
                                </div>
                                <ul className="space-y-3">
                                    {artist.curiosidades.map((c, i) => (
                                        <li key={i} className="flex items-start gap-3 text-muted text-sm leading-relaxed text-justify">
                                            <span className="mt-1 w-5 h-5 rounded-full bg-accent/10 text-accent text-[10px] font-black flex items-center justify-center shrink-0">
                                                {i + 1}
                                            </span>
                                            {c}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* YouTube / TikTok CTAs */}
                        {(() => {
                            const links = (artist.socialLinks as Record<string, string> | null) ?? {}
                            const youtubeUrl = Object.entries(links).find(([k]) => k.toLowerCase().includes('youtube'))?.[1]
                            const tiktokUrl = Object.entries(links).find(([k]) => k.toLowerCase().includes('tiktok'))?.[1]
                            if (!youtubeUrl && !tiktokUrl) return null
                            return (
                                <div className="flex flex-wrap gap-3">
                                    {youtubeUrl && (
                                        <a
                                            href={youtubeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/30 text-[#FF0000] hover:bg-[#FF0000]/20 transition-all group font-bold text-sm"
                                        >
                                            <Youtube className="w-5 h-5" />
                                            Assistir no YouTube
                                            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                                        </a>
                                    )}
                                    {tiktokUrl && (
                                        <a
                                            href={tiktokUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-all group font-bold text-sm"
                                        >
                                            <span className="text-base leading-none">▶</span>
                                            Seguir no TikTok
                                            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                                        </a>
                                    )}
                                </div>
                            )
                        })()}

                        {/* Compartilhar */}
                        <ShareButtons
                            title={artist.nameRomanized}
                            url={`${BASE_URL}/artists/${artist.slug ?? artist.id}`}
                        />

                        {/* Loja: produtos relacionados */}
                        <LojaRelacionados
                            tags={[artist.nameRomanized.toLowerCase(), ...(activeGroup ? [activeGroup.name.toLowerCase()] : [])]}
                            title={`Produtos ${artist.nameRomanized}`}
                        />

                        {/* Filmography */}
                        <section>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="flex items-center gap-2">
                                    <Film className="w-4 h-4 text-accent" />
                                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Filmografia</h3>
                                </div>
                                <div className="flex-1 h-px bg-border" />
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="flex items-center gap-1 text-xs font-bold text-accent"><Film className="w-3 h-3" />{totalProductions}</span>
                                    <span className="text-muted">·</span>
                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-500"><Disc3 className="w-3 h-3" />{totalAlbums}</span>
                                    <span className="text-muted">·</span>
                                    <span className="flex items-center gap-1 text-xs font-bold text-amber-500"><Newspaper className="w-3 h-3" />{newsCount}</span>
                                </div>
                            </div>
                            {artist.productions.length > 0 ? (
                                <>
                                {/* Mobile: lista horizontal compacta */}
                                <div className="lg:hidden flex flex-col gap-2">
                                    {artist.productions.map(({ production }) => {
                                        const streamSignalRaw = production.tmdbId ? streamingByTmdbId.get(production.tmdbId) : null
                                        const streamSignal = streamSignalRaw?.source !== 'internal_production' ? streamSignalRaw : null
                                        const syn = productionTranslations.get(production.id)?.get('synopsis') ?? production.synopsis
                                        return (
                                        <div key={production.id} className="relative group/card">
                                            <Link href={`/productions/${production.slug ?? production.id}`}
                                                className="group flex bg-background rounded-xl border border-border overflow-hidden hover:border-accent/30 hover:shadow-sm transition-all">
                                                {/* Poster — proporção 2:3 fixa */}
                                                <div className="w-24 aspect-[2/3] flex-shrink-0 relative bg-surface self-start">
                                                    {production.imageUrl ? (
                                                        <Image src={production.imageUrl} alt={production.titlePt} fill sizes="96px"
                                                            className="object-cover object-center group-hover:brightness-110 transition-all duration-300" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Film className="w-5 h-5 text-muted/30" />
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Detalhes */}
                                                <div className="flex-1 min-w-0 p-3">
                                                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface border border-border text-muted">{production.type}</span>
                                                        {production.year && <span className="text-[10px] font-bold text-accent">{production.year}</span>}
                                                        {production.voteAverage != null && production.voteAverage > 0 && (
                                                            <span className="text-[10px] text-muted">★ {production.voteAverage.toFixed(1)}</span>
                                                        )}
                                                        {streamSignal && (
                                                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black text-white bg-red-600">
                                                                TOP {streamSignal.rank} · {getStreamingConfig(streamSignal.source).label}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors leading-snug line-clamp-2 mb-1.5">{production.titlePt}</p>
                                                    {syn && <p className="text-[11px] text-muted leading-relaxed line-clamp-2">{syn}</p>}
                                                </div>
                                            </Link>
                                        </div>
                                        )
                                    })}
                                </div>

                                {/* Desktop: lista horizontal com poster + detalhes */}
                                <div className="hidden lg:flex flex-col gap-2">
                                    {artist.productions.map(({ production }) => {
                                        const streamSignalRaw = production.tmdbId ? streamingByTmdbId.get(production.tmdbId) : null
                                        const streamSignal = streamSignalRaw?.source !== 'internal_production' ? streamSignalRaw : null
                                        const syn = productionTranslations.get(production.id)?.get('synopsis') ?? production.synopsis
                                        return (
                                        <div key={production.id} className="relative group/card">
                                            <Link href={`/productions/${production.slug ?? production.id}`}
                                                className="group flex bg-background rounded-xl border border-border overflow-hidden hover:border-accent/30 hover:shadow-sm transition-all">
                                                {/* Poster — proporção 2:3 fixa, corte lateral se necessário */}
                                                <div className="w-28 aspect-[2/3] flex-shrink-0 relative bg-surface self-start">
                                                    {production.imageUrl ? (
                                                        <Image src={production.imageUrl} alt={production.titlePt} fill sizes="112px"
                                                            className="object-cover object-center group-hover:brightness-110 transition-all duration-300" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Film className="w-6 h-6 text-muted/30" />
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Detalhes */}
                                                <div className="flex-1 min-w-0 p-4">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface border border-border text-muted">{production.type}</span>
                                                        {production.year && <span className="text-[10px] font-bold text-accent">{production.year}</span>}
                                                        {production.voteAverage != null && production.voteAverage > 0 && (
                                                            <span className="text-[10px] text-muted">★ {production.voteAverage.toFixed(1)}</span>
                                                        )}
                                                        {streamSignal && (
                                                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black text-white bg-red-600">
                                                                TOP {streamSignal.rank} · {getStreamingConfig(streamSignal.source).label}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors leading-snug line-clamp-2 mb-1.5">{production.titlePt}</p>
                                                    {syn && <p className="text-[11px] text-muted leading-relaxed line-clamp-3">{syn}</p>}
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 flex-shrink-0 self-start">
                                                    <AdminQuickEdit href={`/admin/productions/${production.slug ?? production.id}?returnTo=${encodeURIComponent(`/artists/${artist.id}`)}`} label="Editar" />
                                                </div>
                                            </Link>
                                        </div>
                                        )
                                    })}
                                </div>
                                {totalProductions > 24 && (
                                    <div className="mt-4 text-center">
                                        <Link
                                            href={`/productions?artistId=${artist.id}`}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground border border-border rounded-full px-4 py-2 hover:border-foreground/30 transition-all"
                                        >
                                            Ver todos os {totalProductions} trabalhos →
                                        </Link>
                                    </div>
                                )}
                                </>

                            ) : (
                                <div className="bg-surface rounded-2xl border border-border p-12 text-center">
                                    <Users className="w-12 h-12 text-muted/40 mx-auto mb-4" />
                                    <p className="text-muted font-bold">Nenhuma produção registrada</p>
                                    <p className="text-muted/60 text-sm mt-1">A filmografia será atualizada em breve</p>
                                </div>
                            )}
                        </section>

                        {/* Discography */}
                        {artist.albums.length > 0 && (
                            <DiscographySection albums={artist.albums} />
                        )}

                        {/* Membros do grupo */}
                        {relatedArtists.length > 0 && activeGroup && (
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-accent" />
                                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
                                            Membros de{' '}
                                            <Link href={`/groups/${activeGroup.slug ?? activeGroup.id}`} className="text-accent hover:underline transition-colors normal-case tracking-normal">
                                                {activeGroup.name}
                                            </Link>
                                        </h3>
                                    </div>
                                    <div className="flex-1 h-px bg-border" />
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-3">
                                    {relatedArtists.map(ra => (
                                        <Link key={ra.id} href={`/artists/${ra.id}`}
                                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-background border border-border hover:border-accent/30 hover:shadow-sm transition-all group/ra text-center">
                                            <div className="relative w-14 h-14 lg:w-16 lg:h-16 rounded-full overflow-hidden flex-shrink-0 bg-surface border-2 border-border group-hover/ra:border-accent/40 transition-colors">
                                                {ra.primaryImageUrl ? (
                                                    <Image src={ra.primaryImageUrl} alt={ra.nameRomanized} fill sizes="64px" className="object-cover object-top group-hover/ra:scale-110 transition-transform duration-300" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-sm font-black text-muted">{ra.nameRomanized[0]}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 w-full">
                                                <p className="text-xs font-bold text-foreground truncate group-hover/ra:text-accent transition-colors">{ra.nameRomanized}</p>
                                                {ra.nameHangul && <p className="text-[9px] text-muted leading-none mt-0.5 truncate">{ra.nameHangul}</p>}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}


                        {/* Blog articles */}
                        {blogArticles.length > 0 && (
                            <section>
                                <h2 className="text-sm font-black text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Film className="w-4 h-4 text-accent" />
                                    Artigos
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {blogArticles.map(article => (
                                        <Link
                                            key={article.slug}
                                            href={`/blog/${article.slug}`}
                                            className="group flex flex-col rounded-xl border border-border hover:border-accent/30 bg-surface overflow-hidden transition-all hover:shadow-md"
                                        >
                                            {article.coverImageUrl && (
                                                <div className="relative aspect-video overflow-hidden bg-background">
                                                    <img src={article.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                </div>
                                            )}
                                            <div className="flex-1 p-3">
                                                <p className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-accent transition-colors leading-snug">
                                                    {article.title}
                                                </p>
                                                {article.excerpt && (
                                                    <p className="text-[10px] text-muted mt-1 line-clamp-2 leading-relaxed">{article.excerpt}</p>
                                                )}
                                                <p className="text-[10px] text-muted mt-2">{article.readingTimeMin} min de leitura</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}


                        {/* Instagram Feed — temporariamente oculto */}
                    </div>

                </div>
            </div>
            <ScrollToTop />
        </div>
    )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-2 md:py-3 border-b border-border last:border-0">
            <div className="flex items-center gap-1.5 text-muted">
                {icon}
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-xs md:text-sm font-bold text-foreground text-right">{value}</span>
        </div>
    )
}
