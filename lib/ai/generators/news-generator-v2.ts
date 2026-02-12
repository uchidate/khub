import { getRSSNewsService, RSSNewsItem } from '../../services/rss-news-service';
import { getOrchestrator } from '../orchestrator-factory';

export interface NewsData {
    title: string;
    contentMd: string;
    sourceUrl: string;
    publishedAt: Date;
    imageUrl?: string;
    tags?: string[];
}

/**
 * News Generator V2 - Notícias 100% Reais
 *
 * NOVA ESTRATÉGIA:
 * 1. Busca notícias reais de RSS feeds (AllKpop, Soompi, Koreaboo)
 * 2. Traduz EN→PT com Gemini/Ollama
 * 3. Extrai/gera tags relevantes
 *
 * TIPOS DE NOTÍCIAS:
 * - Artistas coreanos (K-pop, K-drama)
 * - Filmes e séries coreanos
 * - Entretenimento coreano em geral
 *
 * BENEFÍCIOS:
 * - Reduz chamadas AI em ~90% (apenas traduções)
 * - Notícias 100% reais e verificadas
 * - Conteúdo sempre atual e relevante
 */
export class NewsGeneratorV2 {
    private rssService = getRSSNewsService();

    /**
     * Retorna o orchestrator singleton
     */
    private getOrchestrator() {
        return getOrchestrator();
    }

    /**
     * Gera múltiplas notícias reais
     */
    async generateMultipleNews(
        count: number,
        options: { excludeList?: string[] } = {}
    ): Promise<NewsData[]> {
        console.log(`📰 Fetching ${count} real news from RSS feeds...`);

        const news: NewsData[] = [];
        const excludeUrls = new Set(options.excludeList || []);

        // Buscar notícias recentes de todos os feeds
        const recentNews = await this.rssService.fetchRecentNews(15); // Buscar mais para ter opções

        console.log(`📊 Found ${recentNews.length} news items, processing...`);

        for (const item of recentNews) {
            // Pular se URL já existe
            if (excludeUrls.has(item.link)) {
                console.log(`  ⏭️  Skipping "${item.title}" (URL already exists: ${item.link})`);
                continue;
            }

            try {
                const newsData = await this.processRSSItem(item);
                news.push(newsData);
                console.log(`  ✅ Processed: ${newsData.title}`);

                if (news.length >= count) break;
            } catch (error: any) {
                console.error(`  ❌ Failed to process "${item.title}": ${error.message}`);
                continue;
            }
        }

        console.log(`✅ Generated ${news.length} news items`);
        return news;
    }

    /**
     * Processa um item de RSS feed
     * OTIMIZAÇÃO: Processa traduções em paralelo (2-3x mais rápido)
     */
    private async processRSSItem(item: RSSNewsItem): Promise<NewsData> {
        // Processar título e conteúdo em paralelo
        const [titlePT, contentMd] = await Promise.all([
            this.translateTitle(item.title),
            this.translateAndFormatContent(
                item.title,
                item.content || item.description,
                item.source
            ),
        ]);

        // Tags dependem de título e conteúdo traduzidos, então executam depois
        const tags = await this.extractTags(
            titlePT,
            contentMd,
            item.categories
        );

        return {
            title: titlePT,
            contentMd,
            sourceUrl: item.link,
            publishedAt: item.publishedAt,
            imageUrl: item.imageUrl,
            tags,
        };
    }

