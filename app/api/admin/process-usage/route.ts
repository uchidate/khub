import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { ADMIN_TELEMETRY_AREAS, resolveAdminTelemetryRoute } from '@/lib/admin/process-telemetry'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const body = await req.json().catch(() => null) as { pathname?: string } | null
  const pathname = body?.pathname ?? ''
  const route = resolveAdminTelemetryRoute(pathname)
  if (!route) {
    return NextResponse.json({ error: 'Pagina admin nao monitorada.' }, { status: 400 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await prisma.auditLog.findFirst({
    where: {
      adminId: session!.user.id,
      action: 'VIEW',
      entity: 'AdminProcessUsage',
      entityId: route.key,
      createdAt: { gte: today },
    },
    select: { id: true },
  })

  if (!existing) {
    await prisma.auditLog.create({
      data: {
        adminId: session!.user.id,
        action: 'VIEW',
        entity: 'AdminProcessUsage',
        entityId: route.key,
        details: `${ADMIN_TELEMETRY_AREAS[route.area]} | ${route.label}`,
      },
    })
  }

  return NextResponse.json({ recorded: !existing })
}
