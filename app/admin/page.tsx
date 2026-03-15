import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Activity, Film, Newspaper, Mic2, AlertTriangle,
  Settings, Flag, MessageSquare, Languages, Sparkles, Workflow,
  ArrowRight, TrendingUp, ChevronRight, FileText,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { LiveUrgentPanel, AiWidget } from '@/components/admin/DashboardLive'
import prisma from '@/lib/prisma'

export default async function AdminPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/admin')
  if (session.user.role?.toLowerCase() !== 'admin') redirect('/dashboard')

  const now       = new Date()
  const today     = new Date(now); today.setHours(0, 0, 0, 0)
  const ago30     = new Date(Date.now() - 30 * 86400_000)
  const ago7      = new Date(Date.now() - 7  * 86400_000)

  const [
    totalUsers, totalArtists, totalProductions, totalNews, totalGroups,
    newUsers, newArtists, newProductions, newNews,
    newUsers7d,
    // Pipeline de notícias (hoje)
    newsImportedToday, newsPublishedToday, newsQueueToday, newsHidden,
    // Traduções pendentes
    _artistBioTranslationsDup, pendingProductionTranslations,
    // Enriquecimento pendente
    artistsWithoutBio, artistsWithoutImage, groupsWithoutBio,
    // Alertas urgentes
    pendingReports, flaggedComments,
    // Atividade recente
    recentUsers, recentNews, recentArtists, recentProductions,
    // Bio traduzida (para calcular pendentes)
    artistsWithBio, artistBioTranslated,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.artist.count(),
    prisma.production.count(),
    prisma.news.count(),
    prisma.musicalGroup.count(),
    prisma.user.count({ where: { createdAt: { gte: ago30 } } }),
    prisma.artist.count({ where: { createdAt: { gte: ago30 } } }),
    prisma.production.count({ where: { createdAt: { gte: ago30 } } }),
    prisma.news.count({ where: { createdAt: { gte: ago30 } } }),
    prisma.user.count({ where: { createdAt: { gte: ago7 } } }),
    // Pipeline notícias hoje
    prisma.news.count({ where: { createdAt: { gte: today } } }),
    prisma.news.count({ where: { publishedAt: { gte: today }, isHidden: false } }),
    prisma.news.count({ where: { createdAt: { gte: today }, isHidden: false, publishedAt: { not: { gt: new Date(0) } } } }),
    prisma.news.count({ where: { isHidden: true } }),
    // Traduções
    prisma.contentTranslation.count({ where: { entityType: 'artist', field: 'bio', locale: 'pt-BR' } }),
    prisma.production.count({ where: { isHidden: false, synopsis: { not: null }, translationStatus: 'pending' } }),
    // Enriquecimento
    prisma.artist.count({ where: { bio: null, isHidden: false } }),
    prisma.artist.count({ where: { primaryImageUrl: null, isHidden: false } }),
    prisma.musicalGroup.count({ where: { bio: null, isHidden: false } }),
    // Alertas
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.comment.count({ where: { status: 'FLAGGED' } }),
    // Atividade
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 4, select: { email: true, name: true, createdAt: true } }),
    prisma.news.findMany({ orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, title: true, createdAt: true } }),
    prisma.artist.findMany({ orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, nameRomanized: true, createdAt: true } }),
    prisma.production.findMany({ orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, titlePt: true, createdAt: true } }),
    // Para calcular pendentes
    prisma.artist.count({ where: { bio: { not: null }, isHidden: false } }),
    prisma.contentTranslation.count({ where: { entityType: 'artist', field: 'bio', locale: 'pt-BR' } }),
  ])

  const pendingArtistTranslations = Math.max(0, artistsWithBio - artistBioTranslated)
  const totalPendingTranslations  = pendingArtistTranslations + pendingProductionTranslations
  const totalPendingEnrichment    = artistsWithoutBio + artistsWithoutImage + groupsWithoutBio

  function timeAgo(date: Date | string): string {
    const d    = new Date(date)
    const diff = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diff < 60)    return `${diff}s`
    if (diff < 3600)  return `${Math.floor(diff / 60)}min`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
  }

  type ActivityEvent = { type: string; label: string; href: string; time: Date; color: string }
  const activityEvents: ActivityEvent[] = [
    ...recentUsers.map(u => ({ type: 'Usuário',  label: u.name || u.email || 'Sem nome', href: '/admin/users',              time: u.createdAt, color: 'purple' })),
    ...recentNews.map(n  => ({ type: 'Notícia',  label: n.title,                         href: `/admin/news/${n.id}`,        time: n.createdAt, color: 'pink'   })),
    ...recentArtists.map(a => ({ type: 'Artista', label: a.nameRomanized,                href: `/admin/artists/${a.id}`,     time: a.createdAt, color: 'cyan'   })),
    ...recentProductions.map(p => ({ type: 'Produção', label: p.titlePt,                 href: `/admin/productions/${p.id}`, time: p.createdAt, color: 'yellow' })),
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 8)

  const colorMap: Record<string, { dot: string; badge: string }> = {
    purple: { dot: 'bg-blue-500', badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    pink:   { dot: 'bg-pink-500',   badge: 'text-pink-400 bg-pink-500/10 border-pink-500/30'       },
    cyan:   { dot: 'bg-cyan-500',   badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'       },
    yellow: { dot: 'bg-yellow-500', badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  }

  // Cards de atenção agora (apenas com count > 0)
  const actionCards = [
    pendingReports > 0 && {
      label: 'Reportes pendentes', count: pendingReports,
      href: '/admin/reports?status=PENDING',
      icon: Flag, color: 'red' as const,
      desc: 'Precisam de revisão',
    },
    flaggedComments > 0 && {
      label: 'Comentários flagados', count: flaggedComments,
      href: '/admin/comments?status=FLAGGED',
      icon: MessageSquare, color: 'red' as const,
      desc: 'Aguardando moderação',
    },
    totalPendingTranslations > 5 && {
      label: 'Sem tradução PT-BR', count: totalPendingTranslations,
      href: '/admin/translations',
      icon: Languages, color: 'yellow' as const,
      desc: 'Conteúdo publicado',
    },
    totalPendingEnrichment > 10 && {
      label: 'Aguardando enriquecimento', count: totalPendingEnrichment,
      href: '/admin/enrichment',
      icon: Sparkles, color: 'yellow' as const,
      desc: 'Artistas/grupos incompletos',
    },
  ].filter(Boolean) as Array<{
    label: string; count: number; href: string;
    icon: React.ElementType; color: 'red' | 'yellow'; desc: string
  }>

  const colorVariants = {
    red:    'bg-red-500/8 border-red-500/25 text-red-300 hover:border-red-500/50',
    yellow: 'bg-yellow-500/8 border-yellow-500/25 text-yellow-300 hover:border-yellow-500/50',
  }
  const iconColorVariants = {
    red:    'text-red-400',
    yellow: 'text-yellow-400',
  }

  const stats = [
    { label: 'Usuários',  value: totalUsers,       new: newUsers,       icon: Users,    href: '/admin/users',       sub: `+${newUsers7d} esta semana` },
    { label: 'Artistas',  value: totalArtists,     new: newArtists,     icon: Mic2,     href: '/admin/artists',     sub: null },
    { label: 'Produções', value: totalProductions, new: newProductions,  icon: Film,    href: '/admin/productions', sub: null },
    { label: 'Notícias',  value: totalNews,        new: newNews,        icon: Newspaper, href: '/admin/news',       sub: null },
    { label: 'Grupos',    value: totalGroups,      new: 0,              icon: Users,    href: '/admin/groups',      sub: null },
  ]

  // Pipeline steps com % de progresso visual
  const pipelineSteps = [
    { label: 'Importadas', count: newsImportedToday, color: 'bg-zinc-600' },
    { label: 'Em fila',    count: newsQueueToday,    color: 'bg-yellow-500' },
    { label: 'Publicadas', count: newsPublishedToday, color: 'bg-emerald-500' },
  ]

  // Greeting
  const hour   = now.getHours()
  const greet  = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const name   = session.user.name?.split(' ')[0] ?? 'Admin'
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-5">

        {/* Greeting */}
        <div className="flex items-center justify-between -mt-2">
          <div>
            <h2 className="text-lg font-black text-white">
              {greet}, <span className="text-blue-300">{name}</span>
            </h2>
            <p className="text-xs text-zinc-600 capitalize">{dateStr}</p>
          </div>
          <Link
            href="/admin/pipeline"
            className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-all"
          >
            <Workflow size={13} className="text-blue-400" />
            Ver pipeline
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* Urgente live */}
        <LiveUrgentPanel initial={{ reports: pendingReports, comments: flaggedComments }} />

        {/* Atenção agora */}
        {actionCards.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Atenção agora</p>
            <div className={`grid gap-2 ${actionCards.length === 1 ? 'grid-cols-1' : actionCards.length === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
              {actionCards.map(card => (
                <Link
                  key={card.label}
                  href={card.href}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${colorVariants[card.color]}`}
                >
                  <div className={`flex-shrink-0 ${iconColorVariants[card.color]}`}>
                    <card.icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black tabular-nums">{card.count}</p>
                    <p className="text-[11px] font-medium truncate opacity-80">{card.label}</p>
                  </div>
                  <ChevronRight size={14} className="opacity-40 group-hover:opacity-80 flex-shrink-0 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pipeline hoje */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Pipeline hoje</p>
            <Link href="/admin/pipeline" className="text-[10px] text-zinc-500 hover:text-blue-400 transition-colors flex items-center gap-1">
              Ver completo <ArrowRight size={10} />
            </Link>
          </div>
          <div className="flex items-center gap-0 relative">
            {pipelineSteps.map((step, i) => {
              const isLast = i === pipelineSteps.length - 1
              return (
                <div key={step.label} className="flex items-center flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${step.color}`} />
                      <span className="text-[10px] text-zinc-500 font-medium truncate">{step.label}</span>
                    </div>
                    <p className="text-xl font-black text-white tabular-nums pl-3.5">{step.count}</p>
                  </div>
                  {!isLast && <ArrowRight size={12} className="text-zinc-700 flex-shrink-0 mx-2" />}
                </div>
              )
            })}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-zinc-700" />
                <span className="text-[10px] text-zinc-500 font-medium">Ocultas</span>
              </div>
              <p className="text-xl font-black text-zinc-600 tabular-nums pl-3.5">{newsHidden}</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Totais (30 dias)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {stats.map(stat => (
              <Link
                key={stat.label}
                href={stat.href}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 hover:border-zinc-700 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.1)] transition-all group flex flex-col gap-1"
              >
                <stat.icon className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                <div className="flex items-end gap-1.5 mt-0.5">
                  <p className="text-xl font-black text-white tabular-nums">{stat.value.toLocaleString('pt-BR')}</p>
                  {stat.new > 0 && (
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full mb-0.5">
                      +{stat.new}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">{stat.label}</p>
                {stat.sub && (
                  <p className="text-[9px] text-zinc-700 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />{stat.sub}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Atividade + acesso rápido */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Atividade recente */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3.5 h-3.5 text-zinc-600" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Atividade recente</p>
            </div>
            <div className="space-y-0.5">
              {activityEvents.length > 0 ? activityEvents.map((event, i) => (
                <Link
                  key={i}
                  href={event.href}
                  className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colorMap[event.color]?.dot}`} />
                  <span className={`hidden sm:inline text-[9px] font-black uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${colorMap[event.color]?.badge}`}>
                    {event.type}
                  </span>
                  <span className="text-xs text-zinc-400 truncate flex-1 group-hover:text-zinc-200 transition-colors">
                    {event.label}
                  </span>
                  <span className="text-[10px] text-zinc-700 flex-shrink-0 tabular-nums">{timeAgo(event.time)}</span>
                </Link>
              )) : (
                <p className="text-center text-zinc-700 py-6 text-xs">Nenhuma atividade recente</p>
              )}
            </div>
          </div>

          {/* Atalhos rápidos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Acesso rápido</p>
            <div className="space-y-1">
              {[
                { href: '/admin/pipeline',    label: 'Pipeline de conteúdo', icon: Workflow,   badge: null },
                { href: '/admin/translations',label: 'Traduções pendentes',  icon: Languages,  badge: totalPendingTranslations > 0 ? totalPendingTranslations : null },
                { href: '/admin/enrichment',  label: 'Enriquecimento IA',    icon: Sparkles,   badge: null },
                { href: '/admin/blog',        label: 'Blog posts',           icon: FileText,   badge: null },
                { href: '/admin/ai',          label: 'Dashboard de IA',      icon: AlertTriangle, badge: null },
                { href: '/admin/settings',    label: 'Configurações',        icon: Settings,   badge: null },
              ].map(({ href, label, icon: Icon, badge }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all group"
                >
                  <Icon size={13} className="text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
                  <span className="flex-1 truncate">{label}</span>
                  {badge != null && badge > 0 ? (
                    <span className="text-[9px] font-black bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {badge}
                    </span>
                  ) : (
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Widget IA */}
        <AiWidget />

      </div>
    </AdminLayout>
  )
}
