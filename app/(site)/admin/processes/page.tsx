import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Activity, ArrowRight, BarChart3, BookOpen, Bot, CheckCircle2, ClipboardList,
  Database, Eye, GitMerge, History, Languages, RefreshCw, Sparkles, Store, Wrench,
} from 'lucide-react'
import { AdminBadge, AdminLayout, AdminLinkButton } from '@/components/admin'
import {
  ADMIN_TELEMETRY_AREAS,
  ADMIN_TELEMETRY_ROUTES,
  type AdminTelemetryArea,
} from '@/lib/admin/process-telemetry'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type ProcessStatus = 'success' | 'warning' | 'review' | 'info'

type ProcessAssessment = {
  title: string
  status: string
  variant: ProcessStatus
  rationale: string
  decision: string
  icon: React.ElementType
  links: Array<{ label: string; href: string }>
  telemetryPaths?: readonly string[]
}

const assessments: ProcessAssessment[] = [
  {
    title: 'Caixa de trabalho e moderação',
    status: 'Manter',
    variant: 'success',
    rationale: 'Reportes e comentários são decisões humanas do dia a dia e agora partem de uma fila única.',
    decision: 'Manter as telas especializadas como sub-processos da Caixa.',
    icon: CheckCircle2,
    links: [
      { label: 'Caixa', href: '/admin/inbox' },
      { label: 'Reportes', href: '/admin/reports' },
      { label: 'Comentários', href: '/admin/comments' },
    ],
    telemetryPaths: ['/admin/inbox', '/admin/reports', '/admin/comments'],
  },
  {
    title: 'Publicação editorial',
    status: 'Manter',
    variant: 'success',
    rationale: 'Pipeline, Notícias e Blog representam etapas distintas: triagem, edição e conteúdo autoral.',
    decision: 'Continuar separados, com o Pipeline como ponto de partida.',
    icon: CheckCircle2,
    links: [
      { label: 'Pipeline', href: '/admin/pipeline' },
      { label: 'Notícias', href: '/admin/news' },
      { label: 'Blog', href: '/admin/blog' },
      { label: 'Editor', href: '/write' },
    ],
    telemetryPaths: ['/admin/pipeline', '/admin/news', '/admin/blog', '/write'],
  },
  {
    title: 'Guia de blocos do Blog',
    status: 'Reposicionado',
    variant: 'success',
    rationale: 'É documentação ativa para montar matérias, incluindo blocos disponíveis e ideias em avaliação.',
    decision: 'Preservado dentro do módulo Blog como guia editorial.',
    icon: BookOpen,
    links: [{ label: 'Guia de blocos', href: '/admin/blog/blocks-demo' }],
    telemetryPaths: ['/admin/blog/blocks-demo'],
  },
  {
    title: 'Importações da Loja',
    status: 'Manter separado',
    variant: 'success',
    rationale: 'Shopee e Mercado Livre alimentam produtos por integrações e rotinas diferentes.',
    decision: 'Preservadas, agora ambas expostas no fluxo da Loja.',
    icon: Store,
    links: [
      { label: 'Shopee', href: '/admin/loja/import' },
      { label: 'Mercado Livre', href: '/admin/loja/importar' },
    ],
    telemetryPaths: ['/admin/loja/import', '/admin/loja/importar'],
  },
  {
    title: 'Curadoria via Gemini',
    status: 'Consolidado',
    variant: 'success',
    rationale: 'O hub reúne as filas detalhadas de artistas, grupos e produções sem executar geração automática de conteúdo no admin.',
    decision: 'Manter prompts, revisão e aplicação manual do JSON como caminho único para conteúdo curado.',
    icon: GitMerge,
    links: [
      { label: 'Fila Gemini', href: '/admin/enrichment' },
      { label: 'Artistas', href: '/admin/artists/enrich' },
      { label: 'Grupos', href: '/admin/groups/enrich' },
      { label: 'Produções', href: '/admin/productions/enrich' },
    ],
    telemetryPaths: ['/admin/enrichment', '/admin/artists/enrich', '/admin/groups/enrich', '/admin/productions/enrich'],
  },
  {
    title: 'Traduções automáticas',
    status: 'Desativado',
    variant: 'success',
    rationale: 'O DeepSeek deixou de traduzir conteúdo; os textos agora são preparados no Gemini e aplicados após revisão.',
    decision: 'Manter a Central de Traduções somente como fila, editor, aprovação e histórico.',
    icon: Languages,
    links: [
      { label: 'Traduções', href: '/admin/translations' },
      { label: 'Histórico', href: '/admin/translations/log' },
    ],
    telemetryPaths: ['/admin/translations', '/admin/translations/log'],
  },
  {
    title: 'Syncs e reparos manuais',
    status: 'Centralizado',
    variant: 'success',
    rationale: 'A Central de Automação agora espelha o workflow ativo e identifica ferramentas manuais que podem interferir na curadoria via Gemini.',
    decision: 'Manter sync TMDB e filmografias apenas como recuperação revisada; não reativar disparos sensíveis sem garantir proteção dos campos curados.',
    icon: RefreshCw,
    links: [
      { label: 'Automação', href: '/admin/cron' },
      { label: 'Sync Produções', href: '/admin/productions/sync' },
      { label: 'Filmografias', href: '/admin/filmography' },
      { label: 'Redes sociais', href: '/admin/artists/social-links' },
    ],
    telemetryPaths: ['/admin/cron', '/admin/productions/sync', '/admin/filmography', '/admin/artists/social-links'],
  },
  {
    title: 'Ferramentas corretivas de artistas',
    status: 'Medir uso',
    variant: 'review',
    rationale: 'Correção de nomes e MusicBrainz podem ter perdido frequência após o catálogo passar a usar novos syncs.',
    decision: 'Instrumentar execução antes de manter no menu, arquivar ou transformar em ação sob demanda.',
    icon: Wrench,
    links: [
      { label: 'Nomes via TMDB', href: '/admin/artists/fix-names' },
      { label: 'Import MB', href: '/admin/artists/mb-import' },
      { label: 'Duplicados', href: '/admin/artists/duplicates' },
    ],
    telemetryPaths: ['/admin/artists/fix-names', '/admin/artists/mb-import', '/admin/artists/duplicates'],
  },
  {
    title: 'Auditorias e visibilidade',
    status: 'Consolidado',
    variant: 'success',
    rationale: 'A central de visibilidade agora encaminha ocultações automáticas, restrições legais e produtos retirados da loja sem misturar restaurações.',
    decision: 'Manter como porta de entrada operacional e medir volume resolvido por cada fila especializada.',
    icon: Eye,
    links: [
      { label: 'Auditoria de imagens', href: '/admin/image-audit' },
      { label: 'Central de visibilidade', href: '/admin/hidden' },
    ],
    telemetryPaths: ['/admin/image-audit', '/admin/hidden'],
  },
]

