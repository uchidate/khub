import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
    ArrowRight, Newspaper, Mic2, Film,
    EyeOff, Languages, CheckCircle2, Clock,
    Sparkles, ExternalLink, PenLine, ShieldCheck, Globe,
    RefreshCw, ChevronRight,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageGuide } from '@/components/admin/PageGuide'
import prisma from '@/lib/prisma'
import { PipelineActions } from './_components/PipelineActions'
import { PipelineBatchAction } from './_components/PipelineBatchAction'

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
    title, subtitle, imageUrl, time, href, publicHref, tag, tagColor, actions,
}: {
    title:      string
    subtitle?:  string | null
    imageUrl?:  string | null
    time:       Date | string
    href:       string
    publicHref?: string
    tag?:       string
    tagColor?:  string
    actions?:   React.ReactNode
}) {
    const tagCls: Record<string, string> = {
        draft:    'bg-surface text-muted border-border',
        ready:    'bg-blue-500/15 text-blue-300 border-blue-500/30',
        pending:  'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
        hidden:   'bg-surface text-muted border-border',
        done:     'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    }

    const exactDate = new Date(time).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })

    return (
        <div className="group bg-surface border border-border rounded-xl p-3 hover:border-blue-500/20 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.1)] transition-all">
            <div className="flex gap-2.5">
                {imageUrl ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
                        <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                    <Link
                        href={href}
                        className="text-[12px] font-medium text-foreground hover:text-blue-400 line-clamp-2 leading-tight transition-colors"
                    >
                        {title}
                    </Link>
                    {subtitle && <p className="text-[11px] text-muted mt-0.5 truncate">{subtitle}</p>}
                </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2.5">
                {tag && (
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${tagCls[tagColor ?? 'draft'] ?? tagCls.draft}`}>
                        {tag}
                    </span>
                )}
                <span className="text-[10px] text-muted ml-auto" title={exactDate}>{timeAgo(time)}</span>
                {publicHref && (
                    <Link
                        href={publicHref}
                        target="_blank"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-blue-400"
                        title="Ver página pública"
                    >
                        <Globe size={11} />
                    </Link>
                )}
                <Link
                    href={href}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-foreground"
                    title="Abrir editor"
                >
                    <ExternalLink size={11} />
                </Link>
            </div>

            {actions && <div className="mt-2 pt-2 border-t border-border flex flex-wrap gap-1">{actions}</div>}
        </div>
    )
}

// ─── Coluna do kanban ─────────────────────────────────────────────────────────

function PipelineColumn({
    title, count, displayedCount, icon: Icon, color, children, emptyMsg, batchAction, allLink,
}: {
    title:          string
    count:          number
    displayedCount: number
    icon:           React.ElementType
    color:          string
    children:       React.ReactNode
    emptyMsg:       string
    batchAction?:   React.ReactNode
    allLink?:       string
}) {
    const colorMap: Record<string, { dot: string; label: string; header: string }> = {
        zinc:    { dot: 'bg-border',       label: 'text-muted',       header: 'border-border' },
        yellow:  { dot: 'bg-yellow-500',  label: 'text-yellow-400',  header: 'border-yellow-500/20' },
        emerald: { dot: 'bg-emerald-500', label: 'text-emerald-400', header: 'border-emerald-500/20' },
        red:     { dot: 'bg-red-500',     label: 'text-red-400',     header: 'border-red-500/20' },
    }
    const c = colorMap[color] ?? colorMap.zinc

    return (
        <div className="flex flex-col min-w-[260px] max-w-[300px] flex-shrink-0 lg:flex-1">
            {/* Header da coluna — sticky */}
            <div className={`sticky top-0 z-10 px-3 py-2.5 rounded-xl border mb-2 bg-surface ${c.header}`}>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                    <Icon size={13} className={c.label} />
                    <span className={`text-xs font-bold flex-1 ${c.label}`}>{title}</span>
                    <span className="text-[10px] font-black text-muted bg-surface px-2 py-0.5 rounded-full">{count.toLocaleString('pt-BR')}</span>
                </div>
                {batchAction && (
                    <div className="mt-1.5 pt-1.5 border-t border-border">
                        {batchAction}
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
                {count === 0 ? (
                    <div className="flex items-center justify-center py-12 text-center">
                        <p className="text-[11px] text-muted">{emptyMsg}</p>
                    </div>
                ) : children}
            </div>

            {/* "Ver mais" se há mais itens do que os exibidos */}
            {count > displayedCount && allLink && (
                <Link
                    href={allLink}
                    className="flex items-center justify-center gap-1 mt-2 py-1.5 text-[10px] text-muted hover:text-foreground transition-colors border-t border-border"
                >
                    <ChevronRight size={10} />
                    +{count - displayedCount} mais
                </Link>
            )}
        </div>
    )
}

// ─── Barra de saúde do pipeline ───────────────────────────────────────────────

function PipelineHealthBar({ stats }: {
    stats: { label: string; value: number; color: string; href: string; barColor?: string }[]
}) {
    const total = stats.reduce((s, a) => s + a.value, 0)

    return (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* Barra de progresso proporcional */}
            {total > 0 && (
                <div className="flex h-1">
                    {stats.map((s, i) => (
                        <div
                            key={i}
                            style={{ width: `${(s.value / total) * 100}%` }}
                            className={`${s.barColor ?? 'bg-border'} transition-all`}
                        />
                    ))}
                </div>
            )}
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                {stats.map((s, i) => (
                    <Link key={i} href={s.href} className="flex items-center gap-2 group">
                        <span className={`text-lg font-black ${s.color} group-hover:opacity-80 transition-opacity`}>{s.value.toLocaleString('pt-BR')}</span>
                        <span className="text-[11px] text-muted group-hover:text-foreground transition-colors">{s.label}</span>
                        {i < stats.length - 1 && <span className="text-muted ml-1">·</span>}
                    </Link>
                ))}
                <Link
                    href="/admin/pipeline"
                    className="ml-auto flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors"
                    title="Atualizar"
                >
                    <RefreshCw size={10} />
                    Atualizar
                </Link>
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

    // ── TAB: NOTÍCIAS ──────────────────────────────────────────────────────────

    if (tab === 'news') {
        const TAKE = 30

        const [
            drafts,             draftsCount,
            withoutTranslation, withoutTranslationCount,
            published,          publishedCount,
            hidden,             hiddenCount,
        ] = await Promise.all([
            prisma.news.findMany({
                where: { OR: [{ status: 'draft' }, { status: 'ready' }] },
                orderBy: { createdAt: 'desc' },
                take: TAKE,
                select: { id: true, title: true, imageUrl: true, source: true, status: true, createdAt: true },
            }),
            prisma.news.count({ where: { OR: [{ status: 'draft' }, { status: 'ready' }] } }),
            prisma.news.findMany({
                where: { status: 'published', isHidden: false, translationStatus: 'pending' },
                orderBy: { createdAt: 'desc' },
                take: TAKE,
                select: { id: true, title: true, imageUrl: true, source: true, createdAt: true },
            }),
            prisma.news.count({ where: { status: 'published', isHidden: false, translationStatus: 'pending' } }),
            prisma.news.findMany({
                where: { status: 'published', isHidden: false, translationStatus: 'completed' },
                orderBy: { publishedAt: 'desc' },
                take: 20,
                select: { id: true, title: true, imageUrl: true, source: true, publishedAt: true, createdAt: true },
            }),
            prisma.news.count({ where: { status: 'published', isHidden: false, translationStatus: 'completed' } }),
            prisma.news.findMany({
                where: { isHidden: true },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: { id: true, title: true, imageUrl: true, source: true, createdAt: true },
            }),
            prisma.news.count({ where: { isHidden: true } }),
        ])

        const healthStats = [
            { label: 'rascunhos',    value: draftsCount,             color: 'text-foreground',  href: '/admin/pipeline?tab=news', barColor: 'bg-zinc-600' },
            { label: 'sem tradução', value: withoutTranslationCount, color: 'text-yellow-400',  href: '/admin/pipeline?tab=news', barColor: 'bg-yellow-500' },
            { label: 'publicados',   value: publishedCount,          color: 'text-emerald-400', href: '/admin/pipeline?tab=news', barColor: 'bg-emerald-500' },
            { label: 'ocultos',      value: hiddenCount,             color: 'text-red-400',     href: '/admin/pipeline?tab=news', barColor: 'bg-red-500' },
        ]

        return (
            <AdminLayout title="Pipeline" subtitle="Fluxo de conteúdo — notícias, artistas e produções">
                <PipelineLayout tab={tab}>
                    <PipelineHealthBar stats={healthStats} />

                    <PageGuide
                        storageKey="pipeline-news"
                        title="Como funciona o Pipeline de Notícias"
                        description="Visualiza o ciclo de vida de cada notícia importada, do rascunho até ser publicada e traduzida. As colunas representam etapas — mova o item avançando as ações."
                        steps={[
                            { label: 'Importado / Rascunho', description: 'Notícia chegou do bot, ainda não publicada', color: 'zinc' },
                            { label: 'Publicar', description: 'Clique em "Publicar" para tornar visível', color: 'blue' },
                            { label: 'Sem tradução PT', description: 'Publicada mas sem versão em português', color: 'yellow' },
                            { label: 'Traduzir IA', description: 'Gera tradução automática via IA', color: 'purple' },
                            { label: 'Publicada', description: 'Traduzida e visível para o público', color: 'green' },
                        ]}
                        tips={[
                            { text: 'Use "Publicar todos" no cabeçalho da coluna para processar vários rascunhos de uma vez.' },
                            { text: 'O botão "Ocultar" nas notícias publicadas retira do ar sem apagar o conteúdo.' },
                            { text: 'Clique no ícone de link externo em qualquer card para abrir o editor completo.' },
                            { text: 'Aba Artistas: foco em bio/editorial via IA. Aba Produções: foco em sinopse.' },
                        ]}
                    />

                    <div className="flex gap-3 overflow-x-auto pb-4">

                        <PipelineColumn
                            title="Importado / Rascunho"
                            count={draftsCount}
                            displayedCount={drafts.length}
                            icon={Clock}
                            color="zinc"
                            emptyMsg="Nenhum rascunho"
                            allLink="/admin/news"
                            batchAction={
                                <PipelineBatchAction
                                    ids={drafts.map(n => n.id)}
                                    type="news"
                                    action="publish"
                                />
                            }
                        >
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
                            <ArrowRight size={16} className="text-muted" />
                        </div>

                        <PipelineColumn
                            title="Sem tradução PT-BR"
                            count={withoutTranslationCount}
                            displayedCount={withoutTranslation.length}
                            icon={Languages}
                            color="yellow"
                            emptyMsg="Tudo traduzido"
                            allLink="/admin/translations"
                            batchAction={
                                <PipelineBatchAction
                                    ids={withoutTranslation.map(n => n.id)}
                                    type="news"
                                    action="translate"
                                />
                            }
                        >
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
                            <ArrowRight size={16} className="text-muted" />
                        </div>

                        <PipelineColumn
                            title="Publicado"
                            count={publishedCount}
                            displayedCount={published.length}
                            icon={CheckCircle2}
                            color="emerald"
                            emptyMsg="Nenhum publicado"
                            allLink="/admin/news"
                        >
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
                                    actions={<PipelineActions id={n.id} type="news" action="hide" />}
                                />
                            ))}
                        </PipelineColumn>

                        <div className="flex items-start self-start mt-10 flex-shrink-0">
                            <ArrowRight size={16} className="text-muted" />
                        </div>

                        <PipelineColumn
                            title="Oculto"
                            count={hiddenCount}
                            displayedCount={hidden.length}
                            icon={EyeOff}
                            color="red"
                            emptyMsg="Nenhum oculto"
                        >
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
        const TAKE = 30

        const hasAllEditorial = {
            bio:              { not: null as null },
            analiseEditorial: { not: null as null },
            curiosidades:     { isEmpty: false },
        }

        const [
            noContent,  noContentCount,
            partial,    partialCount,
            enriched,   enrichedCount,
            curated,    curatedCount,
            hidden,     hiddenArtistCount,
        ] = await Promise.all([
            prisma.artist.findMany({
                where: {
                    isHidden: false, flaggedAsNonKorean: false,
                    bio: null, analiseEditorial: null,
                    OR: [{ curiosidades: { isEmpty: true } }, { curiosidades: { equals: null } }],
                },
                orderBy: { trendingScore: 'desc' },
                take: TAKE,
                select: { id: true, nameRomanized: true, primaryImageUrl: true, createdAt: true, bio: true, analiseEditorial: true, curiosidades: true },
            }),
            prisma.artist.count({
                where: {
                    isHidden: false, flaggedAsNonKorean: false,
                    bio: null, analiseEditorial: null,
                    OR: [{ curiosidades: { isEmpty: true } }, { curiosidades: { equals: null } }],
                },
            }),
            prisma.artist.findMany({
                where: {
                    isHidden: false, flaggedAsNonKorean: false,
                    NOT: hasAllEditorial,
                    OR: [{ bio: { not: null } }, { analiseEditorial: { not: null } }, { curiosidades: { isEmpty: false } }],
                },
                orderBy: { editorialGeneratedAt: 'desc' },
                take: TAKE,
                select: { id: true, nameRomanized: true, primaryImageUrl: true, createdAt: true, editorialGeneratedAt: true, bio: true, analiseEditorial: true, curiosidades: true },
            }),
            prisma.artist.count({
                where: {
                    isHidden: false, flaggedAsNonKorean: false,
                    NOT: hasAllEditorial,
                    OR: [{ bio: { not: null } }, { analiseEditorial: { not: null } }, { curiosidades: { isEmpty: false } }],
                },
            }),
            prisma.artist.findMany({
                where: {
                    isHidden: false, flaggedAsNonKorean: false,
                    ...hasAllEditorial,
                    editorialCuratedAt: null,
                },
                orderBy: { editorialGeneratedAt: 'desc' },
                take: TAKE,
                select: { id: true, nameRomanized: true, primaryImageUrl: true, createdAt: true, editorialGeneratedAt: true },
            }),
            prisma.artist.count({
                where: {
                    isHidden: false, flaggedAsNonKorean: false,
                    ...hasAllEditorial,
                    editorialCuratedAt: null,
                },
            }),
            prisma.artist.findMany({
                where: { isHidden: false, flaggedAsNonKorean: false, editorialCuratedAt: { not: null } },
                orderBy: { editorialCuratedAt: 'desc' },
                take: 20,
                select: { id: true, nameRomanized: true, primaryImageUrl: true, createdAt: true, editorialCuratedAt: true },
            }),
            prisma.artist.count({
                where: { isHidden: false, flaggedAsNonKorean: false, editorialCuratedAt: { not: null } },
            }),
            prisma.artist.findMany({
                where: { isHidden: true },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: { id: true, nameRomanized: true, primaryImageUrl: true, createdAt: true },
            }),
            prisma.artist.count({ where: { isHidden: true } }),
        ])

        const editorialSubtitle = (a: { bio: string | null; analiseEditorial: string | null; curiosidades: string[] }) =>
            [
                a.bio ? '✓ bio' : '✗ bio',
                a.analiseEditorial ? '✓ editorial' : '✗ editorial',
                a.curiosidades?.length ? '✓ curiosidades' : '✗ curiosidades',
            ].join(' · ')

        const healthStats = [
            { label: 'sem conteúdo',      value: noContentCount,  color: 'text-foreground',  href: '/admin/pipeline?tab=artists', barColor: 'bg-zinc-600' },
            { label: 'incompletos',       value: partialCount,    color: 'text-muted',       href: '/admin/pipeline?tab=artists', barColor: 'bg-zinc-500' },
            { label: 'aguard. curadoria', value: enrichedCount,   color: 'text-yellow-400',  href: '/admin/pipeline?tab=artists', barColor: 'bg-yellow-500' },
            { label: 'curados',           value: curatedCount,    color: 'text-emerald-400', href: '/admin/pipeline?tab=artists', barColor: 'bg-emerald-500' },
        ]

        return (
            <AdminLayout title="Pipeline" subtitle="Fluxo editorial — artistas">
                <PipelineLayout tab={tab}>
                    <PipelineHealthBar stats={healthStats} />

                    <PageGuide
                        storageKey="pipeline-artists"
                        title="Como funciona o Pipeline de Artistas"
                        description="Acompanha o enriquecimento editorial de cada artista: da chegada sem conteúdo até ser curado manualmente com bio, projetos e curiosidades em português."
                        steps={[
                            { label: 'Sem conteúdo', description: 'Artista importado sem bio ou editorial', color: 'zinc' },
                            { label: 'Enriquecer IA', description: 'Gera bio, projetos e curiosidades com IA', color: 'purple' },
                            { label: 'Aguard. curadoria', description: 'IA gerou, aguarda revisão humana', color: 'yellow' },
                            { label: 'Curado', description: 'Revisado e aprovado pelo editor', color: 'green' },
                            { label: 'Oculto', description: 'Artista não-coreano ou flagado', color: 'red' },
                        ]}
                        tips={[
                            { text: 'Use "Enriquecer todos" para processar a fila de sem-conteúdo em lote — cada artista leva ~10s.' },
                            { text: 'Artistas ocultos ficam no banco mas não aparecem no site — use "Tornar visível" para reativar.' },
                            { text: 'Após enriquecimento, o artista vai para "Aguard. curadoria" — revise no editor antes de publicar.' },
                        ]}
                    />

                    <div className="flex gap-3 overflow-x-auto pb-4">

                        <PipelineColumn
                            title="Sem conteúdo"
                            count={noContentCount}
                            displayedCount={noContent.length}
                            icon={Sparkles}
                            color="zinc"
                            emptyMsg="Todos têm conteúdo"
                            allLink="/admin/enrichment?tab=artists"
                            batchAction={
                                <PipelineBatchAction
                                    ids={noContent.map(a => a.id)}
                                    type="artist"
                                    action="enrich"
                                />
                            }
                        >
                            {noContent.map(a => (
                                <PipelineCard
                                    key={a.id}
                                    title={a.nameRomanized}
                                    subtitle={editorialSubtitle(a)}
                                    imageUrl={a.primaryImageUrl}
                                    time={a.createdAt}
                                    href={`/admin/artists/${a.id}`}
                                    tag="vazio"
                                    tagColor="draft"
                                    actions={<PipelineActions id={a.id} type="artist" action="enrich" />}
                                />
                            ))}
                        </PipelineColumn>

                        <div className="flex items-start self-start mt-10 flex-shrink-0">
                            <ArrowRight size={16} className="text-muted" />
                        </div>

                        <PipelineColumn
                            title="Incompleto"
                            count={partialCount}
                            displayedCount={partial.length}
                            icon={Clock}
                            color="zinc"
                            emptyMsg="Nenhum parcial"
                            allLink="/admin/enrichment?tab=artists"
                            batchAction={
                                <PipelineBatchAction
                                    ids={partial.map(a => a.id)}
                                    type="artist"
                                    action="enrich"
                                />
                            }
                        >
                            {partial.map(a => (
                                <PipelineCard
                                    key={a.id}
                                    title={a.nameRomanized}
                                    subtitle={editorialSubtitle(a)}
                                    imageUrl={a.primaryImageUrl}
                                    time={a.editorialGeneratedAt ?? a.createdAt}
                                    href={`/admin/artists/${a.id}`}
                                    tag="parcial"
                                    tagColor="draft"
                                    actions={<PipelineActions id={a.id} type="artist" action="enrich" />}
                                />
                            ))}
                        </PipelineColumn>

                        <div className="flex items-start self-start mt-10 flex-shrink-0">
                            <ArrowRight size={16} className="text-muted" />
                        </div>

                        <PipelineColumn
                            title="Aguardando curadoria"
                            count={enrichedCount}
                            displayedCount={enriched.length}
                            icon={PenLine}
                            color="yellow"
                            emptyMsg="Nenhum aguardando"
                            allLink="/admin/enrichment?tab=artists"
                        >
                            {enriched.map(a => (
                                <PipelineCard
                                    key={a.id}
                                    title={a.nameRomanized}
                                    subtitle="bio · editorial · curiosidades ✓"
                                    imageUrl={a.primaryImageUrl}
                                    time={a.editorialGeneratedAt ?? a.createdAt}
                                    href={`/admin/enrichment?q=${encodeURIComponent(a.nameRomanized)}`}
                                    tag="curar"
                                    tagColor="pending"
                                    actions={
                                        <Link
                                            href={`/artists/${a.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors"
                                        >
                                            <ExternalLink size={9} />
                                            Ver perfil público
                                        </Link>
                                    }
                                />
                            ))}
                        </PipelineColumn>

                        <div className="flex items-start self-start mt-10 flex-shrink-0">
                            <ArrowRight size={16} className="text-muted" />
                        </div>

                        <PipelineColumn
                            title="Curado"
                            count={curatedCount}
                            displayedCount={curated.length}
                            icon={ShieldCheck}
                            color="emerald"
                            emptyMsg="Nenhum curado ainda"
                            allLink="/admin/artists"
                        >
                            {curated.map(a => (
                                <PipelineCard
                                    key={a.id}
                                    title={a.nameRomanized}
                                    imageUrl={a.primaryImageUrl}
                                    time={a.editorialCuratedAt ?? a.createdAt}
                                    href={`/admin/artists/${a.id}`}
                                    tag="curado"
                                    tagColor="done"
                                />
                            ))}
                        </PipelineColumn>

                        <div className="flex items-start self-start mt-10 flex-shrink-0">
                            <ArrowRight size={16} className="text-muted" />
                        </div>

                        <PipelineColumn
                            title="Oculto"
                            count={hiddenArtistCount}
                            displayedCount={hidden.length}
                            icon={EyeOff}
                            color="red"
                            emptyMsg="Nenhum oculto"
                            allLink="/admin/artists/visibility"
                        >
                            {hidden.map(a => (
                                <PipelineCard
                                    key={a.id}
                                    title={a.nameRomanized}
                                    imageUrl={a.primaryImageUrl}
                                    time={a.createdAt}
                                    href={`/admin/artists/${a.id}`}
                                    tag="oculto"
                                    tagColor="hidden"
                                    actions={<PipelineActions id={a.id} type="artist" action="show" />}
                                />
                            ))}
                        </PipelineColumn>
                    </div>
                </PipelineLayout>
            </AdminLayout>
        )
    }

    // ── TAB: PRODUÇÕES ─────────────────────────────────────────────────────────

    const TAKE = 30

    const [
        pendingCuration,    pendingCurationCount,
        withoutSynopsis,    withoutSynopsisCount,
        withoutTranslation, withoutTranslationProdCount,
        complete,           completeCount,
        hidden,             hiddenProdCount,
    ] = await Promise.all([
        prisma.production.findMany({
            where: { needsCuration: true, flaggedAsNonKorean: false },
            orderBy: { createdAt: 'desc' },
            take: TAKE,
            select: { id: true, titlePt: true, imageUrl: true, type: true, year: true, createdAt: true },
        }),
        prisma.production.count({ where: { needsCuration: true, flaggedAsNonKorean: false } }),
        prisma.production.findMany({
            where: {
                synopsis: null,
                flaggedAsNonKorean: false,
                needsCuration: false,
                translationStatus: { not: 'skipped' },
                // OR explícito para excluir adulto=true mas incluir null/false (campo nullable)
                OR: [{ isAdultContent: null }, { isAdultContent: false }],
            },
            orderBy: { voteAverage: 'desc' },
            take: TAKE,
            select: { id: true, titlePt: true, imageUrl: true, type: true, year: true, createdAt: true },
        }),
        prisma.production.count({
            where: {
                synopsis: null,
                flaggedAsNonKorean: false,
                needsCuration: false,
                translationStatus: { not: 'skipped' },
                OR: [{ isAdultContent: null }, { isAdultContent: false }],
            },
        }),
        prisma.production.findMany({
            where: {
                synopsis: { not: null },
                needsCuration: false,
                flaggedAsNonKorean: false,
                translationStatus: 'pending',
                OR: [{ isAdultContent: null }, { isAdultContent: false }],
            },
            orderBy: { createdAt: 'desc' },
            take: TAKE,
            select: { id: true, titlePt: true, imageUrl: true, type: true, year: true, createdAt: true },
        }),
        prisma.production.count({
            where: {
                synopsis: { not: null },
                needsCuration: false,
                flaggedAsNonKorean: false,
                translationStatus: 'pending',
                OR: [{ isAdultContent: null }, { isAdultContent: false }],
            },
        }),
        prisma.production.findMany({
            where: { synopsis: { not: null }, isHidden: false, translationStatus: 'completed' },
            orderBy: { updatedAt: 'desc' },
            take: 20,
            select: { id: true, titlePt: true, imageUrl: true, type: true, year: true, createdAt: true },
        }),
        prisma.production.count({ where: { synopsis: { not: null }, isHidden: false, translationStatus: 'completed' } }),
        prisma.production.findMany({
            where: { isHidden: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: { id: true, titlePt: true, imageUrl: true, type: true, year: true, createdAt: true },
        }),
        prisma.production.count({ where: { isHidden: true } }),
    ])

    const healthStats = [
        { label: 'curadoria',    value: pendingCurationCount,        color: 'text-orange-400',  href: '/admin/pipeline?tab=productions', barColor: 'bg-orange-500' },
        { label: 'sem sinopse',  value: withoutSynopsisCount,        color: 'text-foreground',  href: '/admin/pipeline?tab=productions', barColor: 'bg-zinc-600' },
        { label: 'sem tradução', value: withoutTranslationProdCount, color: 'text-yellow-400',  href: '/admin/pipeline?tab=productions', barColor: 'bg-yellow-500' },
        { label: 'completas',    value: completeCount,               color: 'text-emerald-400', href: '/admin/pipeline?tab=productions', barColor: 'bg-emerald-500' },
        { label: 'ocultas',      value: hiddenProdCount,             color: 'text-red-400',     href: '/admin/pipeline?tab=productions', barColor: 'bg-red-500' },
    ]

    return (
        <AdminLayout title="Pipeline" subtitle="Fluxo de conteúdo — produções">
            <PipelineLayout tab={tab}>
                <PipelineHealthBar stats={healthStats} />

                <PageGuide
                    storageKey="pipeline-productions"
                    title="Como funciona o Pipeline de Produções"
                    description="Mostra o estado das produções (dramas, filmes, varieties) em relação a sinopse e tradução. O objetivo é garantir que todas as produções visíveis tenham sinopse em português."
                    steps={[
                        { label: 'Aguard. curadoria', description: 'Novo import — revisar antes de publicar', color: 'orange' },
                        { label: 'Sem sinopse', description: 'Produção importada sem descrição', color: 'zinc' },
                        { label: 'Enriquecer IA', description: 'Gera sinopse automática via IA', color: 'purple' },
                        { label: 'Sem tradução PT', description: 'Sinopse existe mas só em inglês/coreano', color: 'yellow' },
                        { label: 'Traduzir IA', description: 'Traduz a sinopse para português', color: 'blue' },
                        { label: 'Completa', description: 'Sinopse traduzida, pronta para o público', color: 'green' },
                    ]}
                    tips={[
                        { text: 'Produções "sem sinopse" excluem as flagradas como não-coreanas e as com tradução marcada como skipped.' },
                        { text: 'Use "Enriquecer todos" para disparar geração de sinopse em lote — ideal para acertar o backlog.' },
                        { text: 'Produções ocultas não aparecem no site — use "Tornar visível" para reativar individualmente.' },
                    ]}
                />

                <div className="flex gap-3 overflow-x-auto pb-4">

                    <PipelineColumn
                        title="Aguard. curadoria"
                        count={pendingCurationCount}
                        displayedCount={pendingCuration.length}
                        icon={ShieldCheck}
                        color="yellow"
                        emptyMsg="Nenhuma aguardando curadoria"
                        allLink="/admin/productions"
                    >
                        {pendingCuration.map(p => (
                            <PipelineCard
                                key={p.id}
                                title={p.titlePt}
                                subtitle={[p.type, p.year?.toString()].filter(Boolean).join(' · ')}
                                imageUrl={p.imageUrl}
                                time={p.createdAt}
                                href={`/admin/productions/${p.id}`}
                                publicHref={`/productions/${p.id}`}
                                tag="curadoria"
                                tagColor="pending"
                                actions={
                                    <div className="flex gap-1 flex-wrap">
                                        <PipelineActions id={p.id} type="production" action="approve" />
                                        <PipelineActions id={p.id} type="production" action="flagAdult" />
                                        <PipelineActions id={p.id} type="production" action="flagNonKorean" />
                                    </div>
                                }
                            />
                        ))}
                    </PipelineColumn>

                    <div className="flex items-start self-start mt-10 flex-shrink-0">
                        <ArrowRight size={16} className="text-muted" />
                    </div>

                    <PipelineColumn
                        title="Sem sinopse"
                        count={withoutSynopsisCount}
                        displayedCount={withoutSynopsis.length}
                        icon={Sparkles}
                        color="zinc"
                        emptyMsg="Todas com sinopse"
                        allLink="/admin/enrichment?tab=productions"
                        batchAction={
                            <PipelineBatchAction
                                ids={withoutSynopsis.map(p => p.id)}
                                type="production"
                                action="enrich"
                            />
                        }
                    >
                        {withoutSynopsis.map(p => (
                            <PipelineCard
                                key={p.id}
                                title={p.titlePt}
                                subtitle={[p.type, p.year?.toString()].filter(Boolean).join(' · ')}
                                imageUrl={p.imageUrl}
                                time={p.createdAt}
                                href={`/admin/productions/${p.id}`}
                                publicHref={`/productions/${p.id}`}
                                tag="sem sinopse"
                                tagColor="draft"
                                actions={<PipelineActions id={p.id} type="production" action="enrich" />}
                            />
                        ))}
                    </PipelineColumn>

                    <div className="flex items-start self-start mt-10 flex-shrink-0">
                        <ArrowRight size={16} className="text-muted" />
                    </div>

                    <PipelineColumn
                        title="Sem tradução PT-BR"
                        count={withoutTranslationProdCount}
                        displayedCount={withoutTranslation.length}
                        icon={Languages}
                        color="yellow"
                        emptyMsg="Tudo traduzido"
                        allLink="/admin/translations"
                        batchAction={
                            <PipelineBatchAction
                                ids={withoutTranslation.map(p => p.id)}
                                type="production"
                                action="translate"
                            />
                        }
                    >
                        {withoutTranslation.map(p => (
                            <PipelineCard
                                key={p.id}
                                title={p.titlePt}
                                subtitle={[p.type, p.year?.toString()].filter(Boolean).join(' · ')}
                                imageUrl={p.imageUrl}
                                time={p.createdAt}
                                href={`/admin/productions/${p.id}`}
                                publicHref={`/productions/${p.id}`}
                                tag="sem tradução"
                                tagColor="pending"
                                actions={<PipelineActions id={p.id} type="production" action="translate" />}
                            />
                        ))}
                    </PipelineColumn>

                    <div className="flex items-start self-start mt-10 flex-shrink-0">
                        <ArrowRight size={16} className="text-muted" />
                    </div>

                    <PipelineColumn
                        title="Completo"
                        count={completeCount}
                        displayedCount={complete.length}
                        icon={CheckCircle2}
                        color="emerald"
                        emptyMsg="Nenhum completo ainda"
                        allLink="/admin/productions"
                    >
                        {complete.map(p => (
                            <PipelineCard
                                key={p.id}
                                title={p.titlePt}
                                subtitle={[p.type, p.year?.toString()].filter(Boolean).join(' · ')}
                                imageUrl={p.imageUrl}
                                time={p.createdAt}
                                href={`/admin/productions/${p.id}`}
                                publicHref={`/productions/${p.id}`}
                                tag="completo"
                                tagColor="done"
                            />
                        ))}
                    </PipelineColumn>

                    <div className="flex items-start self-start mt-10 flex-shrink-0">
                        <ArrowRight size={16} className="text-muted" />
                    </div>

                    <PipelineColumn
                        title="Oculto"
                        count={hiddenProdCount}
                        displayedCount={hidden.length}
                        icon={EyeOff}
                        color="red"
                        emptyMsg="Nenhum oculto"
                        allLink="/admin/hidden"
                    >
                        {hidden.map(p => (
                            <PipelineCard
                                key={p.id}
                                title={p.titlePt}
                                subtitle={[p.type, p.year?.toString()].filter(Boolean).join(' · ')}
                                imageUrl={p.imageUrl}
                                time={p.createdAt}
                                href={`/admin/productions/${p.id}`}
                                publicHref={`/productions/${p.id}`}
                                tag="oculto"
                                tagColor="hidden"
                                actions={<PipelineActions id={p.id} type="production" action="show" />}
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
        { value: 'news' as const,        label: 'Notícias',   icon: Newspaper },
        { value: 'artists' as const,     label: 'Artistas',   icon: Mic2 },
        { value: 'productions' as const, label: 'Produções',  icon: Film },
    ]

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1 w-fit">
                {tabs.map(t => (
                    <Link
                        key={t.value}
                        href={`/admin/pipeline?tab=${t.value}`}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            tab === t.value
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]'
                                : 'text-muted hover:text-foreground'
                        }`}
                    >
                        <t.icon size={12} />
                        {t.label}
                    </Link>
                ))}
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-4 text-[10px] text-muted">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-border" />Pendente</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" />Aguardando ação</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Completo / Curado</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Oculto</span>
                <span className="ml-auto text-muted">Role horizontalmente para ver todas as colunas →</span>
            </div>

            {/* Conteúdo (health bar + kanban) */}
            {children}
        </div>
    )
}
