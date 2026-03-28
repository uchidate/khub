export const dynamic = 'force-dynamic'

import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { PageTransition } from "@/components/features/PageTransition"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import { ExternalLink, Users, Music2, Building2, Calendar } from "lucide-react"
import { SITE_URL } from "@/lib/constants/site"

export const metadata: Metadata = {
    title: 'Agências K-pop',
    description: 'Conheça as principais empresas de entretenimento coreano: HYBE, SM Entertainment, JYP, YG e mais.',
    keywords: 'agências k-pop, HYBE, SM Entertainment, JYP Entertainment, YG Entertainment, empresas k-pop, entretenimento coreano',
    alternates: { canonical: `${SITE_URL}/agencies` },
    openGraph: {
        title: 'Agências K-pop | HallyuHub',
        description: 'Conheça as principais empresas de entretenimento coreano: HYBE, SM Entertainment, JYP, YG e mais.',
        url: `${SITE_URL}/agencies`,
        type: 'website',
    },
}

const TYPE_LABEL: Record<string, string> = {
    MAJOR: 'Grande Agência',
    INDIE: 'Independente',
    SUBSIDIARY: 'Sub-label',
}

const TYPE_STYLE: Record<string, string> = {
    MAJOR: 'bg-amber-400/10 text-amber-600 border-amber-400/20',
    INDIE: 'bg-blue-400/10 text-blue-600 border-blue-400/20',
    SUBSIDIARY: 'bg-violet-400/10 text-violet-600 border-violet-400/20',
}

async function getAgencies(showAll: boolean) {
    return prisma.agency.findMany({
        where: showAll ? undefined : { isVerified: true },
        include: {
            artists: {
                where: { isHidden: false, flaggedAsNonKorean: false },
                select: { id: true, nameRomanized: true, primaryImageUrl: true },
                take: 6,
                orderBy: { trendingScore: 'desc' },
            },
            musicalGroups: {
                select: { id: true, name: true, profileImageUrl: true, disbandDate: true, trendingScore: true },
                take: 5,
                orderBy: { trendingScore: 'desc' },
            },
            parent: { select: { id: true, name: true } },
            _count: { select: { artists: true, musicalGroups: true, subsidiaries: true } },
        },
        orderBy: [
            { type: 'asc' },
            { musicalGroups: { _count: 'desc' } },
            { artists: { _count: 'desc' } },
        ],
    })
}

