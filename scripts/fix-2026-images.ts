/**
 * Busca filmes/produções de 2026 sem imageUrl ou com galleryUrls vazio,
 * consulta TMDB e preenche imageUrl (poster) + até 2 backdrops em galleryUrls.
 *
 * Uso: npx ts-node --project tsconfig.scripts.json scripts/fix-2026-images.ts
 * Ou:  npx tsx scripts/fix-2026-images.ts
 */

import prisma from '../lib/prisma'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500'
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original'

if (!TMDB_API_KEY) {
    console.error('❌  TMDB_API_KEY não configurada')
    process.exit(1)
}

async function tmdbFetch(path: string) {
    const res = await fetch(`${TMDB_BASE}${path}?api_key=${TMDB_API_KEY}&language=pt-BR&include_image_language=pt,en,null`)
    if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`)
    return res.json() as Promise<Record<string, unknown>>
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
    // Produções de 2026 sem poster OU com galleryUrls vazio, que têm tmdbId
    const productions = await prisma.production.findMany({
        where: {
            year: 2026,
            isHidden: false,
            tmdbId: { not: null },
            OR: [
                { imageUrl: null },
                { galleryUrls: { isEmpty: true } },
            ],
        },
        select: {
            id: true,
            titlePt: true,
            titleKr: true,
            type: true,
            tmdbId: true,
            imageUrl: true,
            galleryUrls: true,
        },
        orderBy: { titlePt: 'asc' },
    })

    console.log(`🔍  ${productions.length} produções de 2026 encontradas para verificar\n`)

    let updated = 0
    let noImages = 0

    for (const prod of productions) {
        const isMovie = prod.type === 'Filme'
        const mediaType = isMovie ? 'movie' : 'tv'
        const label = `${prod.titlePt} (${prod.tmdbId})`

        try {
            // Busca imagens no TMDB
            const data = await tmdbFetch(`/${mediaType}/${prod.tmdbId}/images`)
            const posters = (data.posters as Array<{ file_path: string; vote_average: number; iso_639_1: string | null }> ?? [])
                .sort((a, b) => b.vote_average - a.vote_average)
            const backdrops = (data.backdrops as Array<{ file_path: string; vote_average: number }> ?? [])
                .sort((a, b) => b.vote_average - a.vote_average)

            if (!posters.length && !backdrops.length) {
                console.log(`⚪  ${label} — sem imagens no TMDB`)
                noImages++
                await sleep(300)
                continue
            }

            const updateData: Record<string, unknown> = {}

            // imageUrl: pega melhor poster em PT > melhor poster geral
            if (!prod.imageUrl) {
                const ptPoster = posters.find(p => p.iso_639_1 === 'pt')
                const bestPoster = ptPoster ?? posters[0]
                if (bestPoster) {
                    updateData.imageUrl = `${POSTER_BASE}${bestPoster.file_path}`
                }
            }

            // galleryUrls: até 2 backdrops (ou posters se não tiver backdrop)
            if (!prod.galleryUrls.length) {
                const gallery: string[] = []
                const top2backdrops = backdrops.slice(0, 2)
                for (const b of top2backdrops) {
                    gallery.push(`${BACKDROP_BASE}${b.file_path}`)
                }
                // Se não chegou a 2 backdrops, completa com posters extras
                if (gallery.length < 2) {
                    const extraPosters = posters.slice(gallery.length > 0 ? 1 : 0, 2 - gallery.length + 1)
                    for (const p of extraPosters) {
                        if (gallery.length >= 2) break
                        gallery.push(`${POSTER_BASE}${p.file_path}`)
                    }
                }
                if (gallery.length) updateData.galleryUrls = gallery
            }

            if (!Object.keys(updateData).length) {
                console.log(`✅  ${label} — já tem imagens, nada a fazer`)
                await sleep(300)
                continue
            }

            await prisma.production.update({
                where: { id: prod.id },
                data: updateData,
            })

            const fields = Object.keys(updateData).join(', ')
            console.log(`✨  ${label} — atualizado: ${fields}`)
            if (updateData.imageUrl) console.log(`    🖼  poster: ${updateData.imageUrl}`)
            if (updateData.galleryUrls) console.log(`    🖼  gallery: ${(updateData.galleryUrls as string[]).join('\n           ')}`)
            updated++

        } catch (err) {
            console.error(`❌  ${label} — erro: ${(err as Error).message}`)
        }

        await sleep(350) // respeita rate limit TMDB (40 req/s)
    }

    console.log(`\n✅  ${updated} produções atualizadas | ⚪ ${noImages} sem imagens no TMDB | ${productions.length - updated - noImages} já estavam ok`)
    await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
