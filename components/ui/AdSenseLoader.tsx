'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const ADSENSE_SRC = CLIENT
    ? `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`
    : ''
const ROUTE_PUSH_DELAYS = [400, 1200, 2500]
const EXCLUDED_PATH_PREFIXES = ['/admin', '/auth', '/write', '/api']

declare global {
    interface Window {
        adsbygoogle?: unknown[]
    }
}

function ensureAdSenseScript() {
    if (!CLIENT) return
    const existing = document.querySelector<HTMLScriptElement>('script[data-hallyuhub-adsense="true"]')
        ?? document.querySelector<HTMLScriptElement>(`script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`)
    if (existing) return

    const script = document.createElement('script')
    script.async = true
    script.src = ADSENSE_SRC
    script.crossOrigin = 'anonymous'
    script.dataset.hallyuhubAdsense = 'true'
    document.head.appendChild(script)
}

function pushAutoAdsRefresh() {
    try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
        // O AdSense pode recusar pushes muito próximos; a próxima tentativa cobre isso.
    }
}

function isExcludedPath(pathname: string) {
    return EXCLUDED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export function AdSenseLoader() {
    const pathname = usePathname()
    const [routeKey, setRouteKey] = useState('')
    const lastRoute = useRef<string | null>(null)

    useEffect(() => {
        const updateRouteKey = () => setRouteKey(`${window.location.pathname}${window.location.search}`)
        const originalPushState = window.history.pushState
        const originalReplaceState = window.history.replaceState

        window.history.pushState = function pushState(...args) {
            originalPushState.apply(this, args)
            updateRouteKey()
        }
        window.history.replaceState = function replaceState(...args) {
            originalReplaceState.apply(this, args)
            updateRouteKey()
        }
        window.addEventListener('popstate', updateRouteKey)
        updateRouteKey()

        return () => {
            window.history.pushState = originalPushState
            window.history.replaceState = originalReplaceState
            window.removeEventListener('popstate', updateRouteKey)
        }
    }, [])

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0) return
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

            const target = event.target
            if (!(target instanceof Element)) return

            const link = target.closest<HTMLAnchorElement>('a[href]')
            if (!link) return
            if (link.target && link.target !== '_self') return
            if (link.hasAttribute('download')) return
            if (link.dataset.nextDocumentNav === 'false') return

            const url = new URL(link.href, window.location.href)
            if (url.origin !== window.location.origin) return
            if (isExcludedPath(url.pathname)) return
            if (url.pathname === window.location.pathname && url.search === window.location.search) return

            event.preventDefault()
            window.location.assign(url.href)
        }

        document.addEventListener('click', handleClick, { capture: true })
        return () => document.removeEventListener('click', handleClick, { capture: true })
    }, [])

    useEffect(() => {
        const currentRoute = routeKey || pathname || ''
        if (!currentRoute) return
        if (lastRoute.current === currentRoute) return
        lastRoute.current = currentRoute

        if (!CLIENT || isExcludedPath(pathname ?? '')) {
            return
        }

        ensureAdSenseScript()

        const timers = ROUTE_PUSH_DELAYS.map(delay =>
            window.setTimeout(() => {
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(pushAutoAdsRefresh)
                })
            }, delay)
        )

        return () => timers.forEach(window.clearTimeout)
    }, [pathname, routeKey])

    return null
}
