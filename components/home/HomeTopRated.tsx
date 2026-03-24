import Link from 'next/link'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

export interface TopRatedProduction {
    id: string
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
                    title={<>Mais bem <span className="text-accent">avaliados</span></>}
                    href="/productions"
                />
                <div
                    className="flex gap-3 overflow-x-auto pb-2"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {productions.map((prod) => (
                        <Link
                            key={prod.id}
                            href={`/productions/${prod.id}`}
                            className="group relative flex-shrink-0 w-44 md:w-52 rounded-xl overflow-hidden border border-border hover:border-accent/40 transition-all duration-300"
                            style={{ aspectRatio: '2/3' }}
                        >
                            {/* Poster / Backdrop */}
                            {prod.imageUrl || prod.backdropUrl ? (
                                <Image
                                    src={prod.imageUrl ?? prod.backdropUrl!}
                                    alt={prod.titlePt}
                                    fill
                                    sizes="(max-width: 768px) 176px, 208px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full bg-surface-hover flex items-center justify-center">
                                    <span className="text-2xl font-black text-muted">
                                        {prod.titlePt[0]}
                                    </span>
                                </div>
                            )}

                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            {/* Rating badge */}
                            {prod.voteAverage != null && (
                                <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/70 text-yellow-400 text-[11px] font-bold">
                                    <Star className="w-3 h-3 fill-yellow-400" />
                                    {prod.voteAverage.toFixed(1)}
                                </div>
                            )}

                            {/* Title + type */}
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-accent mb-1">
                                    {prod.type}{prod.year ? ` · ${prod.year}` : ''}
                                </p>
                                <p className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                                    {prod.titlePt}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
