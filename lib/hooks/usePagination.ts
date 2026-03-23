'use client'

import { useState, useCallback } from 'react'

/**
 * usePagination
 *
 * Simple client-side pagination state for admin pages.
 */
export function usePagination(defaultPage = 1, defaultLimit = 25) {
  const [page, setPage]   = useState(defaultPage)
  const [limit]           = useState(defaultLimit)

  const goTo    = useCallback((p: number) => setPage(p), [])
  const next    = useCallback(() => setPage(p => p + 1), [])
  const prev    = useCallback(() => setPage(p => Math.max(1, p - 1)), [])
  const reset   = useCallback(() => setPage(defaultPage), [defaultPage])

  return { page, limit, goTo, next, prev, reset, setPage }
}
