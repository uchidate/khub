import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Endpoint temporário para exportar notícia sem autenticação
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const news = await prisma.news.findUnique({
    where: { id },
    include: {
      artists: {
        include: {
          artist: { select: { id: true, nameRomanized: true, primaryImageUrl: true } },
        },
      },
    },
  });
  if (!news) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(news);
}
