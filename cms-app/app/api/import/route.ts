import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Pool } from 'pg'

export async function POST(req: NextRequest) {
    const secret = req.headers.get('x-import-secret')
    if (secret !== process.env.PAYLOAD_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const results = { artists: { created: 0, skipped: 0 }, groups: { created: 0, skipped: 0 } }

    try {
        // Import Artists
        const { rows: artists } = await pool.query(
            `SELECT id, "nameRomanized", "nameHangul", bio, "analiseEditorial", curiosidades,
                    "primaryImageUrl", "isHidden", "flaggedAsNonKorean", "trendingBadgeOverride"
             FROM public."Artist" ORDER BY "nameRomanized"`
        )
        for (const a of artists) {
            const existing = await payload.find({ collection: 'artists', where: { prismaId: { equals: a.id } }, limit: 1 })
            if (existing.totalDocs > 0) { results.artists.skipped++; continue }
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
            results.artists.created++
        }

        // Import MusicalGroups
        const { rows: groups } = await pool.query(
            `SELECT id, name, "nameHangul", bio, "analiseEditorial", curiosidades,
                    "profileImageUrl", "isHidden", "fanClubName", "officialColor",
                    "debutDate", "disbandDate"
             FROM public."MusicalGroup" ORDER BY name`
        )
        for (const g of groups) {
            const existing = await payload.find({ collection: 'musical-groups', where: { prismaId: { equals: g.id } }, limit: 1 })
            if (existing.totalDocs > 0) { results.groups.skipped++; continue }
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
            results.groups.created++
        }
    } finally {
        await pool.end()
    }

    return NextResponse.json({ ok: true, results })
}
