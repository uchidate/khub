import { NextRequest, NextResponse } from 'next/server'

// Domains allowed to be proxied — add more as needed
const ALLOWED_DOMAINS = [
    'upload.wikimedia.org',
    'commons.wikimedia.org',
]

export async function GET(req: NextRequest) {
    const rawUrl = req.nextUrl.searchParams.get('url')
    if (!rawUrl) return new NextResponse('Missing url', { status: 400 })

    let parsed: URL
    try {
        parsed = new URL(rawUrl)
    } catch {
        return new NextResponse('Invalid url', { status: 400 })
    }

    if (!ALLOWED_DOMAINS.includes(parsed.hostname)) {
        return new NextResponse('Domain not allowed', { status: 403 })
    }

    try {
        const upstream = await fetch(rawUrl, {
            headers: { 'User-Agent': 'HallyuHub/1.0 (+https://hallyuhub.com.br)' },
            next: { revalidate: 86400 },
        })

        if (!upstream.ok) {
            return new NextResponse('Upstream error', { status: upstream.status })
        }

        const buffer = await upstream.arrayBuffer()
        const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
            },
        })
    } catch {
        return new NextResponse('Proxy error', { status: 502 })
    }
}
