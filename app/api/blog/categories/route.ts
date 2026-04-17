import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const categories = await prisma.blogCategory.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { posts: { where: { status: 'PUBLISHED' } } } } },
  })
  return NextResponse.json(categories)
}
