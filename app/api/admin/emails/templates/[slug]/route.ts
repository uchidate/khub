import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
    subject: z.string().min(1).max(200),
    htmlContent: z.string().min(1),
    isActive: z.boolean().optional(),
})

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const session = await auth()
    if (session?.user?.role?.toLowerCase() !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { slug } = await params
    const template = await prisma.emailTemplate.findUnique({ where: { slug } })
    if (!template) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })

    return NextResponse.json({ template })
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const session = await auth()
    if (session?.user?.role?.toLowerCase() !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { slug } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Dados inválidos', issues: parsed.error.issues }, { status: 400 })
    }

    const template = await prisma.emailTemplate.update({
        where: { slug },
        data: {
            subject: parsed.data.subject,
            htmlContent: parsed.data.htmlContent,
            ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
        },
    })

    return NextResponse.json({ template })
}
