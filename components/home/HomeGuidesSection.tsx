import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ARCHIVE_HUBS } from '@/lib/seo/archive-hubs'

const FEATURED_GUIDES = [
    'integrantes-do-ive',
    'integrantes-do-aespa',
    'cantoras-kpop',
    'idols-que-atuam-em-doramas',
    'grupos-femininos-kpop',
    'doramas-coreanos-netflix',
]

export function HomeGuidesSection() {
    const guides = FEATURED_GUIDES
        .map(slug => ARCHIVE_HUBS.find(hub => hub.slug === slug))
        .filter(Boolean)

    return (
        <section className="border-y border-border/60 bg-background">
            <div className="page-wrap py-10 sm:py-14">
                <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent">Guias</p>
                        <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-foreground sm:text-4xl">Explore por tema</h2>
                    </div>
                    <Link href="/hubs" className="hidden items-center gap-1.5 text-xs font-black uppercase tracking-[0.08em] text-muted transition-colors hover:text-accent sm:flex">
                        Ver guias <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {guides.map(guide => guide && (
                        <Link key={guide.slug} href={`/hubs/${guide.slug}`}
                            className="group border border-border bg-surface p-4 transition-colors hover:border-accent/50 hover:bg-background">
                            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{guide.kind}</p>
                            <h3 className="mt-2 text-base font-black text-foreground transition-colors group-hover:text-accent">{guide.title}</h3>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{guide.description}</p>
                        </Link>
                    ))}
                </div>
                <Link href="/hubs" className="mt-5 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.08em] text-accent sm:hidden">
                    Ver todos os guias <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
        </section>
    )
}
