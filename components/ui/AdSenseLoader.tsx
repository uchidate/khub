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
        __adSettings?: { adsGloballyPaused: boolean; adsAutoAdsEnabled: boolean; adsMultiplexEnabled: boolean; adsSidebarEnabled: boolean }
    }
}

function isAdsPaused() {
    return window.__adSettings?.adsGloballyPaused === true
}

let pageLevelAdsPushed = false

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

    // Ativa explicitamente vignette e anchor ads (page-level ads)
    // Sem este push o AdSense pode não ativar esses formatos em todos os browsers
    if (!pageLevelAdsPushed) {
        pageLevelAdsPushed = true
        script.addEventListener('load', () => {
            try {
                ;(window.adsbygoogle = window.adsbygoogle || []).push({
                    google_ad_client: CLIENT,
                    enable_page_level_ads: true,
                    overlays: { bottom: true },
                })
            } catch { /* ignore */ }
        }, { once: true })
    }
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

const INTERACTION_EVENTS = ['scroll', 'mousemove', 'touchstart', 'keydown', 'click'] as const

// Vignette: intervignette mínimo de 3 min; no máximo 1 por sessão na primeira navegação
const VIGNETTE_COOLDOWN_MS = 3 * 60 * 1000
let lastVignetteAt = 0
let navCount = 0

// Deriva tipo de página e categoria a partir do pathname para custom signals
function derivePageContext(pathname: string): { pageType: string; category: string } {
    if (pathname === '/' || pathname === '') return { pageType: 'home', category: 'home' }
    if (pathname.startsWith('/blog/')) return { pageType: 'article', category: 'blog' }
    if (pathname.startsWith('/blog'))  return { pageType: 'listing', category: 'blog' }
    if (pathname.startsWith('/artists/')) return { pageType: 'profile', category: 'artists' }
    if (pathname.startsWith('/artists'))  return { pageType: 'listing', category: 'artists' }
    if (pathname.startsWith('/groups/'))  return { pageType: 'profile', category: 'groups' }
    if (pathname.startsWith('/groups'))   return { pageType: 'listing', category: 'groups' }
    if (pathname.startsWith('/productions/')) return { pageType: 'profile', category: 'productions' }
    if (pathname.startsWith('/productions'))  return { pageType: 'listing', category: 'productions' }
    if (pathname.startsWith('/search')) return { pageType: 'search', category: 'search' }
    if (pathname.startsWith('/quiz'))   return { pageType: 'interactive', category: 'quiz' }
    if (pathname.startsWith('/loja'))   return { pageType: 'commerce', category: 'loja' }
    if (pathname.startsWith('/calendario')) return { pageType: 'listing', category: 'calendario' }
    return { pageType: 'other', category: 'other' }
}

function tryVignette() {
    const now = Date.now()
    if (now - lastVignetteAt < VIGNETTE_COOLDOWN_MS) return
    lastVignetteAt = now
    try {
        const adBreak = (window as unknown as { adBreak?: (o: object) => void }).adBreak
        adBreak?.({ type: 'next', name: 'spa-page-nav' })
    } catch { /* page-level ads não configurados */ }
}

export function AdSenseLoader() {
    const pathname = usePathname()
    const [routeKey, setRouteKey] = useState('')
    const lastRoute = useRef<string | null>(null)
    const scriptInjected = useRef(false)

    // Lazy load: injeta o script AdSense apenas após primeira interação do usuário
    // Melhora LCP e TBT em ~200-400ms em mobile (NitroPack pattern)
    useEffect(() => {
        if (!ADSENSE_ENABLED || scriptInjected.current) return

        const inject = () => {
            if (scriptInjected.current) return
            scriptInjected.current = true
            INTERACTION_EVENTS.forEach(e => window.removeEventListener(e, inject))
            ensureAdSenseScript()
        }

        // Se o usuário já scrollou antes do componente montar (navegação SPA)
        if (document.documentElement.scrollTop > 0) {
            inject()
            return
        }

        INTERACTION_EVENTS.forEach(e => window.addEventListener(e, inject, { once: true, passive: true }))
        return () => INTERACTION_EVENTS.forEach(e => window.removeEventListener(e, inject))
    }, [])

    useEffect(() => {
        const updateRouteKey = () => setRouteKey(`${window.location.pathname}${window.location.search}`)
        const originalPushState = window.history.pushState
        const originalReplaceState = window.history.replaceState

        window.history.pushState = function pushState(...args) {
            originalPushState.apply(this, args)
            setTimeout(updateRouteKey, 0)
        }
        window.history.replaceState = function replaceState(...args) {
            originalReplaceState.apply(this, args)
            setTimeout(updateRouteKey, 0)
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

        if (isAdsPaused()) return

        if (isExcludedPath(pathname ?? '')) {
            // Remove AdSense script and all injected ad iframes so auto ads stop
            document.querySelectorAll('script[data-hallyuhub-adsense="true"], script[src*="pagead2.googlesyndication.com"]')
                .forEach(el => el.remove())
            document.querySelectorAll('iframe[id*="google_ads"], iframe[src*="googlesyndication"], ins.adsbygoogle')
                .forEach(el => el.closest('[id^="aswift_"]')?.remove() ?? el.remove())
            return
        }

        ensureAdSenseScript()

        // Custom signals: expõe contexto de página para AdSense via dataset no html
        const { pageType, category } = derivePageContext(pathname ?? '')
        document.documentElement.dataset.adPageType = pageType
        document.documentElement.dataset.adCategory = category

        if (window.__adSettings?.adsAutoAdsEnabled !== false) {
            // Vignette interstitial na navegação SPA (Page-level Ads API)
            // Ignora primeira navegação (montagem inicial) e respeita cooldown
            navCount++
            if (navCount > 1) tryVignette()
        }

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
