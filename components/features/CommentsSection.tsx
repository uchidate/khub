'use client'

import { useState } from 'react'
import { CommentForm } from './CommentForm'
import { CommentsList } from './CommentsList'
import { MessageSquare } from 'lucide-react'

interface CommentsSectionProps {
    newsId: string
}

export function CommentsSection({ newsId }: CommentsSectionProps) {
    const [refreshKey, setRefreshKey] = useState(0)

    const handleCommentAdded = () => {
        // Força o CommentsList a recarregar
        setRefreshKey(prev => prev + 1)
    }

    return (
        <section className="mt-12 pt-12 border-t border-white/10">
            <div className="mb-6 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl md:text-3xl font-black text-white">
                    Comentários
                </h2>
            </div>

            {/* Formulário de novo comentário */}
            <div className="mb-8">
                <CommentForm newsId={newsId} onCommentAdded={handleCommentAdded} />
            </div>

            {/* Lista de comentários */}
            <CommentsList
                newsId={newsId}
                onCommentAdded={refreshKey}
            />
        </section>
    )
}
