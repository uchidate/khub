import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Newspaper, Mic2, Film,
  EyeOff, Languages, CheckCircle2, Clock,
  Sparkles, ExternalLink,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import prisma from '@/lib/prisma'
import { PipelineActions } from './_components/PipelineActions'

export const dynamic = 'force-dynamic'

type EntityTab = 'news' | 'artists' | 'productions'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date | string): string {
  const d    = new Date(date)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60)    return `${diff}s`
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

// ─── Card de coluna ──────────────────────────────────────────────────────────

function PipelineCard({
  title, subtitle, imageUrl, time, href, tag, tagColor, actions,
}: {
  title:     string
  subtitle?: string | null
  imageUrl?: string | null
  time:      Date | string
  href:      string
  tag?:      string
  tagColor?: string
  actions?:  React.ReactNode
}) {
  const tagCls: Record<string, string> = {
    draft:    'bg-zinc-700/40 text-zinc-400 border-zinc-600/30',
    ready:    'bg-blue-500/15 text-blue-300 border-blue-500/30',
    pending:  'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    hidden:   'bg-zinc-700/40 text-zinc-500 border-zinc-700/30',
    done:     'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  }

  return (
    <div className="group bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3 hover:border-zinc-700 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.1)] transition-all">
      <div className="flex gap-2.5">
        {imageUrl ? (
          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
            <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-zinc-200 line-clamp-2 leading-tight">{title}</p>
          {subtitle && <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-2.5">
        {tag && (
          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${tagCls[tagColor ?? 'draft'] ?? tagCls.draft}`}>
            {tag}
          </span>
        )}
        <span className="text-[10px] text-zinc-700 ml-auto">{timeAgo(time)}</span>
        <Link
          href={href}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-300"
          title="Abrir"
        >
          <ExternalLink size={11} />
        </Link>
      </div>

      {actions && <div className="mt-2 pt-2 border-t border-zinc-800/60">{actions}</div>}
    </div>
  )
}

// ─── Coluna do kanban ─────────────────────────────────────────────────────────

function PipelineColumn({
  title, count, icon: Icon, color, children, emptyMsg,
}: {
  title:    string
  count:    number
  icon:     React.ElementType
  color:    string
  children: React.ReactNode
  emptyMsg: string
}) {
  const colorMap: Record<string, { dot: string; label: string; header: string }> = {
    zinc:    { dot: 'bg-zinc-500',    label: 'text-zinc-400',    header: 'border-zinc-800/60' },
    yellow:  { dot: 'bg-yellow-500',  label: 'text-yellow-400',  header: 'border-yellow-500/20' },
    emerald: { dot: 'bg-emerald-500', label: 'text-emerald-400', header: 'border-emerald-500/20' },
    red:     { dot: 'bg-red-500',     label: 'text-red-400',     header: 'border-red-500/20' },
  }
  const c = colorMap[color] ?? colorMap.zinc

  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] flex-shrink-0 lg:flex-1">
      {/* Header da coluna */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-2 bg-zinc-900/40 ${c.header}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
        <Icon size={13} className={c.label} />
        <span className={`text-xs font-bold flex-1 ${c.label}`}>{title}</span>
        <span className="text-[10px] font-black text-zinc-600 bg-zinc-800/60 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      {/* Items */}
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {count === 0 ? (
          <div className="flex items-center justify-center py-12 text-center">
            <p className="text-[11px] text-zinc-700">{emptyMsg}</p>
          </div>
        ) : children}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PipelinePage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/admin/pipeline')
  if (session.user.role?.toLowerCase() !== 'admin') redirect('/admin')

  const params = await searchParams
  const tab: EntityTab = (params.tab as EntityTab) ?? 'news'

  // ── Dados por tab ──────────────────────────────────────────────────────────

  if (tab === 'news') {
    const [drafts, withoutTranslation, published, hidden] = await Promise.all([
      // Rascunhos / importados ainda não publicados
      prisma.news.findMany({
        where: { OR: [{ status: 'draft' }, { status: 'ready' }] },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, title: true, imageUrl: true, source: true, status: true, createdAt: true, isHidden: true },
      }),
      // Publicados mas sem tradução PT-BR
      prisma.news.findMany({
        where: { status: 'published', isHidden: false, translationStatus: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, title: true, imageUrl: true, source: true, createdAt: true, translationStatus: true },
      }),
      // Publicados com tradução
      prisma.news.findMany({
        where: { status: 'published', isHidden: false, translationStatus: 'completed' },
        orderBy: { publishedAt: 'desc' },
        take: 20,
        select: { id: true, title: true, imageUrl: true, source: true, publishedAt: true, createdAt: true },
      }),
      // Ocultos
      prisma.news.findMany({
        where: { isHidden: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, title: true, imageUrl: true, source: true, createdAt: true },
      }),
    ])

    return (
      <AdminLayout
        title="Pipeline"
        subtitle="Fluxo de conteúdo — notícias, artistas e produções"
      >
        <PipelineLayout tab={tab}>
          <div className="flex gap-3 overflow-x-auto pb-4">

            <PipelineColumn title="Importado / Rascunho" count={drafts.length} icon={Clock} color="zinc" emptyMsg="Nenhum rascunho">
              {drafts.map(n => (
                <PipelineCard
                  key={n.id}
                  title={n.title}
                  subtitle={n.source ?? undefined}
                  imageUrl={n.imageUrl}
                  time={n.createdAt}
                  href={`/admin/news/${n.id}`}
                  tag={n.status === 'ready' ? 'pronto' : 'rascunho'}
                  tagColor={n.status === 'ready' ? 'ready' : 'draft'}
                  actions={<PipelineActions id={n.id} type="news" action="publish" />}
                />
              ))}
            </PipelineColumn>

            <div className="flex items-start self-start mt-10 flex-shrink-0">
              <ArrowRight size={16} className="text-zinc-700" />
            </div>

            <PipelineColumn title="Sem tradução PT-BR" count={withoutTranslation.length} icon={Languages} color="yellow" emptyMsg="Tudo traduzido">
              {withoutTranslation.map(n => (
                <PipelineCard
                  key={n.id}
                  title={n.title}
                  subtitle={n.source ?? undefined}
                  imageUrl={n.imageUrl}
                  time={n.createdAt}
                  href={`/admin/news/${n.id}`}
                  tag="sem tradução"
                  tagColor="pending"
                  actions={<PipelineActions id={n.id} type="news" action="translate" />}
                />
              ))}
            </PipelineColumn>

            <div className="flex items-start self-start mt-10 flex-shrink-0">
              <ArrowRight size={16} className="text-zinc-700" />
            </div>

            <PipelineColumn title="Publicado" count={published.length} icon={CheckCircle2} color="emerald" emptyMsg="Nenhum publicado">
              {published.map(n => (
                <PipelineCard
                  key={n.id}
                  title={n.title}
                  subtitle={n.source ?? undefined}
                  imageUrl={n.imageUrl}
                  time={n.publishedAt ?? n.createdAt}
                  href={`/admin/news/${n.id}`}
                  tag="publicado"
                  tagColor="done"
                />
              ))}
            </PipelineColumn>

            <div className="flex items-start self-start mt-10 flex-shrink-0">
              <ArrowRight size={16} className="text-zinc-700" />
            </div>

            <PipelineColumn title="Oculto" count={hidden.length} icon={EyeOff} color="red" emptyMsg="Nenhum oculto">
              {hidden.map(n => (
                <PipelineCard
                  key={n.id}
                  title={n.title}
                  subtitle={n.source ?? undefined}
                  imageUrl={n.imageUrl}
                  time={n.createdAt}
                  href={`/admin/news/${n.id}`}
                  tag="oculto"
                  tagColor="hidden"
                  actions={<PipelineActions id={n.id} type="news" action="show" />}
                />
              ))}
            </PipelineColumn>
          </div>
        </PipelineLayout>
      </AdminLayout>
    )
  }

  // ── TAB: ARTISTAS ──────────────────────────────────────────────────────────

  if (tab === 'artists') {
    const [withoutBio, withoutTranslation, complete, hidden] = await Promise.all([
      prisma.artist.findMany({
        where: { bio: null, isHidden: false },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, nameRomanized: true, primaryImageUrl: true, createdAt: true },
      }),
      // Artistas com bio mas sem tradução PT-BR
      prisma.artist.findMany({
        where: {
          bio: { not: null },
          isHidden: false,
          translationStatus: { in: ['pending', 'failed'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, nameRomanized: true, primaryImageUrl: true, createdAt: true },
      }),
      prisma.artist.findMany({
        where: {
          bio: { not: null },
          isHidden: false,
          translationStatus: 'completed',
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: { id: true, nameRomanized: true, primaryImageUrl: true, createdAt: true },
      }),
      prisma.artist.findMany({
        where: { isHidden: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, nameRomanized: true, primaryImageUrl: true, createdAt: true },
      }),
    ])

    return (
      <AdminLayout title="Pipeline" subtitle="Fluxo de conteúdo — artistas">
        <PipelineLayout tab={tab}>
          <div className="flex gap-3 overflow-x-auto pb-4">

            <PipelineColumn title="Sem bio" count={withoutBio.length} icon={Sparkles} color="zinc" emptyMsg="Todos com bio">
              {withoutBio.map(a => (
                <PipelineCard
                  key={a.id}
                  title={a.nameRomanized}
                  imageUrl={a.primaryImageUrl}
                  time={a.createdAt}
                  href={`/admin/artists/${a.id}`}
                  tag="sem bio"
                  tagColor="draft"
                  actions={<PipelineActions id={a.id} type="artist" action="enrich" />}
                />
              ))}
            </PipelineColumn>

            <div className="flex items-start self-start mt-10 flex-shrink-0">
              <ArrowRight size={16} className="text-zinc-700" />
            </div>

            <PipelineColumn title="Sem tradução PT-BR" count={withoutTranslation.length} icon={Languages} color="yellow" emptyMsg="Tudo traduzido">
              {withoutTranslation.map(a => (
                <PipelineCard
                  key={a.id}
                  title={a.nameRomanized}
                  imageUrl={a.primaryImageUrl}
                  time={a.createdAt}
                  href={`/admin/artists/${a.id}`}
                  tag="sem tradução"
                  tagColor="pending"
                  actions={<PipelineActions id={a.id} type="artist" action="translate" />}
                />
              ))}
            </PipelineColumn>

            <div className="flex items-start self-start mt-10 flex-shrink-0">
              <ArrowRight size={16} className="text-zinc-700" />
            </div>

            <PipelineColumn title="Completo" count={complete.length} icon={CheckCircle2} color="emerald" emptyMsg="Nenhum completo ainda">
              {complete.map(a => (
                <PipelineCard
                  key={a.id}
                  title={a.nameRomanized}
                  imageUrl={a.primaryImageUrl}
                  time={a.createdAt}
                  href={`/admin/artists/${a.id}`}
                  tag="completo"
                  tagColor="done"
                />
              ))}
            </PipelineColumn>

            <div className="flex items-start self-start mt-10 flex-shrink-0">
              <ArrowRight size={16} className="text-zinc-700" />
            </div>

            <PipelineColumn title="Oculto" count={hidden.length} icon={EyeOff} color="red" emptyMsg="Nenhum oculto">
              {hidden.map(a => (
                <PipelineCard
                  key={a.id}
                  title={a.nameRomanized}
                  imageUrl={a.primaryImageUrl}
                  time={a.createdAt}
                  href={`/admin/artists/${a.id}`}
                  tag="oculto"
                  tagColor="hidden"
                />
              ))}
            </PipelineColumn>
          </div>
        </PipelineLayout>
      </AdminLayout>
    )
  }

  // ── TAB: PRODUÇÕES ─────────────────────────────────────────────────────────

  const [withoutSynopsis, withoutTranslation, complete, hidden] = await Promise.all([
    prisma.production.findMany({
      where: { synopsis: null, isHidden: false },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, titlePt: true, imageUrl: true, createdAt: true },
    }),
    prisma.production.findMany({
      where: { synopsis: { not: null }, isHidden: false, translationStatus: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, titlePt: true, imageUrl: true, createdAt: true },
    }),
    prisma.production.findMany({
      where: { synopsis: { not: null }, isHidden: false, translationStatus: 'completed' },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: { id: true, titlePt: true, imageUrl: true, createdAt: true },
    }),
    prisma.production.findMany({
      where: { isHidden: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, titlePt: true, imageUrl: true, createdAt: true },
    }),
  ])

  return (
    <AdminLayout title="Pipeline" subtitle="Fluxo de conteúdo — produções">
      <PipelineLayout tab={tab}>
        <div className="flex gap-3 overflow-x-auto pb-4">

          <PipelineColumn title="Sem sinopse" count={withoutSynopsis.length} icon={Sparkles} color="zinc" emptyMsg="Todas com sinopse">
            {withoutSynopsis.map(p => (
              <PipelineCard
                key={p.id}
                title={p.titlePt}
                imageUrl={p.imageUrl}
                time={p.createdAt}
                href={`/admin/productions/${p.id}`}
                tag="sem sinopse"
                tagColor="draft"
                actions={<PipelineActions id={p.id} type="production" action="enrich" />}
              />
            ))}
          </PipelineColumn>

          <div className="flex items-start self-start mt-10 flex-shrink-0">
            <ArrowRight size={16} className="text-zinc-700" />
          </div>

          <PipelineColumn title="Sem tradução PT-BR" count={withoutTranslation.length} icon={Languages} color="yellow" emptyMsg="Tudo traduzido">
            {withoutTranslation.map(p => (
              <PipelineCard
                key={p.id}
                title={p.titlePt}
                imageUrl={p.imageUrl}
                time={p.createdAt}
                href={`/admin/productions/${p.id}`}
                tag="sem tradução"
                tagColor="pending"
                actions={<PipelineActions id={p.id} type="production" action="translate" />}
              />
            ))}
          </PipelineColumn>

          <div className="flex items-start self-start mt-10 flex-shrink-0">
            <ArrowRight size={16} className="text-zinc-700" />
          </div>

          <PipelineColumn title="Completo" count={complete.length} icon={CheckCircle2} color="emerald" emptyMsg="Nenhum completo ainda">
            {complete.map(p => (
              <PipelineCard
                key={p.id}
                title={p.titlePt}
                imageUrl={p.imageUrl}
                time={p.createdAt}
                href={`/admin/productions/${p.id}`}
                tag="completo"
                tagColor="done"
              />
            ))}
          </PipelineColumn>

          <div className="flex items-start self-start mt-10 flex-shrink-0">
            <ArrowRight size={16} className="text-zinc-700" />
          </div>

          <PipelineColumn title="Oculto" count={hidden.length} icon={EyeOff} color="red" emptyMsg="Nenhum oculto">
            {hidden.map(p => (
              <PipelineCard
                key={p.id}
                title={p.titlePt}
                imageUrl={p.imageUrl}
                time={p.createdAt}
                href={`/admin/productions/${p.id}`}
                tag="oculto"
                tagColor="hidden"
              />
            ))}
          </PipelineColumn>
        </div>
      </PipelineLayout>
    </AdminLayout>
  )
}

// ─── Layout wrapper com tabs ──────────────────────────────────────────────────

function PipelineLayout({ tab, children }: { tab: EntityTab; children: React.ReactNode }) {
  const tabs = [
    { value: 'news' as const,        label: 'Notícias',  icon: Newspaper },
    { value: 'artists' as const,     label: 'Artistas',  icon: Mic2 },
    { value: 'productions' as const, label: 'Produções', icon: Film },
  ]

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <Link
            key={t.value}
            href={`/admin/pipeline?tab=${t.value}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === t.value
                ? 'bg-blue-500/15 text-blue-300 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <t.icon size={12} />
            {t.label}
          </Link>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-[10px] text-zinc-700">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-500" />Pendente</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" />Sem tradução</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Completo</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Oculto</span>
        <span className="ml-auto text-zinc-800">Role horizontalmente para ver todas as colunas →</span>
      </div>

      {/* Kanban */}
      {children}
    </div>
  )
}
