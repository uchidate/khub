import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ADMIN-GROUPS')

// Force dynamic rendering (uses auth/headers)
export const dynamic = 'force-dynamic'

const groupSchema = z.object({
  name: z.string().min(1).max(100),
  nameHangul: z.string().optional(),
  mbid: z.string().optional(),
  bio: z.string().optional(),
  profileImageUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  debutDate: z.string().optional().nullable(),
  disbandDate: z.string().optional().nullable(),
  agencyId: z.string().optional().nullable(),
})

/**
 * GET /api/admin/groups
 * List musical groups with pagination, search, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { skip, take, search, orderBy } = buildQueryOptions(searchParams)

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { nameHangul: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [groups, total] = await Promise.all([
      prisma.musicalGroup.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          agency: {
            select: { name: true },
          },
          _count: {
            select: { members: true },
          },
        },
      }),
      prisma.musicalGroup.count({ where }),
    ])

    const formattedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      nameHangul: group.nameHangul,
      mbid: group.mbid,
      profileImageUrl: group.profileImageUrl,
      debutDate: group.debutDate,
      disbandDate: group.disbandDate,
      agencyId: group.agencyId,
      agencyName: group.agency?.name ?? null,
      membersCount: group._count.members,
      createdAt: group.createdAt,
    }))

    return paginatedResponse(
      formattedGroups,
      total,
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '20')
    )
  } catch (error) {
    log.error('Get groups error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/groups
 * Create a new musical group
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const validated = groupSchema.parse(body)

    // Check if group name already exists
    const existing = await prisma.musicalGroup.findUnique({
      where: { name: validated.name },
    })

    if (existing) {
      return NextResponse.json({ error: 'Grupo musical já cadastrado' }, { status: 400 })
    }

    const { debutDate, disbandDate, agencyId, profileImageUrl, ...rest } = validated

    const group = await prisma.musicalGroup.create({
      data: {
        ...rest,
        profileImageUrl: profileImageUrl === '' ? null : profileImageUrl,
        debutDate: debutDate ? new Date(debutDate) : null,
        disbandDate: disbandDate ? new Date(disbandDate) : null,
        agencyId: agencyId === '' ? null : agencyId,
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Create group error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/groups?id=<groupId>
 * Update a musical group
 */
export async function PATCH(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('id')

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID required' }, { status: 400 })
    }

    const body = await request.json()
    const validated = groupSchema.partial().parse(body)

    // Check if group exists
    const existing = await prisma.musicalGroup.findUnique({
      where: { id: groupId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Grupo musical não encontrado' }, { status: 404 })
    }

    // If name is being updated, check for duplicates
    if (validated.name && validated.name !== existing.name) {
      const nameExists = await prisma.musicalGroup.findUnique({
        where: { name: validated.name },
      })

      if (nameExists) {
        return NextResponse.json({ error: 'Nome de grupo musical já cadastrado' }, { status: 400 })
      }
    }

    const { debutDate, disbandDate, agencyId, profileImageUrl, ...rest } = validated

    const updateData: Record<string, unknown> = { ...rest }

    if (profileImageUrl !== undefined) {
      updateData.profileImageUrl = profileImageUrl === '' ? null : profileImageUrl
    }

    if (debutDate !== undefined) {
      updateData.debutDate = debutDate ? new Date(debutDate) : null
    }

    if (disbandDate !== undefined) {
      updateData.disbandDate = disbandDate ? new Date(disbandDate) : null
    }

    if (agencyId !== undefined) {
      updateData.agencyId = agencyId === '' ? null : agencyId
    }

    const group = await prisma.musicalGroup.update({
      where: { id: groupId },
      data: updateData as Parameters<typeof prisma.musicalGroup.update>[0]['data'],
    })

    return NextResponse.json(group)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Update group error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/groups
 * Delete musical groups
 */
export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(body)

    // Check if any group has members
    const groupsWithMembers = await prisma.musicalGroup.findMany({
      where: { id: { in: ids } },
      include: {
        _count: {
          select: { members: true },
        },
      },
    })

    const hasMembers = groupsWithMembers.some((group) => group._count.members > 0)

    if (hasMembers) {
      return NextResponse.json(
        { error: 'Não é possível deletar grupos que possuem membros vinculados' },
        { status: 400 }
      )
    }

    const result = await prisma.musicalGroup.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ message: `${result.count} grupo(s) deletado(s)` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Delete groups error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
