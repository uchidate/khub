import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import { AgencyRepository } from '@/lib/repositories/AgencyRepository'
import { toHttpError } from '@/lib/repositories/base'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ADMIN-AGENCIES')

export const dynamic = 'force-dynamic'

function getIp(req: NextRequest) {
    return req.headers.get('x-forwarded-for') ?? undefined
}

/** GET /api/admin/agencies */
export async function GET(request: NextRequest) {
    try {
        const { error } = await requireAdmin()
        if (error) return error

        const { searchParams } = new URL(request.url)

        // Subquery: artistas de uma agência específica
        const artistsFor = searchParams.get('artists')
        if (artistsFor) {
            const agency = await AgencyRepository.findById(artistsFor)
            return NextResponse.json({ agency })
        }

        const { page, limit, search, sortBy, sortOrder } = buildQueryOptions(searchParams)

        const result = await AgencyRepository.findMany({
            search,
            type: searchParams.get('type') ?? undefined,
            verifiedOnly: searchParams.get('verified') === '1',
            page, limit, sortBy, sortOrder,
        })

        return paginatedResponse(result.data, result.total, result.page, result.limit)
    } catch (error) {
        log.error('GET agencies error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** POST /api/admin/agencies */
export async function POST(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const agency = await AgencyRepository.create(
            await request.json(),
            { adminId: session!.user.id, ip: getIp(request) }
        )
        return NextResponse.json(agency, { status: 201 })
    } catch (error) {
        log.error('POST agency error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** PATCH /api/admin/agencies?id=<id> */
export async function PATCH(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const id = new URL(request.url).searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'Agency ID required' }, { status: 400 })

        const agency = await AgencyRepository.update(
            id,
            await request.json(),
            { adminId: session!.user.id, ip: getIp(request) }
        )
        return NextResponse.json(agency)
    } catch (error) {
        log.error('PATCH agency error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** DELETE /api/admin/agencies */
export async function DELETE(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const { ids } = await request.json()
        const result = await AgencyRepository.delete(
            ids,
            { adminId: session!.user.id, ip: getIp(request) }
        )
        return NextResponse.json({ message: `${result.count} agência(s) deletada(s)` })
    } catch (error) {
        log.error('DELETE agency error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}
