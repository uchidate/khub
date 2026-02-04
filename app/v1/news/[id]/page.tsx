import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import type { Metadata } from "next"

export const dynamic = 'force-dynamic'

interface NewsDetailPageProps {
    params: {
        id: string
    }
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
    const news = await prisma.news.findUnique({
        where: { id: params.id }
    })

    if (!news) {
        return {
            title: 'Notícia não encontrada - HallyuHub',
            description: 'Esta notícia não foi encontrada em nossa base de dados.'
        }
    }

    const description = news.contentMd ? news.contentMd.slice(0, 160) : news.title
    const publishedDate = new Date(news.publishedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })

    return {
        title: `${news.title} - HallyuHub`,
        description: description,
        openGraph: {
            title: news.title,
            description: description,
            images: news.imageUrl ? [{
                url: news.imageUrl,
                width: 1200,
                height: 630,
                alt: news.title
            }] : [],
            type: 'article',
            publishedTime: news.publishedAt.toISOString(),
            authors: ['HallyuHub']
        },
        twitter: {
            card: 'summary_large_image',
            title: news.title,
            description: description,
            images: news.imageUrl ? [news.imageUrl] : []
        }
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
    const tags = news.tags || []

    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20 min-h-screen bg-black">
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumbs */}
                <div className="mb-8">
                    <Breadcrumbs items={[
                        { label: 'Notícias', href: '/v1/news' },
                        { label: news.title }
                    ]} />
                </div>

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
