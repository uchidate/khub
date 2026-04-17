import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireApiKeyAuth } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/internal/news/[id]
 * Retorna todos os dados da notícia para uso interno (protegido por API key)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiKeyAuth(req);
  if (auth.error) return auth.error;

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
