/**
 * sync-social-links.ts
 *
 * Busca automaticamente redes sociais dos artistas via Wikidata.
 * Wikidata é gratuito, sem API key, e tem Instagram/Twitter/YouTube/TikTok
 * para a maioria dos artistas K-pop.
 *
 * Uso:
 *   npx tsx scripts/sync-social-links.ts
 *
 * Variáveis de ambiente:
 *   DRY_RUN=true   → mostra o que seria salvo sem gravar no banco
 *   LIMIT=10       → limitar a N artistas (útil para testar)
 *   ONLY_MISSING=true (padrão) → apenas artistas sem redes sociais
 *   ALL=true       → re-processar TODOS os artistas
 *   DELAY=1500     → delay entre requests em ms (padrão: 1500)
 */

import 'dotenv/config'
import prisma from '../lib/prisma'

const DRY_RUN = process.env.DRY_RUN === 'true'
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT) : undefined
const ALL = process.env.ALL === 'true'
const DELAY_MS = parseInt(process.env.DELAY || '1500')

// Wikidata property IDs → URL builders
const WD_PROPS: Record<string, { label: string; buildUrl: (v: string) => string }> = {
    P2003: { label: 'instagram',  buildUrl: v => `https://www.instagram.com/${v}` },
    P2002: { label: 'twitter',    buildUrl: v => `https://x.com/${v}` },
    P2397: { label: 'youtube',    buildUrl: v => v.startsWith('@') || v.startsWith('UC') ? `https://www.youtube.com/${v.startsWith('UC') ? 'channel/' : ''}${v}` : `https://www.youtube.com/@${v}` },
    P7085: { label: 'tiktok',     buildUrl: v => `https://www.tiktok.com/@${v}` },
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function searchWikidata(name: string): Promise<string | null> {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&limit=5&format=json`
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'HallyuHub/1.0 (social-links-sync; https://hallyuhub.com.br)' }
        })
        if (!res.ok) return null
        const data: any = await res.json()
        if (!data.search?.length) return null

        // Prefer results with K-pop related description
        const kpopKeywords = ['singer', 'rapper', 'actress', 'actor', 'idol', 'k-pop', 'korean', 'south korean']
        const best = data.search.find((r: any) => {
            const desc = (r.description || '').toLowerCase()
            return kpopKeywords.some(kw => desc.includes(kw))
        }) || data.search[0]

        return best?.id || null
    } catch {
        return null
    }
}

async function getWikidataSocialLinks(entityId: string): Promise<Record<string, string>> {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=claims&format=json`
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'HallyuHub/1.0 (social-links-sync; https://hallyuhub.com.br)' }
        })
        if (!res.ok) return {}
        const data: any = await res.json()
        const claims = data.entities?.[entityId]?.claims
        if (!claims) return {}

        const links: Record<string, string> = {}
        for (const [propId, config] of Object.entries(WD_PROPS)) {
            const claimArr = claims[propId]
            if (!claimArr?.length) continue
            // Get the preferred/normal ranked value
            const claim = claimArr.find((c: any) => c.rank === 'preferred') || claimArr[0]
            const value = claim?.mainsnak?.datavalue?.value
            if (value && typeof value === 'string') {
                links[config.label] = config.buildUrl(value)
            }
        }
        return links
    } catch {
        return {}
    }
}

async function findArtistSocialLinks(nameRomanized: string, nameHangul: string | null): Promise<Record<string, string>> {
    // Try with romanized name first, then hangul if no result
    for (const name of [nameRomanized, nameHangul].filter(Boolean) as string[]) {
        const entityId = await searchWikidata(name)
        if (entityId) {
            const links = await getWikidataSocialLinks(entityId)
            if (Object.keys(links).length > 0) return links
        }
        await sleep(300)
    }
    return {}
}

async function main() {
    console.log('🔍 Buscando artistas sem redes sociais...\n')

    const artists = await prisma.artist.findMany({
        where: ALL ? {} : {
            socialLinksUpdatedAt: null,
        },
        orderBy: { trendingScore: 'desc' },
        take: LIMIT,
        select: {
            id: true,
            nameRomanized: true,
            nameHangul: true,
            socialLinks: true,
            socialLinksUpdatedAt: true,
        },
    })

    console.log(`📋 ${artists.length} artistas para processar`)
    if (DRY_RUN) console.log('🔍 DRY RUN — nada será salvo\n')
    console.log(`⏳ Delay entre requests: ${DELAY_MS}ms\n`)
    console.log('─'.repeat(60))

    let found = 0
    let notFound = 0
    let errors = 0

    for (let i = 0; i < artists.length; i++) {
        const artist = artists[i]
        process.stdout.write(`[${i + 1}/${artists.length}] ${artist.nameRomanized}... `)

        try {
            const links = await findArtistSocialLinks(artist.nameRomanized, artist.nameHangul)

            if (Object.keys(links).length === 0) {
                console.log('❌ não encontrado')
                notFound++
            } else {
                console.log(`✅ ${Object.keys(links).join(', ')}`)

                if (!DRY_RUN) {
                    const existing = (artist.socialLinks as Record<string, string> | null) || {}
                    // Merge: existing links take priority (don't overwrite manual entries)
                    const merged = { ...links, ...existing }

                    await prisma.artist.update({
                        where: { id: artist.id },
                        data: {
                            socialLinks: merged,
                            socialLinksUpdatedAt: new Date(),
                        },
                    })
                } else {
                    console.log('   ', JSON.stringify(links, null, 2).replace(/\n/g, '\n    '))
                }

                found++
            }
        } catch (e) {
            console.log(`❌ erro: ${e}`)
            errors++
        }

        // Delay para não sobrecarregar Wikidata
        if (i < artists.length - 1) await sleep(DELAY_MS)
    }

    console.log('─'.repeat(60))
    console.log(`\n📊 Resultado:`)
    console.log(`   ✅ Encontrados: ${found}`)
    console.log(`   ❌ Não encontrados: ${notFound}`)
    if (errors) console.log(`   💥 Erros: ${errors}`)

    if (DRY_RUN) {
        console.log(`\n💡 Remova DRY_RUN=true para gravar no banco.`)
    } else if (found > 0) {
        console.log(`\n🎉 ${found} artistas atualizados com redes sociais!`)
        console.log(`   Acesse /admin/artists/social-links para revisar.`)
    }
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
