import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Activity, Film, Newspaper, Music2, Building2,
  Mic2, ImageOff, UserX, AlertTriangle,
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
    // Recent activity — 5 most recent per type
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
    // Attention: missing images
    prisma.artist.count({ where: { primaryImageUrl: null } }),
    prisma.musicalGroup.count({ where: { profileImageUrl: null } }),
    prisma.news.count({ where: { imageUrl: null } }),
    // Attention: missing bio
    prisma.artist.count({ where: { bio: null } }),
    prisma.musicalGroup.count({ where: { bio: null } }),
  ])

  type ActivityEvent = { type: string; label: string; href: string; time: Date; color: string }
  const activityEvents: ActivityEvent[] = [
    ...recentUsers.map(u => ({
      type: 'Usuário', label: u.name || u.email || 'Sem nome', href: '/admin/users',
      time: u.createdAt, color: 'text-purple-400',
    })),
    ...recentNews.map(n => ({
      type: 'Notícia', label: n.title, href: `/news/${n.id}`,
      time: n.createdAt, color: 'text-pink-400',
    })),
    ...recentArtists.map(a => ({
      type: 'Artista', label: a.nameRomanized, href: `/artists/${a.id}`,
      time: a.createdAt, color: 'text-cyan-400',
    })),
    ...recentProductions.map(p => ({
      type: 'Produção', label: p.titlePt, href: `/productions/${p.id}`,
      time: p.createdAt, color: 'text-yellow-400',
    })),
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10)

  function timeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diff < 60) return `${diff}s atrás`
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
    return `${Math.floor(diff / 86400)}d atrás`
  }

  const stats = [
    { label: 'Usuários', value: totalUsers, new: newUsers, icon: Users, href: '/admin/users' },
    { label: 'Artistas', value: totalArtists, new: newArtists, icon: Mic2, href: '/admin/artists' },
    { label: 'Produções', value: totalProductions, new: newProductions, icon: Film, href: '/admin/productions' },
    { label: 'Notícias', value: totalNews, new: newNews, icon: Newspaper, href: '/admin/news' },
    { label: 'Grupos', value: totalGroups, new: newGroups, icon: Music2, href: '/admin/groups' },
    { label: 'Agências', value: totalAgencies, new: 0, icon: Building2, href: '/admin/agencies' },
  ]

  const attentionItems = [
    { label: 'Artistas sem foto', count: artistsWithoutImage, href: '/admin/artists?filter=no_photo', icon: ImageOff, severity: artistsWithoutImage > 20 ? 'high' : 'medium' },
    { label: 'Artistas sem bio', count: artistsWithoutBio, href: '/admin/artists', icon: UserX, severity: artistsWithoutBio > 30 ? 'high' : 'low' },
    { label: 'Grupos sem foto', count: groupsWithoutImage, href: '/admin/groups', icon: ImageOff, severity: groupsWithoutImage > 5 ? 'high' : 'medium' },
    { label: 'Grupos sem bio', count: groupsWithoutBio, href: '/admin/groups', icon: UserX, severity: 'low' },
    { label: 'Notícias sem imagem', count: newsWithoutImage, href: '/admin/news', icon: Newspaper, severity: newsWithoutImage > 10 ? 'medium' : 'low' },
  ].filter(i => i.count > 0)

  const severityColors = {
    high: 'border-red-500/30 bg-red-500/5 text-red-400',
    medium: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
    low: 'border-zinc-700 bg-zinc-900/50 text-zinc-400',
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        <p className="text-zinc-400 text-sm -mt-6">
          Bem-vindo, <span className="text-white font-semibold">{session.user.name}</span>
        </p>

        {/* Stats Grid — 6 clickable cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                {stat.new > 0 && (
                  <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">
                    +{stat.new}
                  </span>
                )}
              </div>
              <p className="text-2xl font-black text-white">{stat.value.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-zinc-500 mt-1 font-medium">{stat.label}</p>
              {stat.new > 0 && (
                <p className="text-[10px] text-zinc-700 mt-0.5">{stat.new} este mês</p>
              )}
            </Link>
          ))}
        </div>

        {/* Activity + Attention */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Atividade Recente */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Atividade Recente</h2>
            </div>
            <div className="space-y-1">
              {activityEvents.length > 0 ? activityEvents.map((event, i) => (
                <Link key={i} href={event.href}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-zinc-800/50 transition-colors group">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border w-16 text-center flex-shrink-0 ${
                    event.color === 'text-purple-400' ? 'border-purple-500/30 bg-purple-500/10 text-purple-400' :
                    event.color === 'text-pink-400' ? 'border-pink-500/30 bg-pink-500/10 text-pink-400' :
                    event.color === 'text-cyan-400' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' :
                    'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {event.type}
                  </span>
                  <span className="text-sm text-zinc-300 truncate flex-1 group-hover:text-white transition-colors">
                    {event.label}
                  </span>
                  <span className="text-[10px] text-zinc-600 flex-shrink-0">{timeAgo(event.time)}</span>
                </Link>
              )) : (
                <p className="text-center text-zinc-600 py-6">Nenhuma atividade recente</p>
              )}
            </div>
          </div>

          {/* Atenção Necessária */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
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
