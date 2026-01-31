import { AIOrchestrator } from '../orchestrator';
import { SYSTEM_PROMPTS } from '../ai-config';
import type { GenerateOptions } from '../ai-config';

export interface NewsData {
    title: string;
    contentMd: string;
    sourceUrl: string;
    tags: string;
    publishedAt: Date;
}

/**
 * Gerador de notícias sobre K-Pop e K-Drama
 */
export class NewsGenerator {
    constructor(private orchestrator: AIOrchestrator) { }

    /**
     * Gera uma notícia sobre K-Pop ou K-Drama
     */
    async generateNews(options?: GenerateOptions): Promise<NewsData> {
        const prompt = `Gere uma notícia REAL e RECENTE sobre K-Pop ou K-Drama que aconteceu nos últimos 3 meses.

A notícia deve ser sobre um dos seguintes tópicos:
- Lançamento de música/álbum
- Estreia de série/filme
- Prêmios e conquistas
- Colaborações internacionais
- Eventos de moda
- Anúncios de agências

IMPORTANTE: A notícia deve ser baseada em eventos REAIS que aconteceram recentemente.`;

        const schema = `{
  "title": "string (título chamativo em português)",
  "contentMd": "string (2-3 parágrafos em markdown, português brasileiro)",
  "sourceUrl": "string (URL de uma fonte confiável como Soompi, Allkpop, Vogue, etc)",
  "tags": "string (tags separadas por vírgula, ex: 'BTS, COMEBACK, MUSIC')",
  "publishedAt": "string (data no formato ISO 8601, deve ser recente)"
}`;

        const result = await this.orchestrator.generateStructured<{
            title: string;
            contentMd: string;
            sourceUrl: string;
            tags: string;
            publishedAt: string;
        }>(prompt, schema, {
            ...options,
            systemPrompt: SYSTEM_PROMPTS.news,
        });

        return {
            ...result,
            publishedAt: new Date(result.publishedAt),
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
