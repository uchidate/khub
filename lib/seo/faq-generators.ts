/**
 * Generates FAQPage schema entries from structured entity data.
 * Manual FAQ (stored in DB) takes precedence; auto-generated is the fallback.
 */

export interface FaqEntry {
    pergunta: string
    resposta: string
}

export function buildFaqSchema(entries: FaqEntry[]) {
    if (!entries.length) return null
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: entries.map(f => ({
            '@type': 'Question',
            name: f.pergunta,
            acceptedAnswer: { '@type': 'Answer', text: f.resposta },
        })),
    }
}

// ── Artist ────────────────────────────────────────────────────────────────────

interface ArtistFaqOptions {
    name: string
    nameHangul?: string | null
    roleLabel?: string
    groupName?: string | null
    agencyName?: string | null
    debutYear?: number | null
    birthDate?: Date | null
    deathDate?: Date | null
}

export function generateArtistFaq(opts: ArtistFaqOptions): FaqEntry[] {
    const { name, nameHangul, roleLabel, groupName, agencyName, debutYear, birthDate, deathDate } = opts
    const faq: FaqEntry[] = []

    faq.push({
        pergunta: `Quem é ${name}?`,
        resposta: [
            `${name}${nameHangul ? ` (${nameHangul})` : ''} é ${roleLabel || 'artista'} sul-coreana`,
            groupName ? `integrante do grupo ${groupName}` : null,
            agencyName ? `sob contrato com a ${agencyName}` : null,
            debutYear ? `com debut em ${debutYear}` : null,
        ].filter(Boolean).join(', ') + '.',
    })

    if (debutYear) {
        faq.push({
            pergunta: `Quando ${name} debutou?`,
            resposta: `${name} debutou em ${debutYear}${groupName ? ` como integrante do grupo ${groupName}` : ''}.`,
        })
    }

    if (groupName) {
        faq.push({
            pergunta: `De qual grupo ${name} faz parte?`,
            resposta: `${name} é integrante${agencyName ? ` da ${agencyName}` : ''} do grupo ${groupName}.`,
        })
    }

    if (birthDate) {
        const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 3600 * 1000))
        faq.push({
            pergunta: `Qual é a idade de ${name}?`,
            resposta: `${name} nasceu em ${birthDate.toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC',
            })}${!deathDate ? ` e tem ${age} anos` : ''}.`,
        })
    }

    if (nameHangul) {
        faq.push({
            pergunta: `Qual é o nome coreano de ${name}?`,
            resposta: `O nome coreano de ${name} é ${nameHangul}.`,
        })
    }

    if (agencyName) {
        faq.push({
            pergunta: `Qual é a agência de ${name}?`,
            resposta: `${name} é gerenciada pela ${agencyName}.`,
        })
    }

    return faq
}

// ── Group ─────────────────────────────────────────────────────────────────────

interface GroupFaqOptions {
    name: string
    nameHangul?: string | null
    debutYear?: number | null
    agencyName?: string | null
    memberCount?: number
    activeMembers?: string[]
    genre?: string | null
}

export function generateGroupFaq(opts: GroupFaqOptions): FaqEntry[] {
    const { name, nameHangul, debutYear, agencyName, memberCount, activeMembers, genre } = opts
    const faq: FaqEntry[] = []

    faq.push({
        pergunta: `O que é ${name}?`,
        resposta: [
            `${name}${nameHangul ? ` (${nameHangul})` : ''} é um grupo de K-pop sul-coreano`,
            genre ? `do gênero ${genre}` : null,
            agencyName ? `gerenciado pela ${agencyName}` : null,
            debutYear ? `com debut em ${debutYear}` : null,
        ].filter(Boolean).join(', ') + '.',
    })

    if (debutYear) {
        faq.push({
            pergunta: `Quando ${name} debutou?`,
            resposta: `O grupo ${name} fez seu debut em ${debutYear}${agencyName ? ` pela ${agencyName}` : ''}.`,
        })
    }

    if (activeMembers && activeMembers.length > 0) {
        faq.push({
            pergunta: `Quem são os integrantes de ${name}?`,
            resposta: `${name} é formado por ${activeMembers.length} integrantes: ${activeMembers.join(', ')}.`,
        })
    } else if (memberCount && memberCount > 0) {
        faq.push({
            pergunta: `Quantos integrantes tem ${name}?`,
            resposta: `${name} tem ${memberCount} integrante${memberCount > 1 ? 's' : ''}.`,
        })
    }

    if (nameHangul) {
        faq.push({
            pergunta: `Qual é o nome coreano de ${name}?`,
            resposta: `O nome coreano de ${name} é ${nameHangul}.`,
        })
    }

    if (agencyName) {
        faq.push({
            pergunta: `Qual é a empresa de ${name}?`,
            resposta: `${name} é gerenciado pela ${agencyName}.`,
        })
    }

    return faq
}

// ── Production ────────────────────────────────────────────────────────────────

interface ProductionFaqOptions {
    title: string
    type: string
    year?: number | null
    synopsis?: string | null
    castNames?: string[]
    episodeCount?: number | null
    streamingPlatforms?: string[]
}

export function generateProductionFaq(opts: ProductionFaqOptions): FaqEntry[] {
    const { title, type, year, synopsis, castNames, episodeCount, streamingPlatforms } = opts
    const typeLabel = type === 'MOVIE' ? 'filme' : 'dorama'
    const faq: FaqEntry[] = []

    faq.push({
        pergunta: `O que é ${title}?`,
        resposta: synopsis
            ? synopsis.slice(0, 300).replace(/\n/g, ' ')
            : `${title} é um ${typeLabel} coreano${year ? ` de ${year}` : ''}.`,
    })

    if (year) {
        faq.push({
            pergunta: `Quando ${title} foi lançado?`,
            resposta: `${title} foi lançado em ${year}.`,
        })
    }

    if (castNames && castNames.length > 0) {
        faq.push({
            pergunta: `Quem são os atores de ${title}?`,
            resposta: `O elenco principal de ${title} inclui: ${castNames.slice(0, 5).join(', ')}.`,
        })
    }

    if (episodeCount && episodeCount > 1) {
        faq.push({
            pergunta: `Quantos episódios tem ${title}?`,
            resposta: `${title} tem ${episodeCount} episódios.`,
        })
    }

    if (streamingPlatforms && streamingPlatforms.length > 0) {
        faq.push({
            pergunta: `Onde assistir ${title}?`,
            resposta: `${title} está disponível em: ${streamingPlatforms.join(', ')}.`,
        })
    }

    return faq
}
