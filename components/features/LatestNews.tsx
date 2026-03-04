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
        <section className="relative">
            <div className="absolute -inset-10 bg-cyber-purple/10 blur-[100px] rounded-full z-0 pointer-events-none" />
            <div className="relative z-10 glass-card p-8 md:p-12 dark:border-white/10 dark:bg-black/60">
                <div className="flex flex-col md:flex-row gap-12">
                    <div className="md:w-1/3">
                        <div className="flex items-center gap-2 text-neon-pink font-black uppercase tracking-widest text-xs mb-4">
                            <Newspaper size={14} /> News Feed
                        </div>
                        <h2 className="text-4xl md:text-6xl font-display font-black dark:text-white text-zinc-900 italic tracking-tighter leading-none mb-6">
                            ÚLTIMAS<br />
                            DO HALLYU
                        </h2>
                        <p className="dark:text-zinc-400 text-zinc-600 text-sm leading-relaxed mb-8">
                            Fique por dentro dos comebacks, lançamentos de dramas e notícias exclusivas da indústria.
                        </p>
                        <Link
                            href="/news"
                            className="btn-primary text-xs uppercase tracking-widest hover:shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105 active:scale-95"
                        >
                            Ler Todas
                        </Link>
                    </div>

                    <div className="md:w-2/3 grid gap-4">
                        {news.map((item) => (
                            <Link
                                key={item.id}
                                href={`/news/${item.id}`}
                                className="group flex flex-col md:flex-row gap-6 p-6 rounded-2xl dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/5 dark:hover:border-white/20 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 transition-all hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1"
                            >
                                <div className="relative w-full md:w-32 aspect-video rounded-lg overflow-hidden dark:bg-zinc-800 bg-zinc-200 flex-shrink-0">
                                    {item.imageUrl ? (
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full dark:bg-zinc-800 bg-zinc-300" />
                                    )}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <span className="text-[10px] text-cyber-purple font-black uppercase tracking-widest mb-2">
                                        {new Date(item.publishedAt).toLocaleDateString('pt-BR')}
                                    </span>
                                    <h3 className="text-lg font-bold dark:text-white text-zinc-900 group-hover:text-neon-pink transition-colors leading-tight mb-2">
                                        {item.title}
                                    </h3>
                                    {item.excerpt && (
                                        <p className="text-xs dark:text-zinc-500 text-zinc-600 line-clamp-2 md:line-clamp-1">
                                            {item.excerpt}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
