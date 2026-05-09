import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'blog')

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params

    // Sanitizar — evitar path traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
        return new NextResponse('Not found', { status: 404 })
    }

    const filepath = path.join(UPLOAD_DIR, filename)

    if (!existsSync(filepath)) {
        return new NextResponse('Not found', { status: 404 })
    }

    const buffer = await readFile(filepath)

    const ext = filename.split('.').pop()?.toLowerCase()
    const contentType =
        ext === 'webp' ? 'image/webp' :
        ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
        ext === 'png' ? 'image/png' :
        ext === 'gif' ? 'image/gif' :
        'application/octet-stream'

    return new NextResponse(buffer, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    })
}
