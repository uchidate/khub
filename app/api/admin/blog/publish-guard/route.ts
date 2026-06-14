import { NextRequest, NextResponse } from 'next/server'
import { requireEditorOrAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { evaluateBlogPublishGuard, type BlogPublishGuardInput } from '@/lib/site-health/blog-guard'

export const dynamic = 'force-dynamic'

function toGuardInput(post: Awaited<ReturnType<typeof getPostForGuard>>): BlogPublishGuardInput | null {
  if (!post) return null
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    contentMd: post.contentMd,
    blocks: post.blocks,
    coverImageUrl: post.coverImageUrl,
    categoryId: post.categoryId,
    tags: post.tags,
    isPrivate: post.isPrivate,
    isSponsored: post.isSponsored,
    adsDisabled: post.adsDisabled,
    relatedCounts: {
      artists: post._count.relatedArtists,
      groups: post._count.relatedGroups,
      productions: post._count.relatedProductions,
    },
  }
}

async function getPostForGuard(id: string) {
  return prisma.blogPost.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      contentMd: true,
      blocks: true,
      coverImageUrl: true,
      categoryId: true,
      tags: true,
      isPrivate: true,
      isSponsored: true,
      adsDisabled: true,
      _count: {
        select: {
          relatedArtists: true,
          relatedGroups: true,
          relatedProductions: true,
        },
      },
    },
  })
}

export async function GET(req: NextRequest) {
  const { error } = await requireEditorOrAdmin()
  if (error) return error

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const post = await getPostForGuard(id)
  const input = toGuardInput(post)
  if (!input) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  return NextResponse.json(evaluateBlogPublishGuard(input))
}

export async function POST(req: NextRequest) {
  const { error } = await requireEditorOrAdmin()
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  return NextResponse.json(evaluateBlogPublishGuard(body as BlogPublishGuardInput))
}
