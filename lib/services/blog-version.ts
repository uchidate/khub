import prisma from '@/lib/prisma'

const MAX_UNPINNED_VERSIONS = 50

interface SnapshotOptions {
    savedById: string
    note?: string
    label?: string
    pinned?: boolean
}

/**
 * Cria um snapshot do estado atual de um BlogPost na tabela BlogPostVersion.
 * Pode ser chamado de qualquer lugar: API routes, scripts admin, db-fixes, etc.
 * Trimeia automaticamente versões não-pinadas que excedam MAX_UNPINNED_VERSIONS.
 *
 * Uso padrão antes de qualquer mutação destrutiva:
 *   await snapshotPost(postId, { savedById: ADMIN_USER_ID, note: 'pre-sql-fix' })
 */
export async function snapshotPost(postId: string, opts: SnapshotOptions): Promise<string | null> {
    const post = await prisma.blogPost.findUnique({
        where: { id: postId },
        select: { title: true, excerpt: true, contentMd: true, blocks: true },
    })
    if (!post) return null

    const version = await prisma.blogPostVersion.create({
        data: {
            blogPostId: postId,
            title: post.title,
            excerpt: post.excerpt,
            contentMd: post.contentMd,
            blocks: post.blocks as object ?? undefined,
            savedById: opts.savedById,
            note: opts.note ?? null,
            label: opts.label ?? null,
            pinned: opts.pinned ?? false,
        },
    })

    // Trim non-pinned versions exceeding the cap
    const excess = await prisma.blogPostVersion.findMany({
        where: { blogPostId: postId, pinned: false },
        orderBy: { savedAt: 'desc' },
        skip: MAX_UNPINNED_VERSIONS,
        select: { id: true },
    })
    if (excess.length > 0) {
        await prisma.blogPostVersion.deleteMany({ where: { id: { in: excess.map(v => v.id) } } })
    }

    return version.id
}

/**
 * Cria snapshot usando o ADMIN_USER_ID fixo (para scripts e operações sem sessão).
 */
export const ADMIN_USER_ID = 'f6c14838-660b-4c77-9d06-32c30e4de7d5'

export async function snapshotPostAsAdmin(postId: string, note: string, opts?: { label?: string; pinned?: boolean }) {
    return snapshotPost(postId, { savedById: ADMIN_USER_ID, note, ...opts })
}
