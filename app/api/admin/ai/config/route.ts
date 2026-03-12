import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllAiConfigs, upsertAiConfig } from '@/lib/services/ai-config-service'
import { PROVIDER_CONFIGS } from '@/lib/ai/ai-config'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    const configs    = await getAllAiConfigs()
    const providers  = Object.keys(PROVIDER_CONFIGS)
    return NextResponse.json({ configs, providers })
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { feature, preferredProvider, enabled, monthlyBudgetUsd, notes } = body

    if (!feature || typeof feature !== 'string') {
        return NextResponse.json({ error: 'feature obrigatório' }, { status: 400 })
    }

    const config = await upsertAiConfig(feature, {
        preferredProvider: preferredProvider ?? null,
        enabled:           enabled !== undefined ? Boolean(enabled) : undefined,
        monthlyBudgetUsd:  monthlyBudgetUsd !== undefined ? (monthlyBudgetUsd ? Number(monthlyBudgetUsd) : null) : undefined,
        notes:             notes ?? null,
        updatedBy:         session.user?.email ?? 'admin',
    })

    return NextResponse.json(config)
}
