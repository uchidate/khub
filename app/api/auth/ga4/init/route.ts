import { NextResponse } from 'next/server'

const CLIENT_ID = process.env.GA4_CLIENT_ID ?? ''
const REDIRECT_URI = 'http://localhost:3000/api/auth/ga4/callback'
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'

export async function GET() {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.searchParams.set('client_id', CLIENT_ID)
    url.searchParams.set('redirect_uri', REDIRECT_URI)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', SCOPE)
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'consent')
    return NextResponse.redirect(url.toString())
}
