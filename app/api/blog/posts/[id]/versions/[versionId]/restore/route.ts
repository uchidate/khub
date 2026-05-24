import { NextRequest, NextResponse } from 'next/server'
import { requireEditorOrAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { snapshotPost } from '@/lib/services/blog-version'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const { error, session } = await requireEditorOrAdmin()
  if (error) return error

  const { id, versionId } = await params

  const version = await prisma.blogPostVersion.findUnique({ where: { id: versionId } })
  if (!version || version.blogPostId !== id) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 })
  }

  // Snapshot do estado atual antes de restaurar
  await snapshotPost(id, {
    savedById: session!.user.id,
    note: `(auto) pre-restore para ${version.savedAt.toISOString().slice(0, 16)}`,
  })

  const updated = await prisma.blogPost.update({
    where: { id },
    data: {
      title: version.title,
      excerpt: version.excerpt,
      contentMd: version.contentMd,
      blocks: version.blocks ?? undefined,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json(updated)
}
