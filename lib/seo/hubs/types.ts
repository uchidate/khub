export type ArchiveHubKind = 'artists' | 'groups' | 'productions'
export type ArchiveHubLocale = 'pt' | 'en' | 'es' | 'th' | 'id'

export type ArchiveHub = {
    slug: string
    kind: ArchiveHubKind
    groupSlug?: string
    agencyName?: string
    year?: number
    title: string
    shortTitle: string
    description: string
    intro: string[]
    keywords: string[]
    faq: Array<{ question: string; answer: string }>
    locale?: ArchiveHubLocale
    i18nKey?: string
}

export const SINGER_ROLE_TERMS = ['cantor', 'cantora', 'singer', 'vocalist', 'rapper', 'idol']
export const ACTOR_ROLE_TERMS = ['ator', 'atriz', 'actor', 'actress']
