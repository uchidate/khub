'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, BookOpen, Lightbulb, ArrowRight } from 'lucide-react'

interface FlowStep {
    label: string
    description: string
    color?: 'zinc' | 'blue' | 'yellow' | 'green' | 'purple' | 'red' | 'orange'
}

interface Tip {
    text: string
}

interface PageGuideProps {
    storageKey: string
    title: string
    description: string
    steps: FlowStep[]
    tips?: Tip[]
    defaultOpen?: boolean
}

const STEP_COLORS: Record<NonNullable<FlowStep['color']>, string> = {
    zinc:   'bg-surface text-muted border-border',
    blue:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
    yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    green:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    red:    'bg-red-500/15 text-red-400 border-red-500/30',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

export function PageGuide({ storageKey, title, description, steps, tips, defaultOpen = false }: PageGuideProps) {
    const key = `page-guide-${storageKey}`
    const [open, setOpen] = useState(defaultOpen)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem(key)
        if (saved !== null) setOpen(saved === 'true')
    }, [key])

    function toggle() {
        const next = !open
        setOpen(next)
        localStorage.setItem(key, String(next))
    }

    if (!mounted) return null

    return (
        <div className="mb-5 rounded-xl border border-border bg-surface overflow-hidden">
            {/* Header toggle */}
            <button
                onClick={toggle}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-hover transition-colors group"
            >
                <div className="flex items-center gap-2">
                    <BookOpen size={13} className="text-purple-400/70 flex-shrink-0" />
                    <span className="text-[12px] font-semibold text-muted group-hover:text-foreground transition-colors">
                        {title}
                    </span>
                    {!open && (
                        <span className="text-[11px] text-muted hidden sm:inline truncate max-w-[400px]">
                            — {description}
                        </span>
                    )}
                </div>
                {open
                    ? <ChevronUp size={13} className="text-muted flex-shrink-0" />
                    : <ChevronDown size={13} className="text-muted flex-shrink-0" />
                }
            </button>

            {open && (
                <div className="px-4 pb-4 space-y-4 border-t border-border">
                    {/* Description */}
                    <p className="text-[12px] text-muted leading-relaxed pt-3">{description}</p>

                    {/* Flow steps */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Fluxo</p>
                        <div className="flex flex-wrap gap-2 items-center">
                            {steps.map((step, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium ${STEP_COLORS[step.color ?? 'zinc']}`}>
                                        <span className="font-black opacity-60">{i + 1}</span>
                                        <div>
                                            <div className="font-semibold leading-tight">{step.label}</div>
                                            <div className="text-[10px] opacity-70 leading-tight">{step.description}</div>
                                        </div>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <ArrowRight size={10} className="text-muted flex-shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tips */}
                    {tips && tips.length > 0 && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Dicas</p>
                            <ul className="space-y-1">
                                {tips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted">
                                        <Lightbulb size={10} className="text-yellow-500/60 flex-shrink-0 mt-0.5" />
                                        {tip.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
