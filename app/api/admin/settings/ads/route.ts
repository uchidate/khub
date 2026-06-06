import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEFAULTS = {
    adsGloballyPaused:   false,
    adsMultiplexEnabled: true,
    adsSidebarEnabled:   true,
    adsAutoAdsEnabled:   true,
}

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    let settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } })
    if (!settings) {
        settings = await prisma.systemSettings.create({ data: { id: 'singleton' } })
    }

    return NextResponse.json({
        adsGloballyPaused:   settings.adsGloballyPaused   ?? DEFAULTS.adsGloballyPaused,
        adsMultiplexEnabled: settings.adsMultiplexEnabled ?? DEFAULTS.adsMultiplexEnabled,
        adsSidebarEnabled:   settings.adsSidebarEnabled   ?? DEFAULTS.adsSidebarEnabled,
        adsAutoAdsEnabled:   settings.adsAutoAdsEnabled   ?? DEFAULTS.adsAutoAdsEnabled,
    })
}

export async function PATCH(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await req.json().catch(() => ({}))
    const allowed = ['adsGloballyPaused', 'adsMultiplexEnabled', 'adsSidebarEnabled', 'adsAutoAdsEnabled']
    const data: Record<string, boolean> = {}
    for (const key of allowed) {
        if (typeof body[key] === 'boolean') data[key] = body[key]
    }

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: 'Nenhum campo válido enviado' }, { status: 400 })
    }

    const settings = await prisma.systemSettings.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', ...data },
        update: data,
    })

    return NextResponse.json({
        adsGloballyPaused:   settings.adsGloballyPaused,
        adsMultiplexEnabled: settings.adsMultiplexEnabled,
        adsSidebarEnabled:   settings.adsSidebarEnabled,
        adsAutoAdsEnabled:   settings.adsAutoAdsEnabled,
    })
}
