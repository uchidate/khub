import React from 'react'
import Link from 'next/link'

interface SectionTitleBarProps {
    title: React.ReactNode
    href?: string
    linkText?: string
    className?: string
}

export function SectionTitleBar({ title, href, linkText = 'Ver todos →', className = '' }: SectionTitleBarProps) {
    return (
        <div className={`flex items-center justify-between mb-5 ${className}`}>
            <h2 className="text-[18px] font-extrabold tracking-[-0.04em] text-foreground">
                {title}
            </h2>
            {href && (
                <Link
                    href={href}
                    className="text-[11px] font-bold text-muted hover:text-accent transition-colors"
                >
                    {linkText}
                </Link>
            )}
        </div>
    )
}
