import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { detectBot } from '@/lib/utils/bot-detector'

// Rotas que requerem autenticação
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
]

// Rotas de autenticação (usuários logados não devem acessar)
const authRoutes = [
  '/auth/login',
  '/auth/register',
]

// Rotas que requerem role específico
const adminRoutes = [
  '/admin',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get token from request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isAuthenticated = !!token
  const isAdmin = token?.role?.toUpperCase() === 'ADMIN'
  const isEditor = token?.role?.toUpperCase() === 'EDITOR'

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Check if route is auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Check if route requires admin
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check admin routes
  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Detectar e logar robôs de busca (fire-and-forget, não bloqueia o request)
  const ua = request.headers.get('user-agent')
  const botName = detectBot(ua)
  if (botName) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || undefined
    const secret = process.env.NEXTAUTH_SECRET
    // Usar NEXTAUTH_URL (variável de servidor fixo) para evitar SSRF via header Host
    const baseUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')
    if (secret) {
      fetch(`${baseUrl}/api/internal/bot-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': secret,
        },
        body: JSON.stringify({
          bot: botName,
          path: pathname,
          ip,
          userAgent: ua ?? '',
          referer: request.headers.get('referer') ?? undefined,
        }),
      }).catch(() => { /* ignorar erros de log */ })
    }
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|api/internal|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
