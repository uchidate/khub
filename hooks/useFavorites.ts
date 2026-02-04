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

  const toggle = (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id]

    setFavorites(updated)
    localStorage.setItem('hallyuhub_favorites', JSON.stringify(updated))
  }

  const isFavorite = (id: string) => favorites.includes(id)

  return {
    favorites,
    toggle,
    isFavorite,
    isLoaded
  }
}
