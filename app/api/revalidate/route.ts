import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

/**
 * GET /api/revalidate?path=/artists/jung-kook&secret=TOKEN
 * Invalida o full route cache (in-memory + disco) para um path específico.
 * Necessário para artistas pré-renderizados via generateStaticParams onde
 * deletar os arquivos .rsc/.html não é suficiente.
 */
export async function GET(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get('secret')
    const path = req.nextUrl.searchParams.get('path')

    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!path) {
        return NextResponse.json({ error: 'path is required' }, { status: 400 })
    }

    revalidatePath(path)
    return NextResponse.json({ revalidated: true, path })
}
