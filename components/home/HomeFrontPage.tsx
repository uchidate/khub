import Link from "next/link"
import Image from "next/image"

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

interface TrendingArtist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    roles: string[]
    primaryImageUrl: string | null
    agency?: { name: string } | null
    trendingScore?: number | null
}

interface HomeFrontPageProps {
    featuredStory: FeaturedStory | undefined
    secondaryStories: SecondaryStory[]
    trendingArtists: TrendingArtist[]
}

const AVATAR_GRADIENTS = [
    "from-[#c084fc] to-[#818cf8]",
    "from-[#6d28d9] to-[#a855f7]",
    "from-[#ff2d78] to-[#ff6fa3]",
    "from-[#0ea5e9] to-[#38bdf8]",
    "from-[#10b981] to-[#34d399]",
    "from-[#f59e0b] to-[#fbbf24]",
]

const TAG_COLORS: Record<string, string> = {
    "k-pop": "text-[#ff2d78]",
    "k-drama": "text-[#6d28d9]",
    "k-film": "text-[#0ea5e9]",
    "k-beauty": "text-[#10b981]",
    default: "text-[#6b6b6b]",
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
    const safeArtists = trendingArtists.slice(0, 5)
    const spotlightArtist = safeArtists[0]

    return (
        <section className="border-b border-[#e8e8e8]">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.6fr_1fr]">
                {/* LEFT COLUMN */}
                <div className="flex flex-col">
                    {/* Featured story image area */}
                    <Link href={`/news/${featuredStory.id}`} className="block group">
                        <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden bg-[#fff0f5]">
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
                                    {/* Orbital SVG animation fallback */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#fff0f5] to-[#ffeef5]">
                                        <span
                                            className="absolute text-[7rem] font-black text-[#ff2d78] select-none pointer-events-none"
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
                            <span className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-[#ff2d78]">
                                {featuredStory.tags?.[0] ?? "K-pop"} · Destaque
                            </span>
                        </div>
                        </div>
                    </Link>

                    {/* Featured story body */}
                    <Link href={`/news/${featuredStory.id}`} className="block group p-4 md:p-5 lg:p-8 border-b border-[#e8e8e8]">
                        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.05em] text-[#6b6b6b] mb-2">
                            <span className="block w-3 h-px bg-[#6b6b6b]" />
                            HallyuHub Redação
                        </div>
                        <h1 className="text-[1.2rem] sm:text-[1.5rem] lg:text-[1.9rem] font-extrabold tracking-[-0.03em] text-[#080808] leading-[1.15] mb-2 group-hover:text-[#ff2d78] transition-colors line-clamp-3">
                            {featuredStory.title}
                        </h1>
                        <div className="flex items-center gap-2 text-[9.5px] text-[#6b6b6b] mb-2 flex-wrap">
                            <span>HallyuHub Redação</span>
                            <span className="w-[3px] h-[3px] rounded-full bg-[#6b6b6b]" />
                            <span>{formatDate(featuredStory.publishedAt)}</span>
                            <span className="w-[3px] h-[3px] rounded-full bg-[#6b6b6b]" />
                            <span>3 min</span>
                        </div>
                        {featuredStory.excerpt && (
                            <p className="text-[13px] text-[#6b6b6b] leading-relaxed line-clamp-3">
                                {featuredStory.excerpt}
                            </p>
                        )}
                    </Link>

                    {/* Secondary stories 2×2 grid */}
                    {safeSecondary.length > 0 && (
                        <div className="grid grid-cols-2 border-t border-[#e8e8e8]">
                            {safeSecondary.map((story, idx) => (
                                <Link
                                    key={story.id}
                                    href={`/news/${story.id}`}
                                    className={`group p-4 flex flex-col gap-1.5 min-h-[44px] hover:bg-[#f5f5f7] transition-colors
                                        ${idx % 2 === 0 ? "border-r border-[#e8e8e8]" : ""}
                                        ${idx < 2 ? "border-b border-[#e8e8e8]" : ""}
                                    `}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${getTagColor(story.tags?.[0])}`}>
                                        {story.tags?.[0] ?? "Notícia"}
                                    </span>
                                    <h3 className="text-sm font-bold text-[#080808] leading-snug group-hover:text-[#ff2d78] transition-colors line-clamp-3">
                                        {story.title}
                                    </h3>
                                    <span className="text-[10px] text-[#6b6b6b] mt-auto pt-1">
                                        {formatDate(story.publishedAt)}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="border-t lg:border-t-0 lg:border-l border-[#e8e8e8] flex flex-col">
                    {/* Trending Artists panel */}
                    <div className="p-5 border-b border-[#e8e8e8] flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-wider text-[#080808]">
                                    Artistas em alta
                                </span>
                            </div>
                            <Link
                                href="/artists"
                                className="text-[11px] text-[#6b6b6b] hover:text-[#ff2d78] transition-colors font-semibold"
                            >
                                Ver todos →
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {safeArtists.map((artist, idx) => (
                                <Link
                                    key={artist.id}
                                    href={`/artists/${artist.id}`}
                                    className="flex items-center gap-3 group hover:bg-[#f5f5f7] rounded-lg p-1.5 -mx-1.5 transition-colors min-h-[44px]"
                                >
                                    <span className="text-[11px] font-black text-[#6b6b6b] w-5 text-center flex-shrink-0">
                                        {idx + 1}
                                    </span>
                                    <div
                                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} flex items-center justify-center flex-shrink-0 overflow-hidden`}
                                    >
                                        {artist.primaryImageUrl ? (
                                            <Image
                                                src={artist.primaryImageUrl}
                                                alt={artist.nameRomanized}
                                                width={36}
                                                height={36}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <span className="text-white text-[11px] font-black">
                                                {getInitials(artist.nameRomanized)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#080808] group-hover:text-[#ff2d78] transition-colors truncate leading-tight">
                                            {artist.nameRomanized}
                                        </p>
                                        {artist.nameHangul && (
                                            <p className="text-[10px] text-[#6b6b6b] truncate">{artist.nameHangul}</p>
                                        )}
                                        {artist.agency?.name && (
                                            <p className="text-[10px] text-[#6b6b6b] truncate">{artist.agency.name}</p>
                                        )}
                                    </div>
                                    <span
                                        className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${
                                            idx === 0
                                                ? "bg-[#ff2d78] text-white"
                                                : idx < 3
                                                ? "bg-[#fff0f5] text-[#ff2d78]"
                                                : "bg-[#f5f5f7] text-[#6b6b6b]"
                                        }`}
                                    >
                                        {idx === 0 ? "HOT" : idx < 3 ? "NEW" : `#${idx + 1}`}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Artist Spotlight */}
                    {spotlightArtist && (
                        <div className="p-4 md:p-5 bg-gradient-to-b from-[#fff0f5] to-white flex flex-col gap-3.5">
                            <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#6b6b6b]">
                                Artista em destaque · Esta semana
                            </p>
                            <div>
                                <p className="text-2xl font-black tracking-[-0.05em] text-[#080808] leading-none">
                                    {spotlightArtist.nameRomanized}
                                </p>
                                {spotlightArtist.nameHangul && (
                                    <p className="text-[13px] font-normal text-[#6b6b6b] mt-1">
                                        {spotlightArtist.nameHangul}
                                    </p>
                                )}
                                {spotlightArtist.agency?.name && (
                                    <p className="text-[12px] text-[#6b6b6b] mt-0.5 leading-snug line-clamp-2">
                                        {spotlightArtist.agency.name}
                                    </p>
                                )}
                            </div>
                            {spotlightArtist.roles && spotlightArtist.roles.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {spotlightArtist.roles.slice(0, 3).map((role) => (
                                        <span
                                            key={role}
                                            className="text-[8.5px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(255,45,120,0.08)] text-[#ff2d78] border border-[rgba(255,45,120,0.18)]"
                                        >
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <Link
                                href={`/artists/${spotlightArtist.id}`}
                                className="w-full text-center bg-[#080808] text-white text-[13px] font-semibold rounded-full py-3 hover:bg-[#ff2d78] transition-colors"
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
                    className="orbital-ring-1 absolute border border-[#ff2d78]/20 rounded-full"
                    style={{ width: 120, height: 120, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                >
                    <span
                        className="absolute w-2.5 h-2.5 rounded-full bg-[#ff2d78]/60"
                        style={{ top: -5, left: "50%", transform: "translateX(-50%)" }}
                    />
                </div>
                {/* Ring 2 */}
                <div
                    className="orbital-ring-2 absolute border border-[#ff6fa3]/20 rounded-full"
                    style={{ width: 200, height: 200, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                >
                    <span
                        className="absolute w-2 h-2 rounded-full bg-[#ff6fa3]/50"
                        style={{ bottom: -4, left: "50%", transform: "translateX(-50%)" }}
                    />
                </div>
                {/* Ring 3 */}
                <div
                    className="orbital-ring-3 absolute border border-[#080808]/10 rounded-full"
                    style={{ width: 280, height: 280, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                >
                    <span
                        className="absolute w-1.5 h-1.5 rounded-full bg-[#080808]/20"
                        style={{ top: -3, right: "25%", transform: "translateX(50%)" }}
                    />
                </div>
                {/* Center glyph */}
                <span className="text-4xl font-black text-[#ff2d78] opacity-20 select-none">한</span>
            </div>
        </>
    )
}
