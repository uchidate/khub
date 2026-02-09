/**
 * RSS News Service
 *
 * Busca notícias reais de feeds RSS de sites K-pop
 * Estratégia: Dados 100% reais ao invés de gerados por AI
 *
 * Fontes RSS (gratuitas):
 * - AllKpop: https://www.allkpop.com/rss
 * - Soompi: https://www.soompi.com/feed
 * - Koreaboo: https://www.koreaboo.com/feed/
 */

import { parseStringPromise } from 'xml2js';

interface RSSFeed {
  name: string;
  url: string;
  language: string;
}

export interface RSSNewsItem {
  title: string;
  link: string;
  description: string;
  content?: string;
  publishedAt: Date;
  imageUrl?: string;
  source: string;
  categories?: string[];
}

const RSS_FEEDS: RSSFeed[] = [
  {
    name: 'Soompi',
    url: 'https://www.soompi.com/feed',
    language: 'en',
  },
  {
    name: 'Koreaboo',
    url: 'https://www.koreaboo.com/feed/',
    language: 'en',
  },
  {
    name: 'KpopStarz',
    url: 'https://www.kpopstarz.com/rss',
    language: 'en',
  },
  // AllKpop removido temporariamente (retorna 404)
  // {
  //   name: 'AllKpop',
  //   url: 'https://www.allkpop.com/rss',
  //   language: 'en',
  // },
];

/**
 * Service para buscar notícias reais de RSS feeds K-pop
 */
export class RSSNewsService {
  /**
   * Busca notícias recentes de todos os feeds
   */
  async fetchRecentNews(maxPerFeed: number = 5): Promise<RSSNewsItem[]> {
    console.log(`📰 Fetching recent news from ${RSS_FEEDS.length} RSS feeds...`);

    const allNews: RSSNewsItem[] = [];

    for (const feed of RSS_FEEDS) {
      try {
        const items = await this.fetchFeed(feed, maxPerFeed);
        allNews.push(...items);
        console.log(`  ✅ ${feed.name}: ${items.length} items`);
      } catch (error) {
        console.error(`  ❌ ${feed.name}: ${error}`);
      }
    }

    // Ordenar por data (mais recente primeiro)
    allNews.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    console.log(`✅ Total: ${allNews.length} news items fetched`);
    return allNews;
  }

  /**
   * Busca items de um feed específico
   */
  private async fetchFeed(feed: RSSFeed, maxItems: number): Promise<RSSNewsItem[]> {
    try {
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HallyuHub/1.0; +https://hallyuhub.com)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const parsed = await parseStringPromise(xmlText);

      // RSS 2.0 format
      if (parsed.rss?.channel?.[0]?.item) {
        return await this.parseRSS2Items(parsed.rss.channel[0].item, feed, maxItems);
      }

      // Atom format
      if (parsed.feed?.entry) {
        return this.parseAtomEntries(parsed.feed.entry, feed, maxItems);
      }

      throw new Error('Unknown RSS format');
    } catch (error: any) {
      throw new Error(`Failed to fetch ${feed.name}: ${error.message}`);
    }
  }

  /**
   * Parse RSS 2.0 items
   */
  private async parseRSS2Items(items: any[], feed: RSSFeed, maxItems: number): Promise<RSSNewsItem[]> {
    const newsItems: RSSNewsItem[] = [];

    for (const item of items.slice(0, maxItems)) {
      try {
        // Título
        const title = this.extractText(item.title);
        if (!title) continue;

        // Link
        const link = this.extractText(item.link);
        if (!link) continue;

        // Descrição
        const description = this.extractText(item.description) || '';

        // Conteúdo completo (se disponível)
        const content =
          this.extractText(item['content:encoded']) ||
          this.extractText(item.content) ||
          '';

        // Data de publicação
        const pubDate = this.parseDate(
          this.extractText(item.pubDate) || this.extractText(item.published)
        );

        // Imagem (tentar múltiplos campos)
        let imageUrl =
          this.extractImageUrl(item.enclosure) ||
          this.extractImageUrl(item['media:content']) ||
          this.extractImageUrl(item['media:thumbnail']) ||
          this.extractImageFromContent(content || description);

        // Se ainda não tem imagem, tentar buscar da página (fallback assíncrono)
        // Nota: Isso vai tornar o parsing mais lento, mas melhora a qualidade
        if (!imageUrl && link) {
          imageUrl = await this.fetchImageFromArticle(link);
        }

        // Categorias
        const categories = this.extractCategories(item.category);

        newsItems.push({
          title: this.cleanHtml(title),
          link,
          description: this.cleanHtml(description),
          content: content ? this.cleanHtml(content) : undefined,
          publishedAt: pubDate,
          imageUrl,
          source: feed.name,
          categories,
        });
      } catch (error) {
        console.warn(`Failed to parse RSS item:`, error);
        continue;
      }
    }

    return newsItems;
  }

