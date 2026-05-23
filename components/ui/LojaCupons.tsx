import Link from 'next/link'
import { Tag, ExternalLink } from 'lucide-react'
import prisma from '@/lib/prisma'

const STORE_LABELS: Record<string, string> = {
    shopee: 'Shopee',
    amazon: 'Amazon',
    mercadolivre: 'Mercado Livre',
}

interface Props {
    compact?: boolean
}

export async function LojaCupons({ compact = false }: Props) {
    const now = new Date()
    const coupons = await prisma.storeCoupon.findMany({
        where: { isActive: true, expiresAt: { gt: now } },
        orderBy: { createdAt: 'desc' },
        take: compact ? 3 : 6,
    }).catch(() => [])

    if (!coupons.length) return null

    return (
        <section className={compact ? '' : 'mt-10'}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-orange-500" />
                    <h2 className="text-sm font-bold text-foreground">Cupons de hoje</h2>
                    <span className="text-[10px] font-semibold bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded-full">
                        {coupons.length} ativo{coupons.length !== 1 ? 's' : ''}
                    </span>
                </div>
                {!compact && (
                    <Link href="/loja" className="text-xs text-muted hover:text-orange-500 transition-colors">
                        Ver loja →
                    </Link>
                )}
            </div>
            <div className={compact ? 'flex flex-col gap-2' : 'grid grid-cols-1 sm:grid-cols-2 gap-2'}>
                {coupons.map(c => (
                    <a
                        key={c.id}
                        href={c.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:border-orange-400/40 hover:bg-orange-500/5 transition-all group"
                    >
                        {/* Code badge */}
                        <div className="flex-shrink-0 bg-orange-500/10 border border-orange-500/20 border-dashed rounded-lg px-3 py-2 text-center min-w-[80px]">
                            <p className="text-xs font-black tracking-widest text-orange-500 font-mono">{c.code}</p>
                            <p className="text-[10px] font-bold text-orange-400">{c.discount}</p>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">{c.description}</p>
                            {c.minPurchase && <p className="text-[10px] text-muted mt-0.5">{c.minPurchase}</p>}
                            <p className="text-[10px] text-muted mt-0.5">{STORE_LABELS[c.store] ?? c.store}</p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                ))}
            </div>
        </section>
    )
}
