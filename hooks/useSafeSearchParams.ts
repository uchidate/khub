'use client'

import { ReadonlyURLSearchParams } from 'next/navigation'

/**
 * Safe wrapper for useSearchParams that works without Suspense
 * Returns search params from window.location instead of using useSearchParams hook
 * This avoids React error #300 (Suspense requirement)
 */
export function useSafeSearchParams(): ReadonlyURLSearchParams | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return new URLSearchParams(window.location.search) as ReadonlyURLSearchParams
  } catch (error) {
    console.warn('[useSafeSearchParams] Failed to parse search params:', error)
    return null
  }
}
