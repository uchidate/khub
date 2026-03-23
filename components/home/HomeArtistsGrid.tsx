import Link from "next/link"
import Image from "next/image"
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

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
    "from-zinc-700 to-zinc-800",
    "from-zinc-600 to-zinc-700",
    "from-zinc-800 to-zinc-900",
    "from-zinc-700 to-zinc-800",
    "from-zinc-600 to-zinc-700",
    "from-zinc-800 to-zinc-900",
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
                <SectionTitleBar
                    title={<>Artistas em <span className="text-accent">destaque</span></>}
                    href="/artists"
                />

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
