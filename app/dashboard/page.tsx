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
  TrendingUp,
  Star,
  Film,
  Music,
  CalendarDays,
  BookmarkCheck,
  Play,
  Compass,
} from 'lucide-react'
import { PageTransition } from '@/components/features/PageTransition'
import { getDashboardData } from '@/lib/actions/user'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Activity {
  id: string
  type: string
  entityId: string | null
  entityType: string | null
  entityName?: string
  createdAt: string
}

interface NewsItem {
  id: string
  title: string
  imageUrl: string | null
  publishedAt: Date | string
  tags: string[]
  source: string | null
  artists?: { artist: { nameRomanized: string } }[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_LABELS: Record<string, { label: string; color: string }> = {
  LIKE:   { label: '♡ Favoritou',  color: 'text-pink-400' },
  UNLIKE: { label: '✕ Removeu',   color: 'text-zinc-500' },
  VIEW:   { label: '◎ Visualizou', color: 'text-neon-cyan' },
  LOGIN:  { label: '→ Entrou',     color: 'text-green-400' },
}

const ENTITY_HREF: Record<string, (id: string) => string> = {
  ARTIST:     id => `/artists/${id}`,
  PRODUCTION: id => `/productions/${id}`,
  NEWS:       id => `/news/${id}`,
  GROUP:      id => `/groups/${id}`,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/dashboard')

  const data = await getDashboardData()
  if (!data) return null

  const { activities, latestNews, personalizedNews, hasFollowing, trendingArtists, watchingEntries, stats } = data

  const isNewUser = activities.length === 0 && watchingEntries.length === 0 && stats.favoritesCount === 0

  const quickLinks = [
    { title: 'Configurações', description: 'Privacidade e conta', href: '/settings', icon: Settings, accent: 'hover:border-l-zinc-500' },
    ...(session.user.role?.toLowerCase() === 'admin' ? [{ title: 'Admin', description: 'Painel admin', href: '/admin', icon: Shield, accent: 'hover:border-l-red-500' }] : []),
  ]

  const newsToShow = hasFollowing && personalizedNews.length > 0 ? personalizedNews : latestNews
  const newsTitle = hasFollowing && personalizedNews.length > 0 ? 'Para você' : 'Últimas Notícias'
  const newsSubtitle = hasFollowing && personalizedNews.length > 0
    ? 'Notícias dos seus artistas favoritos'
    : 'Fique por dentro do universo hallyu'

  const daysSinceJoin = stats.joinDate
    ? Math.floor((Date.now() - new Date(stats.joinDate).getTime()) / (1000 * 60 * 60 * 24))
    : null

  const miniStats = [
    { label: 'Favoritos', value: stats.favoritesCount, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10', href: '/favorites' },
    { label: 'Minha Lista', value: stats.watchlistCount, icon: BookmarkCheck, color: 'text-teal-400', bg: 'bg-teal-400/10', href: '/watchlist' },
    { label: 'Comentários', value: stats.commentsCount, icon: MessageCircle, color: 'text-neon-pink', bg: 'bg-pink-400/10', href: '/profile' },
    ...(daysSinceJoin !== null ? [{ label: 'Dias de membro', value: daysSinceJoin, icon: CalendarDays, color: 'text-purple-400', bg: 'bg-purple-400/10', href: '/profile' }] : []),
  ]

  return (
    <PageTransition>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12 space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {session.user.image && (
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
                <Image src={session.user.image} alt={session.user.name ?? ''} fill className="object-cover" sizes="56px" />
              </div>
            )}
            <div>
              <p className="flex items-center gap-2 text-neon-pink mb-1 font-black tracking-widest uppercase text-[10px]">
                <LayoutDashboard size={12} />
                Command Center
              </p>
              <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight leading-none">
                Olá,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple via-neon-pink to-neon-cyan">
                  {session.user.name?.split(' ')[0]}
                </span>
              </h1>
            </div>
          </div>
          <div className="flex gap-3 sm:flex-shrink-0">
            <Link href="/" className="btn-secondary text-xs uppercase tracking-widest">
              Explorar
            </Link>
            <Link href="/premium" className="bg-white text-black px-5 py-2.5 rounded-full font-black text-xs hover:scale-105 transition-transform uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              <span className="flex items-center gap-2"><Crown size={13} className="text-cyber-purple" /> Upgrade</span>
            </Link>
          </div>
        </header>

        {/* ── Mini stats strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {miniStats.map(({ label, value, icon: Icon, color, bg, href }) => (
            <Link key={label} href={href} className="glass-card p-4 flex items-center gap-3 rounded-xl border border-white/5 hover:border-white/15 transition-all group">
              <div className={`p-2 rounded-lg ${bg} ${color} group-hover:scale-110 transition-transform`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-xl font-black text-white leading-none">{value}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── 1. CONTINUANDO — mais relevante: onde parei? ────────────────── */}
        {watchingEntries.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-500/20 rounded-lg">
                  <Play size={16} className="text-teal-400" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight">Continuando</h2>
                  <p className="text-xs text-zinc-500">Continue de onde parou</p>
                </div>
              </div>
              <Link href="/watchlist?status=WATCHING" className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                Ver Lista <ChevronRight size={14} />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {watchingEntries.map((entry: any) => (
                <Link
                  key={entry.productionId}
                  href={`/productions/${entry.production.id}`}
                  className="group flex-shrink-0 flex flex-col gap-2 w-28"
                >
                  <div className="relative w-28 h-40 rounded-xl overflow-hidden border border-white/10 group-hover:border-teal-500/60 transition-all duration-300 shadow-lg bg-zinc-800">
                    {entry.production.imageUrl ? (
                      <Image
                        src={entry.production.imageUrl}
                        alt={entry.production.titlePt}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="112px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Film size={24} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2">
                      <div className="w-5 h-5 rounded-full bg-teal-500/90 flex items-center justify-center">
                        <Play size={8} className="text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 group-hover:text-white font-bold text-center leading-tight line-clamp-2 transition-colors">
                    {entry.production.titlePt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 2. NOTÍCIAS — personalizado ou genérico ─────────────────────── */}
        {newsToShow.length > 0 && (
          <section>
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
              {(newsToShow as NewsItem[]).map((item) => {
                const mentionedArtists = item.artists?.map((a) => a.artist.nameRomanized) ?? []
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
                        {item.tags?.[0] && (
                          <div className="absolute bottom-2 left-3">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-neon-pink/80 text-white">
                              {item.tags[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Newspaper size={10} className="text-zinc-600" />
                        <span className="text-xs text-zinc-500">
                          {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-neon-cyan transition-colors leading-snug">
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
          </section>
        )}

        {/* ── 3. EM ALTA — descoberta ──────────────────────────────────────── */}
        {trendingArtists.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-neon-pink/10 rounded-lg">
                  <TrendingUp size={16} className="text-neon-pink" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight">Em Alta Agora</h2>
                  <p className="text-xs text-zinc-500">Artistas em destaque</p>
                </div>
              </div>
              <Link href="/artists" className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                Ver Artistas <ChevronRight size={14} />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {trendingArtists.map((artist: any) => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.id}`}
                  className="group flex-shrink-0 flex flex-col items-center gap-2 w-20"
                >
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-neon-pink/60 transition-all duration-300 shadow-lg">
                    {artist.primaryImageUrl ? (
                      <Image
                        src={artist.primaryImageUrl}
                        alt={artist.nameRomanized}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white font-black text-lg">
                        {artist.nameRomanized[0]}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 group-hover:text-white font-bold text-center leading-tight line-clamp-2 transition-colors">
                    {artist.nameRomanized}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. BENTO — Atividade + Quick Actions ──────────────────────── */}
        {!isNewUser && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Timeline de Atividade */}
            <div className="glass-card p-6 md:col-span-2 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                  <History size={20} className="text-neon-cyan" />
                  Atividade Recente
                </h3>
                {stats.commentsCount > 0 && (
                  <Link href="/profile" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
                    <MessageCircle size={12} className="text-neon-cyan" />
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
                  (activities as Activity[]).map((activity) => {
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

              {stats.joinDate && (
                <p className="text-[10px] text-zinc-700 mt-4 pt-3 border-t border-white/5">
                  Membro desde {new Date(stats.joinDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className={`glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-all group border-l-4 border-l-transparent ${link.accent}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                      <link.icon size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{link.title}</p>
                      <p className="text-[10px] text-zinc-500">{link.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                </Link>
              ))}

              <Link href="/favorites" className="glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-all group border-l-4 border-l-transparent hover:border-l-pink-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-pink-400 transition-colors">
                    <Heart size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">Favoritos</p>
                    <p className="text-[10px] text-zinc-500">Sua coleção completa</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
              </Link>

              <Link href="/watchlist" className="glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-all group border-l-4 border-l-transparent hover:border-l-teal-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-teal-400 transition-colors">
                    <BookmarkCheck size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">Minha Lista</p>
                    <p className="text-[10px] text-zinc-500">{stats.watchlistCount} produção{stats.watchlistCount !== 1 ? 'ões' : ''}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
              </Link>

              {/* Explorar por categoria */}
              <div className="glass-card p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Explorar</p>
                <div className="space-y-1">
                  {[
                    { href: '/artists', label: 'Artistas', icon: User, color: 'text-purple-400' },
                    { href: '/groups', label: 'Grupos', icon: Music, color: 'text-pink-400' },
                    { href: '/productions', label: 'Produções', icon: Film, color: 'text-cyan-400' },
                    { href: '/news', label: 'Notícias', icon: Newspaper, color: 'text-yellow-400' },
                  ].map(({ href, label, icon: Icon, color }) => (
                    <Link key={href} href={href} className="flex items-center gap-2 py-1.5 text-zinc-400 hover:text-white transition-colors group">
                      <Icon size={13} className={color} />
                      <span className="text-xs font-bold">{label}</span>
                      <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="glass-card p-5 bg-gradient-to-br from-cyber-purple/20 to-transparent border-cyber-purple/30 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <Zap size={18} className="text-cyber-purple" />
                  <span className="text-xs font-black uppercase text-cyber-purple tracking-widest">Power User</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight relative z-10">Desbloqueie recursos avançados.</p>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-cyber-purple/20 blur-xl rounded-full group-hover:scale-150 transition-transform duration-700" />
              </div>
            </div>
          </div>
        )}

        {/* ── Onboarding — usuário novo ────────────────────────────────────── */}
        {isNewUser && (
          <div className="glass-card p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple/10 via-transparent to-neon-pink/10 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-purple to-neon-pink flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-900/50">
                <Compass size={32} className="text-white" />
              </div>
              <h2 className="text-3xl font-display font-black text-white italic tracking-tight mb-3">
                Comece sua jornada Hallyu
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-md mx-auto">
                Favorite artistas, salve produções na sua lista e explore o universo do K-Pop e K-Drama. Seu painel vai ganhar vida!
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/artists" className="btn-primary flex items-center gap-2">
                  <User size={16} />
                  Explorar Artistas
                </Link>
                <Link href="/productions" className="btn-secondary flex items-center gap-2">
                  <Film size={16} />
                  Ver Produções
                </Link>
                <Link href="/news" className="btn-secondary flex items-center gap-2">
                  <Newspaper size={16} />
                  Ler Notícias
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </PageTransition>
  )
}
