'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Send } from 'lucide-react'
import { useAuthGate } from '@/lib/hooks/useAuthGate'

interface CommentFormProps {
    blogPostSlug: string
    onCommentAdded: () => void
}

export function CommentForm({ blogPostSlug, onCommentAdded }: CommentFormProps) {
    const { data: session } = useSession()
    const openAuthGate = useAuthGate(s => s.open)
    const [content, setContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const maxLength = 1000
    const remaining = maxLength - content.length

    const handleGate = () => { if (!session) openAuthGate('comentar') }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (!session) { openAuthGate('comentar'); return }
        if (!content.trim()) { setError('O comentário não pode estar vazio'); return }
        if (content.length > maxLength) { setError(`Máximo de ${maxLength} caracteres`); return }

        setSubmitting(true)
        try {
            const res = await fetch(`/api/blog/${blogPostSlug}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            })
            const data = await res.json()
            if (res.ok) { setContent(''); onCommentAdded() }
            else setError(data.error || 'Erro ao enviar comentário')
        } catch {
            setError('Erro ao enviar comentário. Tente novamente.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl p-4 border border-border">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-1">
                    {session?.user?.image ? (
                        <Image src={session.user.image} alt={session.user.name || 'Você'} width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-medium text-sm">
                            {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        onClick={handleGate}
                        placeholder={session ? 'Escreva seu comentário...' : 'Entre ou crie uma conta para comentar...'}
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted/60 focus:outline-none focus:border-accent transition-colors resize-none"
                        rows={3}
                        maxLength={maxLength}
                        disabled={submitting}
                        readOnly={!session}
                    />
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4">
                            {session && (
                                <span className={`text-small ${remaining < 50 ? 'text-red-400' : 'text-muted'}`}>
                                    {remaining} caracteres restantes
                                </span>
                            )}
                            {error && <span className="text-small text-red-400">{error}</span>}
                        </div>
                        <button
                            type={session ? 'submit' : 'button'}
                            onClick={!session ? handleGate : undefined}
                            disabled={session ? (submitting || !content.trim() || content.length > maxLength) : false}
                            className="px-4 py-2 bg-accent text-white rounded-full hover:bg-accent-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-small font-bold"
                        >
                            {submitting ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</>
                            ) : (
                                <><Send className="w-4 h-4" />Comentar</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}
