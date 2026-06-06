import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import prisma from '@/lib/prisma'
import { ARCHIVE_HUBS, type ArchiveHub } from '@/lib/seo/archive-hubs'

export const dynamic = 'force-dynamic'

const SINGER_ROLES = ['CANTOR', 'CANTORA', 'Cantor', 'Cantora', 'Cantor/Cantora', 'SINGER', 'Singer', 'VOCALIST', 'Vocalist', 'RAPPER', 'Rapper', 'IDOL', 'Idol']
const ACTOR_ROLES = ['ATOR', 'ATRIZ', 'Ator', 'Atriz', 'Ator/Atriz', 'ACTOR', 'ACTRESS', 'Actor', 'Actress']

const ALIASES: Record<string, string[]> = {
    'integrantes-do-ive': ['/integrantes-do-ive'],
    'integrantes-do-aespa': ['/integrantes-do-aespa'],
    'integrantes-do-fromis-9': ['/integrantes-do-fromis-9'],
    'integrantes-do-izone': ['/integrantes-do-izone'],
    'integrantes-do-twice': ['/integrantes-do-twice'],
    'integrantes-do-blackpink': ['/integrantes-do-blackpink'],
    'integrantes-do-newjeans': ['/integrantes-do-newjeans'],
    'integrantes-do-le-sserafim': ['/integrantes-do-le-sserafim'],
    'integrantes-do-babymonster': ['/integrantes-do-babymonster'],
    'integrantes-do-nmixx': ['/integrantes-do-nmixx'],
    'cantoras-kpop': ['/cantoras-kpop'],
    'artistas-solo-kpop': ['/solistas-kpop'],
    'grupos-femininos-kpop': ['/girl-groups-kpop', '/grupos-femininos-kpop'],
    'doramas-coreanos-netflix': ['/doramas-netflix'],
    'idols-que-atuam-em-doramas': ['/idols-atores'],
}

