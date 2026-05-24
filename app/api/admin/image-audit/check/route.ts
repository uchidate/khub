import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')
    if (!url) return NextResponse.json({ ok: false }, { status: 400 })

    try {
        const parsed = new URL(url)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return NextResponse.json({ ok: false, status: 0 })
        }
        const res = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(8000),
            headers: { 'User-Agent': 'HallyuHub-ImageAudit/1.0' },
        })
        return NextResponse.json({ ok: res.ok, status: res.status })
    } catch {
        return NextResponse.json({ ok: false, status: null })
    }
}
