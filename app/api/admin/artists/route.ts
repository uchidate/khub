import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

function handlePrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const field = (error.meta?.target as string[] | undefined)?.[0] ?? 'campo'
    return NextResponse.json({ error: `Já existe um artista com este ${field === 'nameRomanized' ? 'nome romanizado' : field}` }, { status: 409 })
  }
  return null
}

const log = createLogger('ADMIN-ARTISTS')

// Force dynamic rendering (uses auth/headers)
export const dynamic = 'force-dynamic'


const artistSchema = z.object({
  nameRomanized: z.string().min(1),
  nameHangul: z.string().optional(),
  birthDate: z.string().optional(),              // ISO date string, camelCase
  birthName: z.string().optional(),
  stageNames: z.array(z.string()).optional(),    // array de nomes artísticos
  roles: z.array(z.string()).optional(),         // ex: ['IDOL', 'ACTOR']
  height: z.string().optional(),
  bloodType: z.string().optional(),
  zodiacSign: z.string().optional(),
  bio: z.string().optional(),
  primaryImageUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),  // JSON: { instagram: "...", etc }
  tmdbId: z.string().optional(),
  mbid: z.string().optional(),                  // MusicBrainz artist ID
  agencyId: z.string().optional(),
  musicalGroupId: z.string().optional(),         // '' = remove from group, id = add/update membership
  isHidden: z.boolean().optional(),             // Ocultar/restaurar visibilidade pública
})

/**
 * GET /api/admin/artists
 * List artists with pagination, search, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)

    // Single-artist lookup: GET /api/admin/artists?id=<artistId>
    const idLookup = searchParams.get('id')
    if (idLookup) {
      const artist = await prisma.artist.findUnique({
        where: { id: idLookup },
        select: {
          id: true,
          nameRomanized: true,
          nameHangul: true,
          stageNames: true,
          primaryImageUrl: true,
          birthDate: true,
          placeOfBirth: true,
          gender: true,
          roles: true,
          bio: true,
          discographySyncAt: true,
          tmdbId: true,
          mbid: true,
        },
      })
      if (!artist) return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })
      return NextResponse.json(artist)
    }

    const { skip, take, search, orderBy } = buildQueryOptions(searchParams)

    const filter = searchParams.get('filter')
    // Supported filters (all exclude flaggedAsNonKorean unless the filter IS flagged):
    //   no_hangul              — nameHangul null
    //   no_hangul_pending      — nameHangul null + tmdbId set + hangulSyncAt null (never tried)
    //   no_hangul_attempted    — nameHangul null + tmdbId set + hangulSyncAt set (tried, not found)
    //   no_hangul_no_tmdb      — nameHangul null + tmdbId null
    //   no_photo               — primaryImageUrl null
    //   no_photo_pending       — primaryImageUrl null + tmdbId set + photoSyncAt null (never tried)
    //   no_photo_attempted     — primaryImageUrl null + tmdbId set + photoSyncAt set (tried, not found)
    //   no_photo_no_tmdb       — primaryImageUrl null + tmdbId null
    //   no_social              — never synced (socialLinksUpdatedAt null)
    //   no_social_pending      — same as no_social
    //   no_social_attempted    — tried but nothing found (updatedAt set, socialLinks null)
    //   flagged                — flaggedAsNonKorean true
    //   korean_no_tmdb         — nameRomanized contém Hangul E sem tmdbId (via raw regex)

    const active = { flaggedAsNonKorean: false } as const

    // korean_no_tmdb requer regex SQL — busca IDs via raw e usa como filtro IN
    let koreanNoTmdbIds: string[] | null = null
    if (filter === 'korean_no_tmdb') {
      const raw = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Artist"
        WHERE "flaggedAsNonKorean" = false
          AND "tmdbId" IS NULL
          AND "nameRomanized" ~ E'[\\uAC00-\\uD7AF\\u3131-\\u314E\\u314F-\\u3163]'
        ORDER BY "trendingScore" DESC
      `
      koreanNoTmdbIds = raw.map(r => r.id)
    }

    const filterWhere = koreanNoTmdbIds !== null
      ? { id: { in: koreanNoTmdbIds } }
      : filter === 'no_hangul'           ? { ...active, nameHangul: null }
      : filter === 'no_hangul_pending'   ? { ...active, nameHangul: null, tmdbId: { not: null }, hangulSyncAt: null }
      : filter === 'no_hangul_attempted' ? { ...active, nameHangul: null, tmdbId: { not: null }, hangulSyncAt: { not: null } }
      : filter === 'no_hangul_no_tmdb'   ? { ...active, nameHangul: null, tmdbId: null }
      : filter === 'no_photo'            ? { ...active, primaryImageUrl: null }
      : filter === 'no_photo_pending'    ? { ...active, primaryImageUrl: null, tmdbId: { not: null }, photoSyncAt: null }
      : filter === 'no_photo_attempted'  ? { ...active, primaryImageUrl: null, tmdbId: { not: null }, photoSyncAt: { not: null } }
      : filter === 'no_photo_no_tmdb'    ? { ...active, primaryImageUrl: null, tmdbId: null }
      : filter === 'no_social' || filter === 'no_social_pending'
                                         ? { ...active, socialLinksUpdatedAt: null }
      : filter === 'no_social_attempted' ? { ...active, socialLinksUpdatedAt: { not: null }, socialLinks: { equals: Prisma.DbNull } }
      : filter === 'flagged'             ? { flaggedAsNonKorean: true }
      : filter === 'with_group'          ? { ...active, memberships: { some: { isActive: true } } }
      : filter === 'no_group'            ? { ...active, memberships: { none: { isActive: true } } }
      : filter === 'no_group_unsynced'   ? { ...active, memberships: { none: { isActive: true } }, groupSyncAt: null }
      : filter === 'no_group_solo'       ? { ...active, memberships: { none: { isActive: true } }, groupSyncAt: { not: null } }
      : {}

    const searchWhere = search
      ? {
          OR: [
            { nameRomanized: { contains: search, mode: 'insensitive' as const } },
            { nameHangul: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const where = search
      ? { AND: [filterWhere, searchWhere] }
      : filterWhere

    const [artists, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          agency: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              productions: true,
              albums: true,
            },
          },
          memberships: {
            where: { isActive: true },
            include: { group: { select: { id: true, name: true } } },
            take: 1,
          },
        },
      }),
      prisma.artist.count({ where }),
    ])

    const formattedArtists = artists.map((artist: {
      _count: { productions: number; albums: number }
      agency: { id: string; name: string } | null
      memberships: { group: { id: string; name: string } }[]
      [key: string]: unknown
    }) => ({
      ...artist,
      productionsCount: artist._count.productions,
      albumsCount: artist._count.albums,
      agencyName: artist.agency?.name,
      musicalGroupName: artist.memberships?.[0]?.group.name ?? null,
      musicalGroupId: artist.memberships?.[0]?.group.id ?? null,
    }))

    return paginatedResponse(
      formattedArtists,
      total,
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '20')
    )
  } catch (error) {
    log.error('Get artists error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/artists
 * Create a new artist
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const validated = artistSchema.parse(body)

    // Convert date strings to Date objects; empty string → null for nullable fields
    const data: Record<string, unknown> = { ...validated }
    if (validated.birthDate === '' || validated.birthDate === undefined) {
      data.birthDate = null
    } else {
      data.birthDate = new Date(validated.birthDate)
    }
    if (validated.primaryImageUrl === '' || validated.primaryImageUrl === null) {
      data.primaryImageUrl = null
    }
    if (validated.nameHangul === '') data.nameHangul = null

    const artist = await prisma.artist.create({
      data: data as any,
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(artist, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    const prismaError = handlePrismaError(error)
    if (prismaError) return prismaError
    log.error('Create artist error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/artists?id=<artistId>
 * Update an artist
 */
