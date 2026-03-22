"use client"

const CATEGORIES = [
    "K-pop",
    "K-drama",
    "K-film",
    "K-beauty",
    "Artistas solo",
    "Grupos",
    "Reality shows",
    "Webtoons",
    "Idol culture",
    "Fandom",
]

export function HomeCategoriesBar() {
    const items = [...CATEGORIES, ...CATEGORIES]

    return (
        <div className="w-full border-b border-border bg-background overflow-hidden">
            <div className="overflow-hidden">
                <div className="flex animate-home-marquee" style={{ width: 'max-content' }}>
                    {items.map((cat, idx) => (
                        <div
                            key={`cat-${idx}`}
                            className="group flex items-center gap-1.5 py-2.5 px-4 border-r border-border cursor-pointer whitespace-nowrap hover:text-accent transition-colors"
                        >
                            <span
                                className="w-1 h-1 rounded-full bg-accent flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                            <span className="text-[10.5px] font-semibold uppercase tracking-[0.03em] text-muted group-hover:text-accent transition-colors">
                                {cat}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
