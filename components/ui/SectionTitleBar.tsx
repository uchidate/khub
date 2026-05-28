import React from 'react'
import Link from 'next/link'
import { BrandDot } from '@/components/ui/BrandDot'

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
                    <p className="text-micro font-black uppercase tracking-[0.16em] text-accent">
                        {eyebrow}
                    </p>
                )}
                <h2 className="mt-0.5 text-title tracking-[-0.03em] text-foreground">
                    {title}<BrandDot />
                </h2>
            </div>
            {action ?? (href && (
                <Link
                    href={href}
                    className="shrink-0 text-caption font-bold text-muted transition-colors hover:text-accent"
                >
                    {linkText}
                </Link>
            ))}
        </div>
    )
}
