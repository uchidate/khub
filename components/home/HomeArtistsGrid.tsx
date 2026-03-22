import Link from "next/link"
import Image from "next/image"

interface ArtistItem {
    id: string
    nameRomanized: string
    nameHangul: string | null
    roles: string[]
    primaryImageUrl?: string | null
    agency?: { name: string } | null
}

interface HomeArtistsGridProps {
    artists: ArtistItem[]
}

const AVATAR_GRADIENTS = [
    "from-[#c084fc] to-[#818cf8]",
    "from-[#6d28d9] to-[#a855f7]",
    "from-[#ff2d78] to-[#ff6fa3]",
    "from-[#0ea5e9] to-[#38bdf8]",
    "from-[#10b981] to-[#34d399]",
    "from-[#f59e0b] to-[#fbbf24]",
]

function getInitials(name: string) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
}

export function HomeArtistsGrid({ artists }: HomeArtistsGridProps) {
    if (!artists || artists.length === 0) return null

    return (
        <section className="border-b border-border bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 md:py-8 lg:py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[18px] font-extrabold tracking-[-0.04em] text-foreground">
                        Artistas em <span className="text-accent">destaque</span>
                    </h2>
                    <Link
                        href="/artists"
                        className="text-[11px] font-bold text-muted hover:text-accent transition-colors"
                    >
                        Ver todos →
                    </Link>
                </div>

                {/* Grid with border dividers — usa CSS variable para funcionar em light e dark */}
                <div
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 rounded-[14px] overflow-hidden"
                    style={{ gap: "1.5px", backgroundColor: "var(--color-border)", border: "1.5px solid var(--color-border)" }}
                >
                    {artists.map((artist, idx) => (
                        <Link
                            key={artist.id}
                            href={`/artists/${artist.id}`}
                            className="group bg-background p-4 flex flex-col items-center gap-2 hover:bg-accent-soft transition-colors min-h-[44px]"
                        >
                            <div className="flex items-center gap-1.5 self-start w-full mb-1.5">
                                <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">
                                    {String(idx + 1).padStart(2, "0")}
                                </span>
                                <div className="flex-1 h-px bg-border" />
                            </div>
                            {/* Avatar */}
                            <div
                                className={`w-14 h-14 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} flex items-center justify-center overflow-hidden`}
                            >
                                {artist.primaryImageUrl ? (
                                    <Image
                                        src={artist.primaryImageUrl}
                                        alt={artist.nameRomanized}
                                        width={56}
                                        height={56}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <span className="text-white text-lg font-black">
                                        {getInitials(artist.nameRomanized)}
                                    </span>
                                )}
                            </div>
                            {/* Name */}
                            <div className="text-center">
                                <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors truncate max-w-full leading-tight">
                                    {artist.nameRomanized}
                                </p>
                                {artist.nameHangul && (
                                    <p className="text-[10px] text-muted truncate">{artist.nameHangul}</p>
                                )}
                                {artist.roles && artist.roles[0] && (
                                    <p className="text-[10px] text-accent font-semibold mt-0.5 truncate opacity-70">
                                        {artist.roles[0]}
                                    </p>
                                )}
                                {artist.agency?.name && (
                                    <p className="text-[9px] text-muted truncate mt-0.5">{artist.agency.name}</p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
