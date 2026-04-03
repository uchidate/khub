import { NextRequest, NextResponse } from 'next/server'
import { requireContributorOrAbove, requireEditorOrAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string; versionId: string }> }

// GET — conteúdo completo de uma versão (para preview)
export async function GET(_request: NextRequest, { params }: Params) {
  const { error } = await requireContributorOrAbove()
  if (error) return error

  const { id, versionId } = await params

  const version = await prisma.blogPostVersion.findUnique({
    where: { id: versionId },
    include: { savedBy: { select: { id: true, name: true, email: true } } },
  })

  if (!version || version.blogPostId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(version)
}

// PATCH — atualizar pinned e/ou label
const patchSchema = z.object({
  pinned: z.boolean().optional(),
  label: z.string().max(100).optional().nullable(),
})

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error } = await requireEditorOrAdmin()
  if (error) return error

  const { id, versionId } = await params
  const body = await request.json()
  const validated = patchSchema.parse(body)

  const existing = await prisma.blogPostVersion.findUnique({
    where: { id: versionId },
    select: { id: true, blogPostId: true, pinned: true, label: true },
  })

  if (!existing || existing.blogPostId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.blogPostVersion.update({
    where: { id: versionId },
    data: {
      pinned: validated.pinned ?? existing.pinned,
      label: Object.prototype.hasOwnProperty.call(validated, 'label') ? validated.label : existing.label,
    },
  })

  return NextResponse.json(updated)
}
