import { PrismaClient } from '@prisma/client';

/**
 * News Tag Enrichment Service
 *
 * Responsável por completar tags de notícias por regras determinísticas.
 * Não altera tradução: artigos continuam pendentes até a revisão manual.
 *
 * Fluxo:
 * 1. Discovery (rápido): RSS salva a notícia como rascunho
 * 2. Tagging (batch): pega rascunhos, gera tags e libera para revisão
 */
export class NewsTaggingService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Processa notícias pendentes: completa tags por regras locais.
     */
    async tagDraftNews(limit: number = 10): Promise<{
        tagged: number;
        failed: number;
        skipped: number;
    }> {
        console.log(`🏷️  Starting news tag enrichment batch (limit: ${limit})...`);

        const pendingNews = await this.prisma.news.findMany({
            where: { status: 'draft' },
            orderBy: { createdAt: 'asc' },
            take: limit,
            select: {
                id: true,
                title: true,
                contentMd: true,
                originalTitle: true,
                originalContent: true,
                tags: true,
                contentType: true,
            }
        });

        console.log(`📊 Found ${pendingNews.length} news pending tag enrichment`);

        let tagged = 0;
        let failed = 0;
        let skipped = 0;

        for (const news of pendingNews) {
            try {
                const sourceTitle = news.originalTitle || news.title;
                const sourceContent = news.originalContent || news.contentMd;

                console.log(`  🏷️  Tagging: ${sourceTitle.substring(0, 60)}...`);

                const tags = await this.extractTags(sourceTitle, sourceContent, news.tags, news.contentType ?? undefined);

                await this.prisma.news.update({
                    where: { id: news.id },
                    data: {
                        tags,
                        status: 'ready',
                    }
                });

                console.log(`  ✅ Tagged: ${sourceTitle.substring(0, 60)} → [${tags.join(', ')}]`);
                tagged++;

            } catch (error: any) {
                console.error(`  ❌ Tagging failed for "${news.title}": ${error.message}`);

                failed++;
            }
        }

        console.log(`✅ Tag enrichment batch complete: ${tagged} tagged, ${failed} failed, ${skipped} skipped`);
        return { tagged, failed, skipped };
    }

    /**
     * Extrai tags por palavras-chave e classificação já conhecida da notícia.
     */
    private async extractTags(
        title: string,
        content: string,
        existingTags: string[],
        contentType?: string,
    ): Promise<string[]> {
        // Primeira passagem: tags automáticas por palavras-chave (rápido, sem AI)
        const tags: string[] = [...(existingTags || [])];
        const text = (title + ' ' + content.substring(0, 800)).toLowerCase();

        const autoTags: Record<string, string[]> = {
            'K-pop':       ['kpop', 'k-pop', 'idol', 'comeback', 'debut', 'bts', 'blackpink', 'twice', 'aespa', 'stray kids'],
            'K-drama':     ['kdrama', 'k-drama', 'drama', 'series', 'episode', 'cast', 'broadcast'],
            'Filme':       ['film', 'movie', 'cinema', 'box office'],
            'Awards':      ['award', 'wins', 'winner', 'daesang', 'bonsang', 'mama', 'golden disc', 'melon music'],
            'Música':      ['album', 'single', 'mv', 'music video', 'release', 'track', 'song'],
            'Comeback':    ['comeback', 'returns with', 'new album', 'mini album'],
            'Debut':       ['debut', 'debuts', 'new group'],
            'Variedades':  ['variety', 'show', 'running man', 'knowing brothers'],
            'Colaboração': ['feat.', 'featuring', 'collab', 'ost', 'soundtrack'],
        };

        for (const [tag, keywords] of Object.entries(autoTags)) {
            if (keywords.some(kw => text.includes(kw)) && !tags.includes(tag)) {
                tags.push(tag);
            }
        }

        // Adicionar tag de contentType se disponível
        const contentTypeTagMap: Record<string, string> = {
            comeback:      'Comeback',
            mv:            'MV',
            concert:       'Show',
            award:         'Awards',
            collaboration: 'Colaboração',
            interview:     'Entrevista',
            drama:         'K-drama',
            debut:         'Debut',
            scandal:       'Polêmica',
        };
        if (contentType && contentTypeTagMap[contentType] && !tags.includes(contentTypeTagMap[contentType])) {
            tags.unshift(contentTypeTagMap[contentType]);
        }

        if (tags.length === 0) tags.push('K-pop', 'Entretenimento');
        else if (tags.length === 1) tags.push('K-pop');

        return tags.slice(0, 5);
    }
}

let newsTaggingService: NewsTaggingService | null = null;

export function getNewsTaggingService(prisma: PrismaClient): NewsTaggingService {
    if (!newsTaggingService) {
        newsTaggingService = new NewsTaggingService(prisma);
    }
    return newsTaggingService;
}
