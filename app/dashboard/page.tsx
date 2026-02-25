import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  User,
  Settings,
  Shield,
  Zap,
  Clock,
  ChevronRight,
  History,
  Crown,
  Newspaper,
  Heart,
  MessageCircle,
  Sparkles,
} from 'lucide-react'
import { PageTransition } from '@/components/features/PageTransition'
import { getDashboardData } from '@/lib/actions/user'
import { FavoritesGallery } from '@/components/dashboard/FavoritesGallery'
import { FavoritesStatCard } from '@/components/dashboard/FavoritesStatCard'

const ACTIVITY_LABELS: Record<string, { label: string; color: string }> = {
  LIKE:   { label: '♡ Favoritou',  color: 'text-pink-400' },
  UNLIKE: { label: '✕ Removeu',   color: 'text-zinc-500' },
  VIEW:   { label: '◎ Visualizou', color: 'text-electric-cyan' },
  LOGIN:  { label: '→ Entrou',     color: 'text-green-400' },
}

const ENTITY_HREF: Record<string, (id: string) => string> = {
  ARTIST:     id => `/artists/${id}`,
  PRODUCTION: id => `/productions/${id}`,
  NEWS:       id => `/news/${id}`,
  GROUP:      id => `/groups/${id}`,
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/dashboard')

  const data = await getDashboardData()
  if (!data) return null

  const { activities, latestNews, personalizedNews, hasFollowing, trendingArtists, stats } = data

  const quickLinks = [
    { title: 'Perfil', description: 'Editar Informações', href: '/profile', icon: User },
    { title: 'Configurações', description: 'Privacidade', href: '/settings', icon: Settings },
    ...(session.user.role?.toLowerCase() === 'admin' ? [{ title: 'Admin', description: 'Painel', href: '/admin', icon: Shield }] : []),
  ]

  // Notícias a exibir: personalizadas (Para você) ou últimas (fallback)
  const newsToShow = hasFollowing && personalizedNews.length > 0 ? personalizedNews : latestNews
  const newsTitle = hasFollowing && personalizedNews.length > 0 ? 'Para você' : 'Últimas Notícias'
  const newsSubtitle = hasFollowing && personalizedNews.length > 0
    ? 'Notícias dos seus artistas favoritos'
    : 'Fique por dentro do universo hallyu'

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

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:grid-rows-[auto_auto_auto]">

          {/* 1. Stats de Coleção (com breakdown por tipo) */}
          <FavoritesStatCard
            artistCount={stats.artistCount}
            productionCount={stats.productionCount}
            newsCount={stats.newsCount}
            groupCount={stats.groupCount}
          />

          {/* 2. Timeline de Atividade (com nomes das entidades) */}
          <div className="glass-card p-6 md:col-span-2 md:row-span-2 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <History size={20} className="text-electric-cyan" />
                Atividade Recente
              </h3>
              {/* Comentários */}
              {stats.commentsCount > 0 && (
                <Link href="/profile" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
                  <MessageCircle size={12} className="text-electric-cyan" />
                  {stats.commentsCount} comentário{stats.commentsCount !== 1 ? 's' : ''}
                </Link>
              )}
            </div>

            <div className="flex-grow space-y-2 overflow-y-auto max-h-[340px] pr-1 custom-scrollbar">
              {activities.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-60">
                  <Clock size={32} className="mb-2" />
                  <p className="text-xs font-mono">Sem atividade recente</p>
                </div>
              ) : (
                activities.map((activity: any) => {
                  const config = ACTIVITY_LABELS[activity.type] ?? { label: activity.type, color: 'text-zinc-500' }
                  const href = activity.entityId && activity.entityType
                    ? ENTITY_HREF[activity.entityType]?.(activity.entityId)
                    : null

                  const content = (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                      <span className={`text-[10px] font-black whitespace-nowrap ${config.color}`}>
                        {config.label}
                      </span>
                      <div className="flex-grow min-w-0">
                        {activity.entityName ? (
                          <p className="text-xs text-white font-bold truncate">{activity.entityName}</p>
                        ) : (
                          <p className="text-xs text-zinc-600 truncate italic">
                            {activity.entityType?.toLowerCase() ?? 'sistema'}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-600 whitespace-nowrap flex-shrink-0">
                        {new Date(activity.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  )

                  return href ? (
                    <Link key={activity.id} href={href}>{content}</Link>
                  ) : (
                    <div key={activity.id}>{content}</div>
                  )
                })
              )}
            </div>

            {/* Membro desde */}
            {stats.joinDate && (
              <p className="text-[10px] text-zinc-700 mt-4 pt-3 border-t border-white/5">
                Membro desde {new Date(stats.joinDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* 3. Quick Actions */}
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

            {/* Favoritos link rápido */}
            <Link href="/favorites" className="glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-all group border-l-4 border-l-transparent hover:border-l-pink-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-pink-400 transition-colors">
                  <Heart size={18} />
                </div>
                <p className="font-bold text-sm text-white">Favoritos</p>
              </div>
              <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
            </Link>

            <div className="glass-card p-5 bg-gradient-to-br from-cyber-purple/20 to-transparent border-cyber-purple/30 relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <Zap size={18} className="text-cyber-purple" />
                <span className="text-xs font-black uppercase text-cyber-purple tracking-widest">Power User</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight relative z-10">Desbloqueie recursos avançados.</p>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-cyber-purple/20 blur-xl rounded-full group-hover:scale-150 transition-transform duration-700" />
            </div>
          </div>

          {/* 4. Galeria de Favoritos */}
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

          {/* 5. Notícias (personalizadas ou gerais) */}
          {newsToShow.length > 0 && (
            <div className="md:col-span-4 mt-4">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tight">{newsTitle}</h2>
                    {hasFollowing && personalizedNews.length > 0 && (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-neon-pink/20 text-neon-pink border border-neon-pink/30">
                        <Sparkles size={9} />
                        Personalizado
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-sm">{newsSubtitle}</p>
                </div>
                <Link href="/news" className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                  Ver Tudo <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {newsToShow.map((item: any) => {
                  const mentionedArtists = item.artists?.map((a: any) => a.artist.nameRomanized) ?? []
                  return (
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
                          <div className="absolute bottom-2 left-3 flex gap-1.5 flex-wrap">
                            {item.tags?.[0] && (
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-neon-pink/80 text-white">
                                {item.tags[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Newspaper size={10} className="text-zinc-600" />
                          <span className="text-xs text-zinc-500">
                            {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                          </span>
                          {item.source && (
                            <span className="text-[10px] text-zinc-600 ml-auto">{item.source}</span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-electric-cyan transition-colors leading-snug">
                          {item.title}
                        </h4>
                        {mentionedArtists.length > 0 && (
                          <p className="text-[10px] text-neon-pink/70 mt-1.5 truncate">
                            {mentionedArtists.join(' · ')}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
