/**
 * Next.js Instrumentation
 *
 * Este arquivo é carregado automaticamente pelo Next.js ao iniciar o servidor.
 * Fornece hooks para monitoramento global de erros sem modificar cada rota.
 *
 * - onRequestError: captura exceções não tratadas em qualquer route handler
 *   e persiste em ServerLog + SystemEvent para visibilidade no admin.
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
      // best-effort — não pode usar Prisma diretamente aqui (loop de import)
      // O import dinâmico evita problemas de inicialização
      import('@/lib/services/system-event-service').then(({ logSystemEvent }) => {
        logSystemEvent('ERROR', 'unhandled-rejection', message, { stack }).catch(() => {})
      }).catch(() => {})
    })
  }
}

/**
 * Captura erros não tratados em route handlers do Next.js App Router.
 * Chamado ANTES da resposta 500 ser enviada ao cliente.
 */
export async function onRequestError(
  err: { digest?: string } & Error,
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: string; routeType: string },
) {
  // Ignorar erros esperados do Next.js (redirects, not-found)
  if (err.digest?.startsWith('NEXT_') || err.message?.includes('NEXT_NOT_FOUND')) return

  const path  = request.path
  const method = request.method
  const message = err.message ?? 'Unknown error'
  const stack = err.stack

  // Persiste em paralelo em ServerLog e SystemEvent (best-effort)
  try {
    const { default: prisma } = await import('@/lib/prisma')
    await Promise.allSettled([
      prisma.serverLog.create({
        data: {
          method,
          path,
          status: 500,
          duration: 0,
          error: `${message}\n\n${stack ?? ''}`.slice(0, 2000),
          ip: request.headers['x-forwarded-for']?.split(',')[0]?.trim()
            ?? request.headers['x-real-ip']
            ?? undefined,
          userAgent: request.headers['user-agent']?.slice(0, 500) ?? undefined,
        },
      }),
      prisma.systemEvent.create({
        data: {
          level: 'ERROR',
          source: `route:${context.routeType}`,
          message: `${method} ${path} — ${message}`,
          metadata: {
            digest: err.digest,
            routerKind: context.routerKind,
            routeType: context.routeType,
            stack: stack?.slice(0, 1000),
          },
        },
      }),
    ])
  } catch {
    // Nunca deixar o logging quebrar a resposta de erro original
  }
}
