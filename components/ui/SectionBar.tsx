import type { ReactNode } from 'react'

interface SectionBarProps {
    label?: string
    children?: ReactNode
    className?: string
}

export function SectionBar({ children, className = '' }: SectionBarProps) {
    return (
        <div
            className={`sticky z-[200] flex h-[var(--section-bar-h)] items-stretch gap-5 overflow-x-auto overscroll-x-contain border-b border-border/70 bg-background px-4 scrollbar-none sm:gap-6 sm:px-6 lg:px-10 ${className}`}
            style={{ top: 'var(--site-sticky-top, 92px)' }}
        >
            {children}
        </div>
    )
}
