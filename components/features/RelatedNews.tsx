import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

interface NewsItem {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: Date
    tags: string[]
}

interface RelatedNewsProps {
    news: NewsItem[]
}

export function RelatedNews({ news }: RelatedNewsProps) {
    if (news.length === 0) {
        return null
    }

    return (
        <section className="mt-20 pt-12 border-t border-white/10">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                    Notícias Relacionadas
                </h2>
                <Link
                    href="/news"
                    className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-purple-400 transition-colors"
                >
                    Ver todas
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {news.map((item) => (
                    <Link
                        key={item.id}
                        href={`/news/${item.id}`}
                        className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all hover:scale-[1.02] bg-zinc-900/50 backdrop-blur-sm"
                    >
                        {/* Imagem */}
                        <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
                            {item.imageUrl ? (
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-pink-900/20" />
                            )}
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        </div>

                        {/* Conteúdo */}
                        <div className="p-5">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {item.tags?.slice(0, 2).map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-purple-500/20 text-purple-300 rounded"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2 mb-2">
                                {item.title}
                            </h3>

                            <time className="text-xs text-zinc-500 font-medium">
                                {new Date(item.publishedAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </time>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
