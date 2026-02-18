'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, TrendingUp } from 'lucide-react'
import { MediaCard } from '@/components/ui/MediaCard'

type FavoriteItem = {
  id: string
  type: 'artist' | 'production' | 'news'
  nameRomanized?: string
  title?: string
  imageUrl?: string
  primaryImageUrl?: string
}

type TrendingArtist = {
  id: string
  nameRomanized: string
  primaryImageUrl: string | null
}

type Props = {
  trendingArtists: TrendingArtist[]
}

export function FavoritesGallery({ trendingArtists }: Props) {
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users/favorites?full=true')
      .then(r => r.json())
      .then(data => {
        setItems(data.items ?? [])
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card aspect-square animate-pulse bg-zinc-800/50 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        {/* Empty state CTA */}
        <div className="glass-card p-8 text-center border-dashed border-2 border-zinc-800/50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
            <Star size={32} className="text-zinc-700" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Sua galáxia está vazia</h3>
          <p className="text-zinc-500 mb-6 max-w-sm mx-auto text-sm">
            Comece a explorar e adicione artistas, produções e notícias para construir seu universo pessoal.
          </p>
          <Link href="/artists" className="btn-primary text-xs uppercase tracking-widest">
            Explorar Universo
          </Link>
        </div>

        {/* Trending artists discovery */}
        {trendingArtists.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-neon-pink" />
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Em alta agora</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {trendingArtists.map((artist) => (
                <MediaCard
                  key={artist.id}
                  id={artist.id}
                  title={artist.nameRomanized}
                  imageUrl={artist.primaryImageUrl}
                  type="artist"
                  href={`/artists/${artist.id}`}
                  aspectRatio="square"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          id={item.id}
          title={item.nameRomanized ?? item.title ?? ''}
          imageUrl={item.primaryImageUrl ?? item.imageUrl ?? null}
          type={item.type}
          href={
            item.type === 'artist'
              ? `/artists/${item.id}`
              : item.type === 'production'
              ? `/productions/${item.id}`
              : `/news/${item.id}`
          }
          aspectRatio="square"
        />
      ))}
    </div>
  )
}
