'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'

interface Comment {
    id: string
    content: string
    createdAt: string
    user: {
        id: string
        name: string | null
        image: string | null
        role: string | null
    }
}

interface CommentsListProps {
    newsId: string
    onCommentAdded?: number
}

export function CommentsList({ newsId, onCommentAdded }: CommentsListProps) {
    const { data: session } = useSession()
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState<string | null>(null)

    const fetchComments = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/news/${newsId}/comments`)
            const data = await response.json()
            setComments(data.comments || [])
        } catch (error) {
            console.error('Erro ao buscar comentários:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchComments()
    }, [newsId, onCommentAdded])

    const handleDelete = async (commentId: string) => {
        if (!confirm('Tem certeza que deseja deletar este comentário?')) return

        setDeleting(commentId)
        try {
            const response = await fetch(`/api/news/${newsId}/comments?commentId=${commentId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setComments(comments.filter(c => c.id !== commentId))
            } else {
                const data = await response.json()
                alert(data.error || 'Erro ao deletar comentário')
            }
        } catch (error) {
            console.error('Erro ao deletar comentário:', error)
            alert('Erro ao deletar comentário')
        } finally {
            setDeleting(null)
        }
    }

    const canDelete = (comment: Comment) => {
        if (!session?.user) return false
        return session.user.email === comment.user.id || session.user.role === 'admin'
    }

    const getRoleBadgeColor = (role: string | null) => {
        if (role === 'admin') return 'bg-red-500/20 text-red-400 border-red-500/30'
        if (role === 'moderator') return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        return 'bg-zinc-700/30 text-zinc-400 border-zinc-600/30'
    }

    const getRoleLabel = (role: string | null) => {
        if (role === 'admin') return 'Admin'
        if (role === 'moderator') return 'Moderador'
        return 'Membro'
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-zinc-900/50 rounded-lg p-4 border border-white/5 animate-pulse">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-zinc-800 rounded w-32" />
                                <div className="h-3 bg-zinc-800 rounded w-full" />
                                <div className="h-3 bg-zinc-800 rounded w-3/4" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (comments.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-zinc-400">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {comments.map(comment => (
                <div
                    key={comment.id}
                    className="bg-zinc-900/50 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-colors"
                >
                    <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {comment.user.image ? (
                                <img
                                    src={comment.user.image}
                                    alt={comment.user.name || 'Usuário'}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                                    {(comment.user.name || 'U')[0].toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-medium text-white">
                                    {comment.user.name || 'Usuário Anônimo'}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full border ${getRoleBadgeColor(comment.user.role)}`}>
                                    {getRoleLabel(comment.user.role)}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {formatDistanceToNow(new Date(comment.createdAt), {
                                        addSuffix: true,
                                        locale: ptBR
                                    })}
                                </span>
                            </div>

                            {/* Comment text */}
                            <p className="text-zinc-300 whitespace-pre-wrap break-words">
                                {comment.content}
                            </p>
                        </div>

                        {/* Delete button */}
                        {canDelete(comment) && (
                            <button
                                onClick={() => handleDelete(comment.id)}
                                disabled={deleting === comment.id}
                                className="flex-shrink-0 p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Deletar comentário"
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
