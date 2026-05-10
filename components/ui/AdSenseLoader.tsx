'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-6015098995926392'
const ADSENSE_ENABLED = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_ADSENSE_DEV === 'true'
const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`
const ROUTE_PUSH_DELAYS = [400, 1200, 2500]
const EXCLUDED_PATH_PREFIXES = ['/admin', '/auth', '/write', '/api']
const MOBILE_BREAKPOINT = 640
const TOP_ANCHOR_OFFSET_MULTIPLIER = 1.7
const MAX_TOP_ANCHOR_OFFSET = 205

declare global {
    interface Window {
        adsbygoogle?: unknown[]
    }
}

function ensureAdSenseScript() {
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

function getTopAnchorOffset() {
    if (window.innerWidth >= MOBILE_BREAKPOINT) return 0

    const viewportWidth = window.innerWidth
    const elements = Array.from(document.body.querySelectorAll<HTMLElement>('body *'))

    for (const element of elements) {
        const styles = window.getComputedStyle(element)
        if (styles.position !== 'fixed') continue
        if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') continue
        const hasGoogleAdFrame = element.matches('iframe[src*="googlesyndication"], iframe[id*="google_ads_iframe"], iframe[id^="aswift_"]')
            || Boolean(element.querySelector('iframe[src*="googlesyndication"], iframe[id*="google_ads_iframe"], iframe[id^="aswift_"]'))
        if (!hasGoogleAdFrame) continue

        const rect = element.getBoundingClientRect()
        const isTopAnchored = rect.top <= 4 && rect.bottom > 0
        const isWideEnough = rect.width >= viewportWidth * 0.7
        if (!isTopAnchored || !isWideEnough) continue

        return Math.min(Math.ceil(rect.bottom * TOP_ANCHOR_OFFSET_MULTIPLIER), MAX_TOP_ANCHOR_OFFSET)
    }

    return 0
}

function setTopAnchorOffset() {
    const offset = getTopAnchorOffset()
    document.documentElement.style.setProperty('--adsense-anchor-top-offset', `${offset}px`)
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
        if (!ADSENSE_ENABLED) return
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
        if (!ADSENSE_ENABLED) return
        if (typeof window === 'undefined') return

        let frame = 0
        const scheduleUpdate = () => {
            window.clearTimeout(frame)
            frame = window.setTimeout(setTopAnchorOffset, 80)
        }

        const observer = new MutationObserver(scheduleUpdate)
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] })

        window.addEventListener('resize', scheduleUpdate)
        window.addEventListener('orientationchange', scheduleUpdate)
        scheduleUpdate()

        return () => {
            window.clearTimeout(frame)
            observer.disconnect()
            window.removeEventListener('resize', scheduleUpdate)
            window.removeEventListener('orientationchange', scheduleUpdate)
            document.documentElement.style.removeProperty('--adsense-anchor-top-offset')
        }
    }, [])

    useEffect(() => {
        if (!ADSENSE_ENABLED) return
        const currentRoute = routeKey || pathname || ''
        if (!currentRoute) return
        if (lastRoute.current === currentRoute) return
        lastRoute.current = currentRoute

        if (isExcludedPath(pathname ?? '')) {
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
