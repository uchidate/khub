'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const STORAGE_KEY = 'hallyuhub_favorites'

// Map from FavoriteButton itemType to API endpoint prefix
const API_ENDPOINTS: Record<string, string> = {
  'artista': '/api/artists',
  'produção': '/api/productions',
  'notícia': '/api/news',
}

export function useFavorites() {
  const { status } = useSession()
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'authenticated') {
      // Authenticated: load ALL favorites from DB (artists + productions + news)
      fetch('/api/users/favorites')
        .then(r => r.json())
        .then(data => {
          const dbIds: string[] = data.allIds || data.artistIds || []
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

    // Sync to DB for all supported content types
    const endpointPrefix = itemType ? API_ENDPOINTS[itemType] : null
    if (endpointPrefix) {
      fetch(`${endpointPrefix}/${id}/favorite`, {
        method: isFav ? 'DELETE' : 'POST',
      }).catch(() => {
        // Silent failure — local state already saved
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
