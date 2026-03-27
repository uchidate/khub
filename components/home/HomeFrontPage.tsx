import Link from "next/link"
import Image from "next/image"
import { type ArtistForBadge } from "@/lib/trending/badges"
import { getArtistBadgeDisplay } from "@/lib/trending/display"
import { BLOG_CATEGORY_BY_SLUG } from "@/lib/config/categories"
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel"

interface FeaturedStory {
    slug: string
    title: string
    coverImageUrl: string | null
    publishedAt: string | null
    excerpt?: string | null
    category: { name: string; slug: string } | null
    tags: string[]
}

interface SecondaryStory {
    slug: string
    title: string
    coverImageUrl: string | null
    publishedAt: string | null
    category: { name: string; slug: string } | null
    tags: string[]
}

interface TrendingArtist extends ArtistForBadge {
    id: string
    nameRomanized: string
    nameHangul: string | null
    roles: string[]
    primaryImageUrl: string | null
    agency?: { name: string } | null
    trendingScore?: number | null
    viewCount?: number
    gender?: string | number | null
}

interface SpotlightProduction {
    id: string
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
}

interface HomeFrontPageProps {
    featuredStory: FeaturedStory | undefined
    carouselPosts?: FeaturedStory[]
    secondaryStories: SecondaryStory[]
    trendingArtists: TrendingArtist[]
    spotlightProduction: SpotlightProduction | null
}

const AVATAR_GRADIENTS = [
    "from-[#c084fc] to-[#818cf8]",
    "from-[#ff2d78] to-[#ff6da3]",
    "from-[#38bdf8] to-[#818cf8]",
    "from-[#34d399] to-[#38bdf8]",
    "from-[#fbbf24] to-[#f97316]",
    "from-[#e879f9] to-[#c084fc]",
    "from-[#ff2d78] to-[#c084fc]",
    "from-[#38bdf8] to-[#34d399]",
]

function getCategoryStyle(slug: string | undefined): { color: string; bg: string } {
    if (!slug) return { color: '#9ca3af', bg: 'transparent' }
    const key = slug.toLowerCase().replace(/\s/g, '-')
    const cat = BLOG_CATEGORY_BY_SLUG[key]
    return cat ? { color: cat.color, bg: cat.bg } : { color: '#9ca3af', bg: '#f3f4f6' }
}

function formatDate(iso: string | null) {
    if (!iso) return ''
    try {
        return new Date(iso).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
    } catch {
        return iso
    }
}

const ROLE_LABELS: Record<string, [string, string]> = {
    'ATOR':       ['Ator',       'Atriz'],
    'ACTRIZ':     ['Atriz',      'Atriz'],
    'CANTOR':     ['Cantor',     'Cantora'],
    'RAPPER':     ['Rapper',     'Rapper'],
    'DANÇARINO':  ['Dançarino',  'Dançarina'],
    'MODELO':     ['Modelo',     'Modelo'],
    'PRODUTOR':   ['Produtor',   'Produtora'],
    'Ator/Atriz': ['Ator',       'Atriz'],
}

function formatRole(role: string, gender?: string | number | null): string {
    const entry = ROLE_LABELS[role.toUpperCase()] ?? ROLE_LABELS[role]
    if (!entry) return role
    const isFemale = gender === 1 || gender === '1' || gender === 'FEMALE' || gender === 'female'
    return isFemale ? entry[1] : entry[0]
}

function getInitials(name: string) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
}

