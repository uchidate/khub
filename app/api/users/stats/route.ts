import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = session.user.id

    const [
        favoriteArtists,
        favoriteProductions,
        favoriteNews,
        totalComments,
        recentComments,
        recentFavoriteArtists,
        recentFavoriteProductions,
        user,
    ] = await Promise.all([
        // Contagem de artistas favoritos
        prisma.favorite.count({ where: { userId, artistId: { not: null } } }),

        // Contagem de produções favoritas
        prisma.favorite.count({ where: { userId, productionId: { not: null } } }),

        // Contagem de notícias salvas
        prisma.favorite.count({ where: { userId, newsId: { not: null } } }),

        // Total de comentários
        prisma.comment.count({ where: { userId } }),

        // Comentários recentes (últimos 5)
        prisma.comment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                content: true,
                createdAt: true,
                news: {
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                    }
                }
            }
        }),

        // Artistas favoritos recentes (últimos 6)
        prisma.favorite.findMany({
            where: { userId, artistId: { not: null } },
            orderBy: { createdAt: 'desc' },
            take: 6,
            select: {
                createdAt: true,
                artist: {
                    select: {
                        id: true,
                        nameRomanized: true,
                        nameHangul: true,
                        primaryImageUrl: true,
                        roles: true,
                    }
                }
            }
        }),

        // Produções favoritas recentes (últimas 4)
        prisma.favorite.findMany({
            where: { userId, productionId: { not: null } },
            orderBy: { createdAt: 'desc' },
            take: 4,
            select: {
                createdAt: true,
                production: {
                    select: {
                        id: true,
                        titlePt: true,
                        type: true,
                        year: true,
                        imageUrl: true,
                        voteAverage: true,
                    }
                }
            }
        }),

        // Dados do usuário (data de criação)
        prisma.user.findUnique({
            where: { id: userId },
            select: { createdAt: true }
        }),
    ])

    return NextResponse.json({
        stats: {
            favoriteArtists,
            favoriteProductions,
            favoriteNews,
            totalComments,
        },
        recentComments: recentComments.map(c => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
        })),
        recentFavoriteArtists: recentFavoriteArtists
            .filter(f => f.artist)
            .map(f => ({ ...f.artist!, favoritedAt: f.createdAt.toISOString() })),
        recentFavoriteProductions: recentFavoriteProductions
            .filter(f => f.production)
            .map(f => ({ ...f.production!, favoritedAt: f.createdAt.toISOString() })),
        memberSince: user?.createdAt.toISOString() ?? null,
    })
}
