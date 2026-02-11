import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface RouteContext {
    params: {
        id: string
    }
}

// GET - Buscar comentários de uma notícia
export async function GET(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const comments = await prisma.comment.findMany({
            where: {
                newsId: params.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({ comments })
    } catch (error: any) {
        console.error('Error fetching comments:', error)
        return NextResponse.json(
            { error: 'Failed to fetch comments' },
            { status: 500 }
        )
    }
}

// POST - Criar novo comentário
export async function POST(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Você precisa estar logado para comentar' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const { content } = body

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { error: 'O comentário não pode estar vazio' },
                { status: 400 }
            )
        }

        if (content.length > 1000) {
            return NextResponse.json(
                { error: 'O comentário não pode ter mais de 1000 caracteres' },
                { status: 400 }
            )
        }

        // Verificar se a notícia existe
        const news = await prisma.news.findUnique({
            where: { id: params.id },
            select: { id: true }
        })

        if (!news) {
            return NextResponse.json(
                { error: 'Notícia não encontrada' },
                { status: 404 }
            )
        }

        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                userId: user.id,
                newsId: params.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        role: true
                    }
                }
            }
        })

        return NextResponse.json({ comment }, { status: 201 })
    } catch (error: any) {
        console.error('Error creating comment:', error)
        return NextResponse.json(
            { error: 'Failed to create comment' },
            { status: 500 }
        )
    }
}

// DELETE - Deletar comentário
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Você precisa estar logado' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        const { searchParams } = new URL(request.url)
        const commentId = searchParams.get('commentId')

        if (!commentId) {
            return NextResponse.json(
                { error: 'ID do comentário é obrigatório' },
                { status: 400 }
            )
        }

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { userId: true }
        })

        if (!comment) {
            return NextResponse.json(
                { error: 'Comentário não encontrado' },
                { status: 404 }
            )
        }

        // Apenas o autor ou admin pode deletar
        if (comment.userId !== user.id && user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Você não tem permissão para deletar este comentário' },
                { status: 403 }
            )
        }

        await prisma.comment.delete({
            where: { id: commentId }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting comment:', error)
        return NextResponse.json(
            { error: 'Failed to delete comment' },
            { status: 500 }
        )
    }
}