async function countHubItems(hub: ArchiveHub) {
    if (hub.groupSlug) {
        return prisma.artist.count({
            where: {
                flaggedAsNonKorean: false,
                isHidden: false,
                slug: { not: null },
                memberships: { some: { group: { slug: hub.groupSlug } } },
            },
        })
    }

    if (hub.slug === 'cantoras-kpop') {
        return prisma.artist.count({
            where: { flaggedAsNonKorean: false, isHidden: false, gender: 1, roles: { hasSome: SINGER_ROLES } },
        })
    }

    if (hub.slug === 'artistas-solo-kpop') {
        return prisma.artist.count({
            where: {
                flaggedAsNonKorean: false,
                isHidden: false,
                roles: { hasSome: SINGER_ROLES },
                memberships: { none: { isActive: true } },
            },
        })
    }

    if (hub.slug === 'idols-que-atuam-em-doramas') {
        return prisma.artist.count({
            where: {
                flaggedAsNonKorean: false,
                isHidden: false,
                AND: [
                    { roles: { hasSome: SINGER_ROLES } },
                    { roles: { hasSome: ACTOR_ROLES } },
                    { productions: { some: { production: { isHidden: false, flaggedAsNonKorean: false } } } },
                ],
            },
        })
    }

    if (hub.slug === 'grupos-femininos-kpop') {
        const groups = await prisma.musicalGroup.findMany({
            where: { isHidden: false, slug: { not: null }, members: { some: { isActive: true, artist: { gender: 1 } } } },
            select: { members: { where: { isActive: true }, select: { artist: { select: { gender: true } } } } },
            take: 500,
        })
        return groups.filter(group => {
            const female = group.members.filter(member => member.artist.gender === 1).length
            const male = group.members.filter(member => member.artist.gender === 2).length
            return female >= Math.max(1, male)
        }).length
    }

    if (hub.slug === 'doramas-coreanos-netflix') {
        return prisma.production.count({
            where: {
                flaggedAsNonKorean: false,
                isHidden: false,
                slug: { not: null },
                OR: [
                    { streamingPlatforms: { has: 'Netflix' } },
                    { network: { contains: 'Netflix', mode: 'insensitive' } },
                    { tags: { has: 'Netflix' } },
                ],
                AND: [
                    { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
                    { OR: [{ ageRating: null }, { ageRating: { not: '18' } }] },
                ],
            },
        })
    }

    return 0
}

function healthLabel(count: number, faqCount: number) {
    if (count === 0) return { label: 'vazio', color: 'text-red-400', bg: 'bg-red-500/10' }
    if (count < 3) return { label: 'fraco', color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
    if (faqCount < 2) return { label: 'sem FAQ forte', color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
    return { label: 'saudável', color: 'text-green-400', bg: 'bg-green-500/10' }
}

export default async function SeoHubsReportPage() {
    const rows = await Promise.all(ARCHIVE_HUBS.map(async hub => {
        const count = await countHubItems(hub).catch(() => 0)
        const aliases = ALIASES[hub.slug] ?? []
        const health = healthLabel(count, hub.faq.length)
        return {
            hub,
            count,
            aliases,
            health,
            density: hub.intro.length + hub.faq.length + hub.keywords.length + aliases.length,
        }
    }))

    const empty = rows.filter(row => row.count === 0).length
    const weak = rows.filter(row => row.count > 0 && row.count < 3).length
    const healthy = rows.filter(row => row.health.label === 'saudável').length

    return (
        <AdminLayout title="Relatório de Hubs SEO" subtitle="Acompanhe densidade, aliases e cobertura dos hubs indexáveis">
            <div className="grid gap-3 sm:grid-cols-4">
                {[
                    ['Hubs', rows.length],
                    ['Vazios', empty],
                    ['Fracos', weak],
                    ['Saudáveis', healthy],
                ].map(([label, value]) => (
                    <div key={label} className="border border-border bg-surface p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
                        <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/hubs" className="border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:border-accent/50">Ver hubs públicos</Link>
                <Link href="/sitemaps/archives.xml" className="border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:border-accent/50">Sitemap archives</Link>
                <Link href="/admin/seo/content-quality" className="border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:border-accent/50">Auditoria de conteúdo</Link>
            </div>

            <div className="mt-6 grid gap-3">
                {rows.map(row => (
                    <div key={row.hub.slug} className="border border-border bg-background p-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-lg font-black text-foreground">{row.hub.title}</h2>
                                    <span className={`${row.health.bg} ${row.health.color} px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]`}>{row.health.label}</span>
                                </div>
                                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{row.hub.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-foreground">{row.count}</p>
                                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">itens</p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 text-xs sm:grid-cols-4">
                            <div className="border border-border bg-surface p-3">
                                <p className="font-mono uppercase tracking-[0.12em] text-muted">Tipo</p>
                                <p className="mt-1 font-bold text-foreground">{row.hub.kind}</p>
                            </div>
                            <div className="border border-border bg-surface p-3">
                                <p className="font-mono uppercase tracking-[0.12em] text-muted">FAQ</p>
                                <p className="mt-1 font-bold text-foreground">{row.hub.faq.length} perguntas</p>
                            </div>
                            <div className="border border-border bg-surface p-3">
                                <p className="font-mono uppercase tracking-[0.12em] text-muted">Aliases</p>
                                <p className="mt-1 font-bold text-foreground">{row.aliases.length || 'nenhum'}</p>
                            </div>
                            <div className="border border-border bg-surface p-3">
                                <p className="font-mono uppercase tracking-[0.12em] text-muted">Densidade</p>
                                <p className="mt-1 font-bold text-foreground">{row.density}</p>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link href={`/hubs/${row.hub.slug}`} className="text-xs font-bold text-accent hover:underline">Abrir hub</Link>
                            {row.aliases.map(alias => (
                                <Link key={alias} href={alias} className="text-xs font-bold text-muted hover:text-foreground">{alias}</Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </AdminLayout>
    )
}
