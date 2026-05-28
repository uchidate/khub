'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'

interface Comment {
    id: string
    content: string
    createdAt: string
    user: { id: string; name: string | null; image: string | null; role: string | null }
}

interface CommentsListProps {
    blogPostSlug: string
    refreshKey?: number
}

export function CommentsList({ blogPostSlug, refreshKey }: CommentsListProps) {
    const { data: session } = useSession()
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        fetch(`/api/blog/${blogPostSlug}/comments`)
            .then(r => r.json())
            .then(d => setComments(d.comments || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [blogPostSlug, refreshKey])

    const handleDelete = async (commentId: string) => {
        if (!confirm('Tem certeza que deseja deletar este comentário?')) return
        setDeleting(commentId)
        try {
            const res = await fetch(`/api/blog/${blogPostSlug}/comments?commentId=${commentId}`, { method: 'DELETE' })
            if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId))
            else { const d = await res.json(); alert(d.error || 'Erro ao deletar') }
        } catch { alert('Erro ao deletar comentário') }
        finally { setDeleting(null) }
    }

    const canDelete = (c: Comment) => !!session?.user && (session.user.id === c.user.id || session.user.role === 'admin')

    const roleBadgeClass = (role: string | null) => {
        if (role === 'admin') return 'bg-red-500/20 text-red-400 border-red-500/30'
        if (role === 'moderator') return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        return 'bg-surface/30 text-muted border-border/30'
    }
    const roleLabel = (role: string | null) => role === 'admin' ? 'Admin' : role === 'moderator' ? 'Moderador' : 'Membro'

    if (loading) return (
        <div className="space-y-4">
            {[1,2,3].map(i => (
                <div key={i} className="bg-surface rounded-lg p-4 border border-border animate-pulse">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-skeleton" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-skeleton rounded w-32" />
                            <div className="h-3 bg-skeleton rounded w-full" />
                            <div className="h-3 bg-skeleton rounded w-3/4" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )

    if (comments.length === 0) return (
        <div className="text-center py-12">
            <p className="text-muted">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
        </div>
    )

    return (
        <div className="space-y-4">
            {comments.map(comment => (
                <div key={comment.id} className="bg-surface rounded-lg p-4 border border-border hover:border-border-strong transition-colors">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            {comment.user.image ? (
                                <Image src={comment.user.image} alt={comment.user.name || 'Usuário'} width={40} height={40} className="rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-medium">
                                    {(comment.user.name || 'U')[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-medium text-foreground">{comment.user.name || 'Usuário Anônimo'}</span>
                                <span className={`px-2 py-0.5 text-caption rounded-full border ${roleBadgeClass(comment.user.role)}`}>
                                    {roleLabel(comment.user.role)}
                                </span>
                                <span className="text-caption text-muted">
                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ptBR })}
                                </span>
                            </div>
                            <p className="text-foreground text-body whitespace-pre-wrap break-words">{comment.content}</p>
                        </div>
                        {canDelete(comment) && (
                            <button
                                onClick={() => handleDelete(comment.id)}
                                disabled={deleting === comment.id}
                                className="flex-shrink-0 p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
