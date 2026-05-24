import { NextRequest, NextResponse } from 'next/server'
import { requireContributorOrAbove } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function wordCount(text: string | null): number {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireContributorOrAbove()
  if (error) return error

  const { id } = await params

  const post = await prisma.blogPost.findUnique({ where: { id }, select: { id: true } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch versions with blocks count via raw query (avoids pulling full blocks payload)
  type RawVersion = {
    id: string; savedAt: Date; note: string | null; title: string
    excerpt: string | null; contentMd: string; pinned: boolean
    label: string | null; blocksCount: bigint | null
    savedById: string; savedByName: string | null; savedByEmail: string | null
  }

  const raw = await prisma.$queryRaw<RawVersion[]>`
    SELECT
      v.id, v."savedAt", v.note, v.title, v.excerpt, v."contentMd",
      v.pinned, v.label,
      CASE WHEN v.blocks IS NOT NULL AND jsonb_typeof(v.blocks) = 'array'
           THEN jsonb_array_length(v.blocks) ELSE NULL END AS "blocksCount",
      u.id AS "savedById", u.name AS "savedByName", u.email AS "savedByEmail"
    FROM "BlogPostVersion" v
    LEFT JOIN "User" u ON u.id = v."savedById"
    WHERE v."blogPostId" = ${id}
    ORDER BY v."savedAt" DESC
  `

  const result = raw.map(v => ({
    id: v.id,
    savedAt: v.savedAt,
    note: v.note,
    title: v.title,
    excerpt: v.excerpt,
    wordCount: wordCount(v.contentMd),
    blocksCount: v.blocksCount !== null ? Number(v.blocksCount) : null,
    pinned: v.pinned,
    label: v.label,
    savedBy: { id: v.savedById, name: v.savedByName, email: v.savedByEmail },
  }))

  return NextResponse.json(result)
}
