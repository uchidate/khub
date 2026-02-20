import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('CONTENT_PREFERENCES')

const VALID_RATINGS = new Set(['L', '10', '12', '14', '16', '18', 'null'])

/**
 * GET /api/settings/content-preferences
 * Retorna as preferências de conteúdo do usuário logado (cria com defaults se não existir)
 */
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { contentPreferences: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Buscar configurações globais para informar quais estão disponíveis
  let systemSettings = await prisma.systemSettings.findUnique({
    where: { id: 'singleton' },
  })

  if (!systemSettings) {
    systemSettings = await prisma.systemSettings.create({
      data: {
        id: 'singleton',
        allowAdultContent: false,
        allowUnclassifiedContent: false,
      },
    })
  }

  return NextResponse.json({
    preferences: user.contentPreferences,
    systemSettings: {
      allowAdultContent: systemSettings.allowAdultContent,
      allowUnclassifiedContent: systemSettings.allowUnclassifiedContent,
    },
  })
}

/**
 * PUT /api/settings/content-preferences
 * Atualiza as preferências de conteúdo do usuário (validando contra SystemSettings)
 */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { allowedRatings } = body

    // Validar que é um array
    if (!Array.isArray(allowedRatings)) {
      return NextResponse.json(
        { error: 'allowedRatings must be an array' },
        { status: 400 }
      )
    }

    // Validar que são classificações válidas
    const invalid = allowedRatings.filter((r: string) => !VALID_RATINGS.has(r))
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Classificações inválidas: ${invalid.join(', ')}` },
        { status: 400 }
      )
    }

    // Buscar configurações globais
    const systemSettings = await prisma.systemSettings.findUnique({
      where: { id: 'singleton' },
    })

    // Bloquear 18+ se admin não permitiu
    if (!systemSettings?.allowAdultContent && allowedRatings.includes('18')) {
      return NextResponse.json(
        { error: 'Conteúdo 18+ não está disponível no momento' },
        { status: 403 }
      )
    }

    // Bloquear 'null' (não classificados) se admin não permitiu
    if (!systemSettings?.allowUnclassifiedContent && allowedRatings.includes('null')) {
      return NextResponse.json(
        { error: 'Conteúdo não classificado não está disponível no momento' },
        { status: 403 }
      )
    }

    // Atualizar ou criar preferências
    const preferences = await prisma.userContentPreferences.upsert({
      where: { userId: user.id },
      update: {
        allowedRatings,
      },
      create: {
        userId: user.id,
        allowedRatings,
      },
    })

    return NextResponse.json({
      success: true,
      preferences,
    })
  } catch (error: unknown) {
    log.error('Error updating content preferences', { error: getErrorMessage(error) })
    return NextResponse.json(
      { error: 'Failed to update preferences', details: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
