'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play, X, ExternalLink, Minimize2 } from 'lucide-react'

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

interface MV { title: string; url: string }
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
        .filter((mv): mv is typeof mv & { videoId: string } => !!mv.videoId)

    const [activeIndex, setActiveIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(embedFeaturedByDefault)
    const [isMini, setIsMini] = useState(false)
    const featuredRef = useRef<HTMLDivElement | null>(null)

    // Mini player: ativa quando o featured scroll sai da viewport
    useEffect(() => {
        if (!isPlaying) { setIsMini(false); return }
        const update = () => {
            const el = featuredRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const out = rect.bottom < 100 || rect.top > window.innerHeight - 80
            setIsMini(out && window.innerWidth >= 360 && window.innerHeight >= 520)
        }
        update()
        window.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', update)
        return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
    }, [isPlaying])

    const selectVideo = (index: number) => {
        setActiveIndex(index)
        setIsPlaying(true)
        setIsMini(false)
    }

    const close = () => { setIsPlaying(false); setIsMini(false) }

    if (mvs.length === 0) return null
    const featured = mvs[activeIndex]

    return (
        <section id="mvs">
            {/* Header */}
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-foreground pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-border bg-background">
                        <Play className="h-4 w-4" style={{ color: accent }} />
                    </div>
                    <div>
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Vídeos</p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">MVs Principais</h2>
                    </div>
                </div>
                <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    {mvs.length} {mvs.length === 1 ? 'vídeo' : 'vídeos'}
                </p>
            </div>

            {/* Featured slot */}
            <div
                ref={featuredRef}
                className="relative mb-4 overflow-hidden border border-border bg-black"
                style={{ borderTopColor: accent, borderTopWidth: 2 }}
            >
                {isPlaying ? (
                    <div className="relative aspect-video">
                        {/* Mini player flutuante quando scroll sai da view */}
                        <div className={isMini
                            ? "fixed bottom-[calc(var(--bottom-nav-h,0px)+1rem)] right-3 z-[260] w-[min(420px,calc(100vw-1.5rem))] overflow-hidden border border-white/15 bg-black shadow-2xl shadow-black/35 sm:bottom-5 sm:right-5"
                            : "absolute inset-0"
                        }>
                            <div className="relative aspect-video">
                                {isMini && (
                                    <div className="absolute left-0 right-0 top-0 z-20 flex h-8 items-center justify-between bg-black/80 px-2.5 text-white">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Minimize2 className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate text-[11px] font-bold">{featured.title}</span>
                                        </div>
                                        <button type="button" onClick={close}
                                            className="flex h-6 w-6 shrink-0 items-center justify-center text-white/80 hover:text-white"
                                            aria-label="Fechar vídeo">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                                <iframe
                                    key={`${featured.videoId}-${activeIndex}`}
                                    src={`https://www.youtube.com/embed/${featured.videoId}?autoplay=1&rel=0`}
                                    className="absolute inset-0 h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={featured.title}
                                />
                                {!isMini && (
                                    <button onClick={close}
                                        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center bg-black/70 text-white hover:bg-black transition-colors"
                                        aria-label="Fechar vídeo">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsPlaying(true)}
                        className="group relative block w-full aspect-video text-left"
                    >
                        <YTThumb videoId={featured.videoId} title={featured.title} sizes="100vw"
                            className="object-cover brightness-75 group-hover:brightness-90 transition-all duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-16 w-16 items-center justify-center transition-transform duration-200 group-hover:scale-110"
                                style={{ background: toRgba(accent, 0.9) }}>
                                <Play className="h-7 w-7 text-white fill-white ml-1" />
                            </div>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                            <p className="font-mono text-[9px] font-black uppercase tracking-widest text-white/60 mb-1">Em destaque</p>
                            <p className="text-base font-black text-white leading-tight">{featured.title}</p>
                        </div>
                    </button>
                )}
            </div>

            {/* Thumbnails — todas, incluindo a ativa */}
            {mvs.length > 1 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {mvs.map((mv, i) => {
                        const isActive = i === activeIndex
                        return (
                            <button
                                key={mv.videoId}
                                onClick={() => selectVideo(i)}
                                className="group relative aspect-video overflow-hidden border bg-black text-left transition-all"
                                style={{
                                    borderColor: isActive ? accent : 'var(--color-border)',
                                    borderWidth: isActive ? 2 : 1,
                                }}
                                title={mv.title}
                            >
                                <YTThumb
                                    videoId={mv.videoId}
                                    title={mv.title}
                                    sizes="(max-width: 640px) 33vw, 25vw"
                                    className={`object-cover transition-all duration-200 ${isActive ? 'brightness-50' : 'brightness-70 group-hover:brightness-90'}`}
                                />
                                {/* Indicador de ativo */}
                                {isActive && isPlaying ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                        <div className="flex items-end gap-[3px] h-4">
                                            <span className="w-[3px] rounded-full animate-[equalizador_0.6s_ease-in-out_infinite]" style={{ background: accent, animationDelay: '0ms', height: '40%' }} />
                                            <span className="w-[3px] rounded-full animate-[equalizador_0.6s_ease-in-out_infinite]" style={{ background: accent, animationDelay: '150ms', height: '100%' }} />
                                            <span className="w-[3px] rounded-full animate-[equalizador_0.6s_ease-in-out_infinite]" style={{ background: accent, animationDelay: '300ms', height: '60%' }} />
                                        </div>
                                        <p className="font-mono text-[8px] uppercase tracking-widest text-white/80">Reproduzindo</p>
                                    </div>
                                ) : isActive ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="flex h-8 w-8 items-center justify-center" style={{ background: toRgba(accent, 0.9) }}>
                                            <Play className="h-3.5 w-3.5 text-white fill-white ml-0.5" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex h-8 w-8 items-center justify-center bg-black/60">
                                            <Play className="h-3.5 w-3.5 text-white fill-white ml-0.5" />
                                        </div>
                                    </div>
                                )}
                                {/* Link externo */}
                                <a href={mv.url} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center bg-black/60 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                                {/* Título no hover */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-2 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                                    <p className="text-[10px] font-bold text-white line-clamp-1">{mv.title}</p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
