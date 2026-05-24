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
                    try {
                        ;((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle = (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({})
                    } catch {
                        pushed.current = false
                    }
                }
            },
            { rootMargin: '800px' }
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
        const linkCls = "text-accent underline underline-offset-4 hover:brightness-110 transition-all"
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
    const [error, setError] = useState(false)
    const sizeClass =
        block.size === 'small'  ? 'mx-auto max-w-[260px]' :
        block.size === 'medium' ? 'mx-auto max-w-sm' :
        block.fullWidth         ? 'w-full' :
                                  'w-full md:w-auto max-w-full'
    return (
        <>
            <span className="block my-8">
                <span className={`block ${sizeClass}`}>
                    {error ? (
                        <span className="flex items-center justify-center w-full aspect-video rounded-2xl border border-border bg-surface text-muted text-sm gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                            <span className="opacity-50">Imagem indisponível</span>
                        </span>
                    ) : (
                        <button
                            onClick={() => setOpen(true)}
                            className="relative group w-full block cursor-zoom-in"
                            aria-label="Ampliar imagem"
                        >
                            <img
                                src={proxied(block.url)}
                                alt={block.caption || ''}
                                className="w-full rounded-2xl border border-border shadow-xl group-hover:brightness-[.93] transition-all duration-200"
                                loading="lazy"
                                onError={() => setError(true)}
                            />
                            <span className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                <Maximize2 className="w-3.5 h-3.5" />
                            </span>
                        </button>
                    )}
                </span>
                {block.caption && (
                    <span className="block text-center text-xs text-muted mt-2 italic">{block.caption}</span>
                )}
            </span>
            {open && block.url && !error && (
                <Lightbox urls={[block.url]} startIdx={0} caption={block.caption} onClose={() => setOpen(false)} />
            )}
        </>
    )
}

// ── Gallery block with lightbox ───────────────────────────────────────────────

