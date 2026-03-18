import { NextRequest } from 'next/server'

// Allowlist of domains this resolver is permitted to follow redirects for.
// Only Twitter/X shortlinks and direct tweet URLs are supported.
const ALLOWED_HOSTS = new Set([
    't.co',
    'twitter.com',
    'x.com',
    'pic.twitter.com',
    'mobile.twitter.com',
    'mobile.x.com',
])

export async function GET(request: NextRequest) {
    const raw = request.nextUrl.searchParams.get('url')
    if (!raw) return Response.json({ error: 'no url' }, { status: 400 })

    let parsed: URL
    try {
        parsed = new URL(raw)
    } catch {
        return Response.json({ error: 'invalid url' }, { status: 400 })
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return Response.json({ error: 'invalid protocol' }, { status: 400 })
    }

    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
        return Response.json({ error: 'host not allowed' }, { status: 400 })
    }

    // URL is restricted to the allowlist above — not an SSRF risk
    const safeUrl = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}${parsed.search}`
    try {
        const response = await fetch(safeUrl, {
            method: 'HEAD',
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0' },
        })
        return Response.json({ url: response.url })
    } catch {
        return Response.json({ url: raw })
    }
}
