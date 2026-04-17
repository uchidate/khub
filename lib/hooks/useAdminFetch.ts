'use client'

import { useState, useCallback, useRef } from 'react'

interface FetchState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

/**
 * useAdminFetch
 *
 * Standardized fetch + loading/error state for admin pages.
 * Cancels previous requests on refetch to prevent race conditions.
 *
 * @example
 * const { data, isLoading, error, run } = useAdminFetch<MyType[]>()
 * useEffect(() => { run('/api/admin/items?' + params) }, [params])
 */
export function useAdminFetch<T>() {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: false,
    error: null,
  })
  const controllerRef = useRef<AbortController | null>(null)

  const run = useCallback(async (url: string, options?: RequestInit): Promise<T | null> => {
    // Cancel previous in-flight request
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setState(s => ({ ...s, isLoading: true, error: null }))

    try {
      const res = await fetch(url, { signal: controller.signal, ...options })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Erro ${res.status}`)
      }
      const data: T = await res.json()
      setState({ data, isLoading: false, error: null })
      return data
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null
      const msg = (err as Error).message || 'Erro desconhecido'
      setState(s => ({ ...s, isLoading: false, error: msg }))
      return null
    }
  }, [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    setState({ data: null, isLoading: false, error: null })
  }, [])

  return { ...state, run, reset }
}
