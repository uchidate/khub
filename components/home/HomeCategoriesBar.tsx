"use client"

import { BLOG_CATEGORIES } from '@/lib/config/categories'

export function HomeCategoriesBar() {
    const items = [...BLOG_CATEGORIES, ...BLOG_CATEGORIES]

    return (
        <div className="w-full border-b border-border bg-background overflow-hidden">
            {/* Mobile: marquee animado */}
            <div className="lg:hidden overflow-hidden">
                <div className="flex animate-home-marquee" style={{ width: 'max-content' }}>
                    {items.map((cat, idx) => (
                        <div
                            key={idx}
                            className="group flex items-center gap-1.5 py-2.5 px-4 border-r border-border cursor-pointer whitespace-nowrap transition-colors"
                        >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125" style={{ backgroundColor: cat.color }} />
                            <span className="text-[10.5px] font-semibold uppercase tracking-[0.03em] text-muted transition-colors" style={{ ['--hover-color' as string]: cat.color }}>
                                {cat.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Desktop: estático */}
            <div className="hidden lg:flex">
                {BLOG_CATEGORIES.map((cat, idx) => (
                    <div
                        key={idx}
                        className="group flex items-center gap-1.5 py-2.5 px-4 border-r border-border cursor-pointer whitespace-nowrap transition-colors"
                        style={{ ['--cat-color' as string]: cat.color, ['--cat-bg' as string]: cat.bg }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125" style={{ backgroundColor: cat.color }} />
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.03em] text-muted group-hover:text-foreground transition-colors">
                            {cat.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
