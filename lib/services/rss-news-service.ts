/**
 * RSS News Service
 *
 * Busca notícias reais de feeds RSS de sites K-pop / K-drama.
 * Estratégia: dados 100% reais ao invés de gerados por AI.
 *
 * Fontes RSS ativas:
 * - Soompi:      https://www.soompi.com/feed
 * - Koreaboo:    https://www.koreaboo.com/feed/
 * - Dramabeans:  https://dramabeans.com/feed/  (K-drama recaps)
 * - Asian Junkie: https://www.asianjunkie.com/feed/
 * - HelloKpop:   https://www.hellokpop.com/feed/
 * - Kpopmap:     https://kpopmap.com/feed/
 *
 * Fontes descontinuadas:
 * - AllKpop:   https://www.allkpop.com/rss (retorna 404)
 * - KpopStarz: https://www.kpopstarz.com/rss (retorna 403 — feed bloqueado)
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
  author?: string;
  contentType?: string;
  readingTimeMin?: number;
}

// ─── Classificação de tipos de conteúdo ──────────────────────────────────────

const CONTENT_TYPE_RULES: { type: string; pattern: RegExp }[] = [
  // Debut antes de comeback (debut pode conter "album" também)
  { type: 'debut',         pattern: /\b(debut|debuts|debuting|pre-debut|predebut|new (idol |kpop )?group)\b/i },
  { type: 'comeback',      pattern: /\b(comeback|returns? with|new (mini |full |studio )?album|repackage|ep release|title track release)\b/i },
  { type: 'mv',            pattern: /\b(music video|lyric video|performance video|official\s+mv|m\/v|teaser video|mv teaser|dance video)\b/i },
  { type: 'concert',       pattern: /\b(concert|world tour|dome tour|arena tour|fanmeeting|fan meet|showcase|live concert|stadium)\b/i },
  { type: 'award',         pattern: /\b(wins|winner|awarded|bonsang|daesang|mama awards?|golden disc|gaon chart|melon music|mnet|inkigayo|music bank|the show champion)\b/i },
  { type: 'collaboration', pattern: /\b(feat\.|featuring|collab(oration)?|ost|original soundtrack|duet|joint|co-write)\b/i },
  { type: 'drama',         pattern: /\b(drama|k-drama|kdrama|webtoon|series|season\s+\d|episode|cast|filming|viewer ratings|broadcast|air(s|ing)?)\b/i },
  { type: 'interview',     pattern: /\b(interview|opens up|talks (about|with)|reveals|shares|speaks (out|with)|discusses|tells|admits)\b/i },
  { type: 'scandal',       pattern: /\b(scandal|controversy|dating|relationship confirmed|breakup|military|enlist(ment)?|hiatus|leave|lawsuit|apology|apologizes)\b/i },
];

function classifyContentType(title: string, content: string): string {
  const text = `${title} ${content.substring(0, 500)}`;
  for (const { type, pattern } of CONTENT_TYPE_RULES) {
    if (pattern.test(text)) return type;
  }
  return 'general';
}

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ─── Feeds ───────────────────────────────────────────────────────────────────

const RSS_FEEDS: RSSFeed[] = [
  { name: 'Soompi',       url: 'https://www.soompi.com/feed',           language: 'en' },
  { name: 'Koreaboo',     url: 'https://www.koreaboo.com/feed/',        language: 'en' },
  { name: 'Dramabeans',   url: 'https://dramabeans.com/feed/',          language: 'en' }, // sem www — o www redireciona
  { name: 'Asian Junkie', url: 'https://www.asianjunkie.com/feed/',     language: 'en' },
  { name: 'HelloKpop',    url: 'https://www.hellokpop.com/feed/',       language: 'en' },
  { name: 'Kpopmap',      url: 'https://kpopmap.com/feed/',             language: 'en' },
  // AllKpop removido temporariamente (retorna 404)
  // KpopStarz removido: retorna 403 em todas as URLs de RSS
];

// ─── Service ─────────────────────────────────────────────────────────────────

export class RSSNewsService {

  /** Busca notícias recentes de todos os feeds */
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

    allNews.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    console.log(`✅ Total: ${allNews.length} news items fetched`);
    return allNews;
  }

  /** Busca items de um feed específico por nome */
  async fetchFromSource(sourceName: string, maxItems: number = 5): Promise<RSSNewsItem[]> {
    const feed = RSS_FEEDS.find(f => f.name.toLowerCase() === sourceName.toLowerCase());
    if (!feed) {
      throw new Error(`Unknown RSS feed: ${sourceName}. Available: ${RSS_FEEDS.map(f => f.name).join(', ')}`);
    }
    return this.fetchFeed(feed, maxItems);
  }

  /** Lista feeds disponíveis */
  getAvailableFeeds(): Array<{ name: string; language: string }> {
    return RSS_FEEDS.map(f => ({ name: f.name, language: f.language }));
  }

  // ── Private: fetch & parse ─────────────────────────────────────────────────

  private async fetchFeed(feed: RSSFeed, maxItems: number): Promise<RSSNewsItem[]> {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HallyuHub/1.0; +https://hallyuhub.com.br)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const parsed = await parseStringPromise(xmlText);

    if (parsed.rss?.channel?.[0]?.item) {
      return this.parseRSS2Items(parsed.rss.channel[0].item, feed, maxItems);
    }
    if (parsed.feed?.entry) {
      return this.parseAtomEntries(parsed.feed.entry, feed, maxItems);
    }

    throw new Error('Unknown RSS format');
  }

  private async parseRSS2Items(items: any[], feed: RSSFeed, maxItems: number): Promise<RSSNewsItem[]> {
    const newsItems: RSSNewsItem[] = [];

    for (const item of items.slice(0, maxItems)) {
      try {
        const title = this.extractText(item.title);
        if (!title) continue;

        const link = this.extractText(item.link);
        if (!link) continue;

        const description = this.extractText(item.description) || '';
        const rawContent =
          this.extractText(item['content:encoded']) ||
          this.extractText(item.content) ||
          '';

        const pubDate = this.parseDate(
          this.extractText(item.pubDate) || this.extractText(item.published)
        );

        // Autor: dc:creator (WordPress padrão) ou author
        const author =
          this.extractText(item['dc:creator']) ||
          this.extractText(item.author) ||
          undefined;

        // Imagem: múltiplos campos em ordem de preferência
        let imageUrl =
          this.extractImageUrl(item.enclosure) ||
          this.extractImageUrl(item['media:content']) ||
          this.extractImageUrl(item['media:thumbnail']) ||
          this.extractImageFromHtml(rawContent || description);

        // Conteúdo: preservar estrutura HTML como Markdown
        const markdownContent = rawContent ? this.htmlToMarkdown(rawContent) : '';
        const cleanDescription = this.cleanHtml(description);

        // Se conteúdo RSS for curto (<300 chars), scrape o artigo completo
        let fullContent = markdownContent || cleanDescription;
        if (fullContent.length < 300 && link) {
          const articleData = await this.fetchArticleData(link);
          if (!imageUrl && articleData.imageUrl) imageUrl = articleData.imageUrl;
          if (articleData.content && articleData.content.length > fullContent.length) {
            fullContent = articleData.content;
          }
        } else if (!imageUrl && link) {
          imageUrl = await this.fetchImageFromArticle(link);
        }

        const categories = this.extractCategories(item.category);

        const contentType = classifyContentType(this.cleanHtml(title), fullContent);
        const readingTimeMin = fullContent ? estimateReadingTime(fullContent) : undefined;

        newsItems.push({
          title: this.cleanHtml(title),
          link,
          description: cleanDescription,
          content: fullContent || undefined,
          publishedAt: pubDate,
          imageUrl,
          source: feed.name,
          categories,
          author,
          contentType,
          readingTimeMin,
        });
      } catch (error) {
        console.warn(`Failed to parse RSS item from ${feed.name}:`, error);
        continue;
      }
    }

    return newsItems;
  }

  private parseAtomEntries(entries: any[], feed: RSSFeed, maxItems: number): RSSNewsItem[] {
    const newsItems: RSSNewsItem[] = [];

    for (const entry of entries.slice(0, maxItems)) {
      try {
        const title = this.extractText(entry.title);
        if (!title) continue;

        let link = '';
        if (Array.isArray(entry.link)) {
          const alternate = entry.link.find((l: any) => l.$.rel === 'alternate');
          link = alternate?.$.href || entry.link[0]?.$.href || '';
        } else if (entry.link?.$?.href) {
          link = entry.link.$.href;
        }
        if (!link) continue;

        const description = this.extractText(entry.summary) || '';
        const rawContent = this.extractText(entry.content) || '';
        const pubDate = this.parseDate(
          this.extractText(entry.published) || this.extractText(entry.updated)
        );

        const author =
          this.extractText(entry.author?.[0]?.name) ||
          this.extractText(entry['dc:creator']) ||
          undefined;

        const content = rawContent ? this.htmlToMarkdown(rawContent) : this.cleanHtml(description);
        const contentType = classifyContentType(this.cleanHtml(title), content);
        const readingTimeMin = content ? estimateReadingTime(content) : undefined;

        newsItems.push({
          title: this.cleanHtml(title),
          link,
          description: this.cleanHtml(description),
          content: content || undefined,
          publishedAt: pubDate,
          source: feed.name,
          author,
          contentType,
          readingTimeMin,
        });
      } catch (error) {
        console.warn(`Failed to parse Atom entry from ${feed.name}:`, error);
        continue;
      }
    }

    return newsItems;
  }

  // ── Private: article scraping ─────────────────────────────────────────────

  /**
   * Busca imagem e texto completo do artigo em uma única requisição.
   * Retorna Markdown formatado preservando estrutura (negrito, listas, links).
   */
  async fetchArticleData(articleUrl: string): Promise<{ imageUrl?: string; content?: string }> {
    try {
      const response = await fetch(articleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HallyuHub/1.0; +https://hallyuhub.com.br)',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) return {};

      const html = await response.text();
      return {
        imageUrl: this.extractImageFromHtml(html),
        content: this.extractArticleText(html),
      };
    } catch (error) {
      console.warn(`Failed to fetch article data from ${articleUrl}: ${error}`);
      return {};
    }
  }

  /**
   * Extrai o texto principal do artigo como Markdown.
   * Pré-processa HTML removendo scripts, styles e comentários.
   * Corrige bug anterior: usa posição do div de abertura em vez de regex com </div>.
   */
  private extractArticleText(html: string): string {
    // Pré-processar: remover noise (scripts, styles, comentários)
    const stripped = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    // 1. Tag <article>
    const articleMatch = stripped.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      const text = this.htmlToMarkdown(articleMatch[1]).trim();
      if (text.length > 200) return text;
    }

    // 2. Divs com classes de conteúdo conhecidas
    // Fix: captura posição do div de abertura e extrai chunk após ele (evita </div> aninhado)
    const contentClasses = [
      'entry-content', 'post-content', 'article-content', 'article-body',
      'story-content', 'td-post-content', 'post__content', 'single-content',
      'entry__body', 'article__body', 'article-text', 'article_body',
      'news-content', 'news_content', 'post-entry', 'content-area',
    ];

    for (const cls of contentClasses) {
      const regex = new RegExp(`<div[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, 'i');
      const match = regex.exec(stripped);
      if (match) {
        const startIdx = match.index + match[0].length;
        const chunk = stripped.substring(startIdx, startIdx + 10000);
        const text = this.htmlToMarkdown(chunk).trim();
        if (text.length > 200) return text;
      }
    }

    return '';
  }

  private async fetchImageFromArticle(articleUrl: string): Promise<string | undefined> {
    const data = await this.fetchArticleData(articleUrl);
    return data.imageUrl;
  }

  // ── Private: HTML helpers ─────────────────────────────────────────────────

  /**
   * Converte HTML para Markdown, preservando estrutura:
   * headings, negrito, itálico, links, listas, parágrafos, blockquotes,
   * imagens inline, figures com caption e embeds do YouTube.
   * Usado para conteúdo completo de artigos.
   */
  private htmlToMarkdown(html: string): string {
    if (!html) return '';

    return html
      // Remover noise
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      // Figure com figcaption → imagem com caption (processar ANTES de <img>)
      .replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, (_, inner) => {
        const srcMatch = inner.match(/src=["']([^"']+)["']/i)
        const captionMatch = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)
        if (!srcMatch) return ''
        const src = srcMatch[1]
        if (src.startsWith('data:') || src.length < 10) return ''
        const alt = captionMatch ? captionMatch[1].replace(/<[^>]+>/g, '').trim() : ''
        return `\n\n![${alt}](${src})\n\n`
      })
      // Imagens inline → Markdown (filtrar ícones/avatares/data URIs)
      .replace(/<img\s[^>]*>/gi, (imgTag) => {
        const srcMatch = imgTag.match(/src=["']([^"']+)["']/i)
        const altMatch = imgTag.match(/alt=["']([^"']*)["']/i)
        if (!srcMatch) return ''
        const src = srcMatch[1]
        if (src.startsWith('data:') || /\b(icon|logo|avatar|emoji|pixel|1x1|spacer)\b/i.test(src)) return ''
        const alt = altMatch ? altMatch[1] : ''
        return `\n\n![${alt}](${src})\n\n`
      })
      // YouTube iframes → thumbnail clicável
      .replace(/<iframe[^>]+src=["']([^"']*youtube\.com\/embed[^"']*)["'][^>]*>[\s\S]*?<\/iframe>/gi, (_, src) => {
        const videoId = src.match(/embed\/([a-zA-Z0-9_-]{11})/)?.[1]
        if (videoId) return `\n\n[![](https://img.youtube.com/vi/${videoId}/hqdefault.jpg)](https://www.youtube.com/watch?v=${videoId})\n\n`
        return ''
      })
      // Remover outros iframes
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      // Headings → ## / ###
      .replace(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi, '\n\n## $1\n\n')
      .replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, '\n\n### $1\n\n')
      // Negrito e itálico
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
      // Links → [text](url)
      .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
      // Blockquote → > quote
      .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n\n> $1\n\n')
      // Listas
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
      .replace(/<\/?[uo]l[^>]*>/gi, '\n')
      // Parágrafos e quebras
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      // Remover tags restantes
      .replace(/<[^>]+>/g, '')
      // Decodificar entidades HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#8217;|&#x2019;|&rsquo;/g, "'")
      .replace(/&#8216;|&lsquo;/g, "'")
      .replace(/&#8220;|&ldquo;/g, '"')
      .replace(/&#8221;|&rdquo;/g, '"')
      .replace(/&#8230;|&hellip;/g, '...')
      // Limpar markdown vazio: ****, **, []() sem link útil
      .replace(/\*{2,4}\s*\*{2,4}/g, '')
      .replace(/\[([^\]]*)\]\(\s*\)/g, '$1')
      // Normalizar múltiplas linhas em branco
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Remove HTML e retorna texto puro.
   * Usado para títulos, descrições curtas e comparações.
   */
  private cleanHtml(html: string): string {
    if (!html) return '';

    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#8217;|&#x2019;|&rsquo;/g, "'")
      .replace(/&#8216;|&lsquo;/g, "'")
      .replace(/&#8220;|&ldquo;/g, '"')
      .replace(/&#8221;|&rdquo;/g, '"')
      .replace(/&#8230;|&hellip;/g, '...')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ── Private: field extractors ─────────────────────────────────────────────

  private extractText(field: any): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (Array.isArray(field)) return this.extractText(field[0]);
    if (field._) return field._;
    if (typeof field === 'object') return field.toString();
    return '';
  }

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
   * Extrai URL de imagem de HTML (og:image, twitter:image, primeira <img>).
   */
  private extractImageFromHtml(html: string): string | undefined {
    if (!html) return undefined;

    // og:image (melhor qualidade)
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImage) return ogImage[1];

    // twitter:image
    const twitterImage = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    if (twitterImage) return twitterImage[1];

    // Primeira <img> relevante (excluindo ícones/logos/data URIs)
    const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = imgPattern.exec(html)) !== null) {
      const src = imgMatch[1];
      if (src.includes('data:') || src.includes('icon') || src.includes('logo') || src.includes('avatar')) continue;
      if (src.length > 10) return src;
    }

    return undefined;
  }

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

  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;
    } catch {
      // fall through
    }
    return new Date();
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let instance: RSSNewsService | null = null;

export function getRSSNewsService(): RSSNewsService {
  if (!instance) {
    instance = new RSSNewsService();
  }
  return instance;
}
