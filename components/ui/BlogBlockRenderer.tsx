'use client'

import Image from 'next/image'
import Link from 'next/link'
import { TwitterEmbed } from '@/components/ui/TwitterEmbed'
import { InstagramEmbed } from '@/components/ui/InstagramEmbed'
import { TikTokEmbed } from '@/components/ui/TikTokEmbed'
import type { BlogBlock } from '@/lib/types/blocks'

interface BlogBlockRendererProps {
    blocks: BlogBlock[]
    className?: string
}

export function BlogBlockRenderer({ blocks, className }: BlogBlockRendererProps) {
    return (
        <div className={className}>
            {blocks.map((block, i) => (
                <BlogBlockItem key={i} block={block} />
            ))}
        </div>
    )
}

function BlogBlockItem({ block }: { block: BlogBlock }) {
    switch (block.type) {

        case 'blog_heading': {
            const cls = "font-black text-foreground leading-tight tracking-tight"
            if (block.level === 1) return <h1 className={`text-3xl md:text-4xl mt-10 mb-5 ${cls}`}>{block.text}</h1>
            if (block.level === 3) return <h3 className={`text-lg mt-7 mb-3 text-[#ff2d78] ${cls}`}>{block.text}</h3>
            return (
                <h2 className={`text-2xl mt-8 mb-4 pb-2 ${cls}`} style={{ borderBottom: '1px solid rgba(255,45,120,0.15)' }}>
                    {block.text}
                </h2>
            )
        }

        case 'blog_paragraph':
            return <p className="mb-5 leading-relaxed text-foreground text-lg">{block.text}</p>

        case 'blog_quote':
            return (
                <blockquote className="pl-5 my-7 italic py-3 pr-4 rounded-r-xl"
                    style={{ borderLeft: '4px solid #ff2d78', backgroundColor: 'rgba(255,45,120,0.04)', color: '#6b6b6b' }}>
                    <p className="mb-1">{block.text}</p>
                    {block.author && <footer className="text-xs text-muted not-italic">— {block.author}</footer>}
                </blockquote>
            )

        case 'blog_image':
            return (
                <span className="block my-8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={block.url}
                        alt={block.caption || ''}
                        referrerPolicy="no-referrer"
                        className={`rounded-2xl border border-border shadow-xl ${block.fullWidth ? 'w-full' : 'w-full md:w-auto max-w-full'}`}
                    />
                    {block.caption && (
                        <span className="block text-center text-xs text-muted mt-2 italic">{block.caption}</span>
                    )}
                </span>
            )

        case 'blog_gallery':
            return (
                <div className="my-8 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {block.urls.filter(u => u).map((url, i) => (
                            <div key={i} className="aspect-video relative rounded-xl overflow-hidden border border-border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Imagem ${i + 1}`} referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                            </div>
                        ))}
                    </div>
                    {block.caption && <p className="text-center text-xs text-muted italic">{block.caption}</p>}
                </div>
            )

        case 'blog_video': {
            const ytMatch = block.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
            return ytMatch ? (
                <div className="my-8 space-y-2">
                    <div className="aspect-video rounded-2xl overflow-hidden border border-border">
                        <iframe
                            src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen title={block.caption || 'Vídeo'}
                        />
                    </div>
                    {block.caption && <p className="text-center text-xs text-muted italic">{block.caption}</p>}
                </div>
            ) : (
                <a href={block.url} target="_blank" rel="noopener noreferrer"
                    className="text-[#ff2d78] underline underline-offset-4 my-4 block">
                    {block.caption || block.url}
                </a>
            )
        }

        case 'blog_twitter':   return <TwitterEmbed url={block.url} />
        case 'blog_instagram': return <InstagramEmbed url={block.url} />
        case 'blog_tiktok':    return <TikTokEmbed url={block.url} />

        case 'blog_artist_card':
            return <ArtistCardBlock artistId={block.artistId} note={block.note} />

        case 'blog_production_card':
            return <ProductionCardBlock productionId={block.productionId} note={block.note} />

        case 'blog_stats_row':
            return (
                <div className="my-6 rounded-xl border border-border overflow-hidden">
                    {block.items.filter(item => item.label || item.value).map((item, i) => (
                        <div key={i} className={`flex px-4 py-2.5 text-sm ${i % 2 === 0 ? 'bg-surface' : 'bg-background'}`}>
                            <span className="text-muted font-medium w-1/3 shrink-0">{item.label}</span>
                            <span className="text-foreground font-semibold">{item.value}</span>
                        </div>
                    ))}
                </div>
            )

        case 'blog_rating':
            return (
                <div className="my-8 p-5 rounded-2xl border border-yellow-500/20 bg-yellow-50">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-yellow-400">{block.score.toFixed(1)}</span>
                            <span className="text-muted text-lg">/10</span>
                        </div>
                        <div>
                            {block.label && <p className="text-xs font-black uppercase tracking-widest text-yellow-600">{block.label}</p>}
                            <div className="flex gap-0.5 mt-1">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className={`h-1.5 w-4 rounded-full ${i < Math.round(block.score) ? 'bg-yellow-400' : 'bg-[#e8e8e8]'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                    {block.summary && <p className="text-sm text-muted leading-relaxed italic">{block.summary}</p>}
                </div>
            )

        case 'blog_divider':
            return <hr className="my-10 border-t border-border" />

        default:
            return null
    }
}

// ─── Dynamic blocks (fetch data from server) ──────────────────────────────────

function ArtistCardBlock({ artistId, note }: { artistId: string; note?: string }) {
    if (!artistId) return null
    return (
        <Link href={`/artists/${artistId}`}
            className="group flex items-center gap-4 my-6 p-4 rounded-2xl border border-border hover:border-[#ff2d78]/30 bg-surface hover:bg-background transition-all">
            <div className="w-16 h-16 rounded-full bg-[#e8e8e8] border border-border overflow-hidden shrink-0 flex items-center justify-center text-muted text-xs">
                ?
            </div>
            <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#ff2d78] mb-0.5">Artista</p>
                <p className="text-sm font-semibold text-muted group-hover:text-foreground transition-colors">ID: {artistId}</p>
                {note && <p className="text-xs text-muted mt-1 italic">{note}</p>}
            </div>
        </Link>
    )
}

function ProductionCardBlock({ productionId, note }: { productionId: string; note?: string }) {
    if (!productionId) return null
    return (
        <Link href={`/productions/${productionId}`}
            className="group flex items-center gap-4 my-6 p-4 rounded-2xl border border-border hover:border-emerald-500/30 bg-surface hover:bg-background transition-all">
            <div className="w-12 h-16 rounded-lg bg-[#e8e8e8] border border-border overflow-hidden shrink-0 flex items-center justify-center text-muted text-xs">
                ?
            </div>
            <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-0.5">Produção</p>
                <p className="text-sm font-semibold text-muted group-hover:text-foreground transition-colors">ID: {productionId}</p>
                {note && <p className="text-xs text-muted mt-1 italic">{note}</p>}
            </div>
        </Link>
    )
}
