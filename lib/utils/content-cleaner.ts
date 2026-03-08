/**
 * Content Cleaner — limpeza de markdown por fonte de notícias
 *
 * Cada fonte RSS tem padrões de ruído distintos no conteúdo.
 * Esta utilidade remove boilerplate específico de cada site.
 */

type SourceRule = {
  description: string
  pattern: RegExp
  replacement?: string  // padrão: '\n' (remoção); definir para substituição diferente
}

// Regras comuns a todas as fontes
const COMMON_RULES: SourceRule[] = [
  // Crédito de foto genérico
  { description: 'generic photo credit', pattern: /\n+\*?Photos?(?:\s+(?:credit|credits|by|via|from|courtesy))?:?\s*[^\n]{1,100}\*?\n*/gi },
  // "Source:" no rodapé
  { description: 'source line', pattern: /\n+\*?Source:?\s*[^\n]{1,150}\*?\n*/gi },
  // "Credit:" no rodapé
  { description: 'credit line', pattern: /\n+\*?Credits?:?\s*[^\n]{1,150}\*?\n*/gi },
  // Tags markdown duplicadas de imagem de capa (quando URL exata já foi removida mas alt-text vazio sobrou)
  { description: 'empty image tag', pattern: /!\[\]\(\s*\)/g },
  // Linha de "Image via / Image credit"
  { description: 'image via', pattern: /\n+\*?Image(?:\s+(?:via|credit|courtesy)):?\s*[^\n]{1,100}\*?\n*/gi },
  // "Related Articles" / "Related Posts" link lists
  { description: 'related articles header', pattern: /\n+\*{0,2}Related (?:Articles?|Posts?|News|Stories|Content):?\*{0,2}\n(?:[-*]\s*\[[^\]]+\]\([^)]+\)\n)*/gi },
  // YouTube embed convertido erroneamente como imagem (ex: ![](https://www.youtube.com/embed/...))
  { description: 'youtube embed as image', pattern: /!\[[^\]]*\]\(https?:\/\/(?:www\.)?youtube\.com\/embed\/[^)]+\)/g },
  // Entidade HTML &#038; (= &) que ficou literal em URLs de markdown
  { description: 'html numeric amp entity', pattern: /&#0*38;/g, replacement: '&' },
  // Em dash / en dash como entidades numéricas literais
  { description: 'em dash entity', pattern: /&#8212;|&mdash;/g, replacement: '—' },
  { description: 'en dash entity', pattern: /&#8211;|&ndash;/g, replacement: '–' },
  // Texto fallback de <video> tag não suportada
  { description: 'video fallback text', pattern: /^\s*Your browser does not support video\.\s*$/gim },
  // Links de navegação interna (Next Page / Previous Page)
  { description: 'nav page links', pattern: /\n*\[(?:Next|Previous|Prev) Page\][^\n]*\n*/gi },
  // Texto solto de navegação (quando href era vazio e virou texto)
  { description: 'nav page text', pattern: /^\s*(?:Next|Previous|Prev) Page\s*$/gim },
]

// Regras por fonte
const SOURCE_RULES: Record<string, SourceRule[]> = {
  Soompi: [
    // "SHARE THIS ARTICLE" / "SHARE" call-to-action
    { description: 'share CTA', pattern: /\n+SHARE\s+THIS\s+ARTICLE[^\n]*/gi },
    // Crédito "(Photo: Soompi)" e variações
    { description: 'photo soompi', pattern: /\(?(?:Photo|Photos|Image)s?:?\s*Soompi[^)]*\)?/gi },
    // Disclaimer "All rights reserved by Soompi..."
    { description: 'rights disclaimer', pattern: /\n+All rights reserved by Soompi[^\n]*/gi },
    // Subscriptions / newsletter CTA
    { description: 'newsletter CTA', pattern: /\n+(?:Subscribe|Follow us)[^\n]{0,80}newsletter[^\n]*/gi },
    // "Tagged:" ou "Tags:" no rodapé
    { description: 'tags footer', pattern: /\n+(?:Tagged|Tags):?\s*[^\n]+/gi },
    // Título H2 repetido no topo (o <h1> do artigo aparece como ## no conteúdo)
    // Detectado quando antecede link de categoria Soompi ou data de publicação
    { description: 'article title h2', pattern: /^##\s+[^\n]+\n+(?=\s*(?:\[[^\]]+\]\(https?:\/\/www\.soompi\.com\/category|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b))/m },
    // Link de categoria (ex: [Music](https://www.soompi.com/category/music))
    { description: 'category link', pattern: /\[[^\]]+\]\(https?:\/\/www\.soompi\.com\/category\/[^)]+\)/g },
    // Data de publicação isolada em linha (ex: "Mar 07, 2026")
    { description: 'publication date', pattern: /^(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\s*$/gm },
    // Byline do autor (ex: "by [E Cha](https://www.soompi.com/author/...)")
    { description: 'author byline', pattern: /^by\s+\[[^\]]+\]\(https?:\/\/www\.soompi\.com\/author[^)]+\)\s*$/gim },
    // Tag links no rodapé (ex: [Stray Kids](https://www.soompi.com/tag/stray-kids))
    { description: 'tag links', pattern: /\n*\[[^\]]+\]\(https?:\/\/www\.soompi\.com\/tag\/[^)]+\)\n*/g },
    // Banners promocionais Soompi (imagens CDN com "Banner" ou "banner" no nome)
    { description: 'promo banners', pattern: /!\[[^\]]*\]\(https?:\/\/\d+\.soompi\.io\/[^)]*[Bb]anner[^)]*\)/g },
    // Bloco de afiliado Viki quebrado: [ ... imagem ... Texto](viki.com/...)
    { description: 'viki affiliate block', pattern: /^\[\s*\n[\s\S]{0,800}?\]\(https?:\/\/www\.viki\.com[^)]+\)/gm },
  ],

  Koreaboo: [
    // "SEE ALSO: ..." / "READ MORE: ..."
    { description: 'see also', pattern: /\n+(?:\*{0,2})?(?:SEE ALSO|READ MORE|ALSO READ|DON'T MISS):?\*{0,2}\s*[^\n]+/gi },
    // "You might also like:" sections
    { description: 'you might like', pattern: /\n+(?:\*{0,2})?You might also like:?\*{0,2}\n(?:[-*]\s*.+\n)*/gi },
    // "Top Photo:" crédito
    { description: 'top photo', pattern: /\n+Top Photo:?\s*[^\n]+/gi },
    // Byline "By [Author]" no topo
    { description: 'byline', pattern: /^By\s+[A-Z][^\n]{1,60}\n+/m },
    // "What do you think?" engagement line
    { description: 'engagement', pattern: /\n+What do you think\?[^\n]*/gi },
    // Título H2 repetido no topo (H1 do artigo aparece como ## no conteúdo raspado)
    // Detectado quando antecede imagem de capa ou link de categoria Koreaboo
    { description: 'article title h2', pattern: /^##\s+[^\n]{20,300}\n+(?=[^\n]*\n+!\[|\[[^\]]+\]\(https?:\/\/www\.koreaboo\.com\/)/m },
    // Links de categoria Koreaboo (ex: [Stories](https://www.koreaboo.com/stories/))
    { description: 'category link', pattern: /\[[^\]]+\]\(https?:\/\/www\.koreaboo\.com\/(?:stories|news|trending|lists|videos|polls|rankings)\/\)/g },
    // Logo/ícone do site Koreaboo
    { description: 'site logo', pattern: /!\[[^\]]*\]\(https?:\/\/www\.koreaboo\.com\/wp-content\/themes\/[^)]+\)/g },
    // "Koreaboo" como texto isolado (nome do site como autor)
    { description: 'site name standalone', pattern: /^\s*Koreaboo\s*$/gm },
    // Timestamp relativo (ex: "2 hours ago", "3 days ago")
    { description: 'relative timestamp', pattern: /^\s*\d+\s+(?:seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago\s*$/gim },
    // "Source: [TheQoo](...)" / "**Source: **[...](...)" — link de fonte inline
    { description: 'source link', pattern: /\n*\*{0,2}Source:\s*\*{0,2}\s*\[[^\]]*\]\([^)]+\)\s*/gi },
    // Links de artigos relacionados internos Koreaboo que vazam após truncamento
    { description: 'internal article links', pattern: /\n*-\s*\[[^\]]+\]\(https?:\/\/www\.koreaboo\.com\/(?:news|stories|trending|lists)\/[^)]+\)\s*/g },
    // Imagens CDN do Koreaboo de tamanho small (ex: w96 ou w128) — thumbnails de artigos relacionados
    { description: 'small cdn thumbnails', pattern: /!\[[^\]]*\]\(https?:\/\/image\.koreaboo\.com\/[^)]*(?:w96|w128|w64|w32|thumbnail|thumb)[^)]*\)/gi },
    // "See more [Artist](https://www.koreaboo.com/artist/...)" — link de seção de artista
    { description: 'see more artist', pattern: /\n*\[See more [^\]]+\]\(https?:\/\/www\.koreaboo\.com\/artist\/[^)]+\)\s*/gi },
    // Lista de artistas do footer que vaza: "- [2NE1](https://www.koreaboo.com/artist/...)"
    { description: 'footer artist links', pattern: /\n*-\s*\[[^\]]+\]\(https?:\/\/www\.koreaboo\.com\/artist\/[^)]+\)\s*/g },
    // Seções do footer: "Artists", "Sections", "Follow Us" como linhas isoladas
    { description: 'footer section headers', pattern: /^\s*(?:Artists|Sections|Follow Us)\s*$/gm },
    // Fragmentos de SVG que vazaram (path fill=...)
    { description: 'svg fragments', pattern: /<path[^>]*>[\s\S]*?<\/path>/gi },
    { description: 'svg attributes', pattern: /\bfill="[^"]*"[^>\n]*/g },
  ],

  Dramabeans: [
    // "Share your thoughts" call-to-action no final
    { description: 'share thoughts', pattern: /\n+Share your thoughts[^\n]*/gi },
    // "Filed under:" com categorias
    { description: 'filed under', pattern: /\n+Filed under:?\s*[^\n]+/gi },
    // "Tags:" no rodapé
    { description: 'tags footer', pattern: /\n+Tags:?\s*[^\n]+/gi },
    // "Ratings: ..." linha isolada
    { description: 'ratings note', pattern: /\n+(?:\*{0,2})Ratings?:?\*{0,2}\s*[^\n]+(?:\n+[^\n]+)?\n+/gi },
    // "RELATED POSTS" sections — tudo a partir daí até o fim
    { description: 'related posts', pattern: /\n*^(?:\*{0,2})?RELATED POSTS:?\*{0,2}[\s\S]*$/gim },
    // Navegação entre episódios "[← Previous Episode] [Next Episode →]"
    { description: 'episode nav', pattern: /\n+\[?←?\s*(?:Previous|Prev)\.?\s*Episode\]?[^\n]*\n*/gi },
    { description: 'episode nav next', pattern: /\[?Next\s*Episode\s*→?\]?/gi },
    // Links de navegação interna do site (tabs: recaps, reviews, news, cast, episodes, videos)
    // Aparecem em Drama Hangout/Open Thread como lista de links de seção
    { description: 'site nav tabs', pattern: /^-\s*\[(?:recaps?|reviews?|news|videos?|cast|episodes?)\][^\n]*\n/gim },
    // Linhas que são só links de âncora interna (#anchor) — navegação da página
    { description: 'anchor nav links', pattern: /^-\s*\[[^\]]{1,30}\]\(#[^)]+\)\s*\n/gim },
    // Contagem de comentários "[1](#comments)" ou "[42](#comments)" — do .comment div
    { description: 'comment count link', pattern: /^\s*\[\d+\]\(#comments\)\s*\n*/gm },
    // Linha de data isolada (publicação / atualização)
    { description: 'standalone date', pattern: /^(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}(?:\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4})?\s*$/gm },
    // Byline "### by [Author](/members/...)" — duplica o autor já exibido na página
    { description: 'author byline', pattern: /^#{1,4}\s+by\s+\[[^\]]+\]\([^)]+\)\s*\n*/gm },
    // Seletor de episódios que vaza: "Episodes 1-2 (First Impressions)"
    { description: 'episode selector option', pattern: /^\s*Episodes? \d+[^\n]{0,60}\n*/gm },
  ],

  'Asian Junkie': [
    // "About The Author" / "About Author" seção no final
    { description: 'about author', pattern: /\n+(?:\*{0,2})?About (?:The )?Author:?\*{0,2}[\s\S]*$/gi },
    // "Related:" seções
    { description: 'related section', pattern: /\n+Related:?\s*\n(?:[-*]\s*.+\n)*/gi },
    // "Thot Of The Day" / opiniões editoriais finais
    { description: 'thot of day', pattern: /\n+Thot(?:s)? of the Day:?[^\n]*/gi },
    // Disqus / comments prompt
    { description: 'comments prompt', pattern: /\n+(?:Leave a comment|Join the discussion)[^\n]*/gi },
    // Barra de share ("Share" isolado + links de redes sociais de sharing)
    { description: 'share text', pattern: /^\s*Share\s*$/gm },
    { description: 'social share links', pattern: /\n*-\s*\[[^\]]+\]\(https?:\/\/(?:www\.facebook\.com\/sharer|twitter\.com\/intent|t\.co|plus\.google\.com|pinterest\.com\/pin)[^)]+\)\n*/g },
    // Tag links no rodapé (ex: [Ayumu Imazu](https://www.asianjunkie.com/tag/...))
    { description: 'tag links', pattern: /\n*\[[^\]]+\]\(https?:\/\/www\.asianjunkie\.com\/tag\/[^)]+\)\n*/g },
    // "Tags [tag1] [tag2]..." no rodapé
    { description: 'tags line', pattern: /\nTags\s+(?:\[[^\]]+\]\([^)]+\)\s*)+/g },
    // &#8212; / &#8211; como entidades literais (em dash / en dash não decodificados)
    { description: 'em dash entity', pattern: /&#8212;/g, replacement: '—' },
    { description: 'en dash entity', pattern: /&#8211;/g, replacement: '–' },
  ],

  HelloKpop: [
    // "Also Read:" seções
    { description: 'also read', pattern: /\n+Also Read:?\s*[^\n]+/gi },
    // "Check out:" / "Don't forget to check out"
    { description: 'check out CTA', pattern: /\n+(?:Don'?t forget to\s+)?[Cc]heck\s+(?:out|it\s+out)[^\n]{0,100}/g },
    // "For more news about ..." rodapé promocional
    { description: 'for more news', pattern: /\n+For more news about\s+[^\n]+/gi },
    // Assinatura de foto "(Photo: HelloKpop)"
    { description: 'photo hellokpop', pattern: /\(?Photo:?\s*HelloKpop[^)]*\)?/gi },
    // "Stay updated" / "Follow HelloKpop"
    { description: 'follow CTA', pattern: /\n+(?:Stay updated|Follow HelloKpop)[^\n]*/gi },
  ],

  Kpopmap: [
    // "Source:" (inline ou rodapé)
    { description: 'source inline', pattern: /\(?Source:?\s*[^\n)]{1,100}\)?/gi },
    // "(Photo: Kpopmap)" e variações
    { description: 'photo kpopmap', pattern: /\(?Photo:?\s*Kpopmap[^)]*\)?/gi },
    // "Let us know in the comments" / "What do you think?"
    { description: 'engagement', pattern: /\n+(?:Let us know in the comments|What do you think\?)[^\n]*/gi },
    // "More about:" seções
    { description: 'more about', pattern: /\n+More about:?\s*[^\n]+/gi },
  ],
}

/**
 * Aplica limpeza de markdown específica por fonte.
 *
 * @param content - Conteúdo em markdown
 * @param source  - Nome da fonte (ex: "Soompi", "Koreaboo")
 * @returns Conteúdo limpo
 */
export function cleanContentBySource(content: string, source?: string | null): string {
  if (!content) return content

  let text = content

  // Regras comuns primeiro
  for (const rule of COMMON_RULES) {
    text = text.replace(rule.pattern, rule.replacement ?? '\n')
  }

  // Regras específicas da fonte
  if (source) {
    const sourceRules = SOURCE_RULES[source] ?? []
    for (const rule of sourceRules) {
      text = text.replace(rule.pattern, rule.replacement ?? '\n')
    }
  }

  // Normalizar múltiplas linhas em branco resultantes da limpeza
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  return text
}
