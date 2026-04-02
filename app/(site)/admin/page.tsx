import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Activity, AlertTriangle,
  Settings, Flag, MessageSquare, Languages, Sparkles, Workflow,
  ArrowRight, ChevronRight, FileText,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { LiveUrgentPanel, AiWidget } from '@/components/admin/DashboardLive'
import { AdminRefreshButton } from '@/components/admin/AdminRefreshButton'
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid'
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
    pendingProductionTranslations,
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

  // ── Sparklines (7-day daily trend) ─────────────────────────────────────────
  type DayCount = { day: string; count: number }
  function toSparkArray(rows: DayCount[]): number[] {
    const map = new Map(rows.map(r => [r.day.slice(0, 10), r.count]))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      return map.get(d.toISOString().slice(0, 10)) ?? 0
    })
  }
  const [usersSparkRaw, artistsSparkRaw, productionsSparkRaw, newsSparkRaw] = await Promise.all([
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "User"       WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "Artist"     WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "Production" WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "News"       WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
  ])
  const sparks = {
    users:       toSparkArray(usersSparkRaw),
    artists:     toSparkArray(artistsSparkRaw),
    productions: toSparkArray(productionsSparkRaw),
    news:        toSparkArray(newsSparkRaw),
    groups:      [0, 0, 0, 0, 0, 0, 0],
  }

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
    { key: 'users' as const, label: 'Usuários', value: totalUsers, new: newUsers, href: '/admin/users', sub: `+${newUsers7d} esta semana`, spark: sparks.users, sparkColor: '#3b82f6' },
    { key: 'artists' as const, label: 'Artistas', value: totalArtists, new: newArtists, href: '/admin/artists', sub: null, spark: sparks.artists, sparkColor: '#ec4899' },
    { key: 'productions' as const, label: 'Produções', value: totalProductions, new: newProductions, href: '/admin/productions', sub: null, spark: sparks.productions, sparkColor: '#f59e0b' },
    { key: 'news' as const, label: 'Notícias', value: totalNews, new: newNews, href: '/admin/news', sub: null, spark: sparks.news, sparkColor: '#06b6d4' },
    { key: 'groups' as const, label: 'Grupos', value: totalGroups, new: 0, href: '/admin/groups', sub: null, spark: sparks.groups, sparkColor: '#a855f7' },
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
            <h2 className="text-lg font-black text-foreground">
              {greet}, <span className="text-blue-300">{name}</span>
            </h2>
            <p className="text-xs text-muted capitalize">{dateStr}</p>
            <p className="text-[10px] text-muted mt-0.5">Atualizado agora</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <AdminRefreshButton />
            <Link
              href="/admin/pipeline"
              className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground border border-border hover:border-border bg-surface hover:bg-surface-hover px-3 py-1.5 rounded-lg transition-all"
            >
              <Workflow size={13} className="text-blue-400" />
              Ver pipeline
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Urgente live */}
        <LiveUrgentPanel initial={{ reports: pendingReports, comments: flaggedComments }} />

        {/* Atenção agora */}
        {actionCards.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Atenção agora</p>
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

        {actionCards.length === 0 && (
          <div className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Atenção agora</p>
              <p className="text-sm text-foreground font-semibold mt-1">Tudo sob controle no momento</p>
              <p className="text-[11px] text-muted mt-0.5">Sem pendências urgentes de moderação, tradução ou enriquecimento.</p>
            </div>
            <Link
              href="/admin/activity"
              className="text-xs text-muted hover:text-foreground border border-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Ver atividade
            </Link>
          </div>
        )}

        {/* Pipeline hoje */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Pipeline hoje</p>
            <Link href="/admin/pipeline" className="text-[10px] text-muted hover:text-blue-400 transition-colors flex items-center gap-1">
              Ver completo <ArrowRight size={10} />
            </Link>
          </div>

          {/* Métricas em linha */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[
              { label: 'Importadas', count: newsImportedToday, color: 'text-foreground',  dot: 'bg-border' },
              { label: 'Em fila',    count: newsQueueToday,    color: 'text-yellow-400',  dot: 'bg-yellow-500' },
              { label: 'Publicadas', count: newsPublishedToday, color: 'text-emerald-400', dot: 'bg-emerald-500' },
              { label: 'Ocultas',    count: newsHidden,         color: 'text-muted',       dot: 'bg-red-500/50' },
            ].map(step => (
              <div key={step.label}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${step.dot}`} />
                  <span className="text-[9px] text-muted font-medium uppercase tracking-wide truncate">{step.label}</span>
                </div>
                <p className={`text-2xl font-black tabular-nums leading-none ${step.color}`}>{step.count}</p>
              </div>
            ))}
          </div>

          {/* Barra de progresso: publicadas / importadas */}
          {newsImportedToday > 0 && (() => {
            const pct = Math.min(100, Math.round((newsPublishedToday / newsImportedToday) * 100))
            return (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-muted">Progresso de publicação</span>
                  <span className="text-[10px] font-bold text-emerald-400">{pct}%</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })()}
        </div>

        {/* Stats grid */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Totais (30 dias)</p>
          <AdminStatsGrid stats={stats} />
        </div>

        {/* Atividade + acesso rápido */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Atividade recente */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3.5 h-3.5 text-muted" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Atividade recente</p>
            </div>
            <div className="space-y-0.5">
              {activityEvents.length > 0 ? activityEvents.map((event, i) => (
                <Link
                  key={i}
                  href={event.href}
                  className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-surface-hover transition-colors group"
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colorMap[event.color]?.dot}`} />
                  <span className={`hidden sm:inline text-[9px] font-black uppercase px-1.5 py-0.5 rounded border flex-shrink-0 ${colorMap[event.color]?.badge}`}>
                    {event.type}
                  </span>
                  <span className="text-xs text-muted truncate flex-1 group-hover:text-foreground transition-colors">
                    {event.label}
                  </span>
                  <span className="text-[10px] text-muted flex-shrink-0 tabular-nums">{timeAgo(event.time)}</span>
                </Link>
              )) : (
                <p className="text-center text-muted py-6 text-xs">Nenhuma atividade recente</p>
              )}
            </div>
          </div>

          {/* Atalhos rápidos */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Acesso rápido</p>
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
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted hover:text-foreground hover:bg-surface transition-all group"
                >
                  <Icon size={13} className="text-muted group-hover:text-muted transition-colors flex-shrink-0" />
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
