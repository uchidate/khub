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
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20 max-w-3xl mx-auto">
            <SectionHeader
                title="Comentários"
                backHref="/profile"
                backLabel="Perfil"
            />

            {comments.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 text-sm">Você ainda não fez nenhum comentário.</p>
                    <Link href="/news" className="btn-primary mt-6 inline-block text-xs uppercase tracking-widest">
                        Ver Notícias
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {comments.map((comment) => (
                        <Link
                            key={comment.id}
                            href={`/news/${comment.news.id}`}
                            className="glass-card flex gap-4 p-4 hover:border-white/15 transition-all group"
                        >
                            {comment.news.imageUrl && (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                                    <Image
                                        src={comment.news.imageUrl}
                                        alt={comment.news.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="64px"
                                    />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 mb-1.5">
                                    <Newspaper className="w-3 h-3 text-zinc-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-400 transition-colors leading-tight">
                                        {comment.news.title}
                                    </p>
                                </div>
                                <p className="text-sm text-zinc-300 group-hover:text-white transition-colors line-clamp-2">
                                    &ldquo;{comment.content}&rdquo;
                                </p>
                                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600 mt-2">
                                    <Clock size={10} />
                                    {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0 self-center" />
                        </Link>
                    ))}
                </div>
            )}
        </PageTransition>
    )
}
