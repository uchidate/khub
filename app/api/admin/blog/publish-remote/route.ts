import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

type RemoteEnv = "staging" | "production"

function createRemoteClient(url: string): PrismaClient {
    const pool = new Pool({
        connectionString: url,
        max: 3,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 8000,
    })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
}

function getRemoteUrl(env: RemoteEnv): string | null {
    return env === "staging"
        ? (process.env.STAGING_DATABASE_URL ?? null)
        : (process.env.PRODUCTION_DATABASE_URL ?? null)
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
        }

        const { postId, environments } = await request.json() as {
            postId: string
            environments: RemoteEnv[]
        }

        if (!postId) return NextResponse.json({ error: "postId obrigatório" }, { status: 400 })
        if (!Array.isArray(environments) || environments.length === 0) {
            return NextResponse.json({ error: "Selecione ao menos um ambiente" }, { status: 400 })
        }

        // Read full post from local DB
        const post = await prisma.blogPost.findUnique({
            where: { id: postId },
            include: { category: true },
        })
        if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })

        const results: Record<string, { success: boolean; error?: string }> = {}

        for (const env of environments) {
            const url = getRemoteUrl(env)
            if (!url) {
                results[env] = { success: false, error: `${env.toUpperCase()}_DATABASE_URL não configurada` }
                continue
            }

            const client = createRemoteClient(url)
            try {
                // Check if slug already exists in remote
                const existing = await client.blogPost.findUnique({ where: { slug: post.slug } })

                const data = {
                    title: post.title,
                    slug: post.slug,
                    excerpt: post.excerpt,
                    contentMd: post.contentMd,
                    blocks: post.blocks as object[],
                    tags: post.tags,
                    status: "PUBLISHED" as const,
                    authorId: post.authorId,
                    categoryId: post.categoryId ?? undefined,
                    coverImageUrl: post.coverImageUrl ?? undefined,
                    publishedAt: new Date(),
                }

                if (existing) {
                    await client.blogPost.update({ where: { slug: post.slug }, data })
                    results[env] = { success: true }
                } else {
                    await client.blogPost.create({ data })
                    results[env] = { success: true }
                }
            } catch (err) {
                results[env] = { success: false, error: String(err) }
            } finally {
                await client.$disconnect()
            }
        }

        // Also mark as PUBLISHED locally
        await prisma.blogPost.update({
            where: { id: postId },
            data: { status: "PUBLISHED", publishedAt: new Date() },
        })

        return NextResponse.json({ results })
    } catch (error) {
        return NextResponse.json({ error: `Erro: ${error}` }, { status: 500 })
    }
}
