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
            <p className={`text-[#e8e8e8] text-sm leading-relaxed drop-shadow ${expanded ? '' : 'line-clamp-3'}`}>
                {bio}
            </p>
            <button
                onClick={() => setExpanded(v => !v)}
                className="mt-1 flex items-center gap-1 text-muted hover:text-[#e8e8e8] transition-colors text-xs font-medium"
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
