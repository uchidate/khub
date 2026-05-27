import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Activity, BarChart3, Bot, Clock, ClipboardList, Inbox,
  Settings, Languages, Sparkles, Workflow,
  ArrowRight, ChevronRight, FileText,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { LiveUrgentPanel, AiWidget } from '@/components/admin/DashboardLive'
import { LastVisitBanner } from '@/components/admin/LastVisitBanner'
import { AdminRefreshButton } from '@/components/admin/AdminRefreshButton'
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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
    newUsers, newArtists, newProductions, newNews, newGroups,
    newUsers7d,
    // Pipeline de notícias (hoje)
    newsImportedToday, newsPublishedToday, newsQueueToday, newsHiddenToday,
    // Traduções pendentes
    pendingProductionTranslations,
    // Enriquecimento pendente
    artistsWithoutBio, artistsWithoutImage, groupsWithoutBio,
    // Alertas urgentes
    pendingReports, flaggedComments,
    systemErrors24h, aiFailures24h,
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
    prisma.musicalGroup.count({ where: { createdAt: { gte: ago30 } } }),
    prisma.user.count({ where: { createdAt: { gte: ago7 } } }),
    // Pipeline notícias hoje
    prisma.news.count({ where: { createdAt: { gte: today } } }),
    prisma.news.count({ where: { publishedAt: { gte: today }, isHidden: false } }),
    prisma.news.count({ where: { createdAt: { gte: today }, status: { in: ['draft', 'ready'] }, isHidden: false } }),
    prisma.news.count({ where: { createdAt: { gte: today }, isHidden: true } }),
    // Traduções
    prisma.production.count({ where: { isHidden: false, synopsis: { not: null }, translationStatus: 'pending' } }),
    // Enriquecimento
    prisma.artist.count({ where: { bio: null, isHidden: false } }),
    prisma.artist.count({ where: { primaryImageUrl: null, isHidden: false } }),
    prisma.musicalGroup.count({ where: { bio: null, isHidden: false } }),
    // Alertas
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.comment.count({ where: { status: 'FLAGGED' } }),
    prisma.systemEvent.count({ where: { level: 'ERROR', createdAt: { gte: new Date(Date.now() - 86400_000) } } }),
    prisma.aiUsageLog.count({
      where: { status: { in: ['error', 'circuit_open'] }, createdAt: { gte: new Date(Date.now() - 86400_000) } },
    }),
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
  const [usersSparkRaw, artistsSparkRaw, productionsSparkRaw, newsSparkRaw, groupsSparkRaw] = await Promise.all([
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "User"       WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "Artist"     WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "Production" WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "News"       WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "MusicalGroup" WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
  ])
  const sparks = {
    users:       toSparkArray(usersSparkRaw),
    artists:     toSparkArray(artistsSparkRaw),
    productions: toSparkArray(productionsSparkRaw),
    news:        toSparkArray(newsSparkRaw),
    groups:      toSparkArray(groupsSparkRaw),
  }

  const pendingArtistTranslations = Math.max(0, artistsWithBio - artistBioTranslated)
  const totalPendingTranslations  = pendingArtistTranslations + pendingProductionTranslations
  const totalPendingEnrichment    = artistsWithoutBio + artistsWithoutImage + groupsWithoutBio
  const operationalIncidents      = systemErrors24h + aiFailures24h

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

  // Filas que demandam execução; moderação ao vivo já aparece no painel urgente.
  const actionCards = [
    totalPendingTranslations > 0 && {
      label: 'Sem tradução PT-BR', count: totalPendingTranslations,
      href: '/admin/translations',
      icon: Languages, color: 'yellow' as const,
      desc: 'Conteúdo publicado',
    },
    totalPendingEnrichment > 0 && {
      label: 'Aguardando enriquecimento', count: totalPendingEnrichment,
      href: '/admin/enrichment',
      icon: Sparkles, color: 'yellow' as const,
      desc: 'Artistas/grupos incompletos',
    },
    operationalIncidents > 0 && {
      label: 'Incidentes operacionais', count: operationalIncidents,
      href: '/admin/inbox#operacao',
      icon: Activity, color: 'red' as const,
      desc: 'Sistema ou IA nas últimas 24h',
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
    { key: 'groups' as const, label: 'Grupos', value: totalGroups, new: newGroups, href: '/admin/groups', sub: null, spark: sparks.groups, sparkColor: '#a855f7' },
  ]

  const workspaces = [
    {
      label: 'Publicar conteúdo',
      description: 'Notícias, blog e curadoria editorial',
      href: '/admin/pipeline',
      icon: Workflow,
      metric: newsQueueToday > 0 ? `${newsQueueToday} em fila hoje` : 'Fila de hoje limpa',
      tone: newsQueueToday > 0 ? 'text-amber-500' : 'text-emerald-500',
    },
    {
      label: 'Completar catálogo',
      description: 'Bios, imagens e perfis incompletos',
      href: '/admin/enrichment',
      icon: Sparkles,
      metric: `${totalPendingEnrichment.toLocaleString('pt-BR')} pendências`,
      tone: totalPendingEnrichment > 0 ? 'text-amber-500' : 'text-emerald-500',
    },
    {
      label: 'Automações',
      description: 'Jobs agendados e execução de IA',
      href: '/admin/cron',
      icon: Clock,
      metric: operationalIncidents > 0 ? `${operationalIncidents} incidentes em 24h` : 'Sem incidentes em 24h',
      tone: operationalIncidents > 0 ? 'text-red-500' : 'text-emerald-500',
    },
    {
      label: 'Resultados',
      description: 'Audiência e desempenho do conteúdo',
      href: '/admin/analytics',
      icon: BarChart3,
      metric: 'Abrir analytics',
      tone: 'text-muted',
    },
  ]

  // Greeting
  const hour   = now.getHours()
  const greet  = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const name   = session.user.name?.split(' ')[0] ?? 'Admin'
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <AdminLayout title="Dashboard" hideTitle>
      <div className="space-y-5">

        {/* Greeting */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-accent">{greet}, {name}</p>
            <h1 className="text-2xl lg:text-3xl font-black text-foreground mt-1">Central de operação</h1>
            <p className="text-sm text-muted capitalize mt-1">{dateStr} · atualizado agora</p>
            <LastVisitBanner />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <AdminRefreshButton />
            <Link
              href="/admin/inbox"
              className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground border border-border hover:border-border bg-surface hover:bg-surface-hover px-3 py-1.5 rounded-lg transition-all"
            >
              <Inbox size={13} className="text-accent" />
              Caixa de trabalho
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Urgente live */}
        <LiveUrgentPanel initial={{ reports: pendingReports, comments: flaggedComments }} />

        {/* Filas de execução (moderação urgente fica acima, sem duplicidade) */}
        {actionCards.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Filas de trabalho</p>
            <div className="grid gap-2 sm:grid-cols-2">
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
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Filas de trabalho</p>
              <p className="text-sm text-foreground font-semibold mt-1">Nenhuma pendência editorial em fila</p>
              <p className="text-[11px] text-muted mt-0.5">Traduções e enriquecimentos estão em dia.</p>
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
              { label: 'Ocultas',    count: newsHiddenToday,    color: 'text-muted',       dot: 'bg-red-500/50' },
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

        {/* Centros de trabalho */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Áreas de trabalho</p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-2">
            {workspaces.map(({ label, description, href, icon: Icon, metric, tone }) => (
              <Link
                key={href}
                href={href}
                className="group bg-surface border border-border rounded-xl p-4 hover:border-accent/40 hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
                    <Icon size={16} className="text-accent" />
                  </div>
                  <ArrowRight size={13} className="text-muted group-hover:text-accent transition-colors" />
                </div>
                <p className="text-sm font-bold text-foreground">{label}</p>
                <p className="text-[11px] text-muted mt-0.5 min-h-[32px]">{description}</p>
                <p className={`text-[11px] font-semibold mt-2 ${tone}`}>{metric}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Base cadastrada · novos nos últimos 30 dias</p>
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
                { href: '/admin/inbox',       label: 'Caixa de trabalho',   icon: Inbox,      badge: pendingReports + flaggedComments || null },
                { href: '/admin/pipeline',    label: 'Pipeline de conteúdo', icon: Workflow,   badge: null },
                { href: '/admin/translations',label: 'Traduções pendentes',  icon: Languages,  badge: totalPendingTranslations > 0 ? totalPendingTranslations : null },
                { href: '/admin/enrichment',  label: 'Curadoria Gemini',     icon: Sparkles,   badge: null },
                { href: '/admin/processes',   label: 'Processos e melhorias', icon: ClipboardList, badge: null },
                { href: '/admin/blog',        label: 'Blog posts',           icon: FileText,   badge: null },
                { href: '/admin/ai',          label: 'Dashboard de IA',      icon: Bot,           badge: null },
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
