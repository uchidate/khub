type ArtistProductionSeoInput = {
    titlePt: string
    year?: number | null
}

type ArtistSeoInput = {
    name: string
    hangul?: string | null
    roleLabels?: string[]
    agencyName?: string | null
    groupNames?: string[]
    productions?: ArtistProductionSeoInput[]
}

type GroupSeoInput = {
    name: string
    hangul?: string | null
    agencyName?: string | null
    fanClubName?: string | null
    debutYear?: number | null
}

type ProductionArtistSeoInput = {
    name: string
}

type ProductionSeoInput = {
    title: string
    titleKr?: string | null
    type?: string | null
    year?: number | null
    synopsis?: string | null
    cast?: ProductionArtistSeoInput[]
    streamingPlatforms?: string[]
}

const TITLE_LIMIT = 70
// O layout root aplica template '%s | HallyuHub' — descontar o sufixo do limite evita estourar o título final
const SUFFIX_LEN = ' | HallyuHub'.length
const BASE_TITLE_LIMIT = TITLE_LIMIT - SUFFIX_LEN
const DESCRIPTION_LIMIT = 160

function cleanText(value: string): string {
    return value.replace(/\s+/g, ' ').trim()
}

function trimMeta(value: string, max = DESCRIPTION_LIMIT): string {
    const text = cleanText(value)
    if (text.length <= max) return text

    const sliced = text.slice(0, max - 1)
    const lastSpace = sliced.lastIndexOf(' ')
    const trimmed = (lastSpace > 90 ? sliced.slice(0, lastSpace) : sliced).trim()

    return `${trimmed}…`
}

function listNames(names: string[], max = 2): string {
    const visible = names.filter(Boolean).slice(0, max)
    if (visible.length === 0) return ''
    if (visible.length === 1) return visible[0]

    return `${visible.slice(0, -1).join(', ')} e ${visible[visible.length - 1]}`
}

function isMovieType(type?: string | null): boolean {
    const normalized = (type ?? '').toUpperCase()
    return normalized === 'MOVIE' || normalized === 'FILM' || normalized === 'FILME'
}

export function productionTypeLabel(type?: string | null): string {
    return isMovieType(type) ? 'filme coreano' : 'dorama coreano'
}

export function buildArtistSeoTitle(input: ArtistSeoInput): string {
    const role = input.roleLabels?.[0]?.toLowerCase()
    const group = listNames(input.groupNames ?? [], 1)
    const affiliation = group || input.agencyName

    if (role && affiliation) {
        const withAffiliation = `${input.name}: ${role} do ${affiliation} — perfil e doramas`
        if (withAffiliation.length <= BASE_TITLE_LIMIT) return withAffiliation
    }

    const featuredProduction = input.productions?.[0]?.titlePt
    if (role && featuredProduction) {
        const withProduction = `${input.name}: ${role} de ${featuredProduction} — perfil`
        if (withProduction.length <= BASE_TITLE_LIMIT) return withProduction
    }

    if (role) {
        const withRole = `${input.name}: ${role} — doramas, filmes e perfil`
        if (withRole.length <= BASE_TITLE_LIMIT) return withRole
    }

    const titleWithRole = `${input.name}: doramas, filmes e perfil`
    if (titleWithRole.length <= BASE_TITLE_LIMIT) return titleWithRole

    return trimMeta(`${input.name}: perfil e doramas`, BASE_TITLE_LIMIT)
}

export function buildArtistSeoDescription(input: ArtistSeoInput): string {
    const hangul = input.hangul ? ` (${input.hangul})` : ''
    const role = input.roleLabels?.[0]?.toLowerCase()
    const group = listNames(input.groupNames ?? [], 1)
    const productions = listNames((input.productions ?? []).map(p => p.titlePt), 2)
    const credits = productions ? ` trabalhos como ${productions}` : ' doramas, filmes e trabalhos no elenco'
    const affiliation = group || input.agencyName
    const affiliationText = affiliation ? `, ${affiliation}` : ''
    const roleText = role ? ` ${role}` : ''

    return trimMeta(`Conheça ${input.name}${hangul}:${roleText}${affiliationText},${credits}, biografia, fotos, curiosidades e notícias no HallyuHub.`)
}

export function buildProductionSeoTitle(input: ProductionSeoInput): string {
    const kind = productionTypeLabel(input.type)
    const hasStreaming = Boolean(input.streamingPlatforms?.length)
    const titleIntent = hasStreaming ? 'elenco, episódios e onde assistir' : 'elenco, episódios e sinopse'
    const year = input.year ? ` (${input.year})` : ''

    const titleWithYear = `${input.title}${year}: ${titleIntent}`
    if (!isMovieType(input.type) && titleWithYear.length <= BASE_TITLE_LIMIT) return titleWithYear

    const title = `${input.title}: ${titleIntent}`
    if (!isMovieType(input.type) && title.length <= BASE_TITLE_LIMIT) return title

    const fallbackWithYear = `${input.title}${year}: elenco do ${kind}`
    if (fallbackWithYear.length <= BASE_TITLE_LIMIT) return fallbackWithYear

    const fallback = `${input.title}: elenco do ${kind}`
    if (fallback.length <= BASE_TITLE_LIMIT) return fallback

    return trimMeta(`${input.title}: elenco e sinopse`, BASE_TITLE_LIMIT)
}

export function buildGroupSeoTitle(input: GroupSeoInput): string {
    const hangul = input.hangul ? ` (${input.hangul})` : ''

    if (input.agencyName) {
        const withAgency = `${input.name}: grupo da ${input.agencyName} — integrantes, álbuns e perfil`
        if (withAgency.length <= BASE_TITLE_LIMIT) return withAgency
    }

    if (input.debutYear) {
        const withDebut = `${input.name}${hangul}: grupo de K-pop desde ${input.debutYear} — integrantes e álbuns`
        if (withDebut.length <= BASE_TITLE_LIMIT) return withDebut
    }

    if (input.fanClubName) {
        const withFanclub = `${input.name}: integrantes, álbuns e fã-clube ${input.fanClubName}`
        if (withFanclub.length <= BASE_TITLE_LIMIT) return withFanclub
    }

    const generic = `${input.name}${hangul}: integrantes, álbuns e perfil`
    if (generic.length <= BASE_TITLE_LIMIT) return generic

    return trimMeta(`${input.name}: integrantes e perfil`, BASE_TITLE_LIMIT)
}

export function buildProductionSeoDescription(input: ProductionSeoInput): string {
    const kind = productionTypeLabel(input.type)
    const cast = listNames((input.cast ?? []).map(a => a.name), 3)
    const castText = cast ? ` Elenco: ${cast}.` : ''
    const yearText = input.year ? ` de ${input.year}` : ''
    const streamingText = input.streamingPlatforms?.length
        ? ` Veja onde assistir,`
        : ' Veja sinopse,'

    if (input.synopsis) {
        return trimMeta(`${input.title} é um ${kind}${yearText}.${castText}${streamingText} episódios, personagens e detalhes.`)
    }

    return trimMeta(`${input.title}: guia do ${kind}${yearText}.${castText}${streamingText} sinopse, episódios, personagens e elenco completo no HallyuHub.`)
}
