/**
 * Next.js Instrumentation
 *
 * Este arquivo é carregado automaticamente pelo Next.js ao iniciar o servidor
 * (requer experimental.instrumentationHook: true no next.config.mjs).
 *
 * - register(): captura Promises rejeitadas sem .catch() (unhandledRejection)
 *   e persiste em SystemEvent para visibilidade no admin.
 *
 * Nota: onRequestError só existe no Next.js 15+. Para capturar erros 4xx/5xx
 * de rotas individuais, use o HOF withLogging em lib/server/withLogging.ts.
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
