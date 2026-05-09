import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getRoleLabel } from "@/lib/utils/role-labels"
import { ExternalLink, Users, Music2, Building2, Calendar, ChevronRight } from "lucide-react"
import { cache } from "react"
import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/JsonLd"
import { AdBanner } from "@/components/ui/AdBanner"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { HomeLojaDestaque } from "@/components/home/HomeLojaDestaque"
import { SITE_URL } from '@/lib/constants/site'

// ISR ativo — revalidate abaixo substitui force-dynamic
export const revalidate = 3600

const BASE_URL = SITE_URL

export async function generateStaticParams() {
    if (process.env.SKIP_BUILD_STATIC_GENERATION) return []
    const agencies = await prisma.agency.findMany({
        select: { id: true },
        orderBy: { name: 'asc' },
    })
    return agencies.map(a => ({ id: a.id }))
}

const getAgency = cache(async (id: string) =>
    prisma.agency.findUnique({
        where: { id },
        include: {
            artists: {
                where: { isHidden: false, flaggedAsNonKorean: false },
                select: {
                    id: true, nameRomanized: true, nameHangul: true,
                    primaryImageUrl: true, roles: true, gender: true,
                    trendingScore: true, trendingRank: true,
                },
                orderBy: { trendingScore: 'desc' },
            },
            musicalGroups: {
                select: {
                    id: true, slug: true, name: true, nameHangul: true, profileImageUrl: true,
                    debutDate: true, disbandDate: true, officialColor: true,
                    _count: { select: { members: true } },
                },
                orderBy: { trendingScore: 'desc' },
            },
            parent: { select: { id: true, name: true, accentColor: true } },
            subsidiaries: {
                select: {
                    id: true, name: true, accentColor: true, type: true,
                    _count: { select: { artists: true, musicalGroups: true } },
                    musicalGroups: {
                        select: { id: true, name: true, profileImageUrl: true, disbandDate: true },
                        orderBy: { trendingScore: 'desc' },
                        take: 4,
                    },
                },
                orderBy: { name: 'asc' },
            },
        },
    }).catch(() => null)
)

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await props.params
    const agency = await getAgency(id)
    if (!agency) return {}

    const artistNames = agency.artists.slice(0, 5).map(a => a.nameRomanized).join(', ')
    const groupNames  = agency.musicalGroups.slice(0, 3).map(g => g.name).join(', ')
    const description = agency.description ?? [
        `${agency.name} é uma agência de entretenimento K-pop.`,
        artistNames && `Artistas: ${artistNames}${agency.artists.length > 5 ? ' e mais' : ''}.`,
        groupNames && `Grupos: ${groupNames}.`,
    ].filter(Boolean).join(' ')

    return {
        title: agency.name,
        description,
        alternates: { canonical: `${BASE_URL}/agencies/${id}` },
        openGraph: {
            title: `${agency.name} | HallyuHub`,
            description,
            url: `${BASE_URL}/agencies/${id}`,
            type: 'website',
        },
    }
}

const TYPE_LABEL: Record<string, string> = {
    MAJOR: 'Grande Agência',
    INDIE: 'Independente',
    SUBSIDIARY: 'Sub-label',
}

export default async function AgencyDetailPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
    const agency = await getAgency(id)
    if (!agency) notFound()

    const featuredProducts = await prisma.storeProduct.findMany({
        where: { isActive: true, featured: true },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        take: 4,
        select: { id: true, name: true, imageUrl: true, affiliateUrl: true, store: true, category: true, badge: true, rating: true, soldCount: true },
    }).catch(() => [])

    const socials     = (agency.socials as Record<string, string>) ?? {}
    const accent      = agency.accentColor ?? '#6b7280'
    const activeGroups    = agency.musicalGroups.filter(g => !g.disbandDate)
    const disbandedGroups = agency.musicalGroups.filter(g => !!g.disbandDate)
    // Parent agency = holds sub-labels but no direct artists/groups (e.g. HYBE)
    const isParentAgency = agency.artists.length === 0 && agency.musicalGroups.length === 0 && agency.subsidiaries.length > 0

    // Aggregate counts from subsidiaries (for parent agencies like HYBE)
    const subArtistsTotal  = agency.subsidiaries.reduce((s, sub) => s + sub._count.artists, 0)
    const subGroupsTotal   = agency.subsidiaries.reduce((s, sub) => s + sub._count.musicalGroups, 0)
    const showSubTotals    = agency.subsidiaries.length > 0 && agency.artists.length === 0

    return (
        <>
        <div className="min-h-screen bg-background pb-20">
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": agency.name,
                "url": agency.website ?? `${BASE_URL}/agencies/${agency.id}`,
                "description": agency.description ?? undefined,
                "foundingDate": agency.foundedYear ? String(agency.foundedYear) : undefined,
                "sameAs": agency.website ? [agency.website] : undefined,
                ...(agency.musicalGroups.length > 0 ? {
                    "subOrganization": agency.musicalGroups.map(g => ({
                        "@type": "MusicGroup",
                        "name": g.name,
                        "url": `${BASE_URL}/groups/${g.slug ?? g.id}`,
                    })),
                } : {}),
                ...(agency.artists.length > 0 ? {
                    "member": agency.artists.slice(0, 20).map(a => ({
                        "@type": "Person",
                        "name": a.nameRomanized,
                        "url": `${BASE_URL}/artists/${a.id}`,
                    })),
                } : {}),
            }} />

