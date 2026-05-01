import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ShareButtons } from '@/components/ui/ShareButtons'
import { Star, Film, Tv, ExternalLink } from 'lucide-react'
import { SITE_URL } from '@/lib/constants/site'

export const dynamic = 'force-dynamic'

interface ListicleConfig {
    title: string
    description: string
    metaDesc: string
    where: Prisma.ProductionWhereInput
    intro: string
}

const CONFIGS: Record<string, ListicleConfig> = {
    netflix: {
        title: 'Melhores K-Dramas da Netflix',
        description: 'Os dramas coreanos mais assistidos e bem avaliados disponíveis na Netflix.',
        metaDesc: 'Descubra os melhores K-Dramas coreanos disponíveis na Netflix Brasil. Lista atualizada com os dramas mais bem avaliados e populares.',
        where: { isHidden: false, type: 'tv', network: { contains: 'Netflix', mode: 'insensitive' } },
        intro: 'A Netflix se tornou uma das principais plataformas para assistir K-Dramas fora da Coreia. Com uma biblioteca cada vez maior de produções coreanas, reunimos os títulos mais bem avaliados e aclamados disponíveis na plataforma.',
    },
    romance: {
        title: 'Melhores K-Dramas de Romance',
        description: 'Os dramas coreanos de romance mais amados pelos fãs.',
        metaDesc: 'Lista dos melhores K-Dramas de romance de todos os tempos. Histórias de amor coreanas que vão fazer seu coração acelerar.',
        where: { isHidden: false, type: 'tv', tags: { has: 'romance' } },
        intro: `O romance é o coração do K-Drama. As histórias de amor coreanas têm um charme único — da tensão "will-they-won't-they" às cenas de confissão épicas. Aqui estão os dramas de romance mais amados pelos fãs ao redor do mundo.`,
    },
    acao: {
        title: 'Melhores K-Dramas de Ação',
        description: 'K-Dramas cheios de adrenalina, ação e reviravoltas.',
        metaDesc: 'Os melhores K-Dramas de ação: thrillers, espionagem e reviravoltas que vão te prender à tela.',
        where: { isHidden: false, type: 'tv', tags: { has: 'ação' } },
        intro: 'Os K-Dramas de ação e thriller são conhecidos por suas tramas complexas, personagens bem construídos e sequências de ação que rivalizam com produções de Hollywood. Prepare-se para maratonar.',
    },
    classicos: {
        title: 'K-Dramas Clássicos Essenciais',
        description: 'Os K-Dramas históricos que definiram o gênero e são obrigatórios para qualquer fã.',
        metaDesc: 'Conheça os K-Dramas clássicos que todo fã deve assistir. As produções que moldaram a cultura Hallyu.',
        where: { isHidden: false, type: 'tv', year: { lte: 2015 }, voteAverage: { gte: 7.5 } },
        intro: 'Antes de BTS e BLACKPINK dominarem o mundo, os K-Dramas já conquistavam corações ao redor do globo. Estes são os clássicos que moldaram o gênero e continuam sendo referências absolutas.',
    },
    filmes: {
        title: 'Melhores Filmes Coreanos',
        description: 'Os filmes coreanos mais aclamados da história.',
        metaDesc: 'Os melhores filmes coreanos de todos os tempos, incluindo vencedores do Oscar e Palma de Ouro.',
        where: { isHidden: false, type: 'movie', voteAverage: { gte: 7 } },
        intro: 'O cinema coreano ganhou reconhecimento mundial com "Parasita" (2020), primeiro filme não em inglês a vencer o Oscar de Melhor Filme. Mas essa tradição de qualidade vem de décadas de produções extraordinárias.',
    },
}

export async function generateMetadata(props: { params: Promise<{ tipo: string }> }): Promise<Metadata> {
    const { tipo } = await props.params
    const config = CONFIGS[tipo]
    if (!config) return {}
    return {
        title: `${config.title} | HallyuHub`,
        description: config.metaDesc,
        openGraph: {
            title: config.title,
            description: config.metaDesc,
        },
    }
}

