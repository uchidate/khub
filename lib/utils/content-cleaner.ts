/**
 * Content Cleaner — limpeza de markdown por fonte de notícias
 *
 * Cada fonte RSS tem padrões de ruído distintos no conteúdo.
 * Esta utilidade remove boilerplate específico de cada site.
 */

type SourceRule = {
  description: string
  pattern: RegExp
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
    // "RELATED POSTS" sections
    { description: 'related posts', pattern: /\n+(?:\*{0,2})?RELATED POSTS:?\*{0,2}\n(?:[-*]\s*.+\n)*/gi },
    // Navegação entre episódios "[← Previous Episode] [Next Episode →]"
    { description: 'episode nav', pattern: /\n+\[?←?\s*(?:Previous|Prev)\.?\s*Episode\]?[^\n]*\n*/gi },
    { description: 'episode nav next', pattern: /\[?Next\s*Episode\s*→?\]?/gi },
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
    text = text.replace(rule.pattern, '\n')
  }

  // Regras específicas da fonte
  if (source) {
    const sourceRules = SOURCE_RULES[source] ?? []
    for (const rule of sourceRules) {
      text = text.replace(rule.pattern, '\n')
    }
  }

  // Normalizar múltiplas linhas em branco resultantes da limpeza
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  return text
}
