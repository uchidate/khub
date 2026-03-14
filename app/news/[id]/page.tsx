import prisma from "@/lib/prisma"
import { cache } from "react"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getRoleLabel } from "@/lib/utils/role-labels"
import { auth } from "@/lib/auth"
import { Calendar, ExternalLink, Clock, User } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { FavoriteButton } from "@/components/ui/FavoriteButton"
import { AdminQuickEdit } from "@/components/ui/AdminQuickEdit"
import { ShareButtons } from "@/components/ui/ShareButtons"
import { RelatedNews } from "@/components/features/RelatedNews"
import { ReadingProgressBar } from "@/components/ui/ReadingProgressBar"
import { ViewTracker } from "@/components/features/ViewTracker"
import { CommentsSection } from "@/components/features/CommentsSection"
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer"
import { BlockRenderer } from "@/components/ui/BlockRenderer"
import { AdBanner } from "@/components/ui/AdBanner"
import type { NewsBlock } from "@/lib/types/blocks"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { JsonLd } from "@/components/seo/JsonLd"
import type { Metadata } from "next"

const BASE_URL = 'https://www.hallyuhub.com.br'

// ISR: página cacheada 1h — revalidada sob demanda via revalidatePath no admin
export const revalidate = 3600

// React.cache deduplica a query dentro do mesmo render pass (generateMetadata + page)
const getNews = cache(async (id: string) => {
    return prisma.news.findUnique({
        where: { id },
        include: {
            artists: {
                include: {
                    artist: {
                        select: {
                            id: true,
                            nameRomanized: true,
                            nameHangul: true,
                            stageNames: true,
                            primaryImageUrl: true,
                            roles: true, gender: true
                        }
                    }
                }
            }
        }
    })
})

interface NewsDetailPageProps {
    params: Promise<{
        id: string
    }>
}