const automationBacklog = [
  {
    title: 'Telemetria de processos administrativos',
    value: 'Ativa em todo admin',
    description: 'Todas as páginas administrativas agora registram abertura uma vez por admin/dia; execução e resultados serão a próxima camada.',
    icon: History,
  },
  {
    title: 'Fila única de curadoria',
    value: 'Consolidada',
    description: 'Artistas, grupos e producoes incompletos agora partem de uma fila revisada: prompt, Gemini e aplicacao manual do JSON.',
    icon: Sparkles,
  },
  {
    title: 'Reexecução orientada por falhas',
    value: 'Automação',
    description: 'Expor somente jobs com falha ou pendência relevante em vez de exigir inspeção manual.',
    icon: Bot,
  },
  {
    title: 'Inventário com última atualização',
    value: 'Governança',
    description: 'Mostrar quais fontes alimentam cada área e quando cada conjunto de dados foi atualizado.',
    icon: Database,
  },
]

export default async function AdminProcessesPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/admin/processes')
  if (session.user.role?.toLowerCase() !== 'admin') redirect('/dashboard')

  const since30 = new Date(Date.now() - 30 * 86400_000)
  const usageRows = await prisma.auditLog.groupBy({
    by: ['entityId'],
    where: {
      entity: 'AdminProcessUsage',
      action: 'VIEW',
      createdAt: { gte: since30 },
      entityId: { not: null },
    },
    _count: { id: true },
    _max: { createdAt: true },
  })
  const routeByKey = new Map(ADMIN_TELEMETRY_ROUTES.map(route => [route.key, route]))
  const usageByPath = new Map(
    usageRows.map(row => [row.entityId, { days: row._count.id, lastUsedAt: row._max.createdAt }]),
  )
  const trackedUsage = usageRows.flatMap(row => {
    const route = row.entityId ? routeByKey.get(row.entityId) : undefined
    return route ? [{ route, records: row._count.id, lastUsedAt: row._max.createdAt }] : []
  })
  const totalRecords = trackedUsage.reduce((sum, usage) => sum + usage.records, 0)
  const latestUsage = trackedUsage.reduce<Date | null>(
    (latest, usage) => !latest || (usage.lastUsedAt && usage.lastUsedAt > latest) ? usage.lastUsedAt : latest,
    null,
  )
  const areaUsage = (Object.entries(ADMIN_TELEMETRY_AREAS) as Array<[AdminTelemetryArea, string]>).map(([area, label]) => {
    const pages = ADMIN_TELEMETRY_ROUTES.filter(route => route.area === area)
    const active = pages.filter(route => usageByPath.has(route.key)).length
    const records = pages.reduce((sum, route) => sum + (usageByPath.get(route.key)?.days ?? 0), 0)
    return { area, label, pages: pages.length, active, records }
  })
  const topPages = [...trackedUsage].sort((a, b) => b.records - a.records).slice(0, 8)

  const summary = assessments.reduce(
    (items, process) => ({ ...items, [process.variant]: items[process.variant] + 1 }),
    { success: 0, warning: 0, review: 0, info: 0 } as Record<ProcessStatus, number>,
  )

  return (
    <AdminLayout title="Processos e melhorias" hideTitle>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-accent">Evolução do admin</p>
            <h1 className="text-2xl lg:text-3xl font-black text-foreground mt-1">Processos e melhorias</h1>
            <p className="text-sm text-muted mt-1 max-w-2xl">
              Inventário inicial para decidir o que permanece, o que deve ser unido e o que precisa provar utilidade após as mudanças no projeto.
            </p>
            <p className="text-[11px] text-muted mt-2">Medição do admin iniciada agora; os indicadores acumulam acessos diários pelos próximos 30 dias.</p>
          </div>
          <div className="flex gap-2">
            <AdminLinkButton href="/admin/inbox" size="sm">
              <ClipboardList size={13} /> Caixa de trabalho
            </AdminLinkButton>
            <AdminLinkButton href="/admin/cron" size="sm">
              <Bot size={13} /> Automações
            </AdminLinkButton>
          </div>
        </div>

        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Decisões atuais</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Manter', value: summary.success, variant: 'success' as const },
              { label: 'Consolidar', value: summary.warning, variant: 'warning' as const },
              { label: 'Medir uso', value: summary.review, variant: 'review' as const },
              { label: 'Excluir agora', value: 0, variant: 'neutral' as const },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-surface border border-border p-4">
                <AdminBadge variant={item.variant} shape="pill">{item.label}</AdminBadge>
                <p className="text-3xl font-black tabular-nums text-foreground mt-3">{item.value}</p>
                <p className="text-[11px] text-muted mt-1">processo{item.value !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Uso de todo o admin</h2>
              <p className="text-[11px] text-muted mt-1">Rotas de detalhe são agrupadas por processo; IDs individuais não são armazenados nesta medição.</p>
            </div>
            <AdminLinkButton href="/admin/activity?tab=admin&entity=AdminProcessUsage&days=30" size="sm">
              <History size={13} /> Ver histórico
            </AdminLinkButton>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Páginas mapeadas', value: ADMIN_TELEMETRY_ROUTES.length, icon: ClipboardList },
              { label: 'Páginas utilizadas', value: trackedUsage.length, icon: Activity },
              { label: 'Registros-dia', value: totalRecords, icon: History },
              { label: 'Última observação', value: latestUsage ? latestUsage.toLocaleDateString('pt-BR') : '-', icon: RefreshCw },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted">
                  <Icon size={13} />
                  <p className="text-[10px] font-black uppercase tracking-wider">{label}</p>
                </div>
                <p className="text-2xl font-black text-foreground mt-3">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-[1fr_1.15fr] gap-3">
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Por área</p>
              <div className="space-y-3">
                {areaUsage.map(area => (
                  <div key={area.area}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-foreground">{area.label}</span>
                      <span className="text-muted">{area.active}/{area.pages} páginas · {area.records} registros-dia</span>
                    </div>
                    <div className="h-1.5 bg-background rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${area.pages > 0 ? (area.active / area.pages) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Páginas mais usadas em 30 dias</p>
              {topPages.length > 0 ? (
                <div className="space-y-1">
                  {topPages.map(({ route, records, lastUsedAt }) => (
                    <div key={route.key} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <span className="flex-1 min-w-0 text-xs text-foreground truncate">{route.label}</span>
                      <AdminBadge variant="neutral" shape="pill">{route.area}</AdminBadge>
                      <span className="text-xs font-bold text-accent tabular-nums">{records}</span>
                      <span className="text-[10px] text-muted w-16 text-right">
                        {lastUsedAt?.toLocaleDateString('pt-BR') ?? '-'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted py-8 text-center">A medição começa conforme as páginas forem acessadas.</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-accent" />
              <p className="text-xs text-muted">Uso do público, audiência e desempenho de conteúdo continuam disponíveis em Analytics.</p>
            </div>
            <Link href="/admin/analytics" className="text-xs text-accent hover:underline">Abrir Analytics</Link>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Mapa de processos revisados</h2>
              <p className="text-[11px] text-muted mt-1">A remoção só deve ocorrer após medição de uso ou substituição comprovada.</p>
            </div>
            <AdminBadge variant="info" shape="pill">{assessments.length} avaliados</AdminBadge>
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            {assessments.map(({ title, status, variant, rationale, decision, icon: Icon, links, telemetryPaths }) => {
              const observed = telemetryPaths?.reduce(
                (total, pathname) => {
                  const usage = usageByPath.get(pathname)
                  return {
                    days: total.days + (usage?.days ?? 0),
                    lastUsedAt: !total.lastUsedAt || (usage?.lastUsedAt && usage.lastUsedAt > total.lastUsedAt)
                      ? usage?.lastUsedAt ?? total.lastUsedAt
                      : total.lastUsedAt,
                  }
                },
                { days: 0, lastUsedAt: null as Date | null },
              )

              return (
                <article key={title} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={15} className="text-accent shrink-0" />
                    <h3 className="text-sm font-bold text-foreground">{title}</h3>
                  </div>
                  <AdminBadge variant={variant} shape="pill" className="shrink-0">{status}</AdminBadge>
                </div>
                <p className="text-xs text-muted leading-relaxed">{rationale}</p>
                <div className="rounded-lg border border-border bg-background/40 px-3 py-2 mt-3">
                  <p className="text-[10px] uppercase tracking-wider font-black text-muted mb-1">Decisão</p>
                  <p className="text-[11px] text-foreground">{decision}</p>
                </div>
                {observed && (
                  <div className="flex items-center justify-between gap-3 mt-3 text-[11px]">
                    <span className="text-muted">
                      Uso admin (30d): <strong className="text-foreground">{observed.days}</strong> registro{observed.days !== 1 ? 's' : ''}-dia
                    </span>
                    <span className="text-muted">
                      {observed.lastUsedAt
                        ? `Último: ${observed.lastUsedAt.toLocaleDateString('pt-BR')}`
                        : 'Sem acesso medido'}
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {links.map(link => (
                    <Link key={link.href} href={link.href} className="inline-flex items-center gap-1 text-[11px] text-muted border border-border rounded-lg px-2 py-1 hover:text-accent hover:border-accent/30 transition-colors">
                      {link.label} <ArrowRight size={10} />
                    </Link>
                  ))}
                </div>
                </article>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-foreground mb-3">Backlog recomendado de automação</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {automationBacklog.map(({ title, value, description, icon: Icon }) => (
              <div key={title} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{title}</p>
                    <p className="text-[10px] font-semibold text-accent mt-0.5">{value}</p>
                    <p className="text-[11px] text-muted leading-relaxed mt-2">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
