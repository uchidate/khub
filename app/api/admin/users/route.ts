import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import { UserRepository } from '@/lib/repositories/UserRepository'
import { toHttpError } from '@/lib/repositories/base'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { z } from 'zod'

const log = createLogger('ADMIN-USERS')

export const dynamic = 'force-dynamic'

function getIp(req: NextRequest) {
    return req.headers.get('x-forwarded-for') ?? undefined
}

/** GET /api/admin/users */
export async function GET(request: NextRequest) {
    try {
        const { error } = await requireAdmin()
        if (error) return error

        const { searchParams } = new URL(request.url)

        if (searchParams.get('stats') === '1') {
            const stats = await UserRepository.stats()
            return NextResponse.json(stats)
        }

        const { page, limit, search, sortBy, sortOrder } = buildQueryOptions(searchParams)
        const result = await UserRepository.findMany({
            search,
            role: searchParams.get('role') ?? undefined,
            page, limit, sortBy, sortOrder,
        })

        return paginatedResponse(result.data, result.total, result.page, result.limit)
    } catch (error) {
        log.error('GET users error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** POST /api/admin/users */
export async function POST(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const user = await UserRepository.create(
            await request.json(),
            { adminId: session!.user.id, ip: getIp(request) }
        )
        return NextResponse.json(user, { status: 201 })
    } catch (error) {
        log.error('POST user error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** PATCH /api/admin/users?id=<id> */
export async function PATCH(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

        const user = await UserRepository.update(
            id,
            await request.json(),
            { adminId: session!.user.id, ip: getIp(request) }
        )
        return NextResponse.json(user)
    } catch (error) {
        log.error('PATCH user error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** DELETE /api/admin/users */
export async function DELETE(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const { ids } = z.object({ ids: z.array(z.string()) }).parse(await request.json())
        const result = await UserRepository.delete(ids, session!.user.id, { adminId: session!.user.id, ip: getIp(request) })

        return NextResponse.json({ message: `${result.count} usuário(s) deletado(s)` })
    } catch (error) {
        log.error('DELETE users error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}
