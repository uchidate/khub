import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

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
    }

    // Validação
    if (typeof body.allowAdultContent !== 'boolean' ||
        typeof body.allowUnclassifiedContent !== 'boolean') {
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
      },
      create: {
        id: 'singleton',
        allowAdultContent: body.allowAdultContent,
        allowUnclassifiedContent: body.allowUnclassifiedContent,
      },
    })

    return NextResponse.json({ success: true, settings })
  } catch (err) {
    console.error('Error updating content settings:', err)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
