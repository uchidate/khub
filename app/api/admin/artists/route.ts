import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import { ArtistRepository } from '@/lib/repositories/ArtistRepository'
import { toHttpError } from '@/lib/repositories/base'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const log = createLogger('ADMIN-ARTISTS')

export const dynamic = 'force-dynamic'

function getIp(req: NextRequest) {
    return req.headers.get('x-forwarded-for') ?? undefined
}

/** GET /api/admin/artists */
export async function GET(request: NextRequest) {
    try {
        const { error } = await requireAdmin()
        if (error) return error

        const { searchParams } = new URL(request.url)

        const idLookup = searchParams.get('id')
        if (idLookup) {
            const artist = await ArtistRepository.findById(idLookup)
            return NextResponse.json(artist)
        }

        const { page, limit, search, sortBy, sortOrder } = buildQueryOptions(searchParams)
        const result = await ArtistRepository.findMany({
            search,
            filter: searchParams.get('filter') ?? undefined,
            page, limit, sortBy, sortOrder,
        })

        return paginatedResponse(result.data, result.total, result.page, result.limit)
    } catch (error) {
        log.error('GET artists error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** POST /api/admin/artists */
export async function POST(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const artist = await ArtistRepository.create(
            await request.json(),
            { adminId: session!.user.id, ip: getIp(request) }
        )
        return NextResponse.json(artist, { status: 201 })
    } catch (error) {
        log.error('POST artist error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** PATCH /api/admin/artists?id=<id> | ?bulk=hide|show */
export async function PATCH(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const { searchParams } = new URL(request.url)
        const ctx = { adminId: session!.user.id, ip: getIp(request) }

        const bulk = searchParams.get('bulk')
        if (bulk === 'hide' || bulk === 'show') {
            const { ids } = await request.json()
            const result = await ArtistRepository.bulkHide(ids, bulk === 'hide', ctx)
            revalidatePath('/artists')
            return NextResponse.json(result)
        }

        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'Artist ID required' }, { status: 400 })

        const { artist, clearedAlbumsCount } = await ArtistRepository.update(id, await request.json(), ctx)

        revalidatePath(`/artists/${id}`)
        revalidatePath('/artists')
        return NextResponse.json({ ...artist, clearedAlbumsCount: clearedAlbumsCount || undefined })
    } catch (error) {
        log.error('PATCH artist error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** DELETE /api/admin/artists */
export async function DELETE(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const { ids } = z.object({ ids: z.array(z.string()) }).parse(await request.json())
        const result = await ArtistRepository.delete(ids, { adminId: session!.user.id, ip: getIp(request) })

        revalidatePath('/artists')
        return NextResponse.json({ message: `${result.count} artista(s) deletado(s)` })
    } catch (error) {
        log.error('DELETE artist error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}
