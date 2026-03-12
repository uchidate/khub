import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

// Cache sitemap 1h — evita 6 queries massivas a cada crawl do Google/Bing
export const revalidate = 3600

const BASE_URL = 'https://www.hallyuhub.com.br'

// Data de referência para páginas estáticas (evita "modificado hoje" em todo crawl)
const STATIC_DATE = new Date('2025-01-01')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    try {
        const primaryRoutes: MetadataRoute.Sitemap = [
            { url: BASE_URL,                    lastModified: STATIC_DATE, changeFrequency: 'daily',   priority: 1   },
            { url: `${BASE_URL}/artists`,       lastModified: STATIC_DATE, changeFrequency: 'daily',   priority: 0.9 },
            { url: `${BASE_URL}/groups`,        lastModified: STATIC_DATE, changeFrequency: 'daily',   priority: 0.9 },
            { url: `${BASE_URL}/productions`,   lastModified: STATIC_DATE, changeFrequency: 'daily',   priority: 0.9 },
            { url: `${BASE_URL}/news`,          lastModified: STATIC_DATE, changeFrequency: 'daily',   priority: 0.9 },
            { url: `${BASE_URL}/agencies`,      lastModified: STATIC_DATE, changeFrequency: 'weekly',  priority: 0.7 },
            { url: `${BASE_URL}/blog`,          lastModified: STATIC_DATE, changeFrequency: 'weekly',  priority: 0.7 },
            { url: `${BASE_URL}/about`,         lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.5 },
            { url: `${BASE_URL}/faq`,           lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.5 },
            { url: `${BASE_URL}/contato`,        lastModified: STATIC_DATE, changeFrequency: 'yearly',  priority: 0.4 },
            { url: `${BASE_URL}/privacidade`,   lastModified: STATIC_DATE, changeFrequency: 'yearly',  priority: 0.3 },
            { url: `${BASE_URL}/termos`,        lastModified: STATIC_DATE, changeFrequency: 'yearly',  priority: 0.3 },
        ]

        // Skip DB queries during Docker build
        if (process.env.SKIP_BUILD_STATIC_GENERATION) {
            return primaryRoutes
        }

        const [artists, productions, news, groups, agencies, blogPosts] = await Promise.all([
            prisma.artist.findMany({
                where: { flaggedAsNonKorean: false },
                select: { id: true, updatedAt: true },
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.production.findMany({
                where: {
                    flaggedAsNonKorean: false,
                    // Excluir do SEO conteúdo oculto por faixa etária (18+ e não classificados)
                    ageRating: { in: ['L', '10', '12', '14', '16'] },
                },
                select: { id: true, updatedAt: true },
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.news.findMany({
                select: { id: true, publishedAt: true },
                orderBy: { publishedAt: 'desc' },
            }),
            prisma.musicalGroup.findMany({
                select: { id: true, updatedAt: true },
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.agency.findMany({
                select: { id: true, updatedAt: true },
                orderBy: { name: 'asc' },
            }),
            prisma.blogPost.findMany({
                where: { publishedAt: { not: null } },
                select: { slug: true, publishedAt: true, updatedAt: true },
                orderBy: { publishedAt: 'desc' },
            }),
        ])

        return [
            ...primaryRoutes,
            ...artists.map(a => ({
                url: `${BASE_URL}/artists/${a.id}`,
                lastModified: a.updatedAt,
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            })),
            ...groups.map(g => ({
                url: `${BASE_URL}/groups/${g.id}`,
                lastModified: g.updatedAt,
                changeFrequency: 'weekly' as const,
                priority: 0.75,
            })),
            ...productions.map(p => ({
                url: `${BASE_URL}/productions/${p.id}`,
                lastModified: p.updatedAt,
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            })),
            ...news.map(n => ({
                url: `${BASE_URL}/news/${n.id}`,
                lastModified: n.publishedAt,
                changeFrequency: 'never' as const,
                priority: 0.7,
            })),
            ...agencies.map(a => ({
                url: `${BASE_URL}/agencies/${a.id}`,
                lastModified: a.updatedAt,
                changeFrequency: 'monthly' as const,
                priority: 0.6,
            })),
            ...blogPosts.map(p => ({
                url: `${BASE_URL}/blog/${p.slug}`,
                lastModified: p.updatedAt ?? p.publishedAt ?? STATIC_DATE,
                changeFrequency: 'monthly' as const,
                priority: 0.7,
            })),
        ]
    } catch (error) {
        console.error('Error generating sitemap:', error)
        return [{ url: BASE_URL, lastModified: STATIC_DATE, changeFrequency: 'daily', priority: 1 }]
    }
}
