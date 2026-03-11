import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url')
    if (!url) return Response.json({ error: 'no url' }, { status: 400 })

    try {
        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0' },
        })
        return Response.json({ url: response.url })
    } catch {
        return Response.json({ url })
    }
}
