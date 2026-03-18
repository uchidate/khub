import { NextRequest } from 'next/server'

const ALLOWED_PROTOCOLS = new Set(['https:', 'http:'])

// Block requests to private/loopback addresses
const BLOCKED_HOST = /^(localhost|127\.|0\.0\.0\.0|::1|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/i

export async function GET(request: NextRequest) {
    const raw = request.nextUrl.searchParams.get('url')
    if (!raw) return Response.json({ error: 'no url' }, { status: 400 })

    let parsed: URL
    try {
        parsed = new URL(raw)
    } catch {
        return Response.json({ error: 'invalid url' }, { status: 400 })
    }

    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
        return Response.json({ error: 'invalid protocol' }, { status: 400 })
    }

    if (BLOCKED_HOST.test(parsed.hostname)) {
        return Response.json({ error: 'blocked host' }, { status: 400 })
    }

    try {
        const response = await fetch(parsed.toString(), {
            method: 'HEAD',
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0' },
        })
        return Response.json({ url: response.url })
    } catch {
        return Response.json({ url: raw })
    }
}
