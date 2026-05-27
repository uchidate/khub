import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'

export const dynamic = 'force-dynamic'

function disabledResponse() {
    return NextResponse.json(
        {
            error: 'Traducao automatica em lote desativada. Use prompts no Gemini e revise antes de aplicar.',
            href: '/admin/translations',
        },
        { status: 410 },
    )
}

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error
    return disabledResponse()
}

export async function POST() {
    const { error } = await requireAdmin()
    if (error) return error
    return disabledResponse()
}
