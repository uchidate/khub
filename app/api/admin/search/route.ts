import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

export interface AdminSearchResult {
  id: string
  type: 'artist' | 'group' | 'production' | 'news'
  title: string
  subtitle?: string
  imageUrl?: string | null
  href: string
}

/**
 * GET /api/admin/search?q=...
 * Busca global no admin: artistas, grupos, produções, notícias.
 * Retorna top 5 de cada tipo.
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const [artists, groups, productions, news] = await Promise.all([
      prisma.artist.findMany({
        where: {
          OR: [
            { nameRomanized: { contains: q, mode: 'insensitive' } },
            { nameHangul: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true, isHidden: true },
        take: 5,
        orderBy: { isHidden: 'asc' },
      }),
      prisma.musicalGroup.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { nameHangul: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, nameHangul: true, profileImageUrl: true, isHidden: true },
        take: 5,
        orderBy: { isHidden: 'asc' },
      }),
      prisma.production.findMany({
        where: {
          OR: [
            { titlePt: { contains: q, mode: 'insensitive' } },
            { titleKr: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, titlePt: true, titleKr: true, type: true, year: true, imageUrl: true, isHidden: true },
        take: 5,
        orderBy: { isHidden: 'asc' },
      }),
      prisma.news.findMany({
        where: {
          title: { contains: q, mode: 'insensitive' },
        },
        select: { id: true, title: true, imageUrl: true, publishedAt: true },
        take: 5,
        orderBy: { publishedAt: 'desc' },
      }),
    ])

    const results: AdminSearchResult[] = [
      ...artists.map(a => ({
        id: a.id,
        type: 'artist' as const,
        title: a.nameRomanized,
        subtitle: a.isHidden ? `${a.nameHangul ?? ''} · Oculto` : a.nameHangul ?? undefined,
        imageUrl: a.primaryImageUrl,
        href: `/admin/artists/${a.id}`,
      })),
      ...groups.map(g => ({
        id: g.id,
        type: 'group' as const,
        title: g.name,
        subtitle: g.isHidden ? `${g.nameHangul ?? ''} · Oculto` : g.nameHangul ?? undefined,
        imageUrl: g.profileImageUrl,
        href: `/admin/groups/${g.id}`,
      })),
      ...productions.map(p => ({
        id: p.id,
        type: 'production' as const,
        title: p.titlePt,
        subtitle: p.isHidden ? `${p.type} · ${p.year} · Oculto` : `${p.type} · ${p.year}`,
        imageUrl: p.imageUrl,
        href: `/admin/productions/${p.id}`,
      })),
      ...news.map(n => ({
        id: n.id,
        type: 'news' as const,
        title: n.title,
        subtitle: new Date(n.publishedAt).toLocaleDateString('pt-BR'),
        imageUrl: n.imageUrl,
        href: `/admin/news/${n.id}`,
      })),
    ]

    return NextResponse.json({ results })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
