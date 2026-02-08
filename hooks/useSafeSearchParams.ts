'use client'

import { useSearchParams as useNextSearchParams } from 'next/navigation'

/**
 * Safe wrapper for useSearchParams that handles Suspense requirement gracefully
 * Use this instead of useSearchParams directly to avoid React error #300
 */
export function useSafeSearchParams() {
  try {
    return useNextSearchParams()
  } catch (error) {
    // If not wrapped in Suspense, return null instead of throwing
    if (process.env.NODE_ENV === 'development') {
      console.warn('[useSafeSearchParams] Not wrapped in Suspense, returning null')
    }
    return null
  }
}
