import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get('groupId')

    const promptPath = join(process.cwd(), 'prompts', 'group-enrich.md')
    const currentYear = new Date().getFullYear()
    const prompt = readFileSync(promptPath, 'utf-8')
        .replace(/\b2025\b/g, String(currentYear))
        .replace(/\b2023-2025\b/g, `${currentYear - 2}-${currentYear}`)

    let members: string[] = []
    if (groupId) {
        const memberships = await prisma.artistGroupMembership.findMany({
            where: { groupId, isActive: true },
            select: { artist: { select: { nameRomanized: true } }, role: true },
            orderBy: { position: 'asc' },
            take: 12,
        })
        members = memberships.map(m =>
            m.role ? `${m.artist.nameRomanized} (${m.role})` : m.artist.nameRomanized
        )
    }

    return NextResponse.json({ prompt, members })
}