  /**
   * Parse Atom entries
   */
  private parseAtomEntries(entries: any[], feed: RSSFeed, maxItems: number): RSSNewsItem[] {
    const newsItems: RSSNewsItem[] = [];

    for (const entry of entries.slice(0, maxItems)) {
      try {
        const title = this.extractText(entry.title);
        if (!title) continue;

        // Link pode estar em formato diferente no Atom
        let link = '';
        if (Array.isArray(entry.link)) {
          const linkObj = entry.link.find((l: any) => l.$.rel === 'alternate');
          link = linkObj?.$.href || entry.link[0]?.$.href || '';
        } else if (entry.link?.$?.href) {
          link = entry.link.$.href;
        }

        if (!link) continue;

        const description = this.extractText(entry.summary) || '';
        const content = this.extractText(entry.content) || '';
        const pubDate = this.parseDate(
          this.extractText(entry.published) || this.extractText(entry.updated)
        );

        newsItems.push({
          title: this.cleanHtml(title),
          link,
          description: this.cleanHtml(description),
          content: content ? this.cleanHtml(content) : undefined,
          publishedAt: pubDate,
          source: feed.name,
        });
      } catch (error) {
        console.warn(`Failed to parse Atom entry:`, error);
        continue;
      }
    }

    return newsItems;
  }

  /**
   * Extrai texto de um campo XML (pode ser string ou objeto)
   */
  private extractText(field: any): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (Array.isArray(field)) return this.extractText(field[0]);
    if (field._) return field._;
    if (typeof field === 'object') return field.toString();
    return '';
  }

  /**
   * Extrai URL de imagem de campos de mídia
   */
  private extractImageUrl(field: any): string | undefined {
    if (!field) return undefined;

    // enclosure (RSS 2.0)
    if (Array.isArray(field)) {
      for (const item of field) {
        if (item.$ && item.$.url && item.$.type?.startsWith('image/')) {
          return item.$.url;
        }
      }
    }

    // media:content ou media:thumbnail
    if (field.$ && field.$.url) {
      return field.$.url;
    }

    return undefined;
  }

  /**
   * Extrai primeira imagem do conteúdo HTML
   */
  private extractImageFromContent(html: string): string | undefined {
    // Tentar encontrar og:image primeiro (melhor qualidade)
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch) return ogImageMatch[1];

    // Tentar twitter:image
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    if (twitterImageMatch) return twitterImageMatch[1];

    // Fallback: primeira tag img
    const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
    return imgMatch ? imgMatch[1] : undefined;
  }

  /**
   * Busca imagem diretamente da página do artigo (fallback)
   */
  private async fetchImageFromArticle(articleUrl: string): Promise<string | undefined> {
    try {
      // Tentar buscar a página do artigo
      const response = await fetch(articleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HallyuHub/1.0)',
        },
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      if (!response.ok) return undefined;

      const html = await response.text();

      // Tentar extrair imagem do HTML da página
      return this.extractImageFromContent(html);
    } catch (error) {
      console.warn(`Failed to fetch image from article: ${error}`);
      return undefined;
    }
  }

  /**
   * Extrai categorias/tags
   */
  private extractCategories(field: any): string[] | undefined {
    if (!field) return undefined;

    const categories: string[] = [];

    if (Array.isArray(field)) {
      for (const cat of field) {
        const text = this.extractText(cat);
        if (text) categories.push(text);
      }
    } else {
      const text = this.extractText(field);
      if (text) categories.push(text);
    }

    return categories.length > 0 ? categories : undefined;
  }

  /**
   * Parse date string para Date object
   */
  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();

    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      console.warn(`Failed to parse date: ${dateStr}`);
    }

    return new Date();
  }

  /**
   * Remove HTML tags e limpa texto
   */
  private cleanHtml(html: string): string {
    if (!html) return '';

    return (
      html
        // Remove tags HTML
        .replace(/<[^>]*>/g, '')
        // Decodifica entidades HTML
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Remove espaços extras
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  /**
   * Busca notícias de um feed específico por nome
   */
  async fetchFromSource(sourceName: string, maxItems: number = 5): Promise<RSSNewsItem[]> {
    const feed = RSS_FEEDS.find(f => f.name.toLowerCase() === sourceName.toLowerCase());

    if (!feed) {
      throw new Error(`Unknown RSS feed: ${sourceName}`);
    }

    return this.fetchFeed(feed, maxItems);
  }

  /**
   * Lista feeds disponíveis
   */
  getAvailableFeeds(): Array<{ name: string; language: string }> {
    return RSS_FEEDS.map(f => ({ name: f.name, language: f.language }));
  }
}

// Singleton
let instance: RSSNewsService | null = null;

export function getRSSNewsService(): RSSNewsService {
  if (!instance) {
    instance = new RSSNewsService();
  }
  return instance;
}
