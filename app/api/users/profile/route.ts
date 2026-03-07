import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getErrorMessage } from '@/lib/utils/error'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('USER-PROFILE')

export const dynamic = 'force-dynamic'

const profileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    bio: z.string().max(300).optional().nullable(),
})

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const validated = profileSchema.parse(body)

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: validated,
            select: { id: true, name: true, bio: true, image: true, email: true },
        })

        return NextResponse.json(user)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        log.error('Update profile error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
