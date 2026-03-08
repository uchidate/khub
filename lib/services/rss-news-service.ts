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

function classifyContentType(title: string, content: string, sourceName?: string): string {
  // Dramabeans é 100% drama/kdrama — skip classification
  if (sourceName === 'Dramabeans') return 'drama';

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

        // Dramabeans: Drama Hangout / Open Thread são posts de discussão sem corpo de artigo.
        // A página contém apenas tabs de navegação (recaps, reviews, cast, etc.) — scraping
        // retorna lixo. Usar descrição do RSS diretamente nesses casos.
        const isDramabeansDiscussion =
          feed.name === 'Dramabeans' &&
          /drama-hangout|open-thread/i.test(link);

        // Scrape artigo completo se:
        // - conteúdo curto (<1500 chars), OU
        // - termina com "..." / "…" (truncado pelo feed), OU
        // - contém marcadores de "leia mais"
        let fullContent = markdownContent || cleanDescription;
        const isTruncated =
          fullContent.length < 1500 ||
          /(\.\.\.|…)\s*$/.test(fullContent) ||
          /\[(\.\.\.|…|read more|continue reading|more)\]/i.test(fullContent);

        if (isDramabeansDiscussion) {
          // Usar apenas a descrição do RSS — não scraping
          fullContent = cleanDescription;
          if (!imageUrl && link) {
            imageUrl = await this.fetchImageFromArticle(link, feed.name);
          }
        } else if (isTruncated && link) {
          const articleData = await this.fetchArticleData(link, feed.name);
          if (!imageUrl && articleData.imageUrl) imageUrl = articleData.imageUrl;
          if (articleData.content && articleData.content.length > fullContent.length) {
            fullContent = articleData.content;
          }
        } else if (!imageUrl && link) {
          imageUrl = await this.fetchImageFromArticle(link, feed.name);
        }

        const categories = this.extractCategories(item.category);

        const contentType = classifyContentType(this.cleanHtml(title), fullContent, feed.name);
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
   * Usa lógica específica por fonte quando `sourceName` é fornecido.
   */
  async fetchArticleData(articleUrl: string, sourceName?: string): Promise<{ imageUrl?: string; content?: string }> {
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
        imageUrl: this.extractImageBySource(html, sourceName),
        content: this.extractArticleText(html, sourceName),
      };
    } catch (error) {
      console.warn(`Failed to fetch article data from ${articleUrl}: ${error}`);
      return {};
    }
  }

  /**
   * Extrai o texto principal do artigo como Markdown.
   * Tenta seletores específicos da fonte antes dos genéricos.
   */
  private extractArticleText(html: string, sourceName?: string): string {
    // Pré-processar: remover noise (scripts, styles, comentários)
    const stripped = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    // Seletores específicos por fonte
    // Fontes marcadas com [] como primeiro item usam class-first (antes de <article>)
    const SOURCE_CONTENT_SELECTORS: Record<string, string[]> = {
      // article-wrapper = corpo limpo do Soompi sem header (título, data, autor, tags)
      Soompi:        ['article-wrapper', 'sp-detail__content', 'article-container', 'entry-content'],
      Koreaboo:      ['entry-content', 'post-content', 'article__body'],
      Dramabeans:    ['entry-content', 'post-content', 'entry__content'],
      // Asian Junkie usa 'entry' (não entry-content); share-post div é removido antes da conversão
      'Asian Junkie':['entry', 'entry-content', 'post-content', 'article-content'],
      HelloKpop:     ['td-post-content', 'entry-content', 'tdb-block-inner'],
      Kpopmap:       ['entry-content', 'post-content', 'article-content', 'td-post-content'],
    };

    // Fontes que devem usar class-first (o <article> dessas fontes inclui header/metadata)
    const CLASS_FIRST_SOURCES = new Set(['Soompi', 'Koreaboo', 'Asian Junkie']);

    const priorityClasses = sourceName ? (SOURCE_CONTENT_SELECTORS[sourceName] ?? []) : [];
    // Genéricos de fallback (sem repetir os já tentados)
    const genericClasses = [
      'entry-content', 'post-content', 'article-content', 'article-body',
      'story-content', 'td-post-content', 'post__content', 'single-content',
      'entry__body', 'article__body', 'article-text', 'article_body',
      'news-content', 'news_content', 'post-entry', 'content-area',
    ].filter(c => !priorityClasses.includes(c));

    const allClasses = [...priorityClasses, ...genericClasses];

    // Pré-processadores HTML específicos por fonte (rodam sobre o chunk extraído)
    const SOURCE_HTML_PREPROCESSORS: Record<string, (html: string) => string> = {
      // Asian Junkie: remover barra de share (Facebook, Twitter, etc.) do topo do 'entry' div
      'Asian Junkie': (html) => html.replace(/<div[^>]*class="[^"]*\bshare-post\b[^"]*"[^>]*>[\s\S]*?<\/div>\s*/gi, ''),
    }

    // 1. Para fontes class-first, tentar seletores específicos ANTES de <article>
    if (sourceName && CLASS_FIRST_SOURCES.has(sourceName)) {
      const preprocess = sourceName ? (SOURCE_HTML_PREPROCESSORS[sourceName] ?? null) : null;
      for (const cls of priorityClasses) {
        const regex = new RegExp(`<div[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, 'i');
        const match = regex.exec(stripped);
        if (match) {
          const startIdx = match.index + match[0].length;
          const rawChunk = stripped.substring(startIdx, startIdx + 10000);
          const chunk = preprocess ? preprocess(rawChunk) : rawChunk;
          const text = this.htmlToMarkdown(chunk).trim();
          if (text.length > 200) return text;
        }
      }
    }

    // 2. Tag <article>
    const articleMatch = stripped.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      const text = this.htmlToMarkdown(articleMatch[1]).trim();
      if (text.length > 200) return text;
    }

    // 3. Divs com classes de conteúdo (genéricos como fallback)
    const fallbackClasses = sourceName && CLASS_FIRST_SOURCES.has(sourceName)
      ? genericClasses  // priority já tentados acima
      : allClasses;
    for (const cls of fallbackClasses) {
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

  /**
   * Extrai imagem de capa com prioridades por fonte.
   * Algumas fontes têm og:image de qualidade baixa; outras usem twitter:image.
   */
  private extractImageBySource(html: string, sourceName?: string): string | undefined {
    if (!html) return undefined;

    // Soompi e HelloKpop: og:image é confiável e de alta qualidade
    // Koreaboo: twitter:image costuma ser melhor
    // Dramabeans: og:image às vezes é thumbnail pequeno — tentar primeiro img no article
    // Kpopmap: og:image funciona bem

    const ogImage =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

    const twitterImage =
      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);

    if (sourceName === 'Koreaboo') {
      // Koreaboo: twitter:image first, then og:image
      if (twitterImage) return twitterImage[1];
      if (ogImage) return ogImage[1];
    } else if (sourceName === 'Dramabeans') {
      // Dramabeans: first relevant <img> inside article body (higher quality than og:image)
      const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      if (articleMatch) {
        const imgMatch = articleMatch[1].match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        if (imgMatch && !imgMatch[1].startsWith('data:') && imgMatch[1].length > 10) {
          return imgMatch[1];
        }
      }
      if (ogImage) return ogImage[1];
    } else {
      // Default: og:image primeiro
      if (ogImage) return ogImage[1];
      if (twitterImage) return twitterImage[1];
    }

    // Fallback: primeira <img> relevante
    const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = imgPattern.exec(html)) !== null) {
      const src = imgMatch[1];
      if (src.includes('data:') || /\b(icon|logo|avatar|emoji|pixel|1x1|spacer)\b/i.test(src)) continue;
      if (src.length > 10) return src;
    }

    return undefined;
  }

  private async fetchImageFromArticle(articleUrl: string, sourceName?: string): Promise<string | undefined> {
    const data = await this.fetchArticleData(articleUrl, sourceName);
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
      // Iframes: YouTube → thumbnail clicável, resto → removido
      // Passagem única para evitar iframes parcialmente removidos
      .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, (match) => {
        const srcMatch = match.match(/src=["']([^"']+)["']/i)
        if (srcMatch) {
          const videoId = srcMatch[1].match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)?.[1]
          if (videoId) return `\n\n[![](https://img.youtube.com/vi/${videoId}/hqdefault.jpg)](https://www.youtube.com/watch?v=${videoId})\n\n`
        }
        return ''
      })
      // Catch-all: iframes sem closing tag (malformados)
      .replace(/<iframe\b[^>]*>/gi, '')
      // Videos (mp4 GIFs, etc.) → remover (não renderizáveis em markdown)
      .replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, '')
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
      .replace(/&#0*38;/g, '&')   // &#038; = & (numeric entity)
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
      .replace(/&#8212;|&mdash;/g, '—')
      .replace(/&#8211;|&ndash;/g, '–')
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
