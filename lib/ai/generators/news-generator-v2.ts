import { getRSSNewsService, RSSNewsItem } from '../../services/rss-news-service';
import { normalizeSourceUrl } from '../../utils/url';

export interface NewsData {
    title: string;           // título original EN/KR do RSS
    contentMd: string;       // conteúdo original EN/KR do RSS
    originalTitle: string;
    originalContent: string;
    sourceUrl: string;
    publishedAt: Date;
    imageUrl?: string;
    tags?: string[];         // extraídas por keywords, sem AI
    source?: string;         // nome do feed RSS (ex: 'Soompi', 'Dramabeans')
    author?: string;         // autor do artigo original
    contentType?: string;    // comeback | mv | concert | award | ...
    readingTimeMin?: number; // tempo de leitura estimado
}

/**
 * News Generator V2 - Descoberta Rápida de Notícias Reais
 *
 * ESTRATÉGIA ATUAL (separada da tradução):
 * 1. Busca notícias reais de RSS feeds (Soompi, Koreaboo)
 * 2. Salva conteúdo original EN/KR com translationStatus='pending'
 * 3. Enriquecimento de tags é feito em processo separado (NewsTaggingService)
 *
 * BENEFÍCIOS:
 * - Discovery rápido sem esperar Ollama (~2s vs 616s antes)
 * - Controle total de estado de tradução (pending/completed/failed)
 * - Retry de traduções falhas sem re-processar RSS
 */
export class NewsGeneratorV2 {
    private rssService = getRSSNewsService();

    /**
     * Busca e retorna notícias reais sem tradução
     * Tags são enriquecidas depois pelo NewsTaggingService
     */
    async generateMultipleNews(
        count: number,
        options: { excludeList?: string[] } = {}
    ): Promise<NewsData[]> {
        console.log(`📰 Fetching ${count} real news from RSS feeds...`);

        const news: NewsData[] = [];
        const excludeUrls = new Set(options.excludeList || []);

        const recentNews = await this.rssService.fetchRecentNews(15);

        console.log(`📊 Found ${recentNews.length} news items, processing...`);

        for (const item of recentNews) {
            if (excludeUrls.has(item.link)) {
                console.log(`  ⏭️  Skipping "${item.title}" (URL already exists: ${item.link})`);
                continue;
            }

            const newsData = this.processRSSItem(item);
            news.push(newsData);
            console.log(`  ✅ Processed: ${newsData.title}`);

            if (news.length >= count) break;
        }

        console.log(`✅ Generated ${news.length} news items (pending translation)`);
        return news;
    }

    /**
     * Processa item RSS — retorna conteúdo original sem tradução
     */
    private processRSSItem(item: RSSNewsItem): NewsData {
        const content = item.content || item.description || '';
        const tags = this.extractTagsFromKeywords(item.title, item.categories);

        return {
            title: item.title,
            contentMd: content,
            originalTitle: item.title,
            originalContent: content,
            sourceUrl: normalizeSourceUrl(item.link),
            publishedAt: item.publishedAt,
            imageUrl: item.imageUrl,
            tags,
            source: item.source,
            author: item.author,
            contentType: item.contentType,
            readingTimeMin: item.readingTimeMin,
        };
    }

    /**
     * Extrai tags por keywords do título e categorias do RSS — sem AI
     */
    private extractTagsFromKeywords(title: string, categories?: string[]): string[] {
        const tags: string[] = [];

        if (categories && categories.length > 0) {
            tags.push(...categories.slice(0, 3));
        }

        const text = title.toLowerCase();

        const autoTags: Record<string, string[]> = {
            'K-pop': ['kpop', 'k-pop', 'idol', 'comeback', 'debut', 'group', 'singer'],
            'K-drama': ['kdrama', 'k-drama', 'drama', 'actor', 'actress', 'series'],
            'Filme': ['film', 'movie', 'cinema', 'premiere', 'box office'],
            'Awards': ['award', 'prize', 'winner', 'nomination', 'daesang'],
            'Música': ['music', 'album', 'single', 'mv', 'release', 'song'],
            'Variedades': ['variety', 'show', 'program', 'entertainment'],
        };

        for (const [tag, keywords] of Object.entries(autoTags)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                if (!tags.includes(tag)) {
                    tags.push(tag);
                }
            }
        }

        if (tags.length === 0) {
            tags.push('K-pop', 'Entretenimento');
        } else if (tags.length === 1) {
            tags.push('Entretenimento');
        }

        return tags.slice(0, 5);
    }

    /**
     * Busca notícias de uma fonte específica
     */
    async generateFromSource(source: string, count: number): Promise<NewsData[]> {
        console.log(`📰 Fetching news from ${source}...`);

        const items = await this.rssService.fetchFromSource(source, count * 2);
        return items.slice(0, count).map(item => this.processRSSItem(item));
    }

    /**
     * Lista fontes disponíveis
     */
    getAvailableSources(): Array<{ name: string; language: string }> {
        return this.rssService.getAvailableFeeds();
    }
}
