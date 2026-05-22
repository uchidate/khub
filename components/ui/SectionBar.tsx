import type { ReactNode } from 'react'

interface SectionBarProps {
    label?: string
    children?: ReactNode
}

export function SectionBar({ label, children }: SectionBarProps) {
    return (
        <div className="flex h-12 items-center gap-2 overflow-x-auto border-b border-border bg-background px-4 sm:px-6 lg:px-10">
            {children}
        </div>
    )
}
