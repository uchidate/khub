import Link from 'next/link'

interface SectionHeaderProps {
    title: string
    count?: number | null
    countLabel?: string
    subtitle?: string
    backHref?: string
    backLabel?: string
    className?: string
}

export function SectionHeader({ title, count, countLabel, subtitle: _subtitle, backHref, backLabel = 'Início', className = '' }: SectionHeaderProps) {
    return (
        <div className={`flex items-center justify-between mb-6 ${className}`}>
            <div className="flex items-baseline gap-3">
                <h1 className="text-[1.75rem] md:text-[2rem] font-black text-foreground tracking-[-0.04em] leading-none">
                    {title}
                </h1>
                {count != null && (
                    <span className="text-[11px] font-bold text-muted px-2.5 py-1 bg-surface border border-border rounded-full">
                        {count.toLocaleString('pt-BR')} {countLabel}
                    </span>
                )}
            </div>
            {backHref && (
                <Link href={backHref} className="text-[11px] font-semibold text-muted hover:text-accent transition-colors">
                    ← {backLabel}
                </Link>
            )}
        </div>
    )
}
