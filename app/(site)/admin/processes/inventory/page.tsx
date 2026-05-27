import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Clock, Database, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Source = {
  name: string
  type: 'cron' | 'manual' | 'api' | 'scrape'
  schedule?: string
}

type InventoryArea = {
  label: string
  description: string
  sources: Source[]
  query: () => Promise<{ total: number; lastCreated: Date | null; lastUpdated: Date | null }>
}

const SOURCE_TYPE_LABEL: Record<Source['type'], string> = {
  cron:   'Cron automático',
  manual: 'Manual',
  api:    'API externa',
  scrape: 'Scraping',
}

const SOURCE_TYPE_COLOR: Record<Source['type'], string> = {
  cron:   'text-green-400 bg-green-500/10 border-green-500/20',
  manual: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  api:    'text-purple-400 bg-purple-500/10 border-purple-500/20',
  scrape: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
}

const AREAS: InventoryArea[] = [
  {
    label: 'Artistas',
    description: 'Perfis de artistas K-Pop/K-Drama, incluindo campos enriquecidos via Gemini.',
    sources: [
      { name: 'Cadastro manual', type: 'manual' },
      { name: 'Gemini (enriquecimento)', type: 'manual' },
      { name: 'TMDB (nomes/fotos)', type: 'manual' },
      { name: 'MusicBrainz (import)', type: 'manual' },
      { name: 'Wikidata (redes sociais)', type: 'cron', schedule: 'Diário 23:00 BRT' },
      { name: 'Visibilidade automática', type: 'cron', schedule: 'Diário 23:00 BRT' },
    ],
    query: async () => {
      const [total, agg] = await Promise.all([
        prisma.artist.count(),
        prisma.artist.aggregate({ _max: { createdAt: true, updatedAt: true } }),
      ])
      return { total, lastCreated: agg._max.createdAt, lastUpdated: agg._max.updatedAt }
    },
  },
  {
    label: 'Grupos musicais',
    description: 'Grupos, bandas e unidades K-Pop com membros e discografia.',
    sources: [
      { name: 'Cadastro manual', type: 'manual' },
      { name: 'Gemini (enriquecimento)', type: 'manual' },
      { name: 'Spotify (discografia)', type: 'cron', schedule: 'Dom 03:00 BRT' },
    ],
    query: async () => {
      const [total, agg] = await Promise.all([
        prisma.musicalGroup.count(),
        prisma.musicalGroup.aggregate({ _max: { createdAt: true, updatedAt: true } }),
      ])
      return { total, lastCreated: agg._max.createdAt, lastUpdated: agg._max.updatedAt }
    },
  },
  {
    label: 'Produções',
    description: 'K-Dramas, filmes e especiais com elenco, sinopse e avaliações.',
    sources: [
      { name: 'Cadastro manual', type: 'manual' },
      { name: 'Gemini (enriquecimento)', type: 'manual' },
      { name: 'TMDB (sync de elenco)', type: 'cron', schedule: 'Hora em hora' },
    ],
    query: async () => {
      const [total, agg] = await Promise.all([
        prisma.production.count(),
        prisma.production.aggregate({ _max: { createdAt: true, updatedAt: true } }),
      ])
      return { total, lastCreated: agg._max.createdAt, lastUpdated: agg._max.updatedAt }
    },
  },
  {
    label: 'Filmografias',
    description: 'Vínculos entre artistas e produções via TMDB.',
    sources: [
      { name: 'TMDB (sync automático)', type: 'cron', schedule: 'Dom 04:00 BRT' },
      { name: 'Sync manual (admin)', type: 'manual' },
    ],
    query: async () => {
      // ArtistProduction has no timestamps — use Production's updatedAt as proxy
      const [total, agg] = await Promise.all([
        prisma.artistProduction.count(),
        prisma.production.aggregate({ _max: { updatedAt: true } }),
      ])
      return { total, lastCreated: agg._max.updatedAt ?? null, lastUpdated: null }
    },
  },
  {
    label: 'Álbuns',
    description: 'Discografia de artistas e grupos com faixas.',
    sources: [
      { name: 'MusicBrainz (sync)', type: 'cron', schedule: 'Hora em hora' },
      { name: 'Spotify (discografia grupos)', type: 'cron', schedule: 'Dom 03:00 BRT' },
      { name: 'Cadastro manual', type: 'manual' },
    ],
    query: async () => {
      const [total, agg] = await Promise.all([
        prisma.album.count(),
        prisma.album.aggregate({ _max: { createdAt: true, updatedAt: true } }),
      ])
      return { total, lastCreated: agg._max.createdAt, lastUpdated: agg._max.updatedAt }
    },
  },
  {
    label: 'Notícias',
    description: 'Feed de notícias importadas e curadas do K-Pop.',
    sources: [
      { name: 'Fetch automático de feeds', type: 'cron', schedule: 'A cada 5min' },
      { name: 'Tagging por regras locais', type: 'cron', schedule: 'A cada 5min' },
    ],
    query: async () => {
      const [total, agg] = await Promise.all([
        prisma.news.count(),
        prisma.news.aggregate({ _max: { createdAt: true, updatedAt: true } }),
      ])
      return { total, lastCreated: agg._max.createdAt, lastUpdated: agg._max.updatedAt }
    },
  },
  {
    label: 'Blog',
    description: 'Artigos editoriais com publicação agendada.',
    sources: [
      { name: 'Editor /write (manual)', type: 'manual' },
      { name: 'Publicação agendada', type: 'cron', schedule: 'A cada 5min' },
    ],
    query: async () => {
      const [total, agg] = await Promise.all([
        prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
        prisma.blogPost.aggregate({ _max: { createdAt: true, updatedAt: true } }),
      ])
      return { total, lastCreated: agg._max.createdAt, lastUpdated: agg._max.updatedAt }
    },
  },
  {
    label: 'Streaming',
    description: 'Shows de streaming com sinais de tendência.',
    sources: [
      { name: 'Cadastro manual', type: 'manual' },
      { name: 'Sinais de streaming', type: 'cron', schedule: 'A cada 15min' },
      { name: 'Atualização de top shows', type: 'cron', schedule: 'Diário 00:00 BRT' },
    ],
    query: async () => {
      const [total, agg] = await Promise.all([
        prisma.streamingShow.count(),
        prisma.streamingShow.aggregate({ _max: { fetchedAt: true } }),
      ])
      return { total, lastCreated: agg._max.fetchedAt ?? null, lastUpdated: null }
    },
  },
]

