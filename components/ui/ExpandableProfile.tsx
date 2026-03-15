'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ProfileSection {
    title: string
    content: string
}

interface ExpandableProfileProps {
    sections: ProfileSection[]
}

export function ExpandableProfile({ sections }: ExpandableProfileProps) {
    const [expanded, setExpanded] = useState(false)

    if (!sections.length) return null

    const [first, ...rest] = sections

    return (
        <div className="max-w-xl space-y-2.5">
            {/* First section — always visible */}
            <p className="text-zinc-300 text-sm leading-relaxed drop-shadow">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-purple-400/70 mr-2 select-none">
                    {first.title}
                </span>
                {first.content}
            </p>

            {/* Remaining sections — shown when expanded */}
            {expanded && rest.map((sec, i) => (
                <p key={i} className="text-zinc-300 text-sm leading-relaxed drop-shadow pt-2.5 border-t border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-purple-400/70 mr-2 select-none">
                        {sec.title}
                    </span>
                    {sec.content}
                </p>
            ))}

            {/* Toggle */}
            {rest.length > 0 && (
                <button
                    onClick={() => setExpanded(v => !v)}
                    className="mt-0.5 flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-medium"
                    aria-label={expanded ? 'Recolher perfil' : 'Ver perfil completo'}
                >
                    {expanded
                        ? <><ChevronUp className="w-3.5 h-3.5" /> Recolher</>
                        : <><ChevronDown className="w-3.5 h-3.5" /> Ver perfil completo</>
                    }
                </button>
            )}
        </div>
    )
}
