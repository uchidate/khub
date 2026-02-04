import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

const BASE_URL = 'https://hallyuhub.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    try {
        // 1. Static Routes
        const routes = [
            '',
            '/artists',
            '/productions',
            '/news',
            '/about',
            '/auth/login',
            '/auth/register',
        ].map((route) => ({
            url: `${BASE_URL}${route}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1,
        }))

        // Skip DB queries during build
        if (process.env.SKIP_BUILD_STATIC_GENERATION) {
            return routes
        }

        // 2. Dynamic Artists
        const artists = await prisma.artist.findMany({
            select: { id: true, updatedAt: true },
            take: 1000,
        })

        const artistRoutes = artists.map((artist) => ({
            url: `${BASE_URL}/artists/${artist.id}`,
            lastModified: artist.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }))

        // 3. Dynamic Productions
        const productions = await prisma.production.findMany({
            select: { id: true, updatedAt: true },
            take: 1000,
        })

        const productionRoutes = productions.map((prod) => ({
            url: `${BASE_URL}/productions/${prod.id}`,
            lastModified: prod.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }))

        // 4. Dynamic News
        const news = await prisma.news.findMany({
            select: { id: true, publishedAt: true },
            take: 1000,
        })

        const newsRoutes = news.map((item) => ({
            url: `${BASE_URL}/news/${item.id}`,
            lastModified: item.publishedAt,
            changeFrequency: 'daily' as const,
            priority: 0.7,
        }))

        return [...routes, ...artistRoutes, ...productionRoutes, ...newsRoutes]
    } catch (error) {
        console.error('Error generating sitemap:', error)
        return [
            {
                url: BASE_URL,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1,
            },
        ]
    }
}
