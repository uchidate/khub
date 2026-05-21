import React from 'react'
import Link from 'next/link'

interface SectionTitleBarProps {
    title: React.ReactNode
    eyebrow?: React.ReactNode
    href?: string
    linkText?: string
    action?: React.ReactNode
    className?: string
}

export function SectionTitleBar({ title, eyebrow, href, linkText = 'Ver todos →', action, className = '' }: SectionTitleBarProps) {
    return (
        <div className={`mb-5 flex items-end justify-between gap-4 border-b border-foreground pb-3 ${className}`}>
            <div className="min-w-0">
                {eyebrow && (
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-accent">
                        {eyebrow}
                    </p>
                )}
                <h2 className="mt-0.5 text-[20px] font-black tracking-[-0.03em] text-foreground sm:text-[22px]">
                    {title}
                </h2>
            </div>
            {action ?? (href && (
                <Link
                    href={href}
                    className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted transition-colors hover:text-accent sm:text-[11px]"
                >
                    {linkText}
                </Link>
            ))}
        </div>
    )
}