export default async function AgenciesPage({
    searchParams,
}: {
    searchParams: Promise<{ all?: string }>
}) {
    const { all } = await searchParams
    const showAll = all === '1'
    const agencies = await getAgencies(showAll).catch(() => [])

    const majorAgencies = agencies.filter(a => a.type === 'MAJOR')
    const indieAgencies  = agencies.filter(a => a.type === 'INDIE')
    const subAgencies    = agencies.filter(a => a.type === 'SUBSIDIARY')
    const otherAgencies  = agencies.filter(a => !['MAJOR','INDIE','SUBSIDIARY'].includes(a.type))

    const sections: { title: string; description: string; items: typeof agencies }[] = []
    if (majorAgencies.length > 0)
        sections.push({ title: 'Grandes Agências', description: 'As "Big Three" e outras potências do entretenimento coreano', items: majorAgencies })
    if (subAgencies.length > 0)
        sections.push({ title: 'Sub-labels', description: 'Divisões e labels subsidiárias das grandes agências', items: subAgencies })
    if (indieAgencies.length > 0)
        sections.push({ title: 'Agências Independentes', description: 'Empresas menores com artistas de destaque', items: indieAgencies })
    if (otherAgencies.length > 0)
        sections.push({ title: 'Outros', description: '', items: otherAgencies })

    const totalAgencies = await prisma.agency.count()
    const verifiedCount = await prisma.agency.count({ where: { isVerified: true } })

    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                name: 'Agências K-pop',
                url: `${SITE_URL}/agencies`,
                numberOfItems: agencies.length,
                itemListElement: agencies.slice(0, 20).map((a, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    item: {
                        '@type': 'Organization',
                        name: a.name,
                        url: `${SITE_URL}/agencies/${a.id}`,
                        ...(a.website ? { sameAs: a.website } : {}),
                    },
                })),
            }} />

            <PageTransition className="pb-20 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">

                {/* Header */}
                <div className="py-10 md:py-14 border-b border-border mb-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-bold text-accent uppercase tracking-[0.15em] mb-2">
                                Entretenimento Coreano
                            </p>
                            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-3">
                                Agências
                            </h1>
                            <p className="text-muted text-base max-w-xl">
                                As empresas que moldam o universo K-pop e K-drama — dos grupos icônicos aos artistas solo mais influentes.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="text-center px-4 py-2 rounded-xl bg-surface border border-border">
                                <p className="text-2xl font-black text-foreground">{verifiedCount}</p>
                                <p className="text-[10px] text-muted uppercase tracking-widest font-bold">verificadas</p>
                            </div>
                            <div className="text-center px-4 py-2 rounded-xl bg-surface border border-border">
                                <p className="text-2xl font-black text-foreground">{totalAgencies}</p>
                                <p className="text-[10px] text-muted uppercase tracking-widest font-bold">total</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter toggle */}
                <div className="flex items-center gap-2 mb-10">
                    <Link
                        href="/agencies"
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${!showAll ? 'bg-foreground text-background border-foreground' : 'text-muted border-border hover:border-foreground/30 hover:text-foreground'}`}
                    >
                        Verificadas ({verifiedCount})
                    </Link>
                    <Link
                        href="/agencies?all=1"
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${showAll ? 'bg-foreground text-background border-foreground' : 'text-muted border-border hover:border-foreground/30 hover:text-foreground'}`}
                    >
                        Todas ({totalAgencies})
                    </Link>
                </div>

                {/* Sections */}
                <div className="space-y-14">
                    {sections.map(section => (
                        <section key={section.title}>
                            <div className="mb-6">
                                <h2 className="text-lg font-black text-foreground tracking-tight">{section.title}</h2>
                                {section.description && (
                                    <p className="text-sm text-muted mt-0.5">{section.description}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {section.items.map(agency => (
                                    <AgencyCard key={agency.id} agency={agency} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {!showAll && totalAgencies > verifiedCount && (
                    <div className="mt-12 text-center">
                        <Link
                            href="/agencies?all=1"
                            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
                        >
                            <Building2 size={14} />
                            Ver todas as {totalAgencies} agências cadastradas
                        </Link>
                    </div>
                )}

                <ScrollToTop />
            </PageTransition>
        </>
    )
}

function AgencyCard({ agency }: { agency: Awaited<ReturnType<typeof getAgencies>>[0] }) {
    const accent = agency.accentColor ?? '#6b7280'
    const activeGroups = agency.musicalGroups.filter(g => !g.disbandDate)
    const disbandedGroups = agency.musicalGroups.filter(g => !!g.disbandDate)
    const sortedGroups = [...activeGroups, ...disbandedGroups]

    return (
        <Link
            href={`/agencies/${agency.id}`}
            className="group flex flex-col rounded-2xl border border-border bg-surface hover:border-[var(--accent-color)]/40 hover:shadow-md transition-all overflow-hidden"
            style={{ '--accent-color': accent } as React.CSSProperties}
        >
            {/* Accent stripe */}
            <div className="h-1 w-full" style={{ backgroundColor: accent }} />

            <div className="p-6 flex flex-col gap-4 flex-1">

                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-[15px] font-black text-foreground group-hover:text-[var(--accent-color)] transition-colors leading-tight">
                                {agency.name}
                            </h3>
                            {agency.isVerified && (
                                <span
                                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center"
                                    style={{ backgroundColor: accent }}
                                    title="Agência verificada"
                                >
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                        <path d="M1.5 4L3.2 5.7L6.5 2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {agency.type && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_STYLE[agency.type] ?? 'text-muted border-border'}`}>
                                    {TYPE_LABEL[agency.type] ?? agency.type}
                                </span>
                            )}
                            {agency.foundedYear && (
                                <span className="text-[11px] text-muted flex items-center gap-1">
                                    <Calendar size={10} />
                                    {agency.foundedYear}
                                </span>
                            )}
                            {agency.parent && (
                                <span className="text-[10px] text-muted">
                                    via {agency.parent.name}
                                </span>
                            )}
                        </div>
                    </div>
                    {agency.website && (
                        <a
                            href={agency.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="shrink-0 text-muted hover:text-foreground transition-colors"
                        >
                            <ExternalLink size={13} />
                        </a>
                    )}
                </div>

                {/* Description */}
                {agency.description && (
                    <p className="text-[12px] text-muted leading-relaxed line-clamp-2">
                        {agency.description}
                    </p>
                )}

                {/* Groups */}
                {sortedGroups.length > 0 && (
                    <div>
                        <p className="text-[9px] font-bold text-muted uppercase tracking-[0.12em] mb-2">
                            Grupos
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {sortedGroups.slice(0, 5).map(g => (
                                <span
                                    key={g.id}
                                    className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                        g.disbandDate
                                            ? 'text-muted border-border bg-transparent'
                                            : 'border-[var(--accent-color)]/30'
                                    }`}
                                    style={!g.disbandDate ? { color: accent, backgroundColor: `${accent}15` } : undefined}
                                >
                                    {g.profileImageUrl && (
                                        <span className="w-3 h-3 rounded-full overflow-hidden flex-shrink-0 relative inline-block">
                                            <Image src={g.profileImageUrl} alt="" width={12} height={12} className="object-cover w-full h-full" />
                                        </span>
                                    )}
                                    {g.name}
                                </span>
                            ))}
                            {agency._count.musicalGroups > 5 && (
                                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-border text-muted">
                                    +{agency._count.musicalGroups - 5}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Artist avatars */}
                {agency.artists.length > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {agency.artists.slice(0, 6).map(a => (
                                <div
                                    key={a.id}
                                    className="w-7 h-7 rounded-full border-2 border-surface overflow-hidden bg-background flex-shrink-0 relative"
                                    title={a.nameRomanized}
                                >
                                    {a.primaryImageUrl ? (
                                        <Image src={a.primaryImageUrl} alt="" fill sizes="28px" className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[9px] font-black text-muted">
                                            {a.nameRomanized[0]}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <span className="text-[11px] text-muted">
                            {agency._count.artists} artista{agency._count.artists !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {/* Footer stats */}
                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex gap-3 text-[11px] text-muted">
                        <span className="flex items-center gap-1">
                            <Users size={11} />
                            {agency._count.artists}
                        </span>
                        {agency._count.musicalGroups > 0 && (
                            <span className="flex items-center gap-1">
                                <Music2 size={11} />
                                {agency._count.musicalGroups}
                            </span>
                        )}
                        {agency._count.subsidiaries > 0 && (
                            <span className="flex items-center gap-1 text-muted">
                                <Building2 size={11} />
                                {agency._count.subsidiaries} sub-label{agency._count.subsidiaries > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] font-semibold text-muted group-hover:text-[var(--accent-color)] transition-colors">
                        Ver perfil →
                    </span>
                </div>
            </div>
        </Link>
    )
}
