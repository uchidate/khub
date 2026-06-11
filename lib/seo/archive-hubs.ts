import { archiveHubs } from './hubs'
import { ACTOR_ROLE_TERMS, SINGER_ROLE_TERMS, type ArchiveHub, type ArchiveHubLocale } from './hubs/types'

export type { ArchiveHub, ArchiveHubKind, ArchiveHubLocale } from './hubs/types'

export const ARCHIVE_HUBS: ArchiveHub[] = archiveHubs

function createArchiveHubMap(hubs: ArchiveHub[]): Record<string, ArchiveHub> {
    const seen = new Set<string>()
    const duplicates: string[] = []

    for (const hub of hubs) {
        if (seen.has(hub.slug)) duplicates.push(hub.slug)
        seen.add(hub.slug)
    }

    if (duplicates.length > 0) {
        throw new Error(`Duplicate archive hub slug(s): ${duplicates.join(', ')}`)
    }

    return Object.fromEntries(hubs.map(hub => [hub.slug, hub]))
}

export const ARCHIVE_HUB_BY_SLUG = createArchiveHubMap(ARCHIVE_HUBS)

export function getArchiveHub(slug: string) {
    return ARCHIVE_HUB_BY_SLUG[slug]
}

/** Hubs por idioma — pt = hubs sem `locale` (comportamento original) + os marcados explicitamente como 'pt'. */
export function getArchiveHubsByLocale(locale: ArchiveHubLocale) {
    if (locale === 'pt') return ARCHIVE_HUBS.filter(hub => !hub.locale || hub.locale === 'pt')
    return ARCHIVE_HUBS.filter(hub => hub.locale === locale)
}

export function getArchiveHubByLocaleAndSlug(locale: ArchiveHubLocale, slug: string) {
    const hub = ARCHIVE_HUB_BY_SLUG[slug]
    if (!hub) return undefined
    const hubLocale = hub.locale ?? 'pt'
    return hubLocale === locale ? hub : undefined
}

/** Encontra a versão de um hub em outro idioma, via i18nKey compartilhado — usado só para montar hreflang cruzado. */
export function getTranslatedHub(hub: ArchiveHub, targetLocale: ArchiveHubLocale): ArchiveHub | undefined {
    if (!hub.i18nKey) return undefined
    return ARCHIVE_HUBS.find(h => h.i18nKey === hub.i18nKey && (h.locale ?? 'pt') === targetLocale)
}

export function getRelatedArtistHubs(input: {
    roles?: string[] | null
    gender?: number | null
    activeGroupCount?: number
    productionCount?: number
}) {
    const roles = (input.roles ?? []).map(role => role.toLowerCase())
    const isSinger = roles.some(role => SINGER_ROLE_TERMS.some(term => role.includes(term)))
    const isActor = roles.some(role => ACTOR_ROLE_TERMS.some(term => role.includes(term)))
    const slugs = [
        input.gender === 1 && isSinger ? 'cantoras-kpop' : null,
        input.gender === 2 && isSinger ? 'cantores-kpop' : null,
        input.gender === 1 && isActor ? 'atrizes-coreanas' : null,
        input.gender === 2 && isActor ? 'atores-coreanos' : null,
        isSinger ? 'kpop-idols-famosos' : null,
        isSinger && (input.activeGroupCount ?? 0) === 0 ? 'artistas-solo-kpop' : null,
        isSinger && (isActor || (input.productionCount ?? 0) > 0) ? 'idols-que-atuam-em-doramas' : null,
    ].filter(Boolean) as string[]
    return slugs.map(slug => ARCHIVE_HUB_BY_SLUG[slug]).filter(Boolean)
}

export function getRelatedGroupHubs(input: { slug?: string | null; femaleMembers?: number; maleMembers?: number }) {
    const femaleMembers = input.femaleMembers ?? 0
    const maleMembers = input.maleMembers ?? 0
    const slugs = [
        input.slug ? `integrantes-do-${input.slug}` : null,
        femaleMembers >= Math.max(1, maleMembers) ? 'grupos-femininos-kpop' : null,
        maleMembers > femaleMembers ? 'grupos-masculinos-kpop' : null,
    ].filter(Boolean) as string[]
    return slugs.map(slug => ARCHIVE_HUB_BY_SLUG[slug]).filter(Boolean)
}

