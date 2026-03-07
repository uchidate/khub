/**
 * Next.js Instrumentation (stable from Next.js 15)
 *
 * - register(): captura Promises rejeitadas sem .catch() (unhandledRejection)
 * - onRequestError(): captura TODOS os erros de rotas de API (Next.js 15+)
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Registrado apenas no servidor Node.js (não no Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Catch de erros não tratados em Promises (ex: background jobs sem .catch)
    process.on('unhandledRejection', (reason) => {
      const message = reason instanceof Error ? reason.message : String(reason)
      const stack = reason instanceof Error ? reason.stack : undefined
      // best-effort — import dinâmico evita problemas de inicialização
      import('@/lib/services/system-event-service').then(({ logSystemEvent }) => {
        logSystemEvent('ERROR', 'unhandled-rejection', message, { stack }).catch(() => {})
      }).catch(() => {})
    })
  }
}

/**
 * Captura TODOS os erros de handlers de API que não passam pelo withLogging HOF.
 * Usa fetch interno para evitar imports pesados (pg/prisma) no bundle de instrumentação.
 */
export async function onRequestError(
  err: { digest?: string } & Error,
  request: {
    path: string
    method: string
    headers: Record<string, string>
  },
) {
  // Só logar rotas de API para não poluir com erros de render de páginas
  if (!request.path.startsWith('/api/')) return
  // Ignorar redirect/not-found usados internamente pelo Next.js
  if (err.digest === 'NEXT_REDIRECT' || err.digest === 'NEXT_NOT_FOUND') return
  // Não logar o próprio endpoint interno (evitar loop)
  if (request.path.startsWith('/api/internal/')) return

  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) return

    const baseUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')
    const ip = request.headers['x-forwarded-for']?.split(',')[0]?.trim()
      ?? request.headers['x-real-ip']
      ?? undefined

    fetch(`${baseUrl}/api/internal/server-error-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret,
      },
      body: JSON.stringify({
        method: request.method,
        path: request.path,
        status: 500,
        duration: 0,
        error: err.message ?? String(err),
        userAgent: request.headers['user-agent'],
        ip,
      }),
    }).catch(() => { /* fire-and-forget */ })
  } catch {
    // Nunca deixar log falhar
  }
}
