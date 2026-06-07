"use client"

import Link from "next/link"
import Image from "next/image"
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'
import { formatProductionType, isMovieProductionType } from '@/lib/utils/production-type'

interface ProductionItem {
    id: string
    slug?: string | null
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

// Fallback color para placeholder sem imagem — usa CSS variables inline
const CARD_FALLBACK_COLORS = [
    { accent: "#ff2d78" },
    { accent: "#7c3aed" },
    { accent: "#d97706" },
    { accent: "#0ea5e9" },
    { accent: "#16a34a" },
    { accent: "#be185d" },
]

function getTypeLabel(type: string) {
    return formatProductionType(type)
}

function getTypeColor(type: string) {
    return isMovieProductionType(type) ? "bg-[#0ea5e9] text-white" : "bg-[#6d28d9] text-white"
}

function getStreamingClass(platform: string) {
    const pl = platform.toLowerCase()
    if (pl.includes("netflix")) return "bg-[#e50914]/10 text-[#e50914]"
    if (pl.includes("hbo") || pl.includes("max")) return "bg-[#7c3aed]/10 text-[#7c3aed]"
    if (pl.includes("viki")) return "bg-[#0ea5e9]/10 text-[#0ea5e9]"
    return "bg-surface text-muted border border-border"
}

function getTypeTagClass(type: string) {
    return isMovieProductionType(type) ? 'bg-[#0ea5e9]/10 text-[#0ea5e9]' : 'bg-[#7c3aed]/10 text-[#7c3aed]'
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
        <section className="border-b border-border bg-background">
            <div className="max-w-7xl mx-auto py-6 md:py-10 lg:py-12">
                {/* Header */}
                <SectionTitleBar
                    title={<>Produções em <span className="text-accent">destaque</span></>}
                    href="/productions"
                    linkText="Ver catálogo →"
                    className="px-4 sm:px-6 lg:px-12"
                />

                {/* Horizontal scroll */}
                <div
                    className="flex gap-3.5 overflow-x-auto pb-3 px-4 sm:px-6 lg:px-12"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        WebkitOverflowScrolling: "touch",
                    } as React.CSSProperties}
                >
                    {productions.map((prod, idx) => {
                        const fallback = CARD_FALLBACK_COLORS[idx % CARD_FALLBACK_COLORS.length]
                        return (
                            <Link
                                key={prod.id}
                                href={`/productions/${prod.slug ?? prod.id}`}
                                className="flex-shrink-0 w-48 md:w-56 rounded-xl border border-border bg-background overflow-hidden hover:shadow-md hover:border-accent/30 transition-all group"
                            >
                                {/* Image area */}
                                <div className="relative h-[105px] overflow-hidden bg-surface">
                                    {prod.imageUrl ? (
                                        <Image
                                            src={prod.imageUrl}
                                            alt={prod.titlePt}
                                            fill
                                            sizes="(max-width: 768px) 192px, 224px"
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full flex flex-col items-center justify-center gap-1"
                                            style={{ backgroundColor: `${fallback.accent}12`, color: fallback.accent }}
                                        >
                                            <span className="text-[18px] font-extrabold opacity-40">{getInitialsFromTitle(prod.titlePt)}</span>
                                            {prod.streamingPlatforms?.[0] && (
                                                <span className="text-[8px] font-bold uppercase tracking-[0.07em] opacity-50">{prod.streamingPlatforms[0]}</span>
                                            )}
                                        </div>
                                    )}
                                    {/* Type badge */}
                                    <span
                                        className={`absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${getTypeColor(prod.type)}`}
                                    >
                                        {getTypeLabel(prod.type)}
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="p-3">
                                    <p className="text-xs text-muted mb-1">
                                        {getTypeLabel(prod.type)}
                                        {prod.year ? ` · ${prod.year}` : ""}
                                    </p>
                                    <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-tight">
                                        {prod.titlePt}
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="px-3 pb-3 border-t border-border pt-2 flex items-center justify-between gap-1">
                                    <div className="flex gap-1 flex-wrap">
                                        {prod.streamingPlatforms && prod.streamingPlatforms.slice(0, 2).map((p) => (
                                            <span key={p} className={`text-[7.5px] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-sm ${getStreamingClass(p)}`}>
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                    <span className={`text-[8px] font-bold uppercase tracking-[0.07em] px-2 py-0.5 rounded-full flex-shrink-0 ${getTypeTagClass(prod.type)}`}>
                                        {getTypeLabel(prod.type)}
                                    </span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
