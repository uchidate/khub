/**
 * Blog Notification Service
 *
 * Gerencia notificações de artigos do blog para usuários:
 * - Email instantâneo quando um novo artigo é publicado
 * - Email digest diário/semanal com artigos recentes
 */

import { PrismaClient } from '@prisma/client'
import { sendBlogInstantEmail, sendBlogDigestEmail } from './email-service'
import prismaSingleton from '@/lib/prisma'

/**
 * Envia email instantâneo de novo artigo para todos os usuários com notificações ativadas.
 * Registra no histórico para evitar duplicatas.
 */
export async function notifyUsersAboutBlogPost(
    postId: string,
    prisma: PrismaClient = prismaSingleton,
): Promise<void> {
    try {
        const post = await prisma.blogPost.findUnique({
            where: { id: postId, status: 'PUBLISHED' },
            select: {
                id: true,
                slug: true,
                title: true,
                excerpt: true,
                category: { select: { name: true } },
            },
        })

        if (!post) {
            console.log(`  ⏭️  Blog post ${postId} not found or not published`)
            return
        }

        // Usuários com notificação instantânea ativada
        const users = await prisma.user.findMany({
            where: {
                notificationSettings: { emailOnNewBlog: true },
            },
            select: { id: true, email: true, name: true },
        })

        if (users.length === 0) {
            console.log(`  ⏭️  No users have instant blog notifications enabled`)
            return
        }

        // Usuários que já foram notificados sobre este post
        const alreadyNotified = await prisma.notificationHistory.findMany({
            where: { blogPostId: postId, type: 'EMAIL_INSTANT' },
            select: { userId: true },
        })
        const notifiedSet = new Set(alreadyNotified.map(n => n.userId))

        const toNotify = users.filter(u => !notifiedSet.has(u.id))

        console.log(`  📬 Sending blog notifications to ${toNotify.length} user(s) about: ${post.title}`)

        const excerpt = post.excerpt ?? ''
        const category = post.category?.name ?? 'Blog'

        for (const user of toNotify) {
            const success = await sendBlogInstantEmail(
                user.email,
                user.name ?? 'Leitor',
                post.title,
                post.slug,
                excerpt,
                category,
                user.id,
            ).catch(() => false)

            await prisma.notificationHistory.create({
                data: {
                    userId: user.id,
                    blogPostId: postId,
                    type: 'EMAIL_INSTANT',
                    status: success ? 'SENT' : 'FAILED',
                    sentAt: success ? new Date() : null,
                    errorMessage: success ? null : 'Failed to send email',
                },
            }).catch(err => console.error('Failed to record notification:', err))

            if (success) {
                console.log(`  ✅ Blog notification sent to ${user.email}`)
            } else {
                console.log(`  ❌ Failed to send blog notification to ${user.email}`)
            }
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error(`❌ Error notifying users about blog post ${postId}:`, msg)
    }
}

/**
 * Envia email digest de artigos do blog para um usuário.
 * Retorna true se o email foi enviado.
 */
export async function sendBlogDigest(
    userId: string,
    frequency: 'DAILY' | 'WEEKLY',
    prisma: PrismaClient = prismaSingleton,
): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                notificationSettings: {
                    select: {
                        emailDigestEnabled: true,
                        emailDigestFrequency: true,
                    },
                },
            },
        })

        if (!user?.notificationSettings?.emailDigestEnabled) return false
        if (user.notificationSettings.emailDigestFrequency !== frequency) return false

        const daysAgo = frequency === 'DAILY' ? 1 : 7
        const since = new Date()
        since.setDate(since.getDate() - daysAgo)

        const posts = await prisma.blogPost.findMany({
            where: { status: 'PUBLISHED', publishedAt: { gte: since } },
            select: {
                id: true,
                slug: true,
                title: true,
                excerpt: true,
                publishedAt: true,
                category: { select: { name: true } },
            },
            orderBy: { publishedAt: 'desc' },
            take: 10,
        })

        if (posts.length === 0) {
            console.log(`  ⏭️  No blog posts for digest (user ${user.email}, last ${daysAgo}d)`)
            return false
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.hallyuhub.com.br'
        const period = frequency === 'DAILY' ? 'de hoje' : 'desta semana'

        const postsListHtml = posts.map(p => `
        <div style="background:white;padding:20px;border-radius:8px;margin-bottom:15px;border-left:4px solid #7c3aed;">
            ${p.category ? `<p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1px;color:#7c3aed;text-transform:uppercase;">${p.category.name}</p>` : ''}
            <h3 style="margin:0 0 8px;font-size:15px;">
                <a href="${siteUrl}/blog/${p.slug}" style="color:#18181b;text-decoration:none;">${p.title}</a>
            </h3>
            ${p.excerpt ? `<p style="color:#71717a;font-size:13px;margin:4px 0 8px;">${p.excerpt}</p>` : ''}
            <p style="color:#a1a1aa;font-size:12px;margin:4px 0;">
                📅 ${new Date(p.publishedAt!).toLocaleDateString('pt-BR')}
            </p>
        </div>`).join('')

        return sendBlogDigestEmail(user.email, user.name ?? 'Leitor', period, postsListHtml, userId)
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error(`❌ Error sending blog digest to ${userId}:`, msg)
        return false
    }
}