function formatRelative(date: Date | null): string {
  if (!date) return '—'
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr  = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)
  if (diffMin < 2)  return 'agora há pouco'
  if (diffHr  < 1)  return `há ${diffMin}min`
  if (diffHr  < 24) return `há ${diffHr}h`
  if (diffDay < 2)  return 'ontem'
  if (diffDay < 7)  return `há ${diffDay} dias`
  return date.toLocaleDateString('pt-BR')
}

function freshnessVariant(date: Date | null): { icon: typeof CheckCircle2; color: string; label: string } {
  if (!date) return { icon: WifiOff, color: 'text-muted', label: 'Sem dados' }
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (days < 1)  return { icon: CheckCircle2, color: 'text-green-400',  label: 'Atualizado hoje' }
  if (days < 7)  return { icon: Wifi,         color: 'text-green-400',  label: 'Esta semana' }
  if (days < 30) return { icon: Wifi,         color: 'text-yellow-400', label: 'Este mês' }
  return { icon: Clock, color: 'text-red-400', label: 'Desatualizado' }
}

export default async function DataInventoryPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/admin/processes/inventory')
  if (session.user.role?.toLowerCase() !== 'admin') redirect('/dashboard')

  const results = await Promise.all(
    AREAS.map(async area => ({
      ...area,
      data: await area.query().catch(() => ({ total: 0, lastCreated: null, lastUpdated: null })),
    }))
  )

  return (
    <AdminLayout title="Inventário de dados" subtitle="Fontes e recência de alteração de cada conjunto de dados">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/processes" className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors">
            <ArrowLeft size={13} /> Processos
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-[11px] text-muted">
          A recência abaixo representa a última criação ou edição observada nos registros. Um cron pode executar sem alterar dados; a confirmação de execução e falhas fica na Central de automação.
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Áreas mapeadas',
              value: AREAS.length,
              icon: Database,
              color: 'text-accent',
            },
            {
              label: 'Com cron automático',
              value: AREAS.filter(a => a.sources.some(s => s.type === 'cron')).length,
              icon: RefreshCw,
              color: 'text-green-400',
            },
            {
              label: 'Alteradas hoje',
              value: results.filter(r => {
                const d = r.data.lastUpdated ?? r.data.lastCreated
                return d && (Date.now() - d.getTime()) < 86_400_000
              }).length,
              icon: CheckCircle2,
              color: 'text-green-400',
            },
            {
              label: 'Sem alteração (>30d)',
              value: results.filter(r => {
                const d = r.data.lastUpdated ?? r.data.lastCreated
                return d && (Date.now() - d.getTime()) > 30 * 86_400_000
              }).length,
              icon: Clock,
              color: 'text-red-400',
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted mb-3">
                <Icon size={13} className={color} />
                <p className="text-[10px] font-black uppercase tracking-wider">{label}</p>
              </div>
              <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Inventory grid */}
        <div className="grid lg:grid-cols-2 gap-3">
          {results.map(({ label, description, sources, data }) => {
            const refDate = data.lastUpdated ?? data.lastCreated
            const { icon: FreshnessIcon, color: freshnessColor, label: freshnessLabel } = freshnessVariant(refDate)

            return (
              <div key={label} className="bg-surface border border-border rounded-xl p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground">{label}</h3>
                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{description}</p>
                  </div>
                  <div className={`flex items-center gap-1 shrink-0 text-[10px] font-bold ${freshnessColor}`}>
                    <FreshnessIcon size={12} />
                    {freshnessLabel}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background rounded-lg border border-border py-2 px-1">
                    <p className="text-base font-black text-foreground tabular-nums">{data.total.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-muted mt-0.5">registros</p>
                  </div>
                  <div className="bg-background rounded-lg border border-border py-2 px-1">
                    <p className="text-[11px] font-bold text-foreground tabular-nums">{formatRelative(data.lastCreated)}</p>
                    <p className="text-[10px] text-muted mt-0.5">último criado</p>
                  </div>
                  <div className="bg-background rounded-lg border border-border py-2 px-1">
                    <p className="text-[11px] font-bold text-foreground tabular-nums">{formatRelative(data.lastUpdated)}</p>
                    <p className="text-[10px] text-muted mt-0.5">última edição</p>
                  </div>
                </div>

                {/* Sources */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5">Fontes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sources.map(source => (
                      <span
                        key={source.name}
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border ${SOURCE_TYPE_COLOR[source.type]}`}
                        title={source.schedule ? `${SOURCE_TYPE_LABEL[source.type]} · ${source.schedule}` : SOURCE_TYPE_LABEL[source.type]}
                      >
                        {source.type === 'cron' && <RefreshCw size={9} />}
                        {source.name}
                        {source.schedule && <span className="opacity-70">· {source.schedule}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
