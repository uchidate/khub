import Link from 'next/link'

interface SectionHeaderProps {
    title: string
    subtitle?: string
    align?: 'left' | 'center'
    className?: string
    backHref?: string
    backLabel?: string
}

export function SectionHeader({ title, subtitle, align = 'left', className = '', backHref, backLabel = 'Início' }: SectionHeaderProps) {
    return (
        <div className={`mb-6 ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
            {backHref && (
                <Link href={backHref} className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-[#ff2d78] uppercase tracking-[0.1em] mb-3 transition-colors">
                    ← {backLabel}
                </Link>
            )}
            <h1 className="text-[2rem] sm:text-[2.5rem] font-extrabold tracking-[-0.04em] text-foreground mb-3">
                {title}
            </h1>
            {subtitle && (
                <p className={`text-[14px] text-muted ${align === 'center' ? 'mx-auto' : ''}`}>
                    {subtitle}
                </p>
            )}
        </div>
    )
}
