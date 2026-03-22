"use client"

const CATEGORIES = [
    "K-pop",
    "K-drama",
    "K-film",
    "K-beauty",
    "Artistas solo",
    "Grupos",
    "Reality shows",
    "Idol culture",
    "Fandom",
    "Webtoons",
]

export function HomeCategoriesBar() {
    const items = [...CATEGORIES, ...CATEGORIES]

    return (
        <div className="w-full border-b border-[#e8e8e8] bg-white overflow-hidden h-10 flex items-center">
            <div className="overflow-hidden flex-1">
                <div className="flex items-center animate-home-marquee whitespace-nowrap">
                    {items.map((cat, idx) => (
                        <div
                            key={`cat-${idx}`}
                            className="inline-flex items-center gap-2 px-6 flex-shrink-0 min-h-[44px]"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d78] flex-shrink-0" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b6b6b] whitespace-nowrap">
                                {cat}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
