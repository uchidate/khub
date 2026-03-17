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
        maintenanceMode: false,
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
      allowAdultContent?: boolean
      allowUnclassifiedContent?: boolean
      maintenanceMode?: boolean
    }

    const data: Record<string, boolean> = {}
    if (typeof body.allowAdultContent === 'boolean') data.allowAdultContent = body.allowAdultContent
    if (typeof body.allowUnclassifiedContent === 'boolean') data.allowUnclassifiedContent = body.allowUnclassifiedContent
    if (typeof body.maintenanceMode === 'boolean') data.maintenanceMode = body.maintenanceMode

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'singleton' },
      update: data,
      create: {
        id: 'singleton',
        allowAdultContent: false,
        allowUnclassifiedContent: false,
        maintenanceMode: false,
        ...data,
      },
    })

    revalidateTag('system-settings', { expire: 0 })
    return NextResponse.json({ success: true, settings })
  } catch (err) {
    console.error('Error updating content settings:', err)
    return NextResponse.json({ error: 'Falha ao atualizar configurações' }, { status: 500 })
  }
}
