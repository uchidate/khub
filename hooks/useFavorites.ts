'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const STORAGE_KEY = 'hallyuhub_favorites'

export function useFavorites() {
  const { status } = useSession()
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'authenticated') {
      // Authenticated: load from DB (source of truth across devices)
      fetch('/api/users/favorites')
        .then(r => r.json())
        .then(data => {
          const dbIds: string[] = data.artistIds || []
          // Merge with localStorage so any offline actions are preserved
          const local = getLocal()
          const merged = Array.from(new Set([...dbIds, ...local]))
          setFavorites(merged)
          saveLocal(merged)
        })
        .catch(() => {
          // Fallback to localStorage if DB unreachable
          setFavorites(getLocal())
        })
        .finally(() => setIsLoaded(true))
    } else {
      // Unauthenticated: use localStorage only
      setFavorites(getLocal())
      setIsLoaded(true)
    }
  // Run once when auth status resolves
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const toggle = (id: string, itemType?: string) => {
    const isFav = favorites.includes(id)
    const updated = isFav ? favorites.filter(f => f !== id) : [...favorites, id]

    setFavorites(updated)
    saveLocal(updated)

    // Update DB counter + Favorite record (if authenticated, handled server-side)
    if (itemType === 'artista') {
      fetch(`/api/artists/${id}/favorite`, { method: isFav ? 'DELETE' : 'POST' }).catch(() => {
        // Falha silenciosa — favorito local já foi salvo
      })
    }
  }

  const isFavorite = (id: string) => favorites.includes(id)

  return {
    favorites,
    toggle,
    isFavorite,
    isLoaded,
  }
}

function getLocal(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveLocal(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // ignore storage errors
  }
}
