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

// Rotas do Payload CMS — requer role admin
const cmsRoutes = [
  '/cms',
]

export async function proxy(request: NextRequest) {
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

  // Check CMS routes (Payload) — admin only, redirect to login if not authenticated
  // Rotas públicas do Payload (login, create-first-user) ficam acessíveis sem auth
  const cmsPublicPaths = ['/cms/login', '/cms/create-first-user', '/cms/forgot', '/cms/reset', '/cms/logout']
  const isCmsRoute = cmsRoutes.some((route) => pathname.startsWith(route))
  const isCmsPublicRoute = cmsPublicPaths.some((p) => pathname.startsWith(p))
  if (isCmsRoute && !isCmsPublicRoute && !isAdmin) {
    const loginUrl = new URL('/auth/login', request.url)
    // Usar pathname relativo para evitar URL interna do Docker (0.0.0.0:3000) no callbackUrl
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Detectar e logar robôs de busca (fire-and-forget, não bloqueia o request)
  const ua = request.headers.get('user-agent')
  const botName = detectBot(ua)
  if (botName) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || undefined
    const secret = process.env.NEXTAUTH_SECRET
    // Usar http://localhost:3000 para chamadas internas do proxy (Node.js runtime).
    // NEXTAUTH_URL aponta para a URL pública (https://...) — fetch HTTPS dentro do container
    // pode falhar silenciosamente por restrições de TLS/DNS.
    if (secret) {
      fetch('http://localhost:3000/api/internal/bot-log', {
        method: 'POST',
        cache: 'no-store',
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
      }).catch((err: unknown) => {
        console.error('[bot-log]', err instanceof Error ? err.message : err)
      })
    }
  }

  // Passar pathname como header para que app/layout.tsx possa detectar rotas CMS
  // e renderizar layout mínimo (evitar NavBar/footer dentro do Payload admin)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Roda apenas em rotas de página — não em /api/* nem arquivos estáticos.
     * Isso evita o overhead de getToken() em cada chamada de API.
     * As rotas de API admin já protegem a si mesmas via auth() dentro do handler.
     * Bot detection cobre apenas páginas (bots raramente precisam de APIs).
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
