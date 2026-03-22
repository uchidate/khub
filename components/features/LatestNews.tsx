import Image from 'next/image'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'

interface NewsItem {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: string
    excerpt: string
}

interface LatestNewsProps {
    news: NewsItem[]
}

export function LatestNews({ news }: LatestNewsProps) {
    if (news.length === 0) return null

    return (
        <section>
            {/* Header compacto */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-neon-pink/15 rounded-lg">
                        <Newspaper className="w-4 h-4 text-neon-pink" />
                    </div>
                    <h2 className="text-xl font-black dark:text-white text-foreground uppercase tracking-tight">
                        Últimas do Hallyu
                    </h2>
                </div>
                <Link
                    href="/news"
                    className="text-xs font-black text-muted hover:text-white uppercase tracking-widest transition-colors hidden sm:block"
                >
                    Ver todas →
                </Link>
            </div>

            {/* Grid de 3 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {news.map((item) => (
                    <Link
                        key={item.id}
                        href={`/news/${item.id}`}
                        className="group flex flex-col rounded-2xl overflow-hidden dark:bg-[#080808]/60 bg-[#fafafa] dark:border-white/5 border border-border dark:hover:border-white/15 hover:border-border transition-all hover:-translate-y-0.5"
                    >
                        {/* Imagem */}
                        <div className="relative aspect-video overflow-hidden dark:bg-[#1a1a1a] bg-[#f0f0f0]">
                            {item.imageUrl ? (
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
                            )}
                        </div>

                        {/* Texto */}
                        <div className="p-4 flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff2d78]">
                                {new Date(item.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <h3 className="text-sm font-bold dark:text-white text-foreground group-hover:text-neon-pink transition-colors leading-snug line-clamp-2">
                                {item.title}
                            </h3>
                            {item.excerpt && (
                                <p className="text-[11px] dark:text-muted text-[#444] line-clamp-2 leading-relaxed">
                                    {item.excerpt}
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Ver todas mobile */}
            <div className="mt-4 sm:hidden text-center">
                <Link
                    href="/news"
                    className="text-xs font-black text-muted hover:text-white uppercase tracking-widest transition-colors"
                >
                    Ver todas as notícias →
                </Link>
            </div>
        </section>
    )
}
