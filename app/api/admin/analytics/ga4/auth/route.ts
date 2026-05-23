import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { OAuth2Client } from 'google-auth-library'

export const dynamic = 'force-dynamic'

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const clientId     = process.env.GA4_CLIENT_ID
    const clientSecret = process.env.GA4_CLIENT_SECRET
    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'GA4_CLIENT_ID ou GA4_CLIENT_SECRET não configurados' }, { status: 500 })
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://www.hallyuhub.com.br'
    const redirectUri = `${baseUrl}/api/admin/analytics/ga4/callback`
    const oauth2 = new OAuth2Client(clientId, clientSecret, redirectUri)

    const url = oauth2.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/webmasters.readonly',
        ],
    })

    return NextResponse.redirect(url)
}
