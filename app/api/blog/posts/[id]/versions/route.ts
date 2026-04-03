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

  const versions = await prisma.blogPostVersion.findMany({
    where: { blogPostId: id },
    orderBy: { savedAt: 'desc' },
    select: {
      id: true,
      savedAt: true,
      note: true,
      title: true,
      excerpt: true,
      contentMd: true,
      pinned: true,
      label: true,
      savedBy: { select: { id: true, name: true, email: true } },
    },
  })

  // Adiciona wordCount e remove contentMd da resposta (evita payload grande)
  const result = versions.map(v => ({
    id: v.id,
    savedAt: v.savedAt,
    note: v.note,
    title: v.title,
    excerpt: v.excerpt,
    wordCount: wordCount(v.contentMd),
    pinned: v.pinned,
    label: v.label,
    savedBy: v.savedBy,
  }))

  return NextResponse.json(result)
}
