import { PrismaClient } from '@prisma/client';
import { getOrchestrator } from '../ai/orchestrator-factory';

/**
 * News Tag Enrichment Service
 *
 * Responsável por enriquecer tags de notícias usando Ollama.
 * A tradução foi removida — artigos ficam no idioma original (EN).
 *
 * Fluxo:
 * 1. Discovery (rápido): RSS → salva EN com translationStatus='pending'
 * 2. Tagging (batch): pega 'pending' → gera tags → 'completed' ou 'failed'
 */
export class NewsTaggingService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private getOrchestrator() {
        return getOrchestrator();
    }

    /**
     * Processa notícias pendentes: extrai tags melhoradas via Ollama
     */
    async translatePendingNews(limit: number = 10): Promise<{
        translated: number;
        failed: number;
        skipped: number;
    }> {
        console.log(`🏷️  Starting news tag enrichment batch (limit: ${limit})...`);

        const pendingNews = await this.prisma.news.findMany({
            where: { translationStatus: 'pending' },
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

        let translated = 0;
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
                        translationStatus: 'completed',
                        translatedAt: new Date(),
                    }
                });

                console.log(`  ✅ Tagged: ${sourceTitle.substring(0, 60)} → [${tags.join(', ')}]`);
                translated++;

            } catch (error: any) {
                console.error(`  ❌ Tagging failed for "${news.title}": ${error.message}`);

                await this.prisma.news.update({
                    where: { id: news.id },
                    data: { translationStatus: 'failed' }
                }).catch(() => {});

                failed++;
            }
        }

        console.log(`✅ Tag enrichment batch complete: ${translated} tagged, ${failed} failed, ${skipped} skipped`);
        return { translated, failed, skipped };
    }

    /**
     * Reprocessa notícias com falha
     */
    async retryFailedTranslations(limit: number = 10): Promise<number> {
        console.log(`🔄 Retrying failed news tag enrichment (limit: ${limit})...`);

        const result = await this.prisma.news.updateMany({
            where: { translationStatus: 'failed' },
            data: { translationStatus: 'pending' }
        });

        console.log(`📊 Reset ${result.count} failed to pending`);

        const stats = await this.translatePendingNews(limit);
        return stats.translated;
    }

    /**
     * Estatísticas de processamento
     */
    async getTranslationStats(): Promise<{
        pending: number;
        completed: number;
        failed: number;
        total: number;
    }> {
        const [pending, completed, failed, total] = await Promise.all([
            this.prisma.news.count({ where: { translationStatus: 'pending' } }),
            this.prisma.news.count({ where: { translationStatus: 'completed' } }),
            this.prisma.news.count({ where: { translationStatus: 'failed' } }),
            this.prisma.news.count(),
        ]);

        return { pending, completed, failed, total };
    }

    /**
     * Extrai/melhora tags usando Ollama com análise semântica do conteúdo EN
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

        // Segunda passagem: Ollama para tags semânticas melhoradas (artistas, grupos, tópicos)
        try {
            const snippet = content.substring(0, 600);
            const prompt = `You are a K-pop/K-drama content tagger. Analyze this news article and return 2-4 tags in Portuguese (PT-BR).

Title: ${title}
Content: ${snippet}

Rules:
- Tags must be in Portuguese
- Include the main artist or group name if clearly mentioned (e.g. "BTS", "BLACKPINK", "aespa")
- Include content category: K-pop, K-drama, Filme, Música, Awards, Comeback, Debut, Variedades, Colaboração, MV, Show, Polêmica, Entrevista
- Return ONLY 2-4 short tags, comma-separated, nothing else
- Example output: K-pop, BTS, Awards`;

            const result = await this.getOrchestrator().generateStructured<{ tags: string[] }>(
                prompt,
                '{ "tags": ["string"] }',
                { preferredProvider: 'ollama' }
            );

            if (result.tags?.length) {
                for (const t of result.tags) {
                    const clean = t.trim();
                    if (clean && !tags.some(existing => existing.toLowerCase() === clean.toLowerCase())) {
                        tags.push(clean);
                    }
                }
            }
        } catch {
            // Ollama pode estar offline — tags de keyword já cobrem o básico
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
