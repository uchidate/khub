import Link from "next/link"

interface TickerPost {
    slug: string
    title: string
    category: { name: string } | null
}

interface HomeTickerProps {
    posts: TickerPost[]
}

export function HomeTicker({ posts }: HomeTickerProps) {
    if (!posts || posts.length === 0) return null

    const items = [...posts, ...posts]

    return (
        <div
            className="w-full overflow-hidden h-[30px] flex items-center"
            style={{ backgroundColor: 'var(--color-ticker-bg)' }}
        >
            {/* Label */}
            <div className="flex-shrink-0 flex items-center self-stretch px-3.5 bg-accent">
                <span className="text-white text-[8.5px] font-bold uppercase tracking-[0.16em] whitespace-nowrap">
                    Blog
                </span>
            </div>

            {/* Scrolling track */}
            <div className="overflow-hidden flex-1">
                <div className="flex items-center animate-home-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
                    {items.map((item, idx) => (
                        <Link
                            key={`ticker-${item.slug}-${idx}`}
                            href={`/blog/${item.slug}`}
                            className="ticker-link inline-flex items-center gap-2 px-6 text-[10.5px] whitespace-nowrap flex-shrink-0 h-[30px] transition-colors"
                        >
                            {item.category && (
                                <b className="text-accent font-semibold not-italic">{item.category.name}</b>
                            )}
                            {item.title}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
