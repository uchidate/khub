'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import type { AffiliatePlacement } from '@/lib/store/affiliate-placements'

interface TrackedAffiliateLinkProps {
    productId: string
    href: string
    placement?: AffiliatePlacement
    entityType?: string
    entityId?: string
    position?: number
    className?: string
    title?: string
    children: ReactNode
}

function getSessionId(): string | null {
    if (typeof window === 'undefined') return null
    const key = 'hh_store_session_id'
    const existing = window.sessionStorage.getItem(key)
    if (existing) return existing
    const next = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.sessionStorage.setItem(key, next)
    return next
}

export function TrackedAffiliateLink({
    productId,
    href,
    placement = 'unknown',
    entityType,
    entityId,
    position,
    className,
    title,
    children,
}: TrackedAffiliateLinkProps) {
    const ref = useRef<HTMLAnchorElement | null>(null)
    const trackingPayload = useMemo(() => ({
        placement,
        entityType,
        entityId,
        position,
    }), [placement, entityType, entityId, position])

    useEffect(() => {
        const node = ref.current
        if (!node || !productId || typeof IntersectionObserver === 'undefined') return

        let sent = false
        const observer = new IntersectionObserver(entries => {
            const entry = entries[0]
            if (!entry?.isIntersecting || sent) return
            sent = true
            observer.disconnect()

            void fetch('/api/store/impressions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: [{
                        productId,
                        ...trackingPayload,
                        pagePath: window.location.pathname,
                        sessionId: getSessionId(),
                    }],
                }),
            }).catch(() => {})
        }, { threshold: 0.35 })

        observer.observe(node)
        return () => observer.disconnect()
    }, [productId, trackingPayload])

    const recordClick = () => {
        if (!productId) return
        void fetch(`/api/store/${productId}/click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...trackingPayload,
                pagePath: window.location.pathname,
                sessionId: getSessionId(),
            }),
        }).catch(() => {})
    }

    return (
        <a
            ref={ref}
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
