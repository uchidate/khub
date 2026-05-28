import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('COMMENTS')

export const dynamic = 'force-dynamic'

interface RouteContext {
    params: Promise<{ slug: string }>
}

export async function GET(_req: NextRequest, props: RouteContext) {
    const { slug } = await props.params
    try {
        const post = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } })
        if (!post) return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })

        const comments = await prisma.comment.findMany({
            where: { blogPostId: post.id, status: 'ACTIVE' },
            include: { user: { select: { id: true, name: true, image: true, role: true } } },
            orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ comments })
    } catch (error) {
        log.error('Error fetching comments', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Erro ao buscar comentários' }, { status: 500 })
    }
}

export async function POST(request: NextRequest, props: RouteContext) {
    const { slug } = await props.params
    const limited = checkRateLimit(request, RateLimitPresets.COMMENTS)
    if (limited) return limited

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Você precisa estar logado para comentar' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
        if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

        const post = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } })
        if (!post) return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })

        const { content } = await request.json()
        if (!content?.trim()) return NextResponse.json({ error: 'O comentário não pode estar vazio' }, { status: 400 })
        if (content.length > 1000) return NextResponse.json({ error: 'Máximo de 1000 caracteres' }, { status: 400 })

        const comment = await prisma.comment.create({
            data: { content: content.trim(), userId: user.id, blogPostId: post.id },
            include: { user: { select: { id: true, name: true, image: true, role: true } } },
        })

        await prisma.activity.create({
            data: { userId: user.id, type: 'COMMENT_CREATE', entityId: post.id, entityType: 'BLOG_POST' },
        }).catch(() => {})

        return NextResponse.json({ comment }, { status: 201 })
    } catch (error) {
        log.error('Error creating comment', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Erro ao criar comentário' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

        const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } })
        if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

        const commentId = new URL(request.url).searchParams.get('commentId')
        if (!commentId) return NextResponse.json({ error: 'commentId obrigatório' }, { status: 400 })

        const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { userId: true } })
        if (!comment) return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 })

        if (comment.userId !== user.id && user.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        await prisma.comment.delete({ where: { id: commentId } })
        return NextResponse.json({ success: true })
    } catch (error) {
        log.error('Error deleting comment', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Erro ao deletar comentário' }, { status: 500 })
    }
}
