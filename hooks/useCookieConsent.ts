'use client'

import { useState, useEffect } from 'react'

export type ConsentState = 'all' | 'necessary' | null

const STORAGE_KEY = 'hallyu_consent'

function grantAnalytics() {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        ;(window as any).gtag('consent', 'update', {
            analytics_storage: 'granted',
            ad_storage: 'granted',
        })
    }
}

export function useCookieConsent() {
    const [consent, setConsent] = useState<ConsentState>(null)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as ConsentState | null
        setConsent(stored)
        setLoaded(true)
        if (stored === 'all') grantAnalytics()
    }, [])

    const acceptAll = () => {
        localStorage.setItem(STORAGE_KEY, 'all')
        setConsent('all')
        grantAnalytics()
    }

    const acceptNecessary = () => {
        localStorage.setItem(STORAGE_KEY, 'necessary')
        setConsent('necessary')
    }

    return { consent, loaded, acceptAll, acceptNecessary }
}