export default async function ListiclePage(props: { params: Promise<{ tipo: string }> }) {
    const { tipo } = await props.params
    const config = CONFIGS[tipo]
    if (!config) notFound()

    const productions = await prisma.production.findMany({
        where: config.where,
        select: {
            id: true, slug: true, titlePt: true, titleKr: true,
            imageUrl: true, backdropUrl: true, year: true,
            voteAverage: true, synopsis: true, network: true,
            episodeCount: true, type: true,
        },
        orderBy: { voteAverage: 'desc' },
        take: 20,
    })

    const pageUrl = `${SITE_URL}/melhores-dramas/${tipo}`

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
                <Breadcrumbs
                    items={[{ label: 'Melhores Dramas', href: '/melhores-dramas' }, { label: config.title }]}
                    className="mb-6"
                />

                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-3">
                        {config.title}
                    </h1>
                    <p className="text-muted text-base leading-relaxed mb-6 max-w-2xl">
                        {config.intro}
                    </p>
                    <ShareButtons title={config.title} url={pageUrl} />
                </header>

                {/* List */}
                {productions.length === 0 ? (
                    <div className="text-center py-16 text-muted">
                        <Film className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="font-semibold">Nenhuma produção encontrada ainda.</p>
                    </div>
                ) : (
                    <ol className="space-y-6">
                        {productions.map((p, i) => (
                            <li key={p.id}>
                                <Link
                                    href={`/productions/${p.slug ?? p.id}`}
                                    className="group flex gap-4 md:gap-6 p-4 rounded-2xl border border-border bg-surface hover:border-accent/30 hover:bg-accent/5 transition-all"
                                >
                                    {/* Rank number */}
                                    <div className="flex-shrink-0 w-8 text-center pt-1">
                                        <span className={`text-2xl font-black ${i < 3 ? 'text-accent' : 'text-muted/50'}`}>
                                            {i + 1}
                                        </span>
                                    </div>

                                    {/* Poster */}
                                    <div className="relative flex-shrink-0 w-20 md:w-24 h-28 md:h-32 rounded-xl overflow-hidden bg-surface-hover">
                                        {p.imageUrl ? (
                                            <Image
                                                src={p.imageUrl}
                                                alt={p.titlePt}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {p.type === 'movie'
                                                    ? <Film className="w-8 h-8 text-muted/30" />
                                                    : <Tv className="w-8 h-8 text-muted/30" />}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div>
                                                <h2 className="font-black text-foreground text-base md:text-lg leading-tight group-hover:text-accent transition-colors">
                                                    {p.titlePt}
                                                </h2>
                                                {p.titleKr && (
                                                    <p className="text-xs text-muted mt-0.5">{p.titleKr}</p>
                                                )}
                                            </div>
                                            {p.voteAverage && p.voteAverage > 0 && (
                                                <div className="flex items-center gap-1 flex-shrink-0 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1">
                                                    <Star className="w-3 h-3 text-amber-400" />
                                                    <span className="text-xs font-bold text-amber-400">
                                                        {p.voteAverage.toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {p.year && (
                                                <span className="text-[10px] font-bold text-muted bg-surface-hover border border-border rounded-full px-2 py-0.5">
                                                    {p.year}
                                                </span>
                                            )}
                                            {p.network && (
                                                <span className="text-[10px] font-bold text-accent bg-accent/10 border border-accent/20 rounded-full px-2 py-0.5">
                                                    {p.network}
                                                </span>
                                            )}
                                            {p.episodeCount && (
                                                <span className="text-[10px] font-bold text-muted bg-surface-hover border border-border rounded-full px-2 py-0.5">
                                                    {p.episodeCount} eps
                                                </span>
                                            )}
                                        </div>

                                        {p.synopsis && (
                                            <p className="text-xs text-muted leading-relaxed line-clamp-2 hidden md:block">
                                                {p.synopsis}
                                            </p>
                                        )}
                                    </div>

                                    <ExternalLink className="w-4 h-4 text-muted opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0 mt-1" />
                                </Link>
                            </li>
                        ))}
                    </ol>
                )}

                {/* Bottom share */}
                <div className="mt-12 pt-8 border-t border-border">
                    <p className="text-sm text-muted mb-4">Gostou da lista? Compartilhe com seus amigos!</p>
                    <ShareButtons title={config.title} url={pageUrl} />
                </div>
            </div>
        </div>
    )
}
