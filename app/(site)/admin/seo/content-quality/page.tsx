import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Row = {
    type: 'artist' | 'group' | 'production'
    id: string
    slug: string | null
    label: string
    score: number
    issues: string[]
    issueKeys: string[]
    publicHref: string
    adminHref: string
    enrichHref: string
    seoHref: string
    primarySort: number
}

function hasObject(value: unknown) {
    return !!value && typeof value === 'object' && Object.keys(value as Record<string, unknown>).length > 0
}

function hasArray(value: unknown) {
    return Array.isArray(value) && value.length > 0
}

function issueScore(issues: string[]) {
    return issues.length
}

const ISSUE_LABELS: Record<string, string> = {
    content: 'sem conteúdo',
    image: 'sem imagem',
    video: 'sem vídeo/trailer',
    faq: 'sem FAQ',
    links: 'sem links oficiais',
    tags: 'sem tags',
    slug: 'sem slug',
}

function filterHref(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
        if (value) sp.set(key, value)
    }
    const qs = sp.toString()
    return `/admin/seo/content-quality${qs ? `?${qs}` : ''}`
}

export default async function SeoContentQualityPage({ searchParams }: { searchParams: Promise<{ type?: string; severity?: string; issue?: string; sort?: string }> }) {
    const sp = await searchParams
    const typeFilter = ['artist', 'group', 'production'].includes(sp.type ?? '') ? sp.type : undefined
    const issueFilter = sp.issue && ISSUE_LABELS[sp.issue] ? sp.issue : undefined
    const severityFilter = sp.severity === 'critical' ? 'critical' : undefined
    const sort = sp.sort === 'relevance' ? 'relevance' : 'issues'

    const [artists, groups, productions] = await Promise.all([
        prisma.artist.findMany({
            where: { flaggedAsNonKorean: false, isHidden: false },
            select: {
                id: true, slug: true, nameRomanized: true, bio: true, analiseEditorial: true,
                primaryImageUrl: true, videos: true, faq: true, socialLinks: true, trendingScore: true,
            },
            orderBy: { trendingScore: 'desc' },
            take: 80,
        }),
        prisma.musicalGroup.findMany({
            where: { isHidden: false },
            select: {
                id: true, slug: true, name: true, bio: true, analiseEditorial: true,
                profileImageUrl: true, videos: true, socialLinks: true, trendingScore: true,
            },
            orderBy: { trendingScore: 'desc' },
            take: 60,
        }),
        prisma.production.findMany({
            where: {
                flaggedAsNonKorean: false,
                isHidden: false,
                AND: [
                    { OR: [{ ageRating: null }, { ageRating: { not: '18' } }] },
                    { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
                ],
            },
            select: {
                id: true, slug: true, titlePt: true, synopsis: true, editorialReview: true,
                imageUrl: true, trailerUrl: true, faq: true, tags: true, voteAverage: true, year: true,
            },
            orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
            take: 80,
        }),
    ])

    const rows: Row[] = [
        ...artists.map(item => {
            const issuePairs = [
                !item.bio && !item.analiseEditorial ? ['content', 'sem bio/editorial'] : null,
                !item.primaryImageUrl ? ['image', 'sem imagem'] : null,
                !hasArray(item.videos) ? ['video', 'sem vídeo'] : null,
                !hasArray(item.faq) ? ['faq', 'sem FAQ'] : null,
                !hasObject(item.socialLinks) ? ['links', 'sem links oficiais'] : null,
                !item.slug ? ['slug', 'sem slug'] : null,
            ].filter(Boolean) as [string, string][]
            const issues = issuePairs.map(([, label]) => label)
            return {
                type: 'artist' as const,
                id: item.id,
                slug: item.slug,
                label: item.nameRomanized,
                score: issueScore(issues),
                issues,
                issueKeys: issuePairs.map(([key]) => key),
                publicHref: `/artists/${item.slug ?? item.id}`,
                adminHref: `/admin/artists/${item.id}`,
                enrichHref: `/admin/artists/${item.id}/enrich`,
                seoHref: `/admin/seo?entityType=artist&entityId=${item.id}`,
                primarySort: item.trendingScore ?? 0,
            }
        }),
        ...groups.map(item => {
            const issuePairs = [
                !item.bio && !item.analiseEditorial ? ['content', 'sem bio/editorial'] : null,
                !item.profileImageUrl ? ['image', 'sem imagem'] : null,
                !hasArray(item.videos) ? ['video', 'sem vídeo'] : null,
                !hasObject(item.socialLinks) ? ['links', 'sem links oficiais'] : null,
                !item.slug ? ['slug', 'sem slug'] : null,
            ].filter(Boolean) as [string, string][]
            const issues = issuePairs.map(([, label]) => label)
            return {
                type: 'group' as const,
                id: item.id,
                slug: item.slug,
                label: item.name,
                score: issueScore(issues),
                issues,
                issueKeys: issuePairs.map(([key]) => key),
                publicHref: `/groups/${item.slug ?? item.id}`,
                adminHref: `/admin/groups/${item.id}`,
                enrichHref: `/admin/groups/${item.id}/enrich`,
                seoHref: `/admin/seo?entityType=group&entityId=${item.id}`,
                primarySort: item.trendingScore ?? 0,
            }
        }),
        ...productions.map(item => {
            const issuePairs = [
                !item.synopsis && !item.editorialReview ? ['content', 'sem sinopse/editorial'] : null,
                !item.imageUrl ? ['image', 'sem imagem'] : null,
                !item.trailerUrl ? ['video', 'sem trailer'] : null,
                !hasArray(item.faq) ? ['faq', 'sem FAQ'] : null,
                !hasArray(item.tags) ? ['tags', 'sem tags'] : null,
                !item.slug ? ['slug', 'sem slug'] : null,
            ].filter(Boolean) as [string, string][]
            const issues = issuePairs.map(([, label]) => label)
            return {
                type: 'production' as const,
                id: item.id,
                slug: item.slug,
                label: item.titlePt,
                score: issueScore(issues),
                issues,
                issueKeys: issuePairs.map(([key]) => key),
                publicHref: `/productions/${item.slug ?? item.id}`,
                adminHref: `/admin/productions/${item.id}`,
                enrichHref: `/admin/productions/${item.id}/enrich`,
                seoHref: `/admin/seo?entityType=production&entityId=${item.id}`,
                primarySort: item.voteAverage ?? 0,
            }
        }),
    ]
        .filter(row => row.score > 0)
        .filter(row => !typeFilter || row.type === typeFilter)
        .filter(row => !issueFilter || row.issueKeys.includes(issueFilter))
        .filter(row => !severityFilter || row.score >= 4)
        .sort((a, b) => sort === 'relevance' ? b.primarySort - a.primarySort : b.score - a.score)
        .slice(0, 120)

    const summary = {
        total: rows.length,
        critical: rows.filter(row => row.score >= 4).length,
        artists: rows.filter(row => row.type === 'artist').length,
        groups: rows.filter(row => row.type === 'group').length,
        productions: rows.filter(row => row.type === 'production').length,
    }

    return (
        <AdminLayout title="Auditoria SEO de Conteúdo" subtitle="Priorize páginas públicas relevantes com conteúdo incompleto">
            <div className="grid gap-3 sm:grid-cols-5">
                {[
                    ['Pendências', summary.total],
                    ['Críticas', summary.critical],
                    ['Artistas', summary.artists],
                    ['Grupos', summary.groups],
                    ['Produções', summary.productions],
                ].map(([label, value]) => (
                    <div key={label} className="border border-border bg-surface p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
                        <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/admin/analytics/ga4" className="border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:border-accent/50">
                    Abrir Search Console
                </Link>
                <Link href="/admin/seo" className="border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:border-accent/50">
                    Overrides de SEO
                </Link>
                <Link href="/admin/seo/hubs" className="border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:border-accent/50">
                    Relatório de hubs
                </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border border-border bg-surface p-3">
                {[
                    ['Todos', filterHref({})],
                    ['Críticas', filterHref({ ...sp, severity: 'critical' })],
                    ['Artistas', filterHref({ ...sp, type: 'artist' })],
                    ['Grupos', filterHref({ ...sp, type: 'group' })],
                    ['Produções', filterHref({ ...sp, type: 'production' })],
                    ['Sem imagem', filterHref({ ...sp, issue: 'image' })],
                    ['Sem vídeo', filterHref({ ...sp, issue: 'video' })],
                    ['Sem FAQ', filterHref({ ...sp, issue: 'faq' })],
                    ['Sem slug', filterHref({ ...sp, issue: 'slug' })],
                    ['Por relevância', filterHref({ ...sp, sort: 'relevance' })],
                ].map(([label, href]) => (
                    <Link key={label} href={href} className="border border-border bg-background px-2.5 py-1.5 text-[11px] font-bold text-muted hover:border-accent/50 hover:text-foreground">
                        {label}
                    </Link>
                ))}
            </div>

            <div className="mt-6 overflow-hidden border border-border">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-surface text-left">
                        <tr>
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Página</th>
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Tipo</th>
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Pendências</th>
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Ações rápidas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {rows.map(row => (
                            <tr key={`${row.type}-${row.id}`} className="bg-background">
                                <td className="px-4 py-3 font-bold text-foreground">{row.label}</td>
                                <td className="px-4 py-3 text-muted">{row.type}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {row.issues.map(issue => (
                                            <span key={issue} className="bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-400">{issue}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Link href={row.adminHref} className="text-xs font-bold text-accent hover:underline">Editar</Link>
                                        <Link href={row.enrichHref} className="text-xs font-bold text-purple-400 hover:underline">Curar Gemini</Link>
                                        <Link href={row.seoHref} className="text-xs font-bold text-blue-400 hover:underline">SEO</Link>
                                        <Link href={row.publicHref} className="text-xs font-bold text-muted hover:text-foreground">Ver</Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    )
}
