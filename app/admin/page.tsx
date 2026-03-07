import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Activity, Film, Newspaper, Music2, Building2,
  Mic2, ImageOff, UserX, AlertTriangle, Plus, Settings,
  RefreshCw, ChevronRight, Flag, MessageSquare, UserPlus,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import prisma from '@/lib/prisma'

export default async function AdminPage() {
  const session = await auth()

  if (!session) redirect('/auth/login?callbackUrl=/admin')
  if (session.user.role?.toLowerCase() !== 'admin') redirect('/dashboard')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    totalUsers, totalArtists, totalProductions, totalNews,
    totalGroups, totalAgencies,
    newUsers, newArtists, newProductions, newNews, newGroups,
    recentUsers, recentNews, recentArtists, recentProductions,
    artistsWithoutImage, groupsWithoutImage, newsWithoutImage,
    artistsWithoutBio, groupsWithoutBio,
    pendingReports, flaggedComments, newUsers7d,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.artist.count(),
    prisma.production.count(),
    prisma.news.count(),
    prisma.musicalGroup.count(),
    prisma.agency.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.artist.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.production.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.news.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.musicalGroup.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' }, take: 5,
      select: { email: true, name: true, createdAt: true },
    }),
    prisma.news.findMany({
      orderBy: { createdAt: 'desc' }, take: 5,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.artist.findMany({
      orderBy: { createdAt: 'desc' }, take: 5,
      select: { id: true, nameRomanized: true, createdAt: true },
    }),
    prisma.production.findMany({
      orderBy: { createdAt: 'desc' }, take: 5,
      select: { id: true, titlePt: true, createdAt: true },
    }),
    prisma.artist.count({ where: { primaryImageUrl: null } }),
    prisma.musicalGroup.count({ where: { profileImageUrl: null } }),
    prisma.news.count({ where: { imageUrl: null } }),
    prisma.artist.count({ where: { bio: null } }),
    prisma.musicalGroup.count({ where: { bio: null } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.comment.count({ where: { status: 'FLAGGED' } }),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 86400_000) } } }),
  ])

  type ActivityEvent = { type: string; label: string; href: string; time: Date; color: string }
  const activityEvents: ActivityEvent[] = [
    ...recentUsers.map(u => ({
      type: 'Usuário', label: u.name || u.email || 'Sem nome', href: '/admin/users',
      time: u.createdAt, color: 'purple',
    })),
    ...recentNews.map(n => ({
      type: 'Notícia', label: n.title, href: `/news/${n.id}`,
      time: n.createdAt, color: 'pink',
    })),
    ...recentArtists.map(a => ({
      type: 'Artista', label: a.nameRomanized, href: `/artists/${a.id}`,
      time: a.createdAt, color: 'cyan',
    })),
    ...recentProductions.map(p => ({
      type: 'Produção', label: p.titlePt, href: `/productions/${p.id}`,
      time: p.createdAt, color: 'yellow',
    })),
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10)

  function timeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}min`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
  }

  const colorMap: Record<string, { dot: string; badge: string }> = {
    purple: { dot: 'bg-purple-500', badge: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    pink:   { dot: 'bg-pink-500',   badge: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
    cyan:   { dot: 'bg-cyan-500',   badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
    yellow: { dot: 'bg-yellow-500', badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  }

  const stats = [
    { label: 'Usuários',  value: totalUsers,      new: newUsers,      icon: Users,     href: '/admin/users',        subtitle: `+${newUsers7d} esta semana` },
    { label: 'Artistas',  value: totalArtists,    new: newArtists,    icon: Mic2,      href: '/admin/artists',      subtitle: null },
    { label: 'Produções', value: totalProductions, new: newProductions, icon: Film,     href: '/admin/productions',  subtitle: null },
    { label: 'Notícias',  value: totalNews,        new: newNews,       icon: Newspaper, href: '/admin/news',         subtitle: null },
    { label: 'Grupos',    value: totalGroups,      new: newGroups,     icon: Music2,    href: '/admin/groups',       subtitle: null },
    { label: 'Agências',  value: totalAgencies,    new: 0,             icon: Building2, href: '/admin/agencies',     subtitle: null },
  ]

  const urgentItems = [
    { label: 'Reportes pendentes',    count: pendingReports,   href: '/admin/reports?status=PENDING', icon: Flag,           severity: 'high' as const },
    { label: 'Comentários flagados',  count: flaggedComments,  href: '/admin/comments?status=FLAGGED', icon: MessageSquare,  severity: 'high' as const },
  ].filter(i => i.count > 0)

  const attentionItems = [
    { label: 'Artistas sem foto',    count: artistsWithoutImage, href: '/admin/artists?filter=no_photo', icon: ImageOff,  severity: artistsWithoutImage > 20 ? 'high' : 'medium' as const },
    { label: 'Artistas sem bio',     count: artistsWithoutBio,   href: '/admin/artists',                 icon: UserX,     severity: artistsWithoutBio > 30 ? 'high' : 'low' as const },
    { label: 'Grupos sem foto',      count: groupsWithoutImage,  href: '/admin/groups',                  icon: ImageOff,  severity: groupsWithoutImage > 5 ? 'high' : 'medium' as const },
    { label: 'Grupos sem bio',       count: groupsWithoutBio,    href: '/admin/groups',                  icon: UserX,     severity: 'low' as const },
    { label: 'Notícias sem imagem',  count: newsWithoutImage,    href: '/admin/news',                    icon: Newspaper, severity: newsWithoutImage > 10 ? 'medium' : 'low' as const },
  ].filter(i => i.count > 0)

  const severityColors = {
    high:   'border-red-500/30 bg-red-500/5 text-red-400',
    medium: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
    low:    'border-zinc-700/50 bg-zinc-800/30 text-zinc-400',
  }

  const quickActions = [
    { label: 'Novo Artista',   href: '/admin/artists/new',    icon: Plus },
    { label: 'Nova Notícia',   href: '/admin/news/new',       icon: Plus },
    { label: 'Moderar',        href: '/admin/artists/moderation', icon: RefreshCw },
    { label: 'Configurações',  href: '/admin/settings',       icon: Settings },
  ]

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-4">

        {/* Greeting */}
        <p className="text-zinc-400 text-sm -mt-4">
          Olá, <span className="text-white font-semibold">{session.user.name}</span>
        </p>

        {/* Urgente — só mostra se houver itens */}
        {urgentItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {urgentItems.map(item => (
              <Link key={item.label} href={item.href}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/30 hover:bg-red-500/10 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <item.icon className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <span className="text-sm font-bold text-red-300">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black text-red-400">{item.count}</span>
                  <ChevronRight className="w-4 h-4 text-red-500/60 group-hover:text-red-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Stats — 2 cols no mobile, 3 no tablet, 6 no desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 lg:p-4 hover:border-zinc-700 transition-colors group flex flex-col items-start gap-1">
              <stat.icon className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              <div className="flex items-center gap-1.5 mt-1">
                <p className="text-xl font-black text-white">{stat.value.toLocaleString('pt-BR')}</p>
                {stat.new > 0 && (
                  <span className="text-[9px] font-black text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">
                    +{stat.new}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 font-medium">{stat.label}</p>
              {stat.subtitle && (
                <p className="text-[10px] text-zinc-700 flex items-center gap-1">
                  <UserPlus className="w-3 h-3" />{stat.subtitle}
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* Quick Actions — 2 cols no mobile, 4 no tablet+ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickActions.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 sm:flex-col sm:items-center p-3 sm:p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors sm:text-center group">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors flex-shrink-0">
                <Icon className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs sm:text-[10px] text-zinc-400 font-medium leading-tight group-hover:text-white transition-colors">{label}</span>
            </Link>
          ))}
        </div>

        {/* Atenção — shown first on mobile (actionable), alongside activity on desktop */}
        {attentionItems.length > 0 && (
          <div className="lg:hidden bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <h2 className="text-xs font-black text-white uppercase tracking-wider">Atenção</h2>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {attentionItems.map((item) => (
                <Link key={item.label} href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all hover:opacity-80 ${severityColors[item.severity as keyof typeof severityColors]}`}>
                  <div className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-black">{item.count}</span>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Activity + Attention side-by-side on desktop */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Atividade Recente */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-zinc-500" />
              <h2 className="text-xs font-black text-white uppercase tracking-wider">Atividade Recente</h2>
            </div>
            <div className="space-y-0.5">
              {activityEvents.length > 0 ? activityEvents.map((event, i) => (
                <Link key={i} href={event.href}
                  className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-zinc-800/50 transition-colors group">
                  {/* colored dot */}
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colorMap[event.color]?.dot ?? 'bg-zinc-500'}`} />
                  {/* type label — hidden on very small, shown from sm */}
                  <span className={`hidden sm:inline text-[9px] font-black uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${colorMap[event.color]?.badge ?? ''}`}>
                    {event.type}
                  </span>
                  <span className="text-xs text-zinc-300 truncate flex-1 min-w-0 group-hover:text-white transition-colors">
                    {event.label}
                  </span>
                  <span className="text-[10px] text-zinc-600 flex-shrink-0 tabular-nums">{timeAgo(event.time)}</span>
                </Link>
              )) : (
                <p className="text-center text-zinc-600 py-6 text-sm">Nenhuma atividade recente</p>
              )}
            </div>
          </div>

          {/* Atenção — desktop only (mobile version shown above) */}
          <div className="hidden lg:block bg-zinc-900 border border-zinc-800 rounded-xl p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Atenção</h2>
            </div>
            {attentionItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-400 text-lg">✓</span>
                </div>
                <p className="text-sm font-bold text-green-400">Tudo em ordem!</p>
                <p className="text-xs text-zinc-600 mt-1">Nenhum conteúdo incompleto</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attentionItems.map((item) => (
                  <Link key={item.label} href={item.href}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:opacity-80 ${severityColors[item.severity as keyof typeof severityColors]}`}>
                    <div className="flex items-center gap-2">
                      <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </div>
                    <span className="text-sm font-black">{item.count}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
