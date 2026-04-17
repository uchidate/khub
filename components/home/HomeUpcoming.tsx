import Link from 'next/link'
import Image from 'next/image'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

export interface UpcomingProduction {
    id: string
    titlePt: string
    type: string
    releaseDate: string | null
    imageUrl: string | null
    productionStatus: string | null
    network: string | null
}

function formatReleaseDate(iso: string | null) {
    if (!iso) return null
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return null
    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Amanhã'
    if (diffDays <= 7) return `Em ${diffDays} dias`
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

const STATUS_LABEL: Record<string, string> = {
    'In Production': 'Em produção',
    'Post Production': 'Pós-produção',
    'Planned': 'Anunciado',
    'Returning Series': 'Nova temporada',
}

export function HomeUpcoming({ productions }: { productions: UpcomingProduction[] }) {
    if (!productions.length) return null

    return (
        <section className="border-b border-border bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
                <SectionTitleBar
                    title={<>Em <span className="text-accent">breve</span></>}
                    href="/productions"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 rounded-xl overflow-hidden border border-border">
                    {productions.slice(0, 10).map((prod, idx) => {
                        const releaseLabel = formatReleaseDate(prod.releaseDate)
                        const statusLabel = prod.productionStatus ? (STATUS_LABEL[prod.productionStatus] ?? null) : null
                        const badge = releaseLabel ?? statusLabel

                        return (
                            <Link
                                key={prod.id}
                                href={`/productions/${prod.id}`}
                                className={`group flex items-center gap-3 px-4 py-3.5 hover:bg-surface transition-colors min-h-[60px]
                                    ${idx % 2 === 0 ? 'sm:border-r border-border' : ''}
                                    ${idx < productions.length - 2 ? 'border-b border-border' : ''}
                                `}
                            >
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
                                    <p className="text-[9px] text-muted mt-0.5 truncate">
                                        {prod.type}{prod.network ? ` · ${prod.network}` : ''}
                                    </p>
                                </div>
                                {badge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent flex-shrink-0">
                                        {badge}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
