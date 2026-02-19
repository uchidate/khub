import prisma from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { JsonLd } from '@/components/seo/JsonLd'
import { FavoriteButton } from '@/components/ui/FavoriteButton'
import { ViewTracker } from '@/components/features/ViewTracker'
import { fetchGroupThemeColor, buildGroupThemeVars, toRgba } from '@/lib/fetch-group-theme'
import { Globe, Users, Calendar, Building2, Eye, Heart, Music, Newspaper, Instagram, Twitter, Youtube, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

const BASE_URL = 'https://www.hallyuhub.com.br'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const group = await prisma.musicalGroup.findUnique({ where: { id: params.id } })
    if (!group) return { title: 'Grupo não encontrado - HallyuHub' }
    const description = group.bio || `${group.name}${group.nameHangul ? ` (${group.nameHangul})` : ''} - Grupo musical K-pop`
    const isThinContent = !group.profileImageUrl && !group.bio
    return {
        title: `${group.name} - HallyuHub`,
        description: description.slice(0, 160),
        alternates: { canonical: `${BASE_URL}/groups/${params.id}` },
        ...(isThinContent ? { robots: { index: false, follow: true } } : {}),
        openGraph: {
            title: `${group.name} - HallyuHub`,
            description: description.slice(0, 160),
            images: group.profileImageUrl ? [{ url: group.profileImageUrl, width: 1200, height: 630, alt: group.name }] : [],
            type: 'website',
            url: `${BASE_URL}/groups/${params.id}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${group.name} - HallyuHub`,
            description: description.slice(0, 160),
            images: group.profileImageUrl ? [group.profileImageUrl] : [],
        },
    }
}

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
    const group = await prisma.musicalGroup.findUnique({
        where: { id: params.id },
        include: {
            agency: true,
            members: {
                include: {
                    artist: {
                        select: {
                            id: true,
                            nameRomanized: true,
                            nameHangul: true,
                            primaryImageUrl: true,
                            roles: true,
                        },
                    },
                },
                orderBy: [{ isActive: 'desc' }, { position: 'asc' }, { joinDate: 'asc' }],
            },
        },
    })

    if (!group) {
        return (
            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
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
    const memberArtistIds = group.members.map(m => m.artistId)
    const debutYear = group.debutDate ? new Date(group.debutDate).getFullYear() : null
    const disbandYear = group.disbandDate ? new Date(group.disbandDate).getFullYear() : null
    const currentYear = new Date().getFullYear()
    const yearsActive = debutYear ? (disbandYear ?? currentYear) - debutYear : null
    const socialLinks = (group.socialLinks as Record<string, string>) || {}

    // Tema visual: extrai cor do site oficial (cache 24h)
    const websiteUrl = socialLinks.website ?? socialLinks.Website ?? socialLinks.official ?? null
    const themeColor = websiteUrl ? await fetchGroupThemeColor(websiteUrl) : null
    const accent = themeColor ?? '#9333ea'
    const themeVars = buildGroupThemeVars(themeColor)

    // Notícias relacionadas aos membros do grupo
    const relatedNews = memberArtistIds.length > 0
        ? await prisma.news.findMany({
            where: { artists: { some: { artistId: { in: memberArtistIds } } } },
            take: 6,
            orderBy: { publishedAt: 'desc' },
            select: { id: true, title: true, imageUrl: true, publishedAt: true, tags: true, contentMd: true },
        })
        : []

    // Discografia recente dos membros
    const recentAlbums = memberArtistIds.length > 0
        ? await prisma.album.findMany({
            where: { artistId: { in: memberArtistIds } },
            take: 6,
            orderBy: { releaseDate: 'desc' },
            select: { id: true, title: true, type: true, coverUrl: true, releaseDate: true, spotifyUrl: true, artist: { select: { nameRomanized: true } } },
        })
        : []

    const memberPersons = activeMembers.slice(0, 15).map(m => ({
        "@type": "Person",
        "name": m.artist.nameRomanized,
        "url": `${BASE_URL}/artists/${m.artist.id}`,
    }))

    return (
        <div className="min-h-screen bg-black" style={themeVars}>
            <ViewTracker groupId={group.id} />
            {/* Estilos dinâmicos baseados na cor do grupo */}
            <style dangerouslySetInnerHTML={{ __html: `
                .group:hover .group-accent-badge { background: ${toRgba(accent, 0.85)}; }
                .group:hover .member-card-border { border-color: ${toRgba(accent, 0.45)}; box-shadow: 0 20px 40px ${toRgba(accent, 0.1)}; }
                .news-card:hover { border-color: ${toRgba(accent, 0.35)} !important; }
                .album-card:hover { border-color: ${toRgba(accent, 0.35)} !important; }
                .album-title:hover { color: ${accent}; }
            ` }} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "MusicGroup",
                "name": group.name,
                "alternateName": group.nameHangul ?? undefined,
                "description": group.bio?.slice(0, 300) ?? undefined,
                "image": group.profileImageUrl ?? undefined,
                "url": `${BASE_URL}/groups/${group.id}`,
                ...(debutYear ? { "foundingDate": String(debutYear) } : {}),
                ...(disbandYear ? { "dissolutionDate": String(disbandYear) } : {}),
                ...(group.agency ? { "memberOf": { "@type": "Organization", "name": group.agency.name } } : {}),
                ...(memberPersons.length ? { "member": memberPersons } : {}),
            }} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Grupos", "item": `${BASE_URL}/groups` },
                    { "@type": "ListItem", "position": 2, "name": group.name, "item": `${BASE_URL}/groups/${group.id}` },
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
                <div className="absolute top-24 md:top-28 left-0 right-0 px-4 sm:px-12 md:px-20">
                    <Breadcrumbs items={[{ label: 'Grupos', href: '/groups' }, { label: group.name }]} />
                </div>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-12 md:px-20 pb-10 md:pb-14">
                    <div className="flex flex-col gap-3 max-w-3xl">
                        {/* Status badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {disbandYear ? (
                                <span className="text-xs font-black uppercase px-3 py-1 bg-zinc-700/80 backdrop-blur-sm text-zinc-300 rounded-full border border-zinc-600/50">
                                    Disbandado em {disbandYear}
                                </span>
                            ) : (
                                <span className="text-xs font-black uppercase px-3 py-1 backdrop-blur-sm rounded-full border"
                                    style={{ background: toRgba(accent, 0.2), color: accent, borderColor: toRgba(accent, 0.4) }}>
                                    Ativo
                                </span>
                            )}
                            {debutYear && (
                                <span className="text-xs font-bold px-3 py-1 bg-black/40 backdrop-blur-sm text-zinc-400 rounded-full border border-white/10">
                                    Desde {debutYear}
                                </span>
                            )}
                            {group.agency && (
                                <span className="text-xs font-bold px-3 py-1 bg-black/40 backdrop-blur-sm text-zinc-400 rounded-full border border-white/10">
                                    {group.agency.name}
                                </span>
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
                            </div>
                            <div className="mb-2">
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
                    </div>
                </div>
            </div>

            {/* ── CONTEÚDO ── */}
            <div className="px-4 sm:px-12 md:px-20 py-12">
                <div className="grid lg:grid-cols-3 gap-12 max-w-[1600px] mx-auto">

                    {/* ── SIDEBAR ── */}
                    <div className="space-y-8 lg:col-span-1">
                        {/* Bio */}
                        {group.bio && (
                            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Sobre</h3>
                                <p className="text-zinc-300 leading-relaxed text-sm">{group.bio}</p>
                            </div>
                        )}

                        {/* Info */}
                        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Informações</h3>
                            <div className="space-y-0">
                                {debutYear && (
                                    <InfoRow
                                        icon={<Calendar className="w-3.5 h-3.5" />}
                                        label="Debut"
                                        value={group.debutDate ? new Date(group.debutDate).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' }) : String(debutYear)}
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
                                    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <Building2 className="w-3.5 h-3.5" />
                                            <span className="text-xs font-black uppercase tracking-widest">Agência</span>
                                        </div>
                                        <Link href={`/agencies/${group.agency.id}`} className="text-sm font-bold transition-colors hover:opacity-80"
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
                            </div>
                        </div>

                        {/* Redes Sociais */}
                        {Object.keys(socialLinks).length > 0 && (
                            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Redes Sociais</h3>
                                <div className="flex flex-col gap-2">
                                    {Object.entries(socialLinks).map(([platform, url]) => (
                                        <SocialLink key={platform} platform={platform} url={url} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard icon={<Eye className="w-5 h-5" />} label="Visualizações" value={group.viewCount.toLocaleString('pt-BR')} color="text-cyan-400" />
                            <StatCard icon={<Heart className="w-5 h-5" />} label="Fãs" value={group.favoriteCount.toLocaleString('pt-BR')} color="text-pink-400" />
                        </div>
                    </div>

                    {/* ── MAIN ── */}
                    <div className="lg:col-span-2 space-y-14">

                        {/* Membros atuais */}
                        {activeMembers.length > 0 && (
                            <section>
                                <SectionHeader icon={<Users className="w-5 h-5" />} title="Membros" count={activeMembers.length} accent={accent} />
                                <MemberGrid members={activeMembers} accent={accent} />
                            </section>
                        )}

                        {/* Notícias recentes */}
                        {relatedNews.length > 0 && (
                            <section>
                                <SectionHeader icon={<Newspaper className="w-5 h-5" />} title="Notícias Recentes" accent={accent} />
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {relatedNews.map(news => (
                                        <Link key={news.id} href={`/news/${news.id}`}
                                            className="news-card group flex gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-900 transition-all">
                                            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                                                {news.imageUrl ? (
                                                    <Image src={news.imageUrl} alt={news.title} fill sizes="80px" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Newspaper className="w-6 h-6 text-zinc-600" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1">
                                                    {new Date(news.publishedAt).toLocaleDateString('pt-BR')}
                                                </p>
                                                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                                                    {news.title}
                                                </h3>
                                                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                                                    {news.contentMd
                                                        .replace(/#{1,6}\s+/g, '')
                                                        .replace(/\*\*([^*]+)\*\*/g, '$1')
                                                        .replace(/\n+/g, ' ')
                                                        .trim()
                                                        .slice(0, 80)}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <div className="mt-4 text-center">
                                    <Link href={`/news?groupId=${group.id}`}
                                        className="inline-flex items-center gap-2 text-sm font-bold transition-colors"
                                        style={{ color: accent }}>
                                        Ver todas as notícias →
                                    </Link>
                                </div>
                            </section>
                        )}

                        {/* Discografia recente */}
                        {recentAlbums.length > 0 && (
                            <section>
                                <SectionHeader icon={<Music className="w-5 h-5" />} title="Discografia Recente" accent={accent} />
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {recentAlbums.map(album => (
                                        <div key={album.id} className="group">
                                            <div className="album-card relative aspect-square rounded-xl overflow-hidden bg-zinc-800 mb-3 border border-white/5 transition-colors">
                                                {album.coverUrl ? (
                                                    <Image src={album.coverUrl} alt={album.title} fill sizes="(max-width: 640px) 50vw, 33vw"
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-zinc-900">
                                                        <Music className="w-8 h-8 text-zinc-600" />
                                                    </div>
                                                )}
                                                {/* Type badge */}
                                                <div className="absolute top-2 left-2">
                                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded"
                                                        style={{ color: accent }}>
                                                        {album.type === 'ALBUM' ? 'Álbum' : album.type === 'EP' ? 'EP' : 'Single'}
                                                    </span>
                                                </div>
                                                {/* Spotify link */}
                                                {album.spotifyUrl && (
                                                    <a href={album.spotifyUrl} target="_blank" rel="noopener noreferrer"
                                                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 backdrop-blur-sm transition-all">
                                                        <span className="text-xs font-black text-white bg-green-500 px-3 py-1.5 rounded-full">
                                                            Ouvir no Spotify
                                                        </span>
                                                    </a>
                                                )}
                                            </div>
                                            <h3 className="album-title text-sm font-bold text-white line-clamp-1 transition-colors">{album.title}</h3>
                                            <p className="text-xs text-zinc-500 mt-0.5">{album.artist.nameRomanized}</p>
                                            {album.releaseDate && (
                                                <p className="text-[10px] text-zinc-600 mt-0.5">
                                                    {new Date(album.releaseDate).getFullYear()}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Ex-membros */}
                        {formerMembers.length > 0 && (
                            <section>
                                <SectionHeader icon={<Users className="w-5 h-5" />} title="Ex-Membros" count={formerMembers.length} muted accent={accent} />
                                <MemberGrid members={formerMembers} faded accent={accent} />
                            </section>
                        )}

                        {/* Estado vazio */}
                        {group.members.length === 0 && (
                            <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-12 text-center">
                                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-500 font-bold">Nenhum membro vinculado</p>
                                <p className="text-zinc-700 text-sm mt-1">Sincronize via Admin → Grupos Musicais</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
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
                    ? { background: 'rgb(39 39 42)', borderColor: 'transparent' }
                    : { background: toRgba(accent, 0.15), borderColor: toRgba(accent, 0.25) }
                }>
                <span style={{ color: muted ? '#52525b' : accent }}>{icon}</span>
            </div>
            <div>
                <h2 className={`text-xl font-black ${muted ? 'text-zinc-500' : 'text-white'}`}>{title}</h2>
                {count !== undefined && (
                    <p className="text-zinc-600 text-xs mt-0.5">{count} {count === 1 ? 'pessoa' : 'pessoas'}</p>
                )}
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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 text-center">
            <div className={`${color} mx-auto mb-1 flex justify-center`}>{icon}</div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider mt-0.5">{label}</p>
        </div>
    )
}

function SocialLink({ platform, url }: { platform: string; url: string }) {
    const icons: Record<string, React.ReactNode> = {
        instagram: <Instagram className="w-4 h-4" />,
        twitter: <Twitter className="w-4 h-4" />,
        x: <Twitter className="w-4 h-4" />,
        youtube: <Youtube className="w-4 h-4" />,
        website: <Globe className="w-4 h-4" />,
    }
    const colors: Record<string, string> = {
        instagram: 'text-pink-400 hover:text-pink-300',
        twitter: 'text-sky-400 hover:text-sky-300',
        x: 'text-sky-400 hover:text-sky-300',
        youtube: 'text-red-400 hover:text-red-300',
        website: 'text-zinc-400 hover:text-white',
    }
    const key = platform.toLowerCase()
    return (
        <a href={url} target="_blank" rel="noopener noreferrer"
            className={`flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 hover:border-white/10 transition-all ${colors[key] || 'text-zinc-400 hover:text-white'}`}>
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
                    href={`/artists/${member.artist.id}`}
                    className={`group block ${faded ? 'opacity-50 hover:opacity-90 transition-opacity' : ''}`}
                >
                    <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5 member-card-border transition-all duration-300 mb-3 shadow-lg">
                        {member.artist.primaryImageUrl ? (
                            <Image
                                src={member.artist.primaryImageUrl}
                                alt={member.artist.nameRomanized}
                                fill
                                sizes="(max-width: 640px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${toRgba(accent, 0.2)}, #18181b)` }}>
                                <span className="text-3xl font-black text-zinc-600 group-hover:text-white transition-colors">
                                    {member.artist.nameRomanized[0]}
                                </span>
                            </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        {/* Role badge */}
                        {member.role && (
                            <div className="absolute bottom-2 left-2 right-2">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 backdrop-blur-sm text-white rounded-full group-accent-badge">
                                    {member.role}
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm leading-tight group-hover:opacity-80 transition-opacity">
                            {member.artist.nameRomanized}
                        </h3>
                        {member.artist.nameHangul && (
                            <p className="text-[11px] text-zinc-500 mt-0.5">{member.artist.nameHangul}</p>
                        )}
                        {(member.joinDate || member.leaveDate) && (
                            <p className="text-[10px] text-zinc-600 mt-1">
                                {member.joinDate ? new Date(member.joinDate).getFullYear() : '?'}
                                {member.leaveDate ? ` – ${new Date(member.leaveDate).getFullYear()}` : ''}
                            </p>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    )
}
