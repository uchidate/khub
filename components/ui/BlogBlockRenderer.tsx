'use client'

import { useState, useCallback, useEffect, useRef, Fragment } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { X, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { BlogBlock } from '@/lib/types/blocks'
import { useAdFilled } from '@/hooks/useAdFilled'

const TwitterEmbed = dynamic(() => import('@/components/ui/TwitterEmbed').then(m => ({ default: m.TwitterEmbed })), { ssr: false })
const InstagramEmbed = dynamic(() => import('@/components/ui/InstagramEmbed').then(m => ({ default: m.InstagramEmbed })), { ssr: false })
const TikTokEmbed = dynamic(() => import('@/components/ui/TikTokEmbed').then(m => ({ default: m.TikTokEmbed })), { ssr: false })

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FLUID
const IS_DEV = process.env.NODE_ENV === 'development'

function InArticleAd({ id }: { id: string }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const pushed = useRef(false)
    const { insRef, filled } = useAdFilled(ADSENSE_SLOT)

    useEffect(() => {
        if (pushed.current || !containerRef.current) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !pushed.current) {
                    pushed.current = true
                    observer.disconnect()
                    try { ;((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle = (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({}) } catch {}
                }
            },
            { rootMargin: '300px' }
        )
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    if (!IS_DEV && (!ADSENSE_CLIENT || filled === false)) return null
    if (IS_DEV) return (
        <div className="my-8 h-[250px] flex items-center justify-center bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded">
            <span className="text-[9px] font-mono text-amber-600/70 select-none">📢 Blog In-Article · slot: {ADSENSE_SLOT}</span>
        </div>
    )
    return (
        <div ref={containerRef} className="my-8 overflow-hidden">
            {filled === true && (
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-muted/50 select-none">Publicidade</span>
                    <div className="flex-1 h-px bg-border" />
                </div>
            )}
            <ins ref={insRef} className="adsbygoogle" style={{ display: 'block', textAlign: 'center' }}
                data-ad-layout="in-article" data-ad-format="fluid"
                data-ad-client={ADSENSE_CLIENT} data-ad-slot={ADSENSE_SLOT}
                key={id} />
        </div>
    )
}

const AD_POSITIONS = new Set([4, 10, 18])

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeHref(rawUrl: string): string | null {
    if (rawUrl.startsWith('/')) return rawUrl
    try {
        const parsed = new URL(rawUrl)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
        return parsed.toString()
    } catch {
        return null
    }
}

/** Proxy Wikimedia images through our own route to avoid 429/hotlink issues */
function proxied(url: string): string {
    try {
        const parsed = new URL(url)
        const host = parsed.hostname.toLowerCase()
        const isWikimedia = host === 'upload.wikimedia.org' || host === 'commons.wikimedia.org'
        if (isWikimedia) {
            return `/api/image-proxy?url=${encodeURIComponent(parsed.toString())}`
        }
    } catch {
        return url
    }

    return url
}

/**
 * Render inline markdown: **bold**, *italic*, [link](url), **[bold link](url)**
 */
function renderInline(text: string): React.ReactNode {
    const pattern = /\*\*\[([^\]]+)\]\(([^)]+)\)\*\*|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|\[([^\]]+)\]\(([^)]+)\)/g
    const parts: React.ReactNode[] = []
    let last = 0
    let key = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > last) parts.push(text.slice(last, match.index))
        const linkCls = "text-[#ff2d78] underline underline-offset-4 hover:brightness-110 transition-all"
        if (match[1] && match[2]) {
            // **[bold link](url)**
            const href = sanitizeHref(match[2])
            if (href) {
                parts.push(href.startsWith('/')
                    ? <Link key={key++} href={href} className={`font-semibold ${linkCls}`}>{match[1]}</Link>
                    : <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className={`font-semibold ${linkCls}`}>{match[1]}</a>
                )
            } else {
                parts.push(match[1])
            }
        } else if (match[3]) {
            // **bold**
            parts.push(<strong key={key++} className="font-semibold text-foreground">{match[3]}</strong>)
        } else if (match[4]) {
            // *italic*
            parts.push(<em key={key++} className="italic">{match[4]}</em>)
        } else if (match[5] && match[6]) {
            // [link](url)
            const href = sanitizeHref(match[6])
            if (href) {
                parts.push(href.startsWith('/')
                    ? <Link key={key++} href={href} className={linkCls}>{match[5]}</Link>
                    : <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>{match[5]}</a>
                )
            } else {
                parts.push(match[5])
            }
        }
        last = match.index + match[0].length
    }
    if (last < text.length) parts.push(text.slice(last))
    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ urls, startIdx, caption, onClose }: {
    urls: string[]
    startIdx: number
    caption?: string
    onClose: () => void
}) {
    const [idx, setIdx] = useState(startIdx)

    const prev = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setIdx(i => Math.max(0, i - 1))
    }, [])

    const next = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setIdx(i => Math.min(urls.length - 1, i + 1))
    }, [urls.length])

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/92 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            >
                <X className="w-5 h-5" />
            </button>

            {idx > 0 && (
                <button
                    onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={proxied(urls[idx])}
                alt={caption || `Imagem ${idx + 1}`}
                className="max-w-full max-h-[88dvh] rounded-xl object-contain shadow-2xl"
                onClick={e => e.stopPropagation()}
            />

            {idx < urls.length - 1 && (
                <button
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            )}

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center space-y-1 pointer-events-none">
                {urls.length > 1 && (
                    <p className="text-white/50 text-xs">{idx + 1} / {urls.length}</p>
                )}
                {caption && <p className="text-white/70 text-sm italic">{caption}</p>}
            </div>
        </div>
    )
}

