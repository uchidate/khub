import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { ViewTracker } from "@/components/features/ViewTracker"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { FavoriteButton } from "@/components/ui/FavoriteButton"
import { JsonLd } from "@/components/seo/JsonLd"
import { AnniversaryCountdown } from "@/components/ui/AnniversaryCountdown"
import { Instagram, Twitter, Youtube, Music, Globe, User, Ruler, Droplet, Sparkles, ExternalLink, Newspaper, Eye, Heart, Users } from "lucide-react"
import type { Metadata } from "next"

const BASE_URL = 'https://www.hallyuhub.com.br'

export const dynamic = 'force-dynamic'

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

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const artist = await prisma.artist.findUnique({
        where: { id: params.id },
        include: { agency: true }
    })

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

export default async function ArtistDetailPage({ params }: { params: { id: string } }) {
    const [artist, artistNews] = await Promise.all([
        prisma.artist.findUnique({
            where: { id: params.id },
            include: {
                agency: true,
                albums: { orderBy: { releaseDate: 'desc' } },
                productions: { include: { production: true } },
                memberships: {
                    include: { group: { select: { id: true, name: true, nameHangul: true, profileImageUrl: true } } },
                    orderBy: { isActive: 'desc' },
                },
            }
        }),
        prisma.news.findMany({
            where: { artists: { some: { artistId: params.id } } },
            select: { id: true, title: true, imageUrl: true, publishedAt: true, tags: true },
            orderBy: { publishedAt: 'desc' },
            take: 6,
        }),
    ])

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

    const roles = artist.roles || []
    const stageNames = artist.stageNames || []
    const socialLinks = (artist.socialLinks as Record<string, string>) || {}
    const birthDate = artist.birthDate ? new Date(artist.birthDate) : null
    const birthDateFormatted = birthDate?.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null

    const activeGroup = artist.memberships.find(m => m.isActive)?.group ?? null
    const allGroups = artist.memberships

    // Artistas relacionados: outros membros do grupo principal
    const relatedArtists = activeGroup
        ? await prisma.artist.findMany({
            where: {
                id: { not: artist.id },
                memberships: { some: { groupId: activeGroup.id, isActive: true } },
            },
            take: 8,
            select: { id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true, roles: true },
            orderBy: { trendingScore: 'desc' },
        })
        : []

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
                {/* Main image */}
                <div className="absolute inset-0">
                    {artist.primaryImageUrl ? (
                        <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill priority sizes="100vw" className="object-cover object-top" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900/30 via-zinc-900 to-black" />
                    )}
                </div>
                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

                {/* Breadcrumbs + Favorite */}
                <div className="absolute top-24 md:top-28 left-0 right-0 px-4 sm:px-12 md:px-20 flex justify-between items-start">
                    <Breadcrumbs items={[{ label: 'Artistas', href: '/artists' }, { label: artist.nameRomanized }]} />
                    <FavoriteButton id={artist.id} itemName={artist.nameRomanized} itemType="artista"
                        className="bg-black/40 border border-white/10 backdrop-blur-sm" />
                </div>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-12 md:px-20 pb-10 md:pb-14">
                    <div className="flex flex-col gap-3 max-w-3xl">
                        {/* Roles + group + birthday countdown */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {roles.map(role => (
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
                            <h1 className="text-5xl md:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-2xl">
                                {artist.nameRomanized}
                            </h1>
                            {artist.nameHangul && (
                                <p className="text-xl md:text-3xl font-bold mt-1 text-purple-400 drop-shadow-lg">{artist.nameHangul}</p>
                            )}
                            {stageNames.length > 0 && (
                                <p className="text-zinc-500 text-sm font-medium mt-1.5">
                                    Também conhecido como: {stageNames.join(', ')}
                                </p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 flex-wrap mt-1">
                            {age !== null && (
                                <div className="flex items-center gap-1.5 text-purple-400">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span className="text-sm font-bold">{age} anos</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-purple-400">
                                <Eye className="w-3.5 h-3.5" />
                                <span className="text-sm font-bold">{artist.viewCount.toLocaleString('pt-BR')} views</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-pink-400">
                                <Heart className="w-3.5 h-3.5" />
                                <span className="text-sm font-bold">{artist.favoriteCount.toLocaleString('pt-BR')} fãs</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CONTEÚDO ── */}
            <div className="px-4 sm:px-12 md:px-20 py-12">
                <div className="grid lg:grid-cols-3 gap-12 max-w-[1600px] mx-auto">

                    {/* ── SIDEBAR ── */}
                    <div className="space-y-8 lg:col-span-1">

                        {/* Bio */}
                        {artist.bio && (
                            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Sobre</h3>
                                <p className="text-zinc-300 leading-relaxed text-sm">{artist.bio}</p>
                            </div>
                        )}

                        {/* Informações */}
                        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Informações</h3>
                            <div className="space-y-0">
                                {artist.birthName && (
                                    <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Nome Real" value={artist.birthName} />
                                )}
                                {birthDateFormatted && (
                                    <InfoRow icon={<Sparkles className="w-3.5 h-3.5" />} label="Nascimento" value={`${birthDateFormatted}${age !== null ? ` (${age} anos)` : ''}`} />
                                )}
                                {artist.height && (
                                    <InfoRow icon={<Ruler className="w-3.5 h-3.5" />} label="Altura" value={artist.height} />
                                )}
                                {artist.bloodType && (
                                    <InfoRow icon={<Droplet className="w-3.5 h-3.5" />} label="Tipo Sanguíneo" value={artist.bloodType} />
                                )}
                                {artist.zodiacSign && (
                                    <InfoRow icon={<Sparkles className="w-3.5 h-3.5" />} label="Signo" value={artist.zodiacSign} />
                                )}
                                {artist.agency && (
                                    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <Globe className="w-3.5 h-3.5" />
                                            <span className="text-xs font-black uppercase tracking-widest">Agência</span>
                                        </div>
                                        <Link href={`/agencies/${artist.agency.id}`} className="text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors">
                                            {artist.agency.name}
                                        </Link>
                                    </div>
                                )}
                                {/* Grupos */}
                                {allGroups.map(m => (
                                    <div key={m.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <Music className="w-3.5 h-3.5" />
                                            <span className="text-xs font-black uppercase tracking-widest">
                                                {m.isActive ? 'Grupo' : 'Ex-grupo'}
                                            </span>
                                        </div>
                                        <Link href={`/groups/${m.group.id}`} className={`text-sm font-bold transition-colors ${m.isActive ? 'text-purple-400 hover:text-purple-300' : 'text-zinc-500 hover:text-zinc-400'}`}>
                                            {m.group.name}
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Redes Sociais */}
                        {Object.keys(socialLinks).length > 0 && (
                            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Redes Sociais</h3>
                                <div className="flex flex-col gap-2">
                                    {Object.entries(socialLinks).map(([key, url]) => {
                                        const platform = getSocialPlatform(key)
                                        const Icon = typeof platform.icon === 'string' ? null : platform.icon
                                        return (
                                            <a key={key} href={url as string} target="_blank" rel="noopener noreferrer"
                                                className={`group flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-800/50 border border-white/5 hover:border-white/10 transition-all ${platform.bg}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-base ${platform.color}`}>
                                                        {Icon ? <Icon className="w-4 h-4" /> : <span>{platform.icon as string}</span>}
                                                    </span>
                                                    <span className="text-sm font-bold text-white">{platform.label}</span>
                                                </div>
                                                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                            </a>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 text-center">
                                <Eye className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                                <div className="text-2xl font-black text-cyan-400">{artist.viewCount.toLocaleString('pt-BR')}</div>
                                <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider mt-0.5">Views</p>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 text-center">
                                <Heart className="w-5 h-5 text-pink-400 mx-auto mb-1" />
                                <div className="text-2xl font-black text-pink-400">{artist.favoriteCount.toLocaleString('pt-BR')}</div>
                                <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider mt-0.5">Fãs</p>
                            </div>
                        </div>

                        {/* Artistas Relacionados (membros do grupo) */}
                        {relatedArtists.length > 0 && activeGroup && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">
                                    Membros de {activeGroup.name}
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {relatedArtists.map(ra => (
                                        <Link key={ra.id} href={`/artists/${ra.id}`}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-white/10 hover:bg-zinc-900 transition-all group/ra">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800">
                                                {ra.primaryImageUrl ? (
                                                    <Image src={ra.primaryImageUrl} alt={ra.nameRomanized} fill sizes="40px" className="object-cover group-hover/ra:scale-105 transition-transform" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-sm font-black text-zinc-600">{ra.nameRomanized[0]}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate group-hover/ra:text-purple-300 transition-colors">{ra.nameRomanized}</p>
                                                {ra.nameHangul && <p className="text-[10px] text-zinc-600 mt-0.5">{ra.nameHangul}</p>}
                                            </div>
                                            {ra.roles?.[0] && (
                                                <span className="text-[9px] font-black uppercase text-zinc-600 flex-shrink-0">{ra.roles[0]}</span>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── MAIN ── */}
                    <div className="lg:col-span-2 space-y-16">

                        {/* Discography */}
                        {artist.albums.length > 0 && (
                            <section>
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Music className="w-4 h-4" />
                                    Discografia
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {artist.albums.map((album) => (
                                        <div key={album.id} className="group relative bg-zinc-900 rounded-xl border border-white/5 overflow-hidden hover:border-purple-500/40 transition-all hover:-translate-y-1">
                                            <div className="aspect-square relative bg-zinc-800">
                                                {album.coverUrl ? (
                                                    <Image src={album.coverUrl} alt={album.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                                        <Music className="w-8 h-8 opacity-20" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                                    {album.spotifyUrl && (
                                                        <a href={album.spotifyUrl} target="_blank" rel="noopener noreferrer"
                                                            className="p-2 bg-green-500 rounded-full hover:scale-110 transition-transform text-black" title="Ouvir no Spotify">
                                                            <Music className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    {album.youtubeUrl && (
                                                        <a href={album.youtubeUrl} target="_blank" rel="noopener noreferrer"
                                                            className="p-2 bg-red-600 rounded-full hover:scale-110 transition-transform text-white" title="Ver no YouTube">
                                                            <Youtube className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="font-bold text-white text-sm line-clamp-1">{album.title}</h4>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[10px] uppercase font-black text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded-sm">
                                                        {album.type === 'ALBUM' ? 'Álbum' : album.type === 'EP' ? 'EP' : 'Single'}
                                                    </span>
                                                    {album.releaseDate && (
                                                        <span className="text-[10px] font-bold text-zinc-500">
                                                            {new Date(album.releaseDate).getFullYear()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Filmography */}
                        <section>
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6">Filmografia</h3>
                            {artist.productions.length > 0 ? (
                                <div className="space-y-4">
                                    {artist.productions.map(({ production }) => (
                                        <Link key={production.id} href={`/productions/${production.id}`}
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
                                            </div>
                                            <div className="flex-1 p-5">
                                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                                    <h4 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">{production.titlePt}</h4>
                                                    {production.year && <span className="text-xs font-bold text-purple-400">{production.year}</span>}
                                                    <ExternalLink className="w-3.5 h-3.5 text-zinc-700 group-hover:text-purple-500 transition-colors ml-auto" />
                                                </div>
                                                {production.titleKr && <p className="text-xs text-zinc-600 font-medium mb-2">{production.titleKr}</p>}
                                                {production.synopsis && <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2">{production.synopsis}</p>}
                                            </div>
                                        </Link>
                                    ))}
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
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        <Newspaper className="w-4 h-4" />
                                        Notícias sobre {artist.nameRomanized}
                                    </h3>
                                    <Link href={`/news?artistId=${artist.id}`} className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
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
                    </div>
                </div>
            </div>
        </div>
    )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-2 text-zinc-500">
                {icon}
                <span className="text-xs font-black uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-sm font-bold text-zinc-300">{value}</span>
        </div>
    )
}
