import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).optional().default('user'),
})

/**
 * GET /api/admin/users
 * List users with pagination, search, and sorting
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - search: string (search by name or email)
 * - sortBy: string (default: createdAt)
 * - sortOrder: 'asc' | 'desc' (default: desc)
 *
 * Auth: Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { skip, take, search, orderBy } = buildQueryOptions(searchParams)

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // Fetch users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              favorites: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    // Format response
    const formattedUsers = users.map((user) => ({
      ...user,
      favoritesCount: user._count.favorites,
    }))

    return paginatedResponse(
      formattedUsers,
      total,
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '20')
    )
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 *
 * Body:
 * - name: string
 * - email: string
 * - role?: 'user' | 'admin'
 *
 * Auth: Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const validated = userSchema.parse(body)

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        role: validated.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/users?id=<userId>
 * Update a user
 *
 * Body:
 * - name?: string
 * - email?: string
 * - role?: 'user' | 'admin'
 *
 * Auth: Admin only
 */
export async function PATCH(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const body = await request.json()
    const validated = userSchema.partial().parse(body)

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // If email is being updated, check for duplicates
    if (validated.email && validated.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validated.email },
      })

      if (emailExists) {
        return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: validated,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/users
 * Delete users
 *
 * Body:
 * - ids: string[]
 *
 * Auth: Admin only
 */
export async function DELETE(request: NextRequest) {
  try {
    const { error, session } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(body)

    // Prevent self-deletion
    if (ids.includes(session!.user.id)) {
      return NextResponse.json({ error: 'Você não pode deletar sua própria conta' }, { status: 400 })
    }

    // Delete users
    const result = await prisma.user.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ message: `${result.count} usuário(s) deletado(s)` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    console.error('Delete users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
