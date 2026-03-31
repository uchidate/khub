/**
 * Script de importação: public.Artist → Payload CMS
 * Uso: DATABASE_URL=... PAYLOAD_SECRET=... npx ts-node scripts/import-artists.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import { Pool } from 'pg'

async function main() {
    const payload = await getPayload({ config })
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })

    // Import Artists
    console.log('Importando artistas...')
    const { rows: artists } = await pool.query(
        `SELECT id, "nameRomanized", "nameHangul", bio, "analiseEditorial", curiosidades,
                "primaryImageUrl", "isHidden", "flaggedAsNonKorean", "trendingBadgeOverride"
         FROM public."Artist" ORDER BY "nameRomanized" LIMIT 500`
    )

    let artistOk = 0, artistSkip = 0
    for (const a of artists) {
        const existing = await payload.find({ collection: 'artists', where: { prismaId: { equals: a.id } }, limit: 1 })
        if (existing.totalDocs > 0) { artistSkip++; continue }
        await payload.create({
            collection: 'artists',
            data: {
                prismaId: a.id,
                nameRomanized: a.nameRomanized,
                nameHangul: a.nameHangul ?? undefined,
                bio: a.bio ?? undefined,
                analiseEditorial: a.analiseEditorial ?? undefined,
                curiosidades: (a.curiosidades ?? []).map((t: string) => ({ text: t })),
                primaryImageUrl: a.primaryImageUrl ?? undefined,
                isHidden: a.isHidden ?? false,
                flaggedAsNonKorean: a.flaggedAsNonKorean ?? false,
                trendingBadgeOverride: a.trendingBadgeOverride ?? undefined,
            },
        })
        artistOk++
    }
    console.log(`Artistas: ${artistOk} importados, ${artistSkip} já existiam`)

    // Import MusicalGroups
    console.log('Importando grupos...')
    const { rows: groups } = await pool.query(
        `SELECT id, name, "nameHangul", bio, "analiseEditorial", curiosidades,
                "profileImageUrl", "isHidden", "fanClubName", "officialColor",
                "debutDate", "disbandDate"
         FROM public."MusicalGroup" ORDER BY name LIMIT 500`
    )

    let groupOk = 0, groupSkip = 0
    for (const g of groups) {
        const existing = await payload.find({ collection: 'musical-groups', where: { prismaId: { equals: g.id } }, limit: 1 })
        if (existing.totalDocs > 0) { groupSkip++; continue }
        await payload.create({
            collection: 'musical-groups',
            data: {
                prismaId: g.id,
                name: g.name,
                nameHangul: g.nameHangul ?? undefined,
                bio: g.bio ?? undefined,
                analiseEditorial: g.analiseEditorial ?? undefined,
                curiosidades: (g.curiosidades ?? []).map((t: string) => ({ text: t })),
                profileImageUrl: g.profileImageUrl ?? undefined,
                isHidden: g.isHidden ?? false,
                fanClubName: g.fanClubName ?? undefined,
                officialColor: g.officialColor ?? undefined,
                debutDate: g.debutDate ?? undefined,
                disbandDate: g.disbandDate ?? undefined,
            },
        })
        groupOk++
    }
    console.log(`Grupos: ${groupOk} importados, ${groupSkip} já existiam`)

    await pool.end()
    process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
