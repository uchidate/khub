import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { readdir, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'blog')

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    if (!existsSync(UPLOAD_DIR)) return NextResponse.json([])

    const files = await readdir(UPLOAD_DIR)
    const images = await Promise.all(
        files
            .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
            .map(async filename => {
                const s = await stat(path.join(UPLOAD_DIR, filename))
                return { filename, url: `/api/uploads/blog/${filename}`, size: s.size, createdAt: s.birthtime }
            })
    )

    images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json(images)
}

export async function DELETE(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { filename } = await request.json()
    if (!filename || filename.includes('..') || filename.includes('/')) {
        return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
    }

    const filepath = path.join(UPLOAD_DIR, filename)
    if (!existsSync(filepath)) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })

    await unlink(filepath)
    return NextResponse.json({ ok: true })
}
