import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

interface Suggestion {
    label: string
    url: string
    type: "artist" | "group" | "production" | "post"
    matchedTerm: string
}

export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json()
        if (!text || typeof text !== "string") return NextResponse.json({ suggestions: [] })

        const words = [...new Set(
            text.match(/[A-ZÁÉÍÓÚÂÊÎÔÛÀÃÕ][a-záéíóúâêîôûàãõA-ZÁÉÍÓÚÂÊÎÔÛÀÃÕ\s]{2,30}/g) ?? []
        )].slice(0, 30)

        if (words.length === 0) return NextResponse.json({ suggestions: [] })

        const [artists, groups, productions, posts] = await Promise.all([
            prisma.artist.findMany({
                where: {
                    isHidden: false,
                    OR: words.map(w => ({ nameRomanized: { contains: w, mode: "insensitive" as const } })),
                },
                select: { nameRomanized: true, slug: true },
                take: 5,
            }),
            prisma.musicalGroup.findMany({
                where: {
                    isHidden: false,
                    OR: words.map(w => ({ name: { contains: w, mode: "insensitive" as const } })),
                },
                select: { name: true, slug: true },
                take: 5,
            }),
            prisma.production.findMany({
                where: {
                    isHidden: false,
                    OR: words.map(w => ({ titlePt: { contains: w, mode: "insensitive" as const } })),
                },
                select: { titlePt: true, slug: true },
                take: 5,
            }),
            prisma.blogPost.findMany({
                where: {
                    status: "PUBLISHED",
                    OR: words.map(w => ({ title: { contains: w, mode: "insensitive" as const } })),
                },
                select: { title: true, slug: true },
                take: 5,
            }),
        ])

        const suggestions: Suggestion[] = [
            ...artists.map(a => ({ label: a.nameRomanized, url: `/artists/${a.slug}`, type: "artist" as const, matchedTerm: a.nameRomanized })),
            ...groups.map(g => ({ label: g.name, url: `/groups/${g.slug}`, type: "group" as const, matchedTerm: g.name })),
            ...productions.map(p => ({ label: p.titlePt, url: `/productions/${p.slug}`, type: "production" as const, matchedTerm: p.titlePt })),
            ...posts.map(p => ({ label: p.title, url: `/blog/${p.slug}`, type: "post" as const, matchedTerm: p.title })),
        ]

        return NextResponse.json({ suggestions })
    } catch (error) {
        return NextResponse.json({ suggestions: [], error: String(error) })
    }
}
