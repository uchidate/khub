import Link from "next/link"
import Image from "next/image"
import { type ArtistForBadge } from "@/lib/trending/badges"
import { getArtistBadgeDisplay } from "@/lib/trending/display"

interface FeaturedStory {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: string
    excerpt?: string
    tags: string[]
}

interface SecondaryStory {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: string
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

interface HomeFrontPageProps {
    featuredStory: FeaturedStory | undefined
    secondaryStories: SecondaryStory[]
    trendingArtists: TrendingArtist[]
}

const AVATAR_GRADIENTS = [
    "from-zinc-700 to-zinc-800",
    "from-zinc-600 to-zinc-700",
    "from-zinc-800 to-zinc-900",
    "from-zinc-700 to-zinc-800",
    "from-zinc-600 to-zinc-700",
    "from-zinc-800 to-zinc-900",
]

const TAG_COLORS: Record<string, string> = {
    "k-pop": "text-[#ff2d78]",
    "k-drama": "text-[#6d28d9]",
    "k-film": "text-[#0ea5e9]",
    "k-beauty": "text-[#10b981]",
    default: "text-muted",
}

function formatDate(iso: string) {
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

function getTagColor(tag: string | undefined) {
    if (!tag) return TAG_COLORS.default
    const key = tag.toLowerCase().replace(/\s/g, "-")
    return TAG_COLORS[key] ?? TAG_COLORS.default
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
    secondaryStories,
    trendingArtists,
}: HomeFrontPageProps) {
    if (!featuredStory) return null

    const safeSecondary = secondaryStories.slice(0, 4)
    const safeArtists = trendingArtists.slice(0, 8)
    const spotlightArtist = safeArtists[0]

    return (
        <section className="border-b border-border">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.6fr_1fr]">
                {/* LEFT COLUMN */}
                <div className="flex flex-col">
                    {/* Featured story image area */}
                    <Link href={`/news/${featuredStory.id}`} className="block group">
                        <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden bg-accent-soft">
                            {featuredStory.imageUrl ? (
                                <>
                                    <Image
                                        src={featuredStory.imageUrl}
                                        alt={featuredStory.title}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 62vw"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                </>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-br from-accent-soft to-accent-soft">
                                        <span
                                            className="absolute text-[7rem] font-black text-accent select-none pointer-events-none"
                                            style={{
                                                top: "50%",
                                                left: "50%",
                                                transform: "translate(-50%, -50%)",
                                                opacity: 0.05,
                                            }}
                                        >
                                            블랙핑크
                                        </span>
                                        <OrbitalDecoration />
                                    </div>
                                </>
                            )}
                            <div className="absolute bottom-3 left-4">
                            <span className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-accent">
                                {featuredStory.tags?.[0] ?? "K-pop"} · Destaque
                            </span>
                        </div>
                        </div>
                    </Link>

                    {/* Featured story body */}
                    <Link href={`/news/${featuredStory.id}`} className="block group p-4 md:p-5 lg:p-8 border-b border-border">
                        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.05em] text-muted mb-2">
                            <span className="block w-3 h-px bg-muted" />
                            HallyuHub Redação
                        </div>
                        <h1 className="text-[1.2rem] sm:text-[1.5rem] lg:text-[1.9rem] font-extrabold tracking-[-0.03em] text-foreground leading-[1.15] mb-2 group-hover:text-accent transition-colors line-clamp-3">
                            {featuredStory.title}
                        </h1>
                        <div className="flex items-center gap-2 text-[9.5px] text-muted mb-2 flex-wrap">
                            <span>HallyuHub Redação</span>
                            <span className="w-[3px] h-[3px] rounded-full bg-muted" />
                            <span>{formatDate(featuredStory.publishedAt)}</span>
                            <span className="w-[3px] h-[3px] rounded-full bg-muted" />
                            <span>3 min</span>
                        </div>
                        {featuredStory.excerpt && (
                            <p className="text-[13px] text-muted leading-relaxed line-clamp-3">
                                {featuredStory.excerpt}
                            </p>
                        )}
                    </Link>

