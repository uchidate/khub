'use client'

import type { ReactNode } from 'react'
import type { AffiliatePlacement } from '@/lib/store/affiliate-placements'

interface TrackedAffiliateLinkProps {
    productId: string
    href: string
    placement?: AffiliatePlacement
    className?: string
    title?: string
    children: ReactNode
}

export function TrackedAffiliateLink({ productId, href, placement = 'unknown', className, title, children }: TrackedAffiliateLinkProps) {
    const recordClick = () => {
        if (!productId) return
        void fetch(`/api/store/${productId}/click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ placement }),
        }).catch(() => {})
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={recordClick}
            title={title}
            className={className}
        >
            {children}
        </a>
    )
}
