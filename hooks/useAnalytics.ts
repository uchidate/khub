'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface EventProps {
  action: string
  category: string
  label?: string
  value?: number
}

export function useAnalytics() {
  const pathname = usePathname()

  // Track pageviews (pathname only to avoid Suspense requirement)
  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  const trackPageView = (url: string) => {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: url,
      })
    }

    // Plausible
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('pageview', { props: { path: url } })
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Pageview:', url)
    }
  }

  const trackEvent = ({ action, category, label, value }: EventProps) => {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      })
    }

    // Plausible
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(action, {
        props: {
          category,
          label,
          value,
        },
      })
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Event:', { action, category, label, value })
    }
  }

  // Convenience methods
  const trackClick = (element: string, location?: string) => {
    trackEvent({
      action: 'click',
      category: 'engagement',
      label: `${element}${location ? ` - ${location}` : ''}`,
    })
  }

  const trackSearch = (query: string) => {
    trackEvent({
      action: 'search',
      category: 'search',
      label: query,
    })
  }

  const trackFavorite = (itemId: string, itemType: string, action: 'add' | 'remove') => {
    trackEvent({
      action: `favorite_${action}`,
      category: 'favorites',
      label: `${itemType}:${itemId}`,
    })
  }

  const trackShare = (itemType: string, platform?: string) => {
    trackEvent({
      action: 'share',
      category: 'social',
      label: `${itemType}${platform ? ` - ${platform}` : ''}`,
    })
  }

  return {
    trackEvent,
    trackClick,
    trackSearch,
    trackFavorite,
    trackShare,
    trackPageView,
  }
}
