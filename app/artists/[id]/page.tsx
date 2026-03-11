import prisma from "@/lib/prisma"
import { cache } from "react"
import Image from "next/image"
import Link from "next/link"
import { getRoleLabels } from "@/lib/utils/role-labels"
import { getStreamingConfig } from "@/lib/config/streaming-platforms"
import { AdBanner } from "@/components/ui/AdBanner"
import { ViewTracker } from "@/components/features/ViewTracker"
import { InstagramFeed } from "@/components/features/InstagramFeed"
import { DiscographySection } from "@/components/features/DiscographySection"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { FavoriteButton } from "@/components/ui/FavoriteButton"
import { ReportButton } from "@/components/ui/ReportButton"
import { AdminQuickEdit } from "@/components/ui/AdminQuickEdit"
import { JsonLd } from "@/components/seo/JsonLd"
import { AnniversaryCountdown } from "@/components/ui/AnniversaryCountdown"
import { ExpandableBio } from "@/components/ui/ExpandableBio"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { getTranslation } from "@/lib/translations"
import { Instagram, Twitter, Youtube, Music, Globe, User, Ruler, Sparkles, ExternalLink, Newspaper, Eye, Heart, Users, MapPin, Film, Disc3 } from "lucide-react"
import type { Metadata } from "next"

const BASE_URL = 'https://www.hallyuhub.com.br'

// ISR: página cacheada 1h — revalidada sob demanda via revalidatePath no admin
export const revalidate = 3600

