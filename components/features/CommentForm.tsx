'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Send } from 'lucide-react'
import { useAuthGate } from '@/lib/hooks/useAuthGate'

interface CommentFormProps {
    newsId: string
    onCommentAdded: () => void
}

export function CommentForm({ newsId, onCommentAdded }: CommentFormProps) {
    const { data: session } = useSession()
    const openAuthGate = useAuthGate(s => s.open)
    const [content, setContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const maxLength = 1000
    const remaining = maxLength - content.length

    const handleGate = () => {
        if (!session) {
            openAuthGate('comentar')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!session) {
            openAuthGate('comentar')
            return
        }

        if (!content.trim()) {
            setError('O comentário não pode estar vazio')
            return
        }

        if (content.length > maxLength) {
            setError(`O comentário não pode ter mais de ${maxLength} caracteres`)
            return
        }

        setSubmitting(true)

        try {
            const response = await fetch(`/api/news/${newsId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            })

            const data = await response.json()

            if (response.ok) {
                setContent('')
                onCommentAdded()
            } else {
                setError(data.error || 'Erro ao enviar comentário')
            }
        } catch (error) {
            console.error('Erro ao enviar comentário:', error)
            setError('Erro ao enviar comentário. Tente novamente.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-zinc-900/50 rounded-lg p-4 border border-white/5">
            <div className="flex items-start gap-3">
                {/* User Avatar */}
                <div className="flex-shrink-0 pt-1">
                    {session?.user?.image ? (
                        <img
                            src={session.user.image}
                            alt={session.user.name || 'Você'}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-white/10 flex items-center justify-center text-zinc-500 font-medium text-sm">
                            {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                    )}
                </div>

                {/* Form */}
                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onClick={handleGate}
                        placeholder={session ? 'Escreva seu comentário...' : 'Entre ou crie uma conta para comentar...'}
                        className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors resize-none"
                        rows={3}
                        maxLength={maxLength}
                        disabled={submitting}
                        readOnly={!session}
                    />

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4">
                            {session && (
                                <span className={`text-sm ${remaining < 50 ? 'text-red-400' : 'text-zinc-500'}`}>
                                    {remaining} caracteres restantes
                                </span>
                            )}
                            {error && (
                                <span className="text-sm text-red-400">{error}</span>
                            )}
                        </div>

                        <button
                            type={session ? 'submit' : 'button'}
                            onClick={!session ? handleGate : undefined}
                            disabled={session ? (submitting || !content.trim() || content.length > maxLength) : false}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Comentar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}
