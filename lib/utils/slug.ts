/**
 * Generate a URL-safe slug from a string.
 * Handles Portuguese characters and accents.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

/** Append a suffix to make a slug unique (e.g. "my-post-2") */
export function uniquifySlug(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base
  let i = 2
  while (existing.includes(`${base}-${i}`)) i++
  return `${base}-${i}`
}

/**
 * Extrai texto legível de blocos de blog (blog_paragraph, blog_heading, blog_quote, etc.)
 * para calcular o tempo de leitura com base no conteúdo real.
 */
function extractTextFromBlocks(blocks: unknown[]): string {
  const TEXT_FIELDS = ['text', 'caption', 'author']
  const parts: string[] = []
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    const b = block as Record<string, unknown>
    for (const field of TEXT_FIELDS) {
      if (typeof b[field] === 'string') parts.push(b[field] as string)
    }
    // stats_row items
    if (Array.isArray(b.items)) {
      for (const item of b.items as Record<string, unknown>[]) {
        if (typeof item?.label === 'string') parts.push(item.label)
        if (typeof item?.value === 'string') parts.push(item.value)
      }
    }
  }
  return parts.join(' ')
}

/**
 * Calcula tempo de leitura estimado em minutos.
 * Aceita markdown string ou array de blocos de blog.
 * Velocidade: 238 wpm (média de leitura adulto em PT-BR).
 */
export function calcReadingTime(content: string | unknown[]): number {
  const text = Array.isArray(content)
    ? extractTextFromBlocks(content)
    : content
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length
  return Math.max(1, Math.round(words / 238))
}
