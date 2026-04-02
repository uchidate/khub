import Link from 'next/link'
import { BLOG_CATEGORIES, HOME_FEED_CATEGORIES } from '@/lib/config/categories'

interface HomeCategoriesBarProps {
    categoryCounts?: Record<string, number>
    activeSlug?: string
    basePath?: string // '/' para home, '/blog' (padrão) para blog
}

export function HomeCategoriesBar({ categoryCounts, activeSlug, basePath = '/blog' }: HomeCategoriesBarProps) {
    const categories = BLOG_CATEGORIES
        .filter((cat) => (categoryCounts?.[cat.slug] ?? 1) > 0)
        .sort((a, b) => (categoryCounts?.[b.slug] ?? 0) - (categoryCounts?.[a.slug] ?? 0))

    function getHref(slug: string): string {
        if (basePath === '/') {
            // Categorias disponíveis nos tabs da home ficam na home
            return HOME_FEED_CATEGORIES.includes(slug)
                ? `/?category=${slug}`
                : `/blog?category=${slug}`
        }
        return `${basePath}?category=${slug}`
    }

    return (
        <div className="w-full border-b border-border bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="relative">
                    {/* Fade lateral esquerda — mobile only */}
                    <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background to-transparent z-10 sm:hidden" />
                    {/* Fade lateral direita — mobile only */}
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent z-10 sm:hidden" />

                    <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5 overflow-x-auto scrollbar-hide">
                        <span className="hidden lg:inline text-[9px] font-bold uppercase tracking-[0.14em] text-muted whitespace-nowrap">
                            Explorar por tema
                        </span>
                        {categories.map((cat) => {
                            const count = categoryCounts?.[cat.slug]
                            const isActive = cat.slug === activeSlug
                            return (
                            <Link
                                key={cat.slug}
                                href={getHref(cat.slug)}
                                className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                                    isActive
                                        ? 'border-foreground bg-foreground'
                                        : 'border-border bg-background hover:bg-surface hover:border-current/15'
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform ${isActive ? 'scale-125' : 'group-hover:scale-125'}`}
                                    style={{ backgroundColor: isActive ? '#ffffff' : cat.color }}
                                />
                                <span
                                    className={`text-[10.5px] font-semibold uppercase tracking-[0.03em] transition-colors ${
                                        isActive ? 'font-bold text-background' : 'text-muted group-hover:text-foreground'
                                    }`}
                                >
                                    {cat.name}
                                </span>
                                {typeof count === 'number' && (
                                    <span
                                        className={`text-[10px] font-bold tabular-nums transition-colors ${
                                            isActive ? 'text-background/80' : 'text-muted/80 group-hover:text-foreground'
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}
                            </Link>
                            )
                        })}
                        <Link
                            href="/blog"
                            className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-[0.03em] text-foreground hover:bg-surface-hover transition-colors"
                        >
                            Ver blog
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
