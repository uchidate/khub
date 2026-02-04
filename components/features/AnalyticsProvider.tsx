'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { useEffect } from 'react'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useAnalytics() // This will track pageviews automatically

  useEffect(() => {
    // Log that analytics is initialized
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Provider initialized')
    }
  }, [])

  return <>{children}</>
}