// React.cache deduplica a query dentro do mesmo render pass (generateMetadata + page)
const getArtist = cache(async (id: string) => {
    return prisma.artist.findUnique({
        where: { id },
        include: {
            agency: true,
            albums: { orderBy: { releaseDate: 'desc' } },
            productions: {
                where: {
                    production: {
                        flaggedAsNonKorean: false,
                        ageRating: { in: ['L', '10', '12', '14', '16'] },
                    }
                },
                include: { production: true },
                orderBy: { production: { year: { sort: 'desc', nulls: 'last' } } },
            },
            memberships: {
                include: { group: { select: { id: true, name: true, nameHangul: true, profileImageUrl: true } } },
                orderBy: { isActive: 'desc' },
            },
            streamingSignals: {
                where: { expiresAt: { gt: new Date() } },
                select: { showTitle: true, showTmdbId: true, rank: true, source: true },
                orderBy: { rank: 'asc' },
            },
        }
    })
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
    return { icon: Globe, label: key, action: 'Visitar', color: 'text-zinc-400', bg: 'hover:border-zinc-500/50 hover:bg-zinc-800' }
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const params = await props.params;
    const artist = await getArtist(params.id)

    if (!artist) {
        return {
            title: 'Artista não encontrado - HallyuHub',
            description: 'Este artista não foi encontrado em nossa base de dados.'
        }
    }

    const roles = artist.roles || []
    const description = artist.bio || `${artist.nameRomanized}${artist.nameHangul ? ` (${artist.nameHangul})` : ''} - ${roles.join(', ')}${artist.agency ? ` · ${artist.agency.name}` : ''}`
    const isThinContent = !artist.primaryImageUrl && !artist.bio

    return {
        title: `${artist.nameRomanized}${artist.nameHangul ? ` (${artist.nameHangul})` : ''} - HallyuHub`,
        description: description.slice(0, 160),
        alternates: { canonical: `${BASE_URL}/artists/${params.id}` },
        ...(isThinContent ? { robots: { index: false, follow: true } } : {}),
        openGraph: {
            title: `${artist.nameRomanized} - HallyuHub`,
            description: description.slice(0, 160),
            images: artist.primaryImageUrl ? [{ url: artist.primaryImageUrl, width: 1200, height: 630, alt: artist.nameRomanized }] : [],
            type: 'profile',
            url: `${BASE_URL}/artists/${params.id}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${artist.nameRomanized} - HallyuHub`,
            description: description.slice(0, 160),
            images: artist.primaryImageUrl ? [artist.primaryImageUrl] : []
        }
    }
}

export default async function ArtistDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    // Step 1: fetch artist (deduplica com generateMetadata via React.cache)
    const artist = await getArtist(params.id)

    if (!artist) {
        return (
            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
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
    const [artistNews, instagramPosts, newsCount, bioPt, relatedArtists] = await Promise.all([
        prisma.news.findMany({
            where: { artists: { some: { artistId: params.id } } },
            select: { id: true, title: true, imageUrl: true, publishedAt: true, tags: true },
            orderBy: { publishedAt: 'desc' },
            take: 6,
        }),
        prisma.instagramPost.findMany({
            where: { artistId: params.id },
            orderBy: { postedAt: 'desc' },
            take: 12,
            select: { id: true, imageUrl: true, caption: true, permalink: true, postedAt: true },
        }),
        prisma.news.count({ where: { artists: { some: { artistId: params.id } } } }),
        getTranslation('artist', params.id, 'bio', 'pt-BR'),
        activeGroupId
            ? prisma.artist.findMany({
                where: {
                    id: { not: artist.id },
                    flaggedAsNonKorean: false,
                    memberships: { some: { groupId: activeGroupId, isActive: true } },
                },
                take: 8,
                select: { id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true, roles: true, gender: true },
                orderBy: { trendingScore: 'desc' },
            })
            : Promise.resolve([]),
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

    return (
        <div className="min-h-screen bg-black">
            <ViewTracker artistId={artist.id} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "Person",
                "name": artist.nameRomanized,
                "alternateName": artist.nameHangul ?? undefined,
                "description": artist.bio?.slice(0, 300) ?? undefined,
                "image": artist.primaryImageUrl ?? undefined,
                "url": `${BASE_URL}/artists/${artist.id}`,
                "birthDate": artist.birthDate ? new Date(artist.birthDate).toISOString().split('T')[0] : undefined,
                "jobTitle": artist.roles?.[0] ?? undefined,
                ...(activeGroup ? { "memberOf": { "@type": "MusicGroup", "name": activeGroup.name } } : {}),
                ...(artist.agency ? { "worksFor": { "@type": "Organization", "name": artist.agency.name } } : {}),
            }} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Artistas", "item": `${BASE_URL}/artists` },
                    { "@type": "ListItem", "position": 2, "name": artist.nameRomanized, "item": `${BASE_URL}/artists/${artist.id}` },
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
                        <div className="w-full h-full bg-gradient-to-br from-purple-900/30 via-zinc-900 to-black" />
                    )}
                </div>
                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black from-0% via-black/60 via-[35%] to-transparent to-[65%]" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

                {/* Breadcrumbs + Favorite */}
                <div className="absolute top-24 md:top-28 left-0 right-0 px-4 sm:px-12 md:px-20 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                    <Breadcrumbs items={[{ label: 'Artistas', href: '/artists' }, { label: artist.nameRomanized }]} />
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                        <AdminQuickEdit href={`/admin/artists/${artist.id}?returnTo=${encodeURIComponent(`/artists/${artist.id}`)}`} label="Editar" />
                        <ReportButton entityType="artist" entityId={artist.id} entityName={artist.nameRomanized}
                            className="bg-black/40 border border-white/10 backdrop-blur-sm" />
                        <FavoriteButton id={artist.id} itemName={artist.nameRomanized} itemType="artista"
                            className="bg-black/40 border border-white/10 backdrop-blur-sm" />
                    </div>
                </div>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-12 md:px-20 pb-10 md:pb-14">
                    <div className="flex items-end gap-8">
                    <div className="flex flex-col gap-2 flex-1 max-w-2xl">
                        {/* Roles + group + birthday countdown */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {getRoleLabels(roles, artist.gender).map(role => (
                                <span key={role} className="text-xs font-black uppercase px-3 py-1 bg-white/10 backdrop-blur-sm text-white rounded-full border border-white/20">
                                    {role}
                                </span>
                            ))}
                            {activeGroup && (
                                <Link href={`/groups/${activeGroup.id}`}
                                    className="text-xs font-black px-3 py-1 bg-purple-500/20 backdrop-blur-sm text-purple-300 rounded-full border border-purple-500/40 hover:bg-purple-500/30 transition-colors">
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
                                <p className="text-lg md:text-3xl font-bold mt-1 text-purple-400 drop-shadow-lg flex items-baseline gap-2 flex-wrap">
                                    <span>{artist.nameHangul}</span>
                                    {age !== null && (
                                        <span className="text-sm md:text-xl font-semibold text-zinc-400">{age} anos</span>
                                    )}
                                </p>
                            )}
                            {stageNames.length > 0 && (
                                <p className="hidden md:block text-zinc-500 text-sm font-medium mt-1.5">
                                    Também conhecido como: {stageNames.join(', ')}
                                </p>
                            )}
                        </div>

                        {/* Bio — só desktop; no mobile fica no conteúdo abaixo */}
                        {(bioPt ?? artist.bio) && (
                            <div className="hidden md:block">
                                <ExpandableBio bio={bioPt ?? artist.bio!} />
                            </div>
                        )}

                        {/* Stats — só desktop */}
                        <div className="hidden md:flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-1.5 text-purple-400/80">
                                <Eye className="w-3.5 h-3.5" />
                                <span className="text-sm font-bold">{artist.viewCount.toLocaleString('pt-BR')} views</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-pink-400/80">
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
            <div className="px-4 sm:px-12 md:px-20 py-8 lg:py-12">
                <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 max-w-[1600px] mx-auto">

                    {/* ── SIDEBAR ── */}
                    <div className="space-y-4 lg:space-y-6 lg:col-span-1">

                        {/* Bio mobile — antes das informações, só no mobile */}
                        {(bioPt ?? artist.bio) && (
                            <div className="md:hidden">
                                <ExpandableBio bio={bioPt ?? artist.bio!} />
                            </div>
                        )}

                        {/* Informações */}
                        <div className="rounded-2xl bg-zinc-900/50 border border-white/5 overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-purple-400" />
                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Informações</h3>
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
                                    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <Globe className="w-3.5 h-3.5" />
                                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Agência</span>
                                        </div>
                                        <Link href={`/agencies/${artist.agency.id}`} className="text-xs md:text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors">
                                            {artist.agency.name}
                                        </Link>
                                    </div>
                                )}
                                {/* Grupos */}
                                {allGroups.map(m => (
                                    <div key={m.id} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <Music className="w-3.5 h-3.5" />
                                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">
                                                {m.isActive ? 'Grupo' : 'Ex-grupo'}
                                            </span>
                                        </div>
                                        <Link href={`/groups/${m.group.id}`} className={`text-xs md:text-sm font-bold transition-colors ${m.isActive ? 'text-purple-400 hover:text-purple-300' : 'text-zinc-500 hover:text-zinc-400'}`}>
                                            {m.group.name}
                                        </Link>
                                    </div>
                                ))}
                            </div>
                            </div>
                        </div>

                        {/* Redes Sociais */}
                        {Object.keys(socialLinks).length > 0 && (
                            <div className="rounded-2xl bg-zinc-900/50 border border-white/5 overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Redes Sociais</h3>
                                </div>
                                <div className="p-3 grid grid-cols-2 md:grid-cols-1 gap-1.5">
                                    {Object.entries(socialLinks).map(([key, url]) => {
                                        const platform = getSocialPlatform(key)
                                        const Icon = typeof platform.icon === 'string' ? null : platform.icon
                                        return (
                                            <a key={key} href={url as string} target="_blank" rel="noopener noreferrer"
                                                className={`group flex items-center gap-2 px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl bg-zinc-800/50 border border-white/5 hover:border-white/15 transition-all ${platform.bg}`}>
                                                <span className={`flex-shrink-0 ${platform.color}`}>
                                                    {Icon ? <Icon className="w-3.5 h-3.5" /> : <span className="text-sm leading-none">{platform.icon as string}</span>}
                                                </span>
                                                <span className="text-xs font-bold text-white truncate flex-1">{platform.label}</span>
                                                <ExternalLink className="w-2.5 h-2.5 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
                                            </a>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 text-center">
                                <Film className="w-3.5 h-3.5 text-purple-400 mx-auto mb-1" />
                                <div className="text-base font-black text-purple-400">{artist.productions.length}</div>
                                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wide mt-0.5">Produções</p>
                            </div>
                            <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 text-center">
                                <Disc3 className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                                <div className="text-base font-black text-emerald-400">{artist.albums.length}</div>
                                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wide mt-0.5">Lançamentos</p>
                            </div>
                            <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 text-center">
                                <Newspaper className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                                <div className="text-base font-black text-amber-400">{newsCount}</div>
                                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wide mt-0.5">Notícias</p>
                            </div>
                        </div>

                    </div>

                    {/* ── MAIN ── */}
                    <div className="lg:col-span-2 space-y-10 lg:space-y-16">

                        {/* Ad: topo do conteúdo principal */}
                        <AdBanner
                            slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTIST ?? ''}
                            format="horizontal"
                        />

                        {/* Filmography */}
                        <section>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="flex items-center gap-2">
                                    <Film className="w-4 h-4 text-purple-400" />
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Filmografia</h3>
                                </div>
                                <div className="flex-1 h-px bg-white/5" />
                                {artist.productions.length > 0 && (
                                    <span className="text-xs text-zinc-600 font-bold flex-shrink-0">{artist.productions.length} {artist.productions.length !== 1 ? 'produções' : 'produção'}</span>
                                )}
                            </div>
                            {artist.productions.length > 0 ? (
                                <div className="space-y-4">
                                    {artist.productions.map(({ production }) => {
                                        const streamSignalRaw = production.tmdbId ? streamingByTmdbId.get(production.tmdbId) : null
                                        const streamSignal = streamSignalRaw?.source !== 'internal_production' ? streamSignalRaw : null
                                        return (
                                        <div key={production.id} className="relative group/card">
                                            <Link href={`/productions/${production.id}`}
                                                className="group flex bg-zinc-900/50 rounded-xl border border-white/5 overflow-hidden hover:border-purple-500/30 hover:bg-zinc-900 transition-all">
                                                <div className="w-20 md:w-28 flex-shrink-0 relative bg-zinc-800">
                                                    {production.imageUrl ? (
                                                        <Image src={production.imageUrl} alt={production.titlePt} fill sizes="112px"
                                                            className="object-cover brightness-75 group-hover:brightness-90 transition-all" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <span className="text-xs font-black text-zinc-700 uppercase text-center px-2 leading-tight">{production.type}</span>
                                                        </div>
                                                    )}
                                                    {streamSignal && (
                                                        <div className="absolute bottom-0 left-0 right-0 p-1">
                                                            <span className="flex items-center gap-1 px-1.5 py-1 rounded text-[9px] font-black text-white leading-none w-full bg-red-600">
                                                                <span className="shrink-0">TOP {streamSignal.rank}</span>
                                                                <span className="opacity-60">·</span>
                                                                <span className="truncate">{getStreamingConfig(streamSignal.source).label}</span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 p-3 md:p-5">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <h4 className="text-sm md:text-base font-black text-white group-hover:text-purple-300 transition-colors leading-tight">{production.titlePt}</h4>
                                                        <ExternalLink className="w-3 h-3 text-zinc-700 group-hover:text-purple-500 transition-colors ml-auto flex-shrink-0" />
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{production.type}</span>
                                                        {production.year && <span className="text-[10px] font-bold text-purple-400">{production.year}</span>}
                                                        {production.titleKr && <span className="text-[10px] text-zinc-600 font-medium truncate">{production.titleKr}</span>}
                                                    </div>
                                                    {production.synopsis && <p className="text-zinc-500 text-xs md:text-sm leading-relaxed line-clamp-2">{production.synopsis}</p>}
                                                </div>
                                            </Link>
                                            <div className="absolute top-2.5 right-2.5">
                                                <AdminQuickEdit href={`/admin/productions/${production.id}?returnTo=${encodeURIComponent(`/artists/${artist.id}`)}`} label="Editar" />
                                            </div>
                                        </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-12 text-center">
                                    <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                    <p className="text-zinc-500 font-bold">Nenhuma produção registrada</p>
                                    <p className="text-zinc-700 text-sm mt-1">A filmografia será atualizada em breve</p>
                                </div>
                            )}
                        </section>

                        {/* Notícias */}
                        {artistNews.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="flex items-center gap-2">
                                        <Newspaper className="w-4 h-4 text-amber-400" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Notícias</h3>
                                    </div>
                                    <div className="flex-1 h-px bg-white/5" />
                                    <Link href={`/news?artistId=${artist.id}`} className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex-shrink-0">
                                        Ver todas →
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {artistNews.map((item) => (
                                        <Link key={item.id} href={`/news/${item.id}`}
                                            className="group flex gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-purple-500/30 hover:bg-zinc-900 transition-all">
                                            <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-800">
                                                {item.imageUrl ? (
                                                    <Image src={item.imageUrl} alt={item.title} fill sizes="80px"
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Newspaper className="w-5 h-5 text-zinc-700" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col justify-between min-w-0 flex-1">
                                                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                                                    {item.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] font-bold text-zinc-600">
                                                        {new Date(item.publishedAt).toLocaleDateString('pt-BR')}
                                                    </span>
                                                    {item.tags?.[0] && (
                                                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded-sm">
                                                            {item.tags[0]}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Discography */}
                        {artist.albums.length > 0 && (
                            <DiscographySection albums={artist.albums} />
                        )}

                        {/* Membros do grupo */}
                        {relatedArtists.length > 0 && activeGroup && (
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-purple-400" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">
                                            Membros de{' '}
                                            <Link href={`/groups/${activeGroup.id}`} className="text-purple-400 hover:text-purple-300 transition-colors normal-case tracking-normal">
                                                {activeGroup.name}
                                            </Link>
                                        </h3>
                                    </div>
                                    <div className="flex-1 h-px bg-white/5" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {relatedArtists.map(ra => (
                                        <Link key={ra.id} href={`/artists/${ra.id}`}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/50 border border-white/5 hover:border-white/10 hover:bg-zinc-900 transition-all group/ra">
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800">
                                                {ra.primaryImageUrl ? (
                                                    <Image src={ra.primaryImageUrl} alt={ra.nameRomanized} fill sizes="32px" className="object-cover group-hover/ra:scale-105 transition-transform" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-xs font-black text-zinc-600">{ra.nameRomanized[0]}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate group-hover/ra:text-purple-300 transition-colors">{ra.nameRomanized}</p>
                                                {ra.nameHangul && <p className="text-[9px] text-zinc-600 leading-none mt-0.5 truncate">{ra.nameHangul}</p>}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Instagram Feed */}
                        {instagramPosts.length > 0 && (
                            <InstagramFeed
                                posts={instagramPosts}
                                instagramUrl={(artist.socialLinks as Record<string, string> | null)?.instagram ?? null}
                            />
                        )}
                    </div>
                </div>
            </div>
            <ScrollToTop />
        </div>
    )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-2 md:py-3 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-1.5 text-zinc-500">
                {icon}
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-xs md:text-sm font-bold text-zinc-300 text-right">{value}</span>
        </div>
    )
}
