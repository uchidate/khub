import { SITE_URL } from '@/lib/constants/site'
import { extractYoutubeId } from '@/lib/utils/youtube'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined }

export function compactSchema<T extends Record<string, JsonValue | undefined>>(data: T): Record<string, JsonValue> {
    return Object.fromEntries(Object.entries(data).filter(([, value]) => {
        if (value === undefined || value === null) return false
        if (Array.isArray(value) && value.length === 0) return false
        if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false
        return true
    })) as Record<string, JsonValue>
}

export function isoDateOnly(value: Date | string | null | undefined): string | undefined {
    if (!value) return undefined
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return undefined
    return date.toISOString().split('T')[0]
}

export function isoDateTime(value: Date | string | null | undefined): string | undefined {
    if (!value) return undefined
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return undefined
    return date.toISOString()
}

export function cleanSameAs(urls: Array<string | null | undefined>): string[] {
    const seen = new Set<string>()
    return urls
        .map(url => (typeof url === 'string' ? url.trim() : ''))
        .filter(url => {
            if (!url || seen.has(url)) return false
            try {
                const parsed = new URL(url)
                if (!['http:', 'https:'].includes(parsed.protocol)) return false
                if (parsed.hostname.includes('google.com') && parsed.pathname.includes('/search')) return false
                seen.add(url)
                return true
            } catch {
                return false
            }
        })
}

export function youtubeVideoSchema(input: {
    title: string
    url: string
    pageUrl: string
    description?: string | null
    uploadDate?: Date | string | null
    thumbnailUrl?: string | null
}) {
    const id = extractYoutubeId(input.url)
    if (!id) return null

    return compactSchema({
        '@type': 'VideoObject',
        name: input.title,
        description: input.description?.slice(0, 300) ?? input.title,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        url: input.url,
        thumbnailUrl: input.thumbnailUrl ?? `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        uploadDate: isoDateTime(input.uploadDate) ?? '2025-01-01T00:00:00Z',
        inLanguage: 'ko',
        isFamilyFriendly: true,
        mainEntityOfPage: input.pageUrl,
    })
}

export function websiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'HallyuHub',
        url: SITE_URL,
        inLanguage: 'pt-BR',
        potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    }
}
