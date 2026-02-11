import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();

    try {
        const { NewsGeneratorV2 } = require('@/lib/ai/generators/news-generator-v2');
        const { getNewsArtistExtractionService } = require('@/lib/services/news-artist-extraction-service');

        const newsGenerator = new NewsGeneratorV2();
        const extractionService = getNewsArtistExtractionService(prisma);

        // Buscar URLs já existentes para não duplicar
        const existingUrls = await prisma.news.findMany({
            select: { sourceUrl: true }
        });
        const excludeList = existingUrls.map((n: { sourceUrl: string }) => n.sourceUrl);

        // Gerar 1 notícia
        const newsItems = await newsGenerator.generateMultipleNews(1, { excludeList });

        if (newsItems.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Nenhuma notícia nova encontrada nos RSS feeds',
                duration: Date.now() - startTime,
            }, { status: 404 });
        }

        const newsData = newsItems[0];

        // Salvar no banco
        const savedNews = await prisma.news.upsert({
            where: { sourceUrl: newsData.sourceUrl },
            update: {
                title: newsData.title,
                contentMd: newsData.contentMd,
                imageUrl: newsData.imageUrl || null,
                tags: newsData.tags || null,
                publishedAt: newsData.publishedAt,
            },
            create: {
                title: newsData.title,
                sourceUrl: newsData.sourceUrl,
                contentMd: newsData.contentMd,
                imageUrl: newsData.imageUrl || null,
                tags: newsData.tags || null,
                publishedAt: newsData.publishedAt,
            },
        });

        // Extrair artistas
        const artistMentions = await extractionService.extractArtists(
            newsData.title,
            newsData.contentMd
        );

        for (const mention of artistMentions) {
            await prisma.newsArtist.upsert({
                where: {
                    newsId_artistId: {
                        newsId: savedNews.id,
                        artistId: mention.artistId,
                    }
                },
                update: {},
                create: {
                    newsId: savedNews.id,
                    artistId: mention.artistId,
                },
            });
        }

        const duration = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            duration,
            news: {
                id: savedNews.id,
                title: savedNews.title,
                sourceUrl: savedNews.sourceUrl,
                publishedAt: savedNews.publishedAt,
                tags: savedNews.tags,
                artistsCount: artistMentions.length,
                artists: artistMentions,
            },
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            duration: Date.now() - startTime,
        }, { status: 500 });
    }
}
