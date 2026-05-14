import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
        }

        const { title, slug, excerpt, categoryId, blocks: rawBlocks } = await request.json()

        // Strip markdown link syntax from url fields: [text](url) → url
        const mdUrl = /\[([^\]]*)\]\(([^)]+)\)/
        const blocks = Array.isArray(rawBlocks)
            ? rawBlocks.map((b: Record<string, unknown>) => {
                if (typeof b.url === "string" && mdUrl.test(b.url)) {
                    const match = b.url.match(mdUrl)
                    return { ...b, url: match?.[2] ?? b.url }
                }
                return b
            })
            : rawBlocks

        if (!title || typeof title !== "string") return NextResponse.json({ error: "Título obrigatório" }, { status: 400 })
        if (!slug || typeof slug !== "string") return NextResponse.json({ error: "Slug obrigatório" }, { status: 400 })
        if (!Array.isArray(blocks) || blocks.length === 0) return NextResponse.json({ error: "Blocos obrigatórios" }, { status: 400 })

        const existing = await prisma.blogPost.findUnique({ where: { slug } })
        if (existing) return NextResponse.json({ error: `Slug '${slug}' já existe` }, { status: 409 })

        const post = await prisma.blogPost.create({
            data: {
                title,
                slug,
                excerpt: excerpt || null,
                contentMd: "",
                blocks: blocks as object[],
                status: "DRAFT",
                authorId: session.user.id,
                categoryId: categoryId || undefined,
            },
            select: { id: true, slug: true, title: true, status: true },
        })

        return NextResponse.json({ success: true, post })
    } catch (error) {
        return NextResponse.json({ error: `Erro ao importar: ${error}` }, { status: 500 })
    }
}
