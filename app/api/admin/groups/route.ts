import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import { MusicalGroupRepository } from '@/lib/repositories/MusicalGroupRepository'
import { toHttpError } from '@/lib/repositories/base'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const log = createLogger('ADMIN-GROUPS')

export const dynamic = 'force-dynamic'

function getIp(req: NextRequest) {
    return req.headers.get('x-forwarded-for') ?? undefined
}

/** GET /api/admin/groups */
export async function GET(request: NextRequest) {
    try {
        const { error } = await requireAdmin()
        if (error) return error

        const { searchParams } = new URL(request.url)

        const idLookup = searchParams.get('id')
        if (idLookup) {
            const group = await MusicalGroupRepository.findById(idLookup)
            return NextResponse.json(group)
        }

        if (searchParams.get('stats') === '1') {
            const stats = await MusicalGroupRepository.stats()
            return NextResponse.json(stats)
        }

        const { page, limit, search, sortBy, sortOrder } = buildQueryOptions(searchParams)
        const result = await MusicalGroupRepository.findMany({
            search,
            status: searchParams.get('status') ?? undefined,
            page, limit, sortBy, sortOrder,
        })

        return paginatedResponse(result.data, result.total, result.page, result.limit)
    } catch (error) {
        log.error('GET groups error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** POST /api/admin/groups */
export async function POST(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const group = await MusicalGroupRepository.create(
            await request.json(),
            { adminId: session!.user.id, ip: getIp(request) }
        )
        return NextResponse.json(group, { status: 201 })
    } catch (error) {
        log.error('POST group error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** PATCH /api/admin/groups?id=<id> */
export async function PATCH(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'Group ID required' }, { status: 400 })

        const group = await MusicalGroupRepository.update(
            id,
            await request.json(),
            { adminId: session!.user.id, ip: getIp(request) }
        )

        revalidatePath(`/groups/${id}`)
        revalidatePath('/groups')
        return NextResponse.json(group)
    } catch (error) {
        log.error('PATCH group error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** DELETE /api/admin/groups */
export async function DELETE(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const { ids } = z.object({ ids: z.array(z.string()) }).parse(await request.json())
        const result = await MusicalGroupRepository.delete(ids, { adminId: session!.user.id, ip: getIp(request) })

        revalidatePath('/groups')
        return NextResponse.json({ message: `${result.count} grupo(s) deletado(s)` })
    } catch (error) {
        log.error('DELETE groups error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}
