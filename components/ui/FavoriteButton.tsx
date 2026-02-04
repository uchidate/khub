'use client'

import { Heart } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { useToast } from '@/lib/hooks/useToast'

interface FavoriteButtonProps {
  id: string
  className?: string
  itemName?: string
  itemType?: 'artista' | 'agência' | 'produção' | 'notícia'
}

export function FavoriteButton({ id, className = '', itemName, itemType }: FavoriteButtonProps) {
  const { isFavorite, toggle, isLoaded } = useFavorites()
  const { addToast } = useToast()

  const favorited = isLoaded ? isFavorite(id) : false

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle(id)

    // Only show toast if itemType is provided
    if (itemType) {
      const action = favorited ? 'removido' : 'adicionado'
      const preposition = favorited ? 'dos' : 'aos'
      const name = itemName ? ` "${itemName}"` : ''

      addToast({
        type: favorited ? 'info' : 'success',
        message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)}${name} ${action} ${preposition} favoritos`,
        duration: 3000
      })
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={!isLoaded}
      className={`
        p-2 rounded-full
        transition-all duration-200
        hover:scale-110 active:scale-95
        ${favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}
        ${!isLoaded ? 'opacity-50 cursor-wait' : ''}
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
