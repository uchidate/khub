'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export function AdSenseLoader() {
    const pathname = usePathname()
    const mounted = useRef(false)

    useEffect(() => {
        if (!CLIENT || pathname?.startsWith('/admin') || pathname?.startsWith('/auth') || pathname?.startsWith('/write')) return

        if (!mounted.current) {
            mounted.current = true
            return
        }

        const timer = setTimeout(() => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
            } catch { /* adsbygoogle ainda não carregou */ }
        }, 300)

        return () => clearTimeout(timer)
    }, [pathname])

    return null
}
