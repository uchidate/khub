'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ExpandableBioProps {
    bio: string
}

export function ExpandableBio({ bio }: ExpandableBioProps) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="max-w-xl">
            <p className={`text-zinc-300 text-sm leading-relaxed drop-shadow ${expanded ? '' : 'line-clamp-3'}`}>
                {bio}
            </p>
            <button
                onClick={() => setExpanded(v => !v)}
                className="mt-1 flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-medium"
                aria-label={expanded ? 'Recolher biografia' : 'Expandir biografia'}
            >
                {expanded ? (
                    <><ChevronUp className="w-3.5 h-3.5" /> Menos</>
                ) : (
                    <><ChevronDown className="w-3.5 h-3.5" /> Mais</>
                )}
            </button>
        </div>
    )
}
