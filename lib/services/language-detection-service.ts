export type DetectedLang = 'ko' | 'en' | 'pt' | 'unknown'

/**
 * Detecta o idioma de um texto baseado em heurísticas léxicas.
 * Suficientemente preciso para bios de artistas e sinopses de produções coreanas.
 *
 * Ordem de precedência:
 *   1. Hangul (coreano) — caracteres distintivos
 *   2. Português — palavras funcionais exclusivas do PT
 *   3. Inglês — palavras funcionais exclusivas do EN
 *   4. unknown — ambíguo ou texto curto demais
 */
export function detectLanguage(text: string): DetectedLang {
  if (!text || text.trim().length < 15) return 'unknown'

  const sample = text.slice(0, 600)

  // 1. Coreano: Hangul Unicode block — suficiente com 3 ou mais caracteres
  const hangulCount = (sample.match(/[\uAC00-\uD7AF\u3131-\u314E\u314F-\u3163]/g) ?? []).length
  if (hangulCount >= 3) return 'ko'

  // 2. Português: palavras funcionais exclusivas do PT (não existem em EN)
  const ptSignals = [
    /\bé\b/, /\bsão\b/, /\bestá\b/, /\bestão\b/, /\bpara\b/, /\bcomo\b/,
    /\btambém\b/, /\buma\b/, /\bdos\b/, /\bdas\b/, /\bnos\b/, /\bnas\b/,
    /\bque\b/, /\bfoi\b/, /\bnão\b/, /\bem\b/, /\bpelo\b/, /\bpela\b/,
    /\bcom\b/, /\bdo\b/, /\bda\b/, /\bno\b/, /\bna\b/,
  ]
  const ptScore = ptSignals.filter(r => r.test(sample)).length
  if (ptScore >= 4) return 'pt'

  // 3. Inglês: palavras funcionais típicas do EN
  const enSignals = [
    /\bthe\b/i, /\bis\b/i, /\bare\b/i, /\bwas\b/i, /\bwere\b/i,
    /\bhas\b/i, /\bhave\b/i, /\band\b/i, /\bwith\b/i, /\bhis\b/i,
    /\bher\b/i, /\bshe\b/i, /\bhe\b/i, /\bthey\b/i, /\btheir\b/i,
    /\bthis\b/i, /\bthat\b/i, /\bin\b/i, /\bof\b/i, /\bto\b/i,
  ]
  const enScore = enSignals.filter(r => r.test(sample)).length
  if (enScore >= 4) return 'en'

  return 'unknown'
}
