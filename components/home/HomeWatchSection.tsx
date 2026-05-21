import Link from "next/link"
import { Star } from "lucide-react"
import { BlogImage } from "@/components/ui/BlogImage"
import { SectionTitleBar } from "@/components/ui/SectionTitleBar"

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
        <section className="bg-background">
            <div className="page-wrap border-t border-border py-8">
                <div className="bg-background">
                    <SectionTitleBar
                        eyebrow="Dramas & Filmes"
                        title="O que assistir agora"
                        href="/productions"
                        linkText="Ver todos →"
                    />

                    <div className="grid border-b border-border lg:grid-cols-[0.9fr_1.1fr]">
                        <Link
                            href={`/productions/${lead.slug ?? lead.id}`}
                            className="group grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-b border-border py-4 transition-colors hover:bg-surface/55 sm:grid-cols-[140px_minmax(0,1fr)] lg:border-b-0 lg:border-r lg:pr-6"
                        >
                            <div className="relative aspect-[2/3] overflow-hidden border border-border bg-surface">
                                <BlogImage
                                    src={lead.imageUrl}
                                    alt={lead.titlePt}
                                    fill
                                    sizes="(max-width: 768px) 96px, 140px"
                                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                    fallbackGradient="linear-gradient(135deg,#f7f5f8 0%,#e9e4eb 100%)"
                                />
                            </div>
                            <div className="flex min-w-0 flex-col justify-center">
                                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">
                                    {lead.type}
                                </span>
                                <h3 className="mt-2 max-w-[18ch] font-serif text-[22px] font-medium leading-[1.02] tracking-[-0.035em] text-foreground transition-colors group-hover:text-accent sm:text-[30px] lg:text-[36px] lg:tracking-[-0.05em]">
                                    {lead.titlePt}
                                </h3>
                                <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
                                    {lead.year && <span>{lead.year}</span>}
                                    {lead.voteAverage != null && lead.voteAverage > 0 && (
                                        <span className="inline-flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-current text-accent" />
                                            {lead.voteAverage.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>

                        <div className="grid sm:grid-cols-2 lg:pl-5">
                            {rest.map((production) => (
                                <Link
                                    key={production.id}
                                    href={`/productions/${production.slug ?? production.id}`}
                                    className="group grid grid-cols-[48px_minmax(0,1fr)] gap-3 border-b border-border py-4 transition-colors last:border-b-0 hover:bg-surface/55 sm:grid-cols-[56px_minmax(0,1fr)] sm:px-3 sm:odd:border-r sm:even:pl-5"
                                >
                                    <div className="relative aspect-[2/3] overflow-hidden border border-border/70 bg-surface">
                                        <BlogImage
                                            src={production.imageUrl}
                                            alt={production.titlePt}
                                            fill
                                            sizes="56px"
                                            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                                            fallbackGradient="linear-gradient(135deg,#f7f5f8 0%,#e9e4eb 100%)"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">{production.type}</p>
                                        <h3 className="mt-1 line-clamp-2 font-serif text-[16px] font-medium leading-[1.08] tracking-[-0.025em] text-foreground transition-colors group-hover:text-accent sm:text-[17px]">
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