function GalleryItem({ url, caption, idx, onOpen }: { url: string; caption?: string; idx: number; onOpen: () => void }) {
    const [error, setError] = useState(false)
    if (error) return (
        <span className="aspect-video flex items-center justify-center rounded-xl border border-border bg-surface text-muted text-xs gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            <span className="opacity-50">Indisponível</span>
        </span>
    )
    return (
        <button onClick={onOpen} className="aspect-video relative rounded-xl overflow-hidden border border-border cursor-zoom-in group">
            <img
                src={proxied(url)}
                alt={`${caption ?? 'Imagem'} ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                loading="lazy"
                onError={() => setError(true)}
            />
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
        </button>
    )
}

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
                        <GalleryItem key={i} url={url} caption={block.caption} idx={i} onOpen={() => setLightboxIdx(i)} />
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
                            <span className="text-xs font-black text-accent leading-none">{item.year}</span>
                        </div>
                        <div className="shrink-0 w-[12px] flex flex-col items-center mr-4">
                            <span
                                className="w-3 h-3 rounded-full shrink-0 border-2 border-background mt-0.5 shadow-[0_0_0_2px_rgba(255,45,120,0.35)]"
                                style={{ background: 'var(--color-accent)' }}
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

// ── Interactive blocks ────────────────────────────────────────────────────────

function AccordionBlock({ block }: { block: Extract<BlogBlock, { type: 'blog_accordion' }> }) {
    const [open, setOpen] = useState<number | null>(null)
    return (
        <div className="my-8">
            {block.title && <h3 className="text-[15px] font-bold text-foreground mb-3">{block.title}</h3>}
            <div className="flex flex-col gap-2">
                {block.items.map((item, i) => (
                    <div key={i} className={`border rounded-xl overflow-hidden transition-colors ${open === i ? 'border-accent/40 bg-accent/5' : 'border-border bg-surface/30'}`}>
                        <button
                            onClick={() => setOpen(open === i ? null : i)}
                            className="w-full flex items-center justify-between px-5 py-3.5 text-left gap-3"
                        >
                            <span className="font-semibold text-foreground text-[14px]">{item.question}</span>
                            <span className={`shrink-0 text-[18px] transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`}>+</span>
                        </button>
                        {open === i && (
                            <div className="px-5 pb-4 text-[13px] text-muted leading-relaxed border-t border-border/50">
                                <div className="pt-3">{item.answer}</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

function TabsBlock({ block }: { block: Extract<BlogBlock, { type: 'blog_tabs' }> }) {
    const [active, setActive] = useState(0)
    return (
        <div className="my-8">
            <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
                {block.tabs.map((tab, i) => (
                    <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={`px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                            active === i
                                ? 'border-accent text-accent'
                                : 'border-transparent text-muted hover:text-foreground'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="text-[13px] text-muted leading-relaxed">
                {block.tabs[active]?.content}
            </div>
        </div>
    )
}

function TriviaBlock({ block }: { block: Extract<BlogBlock, { type: 'blog_trivia' }> }) {
    const [revealed, setRevealed] = useState(false)
    return (
        <div className="my-8 border border-purple-400/30 rounded-2xl bg-purple-500/5 overflow-hidden">
            <div className="px-5 py-4">
                <p className="text-[11px] font-bold text-purple-500 uppercase tracking-wider mb-2">🧠 Trivia</p>
                <p className="text-[15px] font-semibold text-foreground leading-snug">{block.question}</p>
                {block.hint && !revealed && (
                    <p className="text-[12px] text-muted/70 italic mt-2">💬 {block.hint}</p>
                )}
            </div>
            <div className="border-t border-purple-400/20 px-5 py-3">
                {revealed ? (
                    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                        <p className="text-[13px] font-semibold text-purple-400 mb-1">Resposta:</p>
                        <p className="text-[13px] text-foreground leading-relaxed">{block.answer}</p>
                    </div>
                ) : (
                    <button
                        onClick={() => setRevealed(true)}
                        className="text-[12px] font-bold text-purple-500 hover:text-purple-400 transition-colors flex items-center gap-2"
                    >
                        <span>👁</span> Revelar resposta
                    </button>
                )}
            </div>
        </div>
    )
}

// ── New interactive block components ─────────────────────────────────────────

const PLATFORM_ICONS: Record<string, string> = {
    twitter: '𝕏', reddit: '🔴', instagram: '📸', tiktok: '🎵', forum: '💬',
}

function VsBlock({ block }: { block: Extract<BlogBlock, { type: 'blog_vs' }> }) {
    const storageKey = `vs_${block.optionA.label}_${block.optionB.label}`
    const [voted, setVoted] = useState<'a' | 'b' | null>(null)
    const [counts, setCounts] = useState({ a: 47, b: 53 })
    useEffect(() => {
        const saved = localStorage.getItem(storageKey)
        if (saved) setVoted(saved as 'a' | 'b')
    }, [storageKey])
    const vote = (side: 'a' | 'b') => {
        if (voted) return
        setVoted(side); localStorage.setItem(storageKey, side)
        setCounts(c => ({ ...c, [side]: c[side] + 1 }))
    }
    const total = counts.a + counts.b
    const pctA = Math.round((counts.a / total) * 100)
    const pctB = 100 - pctA
    return (
        <div className="my-8 rounded-2xl border border-border overflow-hidden">
            {block.question && (
                <div className="px-5 py-3 bg-surface/60 border-b border-border text-center">
                    <p className="text-[13px] font-bold text-foreground">{block.question}</p>
                </div>
            )}
            <div className="grid grid-cols-2">
                {(['a', 'b'] as const).map(side => {
                    const opt = side === 'a' ? block.optionA : block.optionB
                    const pct = side === 'a' ? pctA : pctB
                    const isWinner = voted && pct > (side === 'a' ? pctB : pctA)
                    return (
                        <button key={side} onClick={() => vote(side)} disabled={!!voted}
                            className={`flex flex-col items-center gap-3 p-5 transition-colors ${!voted ? 'hover:bg-accent/5 cursor-pointer' : 'cursor-default'} ${voted && isWinner ? 'bg-accent/8' : ''} ${side === 'a' ? 'border-r border-border' : ''}`}>
                            {opt.imageUrl && (
                                <img src={opt.imageUrl} alt={opt.label} className="w-20 h-20 rounded-full object-cover object-top border-2 border-border" />
                            )}
                            <div className="text-center">
                                <p className="font-black text-[15px] text-foreground">{opt.label}</p>
                                {opt.description && <p className="text-[11px] text-muted mt-0.5">{opt.description}</p>}
                            </div>
                            {voted ? (
                                <div className="w-full">
                                    <div className="h-1.5 rounded-full bg-border overflow-hidden mb-1">
                                        <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className={`text-[13px] font-black ${isWinner ? 'text-accent' : 'text-muted'}`}>{pct}%</p>
                                </div>
                            ) : <span className="text-[11px] font-bold text-accent border border-accent/30 rounded-full px-3 py-1">Votar</span>}
                        </button>
                    )
                })}
            </div>
            {!voted && <p className="text-center text-[10px] text-muted py-2 border-t border-border">Clique para votar</p>}
        </div>
    )
}

function PollBlock({ block }: { block: Extract<BlogBlock, { type: 'blog_poll' }> }) {
    const storageKey = `poll_${block.question}`
    const [voted, setVoted] = useState<number | null>(null)
    const [votes, setVotes] = useState<number[]>(() => block.options.map(() => Math.floor(Math.random() * 40) + 10))
    useEffect(() => {
        const saved = localStorage.getItem(storageKey)
        if (saved !== null) setVoted(Number(saved))
    }, [storageKey])
    const vote = (i: number) => {
        if (voted !== null) return
        setVoted(i); localStorage.setItem(storageKey, String(i))
        setVotes(v => v.map((n, idx) => idx === i ? n + 1 : n))
    }
    const total = votes.reduce((a, b) => a + b, 0)
    return (
        <div className="my-8 border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-surface/40">
                <p className="text-[11px] font-bold text-accent uppercase tracking-wider mb-1">📊 Enquete</p>
                <p className="text-[15px] font-bold text-foreground">{block.question}</p>
            </div>
            <div className="divide-y divide-border">
                {block.options.map((opt, i) => {
                    const pct = Math.round((votes[i] / total) * 100)
                    const isTop = voted !== null && votes[i] === Math.max(...votes)
                    return (
                        <button key={i} onClick={() => vote(i)} disabled={voted !== null}
                            className="w-full px-5 py-3.5 text-left relative overflow-hidden hover:bg-surface/40 transition-colors disabled:cursor-default">
                            {voted !== null && (
                                <div className="absolute inset-y-0 left-0 bg-accent/8 transition-all duration-500 rounded-r" style={{ width: `${pct}%` }} />
                            )}
                            <div className="relative flex items-center justify-between">
                                <span className={`text-[13px] font-semibold ${voted === i ? 'text-accent' : 'text-foreground'}`}>{opt}</span>
                                {voted !== null && <span className={`text-[12px] font-bold ${isTop ? 'text-accent' : 'text-muted'}`}>{pct}%</span>}
                            </div>
                        </button>
                    )
                })}
            </div>
            {voted !== null && <p className="text-[10px] text-muted text-center py-2 border-t border-border">{total} votos totais</p>}
        </div>
    )
}

function BeforeAfterBlock({ block }: { block: Extract<BlogBlock, { type: 'blog_before_after' }> }) {
    const [position, setPosition] = useState(50)
    const containerRef = useRef<HTMLDivElement>(null)
    const dragging = useRef(false)
    const update = (clientX: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setPosition(Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100)))
    }
    return (
        <div className="my-8 space-y-2">
            {block.caption && <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{block.caption}</p>}
            <div ref={containerRef} className="relative rounded-2xl overflow-hidden border border-border select-none cursor-ew-resize" style={{ aspectRatio: '16/9' }}
                onMouseDown={() => { dragging.current = true }}
                onMouseMove={e => { if (dragging.current) update(e.clientX) }}
                onMouseUp={() => { dragging.current = false }}
                onMouseLeave={() => { dragging.current = false }}
                onTouchMove={e => update(e.touches[0].clientX)}>
                <img src={block.after.url} alt={block.after.label || 'Depois'} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
                    <img src={block.before.url} alt={block.before.label || 'Antes'} className="absolute inset-0 object-cover" style={{ width: `${10000 / position}%`, height: '100%', maxWidth: 'none' }} />
                </div>
                <div className="absolute inset-y-0 flex items-center pointer-events-none" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
                    <div className="w-0.5 h-full bg-white/80" />
                    <div className="absolute w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center text-[11px] font-bold text-gray-700">⇔</div>
                </div>
                <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white/90 bg-black/50 px-2 py-0.5 rounded-full">{block.before.label || 'Antes'}</span>
                <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white/90 bg-black/50 px-2 py-0.5 rounded-full">{block.after.label || 'Depois'}</span>
            </div>
        </div>
    )
}

