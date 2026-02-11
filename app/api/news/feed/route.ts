import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const newsInclude = {
    artists: {
        include: {
            artist: {
                select: {
                    id: true,
                    nameRomanized: true,
                    primaryImageUrl: true,
                }
            }
        }
    }
} as const;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const session = await getServerSession(authOptions);

    // Feed sem autenticação: retorna tudo ordenado por data
    if (!session?.user?.email) {
        const [news, total] = await Promise.all([
            prisma.news.findMany({
                take: limit,
                skip,
                orderBy: { publishedAt: 'desc' },
                include: newsInclude,
            }),
            prisma.news.count(),
        ]);

        return NextResponse.json({
            news,
            isPersonalized: false,
            followingCount: 0,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    }

    // Buscar artistas favoritos do usuário
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            favorites: {
                where: { artistId: { not: null } },
                select: { artistId: true },
            }
        }
    });

    const favoriteArtistIds = (user?.favorites ?? [])
        .map((f: { artistId: string | null }) => f.artistId)
        .filter((id: string | null): id is string => id !== null);

    // Sem favoritos: feed padrão com mensagem
    if (favoriteArtistIds.length === 0) {
        const [news, total] = await Promise.all([
            prisma.news.findMany({
                take: limit,
                skip,
                orderBy: { publishedAt: 'desc' },
                include: newsInclude,
            }),
            prisma.news.count(),
        ]);

        return NextResponse.json({
            news,
            isPersonalized: false,
            followingCount: 0,
            message: 'Siga artistas para ter um feed personalizado!',
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    }

    // Feed personalizado: apenas notícias dos artistas seguidos
    const where = {
        artists: {
            some: {
                artistId: { in: favoriteArtistIds }
            }
        }
    };

    const [news, total] = await Promise.all([
        prisma.news.findMany({
            where,
            take: limit,
            skip,
            orderBy: { publishedAt: 'desc' },
            include: newsInclude,
        }),
        prisma.news.count({ where }),
    ]);

    return NextResponse.json({
        news,
        isPersonalized: true,
        followingCount: favoriteArtistIds.length,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
}
