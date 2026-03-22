import Link from "next/link"

interface TickerNews {
    id: string
    title: string
    tags: string[]
}

interface HomeTickerProps {
    news: TickerNews[]
}

export function HomeTicker({ news }: HomeTickerProps) {
    if (!news || news.length === 0) return null

    const items = [...news, ...news]

    return (
        <div
            className="w-full overflow-hidden h-[30px] flex items-center"
            style={{ backgroundColor: 'var(--color-ticker-bg)' }}
        >
            {/* "Últimas" label */}
            <div className="flex-shrink-0 flex items-center self-stretch px-3.5 bg-accent">
                <span className="text-white text-[8.5px] font-bold uppercase tracking-[0.16em] whitespace-nowrap">
                    Últimas
                </span>
            </div>

            {/* Scrolling track */}
            <div className="overflow-hidden flex-1">
                <div className="flex items-center animate-home-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
                    {items.map((item, idx) => (
                        <Link
                            key={`ticker-${item.id}-${idx}`}
                            href={`/news/${item.id}`}
                            className="ticker-link inline-flex items-center gap-2 px-6 text-[10.5px] whitespace-nowrap flex-shrink-0 h-[30px] transition-colors"
                        >
                            {item.tags?.[0] && (
                                <b className="text-accent font-semibold not-italic">{item.tags[0]}</b>
                            )}
                            {item.title}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
