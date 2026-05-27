import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Activity, ArrowRight, Bot, ClipboardList, Flag, Inbox,
  Languages, MessageSquare, Newspaper, RefreshCw, Sparkles,
} from 'lucide-react'
import { AdminBadge, AdminLayout, AdminLinkButton } from '@/components/admin'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function dateTime(date: Date) {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function QueueCard({
  title,
  count,
  description,
  href,
  icon: Icon,
  urgent = false,
}: {
  title: string
  count: number
  description: string
  href: string
  icon: React.ElementType
  urgent?: boolean
}) {
  const state = count === 0
    ? 'border-border bg-surface text-muted'
    : urgent
      ? 'border-red-500/25 bg-red-500/5 text-red-500'
      : 'border-amber-500/25 bg-amber-500/5 text-amber-500'

  return (
    <Link href={href} className={`group rounded-xl border p-4 transition-colors hover:bg-surface-hover ${state}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={15} />
          <p className="text-xs font-bold text-foreground">{title}</p>
        </div>
        <ArrowRight size={13} className="text-muted group-hover:text-accent transition-colors" />
      </div>
      <p className="text-3xl font-black tabular-nums mt-3">{count.toLocaleString('pt-BR')}</p>
      <p className="text-[11px] text-muted mt-1">{description}</p>
    </Link>
  )
}

export default async function AdminInboxPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/admin/inbox')
  if (session.user.role?.toLowerCase() !== 'admin') redirect('/dashboard')

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const now = new Date()
  const [
    pendingReports,
    recentReports,
    flaggedComments,
    recentComments,
    publishingQueue,
    recentPublishingQueue,
    translationDrafts,
    translationFailures,
    productionTranslationsPending,
    artistsIncomplete,
    groupsIncomplete,
    productionsIncomplete,
    newsIncomplete,
    systemErrors,
    recentSystemErrors,
    aiFailures,
    recentAiFailures,
    activeAutomations,
  ] = await Promise.all([
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.report.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, entityType: true, entityName: true, category: true, createdAt: true },
    }),
    prisma.comment.count({ where: { status: 'FLAGGED' } }),
    prisma.comment.findMany({
      where: { status: 'FLAGGED' },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: {
        id: true,
        content: true,
        createdAt: true,
        news: { select: { title: true } },
      },
    }),
    prisma.news.count({ where: { status: { in: ['draft', 'ready'] }, isHidden: false } }),
    prisma.news.findMany({
      where: { status: { in: ['draft', 'ready'] }, isHidden: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, status: true, source: true, createdAt: true },
    }),
    prisma.contentTranslation.count({ where: { locale: 'pt-BR', status: 'draft' } }),
    prisma.production.count({ where: { isHidden: false, translationStatus: 'failed' } }),
    prisma.production.count({
      where: { isHidden: false, synopsis: { not: null }, translationStatus: 'pending' },
    }),
    prisma.artist.count({
      where: {
        isHidden: false,
        flaggedAsNonKorean: false,
        OR: [{ bio: null }, { analiseEditorial: null }, { curiosidades: { isEmpty: true } }],
      },
    }),
    prisma.musicalGroup.count({ where: { isHidden: false, bio: null } }),
    prisma.production.count({
      where: { isHidden: false, flaggedAsNonKorean: false, editorialReview: null },
    }),
    prisma.news.count({
      where: {
        isHidden: false,
        status: 'published',
        OR: [{ editorialNote: null }, { blogPostGeneratedAt: null }],
      },
    }),
    prisma.systemEvent.count({ where: { level: 'ERROR', createdAt: { gte: since24h } } }),
    prisma.systemEvent.findMany({
      where: { level: 'ERROR', createdAt: { gte: since24h } },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, source: true, message: true, createdAt: true },
    }),
    prisma.aiUsageLog.count({
      where: { status: { in: ['error', 'circuit_open'] }, createdAt: { gte: since24h } },
    }),
    prisma.aiUsageLog.findMany({
      where: { status: { in: ['error', 'circuit_open'] }, createdAt: { gte: since24h } },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, feature: true, provider: true, status: true, errorMsg: true, createdAt: true },
    }),
    prisma.cronLock.findMany({
      where: { expiresAt: { gt: now } },
      orderBy: { lockedAt: 'desc' },
      select: { id: true, lockedAt: true },
    }),
  ])

  const moderationTotal = pendingReports + flaggedComments
  const translationTotal = translationDrafts + translationFailures + productionTranslationsPending
  const enrichmentTotal = artistsIncomplete + groupsIncomplete + productionsIncomplete + newsIncomplete
  const operationalTotal = systemErrors + aiFailures

  return (
    <AdminLayout title="Caixa de trabalho" hideTitle>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-accent">Prioridades do administrador</p>
            <h1 className="text-2xl lg:text-3xl font-black text-foreground mt-1">Caixa de trabalho</h1>
            <p className="text-sm text-muted mt-1">Veja decisões humanas, processamento em lote e falhas de automação que exigem investigação.</p>
          </div>
          <div className="flex gap-2">
            <AdminLinkButton href="/admin/pipeline" size="sm">
              <Newspaper size={13} /> Pipeline
            </AdminLinkButton>
            <AdminLinkButton href="/admin/cron" size="sm">
              <Sparkles size={13} /> Automações
            </AdminLinkButton>
            <AdminLinkButton href="/admin/processes" size="sm">
              <ClipboardList size={13} /> Processos
            </AdminLinkButton>
          </div>
        </div>

        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Resumo das filas</p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
            <QueueCard title="Atenção humana" count={moderationTotal} description="Reportes e comentários sinalizados" href="/admin/inbox#moderacao" icon={Inbox} urgent />
            <QueueCard title="Publicar" count={publishingQueue} description="Notícias em rascunho ou prontas" href="/admin/pipeline?tab=news" icon={Newspaper} />
            <QueueCard title="Traduções" count={translationTotal} description="Pendentes, rascunhos ou falhas" href="/admin/translations" icon={Languages} />
            <QueueCard title="Completar conteúdo" count={enrichmentTotal} description="Entidades sem conteúdo editorial" href="/admin/enrichment" icon={Sparkles} />
            <QueueCard title="Incidentes" count={operationalTotal} description="Erros de sistema ou IA em 24h" href="/admin/inbox#operacao" icon={Activity} urgent />
          </div>
        </section>

        <section id="moderacao" className="grid lg:grid-cols-2 gap-4 scroll-mt-16">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Flag size={14} className="text-red-500" />
                <h2 className="text-sm font-bold text-foreground">Reportes pendentes</h2>
                <AdminBadge variant={pendingReports > 0 ? 'error' : 'neutral'} shape="pill">{pendingReports}</AdminBadge>
              </div>
              <Link href="/admin/reports?status=PENDING" className="text-xs text-muted hover:text-accent">Tratar fila</Link>
            </div>
            {recentReports.length > 0 ? (
              <div className="space-y-2">
                {recentReports.map(report => (
                  <Link key={report.id} href="/admin/reports?status=PENDING" className="block rounded-lg border border-border p-3 hover:border-accent/30 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">{report.entityName}</p>
                      <span className="text-[10px] text-muted shrink-0">{dateTime(report.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-muted mt-1 capitalize">{report.entityType} · {report.category.replaceAll('_', ' ')}</p>
                  </Link>
                ))}
              </div>
            ) : <p className="text-xs text-muted py-5 text-center">Nenhum reporte aguardando análise.</p>}
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-red-500" />
                <h2 className="text-sm font-bold text-foreground">Comentários sinalizados</h2>
                <AdminBadge variant={flaggedComments > 0 ? 'error' : 'neutral'} shape="pill">{flaggedComments}</AdminBadge>
              </div>
              <Link href="/admin/comments?status=FLAGGED" className="text-xs text-muted hover:text-accent">Moderar</Link>
            </div>
            {recentComments.length > 0 ? (
              <div className="space-y-2">
                {recentComments.map(comment => (
                  <Link key={comment.id} href="/admin/comments?status=FLAGGED" className="block rounded-lg border border-border p-3 hover:border-accent/30 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">{comment.news.title}</p>
                      <span className="text-[10px] text-muted shrink-0">{dateTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-muted mt-1 line-clamp-2">{comment.content}</p>
                  </Link>
                ))}
              </div>
            ) : <p className="text-xs text-muted py-5 text-center">Nenhum comentário requer moderação.</p>}
          </div>
        </section>

        <section id="operacao" className="grid lg:grid-cols-[1fr_1fr_260px] gap-4 scroll-mt-16">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Activity size={14} className={systemErrors > 0 ? 'text-red-500' : 'text-muted'} />
                <h2 className="text-sm font-bold text-foreground">Erros de sistema em 24h</h2>
                <AdminBadge variant={systemErrors > 0 ? 'error' : 'neutral'} shape="pill">{systemErrors}</AdminBadge>
              </div>
              <Link href="/admin/activity?tab=system&level=ERROR&days=1" className="text-xs text-muted hover:text-accent">Investigar</Link>
            </div>
            {recentSystemErrors.length > 0 ? (
              <div className="space-y-2">
                {recentSystemErrors.map(event => (
                  <Link key={event.id} href="/admin/activity?tab=system&level=ERROR&days=1" className="block rounded-lg border border-border p-3 hover:border-accent/30 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">{event.source}</p>
                      <span className="text-[10px] text-muted shrink-0">{dateTime(event.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-muted mt-1 line-clamp-2">{event.message}</p>
                  </Link>
                ))}
              </div>
            ) : <p className="text-xs text-muted py-5 text-center">Nenhum erro de sistema registrado nas últimas 24h.</p>}
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Bot size={14} className={aiFailures > 0 ? 'text-red-500' : 'text-muted'} />
                <h2 className="text-sm font-bold text-foreground">Falhas de IA em 24h</h2>
                <AdminBadge variant={aiFailures > 0 ? 'error' : 'neutral'} shape="pill">{aiFailures}</AdminBadge>
              </div>
              <Link href="/admin/ai" className="text-xs text-muted hover:text-accent">Abrir IA</Link>
            </div>
            {recentAiFailures.length > 0 ? (
              <div className="space-y-2">
                {recentAiFailures.map(event => (
                  <Link key={event.id} href="/admin/ai" className="block rounded-lg border border-border p-3 hover:border-accent/30 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">{event.feature} · {event.provider}</p>
                      <span className="text-[10px] text-muted shrink-0">{dateTime(event.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-muted mt-1 line-clamp-2">{event.errorMsg ?? event.status}</p>
                  </Link>
                ))}
              </div>
            ) : <p className="text-xs text-muted py-5 text-center">Nenhuma falha de IA registrada nas últimas 24h.</p>}
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={14} className={activeAutomations.length > 0 ? 'text-blue-500' : 'text-muted'} />
              <h2 className="text-sm font-bold text-foreground">Executando agora</h2>
            </div>
            <p className={`text-3xl font-black tabular-nums ${activeAutomations.length > 0 ? 'text-blue-500' : 'text-muted'}`}>{activeAutomations.length}</p>
            <p className="text-[11px] text-muted mt-1">jobs com lock ativo</p>
            {activeAutomations.length > 0 && (
              <div className="space-y-1.5 mt-4">
                {activeAutomations.slice(0, 3).map(job => (
                  <p key={job.id} className="text-[11px] text-muted truncate">
                    {job.id.replace('cron-', '')} · {dateTime(job.lockedAt)}
                  </p>
                ))}
              </div>
            )}
            <AdminLinkButton href="/admin/cron" size="sm" className="mt-4">
              <RefreshCw size={12} /> Central de automação
            </AdminLinkButton>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground">Próximas publicações</h2>
              <Link href="/admin/pipeline?tab=news" className="text-xs text-muted hover:text-accent">Abrir pipeline</Link>
            </div>
            {recentPublishingQueue.length > 0 ? recentPublishingQueue.map(news => (
              <Link key={news.id} href={`/admin/news/${news.id}`} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 group">
                <AdminBadge variant={news.status === 'ready' ? 'pending' : 'draft'}>{news.status === 'ready' ? 'Pronta' : 'Rascunho'}</AdminBadge>
                <span className="min-w-0 flex-1 text-xs text-foreground truncate group-hover:text-accent">{news.title}</span>
                <span className="text-[10px] text-muted shrink-0">{news.source ?? dateTime(news.createdAt)}</span>
              </Link>
            )) : <p className="text-xs text-muted py-5 text-center">Nenhuma notícia aguardando publicação.</p>}
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <h2 className="text-sm font-bold text-foreground mb-3">Revisão editorial</h2>
            {[
              { label: 'Traduções em rascunho para aprovar', value: translationDrafts, href: '/admin/translations?status=draft' },
              { label: 'Produções sem tradução', value: productionTranslationsPending, href: '/admin/translations?tab=production&status=pending' },
              { label: 'Falhas de tradução', value: translationFailures, href: '/admin/translations?tab=production' },
            ].map(item => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between py-2.5 border-b border-border last:border-0 group">
                <span className="text-xs text-muted group-hover:text-foreground">{item.label}</span>
                <span className={`text-sm font-bold tabular-nums ${item.value > 0 ? 'text-amber-500' : 'text-muted'}`}>{item.value}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-surface border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Algo parece desnecessário ou duplicado?</h2>
            <p className="text-[11px] text-muted mt-1">A revisão de páginas e oportunidades de automação agora fica em uma área dedicada.</p>
          </div>
          <AdminLinkButton href="/admin/processes" variant="primary" size="sm">
            <ClipboardList size={13} /> Abrir processos e melhorias
          </AdminLinkButton>
        </section>
      </div>
    </AdminLayout>
  )
}
