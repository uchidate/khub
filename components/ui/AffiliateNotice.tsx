import { BadgeInfo } from 'lucide-react'

interface AffiliateNoticeProps {
    compact?: boolean
    className?: string
}

export function AffiliateNotice({ compact = false, className = '' }: AffiliateNoticeProps) {
    return (
        <p className={`flex items-start gap-2 border border-accent/20 bg-accent/[.04] text-muted ${compact ? 'px-3 py-2 text-[10px]' : 'px-4 py-3 text-xs'} ${className}`}>
            <BadgeInfo className={`${compact ? 'mt-px h-3 w-3' : 'h-4 w-4'} shrink-0 text-accent`} />
            <span>
                <strong className="font-bold text-foreground">Publicidade afiliada:</strong>{' '}
                podemos receber comissão por compras realizadas pelos links desta vitrine, sem custo extra para você.
            </span>
        </p>
    )
}
