import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'

export const dynamic = 'force-dynamic'

export async function POST() {
    const { error } = await requireAdmin()
    if (error) return error

    return NextResponse.json(
        {
            error: 'Traducao automatica de noticias desativada. Traduza no Gemini e edite os blocos manualmente.',
        },
        { status: 410 },
    )
}
