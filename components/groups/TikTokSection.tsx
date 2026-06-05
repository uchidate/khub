'use client'

import { useState } from 'react'
import { X, ExternalLink } from 'lucide-react'

function extractTikTokId(url: string): string | null {
    try {
        const m = new URL(url).pathname.match(/\/video\/(\d+)/)
        return m?.[1] ?? null
    } catch { return null }
}

interface TikTokVideo {
    title: string
    url: string
}

interface TikTokCardProps {
    video: TikTokVideo & { id: string }
    accent: string
}

function TikTokLogo() {
    return (
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white opacity-80">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
        </svg>
    )
}

function TikTokCard({ video, accent }: TikTokCardProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="flex-shrink-0 w-[180px] sm:w-[200px]">
            {/* Portrait card */}
            <div className="relative aspect-[9/16] overflow-hidden border border-border bg-black"
                style={isOpen ? { borderColor: accent, borderWidth: 2 } : {}}>
                {isOpen ? (
                    <>
                        <iframe
                            key={video.id}
                            src={`https://www.tiktok.com/embed/v2/${video.id}`}
                            className="absolute inset-0 h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={video.title}
                        />
                        <button onClick={() => setIsOpen(false)} aria-label="Fechar"
                            className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center bg-black/70 text-white hover:bg-black transition-colors">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </>
                ) : (
                    <button onClick={() => setIsOpen(true)}
                        className="group absolute inset-0 flex flex-col items-center justify-center gap-3 w-full h-full"
                        style={{ background: 'linear-gradient(160deg, #0d0d0d 0%, #1a1a2e 60%, #0d0d0d 100%)' }}>
                        {/* Decorative lines */}
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: `repeating-linear-gradient(0deg, ${accent} 0px, transparent 1px, transparent 24px)` }} />
                        <TikTokLogo />
                        <div className="px-3 text-center">
                            <p className="text-[11px] font-bold text-white/70 line-clamp-3 leading-snug">{video.title}</p>
                        </div>
                        {/* Play pill */}
                        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white transition-transform duration-200 group-hover:scale-105"
                            style={{ background: accent }}>
                            Assistir
                        </div>
                    </button>
                )}
            </div>
            {/* Link externo */}
            <a href={video.url} target="_blank" rel="noopener noreferrer"
                className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-muted hover:text-foreground transition-colors">
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">Abrir no TikTok</span>
            </a>
        </div>
    )
}

interface TikTokSectionProps {
    videos: TikTokVideo[]
    accent: string
}

export function TikTokSection({ videos, accent }: TikTokSectionProps) {
    const items = videos
        .map(v => { const id = extractTikTokId(v.url); return id ? { ...v, id } : null })
        .filter((v): v is TikTokVideo & { id: string } => v !== null)

    if (items.length === 0) return null

    return (
        <section id="tiktoks">
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-foreground pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-border bg-background">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" style={{ color: accent }}>
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Social</p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">TikTok</h2>
                    </div>
                </div>
                <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    {items.length} {items.length === 1 ? 'post' : 'posts'}
                </p>
            </div>

            {/* Scroll horizontal de cards portrait */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                {items.map(video => (
                    <div key={video.id} className="snap-start">
                        <TikTokCard video={video} accent={accent} />
                    </div>
                ))}
            </div>
        </section>
    )
}