export async function generateMetadata(props: NewsDetailPageProps): Promise<Metadata> {
    const params = await props.params;
    const news = await getNews(params.id)

    if (!news) {
        return {
            title: 'Notícia não encontrada - HallyuHub',
            description: 'Esta notícia não foi encontrada em nossa base de dados.'
        }
    }

    const mainContent = news.contentMd ?? news.originalContent ?? ''
    const rawDescription = mainContent
        ? mainContent
            .replace(/#{1,6}\s+/g, '')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/\n+/g, ' ')
            .trim()
        : news.title
    const description = rawDescription.slice(0, 160)

    return {
        title: `${news.title} - HallyuHub`,
        description: description,
        alternates: {
            canonical: `${BASE_URL}/news/${params.id}`,
        },
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
            authors: ['HallyuHub'],
            url: `${BASE_URL}/news/${params.id}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: news.title,
            description: description,
            images: news.imageUrl ? [news.imageUrl] : []
        }
    }
}

export default async function NewsDetailPage(props: NewsDetailPageProps) {
    const params = await props.params;
    const session = await auth()
    const isAdmin = session?.user?.role?.toLowerCase() === 'admin'

    // Deduplica com generateMetadata via React.cache
    const news = await getNews(params.id)

    if (!news || news.isHidden || news.status !== 'published') {
        notFound()
    }

    // Processar tags
    const tags = news.tags || []

    // Separar artistas em protagonistas (mencionados no título) vs secundários (só no corpo)
    const titleLower = news.title.toLowerCase()
    const isProtagonist = (artist: { nameRomanized: string; nameHangul: string | null; stageNames: string[] }) => {
        if (titleLower.includes(artist.nameRomanized.toLowerCase())) return true
        if (artist.nameHangul && titleLower.includes(artist.nameHangul.toLowerCase())) return true
        return artist.stageNames.some(s => titleLower.includes(s.toLowerCase()))
    }
    const protagonistArtists = news.artists.filter(({ artist }) => isProtagonist(artist))
    const secondaryArtists   = news.artists.filter(({ artist }) => !isProtagonist(artist))

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

    const mainContent = news.contentMd ?? news.originalContent ?? ''

    // Dramabeans: Drama Hangout e Open Thread são posts de discussão sem corpo de artigo
    const isDiscussionPost =
        news.source === 'Dramabeans' &&
        /drama-hangout|open-thread/i.test(news.sourceUrl)

    // Calcular tempo de leitura (média de 200 palavras por minuto)
    const wordCount = mainContent.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)

    const articleDescription = mainContent
        ? mainContent.replace(/#{1,6}\s+/g, '').replace(/\*\*?([^*]+)\*\*?/g, '$1').replace(/\n+/g, ' ').trim().slice(0, 300)
        : news.title

    return (
        <>
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": news.title,
                "description": articleDescription,
                "image": news.imageUrl ? [news.imageUrl] : undefined,
                "datePublished": news.publishedAt.toISOString(),
                "dateModified": news.publishedAt.toISOString(),
                "url": `${BASE_URL}/news/${news.id}`,
                "inLanguage": "pt-BR",
                "publisher": {
                    "@type": "Organization",
                    "name": "HallyuHub",
                    "logo": { "@type": "ImageObject", "url": `${BASE_URL}/og-image.jpg` },
                },
                "author": { "@type": "Organization", "name": "HallyuHub" },
                ...(news.tags?.length ? { "keywords": news.tags.join(', ') } : {}),
            }} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Notícias", "item": `${BASE_URL}/news` },
                    { "@type": "ListItem", "position": 2, "name": news.title, "item": `${BASE_URL}/news/${news.id}` },
                ],
            }} />
            <ReadingProgressBar />
            <ViewTracker newsId={news.id} />
            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20 min-h-screen bg-black">
                <div className="max-w-4xl mx-auto">
                {/* Breadcrumbs */}
                <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                    <Breadcrumbs items={[
                        { label: 'Notícias', href: '/news' },
                        { label: news.title }
                    ]} />
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                        <AdminQuickEdit href={`/admin/news/${news.id}/edit?returnTo=${encodeURIComponent(`/news/${news.id}`)}`} label="Editar blocos" />
                        <AdminQuickEdit href={`/admin/news/${news.id}?returnTo=${encodeURIComponent(`/news/${news.id}`)}`} label="Editar" />
                        <FavoriteButton
                            id={news.id}
                            itemName={news.title}
                            itemType="notícia"
                            className="bg-zinc-900/50 backdrop-blur-sm hover:bg-zinc-900/70"
                        />
                    </div>
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

                {/* Ad: topo do artigo */}
                <AdBanner
                    slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_NEWS_ARTICLE_TOP ?? ''}
                    format="horizontal"
                    className="mb-10"
                />

                {/* Conteúdo */}
                <article className="max-w-none">
                    {isDiscussionPost ? (
                        <div className="py-10 flex flex-col items-center text-center gap-4">
                            <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
                                Este é um post de discussão do Dramabeans. O conteúdo principal são os comentários dos fãs, disponíveis no site original.
                            </p>
                            <a
                                href={news.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                            >
                                Participar da discussão no Dramabeans
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    ) : Array.isArray((news as unknown as { blocks: unknown }).blocks) && ((news as unknown as { blocks: NewsBlock[] }).blocks).length > 0 ? (
                        <BlockRenderer blocks={(news as unknown as { blocks: NewsBlock[] }).blocks} />
                    ) : (
                        <MarkdownRenderer content={mainContent} coverImageUrl={news.imageUrl ?? undefined} source={news.source} />
                    )}
                </article>

                {/* Artistas — após o conteúdo */}
                {news.artists.length > 0 && (
                    <section className="mt-12 pt-10 border-t border-white/5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-5 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" />
                            {protagonistArtists.length > 0 ? 'Artistas nesta notícia' : 'Artistas mencionados'}
                        </h2>

                        {/* Protagonistas — mencionados no título */}
                        {protagonistArtists.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-5">
                                {protagonistArtists.slice(0, 6).map(({ artist }) => (
                                    <Link
                                        key={artist.id}
                                        href={`/artists/${artist.id}`}
                                        className="group flex items-center gap-3 px-4 py-2.5 rounded-full bg-zinc-900/70 hover:bg-zinc-800 border border-white/8 hover:border-purple-500/40 transition-all"
                                    >
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800 ring-1 ring-purple-500/30 group-hover:ring-purple-500/60 transition-all shrink-0">
                                            {artist.primaryImageUrl ? (
                                                <Image
                                                    src={artist.primaryImageUrl}
                                                    alt={artist.nameRomanized}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xs">
                                                    {artist.nameRomanized[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors leading-none">
                                                {artist.nameRomanized}
                                            </p>
                                            {artist.roles && artist.roles.length > 0 && (
                                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                                    {getRoleLabel(artist.roles[0], artist.gender)}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Secundários — apenas mencionados no corpo */}
                        {secondaryArtists.length > 0 && (
                            <div className={protagonistArtists.length > 0 ? 'pt-3 border-t border-white/5' : ''}>
                                {protagonistArtists.length > 0 && (
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3 mt-3">
                                        Também mencionados
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {secondaryArtists.slice(0, 12).map(({ artist }) => (
                                        <Link
                                            key={artist.id}
                                            href={`/artists/${artist.id}`}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/5 hover:border-zinc-600 hover:bg-zinc-800 transition-all group text-xs text-zinc-400 hover:text-zinc-200"
                                        >
                                            <div className="relative w-4 h-4 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                                                {artist.primaryImageUrl ? (
                                                    <Image
                                                        src={artist.primaryImageUrl}
                                                        alt={artist.nameRomanized}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center text-white font-bold text-[7px]">
                                                        {artist.nameRomanized[0]}
                                                    </div>
                                                )}
                                            </div>
                                            {artist.nameRomanized}
                                        </Link>
                                    ))}
                                    {secondaryArtists.length > 12 && (
                                        <span className="flex items-center px-2.5 py-1 rounded-full bg-zinc-900 border border-white/5 text-xs text-zinc-600">
                                            +{secondaryArtists.length - 12} mais
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Ad: após artigo */}
                <AdBanner
                    slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_NEWS_ARTICLE_BOTTOM ?? ''}
                    format="rectangle"
                    className="mt-10"
                />

                {/* Compartilhamento */}
                <div className="mt-12 p-6 rounded-2xl bg-zinc-900/50 border border-white/10">
                    <ShareButtons
                        title={news.title}
                        url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hallyuhub.com.br'}/news/${news.id}`}
                    />
                </div>

                {/* Rodapé da Notícia — visível apenas para admins */}
                {isAdmin && (() => {
                    let hostname = news.sourceUrl
                    try { hostname = new URL(news.sourceUrl).hostname.replace(/^www\./, '') } catch { /* keep raw */ }
                    return (
                        <footer className="mt-12">
                            <a
                                href={news.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-between gap-4 px-6 py-5 rounded-2xl bg-zinc-900/60 border border-white/8 hover:border-purple-500/30 hover:bg-zinc-900 transition-all"
                            >
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Fonte original</p>
                                    <p className="text-base font-bold text-zinc-200 group-hover:text-purple-300 transition-colors">{news.source || hostname}</p>
                                    <p className="text-xs text-zinc-600 mt-0.5">{hostname}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-full border border-white/10 group-hover:border-purple-500/40 transition-all text-xs font-semibold text-zinc-400 group-hover:text-purple-300">
                                    Ler original
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </div>
                            </a>
                        </footer>
                    )
                })()}

                {/* Seção de Comentários */}
                <CommentsSection newsId={news.id} />

                {/* Notícias Relacionadas */}
                <RelatedNews news={relatedNews} />
            </div>
        </div>
        <ScrollToTop />
        </>
    )
}
