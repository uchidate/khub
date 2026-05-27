'use client'

import type { ReactNode } from 'react'

interface TrackedCouponLinkProps {
    couponId: string
    href: string
    className?: string
    children: ReactNode
}

export function TrackedCouponLink({ couponId, href, className, children }: TrackedCouponLinkProps) {
    const recordClick = () => {
        void fetch(`/api/store/coupons/${couponId}/click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ placement: 'store_coupon' }),
        }).catch(() => {})
    }

    return (
        <a href={href} target="_blank" rel="noopener noreferrer sponsored" onClick={recordClick} className={className}>
            {children}
        </a>
    )
}
