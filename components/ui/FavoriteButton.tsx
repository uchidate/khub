'use client'

import { Heart } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'

interface FavoriteButtonProps {
  id: string
  className?: string
}

export function FavoriteButton({ id, className = '' }: FavoriteButtonProps) {
  const { isFavorite, toggle, isLoaded } = useFavorites()

  if (!isLoaded) return null

  const favorited = isFavorite(id)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(id)
      }}
      className={`
        p-2 rounded-full
        transition-all duration-200
        hover:scale-110 active:scale-95
        ${favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}
        ${className}
      `}
      aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      title={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart
        size={20}
        fill={favorited ? 'currentColor' : 'none'}
        strokeWidth={2}
      />
    </button>
  )
}
