'use client'

import { TwitterEmbed } from '@/components/ui/TwitterEmbed'
import { InstagramEmbed } from '@/components/ui/InstagramEmbed'
import { TikTokEmbed } from '@/components/ui/TikTokEmbed'
import type { NewsBlock } from '@/lib/types/blocks'

interface BlockRendererProps {
    blocks: NewsBlock[]
    className?: string
}

export function BlockRenderer({ blocks, className }: BlockRendererProps) {
    return (
        <div className={className}>
            {blocks.map((block, i) => (
                <BlockItem key={i} block={block} />
            ))}
        </div>
    )
}

function BlockItem({ block }: { block: NewsBlock }) {
    switch (block.type) {
        case 'heading':
            return (
                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 pb-2 leading-tight border-b border-border">
                    {block.translated || block.original}
                </h2>
            )

        case 'paragraph':
            return (
                <p className="mb-5 leading-relaxed text-foreground text-lg">
                    {block.translated || block.original}
                </p>
            )

        case 'quote':
            return (
                <blockquote className="pl-5 my-7 italic py-3 pr-4 rounded-r-xl border-l-4 border-[#ff2d78] bg-[#ff2d78]/4 text-muted">
                    <p>{block.translated || block.original}</p>
                </blockquote>
            )

        case 'image':
            return (
                <span className="block my-8">
                    { }
                    <img
                        src={block.url}
                        alt={block.caption || ''}
                        referrerPolicy="no-referrer"
                        className="rounded-2xl w-full md:w-auto max-w-full border border-border"
                    />
                    {block.caption && (
                        <span className="block text-center text-xs text-muted mt-2 italic">
                            {block.caption}
                        </span>
                    )}
                </span>
            )

        case 'twitter_embed':
            return <TwitterEmbed url={block.url} />

        case 'instagram_embed':
            return <InstagramEmbed url={block.url} />

        case 'tiktok_embed':
            return <TikTokEmbed url={block.url} />

        case 'video': {
            const ytMatch = block.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
            if (ytMatch) {
                return (
                    <div className="my-8 aspect-video rounded-2xl overflow-hidden border border-border">
                        <iframe
                            src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={block.caption || 'Vídeo'}
                        />
                    </div>
                )
            }
            return (
                <div className="my-8">
                    <a
                        href={block.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ff2d78] underline underline-offset-4"
                    >
                        {block.caption || block.url}
                    </a>
                </div>
            )
        }

        default:
            return null
    }
}
