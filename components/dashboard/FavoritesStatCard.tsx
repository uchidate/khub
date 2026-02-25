import Link from 'next/link'
import { Star, ChevronRight, User, Film, Newspaper, Music } from 'lucide-react'

interface FavoritesStatCardProps {
  artistCount: number
  productionCount: number
  newsCount: number
  groupCount: number
}

export function FavoritesStatCard({ artistCount, productionCount, newsCount, groupCount }: FavoritesStatCardProps) {
  const total = artistCount + productionCount + newsCount + groupCount

  const breakdown = [
    { icon: User,      label: 'Artistas',  count: artistCount,    color: 'text-purple-400' },
    { icon: Music,     label: 'Grupos',    count: groupCount,     color: 'text-pink-400' },
    { icon: Film,      label: 'Produções', count: productionCount, color: 'text-cyan-400' },
    { icon: Newspaper, label: 'Notícias',  count: newsCount,      color: 'text-yellow-400' },
  ]

  return (
    <div className="glass-card p-6 md:col-span-1 md:row-span-2 flex flex-col justify-between group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full group-hover:bg-yellow-500/20 transition-all" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-500/20 rounded-xl text-yellow-500">
            <Star size={20} fill="currentColor" className="opacity-80" />
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Coleção</p>
        </div>
        <p className="text-5xl font-display font-black text-white mb-1">{total}</p>
        <p className="text-zinc-500 text-xs mb-5">itens favoritos</p>

        {/* Breakdown por tipo */}
        <div className="space-y-2">
          {breakdown.map(({ icon: Icon, label, count, color }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={12} className={color} />
                <span className="text-xs text-zinc-500">{label}</span>
              </div>
              <span className={`text-xs font-black ${color}`}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 relative z-10">
        <Link href="/favorites" className="flex items-center gap-2 text-yellow-500 text-xs font-black uppercase tracking-widest hover:translate-x-1 transition-transform">
          Ver Coleção <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}