    /**
     * Traduz título da notícia para português
     */
    private async translateTitle(title: string): Promise<string> {
        // Se já está em português ou tem poucos caracteres, retornar
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
            return title; // Fallback: manter original
        }
    }

    /**
     * Traduz e formata conteúdo para markdown
     */
    private async translateAndFormatContent(
        title: string,
        content: string,
        source: string
    ): Promise<string> {
        // AUMENTADO: Limite ainda maior para notícias completas (não resumir)
        const maxLength = 6000;
        let textToTranslate = content;

        if (content.length > maxLength) {
            // Se MUITO longo, resumir primeiro (mas mantendo muito mais conteúdo)
            textToTranslate = await this.summarizeContent(content);
        }

        try {
            const prompt = `Traduza a seguinte notícia sobre K-pop/K-drama/cinema coreano para português brasileiro:

Título: ${title}

Conteúdo:
${textToTranslate}

Requisitos CRÍTICOS:
- Tradução COMPLETA e natural em português brasileiro
- Manter nomes próprios (artistas, grupos, programas, filmes) no original
- Formato markdown com parágrafos bem estruturados
- Use **negrito** para destaques importantes (nomes, títulos, datas)
- MÍNIMO 8-12 parágrafos detalhados e informativos
- Tom jornalístico mas acessível e envolvente
- Adicione contexto adicional quando relevante (ex: "o grupo que lançou X em Y")
- Inclua TODOS os detalhes: datas, números, citações, contexto, background
- NÃO omita informações - traduza TUDO
- Ao final adicione: "\n\n---\n\n*Fonte: ${source}*"

IMPORTANTE: A notícia deve ser COMPLETA - não resumir, não omitir detalhes!`;

            const result = await this.getOrchestrator().generateStructured<{ content: string }>(
                prompt,
                '{ "content": "string (conteúdo COMPLETO em markdown)" }',
                { preferredProvider: 'ollama', maxTokens: 1500 }
            );

            return result.content;
        } catch (error: any) {
            console.warn(`⚠️  Content translation failed: ${error.message}`);

            // Fallback: conteúdo mínimo em português
            return `**${title}**\n\n${textToTranslate.substring(0, 500)}...\n\n---\n\n*Fonte: ${source}*`;
        }
    }

    /**
     * Resume conteúdo muito longo
     */
    private async summarizeContent(longContent: string): Promise<string> {
        try {
            // AUMENTADO: Pegar muito mais conteúdo para resumir (quase completo)
            const excerpt = longContent.substring(0, 5000);

            const prompt = `Resuma o seguinte texto sobre K-pop/K-drama em 1000-1500 palavras, mantendo TODOS os pontos importantes e MÁXIMO de detalhes:

${excerpt}

Requisitos CRÍTICOS:
- Foque em TODOS os fatos importantes - não omita nada relevante
- Mantenha TODOS os nomes próprios, datas, números, citações
- Preserve contexto e background da notícia
- Estruture em 8-12 parágrafos detalhados
- Seja COMPLETO e informativo - não resuma demais
- Mantenha a essência e profundidade da notícia original

IMPORTANTE: O objetivo é ter notícias COMPLETAS, não resumos curtos!`;

            const result = await this.getOrchestrator().generateStructured<{ summary: string }>(
                prompt,
                '{ "summary": "string (resumo COMPLETO e detalhado)" }',
                { preferredProvider: 'ollama', maxTokens: 1500 }
            );

            return result.summary;
        } catch (error) {
            // Fallback: retornar primeiros 2000 chars (mais que antes)
            return longContent.substring(0, 2000);
        }
    }

    /**
     * Extrai tags relevantes da notícia
     */
    private async extractTags(
        title: string,
        content: string,
        existingCategories?: string[]
    ): Promise<string[]> {
        // Se já tem categorias do RSS, usar elas primeiro
        const tags: string[] = [];

        if (existingCategories && existingCategories.length > 0) {
            tags.push(...existingCategories.slice(0, 3));
        }

        // Detectar tags comuns automaticamente
        const text = (title + ' ' + content).toLowerCase();

        const autoTags: Record<string, string[]> = {
            'K-pop': ['kpop', 'k-pop', 'idol', 'grupo', 'comeback', 'debut'],
            'K-drama': ['kdrama', 'k-drama', 'drama', 'série', 'ator', 'atriz'],
            'Filme': ['filme', 'movie', 'cinema', 'estreia'],
            'Awards': ['award', 'prêmio', 'vencedor', 'indicação'],
            'Música': ['música', 'music', 'album', 'single', 'mv'],
            'Variedades': ['variety', 'programa', 'show'],
        };

        for (const [tag, keywords] of Object.entries(autoTags)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                if (!tags.includes(tag)) {
                    tags.push(tag);
                }
            }
        }

        // Se ainda tem poucas tags, gerar com AI
        if (tags.length < 2) {
            try {
                const prompt = `Com base no título e conteúdo abaixo, sugira 2-3 tags/categorias relevantes:

Título: ${title}

Escolha entre: K-pop, K-drama, Filme, Música, Awards, Variedades, Entretenimento, Lançamento, Notícia`;

                const result = await this.getOrchestrator().generateStructured<{ tags: string[] }>(
                    prompt,
                    '{ "tags": ["string"] }',
                    { preferredProvider: 'ollama' }
                );

                if (result.tags && result.tags.length > 0) {
                    result.tags.forEach(tag => {
                        if (!tags.includes(tag)) {
                            tags.push(tag);
                        }
                    });
                }
            } catch (error) {
                console.warn('⚠️  Tag generation failed, using defaults');
            }
        }

        // Garantir pelo menos 2 tags
        if (tags.length === 0) {
            tags.push('K-pop', 'Entretenimento');
        } else if (tags.length === 1) {
            tags.push('Entretenimento');
        }

        return tags.slice(0, 5); // Máximo 5 tags
    }

    /**
     * Busca notícias de uma fonte específica
     */
    async generateFromSource(
        source: string,
        count: number
    ): Promise<NewsData[]> {
        console.log(`📰 Fetching news from ${source}...`);

        const items = await this.rssService.fetchFromSource(source, count * 2);
        const news: NewsData[] = [];

        for (const item of items.slice(0, count)) {
            try {
                const newsData = await this.processRSSItem(item);
                news.push(newsData);
            } catch (error: any) {
                console.error(`Failed to process: ${error.message}`);
            }
        }

        return news;
    }

    /**
     * Lista fontes disponíveis
     */
    getAvailableSources(): Array<{ name: string; language: string }> {
        return this.rssService.getAvailableFeeds();
    }
}
