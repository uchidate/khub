import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-helpers"
import { buildHomeClusterInsights } from "@/lib/home/home-cluster-insights"

export const dynamic = "force-dynamic"

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const insights = await buildHomeClusterInsights()
    return NextResponse.json(insights)
}
