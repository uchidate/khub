import type { ReactNode } from 'react'

interface SectionBarProps {
    label?: string
    children?: ReactNode
}

export function SectionBar({ children }: SectionBarProps) {
    return (
        <div className="sticky z-[200] flex h-12 items-center gap-2 overflow-x-auto border-b border-border bg-background px-4 sm:px-6 lg:px-10 scrollbar-none" style={{ top: 'var(--site-header-h, 52px)' }}>
            {children}
        </div>
    )
}
