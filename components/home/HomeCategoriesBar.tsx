import Link from 'next/link'
import { BLOG_CATEGORIES } from '@/lib/config/categories'

export function HomeCategoriesBar() {
    const items = [...BLOG_CATEGORIES, ...BLOG_CATEGORIES]

    return (
        <div className="w-full border-b border-border bg-background overflow-hidden">
            {/* Mobile: marquee animado e clicável */}
            <div className="lg:hidden overflow-hidden">
                <div className="flex animate-home-marquee" style={{ width: 'max-content' }}>
                    {items.map((cat, idx) => (
                        <Link
                            key={idx}
                            href={`/blog?category=${cat.slug}`}
                            className="group flex items-center gap-1.5 py-2.5 px-4 border-r border-border whitespace-nowrap transition-colors hover:bg-surface"
                        >
                            <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                                style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-[10.5px] font-semibold uppercase tracking-[0.03em] text-muted group-hover:text-foreground transition-colors">
                                {cat.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Desktop: estático com links reais */}
            <div className="hidden lg:flex">
                {BLOG_CATEGORIES.map((cat, idx) => (
                    <Link
                        key={idx}
                        href={`/blog?category=${cat.slug}`}
                        className="group flex items-center gap-1.5 py-2.5 px-4 border-r border-border whitespace-nowrap transition-colors hover:bg-surface"
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                            style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.03em] text-muted group-hover:text-foreground transition-colors">
                            {cat.name}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    )
}
