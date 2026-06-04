'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, X, ExternalLink } from 'lucide-react'

function YTThumb({ videoId, title, sizes, className }: { videoId: string; title: string; sizes: string; className?: string }) {
    const [src, setSrc] = useState(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)
    return (
        <Image
            src={src}
            alt={title}
            fill
            sizes={sizes}
            className={className}
            onError={() => setSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)}
        />
    )
}

interface MV {
    title: string
    url: string
}

interface GroupMVPlayerProps {
    videos: MV[]
    accent: string
    embedFeaturedByDefault?: boolean
}

function toRgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

function extractYoutubeId(url: string): string | null {
    try {
        const u = new URL(url)
        const v = u.searchParams.get('v')
        if (v) return v
        if (u.hostname === 'youtu.be') return u.pathname.slice(1)
        const m = u.pathname.match(/\/embed\/([^/?]+)/)
        if (m) return m[1]
        return null
    } catch { return null }
}

export function GroupMVPlayer({ videos, accent, embedFeaturedByDefault = false }: GroupMVPlayerProps) {
    const mvs = videos
        .map(mv => ({ ...mv, videoId: extractYoutubeId(mv.url) }))
        .filter(mv => mv.videoId)
    const [activeId, setActiveId] = useState<string | null>(() => embedFeaturedByDefault ? mvs[0]?.videoId ?? null : null)

    if (mvs.length === 0) return null

    return (
        <section id="mvs">
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-foreground pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-border bg-background">
                        <span style={{ color: accent }}><Play className="h-4 w-4" /></span>
                    </div>
                    <div>
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Dossiê</p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">MVs Principais</h2>
                    </div>
                </div>
                <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    {mvs.length} {mvs.length === 1 ? 'vídeo' : 'vídeos'}
                </p>
            </div>

            {/* Featured MV — primeiro em destaque */}
            {mvs[0] && (
                <div className="mb-4 relative overflow-hidden border border-border bg-black"
                    style={{ borderTopColor: accent, borderTopWidth: 2 }}>
                    {activeId === mvs[0].videoId ? (
                        <div className="relative aspect-video">
                            <iframe
                                src={`https://www.youtube.com/embed/${mvs[0].videoId}?${embedFeaturedByDefault ? '' : 'autoplay=1&'}rel=0`}
                                className="absolute inset-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={mvs[0].title}
                            />
                            <button
                                onClick={() => setActiveId(null)}
                                className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center bg-black/70 text-white hover:bg-black transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setActiveId(mvs[0].videoId!)}
                            className="group relative block w-full aspect-video text-left"
                        >
                            <YTThumb
                                videoId={mvs[0].videoId!}
                                title={mvs[0].title}
                                sizes="100vw"
                                className="object-cover brightness-75 group-hover:brightness-90 transition-all duration-300"
                            />
                            {/* Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                            {/* Play button */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex h-16 w-16 items-center justify-center transition-transform duration-200 group-hover:scale-110"
                                    style={{ background: toRgba(accent, 0.9) }}>
                                    <Play className="h-7 w-7 text-white fill-white ml-1" />
                                </div>
                            </div>
                            {/* Title */}
                            <div className="absolute bottom-4 left-4 right-4">
                                <p className="font-mono text-[9px] font-black uppercase tracking-widest text-white/60 mb-1">MV em destaque</p>
                                <p className="text-base font-black text-white leading-tight">{mvs[0].title}</p>
                            </div>
                        </button>
                    )}
                </div>
            )}

            {/* Grid dos demais MVs */}
            {mvs.length > 1 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {mvs.slice(1).map(mv => (
                        <div key={mv.videoId} className="relative overflow-hidden border border-border bg-black group">
                            {activeId === mv.videoId ? (
                                <div className="relative aspect-video">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${mv.videoId}?autoplay=1&rel=0`}
                                        className="absolute inset-0 w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={mv.title}
                                    />
                                    <button
                                        onClick={() => setActiveId(null)}
                                        className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center bg-black/70 text-white"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setActiveId(mv.videoId!)}
                                    className="relative block w-full aspect-video"
                                >
                                    <YTThumb
                                        videoId={mv.videoId!}
                                        title={mv.title}
                                        sizes="(max-width: 640px) 50vw, 33vw"
                                        className="object-cover brightness-70 group-hover:brightness-90 transition-all duration-300"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="flex h-10 w-10 items-center justify-center transition-transform duration-200 group-hover:scale-110"
                                            style={{ background: toRgba(accent, 0.85) }}>
                                            <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2.5">
                                        <p className="text-xs font-bold text-white line-clamp-1">{mv.title}</p>
                                    </div>
                                </button>
                            )}
                            {/* Link externo */}
                            <a href={mv.url} target="_blank" rel="noopener noreferrer"
                                className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center bg-black/60 text-white/70 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
