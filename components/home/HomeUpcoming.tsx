import Link from 'next/link'
import Image from 'next/image'
import { Calendar } from 'lucide-react'
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

const TYPE_COLOR: Record<string, string> = {
    'K-Drama': '#6d28d9',
    'Drama': '#6d28d9',
    'Filme': '#0ea5e9',
    'FILME': '#0ea5e9',
    'SERIE': '#10b981',
}

export function HomeUpcoming({ productions }: { productions: UpcomingProduction[] }) {
    if (!productions.length) return null

    return (
        <section className="border-b border-border bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
                <SectionTitleBar
                    title={<>Em breve nos <span className="text-accent">streamings</span></>}
                    href="/productions"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {productions.map((prod) => {
                        const releaseLabel = formatReleaseDate(prod.releaseDate)
                        const statusLabel = prod.productionStatus ? (STATUS_LABEL[prod.productionStatus] ?? prod.productionStatus) : null
                        const typeColor = TYPE_COLOR[prod.type] ?? '#ff2d78'

                        return (
                            <Link
                                key={prod.id}
                                href={`/productions/${prod.id}`}
                                className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent/30 bg-surface hover:bg-surface-hover transition-all"
                            >
                                {/* Poster */}
                                <div className="relative w-12 h-[72px] rounded-lg overflow-hidden flex-shrink-0 bg-background border border-border">
                                    {prod.imageUrl ? (
                                        <Image
                                            src={prod.imageUrl}
                                            alt={prod.titlePt}
                                            fill
                                            sizes="48px"
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted">
                                            {prod.titlePt.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: typeColor }}>
                                        {prod.type}
                                    </p>
                                    <p className="text-[13px] font-bold text-foreground group-hover:text-accent transition-colors leading-snug line-clamp-2">
                                        {prod.titlePt}
                                    </p>
                                    {prod.network && (
                                        <p className="text-[10px] text-muted mt-0.5 truncate">{prod.network}</p>
                                    )}
                                </div>

                                {/* Date / status badge */}
                                <div className="flex-shrink-0 text-right">
                                    {releaseLabel ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-accent">
                                            <Calendar className="w-3 h-3" />
                                            {releaseLabel}
                                        </span>
                                    ) : statusLabel ? (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                                            {statusLabel}
                                        </span>
                                    ) : null}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
