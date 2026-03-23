'use client'

import { useState, useCallback } from 'react'

/**
 * useSelection
 *
 * Set-based multi-select hook for admin list pages.
 * Provides toggle, toggleAll, clear, and derived helpers.
 */
export function useSelection<T extends string = string>(allIds: T[] = []) {
  const [selected, setSelected] = useState<Set<T>>(new Set())

  const toggle = useCallback((id: T) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected(prev =>
      prev.size === allIds.length && allIds.every(id => prev.has(id))
        ? new Set()
        : new Set(allIds)
    )
  }, [allIds])

  const clear = useCallback(() => setSelected(new Set()), [])

  const isSelected = useCallback((id: T) => selected.has(id), [selected])

  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const someSelected = selected.size > 0 && !allSelected

  return {
    selected,
    toggle,
    toggleAll,
    clear,
    isSelected,
    allSelected,
    someSelected,
    count: selected.size,
    ids: Array.from(selected),
  }
}
