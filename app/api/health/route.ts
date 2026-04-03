import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Public health check — verifica conectividade com o banco de dados.
 * Retorna HTTP 503 se o banco estiver inacessível (aciona alertas e rollback no deploy).
 * Informações detalhadas dos serviços estão em /api/admin/health (requer auth).
 */
export async function GET() {
  let dbOk = false
  let dbLatencyMs: number | null = null

  const buildSha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.BUILD_SHA ??
    null
  const deployEnv = process.env.DEPLOY_ENV ?? process.env.NODE_ENV ?? null

  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatencyMs = Date.now() - start
    dbOk = true
  } catch {
    dbOk = false
  }

  return NextResponse.json(
    {
      ok: dbOk,
      ts: new Date().toISOString(),
      db: { ok: dbOk, latencyMs: dbLatencyMs },
      build: { sha: buildSha, env: deployEnv },
    },
    { status: dbOk ? 200 : 503 }
  )
}