                    {/* Secondary stories 2×2 grid */}
                    {safeSecondary.length > 0 && (
                        <div className="grid grid-cols-2 border-t border-border">
                            {safeSecondary.map((story, idx) => (
                                <Link
                                    key={story.id}
                                    href={`/news/${story.id}`}
                                    className={`group p-4 flex flex-col gap-1.5 min-h-[44px] hover:bg-surface transition-colors
                                        ${idx % 2 === 0 ? "border-r border-border" : ""}
                                        ${idx < 2 ? "border-b border-border" : ""}
                                    `}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${getTagColor(story.tags?.[0])}`}>
                                        {story.tags?.[0] ?? "Notícia"}
                                    </span>
                                    <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-3">
                                        {story.title}
                                    </h3>
                                    <span className="text-[10px] text-muted mt-auto pt-1">
                                        {formatDate(story.publishedAt)}
                                    </span>
                                </Link>
                            ))}
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

                        <div>
                            {safeArtists.map((artist, idx) => (
                                <Link
                                    key={artist.id}
                                    href={`/artists/${artist.id}`}
                                    className={`items-center gap-3 px-4 py-3.5 border-b border-border last:border-b-0 hover:bg-accent-soft transition-colors min-h-[52px] ${idx >= 5 ? 'hidden lg:flex' : 'flex'}`}
                                >
                                    <span className="text-[8.5px] font-bold text-muted w-3.5 flex-shrink-0 text-center">
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <div
                                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} flex items-center justify-center flex-shrink-0 overflow-hidden`}
                                    >
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
                    </div>

                    {/* Artist Spotlight */}
                    {spotlightArtist && (
                        <div className="p-4 md:p-5 bg-gradient-to-b from-accent-soft to-background flex flex-col gap-3.5">
                            <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-muted">
                                Artista em destaque · Esta semana
                            </p>
                            <div>
                                <p className="text-2xl font-black tracking-[-0.05em] text-foreground leading-none">
                                    {spotlightArtist.nameRomanized}
                                </p>
                                {spotlightArtist.nameHangul && (
                                    <p className="text-[13px] font-normal text-muted mt-1">
                                        {spotlightArtist.nameHangul}
                                    </p>
                                )}
                                {spotlightArtist.agency?.name && (
                                    <p className="text-[12px] text-muted mt-0.5 leading-snug">
                                        {spotlightArtist.agency.name}
                                    </p>
                                )}
                            </div>
                            {/* Métricas */}
                            <div className="flex gap-5">
                                {spotlightArtist.trendingScore != null && spotlightArtist.trendingScore > 0 && (
                                    <div>
                                        <p className="text-[15px] font-extrabold tracking-[-0.04em] text-foreground">
                                            {Math.round(spotlightArtist.trendingScore)}<span className="text-accent text-[10px] font-bold ml-0.5">pts</span>
                                        </p>
                                        <p className="text-[8.5px] text-muted mt-0.5">Trending score</p>
                                    </div>
                                )}
                                {spotlightArtist.viewCount != null && spotlightArtist.viewCount > 0 && (
                                    <div>
                                        <p className="text-[15px] font-extrabold tracking-[-0.04em] text-foreground">
                                            {spotlightArtist.viewCount > 999
                                                ? `${(spotlightArtist.viewCount / 1000).toFixed(1)}k`
                                                : spotlightArtist.viewCount}
                                            <span className="text-accent text-[10px] font-bold ml-0.5">+</span>
                                        </p>
                                        <p className="text-[8.5px] text-muted mt-0.5">Visualizações</p>
                                    </div>
                                )}
                            </div>
                            {spotlightArtist.roles && spotlightArtist.roles.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {spotlightArtist.roles.slice(0, 3).map((role) => (
                                        <span key={role} className="text-[8.5px] font-semibold px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/15">
                                            {formatRole(role, spotlightArtist.gender)}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <Link
                                href={`/artists/${spotlightArtist.id}`}
                                className="w-full text-center bg-foreground text-background text-[13px] font-semibold rounded-full py-3 hover:bg-accent hover:text-white transition-colors"
                            >
                                Ver perfil de {spotlightArtist.nameRomanized} →
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
