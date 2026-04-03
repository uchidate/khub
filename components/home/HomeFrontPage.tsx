import Link from "next/link"
import Image from "next/image"
import { type ArtistForBadge } from "@/lib/trending/badges"
import { getArtistBadgeDisplay } from "@/lib/trending/display"
import { BLOG_CATEGORY_BY_SLUG } from "@/lib/config/categories"
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel"
import { nameToGradient } from "@/lib/utils/name-to-gradient"
import { FavoriteButton } from "@/components/ui/FavoriteButton"

interface FeaturedStory {
    id: string
    slug: string
    title: string
    coverImageUrl: string | null
    publishedAt: string | null
    excerpt?: string | null
    category: { name: string; slug: string } | null
    tags: string[]
}

interface SecondaryStory {
    id: string
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
    spotlightArtist: TrendingArtist | null
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

const EMPTY_SECONDARY_CTAS = [
    { label: "Explore artistas", href: "/artists" },
    { label: "Veja producoes populares", href: "/productions" },
    { label: "Complete seu perfil de interesses", href: "/profile" },
]

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
    spotlightArtist,
    spotlightProduction,
}: HomeFrontPageProps) {
    const hasCarousel = carouselPosts && carouselPosts.length > 0
    if (!hasCarousel && !featuredStory) return null

    const safeSecondary = secondaryStories.slice(0, 4)
    const missingSecondary = Math.max(0, 4 - safeSecondary.length)
    const safeArtists = trendingArtists.slice(0, 8)

    return (
        <section className="bg-background py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-[2fr_0.65fr] rounded-2xl border border-border bg-background shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                {/* LEFT COLUMN */}
                <div className="flex flex-col">
                    {/* Hero: carousel or static featured */}
                    <div className="border-b border-border">
                        {hasCarousel ? (
                            <FeaturedCarousel posts={carouselPosts} />
                        ) : featuredStory ? (
                            <Link href={`/blog/${featuredStory.slug}`} className="block group relative h-[320px] md:h-[460px] overflow-hidden bg-surface">
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
                                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(148,163,184,0.14),rgba(148,163,184,0.06))]">
                                        <span
                                            className="absolute text-[5rem] font-black text-foreground/10 select-none pointer-events-none"
                                            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                                        >
                                            HallyuHub
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0) 100%)' }} />
                                <div className="absolute top-3 right-3 z-20">
                                    <FavoriteButton
                                        id={featuredStory.id}
                                        itemName={featuredStory.title}
                                        className="bg-black/45 backdrop-blur-sm border border-white/30 text-white hover:bg-black/60"
                                    />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-6 pb-5 pt-12">
                                    <div className="flex items-center gap-1.5 mb-3">
                                        {(() => {
                                            const cs = getCategoryStyle(featuredStory.category?.slug ?? featuredStory.tags?.[0])
                                            return (
                                                <span className="text-[8px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded" style={{ color: cs.color, backgroundColor: `${cs.bg}dd` }}>
                                                    {featuredStory.category?.name ?? featuredStory.tags?.[0] ?? "Blog"}
                                                </span>
                                            )
                                        })()}
                                    </div>
                                    <h1 className="max-w-[22ch] text-[1.2rem] sm:text-[1.55rem] lg:text-[1.9rem] font-extrabold tracking-[-0.035em] text-white leading-[1.12] mb-2 group-hover:text-white/90 transition-colors line-clamp-3">
                                        {featuredStory.title}
                                    </h1>
                                    {featuredStory.excerpt && (
                                        <p className="max-w-[62ch] text-[12.5px] sm:text-[13px] text-white/72 leading-relaxed line-clamp-2 mb-2">
                                            {featuredStory.excerpt}
                                        </p>
                                    )}
                                    <div className="mt-3.5 flex items-center gap-2.5">
                                        <span className="inline-flex items-center rounded-full bg-white text-black text-[10px] sm:text-[10.5px] font-semibold px-3 py-1.5">
                                            Ler agora
                                        </span>
                                        <span className="hidden sm:inline-flex items-center rounded-full border border-white/35 text-white/85 text-[10px] sm:text-[10.5px] font-semibold px-3 py-1.5">
                                            Explorar notícias
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ) : null}
                    </div>

                    {/* Secondary stories 2×2 grid */}
                    {safeSecondary.length > 0 && (
                        <div className="border-t border-border">
                            <div className="flex items-center justify-between px-3.5 sm:px-5 py-2 border-b border-border bg-surface/45">
                                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Principais agora</span>
                                <Link href="/blog" className="text-[9px] font-semibold text-muted hover:text-foreground transition-colors">Ver mais</Link>
                            </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2">
                            {safeSecondary.map((story, idx) => {
                                const cs = getCategoryStyle(story.category?.slug ?? story.tags?.[0])
                                return (
                                <Link
                                    key={story.slug}
                                    href={`/blog/${story.slug}`}
                                    className={`group p-3.5 sm:p-4 flex gap-3 hover:bg-surface/80 transition-all duration-200 border-b border-border
                                        ${idx % 2 === 0 ? "sm:border-r sm:border-border" : ""}
                                        ${idx >= 2 ? "sm:border-b-0" : ""}
                                    `}
                                >
                                    <span className="text-[9px] font-bold text-muted/55 leading-none mt-1 w-4 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                                    {story.coverImageUrl && (
                                        <div className="relative w-24 h-20 rounded-md overflow-hidden bg-surface shrink-0 border border-border/60">
                                            <Image src={story.coverImageUrl} alt={story.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="192px" priority={idx < 2} />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                        <span className="text-[8px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded self-start" style={{ color: cs.color, backgroundColor: cs.bg }}>
                                            {story.category?.name ?? story.tags?.[0] ?? 'Blog'}
                                        </span>
                                        <h3 className="text-[13.5px] font-bold text-foreground leading-snug group-hover:text-foreground/85 transition-colors line-clamp-2">
                                            {story.title}
                                        </h3>
                                        <span className="text-[9px] text-muted mt-auto">{formatDate(story.publishedAt)}</span>
                                    </div>
                                </Link>
                                )
                            })}
                            {missingSecondary > 0 && EMPTY_SECONDARY_CTAS.slice(0, missingSecondary).map((cta) => (
                                <Link
                                    key={cta.label}
                                    href={cta.href}
                                    className="group p-4 flex items-center justify-between border-b border-border sm:border-b-0 sm:odd:border-r sm:border-border hover:bg-surface/70 transition-colors"
                                >
                                    <div>
                                        <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted mb-1">Sugestao</p>
                                        <p className="text-[13px] font-semibold text-foreground group-hover:text-foreground/80">{cta.label}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-muted">Abrir</span>
                                </Link>
                            ))}
                        </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="border-t lg:border-t-0 lg:border-l border-border flex flex-col">
                    {/* Trending Artists panel */}
                    <div className="border-b border-border flex-1">
                        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-surface/40">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                                    Artistas em alta
                                </span>
                                <span className="text-[10px] text-muted/70 hidden sm:block">Ranking semanal da comunidade</span>
                            </div>
                            <Link href="/artists" className="text-[9px] font-semibold text-muted hover:text-foreground transition-colors">
                                Ver todos →
                            </Link>
                        </div>

                        {/* Desktop: vertical list — 7 artistas para não ultrapassar altura da coluna esquerda */}
                        <div className="hidden sm:block">
                            {safeArtists.length > 0 ? safeArtists.slice(0, 7).map((artist, idx) => (
                                <Link
                                    key={artist.id}
                                    href={`/artists/${artist.id}`}
                                    className="group flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-surface transition-colors min-h-[44px]"
                                >
                                    <div className="flex flex-col items-center gap-px w-4 flex-shrink-0">
                                        <span className="text-[8.5px] font-bold text-muted/70 text-center leading-none">
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        {artist.trendingRank != null && artist.trendingRankPrev != null ? (
                                            artist.trendingRank < artist.trendingRankPrev
                                                ? <span className="text-[7px] font-bold leading-none text-green-500">↑</span>
                                                : artist.trendingRank > artist.trendingRankPrev
                                                    ? <span className="text-[7px] font-bold leading-none text-red-400">↓</span>
                                                    : <span className="text-[7px] leading-none text-muted/30">—</span>
                                        ) : null}
                                    </div>
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: nameToGradient(artist.nameRomanized || artist.nameHangul || String(idx)) }}>
                                        {artist.primaryImageUrl ? (
                                            <Image src={artist.primaryImageUrl} alt={artist.nameRomanized || ''} width={36} height={36} className="object-cover w-full h-full" priority={idx < 5} />
                                        ) : (
                                            <span className="text-white text-[8.5px] font-bold">{getInitials(artist.nameRomanized || artist.nameHangul || '?')}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12.5px] font-bold text-foreground truncate leading-tight">
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
                            )) : (
                                <div className="px-4 py-4 text-center">
                                    <p className="text-[12px] text-muted">Ainda sem artistas em destaque.</p>
                                    <Link href="/artists" className="inline-flex mt-2 text-[11px] font-semibold text-foreground hover:underline">Explore artistas</Link>
                                </div>
                            )}
                        </div>
                        {/* Mobile: compact 2-col avatar grid */}
                        <div className="sm:hidden grid grid-cols-4 gap-0">
                            {safeArtists.map((artist, idx) => (
                                <Link
                                    key={artist.id}
                                    href={`/artists/${artist.id}`}
                                    className="flex flex-col items-center gap-1.5 py-3 px-1 hover:bg-surface transition-colors border-b border-r border-border last:border-r-0 [&:nth-child(4n)]:border-r-0"
                                >
                                    <span className="text-[8px] font-bold text-muted/55 leading-none">{String(idx + 1).padStart(2, '0')}</span>
                                    <div className="relative w-11 h-11 rounded-full overflow-hidden bg-surface border border-border flex-shrink-0">
                                        {artist.primaryImageUrl ? (
                                            <Image src={artist.primaryImageUrl} alt={artist.nameRomanized || ''} fill sizes="44px" className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center" style={{ background: nameToGradient(artist.nameRomanized || artist.nameHangul || String(idx)) }}>
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
                        {spotlightArtist ? (
                            <div className="p-4 bg-gradient-to-b from-surface/70 to-background flex flex-col gap-3">
                            {/* Label */}
                            <div className="flex items-center justify-between">
                                <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-muted">
                                    Destaque da semana
                                </p>
                                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 flex-shrink-0" />
                            </div>

                            {/* Foto + nome */}
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-surface border border-border">
                                    {spotlightArtist.primaryImageUrl ? (
                                        <Image
                                            src={spotlightArtist.primaryImageUrl}
                                            alt={spotlightArtist.nameRomanized}
                                            width={56}
                                            height={56}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold" style={{ background: nameToGradient(spotlightArtist.nameRomanized) }}>
                                            {spotlightArtist.nameRomanized[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[18px] font-black tracking-[-0.04em] text-foreground leading-none truncate">
                                        {spotlightArtist.nameRomanized}
                                    </p>
                                    {spotlightArtist.nameHangul && (
                                        <p className="text-[11px] text-muted mt-0.5">{spotlightArtist.nameHangul}</p>
                                    )}
                                    {spotlightArtist.roles && spotlightArtist.roles.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {spotlightArtist.roles.slice(0, 3).map((role) => (
                                                <span key={role} className="text-[8px] font-semibold px-2 py-0.5 rounded-full bg-background text-foreground border border-border">
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
                                        <p className="text-[12px] font-bold text-foreground group-hover/prod:text-foreground/80 transition-colors line-clamp-2 leading-tight">
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
                                className="w-full text-center bg-foreground text-background text-[12px] font-semibold rounded-full py-2.5 hover:opacity-90 transition-all"
                            >
                                Ver perfil →
                            </Link>
                        </div>
                    ) : (
                        <div className="p-4 bg-gradient-to-b from-surface/70 to-background flex flex-col gap-2.5">
                            <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-muted">Destaque da semana</p>
                            <p className="text-[12px] text-muted">Sem destaque definido no momento.</p>
                            <Link href="/artists" className="inline-flex text-[11px] font-semibold text-foreground hover:underline">Explore artistas</Link>
                        </div>
                    )}
                </div>
                </div>
            </div>
        </section>
    )
}
