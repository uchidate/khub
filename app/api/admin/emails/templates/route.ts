import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
    const session = await auth()
    if (session?.user?.role?.toLowerCase() !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const templates = await prisma.emailTemplate.findMany({
        orderBy: { slug: 'asc' },
        select: { id: true, slug: true, name: true, subject: true, variables: true, isActive: true, updatedAt: true },
    })

    return NextResponse.json({ templates })
}
