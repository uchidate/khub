'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play, X, Minimize2 } from 'lucide-react'

// ── Types & helpers ───────────────────────────────────────────────────────────

export interface VideoItem {
    title: string
    url: string
}

export function extractYoutubeId(url: string): string | null {
    try {
        const u = new URL(url)
        if (u.hostname.includes('youtube.com') || u.hostname === 'youtu.be') {
            const v = u.searchParams.get('v')
            if (v) return v
            if (u.hostname === 'youtu.be') return u.pathname.slice(1)
            const m = u.pathname.match(/\/embed\/([^/?]+)/)
            if (m) return m[1]
        }
        return null
    } catch { return null }
}

function toRgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function YTThumb({ id, title, sizes, className }: { id: string; title: string; sizes: string; className?: string }) {
    const [src, setSrc] = useState(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`)
    return (
        <Image src={src} alt={title} fill sizes={sizes} className={className}
            onError={() => setSrc(`https://img.youtube.com/vi/${id}/hqdefault.jpg`)} />
    )
}

function PlayButton({ size = 'lg', accent }: { size?: 'lg' | 'sm'; accent: string }) {
    return (
        <div className={`flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${size === 'lg' ? 'h-16 w-16' : 'h-8 w-8'}`}
            style={{ background: toRgba(accent, 0.9) }}>
            <Play className={`text-white fill-white ${size === 'lg' ? 'h-7 w-7 ml-1' : 'h-3.5 w-3.5 ml-0.5'}`} />
        </div>
    )
}

function EqualizerBars({ accent }: { accent: string }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div className="flex items-end gap-[3px] h-4">
                {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-[3px] rounded-full animate-equalizador"
                        style={{ background: accent, animationDelay: `${delay}ms` }} />
                ))}
            </div>
            <p className="font-mono text-[8px] uppercase tracking-widest text-white/80">Reproduzindo</p>
        </div>
    )
}

// ── Main component (YouTube only) ─────────────────────────────────────────────

interface GroupMVPlayerProps {
    videos: VideoItem[]
    accent: string
    embedFeaturedByDefault?: boolean
}

export function GroupMVPlayer({ videos, accent, embedFeaturedByDefault = false }: GroupMVPlayerProps) {
    const mvs = videos
        .map(mv => { const id = extractYoutubeId(mv.url); return id ? { ...mv, id } : null })
        .filter((mv): mv is VideoItem & { id: string } => mv !== null)

    const [activeIndex, setActiveIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(embedFeaturedByDefault)
    const [isMini, setIsMini] = useState(false)
    const featuredRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!isPlaying) { setIsMini(false); return }
        const update = () => {
            const el = featuredRef.current
            if (!el) return
            const { top, bottom } = el.getBoundingClientRect()
            setIsMini(
                (bottom < 100 || top > window.innerHeight - 80) &&
                window.innerWidth >= 360 && window.innerHeight >= 520
            )
        }
        update()
        window.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', update)
        return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
    }, [isPlaying, activeIndex])

    const select = (i: number) => { setActiveIndex(i); setIsPlaying(true); setIsMini(false) }
    const close = () => { setIsPlaying(false); setIsMini(false) }

    if (mvs.length === 0) return null
    const featured = mvs[activeIndex]

    return (
        <section id="mvs">
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

            {/* Featured */}
            <div ref={featuredRef} className="mb-4 overflow-hidden border border-border bg-black"
                style={{ borderTopColor: accent, borderTopWidth: 2 }}>
                {isPlaying ? (
                    <div className="relative aspect-video">
                        <div className={isMini
                            ? "fixed bottom-[calc(var(--bottom-nav-h,0px)+1rem)] right-3 z-[260] w-[min(420px,calc(100vw-1.5rem))] overflow-hidden border border-white/15 bg-black shadow-2xl sm:bottom-5 sm:right-5"
                            : "absolute inset-0"
                        }>
                            <div className="relative aspect-video">
                                {isMini && (
                                    <div className="absolute left-0 right-0 top-0 z-20 flex h-8 items-center justify-between bg-black/80 px-2.5 text-white">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Minimize2 className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate text-[11px] font-bold">{featured.title}</span>
                                        </div>
                                        <button type="button" onClick={close} aria-label="Fechar"
                                            className="flex h-6 w-6 shrink-0 items-center justify-center text-white/80 hover:text-white">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                                <iframe key={`${featured.id}-${activeIndex}`}
                                    src={`https://www.youtube.com/embed/${featured.id}?autoplay=1&rel=0`}
                                    className="absolute inset-0 h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen title={featured.title}
                                />
                                {!isMini && (
                                    <button onClick={close} aria-label="Fechar"
                                        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center bg-black/70 text-white hover:bg-black transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsPlaying(true)} className="group relative block w-full aspect-video text-left">
                        <YTThumb id={featured.id} title={featured.title} sizes="100vw"
                            className="object-cover brightness-75 group-hover:brightness-90 transition-all duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <PlayButton size="lg" accent={accent} />
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                            <p className="font-mono text-[9px] font-black uppercase tracking-widest text-white/60 mb-1">Em destaque</p>
                            <p className="text-base font-black text-white leading-tight">{featured.title}</p>
                        </div>
                    </button>
                )}
            </div>

            {/* Grid de thumbnails */}
            {mvs.length > 1 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {mvs.map((mv, i) => {
                        const isActive = i === activeIndex
                        return (
                            <button key={mv.id} onClick={() => select(i)} title={mv.title}
                                className="group relative aspect-video overflow-hidden border bg-black text-left transition-all"
                                style={{ borderColor: isActive ? accent : 'var(--color-border)', borderWidth: isActive ? 2 : 1 }}>
                                <YTThumb id={mv.id} title={mv.title}
                                    sizes="(max-width: 640px) 33vw, 25vw"
                                    className={`object-cover transition-all duration-200 ${isActive ? 'brightness-50' : 'brightness-70 group-hover:brightness-90'}`}
                                />
                                {isActive && isPlaying ? <EqualizerBars accent={accent} /> : isActive ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <PlayButton size="sm" accent={accent} />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex h-8 w-8 items-center justify-center bg-black/60">
                                            <Play className="h-3.5 w-3.5 text-white fill-white ml-0.5" />
                                        </div>
                                    </div>
                                )}
                                {!isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-2 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                                        <p className="text-[10px] font-bold text-white line-clamp-1">{mv.title}</p>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
