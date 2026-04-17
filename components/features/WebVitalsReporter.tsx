'use client'

import { useReportWebVitals } from 'next/web-vitals'

/**
 * Envia Core Web Vitals ao Google Analytics 4 como custom events.
 * Métricas: LCP, CLS, INP (substitui FID), FCP, TTFB
 *
 * Montado em app/layout.tsx — só reporta se NEXT_PUBLIC_GA_ID estiver configurado.
 */
export function WebVitalsReporter() {
    useReportWebVitals((metric) => {
        if (typeof window === 'undefined' || !(window as any).gtag) return

        // CLS é adimensional (0–1), multiplicamos por 1000 para inteiro
        const value = Math.round(
            metric.name === 'CLS' ? metric.value * 1000 : metric.value
        )

        ;(window as any).gtag('event', metric.name, {
            event_category: 'Web Vitals',
            event_label: metric.id,
            value,
            non_interaction: true,
        })
    })

    return null
}
