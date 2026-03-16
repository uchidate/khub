import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getProductionTakedownService } from '@/lib/services/production-takedown-service'

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const result = await getProductionTakedownService().listActiveTakedowns(page, limit)
  return NextResponse.json(result)
}
