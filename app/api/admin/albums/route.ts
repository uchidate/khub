import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import { AlbumRepository } from '@/lib/repositories/AlbumRepository'
import { toHttpError } from '@/lib/repositories/base'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { z } from 'zod'

const log = createLogger('ADMIN-ALBUMS')

export const dynamic = 'force-dynamic'

function getIp(req: NextRequest) {
    return req.headers.get('x-forwarded-for') ?? undefined
}

/** GET /api/admin/albums */
export async function GET(request: NextRequest) {
    try {
        const { error } = await requireAdmin()
        if (error) return error

        const { searchParams } = new URL(request.url)

        const idLookup = searchParams.get('id')
        if (idLookup) {
            const album = await AlbumRepository.findById(idLookup)
            return NextResponse.json(album)
        }

        const { page, limit, search, sortBy, sortOrder } = buildQueryOptions(searchParams)
        const result = await AlbumRepository.findMany({
            search,
            artistId: searchParams.get('artistId') ?? undefined,
            page, limit, sortBy, sortOrder,
        })

        return paginatedResponse(result.data, result.total, result.page, result.limit)
    } catch (error) {
        log.error('GET albums error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** POST /api/admin/albums */
export async function POST(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const album = await AlbumRepository.create(
            await request.json(),
            { adminId: session!.user.id, ip: getIp(request) }
        )
        return NextResponse.json(album, { status: 201 })
    } catch (error) {
        log.error('POST album error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** PATCH /api/admin/albums?id=<id> */
export async function PATCH(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'Album ID required' }, { status: 400 })

        const album = await AlbumRepository.update(
            id,
            await request.json(),
            { adminId: session!.user.id, ip: getIp(request) }
        )
        return NextResponse.json(album)
    } catch (error) {
        log.error('PATCH album error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}

/** DELETE /api/admin/albums */
export async function DELETE(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error) return error

        const { ids } = z.object({ ids: z.array(z.string()) }).parse(await request.json())
        const result = await AlbumRepository.delete(ids, { adminId: session!.user.id, ip: getIp(request) })

        return NextResponse.json({ message: `${result.count} álbum(ns) deletado(s)` })
    } catch (error) {
        log.error('DELETE albums error', { error: getErrorMessage(error) })
        return toHttpError(error)
    }
}
