import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  ExternalMusicEntityType,
  ExternalMusicMatchStatus,
  MusicCatalogArtistKind,
} from '@prisma/client'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const LinkSchema = z.object({
  externalId: z.string().min(1),
  url: z.string().url(),
})

async function getSpotifyPlatformId() {
  const platform = await prisma.streamingPlatform.upsert({
    where: { slug: 'spotify' },
    update: { name: 'Spotify' },
    create: { slug: 'spotify', name: 'Spotify' },
    select: { id: true },
  })
  return platform.id
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const link = await prisma.externalMusicEntity.findFirst({
    where: {
      entityType: ExternalMusicEntityType.ARTIST,
      musicCatalogArtist: { groupId: id },
      platform: { slug: 'spotify' },
    },
    select: {
      externalId: true,
      url: true,
      matchStatus: true,
      matchedAt: true,
    },
  })

  return NextResponse.json({ link })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const parsed = LinkSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const group = await prisma.musicalGroup.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  })
  if (!group) {
    return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
  }

  const musicArtist = await prisma.musicCatalogArtist.upsert({
    where: { groupId: id },
    update: {
      kind: MusicCatalogArtistKind.GROUP,
      canonicalName: group.name,
    },
    create: {
      kind: MusicCatalogArtistKind.GROUP,
      canonicalName: group.name,
      groupId: id,
    },
    select: { id: true },
  })
  const platformId = await getSpotifyPlatformId()

  await prisma.externalMusicEntity.deleteMany({
    where: {
      platformId,
      entityType: ExternalMusicEntityType.ARTIST,
      musicCatalogArtistId: musicArtist.id,
    },
  })

  const link = await prisma.externalMusicEntity.upsert({
    where: {
      platformId_entityType_externalId: {
        platformId,
        entityType: ExternalMusicEntityType.ARTIST,
        externalId: parsed.data.externalId,
      },
    },
    update: {
      url: parsed.data.url,
      musicCatalogArtistId: musicArtist.id,
      matchStatus: ExternalMusicMatchStatus.MANUAL_VERIFIED,
      source: 'spotify_api',
      confidence: 1,
      matchedAt: new Date(),
    },
    create: {
      platformId,
      entityType: ExternalMusicEntityType.ARTIST,
      externalId: parsed.data.externalId,
      url: parsed.data.url,
      musicCatalogArtistId: musicArtist.id,
      matchStatus: ExternalMusicMatchStatus.MANUAL_VERIFIED,
      source: 'spotify_api',
      confidence: 1,
      matchedAt: new Date(),
    },
    select: {
      externalId: true,
      url: true,
      matchStatus: true,
      matchedAt: true,
    },
  })

  revalidatePath(`/groups/${group.slug ?? group.id}`)
  return NextResponse.json({ ok: true, link })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  await prisma.externalMusicEntity.deleteMany({
    where: {
      entityType: ExternalMusicEntityType.ARTIST,
      musicCatalogArtist: { groupId: id },
      platform: { slug: 'spotify' },
    },
  })

  return NextResponse.json({ ok: true })
}
