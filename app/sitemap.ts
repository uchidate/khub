import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

const BASE_URL = 'https://hallyuhub.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

    return [...routes, ...artistRoutes, ...productionRoutes]
}
