import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
    const slug = request.nextUrl.searchParams.get("slug")
    if (!slug) return NextResponse.json({ available: false, error: "slug obrigatório" }, { status: 400 })
    const existing = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true, title: true } })
    return NextResponse.json({ available: !existing, existing: existing ?? null })
}