<div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-8">

                {/* Breadcrumb + back */}
                <Breadcrumbs items={[
                    { label: 'Agências', href: '/agencies' },
                    { label: agency.name },
                ]} className="mb-8" />

                {/* ── Agency Header ──────────────────────────────────────────── */}
                <div className="flex flex-col lg:flex-row lg:items-start gap-8 mb-12 pb-12 border-b border-border">

                    {/* Left: identity */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                            {agency.type && (
                                <span
                                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                                    style={{ color: accent, backgroundColor: `${accent}15`, borderColor: `${accent}30` }}
                                >
                                    {TYPE_LABEL[agency.type] ?? agency.type}
                                </span>
                            )}
                            {agency.foundedYear && (
                                <span className="text-[11px] text-muted flex items-center gap-1">
                                    <Calendar size={11} />
                                    Fundada em {agency.foundedYear}
                                </span>
                            )}
                            {agency.country && agency.country !== 'KR' && (
                                <span className="text-[11px] text-muted">{agency.country}</span>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-3">
                            {agency.name}
                        </h1>

                        {agency.description && (
                            <p className="text-base text-muted leading-relaxed max-w-2xl mb-4">
                                {agency.description}
                            </p>
                        )}

                        {/* Links & CEO */}
                        <div className="flex flex-wrap items-center gap-3">
                            {agency.website && (
                                <a
                                    href={agency.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-70 transition-opacity"
                                    style={{ color: accent }}
                                >
                                    {agency.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                    <ExternalLink size={12} />
                                </a>
                            )}
                            {Object.entries(socials).map(([name, url]) => (
                                <a
                                    key={name}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-muted px-2.5 py-1 rounded-lg border border-border hover:border-foreground/30 hover:text-foreground transition-all"
                                >
                                    {name}
                                </a>
                            ))}
                            {agency.ceoName && (
                                <span className="text-sm text-muted">
                                    CEO: <strong className="text-foreground font-semibold">{agency.ceoName}</strong>
                                </span>
                            )}
                        </div>

                        {/* Parent company banner */}
                        {agency.parent && (
                            <Link
                                href={`/agencies/${agency.parent.id}`}
                                className="mt-5 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-surface hover:border-foreground/20 transition-all group w-fit"
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: agency.parent.accentColor ?? '#6b7280' }}
                                />
                                <div className="flex flex-col leading-none">
                                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest mb-0.5">Parte de</span>
                                    <span className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">{agency.parent.name}</span>
                                </div>
                                <ChevronRight size={14} className="text-muted group-hover:text-foreground ml-1 transition-colors" />
                            </Link>
                        )}
                    </div>

                    {/* Right: stats */}
                    <div className="flex flex-wrap gap-3 lg:shrink-0">
                        <div className="text-center px-5 py-4 rounded-xl bg-surface border border-border min-w-[90px]">
                            <Users className="w-4 h-4 text-muted mx-auto mb-1.5" />
                            <p className="text-3xl font-black text-foreground">
                                {showSubTotals ? subArtistsTotal : agency.artists.length}
                            </p>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Artistas</p>
                            {showSubTotals && subArtistsTotal > 0 && (
                                <p className="text-[9px] text-muted/60 mt-0.5">via sub-labels</p>
                            )}
                        </div>
                        {(agency.musicalGroups.length > 0 || (showSubTotals && subGroupsTotal > 0)) && (
                            <div
                                className="text-center px-5 py-4 rounded-xl border min-w-[90px]"
                                style={{ backgroundColor: `${accent}12`, borderColor: `${accent}25` }}
                            >
                                <Music2 className="w-4 h-4 mx-auto mb-1.5" style={{ color: accent }} />
                                <p className="text-3xl font-black" style={{ color: accent }}>
                                    {showSubTotals ? subGroupsTotal : agency.musicalGroups.length}
                                </p>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Grupos</p>
                                {showSubTotals && subGroupsTotal > 0 && (
                                    <p className="text-[9px] text-muted/60 mt-0.5">via sub-labels</p>
                                )}
                            </div>
                        )}
                        {agency.subsidiaries.length > 0 && (
                            <div className="text-center px-5 py-4 rounded-xl bg-surface border border-border min-w-[90px]">
                                <Building2 className="w-4 h-4 text-muted mx-auto mb-1.5" />
                                <p className="text-3xl font-black text-foreground">{agency.subsidiaries.length}</p>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Sub-labels</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Sub-labels ──────────────────────────────────────────────── */}
                {agency.subsidiaries.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-xs font-black text-muted uppercase tracking-widest mb-5 flex items-center gap-2">
                            <Building2 size={13} />
                            Sub-labels & Divisões
                            <span className="font-normal text-muted/60">({agency.subsidiaries.length})</span>
                        </h2>
                        <div className={`grid gap-4 ${isParentAgency ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                            {agency.subsidiaries.map(sub => {
                                const subAccent = sub.accentColor ?? '#6b7280'
                                const activeSubGroups = sub.musicalGroups.filter(g => !g.disbandDate)
                                return (
                                    <Link
                                        key={sub.id}
                                        href={`/agencies/${sub.id}`}
                                        className="flex flex-col rounded-xl border border-border bg-surface hover:border-foreground/20 hover:shadow-md transition-all group overflow-hidden"
                                        style={{ borderLeftColor: subAccent, borderLeftWidth: 3 }}
                                    >
                                        {/* Group photo strip — shown prominently for parent agencies */}
                                        {isParentAgency && activeSubGroups.length > 0 && (
                                            <div className="relative flex h-32 overflow-hidden">
                                                {activeSubGroups.slice(0, 4).map((g, i, arr) => (
                                                    <div key={g.id} className="relative flex-1 overflow-hidden">
                                                        {g.profileImageUrl ? (
                                                            <Image src={g.profileImageUrl} alt={g.name} fill sizes="140px" className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-lg font-black" style={{ backgroundColor: `${subAccent}25`, color: subAccent }}>{g.name[0]}</div>
                                                        )}
                                                        {i < arr.length - 1 && (
                                                            <div className="absolute right-0 inset-y-0 w-px bg-black/20 z-10" />
                                                        )}
                                                    </div>
                                                ))}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                            </div>
                                        )}

                                        <div className="p-4 flex flex-col gap-2 flex-1">
                                            {/* Header */}
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-bold text-foreground group-hover:text-accent transition-colors truncate ${isParentAgency ? 'text-base' : 'text-sm'}`}>{sub.name}</p>
                                                    <p className="text-[10px] text-muted mt-0.5">
                                                        {sub._count.artists > 0 && `${sub._count.artists} artista${sub._count.artists !== 1 ? 's' : ''}`}
                                                        {sub._count.artists > 0 && sub._count.musicalGroups > 0 && ' · '}
                                                        {sub._count.musicalGroups > 0 && `${sub._count.musicalGroups} grupo${sub._count.musicalGroups !== 1 ? 's' : ''}`}
                                                        {sub._count.artists === 0 && sub._count.musicalGroups === 0 && 'Sem artistas'}
                                                    </p>
                                                </div>
                                                <ChevronRight size={14} className="text-muted group-hover:text-foreground transition-colors shrink-0" />
                                            </div>

                                            {/* Group pills */}
                                            {sub.musicalGroups.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {sub.musicalGroups.map(g => (
                                                        <span
                                                            key={g.id}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                                            style={{
                                                                backgroundColor: `${subAccent}18`,
                                                                color: subAccent,
                                                                border: `1px solid ${subAccent}30`,
                                                                opacity: g.disbandDate ? 0.5 : 1,
                                                            }}
                                                        >
                                                            {g.profileImageUrl && (
                                                                <span className="relative w-3.5 h-3.5 rounded-full overflow-hidden flex-shrink-0 inline-block">
                                                                    <Image src={g.profileImageUrl} alt={g.name} fill sizes="14px" className="object-cover" />
                                                                </span>
                                                            )}
                                                            {g.name}
                                                        </span>
                                                    ))}
                                                    {sub._count.musicalGroups > 4 && (
                                                        <span className="text-[10px] text-muted px-1.5 py-0.5">
                                                            +{sub._count.musicalGroups - 4} mais
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* ── Grupos ──────────────────────────────────────────────────── */}
                {agency.musicalGroups.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-xs font-black text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Music2 size={13} />
                            Grupos Musicais
                            <span className="font-normal text-muted/60">({agency.musicalGroups.length})</span>
                        </h2>

                        {activeGroups.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
                                {activeGroups.map(group => (
                                    <GroupCard key={group.id} group={group} accent={accent} />
                                ))}
                            </div>
                        )}

                        {disbandedGroups.length > 0 && (
                            <>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-4 h-px bg-border inline-block" />
                                    Dissolvidos
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                    {disbandedGroups.map(group => (
                                        <GroupCard key={group.id} group={group} accent={accent} disbanded />
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                )}

                <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_AUTO!} variant="auto" className="mb-12" />

                {/* ── Elenco — só mostra se tem artistas diretos ───────────────── */}
                {agency.artists.length > 0 && (
                    <section>
                        <h2 className="text-xs font-black text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Users size={13} />
                            Elenco
                            <span className="font-normal text-muted/60">({agency.artists.length})</span>
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                            {agency.artists.map((artist) => (
                                <Link key={artist.id} href={`/artists/${artist.id}`} className="group block">
                                    <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-surface border border-border hover:border-[var(--a)]/40 transition-all mb-2.5"
                                        style={{ '--a': accent } as React.CSSProperties}>
                                        {artist.primaryImageUrl ? (
                                            <Image
                                                src={artist.primaryImageUrl}
                                                alt={artist.nameRomanized}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-muted font-black uppercase tracking-tighter text-xl">
                                                {artist.nameRomanized[0]}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {artist.trendingRank && artist.trendingRank <= 10 && (
                                            <div
                                                className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                                                style={{ backgroundColor: accent }}
                                            >
                                                {artist.trendingRank}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[13px] text-foreground group-hover:text-accent transition-colors leading-tight">
                                            {artist.nameRomanized}
                                        </p>
                                        {artist.nameHangul && (
                                            <p className="text-[11px] text-muted mt-0.5">{artist.nameHangul}</p>
                                        )}
                                        {artist.roles && artist.roles.length > 0 && (
                                            <p className="text-[10px] text-muted/70 mt-0.5">
                                                {artist.roles.slice(0, 2).map(r => getRoleLabel(r, artist.gender)).join(' · ')}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </div>

        <HomeLojaDestaque products={featuredProducts} />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pb-8">
            <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_AUTO!} variant="auto" className="mt-4" />
        </div>
        </>
    )
}

function GroupCard({
    group,
    accent,
    disbanded = false,
}: {
    group: {
        id: string
        slug?: string | null
        name: string
        nameHangul: string | null
        profileImageUrl: string | null
        debutDate: Date | null
        disbandDate: Date | null
        officialColor: string | null
        _count: { members: number }
    }
    accent: string
    disbanded?: boolean
}) {
    const color = group.officialColor ?? accent
    return (
        <Link
            href={`/groups/${group.slug ?? group.id}`}
            className={`group block ${disbanded ? 'opacity-50 hover:opacity-80 transition-opacity' : ''}`}
        >
            <div className="aspect-square relative rounded-xl overflow-hidden bg-surface border border-border hover:border-[var(--c)]/40 transition-all mb-2"
                style={{ '--c': color } as React.CSSProperties}>
                {group.profileImageUrl ? (
                    <Image
                        src={group.profileImageUrl}
                        alt={group.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 20vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xl font-black text-muted group-hover:text-accent transition-colors">
                            {group.name[0]}
                        </span>
                    </div>
                )}
                {disbanded && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[8px] font-bold text-white uppercase">
                        Dissolvido
                    </div>
                )}
                {!disbanded && group._count.members > 0 && (
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] font-bold text-white">
                        <Users size={9} />
                        {group._count.members}
                    </div>
                )}
            </div>
            <p className="font-bold text-[12px] text-foreground group-hover:text-accent transition-colors leading-tight">
                {group.name}
            </p>
            {group.nameHangul && (
                <p className="text-[10px] text-muted mt-0.5">{group.nameHangul}</p>
            )}
            {group.debutDate && (
                <p className="text-[10px] text-muted/60 mt-0.5">
                    {new Date(group.debutDate).getUTCFullYear()}
                    {group.disbandDate ? ` – ${new Date(group.disbandDate).getUTCFullYear()}` : ''}
                </p>
            )}
        </Link>
    )
}
