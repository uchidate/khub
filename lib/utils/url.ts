/**
 * Normaliza uma URL para uso como sourceUrl canônico.
 *
 * Remove parâmetros de rastreamento (UTM e similares) que fontes RSS
 * appended nos links, garantindo que o mesmo artigo não seja registrado
 * duas vezes com URLs ligeiramente diferentes.
 *
 * Exemplos:
 *   https://www.asianjunkie.com/2026/03/06/article/?utm_source=rss&utm_medium=rss&utm_campaign=article
 *   → https://www.asianjunkie.com/2026/03/06/article/
 */

const TRACKING_PARAMS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'utm_id',
    'ref',
    'fbclid',
    'gclid',
    '_ga',
]

export function normalizeSourceUrl(url: string): string {
    try {
        const parsed = new URL(url)
        TRACKING_PARAMS.forEach(p => parsed.searchParams.delete(p))
        // Remove trailing ? se não sobrou nenhum param
        return parsed.toString()
    } catch {
        return url
    }
}
