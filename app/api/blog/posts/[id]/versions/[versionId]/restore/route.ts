import { NextRequest, NextResponse } from 'next/server'
import { requireEditorOrAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const { error, session } = await requireEditorOrAdmin()
  if (error) return error

  const { id, versionId } = await params

  const version = await prisma.blogPostVersion.findUnique({
    where: { id: versionId },
  })

  if (!version || version.blogPostId !== id) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 })
  }

  // Salva o estado atual como nova versão antes de restaurar
  const current = await prisma.blogPost.findUnique({
    where: { id },
    select: { title: true, excerpt: true, contentMd: true, blocks: true },
  })

  if (!current) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const [updated] = await prisma.$transaction([
    prisma.blogPost.update({
      where: { id },
      data: {
        title: version.title,
        excerpt: version.excerpt,
        contentMd: version.contentMd,
        blocks: version.blocks ?? undefined,
        updatedAt: new Date(),
      },
    }),
    // snapshot do estado atual como "pré-restauração"
    prisma.blogPostVersion.create({
      data: {
        blogPostId: id,
        title: current.title,
        excerpt: current.excerpt,
        contentMd: current.contentMd,
        blocks: current.blocks as object ?? undefined,
        savedById: session!.user.id,
        note: `(auto) antes de restaurar para versão ${version.savedAt.toISOString().slice(0, 16)}`,
      },
    }),
  ])

  return NextResponse.json(updated)
}