function QuizBlock({ block }: { block: Extract<BlogBlock, { type: 'blog_quiz' }> }) {
    const [current, setCurrent] = useState(0)
    const [answers, setAnswers] = useState<(number | null)[]>(Array(block.questions.length).fill(null))
    const [finished, setFinished] = useState(false)
    const answer = (i: number) => {
        if (answers[current] !== null) return
        const next = [...answers]; next[current] = i; setAnswers(next)
        setTimeout(() => {
            if (current + 1 < block.questions.length) setCurrent(c => c + 1)
            else setFinished(true)
        }, 800)
    }
    const score = answers.filter((a, i) => a === block.questions[i]?.correct).length
    const q = block.questions[current]
    return (
        <div className="my-8 border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-surface/60 border-b border-border flex items-center justify-between">
                <p className="text-[13px] font-bold text-foreground">🎯 {block.title ?? 'Quiz'}</p>
                {!finished && <span className="text-[11px] text-muted">{current + 1}/{block.questions.length}</span>}
            </div>
            {finished ? (
                <div className="p-8 text-center">
                    <p className="text-4xl font-black text-foreground mb-2">{score}/{block.questions.length}</p>
                    <p className="text-[14px] text-muted mb-4">
                        {score === block.questions.length ? '🏆 Perfeito!' : score >= block.questions.length * 0.6 ? '🎉 Muito bem!' : '😅 Tente novamente!'}
                    </p>
                    <button onClick={() => { setCurrent(0); setAnswers(Array(block.questions.length).fill(null)); setFinished(false) }}
                        className="px-4 py-2 rounded-lg bg-accent text-white text-[12px] font-bold hover:opacity-90 transition-opacity">
                        Tentar novamente
                    </button>
                </div>
            ) : (
                <div className="p-5">
                    <div className="flex gap-1 mb-4">
                        {block.questions.map((_, i) => (
                            <div key={i} className={`flex-1 h-1 rounded-full ${i < current ? 'bg-accent' : i === current ? 'bg-accent/40' : 'bg-border'}`} />
                        ))}
                    </div>
                    <p className="text-[15px] font-bold text-foreground mb-4">{q.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, i) => {
                            const answered = answers[current] !== null
                            const isCorrect = i === q.correct
                            const isChosen = answers[current] === i
                            return (
                                <button key={i} onClick={() => answer(i)}
                                    className={`px-4 py-3 rounded-xl text-[13px] font-semibold border text-left transition-colors ${
                                        !answered ? 'border-border hover:border-accent hover:bg-accent/5'
                                        : isCorrect ? 'border-green-400 bg-green-500/10 text-green-600'
                                        : isChosen ? 'border-red-400 bg-red-500/10 text-red-600'
                                        : 'border-border text-muted'
                                    }`}>
                                    {opt}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

function CountdownBlock({ block }: { block: Extract<BlogBlock, { type: 'blog_countdown' }> }) {
    const calc = () => {
        const diff = Math.max(0, new Date(block.targetDate).getTime() - Date.now())
        return {
            d: Math.floor(diff / 86400000),
            h: Math.floor((diff % 86400000) / 3600000),
            m: Math.floor((diff % 3600000) / 60000),
            s: Math.floor((diff % 60000) / 1000),
            done: diff === 0,
        }
    }
    const [time, setTime] = useState(calc)
    useEffect(() => {
        const t = setInterval(() => setTime(calc()), 1000)
        return () => clearInterval(t)
    })
    return (
        <div className="my-8 rounded-2xl overflow-hidden border border-pink-400/30 bg-gradient-to-br from-pink-950/20 to-violet-950/20">
            <div className="px-5 py-4 text-center">
                <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-1">⏳ {time.done ? 'Já chegou!' : 'Próximo Comeback'}</p>
                <p className="text-[18px] font-black text-foreground mb-1">{block.artist} — {block.title}</p>
                {block.description && <p className="text-[12px] text-muted mb-4">{block.description}</p>}
                {!time.done ? (
                    <div className="flex justify-center gap-3">
                        {[{ v: time.d, label: 'dias' }, { v: time.h, label: 'horas' }, { v: time.m, label: 'min' }, { v: time.s, label: 'seg' }].map(({ v, label }) => (
                            <div key={label} className="flex flex-col items-center bg-background/60 border border-border rounded-xl px-4 py-3 min-w-[60px]">
                                <span className="text-[28px] font-black text-foreground tabular-nums">{String(v).padStart(2, '0')}</span>
                                <span className="text-[10px] text-muted font-semibold">{label}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[16px] font-bold text-accent">🎉 Já disponível!</p>
                )}
            </div>
        </div>
    )
}

function FlashcardBlock({ block }: { block: Extract<BlogBlock, { type: 'blog_flashcard' }> }) {
    const [idx, setIdx] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const card = block.cards[idx]
    return (
        <div className="my-8 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-foreground">🇰🇷 {block.title ?? 'Aprenda Coreano'}</p>
                <span className="text-[11px] text-muted">{idx + 1}/{block.cards.length}</span>
            </div>
            <div className="cursor-pointer" onClick={() => setFlipped(f => !f)} style={{ perspective: '1000px' }}>
                <div className="relative transition-transform duration-500 rounded-2xl" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none', minHeight: '160px' }}>
                    <div className="absolute inset-0 border border-border rounded-2xl bg-surface flex flex-col items-center justify-center p-6 text-center" style={{ backfaceVisibility: 'hidden' }}>
                        <p className="text-4xl font-black text-foreground mb-2">{card.front}</p>
                        {card.romanized && <p className="text-[12px] text-muted">({card.romanized})</p>}
                        <p className="text-[10px] text-muted/60 mt-3">Clique para ver a tradução</p>
                    </div>
                    <div className="absolute inset-0 border border-accent/30 bg-accent/5 rounded-2xl flex flex-col items-center justify-center p-6 text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <p className="text-[18px] font-black text-foreground mb-1">{card.back}</p>
                        {card.example && <p className="text-[12px] text-muted italic mt-2 leading-relaxed">{card.example}</p>}
                    </div>
                </div>
            </div>
            <div className="flex justify-center gap-2">
                <button onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false) }} disabled={idx === 0}
                    className="px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-muted hover:text-foreground disabled:opacity-30">← Anterior</button>
                <button onClick={() => { setIdx(i => Math.min(block.cards.length - 1, i + 1)); setFlipped(false) }} disabled={idx === block.cards.length - 1}
                    className="px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-muted hover:text-foreground disabled:opacity-30">Próximo →</button>
            </div>
        </div>
    )
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

    // Pre-compute which rows should show an ad AFTER them.
    // Rule: ad is scheduled at position P; find the next row >= P that is
    // not a heading and whose *next* row is also not a heading.
    const adAfter = new Set<number>()
    for (const pos of AD_POSITIONS) {
        for (let i = pos - 1; i < rows.length; i++) {
            const cur = rows[i]
            const next = rows[i + 1]
            const curIsHeading = !Array.isArray(cur) && (cur as BlogBlock).type === 'blog_heading'
            const nextIsHeading = next && !Array.isArray(next) && (next as BlogBlock).type === 'blog_heading'
            if (!curIsHeading && !nextIsHeading) { adAfter.add(i); break }
        }
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
                        : <BlogBlockItem key={idx} block={item as BlogBlock} resolvedEntities={resolvedEntities} isLead={idx === 0 && (item as BlogBlock).type === 'blog_paragraph'} />
                return (
                    <Fragment key={idx}>
                        {el}
                        {adAfter.has(idx) && <InArticleAd id={`blog-ad-${idx}`} />}
                    </Fragment>
                )
            })}
        </div>
    )
}

function BlogBlockItem({ block, resolvedEntities, isLead }: { block: BlogBlock; resolvedEntities?: ResolvedEntities; isLead?: boolean }) {
    switch (block.type) {

        case 'blog_heading': {
            const cls = "font-black text-foreground leading-tight tracking-tight"
            const headingId = block.text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
            const anchor = (
                <a href={`#${headingId}`} onClick={e => { e.preventDefault(); navigator.clipboard?.writeText(window.location.origin + window.location.pathname + '#' + headingId) }}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-accent text-base font-normal" aria-label="Copiar link da seção">#</a>
            )
            if (block.level === 1) return <h1 id={headingId} className={`group text-3xl md:text-4xl mt-10 mb-5 ${cls}`}>{block.text}{anchor}</h1>
            if (block.level === 3) return <h3 id={headingId} className={`group text-lg mt-7 mb-3 text-accent ${cls}`}>{block.text}{anchor}</h3>
            return (
                <h2 id={headingId} className={`group text-2xl mt-8 mb-4 pb-2 border-b border-accent/15 ${cls}`}>
                    {block.text}{anchor}
                </h2>
            )
        }

        case 'blog_paragraph':
            if (isLead) return <p className="mb-7 text-xl sm:text-2xl leading-loose font-medium text-foreground/90 text-justify hyphens-auto">{renderInline(block.text)}</p>
            return <p className="mb-6 leading-[1.85] text-foreground text-[17px] text-justify hyphens-auto">{renderInline(block.text)}</p>

        case 'blog_quote':
            return (
                <blockquote className="pl-5 my-7 italic py-3 pr-4 rounded-r-xl text-muted"
                    style={{ borderLeft: '4px solid var(--color-accent)', backgroundColor: 'var(--color-accent-soft)' }}>
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
                    className="text-accent underline underline-offset-4 my-4 block">
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
                fact:    { border: 'var(--color-accent)', bg: 'var(--color-accent-soft)',  label: 'FATO',   dot: 'bg-accent' },
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1.5">Você sabia?</p>
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
                                ? <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                                : <span className="flex-shrink-0 w-2 h-2 rounded-full bg-accent/60 mt-2" />
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
                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-surface border border-border hover:border-accent/20 transition-colors">
                            <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-accent/10 text-accent text-sm font-black flex items-center justify-center">{i + 1}</span>
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
                        {block.imageUrl && <img src={block.imageUrl} alt={block.name} className="w-24 h-24 rounded-xl object-cover flex-shrink-0 border border-border" loading="lazy" />}
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
                                    <th key={i} className="text-center px-4 py-2.5 text-xs font-black text-accent uppercase tracking-wide border-b border-border">{col}</th>
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
                    <span className="text-accent/40 text-sm">✦</span>
                    <div className="flex-1 h-px bg-border" />
                </div>
            )

        case 'blog_ad':
            return (
                <div className="my-6 flex items-center justify-center min-h-[100px] rounded-xl border border-dashed border-border bg-surface/50 text-muted text-xs">
                    {/* AdSense auto-ads preenche este slot automaticamente */}
                    <ins className="adsbygoogle block w-full"
                        data-ad-format="auto"
                        data-full-width-responsive="true" />
                </div>
            )

        case 'blog_accordion':
            return <AccordionBlock block={block} />

        case 'blog_tabs':
            return <TabsBlock block={block} />

        case 'blog_ranking':
            return (
                <div className="my-8">
                    {block.title && <h3 className="text-[15px] font-bold text-foreground mb-4">{block.title}</h3>}
                    <div className="flex flex-col gap-3">
                        {block.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-border bg-surface/40 hover:bg-surface transition-colors">
                                <span className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full font-black text-[15px] ${
                                    item.position === 1 ? 'bg-yellow-400 text-yellow-900' :
                                    item.position === 2 ? 'bg-slate-300 text-slate-700' :
                                    item.position === 3 ? 'bg-amber-600 text-white' :
                                    'bg-surface border border-border text-muted'
                                }`}>{item.position}</span>
                                {item.imageUrl && (
                                    <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-border">
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-foreground text-[14px]">{item.name}</p>
                                        {item.badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold border border-accent/20">{item.badge}</span>}
                                    </div>
                                    {item.description && <p className="text-[12px] text-muted mt-0.5 line-clamp-2">{item.description}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )

        case 'blog_trivia':
            return <TriviaBlock block={block} />

        case 'blog_comeback_card':
            return (
                <div className="my-8 rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-surface to-background">
                    {block.imageUrl && (
                        <div className="h-48 relative">
                            <img src={block.imageUrl} alt={block.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            {block.type_label && (
                                <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent text-white uppercase tracking-wider">
                                    {block.type_label}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="p-5">
                        <p className="text-[11px] font-semibold text-accent uppercase tracking-widest mb-1">{block.artist}</p>
                        <h3 className="text-[20px] font-black text-foreground leading-tight mb-2">{block.title}</h3>
                        <p className="text-[13px] text-muted mb-3">📅 {block.date}</p>
                        {block.description && <p className="text-[13px] text-muted leading-relaxed">{block.description}</p>}
                    </div>
                </div>
            )

        case 'blog_member_grid':
            return (
                <div className="my-8">
                    {block.title && <h3 className="text-[15px] font-bold text-foreground mb-4">{block.title}</h3>}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {block.members.map((m, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-surface/40 text-center">
                                {m.imageUrl ? (
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
                                        <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover object-top" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-surface border-2 border-border flex items-center justify-center text-2xl">
                                        🎤
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-foreground text-[13px]">{m.name}</p>
                                    {m.role && <p className="text-[11px] text-accent font-medium">{m.role}</p>}
                                    {m.note && <p className="text-[10px] text-muted mt-0.5">{m.note}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )

        case 'blog_setlist':
            return (
                <div className="my-8 border border-border rounded-2xl overflow-hidden">
                    {(block.event || block.date || block.venue) && (
                        <div className="bg-surface/60 px-5 py-3 border-b border-border">
                            {block.event && <p className="font-bold text-foreground text-[14px]">🎤 {block.event}</p>}
                            <div className="flex gap-4 mt-1">
                                {block.date && <span className="text-[11px] text-muted">📅 {block.date}</span>}
                                {block.venue && <span className="text-[11px] text-muted">📍 {block.venue}</span>}
                            </div>
                        </div>
                    )}
                    <div className="divide-y divide-border">
                        {block.tracks.map((t, i) => (
                            <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-surface/40 transition-colors">
                                <span className="text-[12px] font-bold text-muted/50 w-6 text-right shrink-0">{t.number}</span>
                                <p className="flex-1 text-[13px] font-medium text-foreground">{t.title}</p>
                                {t.note && <span className="text-[11px] text-muted italic">{t.note}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )

        case 'blog_alert': {
            const alertStyles = {
                info:    { border: 'border-blue-400/40',    bg: 'bg-blue-500/5',    icon: 'ℹ️',  title: 'Informação' },
                tip:     { border: 'border-green-400/40',   bg: 'bg-green-500/5',   icon: '💡',  title: 'Dica' },
                warning: { border: 'border-amber-400/40',   bg: 'bg-amber-500/5',   icon: '⚠️',  title: 'Atenção' },
                spoiler: { border: 'border-purple-400/40',  bg: 'bg-purple-500/5',  icon: '🚨',  title: 'Spoiler' },
            }
            const s = alertStyles[block.variant] ?? alertStyles.info
            return (
                <div className={`my-6 border rounded-xl px-5 py-4 ${s.border} ${s.bg}`}>
                    <p className="font-bold text-foreground text-[13px] mb-1 flex items-center gap-2">
                        <span>{s.icon}</span>
                        {block.title ?? s.title}
                    </p>
                    <p className="text-[13px] text-muted leading-relaxed">{block.text}</p>
                </div>
            )
        }

        case 'blog_vs': return <VsBlock block={block} />
        case 'blog_poll': return <PollBlock block={block} />
        case 'blog_before_after': return <BeforeAfterBlock block={block} />
        case 'blog_quiz': return <QuizBlock block={block} />
        case 'blog_countdown': return <CountdownBlock block={block} />
        case 'blog_flashcard': return <FlashcardBlock block={block} />

        case 'blog_idol_facts': {
            return (
                <div className="my-8 rounded-2xl border border-border overflow-hidden bg-surface">
                    <div className="flex items-center gap-4 px-5 py-4 border-b border-border bg-surface/60">
                        {block.imageUrl && (
                            <img src={block.imageUrl} alt={block.name} className="w-12 h-12 rounded-full object-cover object-top border-2 border-accent/30" />
                        )}
                        <div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest">Ficha</p>
                            <p className="text-base font-black text-foreground">{block.name}</p>
                        </div>
                    </div>
                    <div className="divide-y divide-border">
                        {block.facts.map((f, i) => (
                            <div key={i} className="flex justify-between items-center px-5 py-3 text-sm">
                                <span className="text-muted font-medium">{f.label}</span>
                                <span className="text-foreground font-bold text-right">{f.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }

        case 'blog_lyrics':
            return (
                <div className="my-8 border border-border rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 bg-surface/60 border-b border-border flex items-center justify-between">
                        <p className="text-[13px] font-bold text-foreground">🎵 {block.title ?? 'Trecho da Letra'}</p>
                        {block.source && <span className="text-[10px] text-muted">Fonte: {block.source}</span>}
                    </div>
                    <div className="divide-y divide-border">
                        {block.lines.map((line, i) => (
                            <div key={i} className="grid grid-cols-3 gap-0 divide-x divide-border">
                                <div className="px-4 py-3 text-[13px] font-semibold text-foreground">{line.original}</div>
                                <div className="px-4 py-3 text-[12px] text-muted italic">{line.romanized ?? ''}</div>
                                <div className="px-4 py-3 text-[12px] text-accent">{line.translation}</div>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-2 border-t border-border">
                        <span className="text-[10px] text-muted">Coreano • Romanização • Português</span>
                    </div>
                </div>
            )

        case 'blog_lyrics_parallel':
            return (
                <div className="my-8 overflow-hidden rounded-2xl border border-border">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border bg-surface/60 px-5 py-3">
                        <div className="flex items-center gap-2">
                            <span className="text-base">🎵</span>
                            <p className="text-[13px] font-bold text-foreground">
                                {block.title ?? 'Letra'}
                                {block.artist && <span className="ml-1.5 font-normal text-muted">— {block.artist}</span>}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {block.source && <span className="text-[10px] text-muted">{block.source}</span>}
                            <span className="rounded-full bg-surface px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted border border-border">
                                {block.lang === 'en' ? 'EN → PT' : block.lang === 'ja' ? 'JP → PT' : 'KO → PT'}
                            </span>
                        </div>
                    </div>
                    {/* Column headers */}
                    <div className="grid grid-cols-2 divide-x divide-border border-b border-border bg-surface/30">
                        <div className="px-5 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                            {block.lang === 'en' ? 'Original (Inglês)' : block.lang === 'ja' ? 'Original (Japonês)' : 'Original (Coreano)'}
                        </div>
                        <div className="px-5 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-accent">Tradução (Português)</div>
                    </div>
                    {/* Sections */}
                    {block.sections.map((section, i) => (
                        <div key={i} className={i < block.sections.length - 1 ? 'border-b border-border' : ''}>
                            {section.label && (
                                <div className="border-b border-border/50 bg-surface/20 px-5 py-1.5">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-violet">{section.label}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-2 divide-x divide-border">
                                {/* Original + romanização */}
                                <div className="space-y-0.5 px-5 py-4">
                                    {section.original.split('\n').map((line, j) => (
                                        <div key={j}>
                                            <p className="text-[13px] font-semibold leading-relaxed text-foreground">{line}</p>
                                            {section.romanized && (
                                                <p className="text-[11px] italic leading-snug text-muted">
                                                    {section.romanized.split('\n')[j] ?? ''}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {/* Tradução */}
                                <div className="px-5 py-4">
                                    {section.translation.split('\n').map((line, j) => (
                                        <p key={j} className="text-[13px] leading-relaxed text-accent">{line}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="border-t border-border bg-surface/20 px-5 py-2">
                        <span className="text-[10px] text-muted">
                            {block.lang === 'en' ? 'Inglês' : block.lang === 'ja' ? 'Japonês + Romanização' : 'Coreano + Romanização'} • Tradução em Português
                        </span>
                    </div>
                </div>
            )

        case 'blog_era_card':
            return (
                <div className="my-8 rounded-2xl border border-border overflow-hidden bg-gradient-to-br from-surface to-background">
                    <div className="h-32 relative flex items-end p-4"
                        style={block.imageUrl
                            ? { backgroundImage: `url(${block.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : { background: block.colors?.length ? `linear-gradient(135deg, ${block.colors.join(', ')})` : 'linear-gradient(135deg, #6D28D9, #EC4899)' }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="relative">
                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Era</p>
                            <h3 className="text-[24px] font-black text-white leading-none">{block.era}</h3>
                        </div>
                        {block.colors && block.colors.length > 0 && (
                            <div className="absolute top-3 right-3 flex gap-1.5">
                                {block.colors.map((c, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full border-2 border-white/30" style={{ background: c }} />
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex items-center gap-3 text-[12px] text-muted">
                            <span>📅 {block.period}</span>
                            {block.concept && <><span className="text-border">•</span><span>🎨 {block.concept}</span></>}
                        </div>
                        {block.highlights && block.highlights.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {block.highlights.map((h, i) => (
                                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">{h}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )

        case 'blog_chart_history': {
            const maxPos = Math.max(...block.entries.map(e => e.position))
            const scale = maxPos + 5
            return (
                <div className="my-8 border border-border rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 bg-surface/60 border-b border-border flex items-center justify-between">
                        <p className="text-[13px] font-bold text-foreground">📈 {block.title ?? 'Histórico de Charts'}</p>
                        <span className="text-[11px] text-accent font-bold">{block.chart}</span>
                    </div>
                    <div className="px-5 py-4">
                        <div className="flex items-end gap-2 h-32">
                            {block.entries.map((e, i) => {
                                const height = ((scale - e.position) / scale) * 100
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                        <span className="text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">#{e.position}</span>
                                        <div className="w-full rounded-t-md bg-accent/80 transition-all" style={{ height: `${Math.max(4, height)}%` }} title={`#${e.position}${e.label ? ` — ${e.label}` : ''}`} />
                                        <span className="text-[9px] text-muted">{e.date}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <p className="text-[10px] text-muted mt-2 text-center">Pico: #{Math.min(...block.entries.map(e => e.position))}</p>
                    </div>
                </div>
            )
        }

        case 'blog_fandom':
            return (
                <div className="my-8 space-y-3">
                    {block.title && <p className="text-[13px] font-bold text-foreground">{block.title}</p>}
                    {block.quotes.map((q, i) => (
                        <div key={i} className="border border-border rounded-xl p-4 bg-surface/30">
                            <p className="text-[13px] text-foreground leading-relaxed mb-2">"{q.text}"</p>
                            {(q.author || q.platform) && (
                                <div className="flex items-center gap-2 text-[11px] text-muted">
                                    {q.platform && <span>{PLATFORM_ICONS[q.platform] ?? '💬'}</span>}
                                    {q.author && <span className="font-medium">{q.author}</span>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )

        case 'blog_lightstick':
            return (
                <div className="my-8 border border-border rounded-2xl overflow-hidden">
                    <div className="p-5 flex items-center gap-5" style={{ background: 'linear-gradient(135deg, #1a0030, #2d0050)' }}>
                        {block.imageUrl ? (
                            <img src={block.imageUrl} alt={block.name} className="w-16 h-16 object-contain" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl border border-white/20">🪄</div>
                        )}
                        <div>
                            <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-0.5">{block.group}</p>
                            <p className="text-[20px] font-black text-white">{block.name}</p>
                            {block.generation && <p className="text-[12px] text-white/50">{block.generation}</p>}
                        </div>
                        {block.colors.length > 0 && (
                            <div className="ml-auto flex gap-2">
                                {block.colors.map((c, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white/20 shadow-lg" style={{ background: c }} title={c} />
                                ))}
                            </div>
                        )}
                    </div>
                    {block.funFact && (
                        <div className="px-5 py-4 bg-surface/30">
                            <p className="text-[13px] text-muted leading-relaxed">💡 <strong className="text-foreground">Curiosidade:</strong> {block.funFact}</p>
                        </div>
                    )}
                </div>
            )

        case 'blog_positions': {
            const lineColors: Record<string, string> = { vocal: 'bg-blue-400', dance: 'bg-pink-400', rap: 'bg-yellow-400', visual: 'bg-purple-400', all: 'bg-accent' }
            return (
                <div className="my-8 space-y-3">
                    {block.title && <p className="text-[13px] font-bold text-foreground">{block.title}</p>}
                    <div className="grid grid-cols-2 gap-3">
                        {block.members.map((m, i) => (
                            <div key={i} className="border border-border rounded-xl p-3 bg-surface/30 flex gap-3">
                                {m.imageUrl ? (
                                    <img src={m.imageUrl} alt={m.name} className="w-10 h-10 rounded-full object-cover object-top border border-border shrink-0" />
                                ) : (
                                    <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${m.line ? lineColors[m.line] : 'bg-surface border border-border'}`}>
                                        {m.name[0]}
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-foreground text-[13px]">{m.name}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {m.positions.map(pos => (
                                            <span key={pos} className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-muted">{pos}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 flex-wrap text-[10px]">
                        {[['bg-blue-400', 'Vocal'], ['bg-yellow-400', 'Rap'], ['bg-pink-400', 'Dance'], ['bg-purple-400', 'Visual']].map(([color, label]) => (
                            <span key={label} className="flex items-center gap-1.5 text-muted">
                                <span className={`w-2 h-2 rounded-full ${color}`} />{label}
                            </span>
                        ))}
                    </div>
                </div>
            )
        }

        case 'blog_discography_grid':
            return (
                <div className="my-8 space-y-3">
                    <p className="text-[13px] font-bold text-foreground">💿 {block.artist} — Discografia</p>
                    <div className="grid grid-cols-4 gap-2">
                        {block.albums.map((a, i) => (
                            <div key={i} className="flex flex-col gap-1">
                                {a.imageUrl ? (
                                    <img src={a.imageUrl} alt={a.title} className="aspect-square rounded-xl object-cover border border-border" />
                                ) : (
                                    <div className="aspect-square rounded-xl flex items-center justify-center text-2xl border border-white/5"
                                        style={{ background: a.color ?? 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
                                        {a.emoji ?? '💿'}
                                    </div>
                                )}
                                <p className="text-[11px] font-bold text-foreground leading-tight">{a.title}</p>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-muted">{a.year}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted/70">{a.type}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )

        case 'blog_achievement':
            return (
                <div className="my-8 space-y-3">
                    {block.title && <p className="text-[13px] font-bold text-foreground">{block.title}</p>}
                    <div className="grid grid-cols-2 gap-3">
                        {block.items.map((b, i) => (
                            <div key={i} className="border rounded-xl p-4" style={b.color ? { borderColor: b.color + '40', background: b.color + '08' } : { borderColor: 'var(--border)' }}>
                                <p className="text-2xl mb-2">{b.icon}</p>
                                <p className="text-[13px] font-bold text-foreground mb-1">{b.title}</p>
                                <p className="text-[11px] text-muted leading-snug">{b.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )

        case 'blog_mv_breakdown':
            return (
                <div className="my-8 border border-border rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 bg-surface/60 border-b border-border">
                        <p className="text-[13px] font-bold text-foreground">🎬 {block.title ?? 'Análise do MV'}</p>
                    </div>
                    <div className="divide-y divide-border">
                        {block.scenes.map((s, i) => {
                            const [min, sec] = s.time.split(':').map(Number)
                            const totalSec = (min || 0) * 60 + (sec || 0)
                            return (
                                <div key={i} className="flex gap-4 px-5 py-4 hover:bg-surface/30 transition-colors">
                                    <a href={`https://www.youtube.com/watch?v=${block.videoId}&t=${totalSec}s`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="shrink-0 font-mono text-[12px] font-bold text-accent border border-accent/30 rounded-lg px-2.5 py-1 hover:bg-accent/10 transition-colors self-start mt-0.5">
                                        {s.time}
                                    </a>
                                    <div>
                                        <p className="text-[13px] font-bold text-foreground mb-1">{s.label}</p>
                                        <p className="text-[12px] text-muted leading-relaxed">{s.description}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="px-5 py-3 border-t border-border">
                        <a href={`https://www.youtube.com/watch?v=${block.videoId}`} target="_blank" rel="noopener noreferrer"
                            className="text-[11px] font-bold text-accent hover:underline">▶ Assistir ao MV completo</a>
                    </div>
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
                className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border hover:border-accent/40 bg-surface hover:bg-surface-hover transition-all">
                <div className="w-8 h-8 rounded-full bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-accent">
                    {data?.primaryImageUrl
                        ? <Image src={data.primaryImageUrl} alt={data.nameRomanized} width={32} height={32} className="w-full h-full object-cover" />
                        : <span>{data?.nameRomanized?.[0] ?? '?'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                        {data?.nameRomanized ?? artistId}
                    </p>
                    {note && <p className="text-[11px] text-muted leading-snug truncate">{note}</p>}
                </div>
                <span className="text-[10px] text-muted shrink-0 group-hover:text-accent">→</span>
            </Link>
        )
    }

    if (portrait) {
        return (
            <div className="flex flex-col">
                <Link href={`/artists/${artistId}`}
                    className="group block relative rounded-2xl overflow-hidden border border-border/60 hover:border-accent/60 shadow-sm hover:shadow-xl transition-all aspect-[2/3]">
                    {data?.primaryImageUrl ? (
                        <Image
                            src={data.primaryImageUrl}
                            alt={data?.nameRomanized ?? artistId}
                            fill
                            className="object-cover object-top group-hover:scale-[1.05] transition-transform duration-700"
                            sizes="(max-width: 768px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent/20 via-surface to-surface-hover">
                            <span className="text-5xl font-black text-accent/60">{data?.nameRomanized?.[0] ?? '?'}</span>
                        </div>
                    )}
                    {/* gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    {/* hover: "Ver perfil" badge */}
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-[9px] font-bold text-white bg-accent px-2 py-0.5 rounded-full tracking-wide">Ver perfil</span>
                    </div>
                    {/* bottom info */}
                    <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-accent mb-0.5">Artista</p>
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
            className="group flex items-start gap-5 my-4 p-4 rounded-2xl border border-border hover:border-accent/40 bg-surface hover:bg-surface-hover transition-all shadow-sm hover:shadow-md">
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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/15 to-surface text-3xl font-black text-accent/70">
                        {data?.nameRomanized?.[0] ?? '?'}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0 py-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full inline-block mb-2">Artista</span>
                <p className="text-xl font-black text-foreground group-hover:text-accent transition-colors leading-tight">
                    {data?.nameRomanized ?? artistId}
                </p>
                {role && <p className="text-sm text-muted mt-1">{role}</p>}
                {note && <p className="text-sm text-muted mt-2.5 leading-relaxed">{note}</p>}
                <p className="text-xs text-accent mt-3 font-bold flex items-center gap-1">
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
                className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border hover:border-accent/40 bg-surface hover:bg-surface-hover transition-all">
                <div className="w-8 h-8 rounded-full bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-accent">
                    {data?.profileImageUrl
                        ? <Image src={data.profileImageUrl} alt={data.name} width={32} height={32} className="w-full h-full object-cover" />
                        : <span>{data?.name?.[0] ?? '?'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">{data?.name ?? groupId}</p>
                    {note && <p className="text-[11px] text-muted leading-snug truncate">{note}</p>}
                </div>
                <span className="text-[10px] text-muted shrink-0 group-hover:text-accent">→</span>
            </Link>
        )
    }
    return (
        <Link href={`/groups/${groupId}`}
            className="group my-4 rounded-2xl border border-border hover:border-accent/60 bg-surface hover:bg-surface-hover overflow-hidden transition-all shadow-sm hover:shadow-lg block">
            {/* Banner gradient header */}
            <div className="relative h-20 bg-gradient-to-r from-accent/15 via-accent/05 to-transparent">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[9px] font-bold text-white bg-accent px-2.5 py-1 rounded-full">Ver grupo →</span>
                </div>
            </div>
            {/* Avatar overlapping banner */}
            <div className="px-5 pb-5">
                <div className="relative -mt-10 mb-3">
                    <div className="w-20 h-20 rounded-2xl border-4 border-surface bg-surface overflow-hidden shadow-lg flex items-center justify-center text-2xl font-black text-accent/60">
                        {data?.profileImageUrl ? (
                            <Image src={data.profileImageUrl} alt={data.name} width={80} height={80} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                        ) : (
                            <span>{data?.name?.[0] ?? '?'}</span>
                        )}
                    </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full inline-block mb-1.5">Grupo</span>
                <p className="text-xl font-black text-foreground group-hover:text-accent transition-colors leading-tight">
                    {data?.name ?? groupId}
                </p>
                {data?.fanClubName && <p className="text-sm text-muted mt-1">Fandom: <strong className="text-foreground font-semibold">{data.fanClubName}</strong></p>}
                {note && <p className="text-sm text-muted mt-2 leading-relaxed">{note}</p>}
                <p className="text-xs text-accent mt-3 font-bold flex items-center gap-1">
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
            className="group flex my-4 rounded-2xl border border-border hover:border-accent/60 bg-surface hover:bg-surface-hover overflow-hidden transition-all shadow-sm hover:shadow-lg">
            {/* Poster */}
            <div className="relative w-28 shrink-0 bg-surface-hover min-h-[160px]">
                {data?.imageUrl ? (
                    <Image src={data.imageUrl} alt={data?.titlePt ?? ''} fill className="object-cover group-hover:scale-[1.04] transition-transform duration-500" sizes="112px" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-accent/30">
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
                <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full inline-block mb-2">
                    {typeLabel ?? 'Produção'}
                </span>
                <p className="text-lg font-black text-foreground group-hover:text-accent transition-colors leading-tight">
                    {data?.titlePt ?? productionId}
                </p>
                {note && <p className="text-sm text-muted mt-2 leading-relaxed">{note}</p>}
                <p className="text-xs text-accent mt-3 font-bold flex items-center gap-1">
                    Ver detalhes
                    <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                </p>
            </div>
        </Link>
    )
}
