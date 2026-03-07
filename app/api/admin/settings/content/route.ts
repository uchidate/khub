import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { revalidateTag } from 'next/cache'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/settings/content
 * Retorna as configurações globais de conteúdo (cria com defaults se não existir)
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  let settings = await prisma.systemSettings.findUnique({
    where: { id: 'singleton' },
  })

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        id: 'singleton',
        allowAdultContent: false,
        allowUnclassifiedContent: false,
        betaMode: true,
        premiumEnabled: false,
      },
    })
  }

  return NextResponse.json({ settings })
}

/**
 * PUT /api/admin/settings/content
 * Atualiza as configurações globais de conteúdo
 */
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json() as {
      allowAdultContent: boolean
      allowUnclassifiedContent: boolean
      betaMode: boolean
      premiumEnabled: boolean
    }

    // Validação
    if (typeof body.allowAdultContent !== 'boolean' ||
        typeof body.allowUnclassifiedContent !== 'boolean' ||
        typeof body.betaMode !== 'boolean' ||
        typeof body.premiumEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      )
    }

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'singleton' },
      update: {
        allowAdultContent: body.allowAdultContent,
        allowUnclassifiedContent: body.allowUnclassifiedContent,
        betaMode: body.betaMode,
        premiumEnabled: body.premiumEnabled,
      },
      create: {
        id: 'singleton',
        allowAdultContent: body.allowAdultContent,
        allowUnclassifiedContent: body.allowUnclassifiedContent,
        betaMode: body.betaMode,
        premiumEnabled: body.premiumEnabled,
      },
    })

    revalidateTag('system-settings', { expire: 0 })
    return NextResponse.json({ success: true, settings })
  } catch (err) {
    console.error('Error updating content settings:', err)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
