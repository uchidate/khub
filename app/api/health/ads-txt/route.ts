import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXTAUTH_URL ?? 'https://www.hallyuhub.com.br'
// Entradas obrigatórias que devem estar no ads.txt (publisher ID sem "ca-pub-")
const REQUIRED_ENTRIES = [
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-6015098995926392',
]

export async function GET() {
    const start = Date.now()
    try {
        const res = await fetch(`${SITE_URL}/ads.txt`, {
            next: { revalidate: 0 },
            headers: { 'User-Agent': 'HallyuHub-HealthCheck/1.0' },
        })

        if (!res.ok) {
            return NextResponse.json({
                ok: false,
                error: `ads.txt retornou HTTP ${res.status}`,
                ms: Date.now() - start,
            }, { status: 502 })
        }

        const text = await res.text()
        const missing = REQUIRED_ENTRIES.filter(entry =>
            !text.toLowerCase().includes(entry.toLowerCase())
        )

        return NextResponse.json({
            ok: missing.length === 0,
            ms: Date.now() - start,
            size: text.length,
            lines: text.split('\n').filter(l => l.trim() && !l.startsWith('#')).length,
            missing: missing.length > 0 ? missing : undefined,
        }, { status: missing.length === 0 ? 200 : 500 })
    } catch (err) {
        return NextResponse.json({
            ok: false,
            error: String(err),
            ms: Date.now() - start,
        }, { status: 500 })
    }
}
