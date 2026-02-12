import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Calendar, ExternalLink, Clock, User } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { FavoriteButton } from "@/components/ui/FavoriteButton"
import { ShareButtons } from "@/components/ui/ShareButtons"
import { RelatedNews } from "@/components/features/RelatedNews"
import { ReadingProgressBar } from "@/components/ui/ReadingProgressBar"
import { CommentsSection } from "@/components/features/CommentsSection"
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer"
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
        where: { id: params.id },
        include: {
            artists: {
                include: {
                    artist: {
                        select: {
                            id: true,
                            nameRomanized: true,
                            primaryImageUrl: true,
                            roles: true
                        }
                    }
                }
            }
        }
    })

    if (!news) {
        notFound()
    }

    // Processar tags
    const tags = news.tags || []

    // Extrair IDs dos artistas para buscar notícias relacionadas
    const artistIds = news.artists.map(a => a.artist.id)

    // Buscar notícias relacionadas (mesmos artistas ou mesmas tags)
    const relatedNews = await prisma.news.findMany({
        where: {
            id: { not: params.id },
            OR: [
                // Mesmos artistas
                artistIds.length > 0 ? {
                    artists: {
                        some: {
                            artistId: { in: artistIds }
                        }
                    }
                } : {},
                // Mesmas tags
                tags.length > 0 ? {
                    tags: {
                        hasSome: tags
                    }
                } : {}
            ]
        },
        take: 3,
        orderBy: { publishedAt: 'desc' },
        select: {
            id: true,
            title: true,
            imageUrl: true,
            publishedAt: true,
            tags: true
        }
    })

    // Calcular tempo de leitura (média de 200 palavras por minuto)
    const wordCount = news.contentMd.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)

    return (
        <>
            <ReadingProgressBar />
            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20 min-h-screen bg-black">
                <div className="max-w-4xl mx-auto">
                {/* Breadcrumbs */}
                <div className="mb-8 flex justify-between items-start">
                    <Breadcrumbs items={[
                        { label: 'Notícias', href: '/news' },
                        { label: news.title }
                    ]} />
                    <FavoriteButton
                        id={news.id}
                        itemName={news.title}
                        itemType="notícia"
                        className="bg-zinc-900/50 backdrop-blur-sm hover:bg-zinc-900/70"
                    />
                </div>

                {/* Hero Section */}
                <header className="mb-12">
                    <div className="flex flex-wrap gap-2 mb-6">
                        {tags.map((tag) => (
                            <Link
                                key={tag}
                                href={`/news?search=${encodeURIComponent(tag)}`}
                                className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/20 hover:border-purple-500/40 text-xs font-black uppercase tracking-widest rounded-full transition-all hover:scale-105 active:scale-95"
                            >
                                {tag}
                            </Link>
                        ))}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tighter text-white">
                        {news.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-zinc-500 border-b border-white/5 pb-8">
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
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {readingTime} min de leitura
                            </span>
                        </div>
                        {news.artists.length > 0 && (
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {news.artists.length} artista{news.artists.length > 1 ? 's' : ''} mencionado{news.artists.length > 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
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

                {/* Artistas Mencionados */}
                {news.artists.length > 0 && (
                    <section className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-purple-900/10 to-pink-900/10 border border-purple-500/20">
                        <h2 className="text-sm font-black uppercase tracking-wider text-purple-400 mb-4 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Artistas Mencionados
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {news.artists.map(({ artist }) => (
                                <Link
                                    key={artist.id}
                                    href={`/artists/${artist.id}`}
                                    className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-purple-500/30 transition-all hover:scale-105"
                                >
                                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-zinc-800 ring-2 ring-purple-500/20 group-hover:ring-purple-500/50 transition-all">
                                        {artist.primaryImageUrl ? (
                                            <Image
                                                src={artist.primaryImageUrl}
                                                alt={artist.nameRomanized}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xl">
                                                {artist.nameRomanized[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                                            {artist.nameRomanized}
                                        </p>
                                        {artist.roles && artist.roles.length > 0 && (
                                            <p className="text-xs text-zinc-500 mt-1">
                                                {artist.roles[0]}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Conteúdo */}
                <article className="prose prose-invert prose-purple max-w-none text-zinc-300 text-lg md:text-xl leading-relaxed">
                    <MarkdownRenderer content={news.contentMd} />
                </article>

                {/* Compartilhamento */}
                <div className="mt-12 p-6 rounded-2xl bg-zinc-900/50 border border-white/10">
                    <ShareButtons
                        title={news.title}
                        url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hallyuhub.com.br'}/news/${news.id}`}
                    />
                </div>

                {/* Rodapé da Notícia */}
                <footer className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="text-sm text-zinc-500 font-medium italic">
                        Fonte original: <span className="text-zinc-300 underline underline-offset-4">{(() => { try { return new URL(news.sourceUrl).hostname } catch { return news.sourceUrl } })()}</span>
                    </div>
                    <a
                        href={news.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-purple-500 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl uppercase text-xs tracking-widest"
                    >
                        Ver fonte original
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </footer>

                {/* Seção de Comentários */}
                <CommentsSection newsId={news.id} />

                {/* Notícias Relacionadas */}
                <RelatedNews news={relatedNews} />
            </div>
        </div>
        </>
    )
}
