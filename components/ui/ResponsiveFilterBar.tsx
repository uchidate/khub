'use client'

import { useState, type MouseEvent, type ReactNode } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'

interface ResponsiveFilterBarProps {
    label: string
    value?: string
    children: ReactNode
    className?: string
}

export function ResponsiveFilterBar({ label, value, children, className = '' }: ResponsiveFilterBarProps) {
    const [mobileOpen, setMobileOpen] = useState(false)
    const mobilePanelId = 'responsive-filter-menu'

    const closeMobileMenuOnOptionClick = (event: MouseEvent<HTMLDivElement>) => {
        const target = event.target
        if (!(target instanceof Element)) return
        if (target.closest('a, button')) {
            setMobileOpen(false)
        }
    }

    return (
        <>
        <div
            className={`fixed inset-x-0 z-[310] mx-auto w-full max-w-[1440px] border-b border-border/70 bg-background lg:hidden ${className}`}
            style={{ top: 'var(--site-sticky-top, 92px)' }}
        >
            <div>
                <div className="page-wrap flex h-[var(--section-bar-h)] items-center">
                    <button
                        type="button"
                        aria-expanded={mobileOpen}
                        aria-controls={mobilePanelId}
                        onClick={() => setMobileOpen((open) => !open)}
                        className={`flex h-10 w-full items-center justify-between gap-3 rounded-md border px-3 text-left transition-colors ${mobileOpen ? 'border-accent/50 bg-surface-hover' : 'border-border bg-surface'}`}
                    >
                        <span className="flex min-w-0 items-center gap-2 text-[13px] font-black uppercase tracking-[0.08em] text-muted">
                            <SlidersHorizontal className="h-[18px] w-[18px] shrink-0" />
                            <span className="truncate">
                                {label}{value ? ': ' : ''}
                                {value && <span className="text-accent">{value}</span>}
                            </span>
                        </span>
                        <ChevronDown className={`h-[18px] w-[18px] shrink-0 text-muted transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {mobileOpen && (
                    <div
                        id={mobilePanelId}
                        onClick={closeMobileMenuOnOptionClick}
                        className="fixed inset-x-0 z-[330] mx-auto w-full max-w-[1440px] border-b border-border bg-background shadow-[0_12px_24px_rgba(0,0,0,0.14)]"
                        style={{ top: 'calc(var(--site-sticky-top, 92px) + var(--section-bar-h, 52px))' }}
                    >
                        <div className="page-wrap py-3">
                            {children}
                        </div>
                    </div>
                )}
            </div>
        </div>
        <div aria-hidden="true" className="h-[calc(var(--section-bar-h)+1px)] lg:hidden" />

        <div
            className={`relative z-[20] hidden border-b border-border/70 bg-background lg:block ${className}`}
        >
            <div className="page-wrap flex h-12 items-center overflow-x-auto py-0 scrollbar-none">
                {children}
            </div>
        </div>
        </>
    )
}
