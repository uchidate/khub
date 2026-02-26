'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AdminQuickEdit } from '@/components/ui/AdminQuickEdit'

const SOURCE_LABELS: Record<string, string> = {
    'soompi.com': 'Soompi',
    'koreaboo.com': 'Koreaboo',
    'kpopstarz.com': 'KpopStarz',
    'dramabeans.com': 'Dramabeans',
    'asianjunkie.com': 'Asian Junkie',
}

export function getSourceLabel(url?: string | null): string | null {
    if (!url) return null
    try {
        const host = new URL(url).hostname.replace(/^www\./, '')
        return SOURCE_LABELS[host] ?? null
    } catch {
        return null
    }
}

export function relativeTime(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'agora'
    if (mins < 60) return `há ${mins}min`
    const hours = Math.floor(diffMs / 3600000)
    if (hours < 24) return `há ${hours}h`
    const days = Math.floor(diffMs / 86400000)
    if (days < 7) return `há ${days}d`
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function stripMarkdown(text: string): string {
    return text
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/^[-*+]\s+/gm, '')
        .replace(/\n+/g, ' ')
        .trim()
}

interface NewsListCardProps {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: string
    tags: string[]
    contentMd?: string | null
    artists?: string[]
    sourceUrl?: string | null
    adminHref?: string
}

export function NewsListCard({
    id,
    title,
    imageUrl,
    publishedAt,
    tags,
    contentMd,
    artists = [],
    sourceUrl,
    adminHref,
}: NewsListCardProps) {
    const excerpt = contentMd ? stripMarkdown(contentMd).slice(0, 140) : null
    const sourceLabel = getSourceLabel(sourceUrl)

    return (
        <div className="relative group/card">
        <Link
            href={`/news/${id}`}
            className="group flex flex-col rounded-xl overflow-hidden border border-white/5 hover:border-purple-500/30 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all duration-300"
        >
            {/* Image */}
            <div className="relative aspect-video overflow-hidden bg-zinc-800 flex-shrink-0">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                    </div>
                )}
                {/* Source badge */}
                {sourceLabel && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/75 backdrop-blur-sm text-zinc-300 text-[9px] font-black uppercase tracking-wider rounded-sm">
                        {sourceLabel}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-4 gap-2">
                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {tags.slice(0, 3).map(tag => (
                            <span
                                key={tag}
                                className="text-[9px] font-black uppercase px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded-sm tracking-widest"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Title */}
                <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug text-sm">
                    {title}
                </h3>

                {/* Excerpt */}
                {excerpt && (
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                        {excerpt}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-[10px] font-bold text-zinc-600">
                        {relativeTime(publishedAt)}
                    </span>
                    {artists.length > 0 && (
                        <div className="flex gap-1">
                            {artists.slice(0, 2).map(name => (
                                <span key={name} className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-pink-600/20 text-pink-400 rounded-sm">
                                    {name}
                                </span>
                            ))}
                            {artists.length > 2 && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded-sm">
                                    +{artists.length - 2}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
        {adminHref && (
            <div className="absolute top-2 left-2 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                <AdminQuickEdit href={adminHref} label="Editar" />
            </div>
        )}
        </div>
    )
}
