import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Star } from "lucide-react"

interface WatchProduction {
    id: string
    slug?: string | null
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
}

export function HomeWatchSection({ productions }: { productions: WatchProduction[] }) {
    const [lead, ...rest] = productions.slice(0, 5)
    if (!lead) return null

    return (
        <section className="bg-background py-6 sm:py-7">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="home-border-pop overflow-hidden rounded-2xl border-violet bg-background shadow-[0_18px_55px_rgba(18,15,21,0.10)]">
                    <div className="flex items-center justify-between border-b border-violet/20 bg-surface-media px-4 py-3.5 sm:px-6">
                        <div className="border-l-[3px] border-violet pl-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-violet">Dramas & Filmes</p>
                            <h2 className="mt-0.5 text-[15px] font-bold text-foreground sm:text-[17px]">O que assistir agora</h2>
                        </div>
                        <Link href="/productions" className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground">
                            Ver todos <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                        <Link
                            href={`/productions/${lead.slug ?? lead.id}`}
                            className="group relative min-h-[240px] sm:min-h-[280px] overflow-hidden border-b border-border lg:border-b-0 lg:border-r"
                        >
                            {lead.imageUrl ? (
                                <Image src={lead.imageUrl} alt={lead.titlePt} fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                            ) : (
                                <div className="absolute inset-0 bg-surface" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                                <span className="inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
                                    {lead.type}
                                </span>
                                <h3 className="mt-2 max-w-[24ch] text-[18px] sm:text-[20px] font-bold leading-tight text-white">
                                    {lead.titlePt}
                                </h3>
                                <div className="mt-2 flex items-center gap-2 text-[10px] text-white/70">
                                    {lead.year && <span>{lead.year}</span>}
                                    {lead.voteAverage != null && lead.voteAverage > 0 && (
                                        <span className="inline-flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-current text-yellow-300" />
                                            {lead.voteAverage.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>

                        <div className="grid grid-cols-2 divide-x divide-y divide-violet/15 bg-surface-media/55">
                            {rest.map((production) => (
                                <Link
                                    key={production.id}
                                    href={`/productions/${production.slug ?? production.id}`}
                                    className="group flex gap-3 p-3 sm:p-4 hover:bg-surface transition-colors"
                                >
                                    <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-surface">
                                        {production.imageUrl ? (
                                            <Image src={production.imageUrl} alt={production.titlePt} fill sizes="64px" className="object-cover group-hover:scale-[1.04] transition-transform duration-300" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-muted">{production.titlePt[0]}</div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">{production.type}</p>
                                        <h3 className="mt-1 text-[12.5px] sm:text-[13px] font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                                            {production.titlePt}
                                        </h3>
                                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
                                            {production.year && <span>{production.year}</span>}
                                            {production.voteAverage != null && production.voteAverage > 0 && <span>{production.voteAverage.toFixed(1)}</span>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
