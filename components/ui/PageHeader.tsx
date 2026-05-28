import type { ReactNode } from 'react'
import { Breadcrumbs, type Breadcrumb } from '@/components/ui/Breadcrumbs'

interface PageHeaderProps {
    eyebrow?: string
    title?: string
    subtitle?: ReactNode
    meta?: ReactNode
    breadcrumbs?: Breadcrumb[]
    hideBreadcrumbOnMobile?: boolean
    className?: string
}

export function PageHeader({
    eyebrow,
    title,
    subtitle,
    meta,
    breadcrumbs,
    hideBreadcrumbOnMobile = true,
    className = '',
}: PageHeaderProps) {
    return (
        <header className={`page-wrap border-b border-border/50 bg-background py-3 lg:py-4 ${className}`}>
            {breadcrumbs && (
                <Breadcrumbs
                    items={breadcrumbs}
                    className={`mb-2 ${hideBreadcrumbOnMobile ? 'hidden lg:block' : ''}`}
                />
            )}
            <div className="flex min-w-0 items-end justify-between gap-4">
                <div className="min-w-0">
                    {eyebrow && (
                        <p className="mb-1 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-accent">
                            {eyebrow}
                        </p>
                    )}
                    {title && (
                        <h1 className="truncate text-lg font-black tracking-[-0.03em] text-foreground sm:text-2xl">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p className="truncate text-[12px] font-semibold text-muted sm:text-[13px]">
                            {subtitle}
                        </p>
                    )}
                </div>
                {meta && (
                    <div className="hidden shrink-0 text-right font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted lg:block">
                        {meta}
                    </div>
                )}
            </div>
        </header>
    )
}
