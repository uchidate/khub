import { SYSTEM_PROMPTS } from '../ai-config';
import type { GenerateOptions } from '../ai-config';
import { ImageSearchService } from '../../services/image-search-service';
import { getOrchestrator } from '../orchestrator-factory';

export interface NewsData {
    title: string;
    contentMd: string;
    sourceUrl: string;
    tags: string;
    publishedAt: Date;
    imageUrl?: string;
}

/**
 * Gerador de notícias sobre K-Pop e K-Drama
 * OTIMIZAÇÕES: Usa singleton AIOrchestrator (via factory)
 */
export class NewsGenerator {
    private imageService: ImageSearchService;

    constructor() {
        this.imageService = new ImageSearchService();
    }

    /**
     * Retorna o orchestrator singleton
     */
    private getOrchestrator() {
        return getOrchestrator();
    }

    /**
     * Gera uma notícia sobre K-Pop ou K-Drama
     */
    async generateNews(options?: GenerateOptions): Promise<NewsData> {
        let prompt = `Gere uma notícia REAL e RECENTE sobre K-Pop ou K-Drama que aconteceu nos últimos 3 meses.

A notícia deve ser sobre um dos seguintes tópicos:
- Lançamento de música/álbum
- Estreia de série/filme
- Prêmios e conquistas
- Colaborações internacionais
- Eventos de moda
- Anúncios de agências

IMPORTANTE: A notícia deve ser baseada em eventos REAIS que aconteceram recentemente.`;

        if (options?.excludeList && options.excludeList.length > 0) {
            prompt += `\n\nIMPORTANTE: NÃO gere uma notícia sobre os seguintes títulos (já temos na base): ${options.excludeList.join(', ')}. Escolha um evento diferente.`;
        }

        const schema = `{
  "title": "string (título chamativo em português)",
  "contentMd": "string (2-3 parágrafos em markdown, português brasileiro)",
  "sourceUrl": "string (URL de uma fonte confiável como Soompi, Allkpop, Vogue, etc)",
  "tags": "string (tags separadas por vírgula, ex: 'BTS, COMEBACK, MUSIC')",
  "publishedAt": "string (data no formato ISO 8601, deve ser recente)"
}`;

        const result = await this.getOrchestrator().generateStructured<{
            title: string;
            contentMd: string;
            sourceUrl: string;
            tags: string;
            publishedAt: string;
        }>(prompt, schema, {
            ...options,
            systemPrompt: SYSTEM_PROMPTS.news,
        });

        // Buscar imagem
        let imageUrl: string | undefined;
        try {
            const imageResult = await this.imageService.findNewsImage(result.parsed.title);
            if (imageResult) {
                imageUrl = imageResult.url;
            }
        } catch (error) {
            console.error('Failed to fetch news image:', error);
        }

        return {
            ...result.parsed,
            publishedAt: new Date(result.parsed.publishedAt),
            imageUrl,
        };
    }

    /**
     * Gera múltiplas notícias
     */
    async generateMultipleNews(count: number, options?: GenerateOptions): Promise<NewsData[]> {
        const news: NewsData[] = [];

        console.log(`📰 Generating ${count} news articles...`);

        for (let i = 0; i < count; i++) {
            try {
                console.log(`\n📝 Generating news ${i + 1}/${count}...`);
                const newsItem = await this.generateNews(options);
                news.push(newsItem);
                console.log(`✅ Generated: "${newsItem.title}"`);
            } catch (error: any) {
                console.error(`❌ Failed to generate news ${i + 1}: ${error.message}`);
            }
        }

        return news;
    }
}
