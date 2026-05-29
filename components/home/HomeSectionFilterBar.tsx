'use client'

import { useEffect, useId, useMemo, useState, type MouseEvent } from 'react'
import { ChevronDown, MapPinned } from 'lucide-react'

interface HomeSection {
    label: string
    href: string
}

interface HomeSectionFilterBarProps {
    sections: HomeSection[]
}

function getSectionId(href: string) {
    return href.startsWith('#') ? href.slice(1) : href
}

function getCssPixelVar(name: string, fallback: number) {
    if (typeof window === 'undefined') return fallback
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name)
    const parsed = Number.parseFloat(raw)
    return Number.isFinite(parsed) ? parsed : fallback
}

export function HomeSectionFilterBar({ sections }: HomeSectionFilterBarProps) {
    const panelId = useId()
    const firstSection = sections[0]
    const sectionById = useMemo(
        () => new Map(sections.map((section) => [getSectionId(section.href), section])),
        [sections],
    )
    const [activeId, setActiveId] = useState(() => firstSection ? getSectionId(firstSection.href) : '')
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        if (sections.length === 0) return

        let frame = 0

        const updateFromViewport = () => {
            const headerHeight = getCssPixelVar('--site-header-h', 92)
            const sectionBarHeight = getCssPixelVar('--section-bar-h', 52)
            const activationLine = headerHeight + sectionBarHeight + 12

            let nextId = getSectionId(sections[0].href)
            for (const section of sections) {
                const id = getSectionId(section.href)
                const element = document.getElementById(id)
                if (!element) continue
                if (element.getBoundingClientRect().top <= activationLine) {
                    nextId = id
                }
            }
            setActiveId(nextId)
        }

        const scheduleUpdate = () => {
            window.cancelAnimationFrame(frame)
            frame = window.requestAnimationFrame(updateFromViewport)
        }

        const updateFromHash = () => {
            const id = window.location.hash.slice(1)
            if (sectionById.has(id)) setActiveId(id)
            scheduleUpdate()
        }

        updateFromHash()
        window.addEventListener('hashchange', updateFromHash)
        window.addEventListener('scroll', scheduleUpdate, { passive: true })
        window.addEventListener('resize', scheduleUpdate)

        return () => {
            window.cancelAnimationFrame(frame)
            window.removeEventListener('hashchange', updateFromHash)
            window.removeEventListener('scroll', scheduleUpdate)
            window.removeEventListener('resize', scheduleUpdate)
        }
    }, [sectionById, sections])

    const activeLabel = sectionById.get(activeId)?.label ?? firstSection?.label ?? ''

    const handleSectionClick = (id: string) => {
        setActiveId(id)
        setMobileOpen(false)
    }

    const handleMobilePanelClick = (event: MouseEvent<HTMLDivElement>) => {
        const target = event.target
        if (!(target instanceof Element)) return
        const link = target.closest('a[href^="#"]')
        if (!link) return
        setMobileOpen(false)
    }

    const sectionLinks = (compact = false) => (
        <div className={compact ? 'grid grid-cols-2 gap-1.5' : 'flex h-full items-stretch gap-5 overflow-x-auto scrollbar-none'}>
            {sections.map(({ label, href }) => {
                const id = getSectionId(href)
                const active = activeId === id
                return (
                    <a
                        key={href}
                        href={href}
                        aria-current={active ? 'true' : undefined}
                        onClick={() => handleSectionClick(id)}
                        className={`flex h-8 shrink-0 items-center whitespace-nowrap rounded-md px-3 text-[12px] font-black transition-colors ${
                            compact
                                ? active
                                    ? 'bg-accent text-white'
                                    : 'bg-surface text-muted hover:text-foreground'
                                : active
                                    ? 'border-b-2 border-accent text-accent'
                                    : 'border-b-2 border-transparent text-muted hover:border-foreground/30 hover:text-foreground'
                        } ${compact ? '' : 'h-full rounded-none bg-transparent px-0.5'}`}
                    >
                        {label}
                    </a>
                )
            })}
        </div>
    )

    return (
        <>
            <div
                className="fixed inset-x-0 z-[310] mx-auto w-full max-w-[1440px] border-b border-border/70 bg-background lg:hidden"
                style={{ top: 'var(--site-sticky-top, 92px)' }}
            >
                <div className="page-wrap flex h-[var(--section-bar-h)] items-center">
                    <button
                        type="button"
                        aria-expanded={mobileOpen}
                        aria-controls={panelId}
                        onClick={() => setMobileOpen((open) => !open)}
                        className={`flex h-10 w-full items-center justify-between gap-3 rounded-md border px-3 text-left transition-colors ${mobileOpen ? 'border-accent/50 bg-surface-hover' : 'border-border bg-surface'}`}
                    >
                        <span className="flex min-w-0 items-center gap-2 text-[12px] font-black uppercase tracking-[0.08em] text-muted">
                            <MapPinned className="h-[18px] w-[18px] shrink-0" />
                            <span className="truncate">
                                Você está em: <span className="text-accent">{activeLabel}</span>
                            </span>
                        </span>
                        <ChevronDown className={`h-[18px] w-[18px] shrink-0 text-muted transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {mobileOpen && (
                    <div
                        id={panelId}
                        onClick={handleMobilePanelClick}
                        className="fixed inset-x-0 z-[330] mx-auto w-full max-w-[1440px] border-b border-border bg-background shadow-[0_12px_24px_rgba(0,0,0,0.14)]"
                        style={{ top: 'calc(var(--site-sticky-top, 92px) + var(--section-bar-h, 52px))' }}
                    >
                        <div className="page-wrap py-3">
                            {sectionLinks(true)}
                        </div>
                    </div>
                )}
            </div>
            <div aria-hidden="true" className="h-[calc(var(--section-bar-h)+1px)] lg:hidden" />

            <div className="relative z-[20] hidden border-b border-border/70 bg-background lg:block">
                <div className="page-wrap flex h-12 items-center">
                    <div className="mr-6 flex shrink-0 items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                        <MapPinned className="h-3.5 w-3.5" />
                        <span>Na home</span>
                    </div>
                    {sectionLinks(false)}
                </div>
            </div>
        </>
    )
}