// ── Image block with lightbox ─────────────────────────────────────────────────

function ImageBlock({ block }: { block: Extract<BlogBlock, { type: 'blog_image' }> }) {
    const [open, setOpen] = useState(false)
    const sizeClass =
        block.size === 'small'  ? 'mx-auto max-w-[260px]' :
        block.size === 'medium' ? 'mx-auto max-w-sm' :
        block.fullWidth         ? 'w-full' :
                                  'w-full md:w-auto max-w-full'
    return (
        <>
            <span className="block my-8">
                <span className={`block ${sizeClass}`}>
                    <button
                        onClick={() => setOpen(true)}
                        className="relative group w-full block cursor-zoom-in"
                        aria-label="Ampliar imagem"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={proxied(block.url)}
                            alt={block.caption || ''}
                            className="w-full rounded-2xl border border-border shadow-xl group-hover:brightness-[.93] transition-all duration-200"
                            loading="lazy"
                        />
                        <span className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                            <Maximize2 className="w-3.5 h-3.5" />
                        </span>
                    </button>
                </span>
                {block.caption && (
                    <span className="block text-center text-xs text-muted mt-2 italic">{block.caption}</span>
                )}
            </span>
            {open && block.url && (
                <Lightbox urls={[block.url]} startIdx={0} caption={block.caption} onClose={() => setOpen(false)} />
            )}
        </>
    )
}

// ── Gallery block with lightbox ───────────────────────────────────────────────

function GalleryBlock({ block }: { block: Extract<BlogBlock, { type: 'blog_gallery' }> }) {
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
    const validUrls = block.urls.filter(u => u)

    const colClass =
        validUrls.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' :
        validUrls.length === 2 ? 'grid-cols-2' :
        'grid-cols-2 sm:grid-cols-3'

    return (
        <>
            <div className="my-8 space-y-2">
                <div className={`grid gap-3 ${colClass}`}>
                    {validUrls.map((url, i) => (
                        <button
                            key={i}
                            onClick={() => setLightboxIdx(i)}
                            className="aspect-video relative rounded-xl overflow-hidden border border-border cursor-zoom-in group"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={proxied(url)}
                                alt={`${block.caption ?? 'Imagem'} ${i + 1}`}
                                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                                loading="lazy"
                            />
                            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                        </button>
                    ))}
                </div>
                {block.caption && (
                    <p className="text-center text-xs text-muted italic">{block.caption}</p>
                )}
            </div>

            {lightboxIdx !== null && (
                <Lightbox
                    urls={validUrls}
                    startIdx={lightboxIdx}
                    caption={block.caption}
                    onClose={() => setLightboxIdx(null)}
                />
            )}
        </>
    )
}

