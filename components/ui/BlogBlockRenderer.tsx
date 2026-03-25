'use client'

import Image from 'next/image'
import Link from 'next/link'
import { TwitterEmbed } from '@/components/ui/TwitterEmbed'
import { InstagramEmbed } from '@/components/ui/InstagramEmbed'
import { TikTokEmbed } from '@/components/ui/TikTokEmbed'
import type { BlogBlock } from '@/lib/types/blocks'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Proxy Wikimedia images through our own route to avoid 429/hotlink issues */
function proxied(url: string): string {
    if (url.includes('upload.wikimedia.org') || url.includes('commons.wikimedia.org')) {
        return `/api/image-proxy?url=${encodeURIComponent(url)}`
    }
    return url
}

/** Render inline markdown: **bold** and [link](url) */
function renderInline(text: string): React.ReactNode {
    const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
    const parts: React.ReactNode[] = []
    let last = 0
    let key = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > last) parts.push(text.slice(last, match.index))
        if (match[1]) {
            parts.push(<strong key={key++} className="font-semibold text-foreground">{match[1]}</strong>)
        } else if (match[2] && match[3]) {
            const href = match[3]
            const cls = "text-[#ff2d78] underline underline-offset-4 hover:brightness-110 transition-all"
            parts.push(href.startsWith('/')
                ? <Link key={key++} href={href} className={cls}>{match[2]}</Link>
                : <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{match[2]}</a>
            )
        }
        last = match.index + match[0].length
    }
    if (last < text.length) parts.push(text.slice(last))
    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>
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

export function BlogBlockRenderer({ blocks, className, resolvedEntities }: BlogBlockRendererProps) {
    // Group consecutive compact cards into a 2-col desktop grid
    const rows: (BlogBlock | BlogBlock[])[] = []
    let i = 0
    while (i < blocks.length) {
        const block = blocks[i]
        if (isCompactCard(block)) {
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
            {rows.map((item, idx) =>
                Array.isArray(item)
                    ? (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-1.5 my-3">
                            {item.map((block, j) => (
                                <BlogBlockItem key={j} block={block} resolvedEntities={resolvedEntities} />
                            ))}
                        </div>
                    )
                    : <BlogBlockItem key={idx} block={item} resolvedEntities={resolvedEntities} />
            )}
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

        case 'blog_image': {
            const sizeClass =
                block.size === 'small'  ? 'mx-auto max-w-[260px]' :
                block.size === 'medium' ? 'mx-auto max-w-sm' :
                block.fullWidth         ? 'w-full' :
                                          'w-full md:w-auto max-w-full'
            return (
                <span className="block my-8">
                    <span className={`block ${sizeClass}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={proxied(block.url)}
                            alt={block.caption || ''}
                            className="w-full rounded-2xl border border-border shadow-xl"
                        />
                    </span>
                    {block.caption && (
                        <span className="block text-center text-xs text-muted mt-2 italic">{block.caption}</span>
                    )}
                </span>
            )
        }

        case 'blog_gallery':
            return (
                <div className="my-8 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {block.urls.filter(u => u).map((url, i) => (
                            <div key={i} className="aspect-video relative rounded-xl overflow-hidden border border-border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={proxied(url)} alt={`Imagem ${i + 1}`}
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
            return <ArtistCardBlock artistId={block.artistId} note={block.note} compact={block.compact} data={resolvedEntities?.artists[block.artistId]} />

        case 'blog_production_card':
            return <ProductionCardBlock productionId={block.productionId} note={block.note} data={resolvedEntities?.productions[block.productionId]} />

        case 'blog_group_card':
            return <GroupCardBlock groupId={block.groupId} note={block.note} compact={block.compact} data={resolvedEntities?.groups[block.groupId]} />

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

        case 'blog_divider':
            return <hr className="my-10 border-t border-border" />

        default:
            return null
    }
}

// ─── Embedded entity cards ─────────────────────────────────────────────────────

function ArtistCardBlock({ artistId, note, compact, data }: { artistId: string; note?: string; compact?: boolean; data?: ResolvedArtist }) {
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
    return (
        <Link href={`/artists/${artistId}`}
            className="group flex items-center gap-4 my-7 p-4 rounded-2xl border border-border hover:border-[#ff2d78]/40 bg-surface hover:bg-surface-hover transition-all">
            <div className="w-16 h-16 rounded-full bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center text-lg font-bold text-[#ff2d78]">
                {data?.primaryImageUrl ? (
                    <Image src={data.primaryImageUrl} alt={data.nameRomanized} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                    <span>{data?.nameRomanized?.[0] ?? '?'}</span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#ff2d78] mb-0.5">Artista</p>
                <p className="text-base font-bold text-foreground group-hover:text-[#ff2d78] transition-colors truncate">
                    {data?.nameRomanized ?? artistId}
                </p>
                {role && <p className="text-xs text-muted mt-0.5">{role}</p>}
                {note && <p className="text-xs text-muted mt-1 italic leading-snug">{note}</p>}
            </div>
            <span className="text-muted text-xs shrink-0 group-hover:text-[#ff2d78] transition-colors">Ver perfil →</span>
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
            className="group flex items-center gap-4 my-7 p-4 rounded-2xl border border-border hover:border-[#ff2d78]/40 bg-surface hover:bg-surface-hover transition-all">
            <div className="w-16 h-16 rounded-full bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center text-lg font-bold text-[#ff2d78]">
                {data?.profileImageUrl ? (
                    <Image src={data.profileImageUrl} alt={data.name} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                    <span>{data?.name?.[0] ?? '?'}</span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#ff2d78] mb-0.5">Grupo</p>
                <p className="text-base font-bold text-foreground group-hover:text-[#ff2d78] transition-colors truncate">
                    {data?.name ?? groupId}
                </p>
                {data?.fanClubName && <p className="text-xs text-muted mt-0.5">Fãs: {data.fanClubName}</p>}
                {note && <p className="text-xs text-muted mt-1 italic leading-snug">{note}</p>}
            </div>
            <span className="text-muted text-xs shrink-0 group-hover:text-[#ff2d78] transition-colors">Ver grupo →</span>
        </Link>
    )
}

function ProductionCardBlock({ productionId, note, data }: { productionId: string; note?: string; data?: ResolvedProduction }) {
    if (!productionId) return null
    const typeLabel = data?.type ? (TYPE_LABELS[data.type] ?? data.type) : null
    return (
        <Link href={`/productions/${productionId}`}
            className="group flex items-center gap-4 my-7 p-4 rounded-2xl border border-border hover:border-[#ff2d78]/40 bg-surface hover:bg-surface-hover transition-all">
            <div className="w-12 h-[72px] rounded-lg bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-muted">
                {data?.imageUrl ? (
                    <Image src={data.imageUrl} alt={data.titlePt} width={48} height={72} className="w-full h-full object-cover" />
                ) : (
                    <span>{data?.titlePt?.slice(0, 2).toUpperCase() ?? '?'}</span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#ff2d78] mb-0.5">
                    {typeLabel ?? 'Produção'}
                </p>
                <p className="text-base font-bold text-foreground group-hover:text-[#ff2d78] transition-colors truncate">
                    {data?.titlePt ?? productionId}
                </p>
                {data?.year && <p className="text-xs text-muted mt-0.5">{data.year}</p>}
                {note && <p className="text-xs text-muted mt-1 italic leading-snug">{note}</p>}
            </div>
            <span className="text-muted text-xs shrink-0 group-hover:text-[#ff2d78] transition-colors">Ver mais →</span>
        </Link>
    )
}
