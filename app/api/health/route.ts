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
      env: process.env.NODE_ENV,
      deploy_env: process.env.DEPLOY_ENV || 'unknown',
      db: { ok: dbOk, latencyMs: dbLatencyMs },
    },
    { status: dbOk ? 200 : 503 }
  )
}
