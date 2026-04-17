import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getTMDBArtistService } from '@/lib/services/tmdb-artist-service'
import { getErrorMessage } from '@/lib/utils/error'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
const IS_KOREAN = /[\u3131-\uD79D]/

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { tmdbId, kpoppingIdolId } = body

  if (!tmdbId || !kpoppingIdolId) {
    return NextResponse.json(
      { error: 'tmdbId e kpoppingIdolId são obrigatórios' },
      { status: 400 }
    )
  }

  try {
    const tmdbService = getTMDBArtistService()

    // Check if artist already exists by tmdbId
    let artist = await prisma.artist.findUnique({
      where: { tmdbId: String(tmdbId) },
    })
    let created = false

    if (!artist) {
      // Fetch full details from TMDB
      const details = await tmdbService.getPersonDetails(Number(tmdbId))
      if (!details) {
        return NextResponse.json(
          { error: 'Não foi possível obter dados do TMDB' },
          { status: 502 }
        )
      }

      // Check by name to avoid duplicates
      const existingByName = await prisma.artist.findFirst({
        where: { nameRomanized: { equals: details.name, mode: 'insensitive' } },
      })

      if (existingByName) {
        // Just link the tmdbId if missing
        artist = await prisma.artist.update({
          where: { id: existingByName.id },
          data: { tmdbId: String(tmdbId) },
        })
      } else {
        // Extract Korean name from also_known_as
        let nameHangul: string | undefined
        for (const aka of details.also_known_as || []) {
          if (IS_KOREAN.test(aka)) {
            nameHangul = aka
            break
          }
        }

        // Determine roles
        const roles: string[] = []
        const bio = details.biography?.toLowerCase() || ''
        if (details.known_for_department === 'Acting') roles.push('ATOR')
        if (bio.includes('singer') || bio.includes('k-pop') || bio.includes('idol') || bio.includes('cantor')) {
          roles.push('CANTOR')
        }
        if (bio.includes('model') || bio.includes('modelo')) roles.push('MODELO')
        if (roles.length === 0) roles.push('ATOR')

        artist = await prisma.artist.create({
          data: {
            nameRomanized: details.name,
            nameHangul: nameHangul ?? null,
            birthDate: details.birthday ? new Date(details.birthday) : null,
            primaryImageUrl: details.profile_path
              ? `${TMDB_IMAGE_BASE}${details.profile_path}`
              : null,
            bio: details.biography || null,
            tmdbId: String(tmdbId),
            tmdbSyncStatus: 'SYNCED',
            tmdbLastSync: new Date(),
            roles,
            gender: details.gender ?? null,
            stageNames: [],
            placeOfBirth: details.place_of_birth || null,
          },
        })
        created = true
      }
    }

    // Confirm the idol mapping for all suggestions with this kpoppingIdolId
    const { count } = await prisma.kpoppingMembershipSuggestion.updateMany({
      where: { kpoppingIdolId },
      data: {
        artistId: artist.id,
        artistMatchReason: 'user_confirmed',
        artistMatchScore: 1.0,
      },
    })

    return NextResponse.json({
      ok: true,
      artist: {
        id: artist.id,
        nameRomanized: artist.nameRomanized,
        nameHangul: artist.nameHangul,
        primaryImageUrl: artist.primaryImageUrl,
      },
      created,
      updated: count,
    })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
