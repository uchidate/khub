'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, ChevronRight } from 'lucide-react'

export function FavoritesStatCard() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/users/favorites')
      .then(r => r.json())
      .then(data => setCount((data.allIds ?? []).length))
      .catch(() => setCount(0))
  }, [])

  return (
    <div className="glass-card p-8 md:col-span-1 md:row-span-2 flex flex-col justify-between group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full group-hover:bg-yellow-500/20 transition-all" />
      <div className="relative z-10">
        <div className="p-3 bg-yellow-500/20 w-fit rounded-xl text-yellow-500 mb-4">
          <Star size={24} fill="currentColor" className="opacity-80" />
        </div>
        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Favoritos</p>
        <p className="text-5xl font-display font-black text-white">
          {count === null ? (
            <span className="inline-block w-12 h-12 bg-zinc-800/60 animate-pulse rounded-lg" />
          ) : count}
        </p>
      </div>
      <div className="mt-8 relative z-10">
        <p className="text-zinc-500 text-xs mb-4 leading-relaxed">Itens salvos na sua coleção pessoal.</p>
        <Link href="/favorites" className="flex items-center gap-2 text-yellow-500 text-xs font-black uppercase tracking-widest hover:translate-x-1 transition-transform">
          Ver Coleção <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}
