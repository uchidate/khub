import { NextRequest } from 'next/server'

const UMAMI_INTERNAL_URL =
  process.env.UMAMI_INTERNAL_URL || 'http://umami-xkcma2bp6ww04w0ydx1m0qwf:3000'

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    ''

  const body = await request.text()

  try {
    const response = await fetch(`${UMAMI_INTERNAL_URL}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': request.headers.get('user-agent') || '',
        'Accept-Language': request.headers.get('accept-language') || '',
        'X-Forwarded-For': clientIp,
      },
      body,
    })

    const text = await response.text()
    return new Response(text, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response('{"beep":"boop"}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
