import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAiRecentLogs } from '@/lib/services/ai-stats-service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const provider = searchParams.get('provider') || undefined
    const feature  = searchParams.get('feature')  || undefined
    const status   = searchParams.get('status')   || undefined
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit    = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50')))

    const result = await getAiRecentLogs({ limit, page, provider, feature, status })
    return NextResponse.json(result)
}
