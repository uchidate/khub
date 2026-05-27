import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'

export const dynamic = 'force-dynamic'

async function disabledResponse() {
    const { error } = await requireAdmin()
    if (error) return error

    return NextResponse.json(
        {
            error: 'Geracao editorial automatica desativada. Use o prompt do Gemini na fila de artistas.',
            href: '/admin/artists/enrich',
        },
        { status: 410 },
    )
}

export async function GET() {
    return disabledResponse()
}

export async function POST() {
    return disabledResponse()
}
