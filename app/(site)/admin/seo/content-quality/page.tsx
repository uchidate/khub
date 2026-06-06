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
    publicHref: string
    adminHref: string
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

export default async function SeoContentQualityPage() {
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
            const issues = [
                !item.bio && !item.analiseEditorial ? 'sem bio/editorial' : null,
                !item.primaryImageUrl ? 'sem imagem' : null,
                !hasArray(item.videos) ? 'sem vídeo' : null,
                !hasArray(item.faq) ? 'sem FAQ' : null,
                !hasObject(item.socialLinks) ? 'sem links oficiais' : null,
                !item.slug ? 'sem slug' : null,
            ].filter(Boolean) as string[]
            return {
                type: 'artist' as const,
                id: item.id,
                slug: item.slug,
                label: item.nameRomanized,
                score: issueScore(issues),
                issues,
                publicHref: `/artists/${item.slug ?? item.id}`,
                adminHref: `/admin/artists/${item.id}`,
            }
        }),
        ...groups.map(item => {
            const issues = [
                !item.bio && !item.analiseEditorial ? 'sem bio/editorial' : null,
                !item.profileImageUrl ? 'sem imagem' : null,
                !hasArray(item.videos) ? 'sem vídeo' : null,
                !hasObject(item.socialLinks) ? 'sem links oficiais' : null,
                !item.slug ? 'sem slug' : null,
            ].filter(Boolean) as string[]
            return {
                type: 'group' as const,
                id: item.id,
                slug: item.slug,
                label: item.name,
                score: issueScore(issues),
                issues,
                publicHref: `/groups/${item.slug ?? item.id}`,
                adminHref: `/admin/groups/${item.id}`,
            }
        }),
        ...productions.map(item => {
            const issues = [
                !item.synopsis && !item.editorialReview ? 'sem sinopse/editorial' : null,
                !item.imageUrl ? 'sem imagem' : null,
                !item.trailerUrl ? 'sem trailer' : null,
                !hasArray(item.faq) ? 'sem FAQ' : null,
                !hasArray(item.tags) ? 'sem tags' : null,
                !item.slug ? 'sem slug' : null,
            ].filter(Boolean) as string[]
            return {
                type: 'production' as const,
                id: item.id,
                slug: item.slug,
                label: item.titlePt,
                score: issueScore(issues),
                issues,
                publicHref: `/productions/${item.slug ?? item.id}`,
                adminHref: `/admin/productions/${item.id}`,
            }
        }),
    ]
        .filter(row => row.score > 0)
        .sort((a, b) => b.score - a.score)
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
            </div>

            <div className="mt-6 overflow-hidden border border-border">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-surface text-left">
                        <tr>
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Página</th>
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Tipo</th>
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Pendências</th>
                            <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Ações</th>
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
                                    <div className="flex gap-2">
                                        <Link href={row.adminHref} className="text-xs font-bold text-accent hover:underline">Editar</Link>
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