export function getRelatedProductionHubs(input: { streamingPlatforms?: string[] | null; network?: string | null; tags?: string[] | null }) {
    const values = [
        ...(input.streamingPlatforms ?? []),
        input.network ?? '',
        ...(input.tags ?? []),
    ].map(value => value.toLowerCase())
    const slugs = [
        values.some(v => v.includes('netflix')) ? 'doramas-coreanos-netflix' : null,
        values.some(v => v.includes('prime') || v.includes('amazon')) ? 'doramas-amazon-prime' : null,
        values.some(v => v.includes('disney')) ? 'doramas-disney-plus' : null,
        values.some(v => v.includes('apple')) ? 'doramas-apple-tv-plus' : null,
        values.some(v => v.includes('viki')) ? 'doramas-viki' : null,
        values.some(v => v.includes('kocowa')) ? 'doramas-kocowa' : null,
        values.some(v => v.includes('histor') || v.includes('sageuk') || v.includes('joseon') || v.includes('goryeo')) ? 'doramas-historicos-coreanos' : null,
        values.some(v => v.includes('roman') || v.includes('rom-com') || v.includes('romance')) ? 'doramas-romanticos' : null,
        values.some(v => v.includes('terror') || v.includes('horror') || v.includes('monster') || v.includes('monstro')) ? 'doramas-terror-coreanos' : null,
        values.some(v => v.includes('thriller') || v.includes('suspense') || v.includes('mystery') || v.includes('mist')) ? 'doramas-thriller-coreanos' : null,
        values.some(v => v.includes('action') || v.includes('ação') || v.includes('acao') || v.includes('spy') || v.includes('espion')) ? 'doramas-acao-coreanos' : null,
        values.some(v => v.includes('comedy') || v.includes('comédia') || v.includes('comedia')) ? 'doramas-comedia-coreanos' : null,
        values.some(v => v.includes('fantasy') || v.includes('fantasia') || v.includes('supernatural') || v.includes('sobrenatural')) ? 'doramas-fantasia-coreanos' : null,
        values.some(v => v.includes('medical') || v.includes('hospital') || v.includes('doctor') || v.includes('médic') || v.includes('medic')) ? 'doramas-medicos-coreanos' : null,
        values.some(v => v.includes('school') || v.includes('escola') || v.includes('college') || v.includes('youth') || v.includes('juventude')) ? 'doramas-escolares-coreanos' : null,
        values.some(v => v.includes('crime') || v.includes('police') || v.includes('policial') || v.includes('detective') || v.includes('detetive')) ? 'doramas-policiais-coreanos' : null,
        values.some(v => v.includes('revenge') || v.includes('vingan') || v.includes('bullying')) ? 'doramas-de-vinganca-coreanos' : null,
        values.some(v => v.includes('zombie') || v.includes('zumbi') || v.includes('infection') || v.includes('epidemia')) ? 'doramas-zumbis-coreanos' : null,
        values.some(v => v.includes('time travel') || v.includes('viagem no tempo') || v.includes('timeline') || v.includes('reencarna')) ? 'doramas-viagem-no-tempo-coreanos' : null,
        values.some(v => v.includes('beginner') || v.includes('iniciante') || v.includes('must watch') || v.includes('popular')) ? 'doramas-coreanos-para-iniciantes' : null,
        values.some(v => v.includes('short') || v.includes('curto') || v.includes('miniss')) ? 'doramas-coreanos-curtos' : null,
        values.some(v => v.includes('happy ending') || v.includes('final feliz') || v.includes('feel good') || v.includes('comfort')) ? 'doramas-coreanos-com-final-feliz' : null,
        values.some(v => v.includes('sad') || v.includes('triste') || v.includes('melodrama') || v.includes('tearjerker')) ? 'doramas-coreanos-tristes' : null,
        values.some(v => v.includes('webtoon') || v.includes('manhwa') || v.includes('adapt')) ? 'doramas-coreanos-baseados-em-webtoon' : null,
        values.some(v => v.includes('top rated') || v.includes('melhor avaliado') || v.includes('aclamado')) ? 'doramas-coreanos-melhor-avaliados' : null,
        values.some(v => v.includes('hit') || v.includes('viral') || v.includes('famoso') || v.includes('mainstream')) ? 'doramas-coreanos-populares' : null,
        values.some(v => v.includes('recent') || v.includes('lançamento') || v.includes('lancamento') || v.includes('novo')) ? 'doramas-coreanos-recentes' : null,
        values.some(v => v.includes('long') || v.includes('longo') || v.includes('daily drama') || v.includes('family drama')) ? 'doramas-coreanos-longos' : null,
        values.some(v => v.includes('movie') || v.includes('filme') || v.includes('cinema')) ? 'filmes-coreanos' : null,
    ].filter(Boolean) as string[]
    return slugs.map(slug => ARCHIVE_HUB_BY_SLUG[slug]).filter(Boolean)
}
