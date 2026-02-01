import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react"

export const dynamic = 'force-dynamic'

interface NewsDetailPageProps {
    params: {
        id: string
    }
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
    const news = await prisma.news.findUnique({
        where: { id: params.id }
    })

    if (!news) {
        notFound()
    }

    // Processar tags
    const tags = news.tags ? news.tags.split(',').map(t => t.trim()) : []

    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20 min-h-screen bg-black">
            <div className="max-w-4xl mx-auto">
                {/* Voltar */}
                <Link
                    href="/news"
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Voltar para notícias</span>
                </Link>

                {/* Hero Section */}
                <header className="mb-12">
                    <div className="flex flex-wrap gap-2 mb-6">
                        {tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 bg-purple-600/20 text-purple-400 border border-purple-500/20 text-[10px] font-black uppercase tracking-widest rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tighter text-white">
                        {news.title}
                    </h1>
                    <div className="flex items-center gap-6 text-zinc-500 border-b border-white/5 pb-8">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {new Date(news.publishedAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Imagem de Capa */}
                {news.imageUrl && (
                    <div className="aspect-video relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-12">
                        <Image
                            src={news.imageUrl}
                            alt={news.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                )}

                {/* Conteúdo */}
                <article className="prose prose-invert prose-purple max-w-none">
                    <div className="text-zinc-300 text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-medium">
                        {news.contentMd}
                    </div>
                </article>

                {/* Rodapé da Notícia */}
                <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="text-sm text-zinc-500 font-medium italic">
                        Fonte original: <span className="text-zinc-300 underline underline-offset-4">{new URL(news.sourceUrl).hostname}</span>
                    </div>
                    <a
                        href={news.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-purple-500 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl uppercase text-xs tracking-widest"
                    >
                        Ler notícia completa
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </footer>
            </div>
        </div>
    )
}
