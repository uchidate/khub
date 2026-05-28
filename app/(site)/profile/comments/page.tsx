import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MessageSquare, Newspaper, Clock, ChevronRight } from 'lucide-react'
import { PageTransition } from '@/components/features/PageTransition'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { getAllComments } from '@/lib/actions/user'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Meus Comentários' }

export default async function ProfileCommentsPage() {
    const session = await auth()
    if (!session) redirect('/auth/login?callbackUrl=/profile/comments')

    const comments = await getAllComments()
    if (!comments) return null

    return (
        <PageTransition className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
            <SectionHeader
                title="Comentários"
                backHref="/profile"
                backLabel="Perfil"
            />

            {comments.length === 0 ? (
                <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-sm">
                    <MessageSquare className="w-12 h-12 text-muted mx-auto mb-4" />
                    <p className="text-muted text-sm">Você ainda não fez nenhum comentário.</p>
                    <Link href="/blog" className="btn-primary mt-6 inline-block text-xs uppercase tracking-widest">
                        Ver Blog
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {comments.map((comment) => (
                        <Link
                            key={comment.id}
                            href={`/blog/${comment.blogPost.slug}`}
                            className="group flex gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-accent/40"
                        >
                            {comment.blogPost.coverImageUrl && (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
                                    <Image
                                        src={comment.blogPost.coverImageUrl}
                                        alt={comment.blogPost.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="64px"
                                    />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 mb-1.5">
                                    <Newspaper className="w-3 h-3 text-muted flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-muted truncate group-hover:text-foreground transition-colors leading-tight">
                                        {comment.blogPost.title}
                                    </p>
                                </div>
                                <p className="text-sm text-foreground group-hover:text-foreground transition-colors line-clamp-2">
                                    &ldquo;{comment.content}&rdquo;
                                </p>
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted mt-2">
                                    <Clock size={10} />
                                    {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors flex-shrink-0 self-center" />
                        </Link>
                    ))}
                </div>
            )}
        </PageTransition>
    )
}
