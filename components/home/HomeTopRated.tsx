import Link from 'next/link'
import Image from 'next/image'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

export interface TopRatedProduction {
    id: string
    slug?: string | null
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
    backdropUrl: string | null
    voteAverage: number | null
}

export function HomeTopRated({ productions }: { productions: TopRatedProduction[] }) {
    if (!productions.length) return null

    return (
        <section className="border-b border-border bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
                <SectionTitleBar
                    title={<>Mais bem <span className="text-accent">avaliados</ span></>}
                    href="/productions"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 rounded-xl overflow-hidden border border-border">
                    {productions.slice(0, 9).map((prod, idx) => (
                        <Link
                            key={prod.id}
                            href={`/productions/${prod.slug ?? prod.id}`}
                            className={`group flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors min-h-[60px]
                                ${idx % 3 !== 2 ? 'lg:border-r border-border' : ''}
                                ${idx % 2 !== 1 ? 'sm:border-r lg:border-r-0 border-border' : ''}
                                ${idx < productions.length - 3 ? 'border-b border-border' : ''}
                            `}
                        >
                            <span className="text-[9px] font-bold text-muted w-4 flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                            <div className="w-8 h-12 rounded-md flex-shrink-0 overflow-hidden bg-surface border border-border">
                                {prod.imageUrl ? (
                                    <Image src={prod.imageUrl} alt={prod.titlePt} width={32} height={48} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-muted">
                                        {prod.titlePt.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-foreground group-hover:text-accent transition-colors truncate leading-tight">
                                    {prod.titlePt}
                                </p>
                                <p className="text-[9px] text-muted mt-0.5">{prod.type}{prod.year ? ` · ${prod.year}` : ''}</p>
                            </div>
                            {prod.voteAverage != null && (
                                <span className="text-[10px] font-bold text-yellow-500 flex-shrink-0">
                                    ★ {prod.voteAverage.toFixed(1)}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
