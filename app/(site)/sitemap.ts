import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'
import { ARCHIVE_HUBS } from '@/lib/seo/archive-hubs'
import { BLOG_CATEGORIES } from '@/lib/config/categories'
import { getHubItems, hasIndexableHubInventory } from '@/lib/seo/hub-items'

export const dynamic = 'force-dynamic'
// Cache sitemap 1h — evita 6 queries massivas a cada crawl do Google/Bing
export const revalidate = 3600

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

// Data de referência para páginas estáticas (evita "modificado hoje" em todo crawl)
const STATIC_DATE = new Date('2025-01-01')
const HUB_SITEMAP_CONCURRENCY = 8
const PT_ARCHIVE_HUBS = ARCHIVE_HUBS.filter(hub => !hub.locale || hub.locale === 'pt')

function hasItems(value: unknown): boolean {
    return Array.isArray(value) && value.length > 0
}

function seoPriority(base: number, signals: boolean[], max = 0.9): number {
    const score = signals.reduce((total, signal) => total + (signal ? 0.025 : 0), base)
    return Number(Math.min(score, max).toFixed(2))
}

async function getHubSitemapEntries(): Promise<MetadataRoute.Sitemap> {
    const results: Array<{ hub: (typeof PT_ARCHIVE_HUBS)[number]; indexable: boolean; checked: boolean }> = []

    for (let index = 0; index < PT_ARCHIVE_HUBS.length; index += HUB_SITEMAP_CONCURRENCY) {
        const batch = PT_ARCHIVE_HUBS.slice(index, index + HUB_SITEMAP_CONCURRENCY)
        const batchResults = await Promise.all(batch.map(async hub => {
            try {
                const items = await getHubItems(hub)
                return { hub, indexable: hasIndexableHubInventory(items), checked: true }
            } catch {
                return { hub, indexable: false, checked: false }
            }
        }))
        results.push(...batchResults)
    }

    const checkedCount = results.filter(result => result.checked).length
    const hubs = checkedCount === 0 ? PT_ARCHIVE_HUBS : results.filter(result => result.indexable).map(result => result.hub)

    return hubs.map(hub => ({
        url: `${BASE_URL}/hubs/${hub.slug}`,
        lastModified: STATIC_DATE,
        changeFrequency: 'weekly' as const,
        priority: 0.82,
    }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    try {
        const primaryRoutes: MetadataRoute.Sitemap = [
            { url: BASE_URL,                    lastModified: STATIC_DATE, changeFrequency: 'daily',   priority: 1   },
            { url: `${BASE_URL}/artists`,       lastModified: STATIC_DATE, changeFrequency: 'daily',   priority: 0.9 },
            { url: `${BASE_URL}/groups`,        lastModified: STATIC_DATE, changeFrequency: 'daily',   priority: 0.9 },
            { url: `${BASE_URL}/productions`,   lastModified: STATIC_DATE, changeFrequency: 'daily',   priority: 0.9 },
            { url: `${BASE_URL}/agencies`,      lastModified: STATIC_DATE, changeFrequency: 'weekly',  priority: 0.7 },
            { url: `${BASE_URL}/loja`,              lastModified: STATIC_DATE, changeFrequency: 'daily',   priority: 0.7 },
            { url: `${BASE_URL}/blog`,              lastModified: STATIC_DATE, changeFrequency: 'weekly',  priority: 0.7 },
            { url: `${BASE_URL}/hubs`,              lastModified: STATIC_DATE, changeFrequency: 'weekly',  priority: 0.75 },
            { url: `${BASE_URL}/calendario`,        lastModified: STATIC_DATE, changeFrequency: 'daily',   priority: 0.8 },
            { url: `${BASE_URL}/quiz`,              lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.7 },
            { url: `${BASE_URL}/melhores-dramas`,   lastModified: STATIC_DATE, changeFrequency: 'weekly',  priority: 0.8 },
            { url: `${BASE_URL}/melhores-dramas/netflix`,   lastModified: STATIC_DATE, changeFrequency: 'weekly',  priority: 0.8 },
            { url: `${BASE_URL}/melhores-dramas/romance`,   lastModified: STATIC_DATE, changeFrequency: 'weekly',  priority: 0.8 },
            { url: `${BASE_URL}/melhores-dramas/acao`,      lastModified: STATIC_DATE, changeFrequency: 'weekly',  priority: 0.7 },
            { url: `${BASE_URL}/melhores-dramas/classicos`, lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.7 },
            { url: `${BASE_URL}/melhores-dramas/filmes`,    lastModified: STATIC_DATE, changeFrequency: 'weekly',  priority: 0.7 },
            { url: `${BASE_URL}/melhores-dramas/2025`,   lastModified: STATIC_DATE, changeFrequency: 'weekly',  priority: 0.85 },
            { url: `${BASE_URL}/melhores-dramas/2024`,   lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.82 },
            { url: `${BASE_URL}/melhores-dramas/2023`,   lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.78 },
            { url: `${BASE_URL}/melhores-dramas/2022`,   lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.75 },
            { url: `${BASE_URL}/about`,             lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.5 },
            { url: `${BASE_URL}/faq`,           lastModified: STATIC_DATE, changeFrequency: 'monthly', priority: 0.5 },
            { url: `${BASE_URL}/contato`,        lastModified: STATIC_DATE, changeFrequency: 'yearly',  priority: 0.4 },
            { url: `${BASE_URL}/privacidade`,   lastModified: STATIC_DATE, changeFrequency: 'yearly',  priority: 0.3 },
            { url: `${BASE_URL}/termos`,        lastModified: STATIC_DATE, changeFrequency: 'yearly',  priority: 0.3 },
        ]

        // Skip DB queries during Docker build
        if (process.env.SKIP_BUILD_STATIC_GENERATION) {
            return primaryRoutes
        }

        const [artists, productions, groups, agencies, blogPosts] = await Promise.all([
            // Excluir thin content (sem bio E sem imagem) — essas páginas têm noindex na metadata
            // e não devem aparecer no sitemap para não confundir o Google
            prisma.artist.findMany({
                where: {
                    flaggedAsNonKorean: false,
                    isHidden: false,
                    slug: { not: null },
                    OR: [
                        { bio: { not: null } },
                        { primaryImageUrl: { not: null } },
                    ],
                },
                select: {
                    id: true,
                    slug: true,
                    updatedAt: true,
                    bio: true,
                    analiseEditorial: true,
                    primaryImageUrl: true,
                    videos: true,
                    socialLinks: true,
                    curiosidades: true,
                    awards: true,
                },
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.production.findMany({
                where: {
                    flaggedAsNonKorean: false,
                    isHidden: false,
                    slug: { not: null },
                    // Excluir conteúdo adulto: ageRating='18' ou isAdultContent=true
                    // AND+OR explícito para não excluir NULL (NOT(NULL)=NULL em SQL)
                    AND: [
                        { OR: [{ ageRating: null }, { ageRating: { not: '18' } }] },
                        { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
                    ],
                },
                select: {
                    id: true,
                    slug: true,
                    updatedAt: true,
                    synopsis: true,
                    imageUrl: true,
                    backdropUrl: true,
                    trailerUrl: true,
                    voteAverage: true,
                    voteCount: true,
                },
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.musicalGroup.findMany({
                where: { isHidden: false, slug: { not: null } },
                select: {
                    id: true,
                    slug: true,
                    updatedAt: true,
                    bio: true,
                    profileImageUrl: true,
                    videos: true,
                    socialLinks: true,
                    officialColor: true,
                },
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.agency.findMany({
                select: { id: true, updatedAt: true },
                orderBy: { name: 'asc' },
            }),
            prisma.blogPost.findMany({
                where: { status: 'PUBLISHED', isPrivate: false, publishedAt: { not: null } },
                select: { slug: true, publishedAt: true, updatedAt: true, tags: true },
                orderBy: { publishedAt: 'desc' },
            }),
        ])

        const hubSitemapEntries = await getHubSitemapEntries()
        const publishedBlogTags = [...new Set(blogPosts.flatMap(post => post.tags ?? []))]
            .filter(tag => tag.trim().length > 0)
            .sort()

        return [
            ...primaryRoutes,
            ...artists.filter(a => a.slug).map(a => ({
                url: `${BASE_URL}/artists/${a.slug}`,
                lastModified: a.updatedAt,
                changeFrequency: 'weekly' as const,
                priority: seoPriority(0.72, [
                    Boolean(a.bio),
                    Boolean(a.analiseEditorial),
                    Boolean(a.primaryImageUrl),
                    hasItems(a.videos),
                    hasItems(a.curiosidades),
                    hasItems(a.awards),
                    Boolean(a.socialLinks && Object.keys(a.socialLinks as Record<string, unknown>).length > 0),
                ], 0.88),
            })),
            ...groups.filter(g => g.slug).map(g => ({
                url: `${BASE_URL}/groups/${g.slug}`,
                lastModified: g.updatedAt,
                changeFrequency: 'weekly' as const,
                priority: seoPriority(0.72, [
                    Boolean(g.bio),
                    Boolean(g.profileImageUrl),
                    hasItems(g.videos),
                    Boolean(g.officialColor),
                    Boolean(g.socialLinks && Object.keys(g.socialLinks as Record<string, unknown>).length > 0),
                ], 0.86),
            })),
            ...productions.filter(p => p.slug).map(p => ({
                url: `${BASE_URL}/productions/${p.slug}`,
                lastModified: p.updatedAt,
                changeFrequency: 'weekly' as const,
                priority: seoPriority(0.74, [
                    Boolean(p.synopsis),
                    Boolean(p.imageUrl),
                    Boolean(p.backdropUrl),
                    Boolean(p.trailerUrl),
                    Boolean(p.voteAverage && p.voteAverage > 0 && p.voteCount && p.voteCount > 0),
                ], 0.88),
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
            ...hubSitemapEntries,
            ...BLOG_CATEGORIES.map(category => ({
                url: `${BASE_URL}/blog/category/${category.slug}`,
                lastModified: STATIC_DATE,
                changeFrequency: 'weekly' as const,
                priority: 0.72,
            })),
            ...publishedBlogTags.map(tag => ({
                url: `${BASE_URL}/blog/tag/${encodeURIComponent(tag)}`,
                lastModified: STATIC_DATE,
                changeFrequency: 'weekly' as const,
                priority: 0.65,
            })),
        ]
    } catch (error) {
        console.error('Error generating sitemap:', error)
        return [{ url: BASE_URL, lastModified: STATIC_DATE, changeFrequency: 'daily', priority: 1 }]
    }
}
