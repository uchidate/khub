'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, TrendingUp, User, Film, Newspaper, Music } from 'lucide-react'
import { getRoleLabel } from '@/lib/utils/role-labels'

type FavoriteItem = {
  id: string
  type: 'artist' | 'group' | 'production' | 'news'
  // Artist / Group
  nameRomanized?: string
  nameHangul?: string
  primaryImageUrl?: string | null
  roles?: string[]
  gender?: number | null
  // Production
  title?: string
  imageUrl?: string | null
  year?: number | null
  productionType?: string
  // News
  publishedAt?: string
  source?: string
}

type TrendingArtist = {
  id: string
  nameRomanized: string
  primaryImageUrl: string | null
}

type Props = {
  trendingArtists: TrendingArtist[]
}

const TYPE_CONFIG = {
  artist:     { label: 'Artista',  icon: User,      color: 'text-purple-400', bg: 'bg-purple-500/20' },
  group:      { label: 'Grupo',    icon: Music,     color: 'text-pink-400',   bg: 'bg-pink-500/20' },
  production: { label: 'Produção', icon: Film,      color: 'text-cyan-400',   bg: 'bg-cyan-500/20' },
  news:       { label: 'Notícia',  icon: Newspaper, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
}

function FavoriteCard({ item }: { item: FavoriteItem }) {
  const href =
    item.type === 'artist' ? `/artists/${item.id}`
    : item.type === 'group' ? `/groups/${item.id}`
    : item.type === 'production' ? `/productions/${item.id}`
    : `/news/${item.id}`

  const imageUrl = item.primaryImageUrl ?? item.imageUrl ?? null
  const name = item.nameRomanized ?? item.title ?? ''
  const cfg = TYPE_CONFIG[item.type]
  const Icon = cfg.icon

  let subtitle = ''
  if (item.type === 'artist' && item.roles?.length) {
    subtitle = getRoleLabel(item.roles[0], item.gender)
  } else if (item.type === 'production') {
    subtitle = [item.productionType, item.year].filter(Boolean).join(' · ')
  } else if (item.type === 'news' && item.publishedAt) {
    subtitle = new Date(item.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  } else if (item.type === 'group' && item.nameHangul) {
    subtitle = item.nameHangul
  }

  return (
    <Link href={href} className="group block">
      {/* Poster */}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800/50 border border-white/5 group-hover:border-white/20 transition-all duration-300 mb-2 shadow-lg">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Icon size={28} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Type badge */}
        <div className={`absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black ${cfg.bg} ${cfg.color} backdrop-blur-sm`}>
          <Icon size={7} />
          {cfg.label}
        </div>
      </div>
      {/* Name */}
      <p className="text-xs font-bold text-white truncate group-hover:text-neon-pink transition-colors leading-tight">
        {name}
      </p>
      {subtitle && (
        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{subtitle}</p>
      )}
    </Link>
  )
}

export function FavoritesGallery({ trendingArtists }: Props) {
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users/favorites?full=true')
      .then(r => r.json())
      .then(data => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] animate-pulse bg-zinc-800/50 rounded-xl" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
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

        {trendingArtists.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-neon-pink" />
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Em alta agora</h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {trendingArtists.map((artist) => (
                <Link key={artist.id} href={`/artists/${artist.id}`} className="group block">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800/50 border border-white/5 group-hover:border-white/20 transition-all mb-2">
                    {artist.primaryImageUrl ? (
                      <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="120px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <User size={24} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-purple-500/20 text-purple-400 backdrop-blur-sm">
                      <User size={7} />Artista
                    </div>
                  </div>
                  <p className="text-xs font-bold text-white truncate group-hover:text-neon-pink transition-colors">{artist.nameRomanized}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
      {items.slice(0, 10).map((item) => (
        <FavoriteCard key={item.id} item={item} />
      ))}
    </div>
  )
}
