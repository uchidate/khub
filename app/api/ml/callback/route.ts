import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

const ML_TOKEN = 'https://api.mercadolibre.com/oauth/token'
const APP_ID     = process.env.ML_APP_ID!
const SECRET_KEY = process.env.ML_SECRET_KEY!
const REDIRECT   = process.env.ML_REDIRECT_URI!

export async function GET(req: NextRequest) {
    const code  = req.nextUrl.searchParams.get('code')
    const error = req.nextUrl.searchParams.get('error')

    if (error) {
        return new NextResponse(`<h2>Erro: ${error}</h2>`, { headers: { 'Content-Type': 'text/html' } })
    }
    if (!code) {
        return new NextResponse('<h2>Código não recebido.</h2>', { headers: { 'Content-Type': 'text/html' } })
    }

    const resp = await fetch(ML_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type:    'authorization_code',
            client_id:     APP_ID,
            client_secret: SECRET_KEY,
            code,
            redirect_uri:  REDIRECT,
        }),
    })

    if (!resp.ok) {
        const err = await resp.text()
        return new NextResponse(`<h2>Erro ao obter token: ${err}</h2>`, { headers: { 'Content-Type': 'text/html' } })
    }

    const token = await resp.json()
    token.expires_at = Date.now() / 1000 + (token.expires_in ?? 21600)

    // Salvar token em arquivo local (só funciona em dev — em prod use env var ou DB)
    try {
        const tokenPath = path.join(process.cwd(), 'scripts', 'mercadolivre', 'token.json')
        await writeFile(tokenPath, JSON.stringify(token, null, 2))
    } catch {
        // Em produção não tem acesso ao filesystem do repo — exibir token na tela
    }

    return new NextResponse(`
        <html><body style="font-family:sans-serif;padding:2rem">
        <h2>✅ Autorizado com sucesso!</h2>
        <p><b>User ID:</b> ${token.user_id}</p>
        <p><b>Access Token:</b> <code>${token.access_token}</code></p>
        <p><b>Refresh Token:</b> <code>${token.refresh_token}</code></p>
        <p>Copie esses valores e salve em <code>scripts/mercadolivre/token.json</code></p>
        <pre>${JSON.stringify(token, null, 2)}</pre>
        </body></html>
    `, { headers: { 'Content-Type': 'text/html' } })
}
