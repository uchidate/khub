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
        <div className="w-full bg-[#080808] overflow-hidden h-[30px] flex items-center">
            {/* "Últimas" label — pink background, white text */}
            <div className="flex-shrink-0 flex items-center self-stretch px-3.5 bg-[#ff2d78]">
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
                            className="inline-flex items-center gap-2 px-6 text-[10.5px] text-[#888] hover:text-[#ccc] transition-colors whitespace-nowrap flex-shrink-0 border-r border-[#1e1e1e] h-[30px]"
                        >
                            {item.tags?.[0] && (
                                <b className="text-[#ff6fa3] font-semibold not-italic">{item.tags[0]}</b>
                            )}
                            {item.title}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
