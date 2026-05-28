'use client'

import { useState } from 'react'
import { CommentForm } from './CommentForm'
import { CommentsList } from './CommentsList'
import { MessageSquare } from 'lucide-react'

interface CommentsSectionProps {
    blogPostSlug: string
}

export function CommentsSection({ blogPostSlug }: CommentsSectionProps) {
    const [refreshKey, setRefreshKey] = useState(0)

    return (
        <section className="mt-12 pt-12 border-t border-border">
            <div className="mb-6 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-accent" />
                <h2 className="text-title font-black text-foreground">
                    Comentários
                </h2>
            </div>

            <div className="mb-8">
                <CommentForm blogPostSlug={blogPostSlug} onCommentAdded={() => setRefreshKey(k => k + 1)} />
            </div>

            <CommentsList blogPostSlug={blogPostSlug} refreshKey={refreshKey} />
        </section>
    )
}