export async function PATCH(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get('id')

    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID required' }, { status: 400 })
    }

    const body = await request.json()
    const validated = artistSchema.partial().parse(body)

    // Extract musicalGroupId before passing to artist update
    const { musicalGroupId, ...artistFields } = validated

    // Convert date strings to Date objects; empty string → null for nullable fields
    const data: Record<string, unknown> = { ...artistFields }
    if (validated.birthDate === '' || validated.birthDate === undefined) {
      data.birthDate = null
    } else {
      data.birthDate = new Date(validated.birthDate)
    }
    if (validated.primaryImageUrl === '' || validated.primaryImageUrl === null) {
      data.primaryImageUrl = null
    }
    if (validated.nameHangul === '') data.nameHangul = null
    if (validated.tmdbId === '') data.tmdbId = null
    if (validated.mbid === '') {
      data.mbid = null
      // Reset sync timestamp so artist is re-queued for discography sync
      data.discographySyncAt = null
    }

    // If mbid is being cleared, also delete all albums (they may be orphaned)
    let clearedAlbumsCount = 0
    if (validated.mbid === '') {
      const deleted = await prisma.album.deleteMany({ where: { artistId } })
      clearedAlbumsCount = deleted.count
    }

    const artist = await prisma.artist.update({
      where: { id: artistId },
      data: data as any,
      include: {
        agency: { select: { id: true, name: true } },
      },
    })

    // Handle group membership separately (not part of Artist model)
    if (musicalGroupId !== undefined) {
      if (musicalGroupId === '' || musicalGroupId === null) {
        // Remove from all groups
        await prisma.artistGroupMembership.deleteMany({ where: { artistId } })
      } else {
        // Upsert membership — set isActive, clear leaveDate
        await prisma.artistGroupMembership.upsert({
          where: { artistId_groupId: { artistId, groupId: musicalGroupId } },
          create: { artistId, groupId: musicalGroupId, isActive: true },
          update: { isActive: true, leaveDate: null },
        })
        // Deactivate any other group membership (artist can be in multiple groups but we simplify to 1 active)
        await prisma.artistGroupMembership.updateMany({
          where: { artistId, groupId: { not: musicalGroupId } },
          data: { isActive: false },
        })
      }
    }

    return NextResponse.json({ ...artist, clearedAlbumsCount: clearedAlbumsCount || undefined })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    const prismaError = handlePrismaError(error)
    if (prismaError) return prismaError
    log.error('Update artist error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/artists
 * Delete artists
 */
export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(body)

    const result = await prisma.artist.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ message: `${result.count} artista(s) deletado(s)` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Delete artists error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
