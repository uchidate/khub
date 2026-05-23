import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { OAuth2Client } from 'google-auth-library'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const code = req.nextUrl.searchParams.get('code')
    if (!code) {
        return NextResponse.json({ error: 'Código OAuth ausente' }, { status: 400 })
    }

    const clientId     = process.env.GA4_CLIENT_ID
    const clientSecret = process.env.GA4_CLIENT_SECRET
    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'GA4_CLIENT_ID ou GA4_CLIENT_SECRET não configurados' }, { status: 500 })
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://www.hallyuhub.com.br'
    const redirectUri = `${baseUrl}/api/admin/analytics/ga4/callback`
    const oauth2 = new OAuth2Client(clientId, clientSecret, redirectUri)

    const { tokens } = await oauth2.getToken(code)
    const refreshToken = tokens.refresh_token

    if (!refreshToken) {
        return new NextResponse(
            `<html><body style="font-family:monospace;padding:2rem;background:#0a0a0a;color:#e5e5e5">
            <h2 style="color:#ef4444">Refresh token não retornado</h2>
            <p>O Google só retorna o refresh_token na primeira autorização.<br>
            Revogue o acesso em <a href="https://myaccount.google.com/permissions" style="color:#3b82f6">myaccount.google.com/permissions</a> e tente novamente.</p>
            </body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
        )
    }

    return new NextResponse(
        `<html><body style="font-family:monospace;padding:2rem;background:#0a0a0a;color:#e5e5e5">
        <h2 style="color:#22c55e">✓ Refresh token obtido</h2>
        <p>Atualize o secret <code style="background:#1a1a1a;padding:2px 6px;border-radius:4px">GA4_REFRESH_TOKEN</code> com o valor abaixo:</p>
        <textarea readonly style="width:100%;height:80px;background:#1a1a1a;color:#86efac;border:1px solid #333;padding:8px;border-radius:6px;font-size:12px">${refreshToken}</textarea>
        <p style="margin-top:1rem;font-size:13px;color:#6b7280">Execute no terminal:<br>
        <code style="background:#1a1a1a;padding:4px 8px;border-radius:4px;display:block;margin-top:4px">/set-env GA4_REFRESH_TOKEN=&lt;valor acima&gt; --secret</code></p>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
    )
}
