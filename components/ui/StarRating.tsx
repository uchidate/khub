'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
    value: number | null
    onChange: (rating: number | null) => void
    readonly?: boolean
    size?: number
}

export function StarRating({ value, onChange, readonly = false, size = 18 }: StarRatingProps) {
    const [hovered, setHovered] = useState<number | null>(null)

    const displayed = hovered ?? value ?? 0

    return (
        <div className="flex gap-0.5" role="group" aria-label="Avaliação">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => {
                        if (readonly) return
                        // clicking same star → clear rating
                        onChange(value === star ? null : star)
                    }}
                    onMouseEnter={() => !readonly && setHovered(star)}
                    onMouseLeave={() => !readonly && setHovered(null)}
                    aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                    className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                >
                    <Star
                        size={size}
                        fill={star <= displayed ? '#f59e0b' : 'none'}
                        stroke={star <= displayed ? '#f59e0b' : '#6b7280'}
                        className="transition-all"
                    />
                </button>
            ))}
        </div>
    )
}
