'use client'

import { useState, useEffect } from 'react'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load favorites from localStorage
    const saved = localStorage.getItem('hallyuhub_favorites')
    if (saved) {
      try {
        setFavorites(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading favorites:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  const toggle = (id: string, itemType?: string) => {
    const isFav = favorites.includes(id)
    const updated = isFav ? favorites.filter(f => f !== id) : [...favorites, id]

    setFavorites(updated)
    localStorage.setItem('hallyuhub_favorites', JSON.stringify(updated))

    // Atualiza favoriteCount no banco (usado pelo trending score)
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
    isLoaded
  }
}
