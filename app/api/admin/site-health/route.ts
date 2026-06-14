import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getSiteHealthOverview, getUrlHealth } from '@/lib/site-health/site-health'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const path = req.nextUrl.searchParams.get('path')
  if (path) {
    const urlHealth = await getUrlHealth(path)
    return NextResponse.json({ mode: 'url', urlHealth })
  }

  const overview = await getSiteHealthOverview()
  return NextResponse.json({ mode: 'overview', overview })
}
