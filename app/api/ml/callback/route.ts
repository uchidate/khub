import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
    const expiresAt = new Date(Date.now() + (token.expires_in ?? 21600) * 1000)

    await prisma.systemSettings.upsert({
        where: { id: 'singleton' },
        create: {
            id: 'singleton',
            mlAccessToken:   token.access_token,
            mlRefreshToken:  token.refresh_token,
            mlTokenExpiresAt: expiresAt,
            mlUserId:        String(token.user_id),
        },
        update: {
            mlAccessToken:   token.access_token,
            mlRefreshToken:  token.refresh_token,
            mlTokenExpiresAt: expiresAt,
            mlUserId:        String(token.user_id),
        },
    })

    return new NextResponse(`
        <html><body style="font-family:sans-serif;padding:2rem;max-width:600px">
        <h2>✅ Mercado Livre autorizado!</h2>
        <p>Token salvo no banco com sucesso. O cron de sync vai renovar automaticamente antes de expirar.</p>
        <p><b>User ID:</b> ${token.user_id}</p>
        <p><b>Expira em:</b> ${expiresAt.toLocaleString('pt-BR')}</p>
        <p><a href="/admin/loja">→ Ir para a loja</a></p>
        </body></html>
    `, { headers: { 'Content-Type': 'text/html' } })
}
