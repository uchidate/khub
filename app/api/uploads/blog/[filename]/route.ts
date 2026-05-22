import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'blog')
const DEFAULT_UPLOADS_FALLBACK_ORIGIN = 'https://www.hallyuhub.com.br'

function getContentType(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase()
    return (
        ext === 'webp' ? 'image/webp' :
        ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
        ext === 'png' ? 'image/png' :
        ext === 'gif' ? 'image/gif' :
        'application/octet-stream'
    )
}

function getFallbackOrigin(requestOrigin: string) {
    const configured = process.env.UPLOADS_FALLBACK_ORIGIN || process.env.NEXT_PUBLIC_UPLOADS_FALLBACK_ORIGIN
    const fallback = (configured || DEFAULT_UPLOADS_FALLBACK_ORIGIN).replace(/\/$/, '')
    return fallback !== requestOrigin.replace(/\/$/, '') ? fallback : null
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params

    // Sanitizar — evitar path traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
        return new NextResponse('Not found', { status: 404 })
    }

    const filepath = path.join(UPLOAD_DIR, filename)

    if (!existsSync(filepath)) {
        const fallbackOrigin = getFallbackOrigin(req.nextUrl.origin)
        if (fallbackOrigin) {
            const remoteUrl = `${fallbackOrigin}/api/uploads/blog/${encodeURIComponent(filename)}`
            const remote = await fetch(remoteUrl, { cache: 'force-cache' }).catch(() => null)
            if (remote?.ok && remote.body) {
                return new NextResponse(remote.body, {
                    headers: {
                        'Content-Type': remote.headers.get('content-type') ?? getContentType(filename),
                        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
                    },
                })
            }
        }
        return new NextResponse('Not found', { status: 404 })
    }

    const buffer = await readFile(filepath)

    return new NextResponse(buffer, {
        headers: {
            'Content-Type': getContentType(filename),
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    })
}
