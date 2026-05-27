import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Pencil } from 'lucide-react'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
import { BlockRenderer } from '@/components/ui/BlockRenderer'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import type { NewsBlock } from '@/lib/types/blocks'

const SOURCE_COLORS: Record<string, string> = {
    Soompi: '#6366f1',
    Koreaboo: '#ec4899',
    Dramabeans: '#f59e0b',
    'Asian Junkie': '#10b981',
    HelloKpop: '#0ea5e9',
    Kpopmap: '#8b5cf6',
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(date))
}

export default async function NewsPreviewPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const news = await prisma.news.findUnique({
        where: { id },
        include: { artists: { include: { artist: { select: { id: true, nameRomanized: true } } } } },
    })

    if (!news) notFound()

    const sourceColor = news.source ? (SOURCE_COLORS[news.source] ?? '#9ca3af') : '#9ca3af'
    const hasBlocks = Array.isArray(news.blocks) && (news.blocks as unknown[]).length > 0

    return (
        <div className="min-h-screen bg-background">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 py-3 gap-3">
                <Link
                    href="/admin/news"
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-muted hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={14} />
                    Voltar
                </Link>
                <div className="flex items-center gap-2">
                    <Link
                        href={news.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-muted hover:text-accent transition-colors"
                    >
                        <ExternalLink size={13} />
                        Fonte original
                    </Link>
                    <Link
                        href={`/admin/news/${id}/edit`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-[12px] font-bold rounded-lg hover:brightness-110 transition-all"
                    >
                        <Pencil size={12} />
                        Editar
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
                {/* Meta */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {news.source && (
                        <span
                            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                            style={{ color: sourceColor, backgroundColor: `${sourceColor}18` }}
                        >
                            {news.source}
                        </span>
                    )}
                    {news.contentType && (
                        <span className="text-[10px] font-semibold text-muted uppercase tracking-wide">
                            {news.contentType}
                        </span>
                    )}
                    {news.isHidden && (
                        <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded uppercase tracking-wide">
                            Oculta
                        </span>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-[1.2] mb-3">
                    {news.title}
                </h1>

                {/* Date + artists */}
                <div className="flex items-center gap-2 text-[12px] text-muted mb-6 flex-wrap">
                    <span>{formatDate(news.publishedAt)}</span>
                    {news.artists.length > 0 && (
                        <>
                            <span>·</span>
                            <span>{news.artists.map(a => a.artist.nameRomanized).join(', ')}</span>
                        </>
                    )}
                    {news.readingTimeMin && (
                        <>
                            <span>·</span>
                            <span>{news.readingTimeMin} min</span>
                        </>
                    )}
                </div>

                {/* Cover image */}
                {news.imageUrl && (
                    <img
                        src={news.imageUrl}
                        alt={news.title}
                        className="w-full rounded-xl object-cover max-h-80 mb-8 border border-border"
                    />
                )}

                {/* Body */}
                <div className="prose prose-sm sm:prose max-w-none">
                    {hasBlocks ? (
                        <BlockRenderer blocks={news.blocks as NewsBlock[]} />
                    ) : (
                        <MarkdownRenderer content={news.contentMd} />
                    )}
                </div>

                {/* Tags */}
                {news.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-8 pt-6 border-t border-border">
                        {news.tags.map(tag => (
                            <span
                                key={tag}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface text-muted border border-border"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
