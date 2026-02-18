import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { ViewTracker } from "@/components/features/ViewTracker"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { FavoriteButton } from "@/components/ui/FavoriteButton"
import { Instagram, Twitter, Youtube, Music, Globe, User, Ruler, Droplet, Sparkles, ExternalLink, Newspaper } from "lucide-react"
import type { Metadata } from "next"

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
    // Fallback by URL keyword detection
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
    const description = artist.bio || `${artist.nameRomanized} (${artist.nameHangul}) - ${roles.join(', ')}${artist.agency ? ` · ${artist.agency.name}` : ''}`

    return {
        title: `${artist.nameRomanized} (${artist.nameHangul}) - HallyuHub`,
        description: description.slice(0, 160),
        openGraph: {
            title: `${artist.nameRomanized} - HallyuHub`,
            description: description.slice(0, 160),
            images: artist.primaryImageUrl ? [{
                url: artist.primaryImageUrl,
                width: 1200,
                height: 630,
                alt: artist.nameRomanized
            }] : [],
            type: 'profile'
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
                albums: {
                    orderBy: { releaseDate: 'desc' }
                },
                productions: {
                    include: { production: true }
                },
                memberships: {
                    where: { isActive: true },
                    include: { group: { select: { id: true, name: true, nameHangul: true } } },
                    take: 1,
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

    return (
        <div className="min-h-screen">
            <ViewTracker artistId={artist.id} />
            {/* Hero */}
            <div className="relative h-[65vh] md:h-[75vh]">
                {artist.primaryImageUrl ? (
                    <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill priority sizes="100vw" className="object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
                )}
                <div className="absolute inset-0 hero-gradient" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

                {/* Breadcrumbs */}
                <div className="absolute top-24 md:top-32 left-0 right-0 px-4 sm:px-12 md:px-20 flex justify-between items-start">
                    <Breadcrumbs items={[
                        { label: 'Artistas', href: '/artists' },
                        { label: artist.nameRomanized }
                    ]} />
                    <FavoriteButton
                        id={artist.id}
                        itemName={artist.nameRomanized}
                        itemType="artista"
                        className="bg-black/50 backdrop-blur-sm hover:bg-black/70"
                    />
                </div>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-12 md:px-20 pb-10 md:pb-16">
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {roles.map(role => (
                            <span key={role} className="text-xs uppercase font-black px-2 py-0.5 bg-white text-black rounded-sm">{role}</span>
                        ))}
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white leading-none tracking-tighter">{artist.nameRomanized}</h1>
                    <p className="text-xl md:text-2xl text-purple-500 font-bold mt-1">{artist.nameHangul}</p>
                    {stageNames.length > 0 && (
                        <p className="text-zinc-500 text-sm font-medium mt-1.5">Também conhecida como: {stageNames.join(', ')}</p>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-12 md:px-20 py-16">
                <div className="grid md:grid-cols-3 gap-16">
                    {/* Sidebar: bio + details */}
                    <div className="space-y-8">
                        {artist.bio && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-3">Sobre</h3>
                                <p className="text-zinc-400 leading-relaxed font-medium">{artist.bio}</p>
                            </div>
                        )}

                            {artist.birthName && (
                                <div className="flex justify-between py-3 border-b border-white/5 group">
                                    <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                        <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Nome Real</span>
                                    </div>
                                    <span className="text-sm font-bold text-zinc-300">{artist.birthName}</span>
                                </div>
                            )}
                            {birthDateFormatted && (
                                <div className="flex justify-between py-3 border-b border-white/5 group">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                        <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Nascimento</span>
                                    </div>
                                    <span className="text-sm font-bold text-zinc-300">{birthDateFormatted}</span>
                                </div>
                            )}
                            {age !== null && (
                                <div className="flex justify-between py-3 border-b border-white/5 group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-black text-zinc-600 group-hover:text-purple-500 transition-colors">#</div>
                                        <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Idade</span>
                                    </div>
                                    <span className="text-sm font-bold text-zinc-300">{age} anos</span>
                                </div>
                            )}
                            {artist.height && (
                                <div className="flex justify-between py-3 border-b border-white/5 group">
                                    <div className="flex items-center gap-2">
                                        <Ruler className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                        <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Altura</span>
                                    </div>
                                    <span className="text-sm font-bold text-zinc-300">{artist.height}</span>
                                </div>
                            )}
                            {artist.bloodType && (
                                <div className="flex justify-between py-3 border-b border-white/5 group">
                                    <div className="flex items-center gap-2">
                                        <Droplet className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                        <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Tipo Sanguíneo</span>
                                    </div>
                                    <span className="text-sm font-bold text-zinc-300">{artist.bloodType}</span>
                                </div>
                            )}
                            {artist.zodiacSign && (
                                <div className="flex justify-between py-3 border-b border-white/5 group">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                        <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Signo</span>
                                    </div>
                                    <span className="text-sm font-bold text-zinc-300">{artist.zodiacSign}</span>
                                </div>
                            )}
                            {artist.agency && (
                                <div className="flex justify-between py-3 border-b border-white/5 group">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                        <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Agência</span>
                                    </div>
                                    <Link href={`/agencies/${artist.agency.id}`} className="text-sm font-bold text-purple-500 hover:text-purple-400 transition-colors">
                                        {artist.agency.name}
                                    </Link>
                                </div>
                            )}
                            {artist.memberships?.[0] && (
                                <div className="flex justify-between py-3 border-b border-white/5 group">
                                    <div className="flex items-center gap-2">
                                        <Music className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                        <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">Grupo</span>
                                    </div>
                                    <Link href={`/groups/${artist.memberships[0].group.id}`} className="text-sm font-bold text-purple-500 hover:text-purple-400 transition-colors">
                                        {artist.memberships[0].group.name}
                                    </Link>
                                </div>
                            )}

                        {Object.keys(socialLinks).length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-3">Redes Sociais</h3>
                                <div className="flex flex-col gap-2">
                                    {Object.entries(socialLinks).map(([key, url]) => {
                                        const platform = getSocialPlatform(key)
                                        const Icon = typeof platform.icon === 'string' ? null : platform.icon
                                        return (
                                            <a key={key} href={url as string} target="_blank" rel="noopener noreferrer"
                                                className={`group flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 transition-all ${platform.bg}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-base ${platform.color}`}>
                                                        {Icon ? <Icon className="w-4 h-4" /> : <span>{platform.icon as string}</span>}
                                                    </span>
                                                    <span className="text-sm font-bold text-white">{platform.label}</span>
                                                </div>
                                                <span className={`text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity ${platform.color}`}>
                                                    {platform.action} →
                                                </span>
                                            </a>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content Column */}
                    <div className="md:col-span-2 space-y-16">

                        {/* Discography Section */}
                        {artist.albums && artist.albums.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Music className="w-4 h-4" />
                                    Discografia Digital
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {artist.albums.map((album) => (
                                        <div key={album.id} className="group relative bg-zinc-900 rounded-lg border border-white/5 overflow-hidden hover:border-purple-500/50 transition-all hover:-translate-y-1">
                                            {/* Cover */}
                                            <div className="aspect-square relative bg-zinc-800">
                                                {album.coverUrl ? (
                                                    <Image src={album.coverUrl} alt={album.title} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                                        <Music className="w-8 h-8 opacity-20" />
                                                    </div>
                                                )}
                                                {/* Overlay Actions */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                                    {album.spotifyUrl && (
                                                        <a href={album.spotifyUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-500 rounded-full hover:scale-110 transition-transform text-black" title="Ouvir no Spotify">
                                                            <Globe className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    {album.youtubeUrl && (
                                                        <a href={album.youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-red-600 rounded-full hover:scale-110 transition-transform text-white" title="Ver no YouTube">
                                                            <Youtube className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    {album.appleMusicUrl && (
                                                        <a href={album.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-pink-500 rounded-full hover:scale-110 transition-transform text-white" title="Ouvir no Apple Music">
                                                            <Music className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Info */}
                                            <div className="p-3">
                                                <h4 className="font-bold text-white text-sm line-clamp-1" title={album.title}>{album.title}</h4>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[10px] uppercase font-black text-neon-pink bg-neon-pink/10 px-1.5 py-0.5 rounded-sm">
                                                        {album.type}
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
                            </div>
                        )}

                        {/* Filmography Section */}
                        <div>
                            <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6">Filmografia</h3>
                            {artist.productions.length > 0 ? (
                                <div className="space-y-4">
                                    {artist.productions.map(({ production }) => (
                                        <Link key={production.id} href={`/productions/${production.id}`} className="group flex bg-zinc-900 rounded-lg border border-white/5 overflow-hidden hover:border-purple-500/30 transition-colors">
                                            {/* Poster */}
                                            <div className="w-20 md:w-28 flex-shrink-0 relative bg-zinc-800">
                                                {production.imageUrl ? (
                                                    <Image
                                                        src={production.imageUrl}
                                                        alt={production.titlePt}
                                                        fill
                                                        sizes="112px"
                                                        className="object-cover brightness-75 group-hover:brightness-90 transition-all"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-xs font-black text-zinc-700 uppercase group-hover:text-purple-500 transition-colors text-center px-2 leading-tight">
                                                            {production.type}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 p-5">
                                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                                    <h4 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">{production.titlePt}</h4>
                                                    {production.year && <span className="text-xs font-bold text-purple-500">{production.year}</span>}
                                                    <ExternalLink className="w-3.5 h-3.5 text-zinc-700 group-hover:text-purple-500 transition-colors ml-auto" />
                                                </div>
                                                {production.titleKr && <p className="text-xs text-zinc-600 font-medium mb-2">{production.titleKr}</p>}
                                                {production.synopsis && <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2 font-medium">{production.synopsis}</p>}
                                                {production.streamingPlatforms && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {production.streamingPlatforms.map(p => (
                                                            <span key={p} className="text-xs font-black text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-sm border border-white/5">{p}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-zinc-900 rounded-lg border border-white/5 p-12 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-zinc-400 font-bold mb-1">Nenhuma produção registrada</p>
                                            <p className="text-zinc-600 text-sm font-medium">A filmografia deste artista será atualizada em breve</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* News Section */}
            {artistNews.length > 0 && (
                <div className="px-4 sm:px-12 md:px-20 pb-20 border-t border-white/5 pt-16">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <Newspaper className="w-4 h-4 text-zinc-500" />
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                                Notícias sobre {artist.nameRomanized}
                            </h3>
                        </div>
                        <Link
                            href={`/news?artistId=${artist.id}`}
                            className="text-xs font-bold text-purple-500 hover:text-purple-400 transition-colors"
                        >
                            Ver todas →
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {artistNews.map((item) => (
                            <Link
                                key={item.id}
                                href={`/news/${item.id}`}
                                className="group flex gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-purple-500/30 hover:bg-zinc-900 transition-all"
                            >
                                {/* Thumbnail */}
                                <div className="relative w-24 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                                    {item.imageUrl ? (
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            fill
                                            sizes="96px"
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Newspaper className="w-5 h-5 text-zinc-700" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
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
                </div>
            )}
        </div>
    )
}
