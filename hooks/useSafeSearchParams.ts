'use client'

import { useState, useEffect } from 'react'

/**
 * Safe hook to get URL search params without Suspense
 * Uses window.location and updates on mount
 */
export function useSafeSearchParams() {
  const [params, setParams] = useState<URLSearchParams | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setParams(new URLSearchParams(window.location.search))
    }
  }, [])

  return params
}