// ── Spotify embed ─────────────────────────────────────────────────────────────

function SpotifyBlock({ block }: { block: Extract<BlogBlock, { type: 'blog_spotify' }> }) {
    const match = block.url.match(/open\.spotify\.com\/(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/)
    if (!match) return null
    const [, kind, id] = match
    const height = block.compact || kind === 'track' || kind === 'episode' ? 152 : 352
    return (
        <div className="my-6">
            <iframe
                src={`https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`}
                width="100%"
                height={height}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-2xl"
                title={`Spotify ${kind}`}
            />
        </div>
    )
}

// ── Timeline block ────────────────────────────────────────────────────────────

function TimelineBlock({ block }: { block: Extract<BlogBlock, { type: 'blog_timeline' }> }) {
    if (!block.items.length) return null
    return (
        <div className="my-8 relative">
            <div
                className="absolute top-0 bottom-0 w-px"
                style={{
                    left: '94px',
                    background: 'linear-gradient(to bottom, rgba(255,45,120,0.4) 0%, rgba(255,45,120,0.1) 80%, transparent 100%)',
                }}
            />
            <div className="space-y-0">
                {block.items.map((item, i) => (
                    <div key={i} className="flex pb-7 last:pb-0 relative">
                        <div className="w-[88px] shrink-0 text-right pr-4 pt-0.5">
                            <span className="text-xs font-black text-[#ff2d78] leading-none">{item.year}</span>
                        </div>
                        <div className="shrink-0 w-[12px] flex flex-col items-center mr-4">
                            <span
                                className="w-3 h-3 rounded-full shrink-0 border-2 border-background mt-0.5 shadow-[0_0_0_2px_rgba(255,45,120,0.35)]"
                                style={{ background: '#ff2d78' }}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-0.5">
                                <p className="text-sm font-bold text-foreground leading-snug">{item.title}</p>
                            </div>
                            {item.text && (
                                <p className="text-sm text-muted leading-relaxed mt-1">{renderInline(item.text)}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export interface ResolvedArtist {
    id: string
    nameRomanized: string
    roles: string[]
    primaryImageUrl: string | null
}

export interface ResolvedProduction {
    id: string
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
}

export interface ResolvedGroup {
    id: string
    name: string
    profileImageUrl: string | null
    fanClubName: string | null
}

export interface ResolvedEntities {
    artists: Record<string, ResolvedArtist>
    productions: Record<string, ResolvedProduction>
    groups: Record<string, ResolvedGroup>
}

interface BlogBlockRendererProps {
    blocks: BlogBlock[]
    className?: string
    resolvedEntities?: ResolvedEntities
}

function isCompactCard(block: BlogBlock): boolean {
    return (
        (block.type === 'blog_artist_card' && !!block.compact) ||
        (block.type === 'blog_group_card'  && !!block.compact) ||
        (block.type === 'blog_production_card' && !!block.compact)
    )
}

function isNonCompactArtistCard(block: BlogBlock): boolean {
    return block.type === 'blog_artist_card' && !block.compact
}

// Internal marker type to differentiate portrait groups from compact groups
type PortraitGroupMarker = { _portraitGroup: true; items: BlogBlock[] }
function isPortraitGroup(item: unknown): item is PortraitGroupMarker {
    return typeof item === 'object' && item !== null && '_portraitGroup' in item
}


export function BlogBlockRenderer({ blocks, className, resolvedEntities }: BlogBlockRendererProps) {
    // Group consecutive compact cards into a 2-col desktop grid
    // Group consecutive non-compact artist cards into a portrait editorial grid
    const rows: (BlogBlock | BlogBlock[] | PortraitGroupMarker)[] = []
    let i = 0
    while (i < blocks.length) {
        const block = blocks[i]
        if (isNonCompactArtistCard(block)) {
            const group: BlogBlock[] = [block]
            while (i + 1 < blocks.length && isNonCompactArtistCard(blocks[i + 1])) {
                i++
                group.push(blocks[i])
            }
            rows.push(group.length > 1 ? { _portraitGroup: true, items: group } : block)
        } else if (isCompactCard(block)) {
            const group: BlogBlock[] = [block]
            while (i + 1 < blocks.length && isCompactCard(blocks[i + 1])) {
                i++
                group.push(blocks[i])
            }
            rows.push(group.length > 1 ? group : group[0])
        } else {
            rows.push(block)
        }
        i++
    }

    return (
        <div className={className}>
            {rows.map((item, idx) => {
                const el = isPortraitGroup(item)
                    ? (
                        <div key={idx} className="grid grid-cols-2 md:grid-cols-4 gap-3 my-8">
                            {item.items.map((block, j) => {
                                if (block.type !== 'blog_artist_card') return null
                                return <ArtistCardBlock key={j} artistId={block.artistId} note={block.note} portrait data={resolvedEntities?.artists[block.artistId]} />
                            })}
                        </div>
                    )
                    : Array.isArray(item)
                        ? (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-1.5 my-3">
                                {item.map((block, j) => (
                                    <BlogBlockItem key={j} block={block} resolvedEntities={resolvedEntities} />
                                ))}
                            </div>
                        )
                        : <BlogBlockItem key={idx} block={item as BlogBlock} resolvedEntities={resolvedEntities} />
                const nextRow = rows[idx + 1]
                const nextIsHeading = !Array.isArray(nextRow) && nextRow && !('items' in nextRow) && (nextRow as BlogBlock).type === 'blog_heading'
                return (
                    <Fragment key={idx}>
                        {el}
                        {AD_POSITIONS.has(idx + 1) && !nextIsHeading && <InArticleAd id={`ad-${idx}`} />}
                    </Fragment>
                )
            })}
        </div>
    )
}

function BlogBlockItem({ block, resolvedEntities }: { block: BlogBlock; resolvedEntities?: ResolvedEntities }) {
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
            return <p className="mb-5 leading-relaxed text-foreground text-lg text-justify hyphens-auto">{renderInline(block.text)}</p>

        case 'blog_quote':
            return (
                <blockquote className="pl-5 my-7 italic py-3 pr-4 rounded-r-xl"
                    style={{ borderLeft: '4px solid #ff2d78', backgroundColor: 'rgba(255,45,120,0.04)', color: '#6b6b6b' }}>
                    <p className="mb-1">{block.text}</p>
                    {block.author && <footer className="text-xs text-muted not-italic">— {block.author}</footer>}
                </blockquote>
            )

        case 'blog_image':
            return <ImageBlock block={block} />

        case 'blog_gallery':
            return <GalleryBlock block={block} />

        case 'blog_video': {
            const ytMatch = block.url.match(
                /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
            )
            const isShorts = block.url.includes('/shorts/')
            return ytMatch ? (
                <div className="my-8 space-y-2">
                    <div className={`rounded-2xl overflow-hidden border border-border ${isShorts ? 'aspect-[9/16] max-w-xs mx-auto' : 'aspect-video'}`}>
                        <iframe
                            src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={block.caption || 'Vídeo'}
                            loading="lazy"
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

        case 'blog_spotify':   return <SpotifyBlock block={block} />
        case 'blog_timeline':  return <TimelineBlock block={block} />

        case 'blog_artist_card':
            return <ArtistCardBlock artistId={block.artistId} note={block.note} compact={block.compact} data={resolvedEntities?.artists[block.artistId]} />

        case 'blog_production_card':
            return <ProductionCardBlock productionId={block.productionId} note={block.note} data={resolvedEntities?.productions[block.productionId]} />

        case 'blog_group_card':
            return <GroupCardBlock groupId={block.groupId} note={block.note} compact={block.compact} data={resolvedEntities?.groups[block.groupId]} />

        case 'blog_stats_row':
            return (
                <div className="my-6 rounded-xl border border-border overflow-hidden">
                    {block.items.filter(item => item.label || item.value).map((item, idx) => (
                        <div key={idx} className={`flex items-center px-4 py-2.5 text-sm ${idx % 2 === 0 ? 'bg-surface' : 'bg-background'}`}>
                            <span className="text-muted font-medium w-1/3 shrink-0">
                                {item.label}
                            </span>
                            <span className="text-foreground font-semibold">{item.value}</span>
                        </div>
                    ))}
                </div>
            )

        case 'blog_rating':
            return (
                <div className="my-8 p-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/[.05]">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-yellow-400">{block.score.toFixed(1)}</span>
                            <span className="text-muted text-lg">/10</span>
                        </div>
                        <div>
                            {block.label && (
                                <p className="text-xs font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-400">{block.label}</p>
                            )}
                            <div className="flex gap-0.5 mt-1.5">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className={`h-1.5 w-4 rounded-full ${i < Math.round(block.score) ? 'bg-yellow-400' : 'bg-border'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                    {block.summary && <p className="text-sm text-muted leading-relaxed italic">{block.summary}</p>}
                </div>
            )

        case 'blog_callout': {
            const variants = {
                fact:    { border: '#ff2d78', bg: 'rgba(255,45,120,0.06)',  label: 'FATO',   dot: 'bg-[#ff2d78]' },
                stat:    { border: '#f59e0b', bg: 'rgba(245,158,11,0.06)', label: 'DADOS',  dot: 'bg-amber-400' },
                info:    { border: '#3b82f6', bg: 'rgba(59,130,246,0.06)', label: 'INFO',   dot: 'bg-blue-400'  },
                warning: { border: '#f97316', bg: 'rgba(249,115,22,0.06)', label: 'ATENÇÃO',dot: 'bg-orange-400'},
            }
            const v = variants[block.variant] ?? variants.info
            return (
                <div className="my-7 rounded-xl px-5 py-4"
                    style={{ borderLeft: `3px solid ${v.border}`, background: v.bg }}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.dot}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: v.border }}>
                            {v.label}
                        </span>
                    </div>
                    {block.title && <p className="text-sm font-bold text-foreground mb-1">{block.title}</p>}
                    <p className="text-sm leading-relaxed text-foreground">{renderInline(block.text)}</p>
                </div>
            )
        }

        case 'blog_curiosity':
            return (
                <div className="my-7 rounded-xl px-5 py-4"
                    style={{ borderLeft: '3px solid rgba(255,45,120,0.5)', background: 'rgba(255,45,120,0.04)' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#ff2d78] mb-1.5">Você sabia?</p>
                    <p className="text-sm leading-relaxed text-foreground">{renderInline(block.text)}</p>
                </div>
            )

        case 'blog_highlight':
            return (
                <div
                    className="my-10 py-8 px-6 text-center rounded-2xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,45,120,0.05) 0%, rgba(255,45,120,0.02) 100%)',
                        border: '1px solid rgba(255,45,120,0.18)',
                    }}
                >
                    <p className="text-2xl md:text-3xl font-black leading-snug text-foreground" style={{ fontStyle: 'italic' }}>
                        &ldquo;{block.text}&rdquo;
                    </p>
                    {block.attribution && (
                        <p className="mt-3 text-sm text-muted font-medium tracking-wide">— {block.attribution}</p>
                    )}
                </div>
            )

        case 'blog_list': {
            const Tag = block.ordered ? 'ol' : 'ul'
            return (
                <Tag className={`my-5 space-y-2 pl-1 ${block.ordered ? 'list-none counter-reset-[item]' : ''}`}>
                    {block.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-foreground leading-relaxed">
                            {block.ordered
                                ? <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff2d78]/10 text-[#ff2d78] text-xs font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                                : <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#ff2d78]/60 mt-2" />
                            }
                            <span className="flex-1">{renderInline(item)}</span>
                        </li>
                    ))}
                </Tag>
            )
        }

        case 'blog_pros_cons':
            return (
                <div className="my-8 rounded-2xl border border-border overflow-hidden">
                    {block.title && (
                        <div className="px-4 py-2.5 bg-surface border-b border-border">
                            <p className="text-xs font-black uppercase tracking-widest text-muted">{block.title}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 divide-x divide-border">
                        <div className="p-4 space-y-2.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3">✓ Prós</p>
                            {block.pros.map((pro, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mt-0.5">
                                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </span>
                                    <span className="text-sm text-foreground leading-snug">{renderInline(pro)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 space-y-2.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-3">✗ Contras</p>
                            {block.cons.map((con, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mt-0.5">
                                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                    </span>
                                    <span className="text-sm text-foreground leading-snug">{renderInline(con)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )

        case 'blog_steps':
            return (
                <div className="my-8 space-y-3">
                    {block.title && <p className="text-xs font-black uppercase tracking-widest text-muted mb-4">{block.title}</p>}
                    {block.steps.map((step, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-surface border border-border hover:border-[#ff2d78]/20 transition-colors">
                            <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#ff2d78]/10 text-[#ff2d78] text-sm font-black flex items-center justify-center">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground mb-0.5">{step.title}</p>
                                <p className="text-sm text-muted leading-relaxed">{renderInline(step.text)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )

        case 'blog_product_card': {
            return (
                <div className="my-8 rounded-2xl border border-orange-500/20 bg-orange-500/[.03] overflow-hidden">
                    <div className="flex gap-4 p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={block.imageUrl} alt={block.name} className="w-24 h-24 rounded-xl object-cover flex-shrink-0 border border-border" loading="lazy" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground leading-snug mb-2 line-clamp-2">{block.name}</p>
                            {block.rating && (
                                <p className="text-xs text-muted mb-3">{'★'.repeat(Math.round(block.rating))} {block.rating.toFixed(1)}</p>
                            )}
                            <a href={block.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored"
                                className="inline-flex items-center gap-1.5 text-xs font-bold bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-400 transition-colors">
                                {block.cta ?? 'Comprar na Shopee'} →
                            </a>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-muted/60 pb-2">Comprar pelo nosso link apoia o HallyuHub sem custo extra</p>
                </div>
            )
        }

        case 'blog_comparison':
            return (
                <div className="my-8 rounded-2xl border border-border overflow-x-auto">
                    {block.title && (
                        <div className="px-4 py-2.5 bg-surface border-b border-border">
                            <p className="text-xs font-black uppercase tracking-widest text-muted">{block.title}</p>
                        </div>
                    )}
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface">
                                <th className="text-left px-4 py-2.5 text-xs font-black text-muted uppercase tracking-wide border-b border-border w-1/3"></th>
                                {block.columns.map((col, i) => (
                                    <th key={i} className="text-center px-4 py-2.5 text-xs font-black text-[#ff2d78] uppercase tracking-wide border-b border-border">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {block.rows.map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-surface'}>
                                    <td className="px-4 py-2.5 font-semibold text-muted text-xs">{row.label}</td>
                                    {row.values.map((val, j) => (
                                        <td key={j} className="px-4 py-2.5 text-center text-foreground">{renderInline(val)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )

        case 'blog_divider':
            return (
                <div className="my-10 flex items-center gap-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[#ff2d78]/40 text-sm">✦</span>
                    <div className="flex-1 h-px bg-border" />
                </div>
            )

        default:
            return null
    }
}

// ─── Embedded entity cards ─────────────────────────────────────────────────────

function ArtistCardBlock({ artistId, note, compact, portrait, data }: { artistId: string; note?: string; compact?: boolean; portrait?: boolean; data?: ResolvedArtist }) {
    if (!artistId) return null
    const role = data?.roles?.[0]

    if (compact) {
        return (
            <Link href={`/artists/${artistId}`}
                className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border hover:border-[#ff2d78]/40 bg-surface hover:bg-surface-hover transition-all">
                <div className="w-8 h-8 rounded-full bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-[#ff2d78]">
                    {data?.primaryImageUrl
                        ? <Image src={data.primaryImageUrl} alt={data.nameRomanized} width={32} height={32} className="w-full h-full object-cover" />
                        : <span>{data?.nameRomanized?.[0] ?? '?'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-[#ff2d78] transition-colors truncate">
                        {data?.nameRomanized ?? artistId}
                    </p>
                    {note && <p className="text-[11px] text-muted leading-snug truncate">{note}</p>}
                </div>
                <span className="text-[10px] text-muted shrink-0 group-hover:text-[#ff2d78]">→</span>
            </Link>
        )
    }

    if (portrait) {
        return (
            <div className="flex flex-col">
                <Link href={`/artists/${artistId}`}
                    className="group block relative rounded-2xl overflow-hidden border border-border/60 hover:border-[#ff2d78]/60 shadow-sm hover:shadow-xl transition-all aspect-[2/3]">
                    {data?.primaryImageUrl ? (
                        <Image
                            src={data.primaryImageUrl}
                            alt={data?.nameRomanized ?? artistId}
                            fill
                            className="object-cover object-top group-hover:scale-[1.05] transition-transform duration-700"
                            sizes="(max-width: 768px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#ff2d78]/20 via-surface to-surface-hover">
                            <span className="text-5xl font-black text-[#ff2d78]/60">{data?.nameRomanized?.[0] ?? '?'}</span>
                        </div>
                    )}
                    {/* gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    {/* hover: "Ver perfil" badge */}
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-[9px] font-bold text-white bg-[#ff2d78] px-2 py-0.5 rounded-full tracking-wide">Ver perfil</span>
                    </div>
                    {/* bottom info */}
                    <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#ff2d78] mb-0.5">Artista</p>
                        <p className="text-sm font-black text-white leading-tight">{data?.nameRomanized ?? artistId}</p>
                        {role && <p className="text-[10px] text-white/60 mt-0.5 truncate">{role}</p>}
                    </div>
                </Link>
                {note && <p className="text-[11px] text-muted mt-2 leading-relaxed px-0.5">{note}</p>}
            </div>
        )
    }

    // Solo expanded card
    return (
        <Link href={`/artists/${artistId}`}
            className="group flex items-start gap-5 my-4 p-4 rounded-2xl border border-border hover:border-[#ff2d78]/40 bg-surface hover:bg-surface-hover transition-all shadow-sm hover:shadow-md">
            <div className="relative w-28 h-36 rounded-xl overflow-hidden shrink-0 border border-border/60">
                {data?.primaryImageUrl ? (
                    <Image
                        src={data.primaryImageUrl}
                        alt={data?.nameRomanized ?? artistId}
                        fill
                        className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                        sizes="112px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff2d78]/15 to-surface text-3xl font-black text-[#ff2d78]/70">
                        {data?.nameRomanized?.[0] ?? '?'}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0 py-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#ff2d78] bg-[#ff2d78]/10 px-2 py-0.5 rounded-full inline-block mb-2">Artista</span>
                <p className="text-xl font-black text-foreground group-hover:text-[#ff2d78] transition-colors leading-tight">
                    {data?.nameRomanized ?? artistId}
                </p>
                {role && <p className="text-sm text-muted mt-1">{role}</p>}
                {note && <p className="text-sm text-muted mt-2.5 leading-relaxed">{note}</p>}
                <p className="text-xs text-[#ff2d78] mt-3 font-bold flex items-center gap-1">
                    Ver perfil completo
                    <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                </p>
            </div>
        </Link>
    )
}

const TYPE_LABELS: Record<string, string> = {
    DRAMA: 'K-Drama', FILM: 'Filme', MOVIE: 'Filme', VARIETY: 'Variety',
    DOCUMENTARY: 'Documentário', WEBSERIES: 'Web Series',
}

function GroupCardBlock({ groupId, note, compact, data }: { groupId: string; note?: string; compact?: boolean; data?: ResolvedGroup }) {
    if (!groupId) return null
    if (compact) {
        return (
            <Link href={`/groups/${groupId}`}
                className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border hover:border-[#ff2d78]/40 bg-surface hover:bg-surface-hover transition-all">
                <div className="w-8 h-8 rounded-full bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-[#ff2d78]">
                    {data?.profileImageUrl
                        ? <Image src={data.profileImageUrl} alt={data.name} width={32} height={32} className="w-full h-full object-cover" />
                        : <span>{data?.name?.[0] ?? '?'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-[#ff2d78] transition-colors truncate">{data?.name ?? groupId}</p>
                    {note && <p className="text-[11px] text-muted leading-snug truncate">{note}</p>}
                </div>
                <span className="text-[10px] text-muted shrink-0 group-hover:text-[#ff2d78]">→</span>
            </Link>
        )
    }
    return (
        <Link href={`/groups/${groupId}`}
            className="group my-4 rounded-2xl border border-border hover:border-[#ff2d78]/60 bg-surface hover:bg-surface-hover overflow-hidden transition-all shadow-sm hover:shadow-lg block">
            {/* Banner gradient header */}
            <div className="relative h-20 bg-gradient-to-r from-[#ff2d78]/15 via-[#ff2d78]/05 to-transparent">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[9px] font-bold text-white bg-[#ff2d78] px-2.5 py-1 rounded-full">Ver grupo →</span>
                </div>
            </div>
            {/* Avatar overlapping banner */}
            <div className="px-5 pb-5">
                <div className="relative -mt-10 mb-3">
                    <div className="w-20 h-20 rounded-2xl border-4 border-surface bg-surface overflow-hidden shadow-lg flex items-center justify-center text-2xl font-black text-[#ff2d78]/60">
                        {data?.profileImageUrl ? (
                            <Image src={data.profileImageUrl} alt={data.name} width={80} height={80} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                        ) : (
                            <span>{data?.name?.[0] ?? '?'}</span>
                        )}
                    </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#ff2d78] bg-[#ff2d78]/10 px-2 py-0.5 rounded-full inline-block mb-1.5">Grupo</span>
                <p className="text-xl font-black text-foreground group-hover:text-[#ff2d78] transition-colors leading-tight">
                    {data?.name ?? groupId}
                </p>
                {data?.fanClubName && <p className="text-sm text-muted mt-1">Fandom: <strong className="text-foreground font-semibold">{data.fanClubName}</strong></p>}
                {note && <p className="text-sm text-muted mt-2 leading-relaxed">{note}</p>}
                <p className="text-xs text-[#ff2d78] mt-3 font-bold flex items-center gap-1">
                    Ver perfil do grupo
                    <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                </p>
            </div>
        </Link>
    )
}

function ProductionCardBlock({ productionId, note, data }: { productionId: string; note?: string; data?: ResolvedProduction }) {
    if (!productionId) return null
    const typeLabel = data?.type ? (TYPE_LABELS[data.type] ?? data.type) : null
    return (
        <Link href={`/productions/${productionId}`}
            className="group flex my-4 rounded-2xl border border-border hover:border-[#ff2d78]/60 bg-surface hover:bg-surface-hover overflow-hidden transition-all shadow-sm hover:shadow-lg">
            {/* Poster */}
            <div className="relative w-28 shrink-0 bg-surface-hover min-h-[160px]">
                {data?.imageUrl ? (
                    <Image src={data.imageUrl} alt={data?.titlePt ?? ''} fill className="object-cover group-hover:scale-[1.04] transition-transform duration-500" sizes="112px" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-[#ff2d78]/30">
                        {data?.titlePt?.slice(0, 2).toUpperCase() ?? '?'}
                    </div>
                )}
                {data?.year && (
                    <div className="absolute bottom-2 inset-x-0 flex justify-center">
                        <span className="text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">{data.year}</span>
                    </div>
                )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0 p-4 py-5">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#ff2d78] bg-[#ff2d78]/10 px-2 py-0.5 rounded-full inline-block mb-2">
                    {typeLabel ?? 'Produção'}
                </span>
                <p className="text-lg font-black text-foreground group-hover:text-[#ff2d78] transition-colors leading-tight">
                    {data?.titlePt ?? productionId}
                </p>
                {note && <p className="text-sm text-muted mt-2 leading-relaxed">{note}</p>}
                <p className="text-xs text-[#ff2d78] mt-3 font-bold flex items-center gap-1">
                    Ver detalhes
                    <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                </p>
            </div>
        </Link>
    )
}
