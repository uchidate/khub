"use client"

import Link from "next/link"
import Image from "next/image"

interface ProductionItem {
    id: string
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
    streamingPlatforms?: string[] | null
}

interface HomeProductionsCarouselProps {
    productions: ProductionItem[]
}

const CARD_BG: Record<string, { bg: string; text: string }> = {
    DRAMA:      { bg: "#fff0f5", text: "#ff2d78" },
    FILM:       { bg: "#fef3c7", text: "#d97706" },
    VARIETY:    { bg: "#dcfce7", text: "#16a34a" },
    DOCUMENTARY:{ bg: "#e0f2fe", text: "#0ea5e9" },
    WEBSERIES:  { bg: "#f3e8ff", text: "#7c3aed" },
}
const CARD_BG_FALLBACKS = [
    { bg: "#fff0f5", text: "#ff2d78" },
    { bg: "#f3e8ff", text: "#7c3aed" },
    { bg: "#fef3c7", text: "#d97706" },
    { bg: "#e0f2fe", text: "#0ea5e9" },
    { bg: "#dcfce7", text: "#16a34a" },
    { bg: "#fce7f3", text: "#be185d" },
]

function getTypeLabel(type: string) {
    const map: Record<string, string> = {
        DRAMA: "Drama",
        FILM: "Filme",
        VARIETY: "Variety",
        DOCUMENTARY: "Doc",
        WEBSERIES: "Web",
    }
    return map[type] ?? type
}

function getTypeColor(type: string) {
    const map: Record<string, string> = {
        DRAMA: "bg-[#6d28d9] text-white",
        FILM: "bg-[#0ea5e9] text-white",
        VARIETY: "bg-[#10b981] text-white",
        DOCUMENTARY: "bg-[#f59e0b] text-white",
        WEBSERIES: "bg-[#ff2d78] text-white",
    }
    return map[type] ?? "bg-[#6b6b6b] text-white"
}

function getInitialsFromTitle(title: string) {
    return title
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
}

export function HomeProductionsCarousel({ productions }: HomeProductionsCarouselProps) {
    if (!productions || productions.length === 0) return null

    return (
        <section className="border-b border-[#e8e8e8] bg-[#f5f5f7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[18px] font-extrabold tracking-[-0.04em] text-[#080808]">
                        Produções em <span className="text-[#ff2d78]">destaque</span>
                    </h2>
                    <Link
                        href="/productions"
                        className="text-[11px] font-bold text-[#6b6b6b] hover:text-[#ff2d78] transition-colors"
                    >
                        Ver catálogo →
                    </Link>
                </div>

                {/* Horizontal scroll */}
                <div
                    className="flex gap-4 overflow-x-auto pb-3"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        WebkitOverflowScrolling: "touch",
                    } as React.CSSProperties}
                >
                    {productions.map((prod, idx) => (
                        <Link
                            key={prod.id}
                            href={`/productions/${prod.id}`}
                            className="flex-shrink-0 w-48 md:w-56 rounded-xl border border-[#e8e8e8] bg-white overflow-hidden hover:shadow-md hover:border-[#ff2d78]/30 transition-all group"
                        >
                            {/* Image area */}
                            <div className="relative h-[105px] overflow-hidden">
                                {prod.imageUrl ? (
                                    <Image
                                        src={prod.imageUrl}
                                        alt={prod.titlePt}
                                        fill
                                        sizes="(max-width: 768px) 192px, 224px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (() => {
                                    const colors = CARD_BG[prod.type] ?? CARD_BG_FALLBACKS[idx % CARD_BG_FALLBACKS.length]
                                    return (
                                        <div
                                            className="w-full h-full flex flex-col items-center justify-center gap-1"
                                            style={{ background: colors.bg, color: colors.text }}
                                        >
                                            <span className="text-[18px] font-extrabold opacity-25">{getInitialsFromTitle(prod.titlePt)}</span>
                                            {prod.streamingPlatforms?.[0] && (
                                                <span className="text-[8px] font-bold uppercase tracking-[0.07em] opacity-50">{prod.streamingPlatforms[0]}</span>
                                            )}
                                        </div>
                                    )
                                })()}
                                {/* Type badge */}
                                <span
                                    className={`absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${getTypeColor(prod.type)}`}
                                >
                                    {getTypeLabel(prod.type)}
                                </span>
                            </div>

                            {/* Body */}
                            <div className="p-3">
                                <p className="text-xs text-[#6b6b6b] mb-1">
                                    {getTypeLabel(prod.type)}
                                    {prod.year ? ` · ${prod.year}` : ""}
                                </p>
                                <p className="text-sm font-bold text-[#080808] group-hover:text-[#ff2d78] transition-colors line-clamp-2 leading-tight">
                                    {prod.titlePt}
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="px-3 pb-3 border-t border-[#e8e8e8] pt-2 flex items-center justify-between gap-1">
                                <div className="flex gap-1 flex-wrap">
                                    {prod.streamingPlatforms && prod.streamingPlatforms.slice(0, 2).map((p) => {
                                        const pl = p.toLowerCase()
                                        const cls = pl.includes("netflix")
                                            ? "bg-[rgba(229,9,20,0.08)] text-[#e50914]"
                                            : pl.includes("hbo") || pl.includes("max")
                                            ? "bg-[rgba(107,33,168,0.08)] text-[#7c3aed]"
                                            : pl.includes("viki")
                                            ? "bg-[rgba(14,165,233,0.08)] text-[#0ea5e9]"
                                            : "bg-[#f5f5f7] text-[#6b6b6b]"
                                        return (
                                            <span key={p} className={`text-[7.5px] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-sm ${cls}`}>
                                                {p}
                                            </span>
                                        )
                                    })}
                                </div>
                                <span className={`text-[8px] font-bold uppercase tracking-[0.07em] px-2 py-0.5 rounded-full flex-shrink-0 ${
                                    prod.type === 'DRAMA' ? 'bg-[rgba(124,58,237,0.1)] text-[#7c3aed]'
                                    : prod.type === 'FILM' ? 'bg-[rgba(14,165,233,0.1)] text-[#0ea5e9]'
                                    : 'bg-[rgba(255,45,120,0.1)] text-[#ff2d78]'
                                }`}>
                                    {getTypeLabel(prod.type)}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