export function HomeFrontPage({
    featuredStory,
    carouselPosts,
    secondaryStories,
    trendingArtists,
    spotlightProduction,
}: HomeFrontPageProps) {
    const hasCarousel = carouselPosts && carouselPosts.length > 0
    if (!hasCarousel && !featuredStory) return null

    const safeSecondary = secondaryStories.slice(0, 4)
    const safeArtists = trendingArtists.slice(0, 8)
    const spotlightArtist = safeArtists[0]

    return (
        <section className="border-b border-border">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-[2fr_0.65fr]">
                {/* LEFT COLUMN */}
                <div className="flex flex-col">
                    {/* Hero: carousel or static featured */}
                    <div className="border-b border-border">
                        {hasCarousel ? (
                            <FeaturedCarousel posts={carouselPosts} />
                        ) : featuredStory ? (
                            <Link href={`/blog/${featuredStory.slug}`} className="block group relative h-[340px] md:h-[480px] overflow-hidden bg-accent-soft">
                                {featuredStory.coverImageUrl ? (
                                    <Image
                                        src={featuredStory.coverImageUrl}
                                        alt={featuredStory.title}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 62vw"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        priority
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-accent-soft to-accent-soft">
                                        <span
                                            className="absolute text-[7rem] font-black text-accent select-none pointer-events-none"
                                            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: 0.05 }}
                                        >
                                            블랙핑크
                                        </span>
                                        <OrbitalDecoration />
                                    </div>
                                )}
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0) 100%)' }} />
                                <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-10">
                                    <div className="flex items-center gap-1.5 mb-3">
                                        {(() => {
                                            const cs = getCategoryStyle(featuredStory.category?.slug ?? featuredStory.tags?.[0])
                                            return (
                                                <span className="text-[8px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded" style={{ color: cs.color, backgroundColor: `${cs.bg}dd` }}>
                                                    {featuredStory.category?.name ?? featuredStory.tags?.[0] ?? "Blog"}
                                                </span>
                                            )
                                        })()}
                                        <span className="text-[8px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-white/20 text-white backdrop-blur-sm">
                                            Destaque
                                        </span>
                                    </div>
                                    <h1 className="text-[1.15rem] sm:text-[1.4rem] lg:text-[1.7rem] font-extrabold tracking-[-0.03em] text-white leading-[1.15] mb-2 group-hover:text-white/90 transition-colors line-clamp-3">
                                        {featuredStory.title}
                                    </h1>
                                    {featuredStory.excerpt && (
                                        <p className="text-[12.5px] text-white/70 leading-relaxed line-clamp-2 mb-2">
                                            {featuredStory.excerpt}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 text-[9.5px] text-white/50 flex-wrap">
                                        <span>HallyuHub Redação</span>
                                        <span className="w-[3px] h-[3px] rounded-full bg-white/40" />
                                        <span>{formatDate(featuredStory.publishedAt)}</span>
                                    </div>
                                </div>
                            </Link>
                        ) : null}
                    </div>

                    {/* Secondary stories 2×2 grid */}
                    {safeSecondary.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-border">
                            {safeSecondary.map((story, idx) => {
                                const cs = getCategoryStyle(story.category?.slug ?? story.tags?.[0])
                                return (
                                <Link
                                    key={story.slug}
                                    href={`/blog/${story.slug}`}
                                    className={`group p-3 flex gap-3 hover:bg-accent-soft transition-colors border-b border-border
                                        ${idx % 2 === 0 ? "sm:border-r sm:border-border" : ""}
                                        ${idx >= 2 ? "sm:border-b-0" : ""}
                                    `}
                                >
                                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                        <span className="text-[8px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded self-start" style={{ color: cs.color, backgroundColor: cs.bg }}>
                                            {story.category?.name ?? story.tags?.[0] ?? 'Blog'}
                                        </span>
                                        <h3 className="text-[13.5px] font-bold text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-2">
                                            {story.title}
                                        </h3>
                                        <span className="text-[9px] text-muted mt-auto">{formatDate(story.publishedAt)}</span>
                                    </div>
                                    {story.coverImageUrl && (
                                        <div className="relative w-24 h-20 rounded-md overflow-hidden bg-surface shrink-0">
                                            <Image src={story.coverImageUrl} alt={story.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="192px" />
                                        </div>
                                    )}
                                </Link>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="border-t lg:border-t-0 lg:border-l border-border flex flex-col">
                    {/* Trending Artists panel */}
                    <div className="border-b border-border flex-1">
                        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" style={{ animation: 'live-pulse 1.5s ease-in-out infinite' }} />
                                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                                    Artistas em alta
                                </span>
                            </div>
                            <Link href="/artists" className="text-[9px] font-semibold text-muted hover:text-accent transition-colors">
                                Ver todos →
                            </Link>
                        </div>

                        <style>{`
                            @keyframes live-pulse {
                                0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}
                                50%{box-shadow:0 0 0 4px rgba(34,197,94,0)}
                            }
                        `}</style>

                        {/* Desktop: vertical list — 7 artistas para não ultrapassar altura da coluna esquerda */}
                        <div className="hidden sm:block">
                            {safeArtists.slice(0, 7).map((artist, idx) => (
                                <Link
                                    key={artist.id}
                                    href={`/artists/${artist.id}`}
                                    className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-accent-soft transition-colors min-h-[44px]"
                                >
                                    <span className="text-[8.5px] font-bold text-muted w-3.5 flex-shrink-0 text-center">
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                                        {artist.primaryImageUrl ? (
                                            <Image src={artist.primaryImageUrl} alt={artist.nameRomanized || ''} width={36} height={36} className="object-cover w-full h-full" />
                                        ) : (
                                            <span className="text-white text-[8.5px] font-bold">{getInitials(artist.nameRomanized || artist.nameHangul || '?')}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-foreground truncate leading-tight">
                                            {artist.nameRomanized || artist.nameHangul || '—'}
                                            {artist.nameHangul && artist.nameRomanized && (
                                                <span className="text-[9px] font-normal text-muted ml-1">({artist.nameHangul})</span>
                                            )}
                                        </p>
                                        <p className="text-[9px] text-muted truncate mt-0.5">
                                            {artist.roles?.slice(0, 2).map(r => formatRole(r, artist.gender)).join(', ')}
                                            {artist.agency?.name ? ` · ${artist.agency.name}` : ''}
                                        </p>
                                    </div>
                                    {(() => {
                                        const display = getArtistBadgeDisplay(artist)
                                        if (!display) return null
                                        return (
                                            <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${display.className}`}>
                                                {display.label}
                                            </span>
                                        )
                                    })()}
                                </Link>
                            ))}
                        </div>
                        {/* Mobile: compact 2-col avatar grid */}
                        <div className="sm:hidden grid grid-cols-4 gap-0">
                            {safeArtists.map((artist, idx) => (
                                <Link
                                    key={artist.id}
                                    href={`/artists/${artist.id}`}
                                    className="flex flex-col items-center gap-1.5 py-3 px-1 hover:bg-accent-soft transition-colors border-b border-r border-border last:border-r-0 [&:nth-child(4n)]:border-r-0"
                                >
                                    <div className="relative w-11 h-11 rounded-full overflow-hidden bg-surface border border-border flex-shrink-0">
                                        {artist.primaryImageUrl ? (
                                            <Image src={artist.primaryImageUrl} alt={artist.nameRomanized || ''} fill sizes="44px" className="object-cover" />
                                        ) : (
                                            <div className={`w-full h-full bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} flex items-center justify-center`}>
                                                <span className="text-white text-[8px] font-bold">{getInitials(artist.nameRomanized || artist.nameHangul || '?')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-semibold text-foreground text-center leading-tight line-clamp-2 w-full px-0.5">
                                        {artist.nameRomanized || artist.nameHangul || '—'}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Artist Spotlight */}
                    {spotlightArtist && (
                        <div className="p-4 bg-gradient-to-b from-accent-soft to-background flex flex-col gap-3">
                            {/* Label */}
                            <div className="flex items-center justify-between">
                                <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-muted">
                                    Destaque da semana
                                </p>
                                <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" style={{ animation: 'live-pulse 2s ease-in-out infinite' }} />
                            </div>

                            {/* Foto + nome */}
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-surface border-2 border-accent/20">
                                    {spotlightArtist.primaryImageUrl ? (
                                        <Image
                                            src={spotlightArtist.primaryImageUrl}
                                            alt={spotlightArtist.nameRomanized}
                                            width={56}
                                            height={56}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${AVATAR_GRADIENTS[0]} flex items-center justify-center text-white text-lg font-bold`}>
                                            {spotlightArtist.nameRomanized[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[18px] font-black tracking-[-0.05em] text-foreground leading-none truncate">
                                        {spotlightArtist.nameRomanized}
                                    </p>
                                    {spotlightArtist.nameHangul && (
                                        <p className="text-[11px] text-muted mt-0.5">{spotlightArtist.nameHangul}</p>
                                    )}
                                    {spotlightArtist.roles && spotlightArtist.roles.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {spotlightArtist.roles.slice(0, 3).map((role) => (
                                                <span key={role} className="text-[8px] font-semibold px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/15">
                                                    {formatRole(role, spotlightArtist.gender)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {spotlightArtist.agency?.name && (
                                        <p className="text-[9.5px] text-muted/70 truncate mt-1">{spotlightArtist.agency.name}</p>
                                    )}
                                </div>
                            </div>

                            {/* Última produção */}
                            {spotlightProduction && (
                                <Link
                                    href={`/productions/${spotlightProduction.id}`}
                                    className="flex items-center gap-2.5 border-t border-border/60 pt-2.5 group/prod"
                                >
                                    <div className="w-9 h-[52px] rounded overflow-hidden flex-shrink-0 bg-surface border border-border/60">
                                        {spotlightProduction.imageUrl ? (
                                            <Image src={spotlightProduction.imageUrl} alt={spotlightProduction.titlePt} width={36} height={52} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[8px] text-muted font-bold">
                                                {spotlightProduction.type[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted mb-0.5">Última produção</p>
                                        <p className="text-[12px] font-bold text-foreground group-hover/prod:text-accent transition-colors line-clamp-2 leading-tight">
                                            {spotlightProduction.titlePt}
                                        </p>
                                        <p className="text-[9px] text-muted mt-0.5">
                                            {spotlightProduction.type}{spotlightProduction.year ? ` · ${spotlightProduction.year}` : ''}
                                            {spotlightProduction.voteAverage ? ` · ★ ${spotlightProduction.voteAverage.toFixed(1)}` : ''}
                                        </p>
                                    </div>
                                </Link>
                            )}

                            <Link
                                href={`/artists/${spotlightArtist.id}`}
                                className="w-full text-center bg-accent text-white text-[12px] font-semibold rounded-full py-2 hover:brightness-110 transition-all"
                            >
                                Ver perfil →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

function OrbitalDecoration() {
    return (
        <>
            <style>{`
                @keyframes orbit-spin {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }
                @keyframes orbit-spin-rev {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(-360deg); }
                }
                .orbital-ring-1 { animation: orbit-spin 8s linear infinite; }
                .orbital-ring-2 { animation: orbit-spin-rev 12s linear infinite; }
                .orbital-ring-3 { animation: orbit-spin 20s linear infinite; }
            `}</style>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Ring 1 */}
                <div
                    className="orbital-ring-1 absolute border border-accent/20 rounded-full"
                    style={{ width: 120, height: 120, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                >
                    <span
                        className="absolute w-2.5 h-2.5 rounded-full bg-accent/60"
                        style={{ top: -5, left: "50%", transform: "translateX(-50%)" }}
                    />
                </div>
                {/* Ring 2 */}
                <div
                    className="orbital-ring-2 absolute border border-accent/15 rounded-full"
                    style={{ width: 200, height: 200, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                >
                    <span
                        className="absolute w-2 h-2 rounded-full bg-accent/40"
                        style={{ bottom: -4, left: "50%", transform: "translateX(-50%)" }}
                    />
                </div>
                {/* Ring 3 */}
                <div
                    className="orbital-ring-3 absolute border border-foreground/10 rounded-full"
                    style={{ width: 280, height: 280, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                >
                    <span
                        className="absolute w-1.5 h-1.5 rounded-full bg-foreground/20"
                        style={{ top: -3, right: "25%", transform: "translateX(50%)" }}
                    />
                </div>
                {/* Center glyph */}
                <span className="text-4xl font-black text-accent opacity-20 select-none">한</span>
            </div>
        </>
    )
}
