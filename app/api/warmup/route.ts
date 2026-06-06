import { NextRequest, NextResponse } from 'next/server'
import { buildHomeRuntimeData } from '@/lib/home/home-runtime'

export const dynamic = 'force-dynamic'

const WARMUP_SECRET = process.env.WARMUP_SECRET

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token')
    if (!WARMUP_SECRET || token !== WARMUP_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const start = Date.now()
    try {
        await buildHomeRuntimeData()
        const ms = Date.now() - start
        return NextResponse.json({ ok: true, ms })
    } catch (err) {
        const ms = Date.now() - start
        return NextResponse.json({ ok: false, ms, error: String(err) }, { status: 500 })
    }
}
