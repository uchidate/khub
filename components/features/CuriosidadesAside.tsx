'use client'

import { useState } from 'react'

const INITIAL_COUNT = 6

export function CuriosidadesAside({ curiosidades }: { curiosidades: string[] }) {
    const [expanded, setExpanded] = useState(false)
    const visible = expanded ? curiosidades : curiosidades.slice(0, INITIAL_COUNT)
    const hiddenCount = curiosidades.length - INITIAL_COUNT

    return (
        <aside className="lg:sticky lg:top-[120px] lg:self-start lg:border-l lg:border-border/40 lg:pl-8">
            <div className="flex items-center justify-between gap-4 border-b border-foreground pb-3">
                <div className="font-mono text-[10px] text-muted uppercase tracking-[0.08em]">Detalhes</div>
                <div className="font-mono text-[10px] text-muted/70">{visible.length} de {curiosidades.length}</div>
            </div>
            <ul className="divide-y divide-border/40">
                {visible.map((c, i) => {
                    const num = String(i + 1).padStart(2, '0')
                    return (
                        <li key={i} className="flex gap-4 py-3.5 text-[14px] leading-[1.5] text-[#222] dark:text-[#ccc]">
                            <span className="font-mono text-[11px] text-muted/50 min-w-[24px] shrink-0 pt-0.5">{num}</span>
                            <span>{c}</span>
                        </li>
                    )
                })}
            </ul>
            {hiddenCount > 0 && (
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="mt-4 w-full border border-border bg-background px-4 py-3 text-[12px] font-semibold text-muted hover:border-border-strong hover:text-foreground transition-colors text-left"
                >
                    {expanded
                        ? 'Recolher ↑'
                        : `Ver todas as ${curiosidades.length} curiosidades ↓`}
                </button>
            )}
        </aside>
    )
}
