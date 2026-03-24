"use client"

import { BLOG_CATEGORY_NAMES } from '@/lib/config/categories'

export function HomeCategoriesBar() {
    const items = [...BLOG_CATEGORY_NAMES, ...BLOG_CATEGORY_NAMES]

    return (
        <div className="w-full border-b border-border bg-background overflow-hidden">
            {/* Mobile: marquee animado */}
            <div className="lg:hidden overflow-hidden">
                <div className="flex animate-home-marquee" style={{ width: 'max-content' }}>
                    {items.map((cat, idx) => (
                        <div
                            key={idx}
                            className="group flex items-center gap-1.5 py-2.5 px-4 border-r border-border cursor-pointer whitespace-nowrap hover:text-accent transition-colors"
                        >
                            <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[10.5px] font-semibold uppercase tracking-[0.03em] text-muted group-hover:text-accent transition-colors">
                                {cat}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Desktop: estático */}
            <div className="hidden lg:flex">
                {BLOG_CATEGORY_NAMES.map((cat, idx) => (
                    <div
                        key={idx}
                        className="group flex items-center gap-1.5 py-2.5 px-4 border-r border-border cursor-pointer whitespace-nowrap hover:text-accent transition-colors"
                    >
                        <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.03em] text-muted group-hover:text-accent transition-colors">
                            {cat}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
