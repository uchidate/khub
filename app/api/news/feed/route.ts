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

function buildWhereClause(filters: {
    search?: string;
    artistId?: string;
    source?: string;
    from?: string;
    to?: string;
    favoriteArtistIds?: string[];
}) {
    const where: any = {};

    // Feed personalizado: filtrar por artistas favoritos
    if (filters.favoriteArtistIds && filters.favoriteArtistIds.length > 0) {
        where.artists = {
            some: {
                artistId: { in: filters.favoriteArtistIds }
            }
        };
    }

    // Filtro por artista específico (sobrescreve personalização)
    if (filters.artistId) {
        where.artists = {
            some: {
                artistId: filters.artistId
            }
        };
    }

    // Busca por texto (título ou conteúdo)
    if (filters.search) {
        where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { contentMd: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    // Filtro por fonte
    if (filters.source) {
        where.sourceUrl = { contains: filters.source, mode: 'insensitive' };
    }

    // Filtro por data
    if (filters.from || filters.to) {
        where.publishedAt = {};
        if (filters.from) {
            where.publishedAt.gte = new Date(filters.from);
        }
        if (filters.to) {
            const toDate = new Date(filters.to);
            toDate.setHours(23, 59, 59, 999); // Incluir o dia inteiro
            where.publishedAt.lte = toDate;
        }
    }

    return where;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Filtros
    const search = searchParams.get('search') || undefined;
    const artistId = searchParams.get('artistId') || undefined;
    const source = searchParams.get('source') || undefined;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    const session = await getServerSession(authOptions);

    // Feed sem autenticação: retorna tudo ordenado por data (com filtros)
    if (!session?.user?.email) {
        const where = buildWhereClause({ search, artistId, source, from, to });

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
            isPersonalized: false,
            followingCount: 0,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            filters: { search, artistId, source, from, to },
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

    // Sem favoritos: feed padrão com mensagem (com filtros)
    if (favoriteArtistIds.length === 0) {
        const where = buildWhereClause({ search, artistId, source, from, to });

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
            isPersonalized: false,
            followingCount: 0,
            message: 'Siga artistas para ter um feed personalizado!',
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            filters: { search, artistId, source, from, to },
        });
    }

    // Feed personalizado: apenas notícias dos artistas seguidos (com filtros adicionais)
    const where = buildWhereClause({
        search,
        artistId,
        source,
        from,
        to,
        favoriteArtistIds: artistId ? undefined : favoriteArtistIds, // Se filtrar por artista específico, ignora personalização
    });

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
        isPersonalized: !artistId && favoriteArtistIds.length > 0,
        followingCount: favoriteArtistIds.length,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        filters: { search, artistId, source, from, to },
    });
}
