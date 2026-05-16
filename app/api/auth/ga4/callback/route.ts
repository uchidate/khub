import { NextResponse } from 'next/server'

const CLIENT_ID     = process.env.GA4_CLIENT_ID     ?? ''
const CLIENT_SECRET = process.env.GA4_CLIENT_SECRET ?? ''
const REDIRECT_URI  = 'http://localhost:3000/api/auth/ga4/callback'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    if (!code) return NextResponse.json({ error: 'Código não recebido' }, { status: 400 })

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
        }),
    })

    const tokens = await res.json()
    if (!tokens.refresh_token) {
        return NextResponse.json({ error: 'Refresh token não gerado', tokens }, { status: 400 })
    }

    return new NextResponse(`
<html><body style="font-family:monospace;padding:2rem;background:#111;color:#0f0">
<h2>✅ Refresh token gerado!</h2>
<p>Adicione ao <b>.env.local</b>:</p>
<pre style="background:#000;padding:1rem;border-radius:8px;word-break:break-all">GA4_REFRESH_TOKEN=${tokens.refresh_token}</pre>
<p style="color:#aaa">Feche esta janela e reinicie o servidor.</p>
</body></html>`, { headers: { 'Content-Type': 'text/html' } })
}
