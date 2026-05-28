import type { ReactNode } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'

interface ResponsiveFilterBarProps {
    label: string
    value?: string
    children: ReactNode
    className?: string
}

export function ResponsiveFilterBar({ label, value, children, className = '' }: ResponsiveFilterBarProps) {
    return (
        <div
            className={`sticky z-[210] border-b border-border/70 bg-background ${className}`}
            style={{ top: 'var(--site-sticky-top, 92px)' }}
        >
            <details className="group relative lg:contents">
                <summary className="page-wrap flex h-[var(--section-bar-h)] cursor-pointer list-none items-center lg:hidden [&::-webkit-details-marker]:hidden">
                    <span className="flex h-10 w-full items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 transition-colors group-open:border-accent/50 group-open:bg-surface-hover">
                        <span className="flex min-w-0 items-center gap-2 text-[13px] font-black uppercase tracking-[0.08em] text-muted">
                            <SlidersHorizontal className="h-[18px] w-[18px] shrink-0" />
                            <span className="truncate">
                                {label}{value ? ': ' : ''}
                                {value && <span className="text-accent">{value}</span>}
                            </span>
                        </span>
                        <ChevronDown className="h-[18px] w-[18px] shrink-0 text-muted transition-transform group-open:rotate-180" />
                    </span>
                </summary>

                <div className="absolute left-0 right-0 top-full z-[240] hidden border-b border-border bg-background shadow-[0_12px_24px_rgba(0,0,0,0.14)] group-open:block lg:static lg:block lg:border-b-0 lg:shadow-none">
                    <div className="page-wrap py-3 lg:flex lg:h-12 lg:items-center lg:overflow-x-auto lg:py-0 lg:scrollbar-none">
                        {children}
                    </div>
                </div>
            </details>
        </div>
    )
}
