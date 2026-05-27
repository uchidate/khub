import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'

export const dynamic = 'force-dynamic'

export async function POST() {
    const { error } = await requireAdmin()
    if (error) return error

    return NextResponse.json(
        {
            error: 'Traducao automatica desativada. Gere o texto no Gemini e aplique na tela de revisao.',
            href: '/admin/translations',
        },
        { status: 410 },
    )
}
