import { PrismaClient } from '@prisma/client';
import { getOrchestrator } from '../ai/orchestrator-factory';

/**
 * News Translation Service
 *
 * Responsável por traduzir notícias de EN/KR → PT-BR usando Ollama
 * Processo separado do discovery (RSS fetch) para melhor performance e controle.
 *
 * Fluxo:
 * 1. Discovery (rápido): RSS → salva EN com translationStatus='pending'
 * 2. Translation (batch): pega 'pending' → traduz → 'completed' ou 'failed'
 * 3. Retry: reseta 'failed' → 'pending' → reprocessa
 */
export class NewsTranslationService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private getOrchestrator() {
        return getOrchestrator();
    }

    /**
     * Traduz notícias pendentes em batch
     */
    async translatePendingNews(limit: number = 10): Promise<{
        translated: number;
        failed: number;
        skipped: number;
    }> {
        console.log(`📰 Starting news translation batch (limit: ${limit})...`);

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
                sourceUrl: true,
                tags: true,
                contentType: true,
            }
        });

        console.log(`📊 Found ${pendingNews.length} news pending translation`);

        let translated = 0;
        let failed = 0;
        let skipped = 0;

        for (const news of pendingNews) {
            try {
                // Usar originalTitle/originalContent se disponível (raw EN), senão usar o que está salvo
                const sourceTitle = news.originalTitle || news.title;
                const sourceContent = news.originalContent || news.contentMd;

                // Verificar se já está em português (skip)
                if (this.isAlreadyInPortuguese(sourceTitle + ' ' + sourceContent)) {
                    console.log(`  ⏭️  ${news.title} - Already in Portuguese`);
                    await this.markAsCompleted(news.id);
                    skipped++;
                    continue;
                }

                console.log(`  🔄 Translating: ${sourceTitle.substring(0, 60)}...`);

                // Traduzir título e conteúdo em paralelo
                const [translatedTitle, translatedContent] = await Promise.all([
                    this.translateTitle(sourceTitle),
                    this.translateAndFormatContent(sourceTitle, sourceContent, news.contentType ?? undefined),
                ]);

                // Extrair/melhorar tags após tradução
                const tags = await this.extractTags(translatedTitle, translatedContent, news.tags);

                // Salvar tradução
                await this.prisma.news.update({
                    where: { id: news.id },
                    data: {
                        title: translatedTitle,
                        contentMd: translatedContent,
                        tags: tags,
                        translationStatus: 'completed',
                        translatedAt: new Date(),
                    }
                });

                console.log(`  ✅ Translated: ${translatedTitle.substring(0, 60)}`);
                translated++;

                // Extrair artistas mencionados e criar relações (não-bloqueante)
                this.linkArtistsAsync(news.id, translatedTitle, translatedContent).catch(() => {});

            } catch (error: any) {
                console.error(`  ❌ Translation failed for "${news.title}": ${error.message}`);

                await this.prisma.news.update({
                    where: { id: news.id },
                    data: { translationStatus: 'failed' }
                }).catch(() => {});

                failed++;
            }
        }

        console.log(`✅ Translation batch complete: ${translated} translated, ${failed} failed, ${skipped} skipped`);
        return { translated, failed, skipped };
    }

    /**
     * Reseta notícias antigas (sem originalContent) para retradução.
     *
     * Notícias criadas antes da separação discovery/translation (PR#87) têm:
     * - originalContent = NULL (não foi salvo o EN original)
     * - contentMd = fallback EN ("**English Title**\n\nEnglish content truncated...")
     *
     * Este método:
     * 1. Copia contentMd → originalContent (preserva EN para retradução futura)
     * 2. Copia title → originalTitle (preserva título atual)
     * 3. Reseta translationStatus = 'pending'
     */
    async resetOldNewsForRetranslation(): Promise<number> {
        console.log(`🔄 Resetting old news (no originalContent) for retranslation...`);

        // Buscar notícias antigas que não têm originalContent (criadas antes do PR#87)
        const oldNews = await this.prisma.news.findMany({
            where: { originalContent: null, translationStatus: 'completed' },
            select: { id: true, title: true, contentMd: true },
            orderBy: { publishedAt: 'desc' },
        });

        console.log(`📊 Found ${oldNews.length} old news to reset for retranslation`);

        if (oldNews.length === 0) return 0;

        // Atualizar em lotes de 50 para evitar timeout
        const BATCH = 50;
        let count = 0;

        for (let i = 0; i < oldNews.length; i += BATCH) {
            const batch = oldNews.slice(i, i + BATCH);
            await Promise.all(batch.map(news =>
                this.prisma.news.update({
                    where: { id: news.id },
                    data: {
                        originalTitle: news.title,
                        originalContent: news.contentMd,
                        translationStatus: 'pending',
                        translatedAt: null,
                    }
                })
            ));
            count += batch.length;
            console.log(`  ♻️  Reset ${count}/${oldNews.length}...`);
        }

        console.log(`✅ Reset ${count} old news to pending for retranslation`);
        return count;
    }

    /**
     * Expande artigos existentes com conteúdo curto (<600 chars)
     * Usa o novo prompt de expansão para enriquecer o contentMd
     */
    async expandShortArticles(limit: number = 10): Promise<{ expanded: number; failed: number }> {
        console.log(`📰 Looking for short articles to expand (limit: ${limit})...`);

        const shortNews = await this.prisma.news.findMany({
            where: {
                translationStatus: 'completed',
                OR: [
                    // Artigos curtos (menos de 600 chars de conteúdo)
                    { contentMd: { not: { contains: '\n\n' } } },
                ],
            },
            orderBy: { publishedAt: 'desc' },
            take: limit * 3, // pega mais para filtrar no código
            select: {
                id: true,
                title: true,
                contentMd: true,
                originalContent: true,
                originalTitle: true,
            }
        });

        // Filtrar os genuinamente curtos
        const toExpand = shortNews
            .filter(n => n.contentMd.length < 600)
            .slice(0, limit);

        console.log(`📊 Found ${toExpand.length} short articles to expand`);

        let expanded = 0;
        let failed = 0;

        for (const news of toExpand) {
            try {
                const sourceTitle = news.originalTitle || news.title;
                const sourceContent = news.originalContent || news.contentMd;

                console.log(`  🔄 Expanding: ${news.title.substring(0, 60)}...`);

                const expandedContent = await this.translateAndFormatContent(sourceTitle, sourceContent);

                if (expandedContent && expandedContent.length > news.contentMd.length + 50) {
                    await this.prisma.news.update({
                        where: { id: news.id },
                        data: { contentMd: expandedContent },
                    });
                    console.log(`  ✅ Expanded: ${news.title.substring(0, 60)} (${news.contentMd.length} → ${expandedContent.length} chars)`);
                    expanded++;
                } else {
                    console.log(`  ⏭️  Skipped (no improvement): ${news.title.substring(0, 60)}`);
                }
            } catch (error: any) {
                console.error(`  ❌ Expand failed for "${news.title}": ${error.message}`);
                failed++;
            }
        }

        console.log(`✅ Expand batch complete: ${expanded} expanded, ${failed} failed`);
        return { expanded, failed };
    }

    /**
     * Reprocessa notícias com falha
     */
    async retryFailedTranslations(limit: number = 10): Promise<number> {
        console.log(`🔄 Retrying failed news translations (limit: ${limit})...`);

        const result = await this.prisma.news.updateMany({
            where: { translationStatus: 'failed' },
            data: { translationStatus: 'pending' }
        });

        console.log(`📊 Reset ${result.count} failed translations to pending`);

        const stats = await this.translatePendingNews(limit);
        return stats.translated;
    }

    /**
     * Estatísticas de tradução
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
     * Marca notícia como traduzida sem alterar conteúdo
     */
    private async markAsCompleted(newsId: string): Promise<void> {
        await this.prisma.news.update({
            where: { id: newsId },
            data: { translationStatus: 'completed', translatedAt: new Date() }
        });
    }

    /**
     * Verifica se o texto já está em português
     */
    private isAlreadyInPortuguese(text: string): boolean {
        const ptWords = ['é', 'está', 'são', 'foi', 'para', 'com', 'uma', 'por', 'mais', 'que'];
        const lowerText = text.toLowerCase();
        const matchCount = ptWords.filter(word => lowerText.includes(` ${word} `)).length;
        return matchCount >= 3;
    }

    /**
     * Traduz título para português
     */
    private async translateTitle(title: string): Promise<string> {
        if (title.length < 10) return title;

        try {
            const prompt = `Traduza o seguinte título de notícia sobre K-pop/K-drama para português brasileiro de forma natural e atrativa:

"${title}"

Mantenha nomes próprios (artistas, grupos, programas) no original.
Retorne apenas a tradução, sem aspas ou formatação extra.`;

            const result = await this.getOrchestrator().generateStructured<{ translation: string }>(
                prompt,
                '{ "translation": "string" }',
                { preferredProvider: 'ollama' }
            );

            return result.translation || title;
        } catch (error: any) {
            console.warn(`⚠️  Title translation failed: ${error.message}`);
            return title;
        }
    }

    /**
     * Traduz e expande conteúdo para markdown PT-BR completo.
     * @param contentType Tipo de conteúdo (comeback, mv, concert, award, etc.) para contexto extra
     */
    async translateAndFormatContent(title: string, content: string, contentType?: string): Promise<string> {
        if (!content || content.trim().length < 20) {
            return `**${title}**\n\n*Conteúdo não disponível.*`;
        }

        const maxLength = 8000;
        const sourceText = content.length > maxLength
            ? content.substring(0, maxLength)
            : content;

        const typeContext: Record<string, string> = {
            comeback:      'Este artigo é sobre o comeback (retorno/lançamento de álbum) de um artista ou grupo.',
            mv:            'Este artigo é sobre um novo clipe (MV), teaser ou vídeo musical.',
            concert:       'Este artigo é sobre shows, world tours, fan meetings ou eventos ao vivo.',
            award:         'Este artigo é sobre premiações, conquistas, recordes ou rankings.',
            collaboration: 'Este artigo é sobre uma colaboração musical, participação especial (feat.) ou trilha sonora (OST).',
            interview:     'Este artigo é sobre uma entrevista, revelações ou declarações do artista.',
            drama:         'Este artigo é sobre um K-drama, série ou produção coreana.',
            debut:         'Este artigo é sobre o debut (estreia) de um novo artista ou grupo.',
            scandal:       'Este artigo cobre uma polêmica, controvérsia ou notícia sensível.',
        }
        const typeHint = contentType && typeContext[contentType]
            ? `\n**Contexto:** ${typeContext[contentType]}`
            : ''

        try {
            const prompt = `Você é um jornalista especializado em cultura coreana escrevendo para o portal HallyuHub, maior comunidade brasileira de K-pop e K-drama.

Com base no título e no conteúdo original abaixo, escreva um artigo completo e envolvente em português brasileiro:

**Título original (EN):** ${title}${typeHint}

**Conteúdo original:**
${sourceText}

**INSTRUÇÕES OBRIGATÓRIAS:**
- Traduza o conteúdo original com fidelidade — NÃO invente fatos que não estejam no original
- Mínimo 4 parágrafos bem desenvolvidos (objetivo: 350-500 palavras)
- Após traduzir, EXPANDA com contexto relevante quando o original for curto:
  - Histórico do artista/grupo mencionado
  - Impacto e relevância para os fãs brasileiros
  - Contexto dentro da indústria K-pop/K-drama
- Mantenha nomes próprios no original (artistas, grupos, programas, álbuns, prêmios)
- Preserve termos técnicos do K-pop/K-drama: MAMA, Gaon, Melon, Hanteo, daesang, bonsang, comeback, debut, MV
- Use **negrito** para nomes de artistas/grupos na primeira menção e datas importantes
- Em artigos com múltiplos tópicos, use ## Subtítulo para separar seções
- Tom: jornalístico, apaixonado e acessível para fãs brasileiros
- Parágrafos separados por linha em branco
- NÃO adicione título no início (ele já aparece separado na página)
- NÃO adicione rodapé ou crédito de fonte`;

            const result = await this.getOrchestrator().generateStructured<{ content: string }>(
                prompt,
                '{ "content": "string (artigo completo em markdown PT-BR, mínimo 4 parágrafos)" }',
                { preferredProvider: 'ollama', maxTokens: 2500 }
            );

            if (!result.content || result.content.length < 100) {
                throw new Error('Content too short');
            }

            return result.content;
        } catch (error: any) {
            console.warn(`⚠️  Content generation failed: ${error.message}`);
            return `${sourceText.substring(0, 500)}`;
        }
    }

    /**
     * Extrai/melhora tags da notícia traduzida
     */
    private async extractTags(
        title: string,
        content: string,
        existingTags: string[]
    ): Promise<string[]> {
        // Se já tem tags suficientes, usar as existentes
        if (existingTags && existingTags.length >= 3) {
            return existingTags;
        }

        const tags = [...(existingTags || [])];
        const text = (title + ' ' + content).toLowerCase();

        const autoTags: Record<string, string[]> = {
            'K-pop': ['kpop', 'k-pop', 'idol', 'comeback', 'debut', 'grupo', 'grupo'],
            'K-drama': ['kdrama', 'k-drama', 'drama', 'série', 'ator', 'atriz'],
            'Filme': ['filme', 'movie', 'cinema', 'estreia', 'bilheteria'],
            'Awards': ['award', 'prêmio', 'vencedor', 'indicação', 'daesang'],
            'Música': ['música', 'album', 'single', 'mv', 'lançamento'],
            'Variedades': ['variedades', 'variety', 'programa', 'show'],
        };

        for (const [tag, keywords] of Object.entries(autoTags)) {
            if (keywords.some(kw => text.includes(kw)) && !tags.includes(tag)) {
                tags.push(tag);
            }
        }

        // Usar AI apenas se temos poucas tags
        if (tags.length < 2) {
            try {
                const result = await this.getOrchestrator().generateStructured<{ tags: string[] }>(
                    `Com base no título abaixo, sugira 2-3 tags em português:\n\nTítulo: ${title}\n\nEscolha entre: K-pop, K-drama, Filme, Música, Awards, Variedades, Entretenimento`,
                    '{ "tags": ["string"] }',
                    { preferredProvider: 'ollama' }
                );
                if (result.tags?.length) {
                    result.tags.forEach(t => { if (!tags.includes(t)) tags.push(t); });
                }
            } catch { /* não-bloqueante */ }
        }

        if (tags.length === 0) tags.push('K-pop', 'Entretenimento');
        else if (tags.length === 1) tags.push('Entretenimento');

        return tags.slice(0, 5);
    }

    /**
     * Extrai artistas mencionados e cria relações (executa em background)
     */
    private async linkArtistsAsync(newsId: string, title: string, content: string): Promise<void> {
        try {
            const { getNewsArtistExtractionService } = require('@/lib/services/news-artist-extraction-service');
            const extractionService = getNewsArtistExtractionService(this.prisma);
            const mentions = await extractionService.extractArtists(title, content);

            for (const mention of mentions) {
                await this.prisma.newsArtist.upsert({
                    where: { newsId_artistId: { newsId, artistId: mention.artistId } },
                    update: {},
                    create: { newsId, artistId: mention.artistId },
                });
            }
        } catch { /* não-bloqueante */ }
    }
}

let newsTranslationService: NewsTranslationService | null = null;

export function getNewsTranslationService(prisma: PrismaClient): NewsTranslationService {
    if (!newsTranslationService) {
        newsTranslationService = new NewsTranslationService(prisma);
    }
    return newsTranslationService;
}
