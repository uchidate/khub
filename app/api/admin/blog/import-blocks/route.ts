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

        const { title, slug, excerpt, categoryId, tags, coverImageUrl, blocks: rawBlocks } = await request.json()

        // Strip markdown link syntax from url fields: [text](url) → url
        // If the href is a Google Search wrapper, prefer the link text (which is usually the real URL)
        const mdUrl = /\[([^\]]*)\]\(([^)]+)\)/
        const blocks = Array.isArray(rawBlocks)
            ? rawBlocks.map((b: Record<string, unknown>) => {
                if (typeof b.url === "string" && mdUrl.test(b.url)) {
                    const match = b.url.match(mdUrl)
                    const text = match?.[1] ?? ""
                    const href = match?.[2] ?? b.url
                    const isGoogleWrapper = href.includes("google.com/search")
                    const resolved = isGoogleWrapper && text.startsWith("http") ? text : href
                    return { ...b, url: resolved }
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
                tags: Array.isArray(tags) ? tags.map(String) : [],
                coverImageUrl: typeof coverImageUrl === "string" && coverImageUrl ? coverImageUrl : undefined,
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
