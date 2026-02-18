import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  User,
  Settings,
  Shield,
  Star,
  Zap,
  Clock,
  ChevronRight,
  History,
  Crown,
  Newspaper,
} from 'lucide-react'
import { PageTransition } from '@/components/features/PageTransition'
import { getDashboardData } from '@/lib/actions/user'
import { FavoritesGallery } from '@/components/dashboard/FavoritesGallery'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/dashboard')

  const data = await getDashboardData()
  if (!data) return null

  const { activities, latestNews, trendingArtists, stats } = data

  const quickLinks = [
    { title: 'Perfil', description: 'Editar Informações', href: '/profile', icon: User },
    { title: 'Configurações', description: 'Privacidade', href: '/settings', icon: Settings },
    ...(session.user.role?.toLowerCase() === 'admin' ? [{ title: 'Admin', description: 'Painel', href: '/admin', icon: Shield }] : []),
  ]

  return (
    <PageTransition>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-neon-pink mb-2 font-black tracking-widest uppercase text-[10px]">
              <LayoutDashboard size={14} />
              Command Center
            </p>
            <h1 className="text-4xl md:text-6xl font-display font-black text-white tracking-tight leading-none uppercase italic">
              Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple via-neon-pink to-electric-cyan animate-gradient">{session.user.name?.split(' ')[0]}</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="btn-secondary text-xs uppercase tracking-widest">
              Explorar
            </Link>
            <Link href="/premium" className="bg-white text-black px-6 py-3 rounded-full font-black text-xs hover:scale-105 transition-transform uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              <span className="flex items-center gap-2"><Crown size={14} className="text-cyber-purple" /> Upgrade</span>
            </Link>
          </div>
        </header>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:grid-rows-[auto_auto_auto]">

          {/* 1. Primary Stat: Favorites (Large Square) */}
          <div className="glass-card p-8 md:col-span-1 md:row-span-2 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full group-hover:bg-yellow-500/20 transition-all" />
            <div className="relative z-10">
              <div className="p-3 bg-yellow-500/20 w-fit rounded-xl text-yellow-500 mb-4">
                <Star size={24} fill="currentColor" className="opacity-80" />
              </div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Favoritos</p>
              <p className="text-5xl font-display font-black text-white">{stats.favoritesCount}</p>
            </div>
            <div className="mt-8 relative z-10">
              <p className="text-zinc-500 text-xs mb-4 leading-relaxed">Itens salvos na sua coleção pessoal.</p>
              <Link href="/favorites" className="flex items-center gap-2 text-yellow-500 text-xs font-black uppercase tracking-widest hover:translate-x-1 transition-transform">
                Ver Coleção <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* 2. Timeline / Activity (Wide Rectangle) */}
          <div className="glass-card p-6 md:col-span-2 md:row-span-2 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <History size={20} className="text-electric-cyan" />
                Atividade Recente
              </h3>
              <span className="text-xs font-mono text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded-md border border-white/5">
                Score: {stats.activityScore}
              </span>
            </div>

            <div className="flex-grow space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {activities.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-60">
                  <Clock size={32} className="mb-2" />
                  <p className="text-xs font-mono">Sem atividade recente</p>
                </div>
              ) : (
                activities.map((activity: any) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded bg-black/50 border border-white/10 ${activity.type === 'LIKE' ? 'text-neon-pink' : 'text-electric-cyan'
                      }`}>
                      {activity.type}
                    </span>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm text-zinc-200 truncate">
                        <span className="font-bold text-white">
                          {activity.entityType || 'SYSTEM'}
                        </span>
                        <span className="mx-2 text-zinc-600">•</span>
                        {new Date(activity.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. Quick Actions (Vertical Stack) */}
          <div className="space-y-4 md:col-span-1 md:row-span-2">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-all group border-l-4 border-l-transparent hover:border-l-cyber-purple">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                    <link.icon size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{link.title}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
              </Link>
            ))}

            <div className="glass-card p-5 bg-gradient-to-br from-cyber-purple/20 to-transparent border-cyber-purple/30 relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <Zap size={18} className="text-cyber-purple" />
                <span className="text-xs font-black uppercase text-cyber-purple tracking-widest">Power User</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight relative z-10">Desbloqueie recursos avançados.</p>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-cyber-purple/20 blur-xl rounded-full group-hover:scale-150 transition-transform duration-700" />
            </div>
          </div>

          {/* 4. Favorites Gallery (Wide Span) */}
          <div className="md:col-span-4 mt-4">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tight">Galeria de Coleção</h2>
                <p className="text-zinc-500 text-sm mt-1">Seus items mais recentes</p>
              </div>
              <Link href="/favorites" className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                Ver Tudo <ChevronRight size={14} />
              </Link>
            </div>

            <FavoritesGallery trendingArtists={trendingArtists} />
          </div>

          {/* 5. Latest News (Full Width) */}
          {latestNews.length > 0 && (
            <div className="md:col-span-4 mt-4">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tight">Últimas Notícias</h2>
                  <p className="text-zinc-500 text-sm mt-1">Fique por dentro do universo hallyu</p>
                </div>
                <Link href="/news" className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                  Ver Tudo <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {latestNews.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.id}`}
                    className="glass-card overflow-hidden group hover:scale-[1.02] transition-transform"
                  >
                    {item.imageUrl && (
                      <div className="relative h-40 overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-2 left-3">
                          {item.tags?.[0] && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-neon-pink/80 text-white">
                              {item.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                        <Newspaper size={10} />
                        {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                      </p>
                      <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-electric-cyan transition-colors">
                        {item.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
