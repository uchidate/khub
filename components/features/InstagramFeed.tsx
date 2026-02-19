import Image from 'next/image'
import { Instagram, ExternalLink } from 'lucide-react'

interface InstagramPost {
    id: string
    imageUrl: string | null
    caption: string | null
    permalink: string
    postedAt: Date | string
}

interface InstagramFeedProps {
    posts: InstagramPost[]
    instagramUrl?: string | null  // link direto para o perfil
}

function timeAgo(date: Date | string): string {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (diff < 3600) return `${Math.floor(diff / 60)}min`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d`
    return `${Math.floor(diff / 2592000)}sem`
}

export function InstagramFeed({ posts, instagramUrl }: InstagramFeedProps) {
    if (posts.length === 0) return null

    return (
        <section>
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 rounded-xl">
                        <Instagram className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white">Posts do Instagram</h2>
                        <p className="text-zinc-500 text-xs mt-0.5">Publicações mais recentes</p>
                    </div>
                </div>
                {instagramUrl && (
                    <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-pink-400 hover:text-pink-300 font-bold text-sm transition-colors"
                    >
                        Ver perfil <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {posts.map((post) => (
                    <a
                        key={post.id}
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-pink-500/40 transition-all"
                    >
                        {post.imageUrl ? (
                            <Image
                                src={post.imageUrl}
                                alt={post.caption?.slice(0, 60) ?? 'Instagram post'}
                                fill
                                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 17vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-900/40 to-orange-900/40">
                                <Instagram className="w-6 h-6 text-pink-500/50" />
                            </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-end p-2">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity w-full">
                                {post.caption && (
                                    <p className="text-white text-[10px] line-clamp-2 leading-tight mb-1">
                                        {post.caption}
                                    </p>
                                )}
                                <span className="text-zinc-400 text-[9px] font-bold">
                                    {timeAgo(post.postedAt)} atrás
                                </span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    )
}
