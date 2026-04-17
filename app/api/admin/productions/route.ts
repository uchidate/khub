import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import { ProductionRepository } from '@/lib/repositories/ProductionRepository'
import { toHttpError } from '@/lib/repositories/base'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { revalidatePath } from 'next/cache'
import { getArtistVisibilityService } from '@/lib/services/artist-visibility-service'
import { z } from 'zod'

const log = createLogger('ADMIN-PRODUCTIONS')

export const dynamic = 'force-dynamic'

function getIp(req: NextRequest) {
    return req.headers.get('x-forwarded-for') ?? undefined
}

/** GET /api/admin/productions */
export async function GET(request: NextRequest) {
    try {
        const { error } = await requireAdmin()
        if (error) return error

        const { searchParams } = new URL(request.url)

        const idLookup = searchParams.get('id')
        if (idLookup) {
            const production = await ProductionRepository.findById(idLookup)
            return NextResponse.json(production)
        }

        const { page, limit, search, sortBy, sortOrder } = buildQueryOptions(searchParams)
        const result = await ProductionRepository.findMany({
            search,
            filter: searchParams.get('filter') ?? undefined,
            page, limit, sortBy, sortOrder,
        })

        return paginatedResponse(result.data, result.total, result.page, result.limit)
    } catch (error) {
        log.error('GET productions error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** POST /api/admin/productions */
export async function POST(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const production = await ProductionRepository.create(
            await request.json(),
            { adminId: session!.user.id, ip: getIp(request) }
        )
        return NextResponse.json(production, { status: 201 })
    } catch (error) {
        log.error('POST production error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** PATCH /api/admin/productions?id=<id> */
export async function PATCH(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'Production ID required' }, { status: 400 })

        const { production, visibilityChanged, linkedArtistIds } = await ProductionRepository.update(
            id,
            await request.json(),
            { adminId: session!.user.id, ip: getIp(request) }
        )

        revalidatePath(`/productions/${id}`)
        if (visibilityChanged) {
            revalidatePath('/productions', 'layout')
            if (linkedArtistIds.length > 0) {
                void getArtistVisibilityService()
                    .evaluateMany(linkedArtistIds)
                    .catch(() => {})
            }
        }

        return NextResponse.json(production)
    } catch (error) {
        log.error('PATCH production error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** DELETE /api/admin/productions */
export async function DELETE(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const { ids } = z.object({ ids: z.array(z.string()) }).parse(await request.json())
        const result = await ProductionRepository.delete(ids, { adminId: session!.user.id, ip: getIp(request) })

        return NextResponse.json({ message: `${result.count} produção(ões) deletada(s)` })
    } catch (error) {
        log.error('DELETE productions error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}
