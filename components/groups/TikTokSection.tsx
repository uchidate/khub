'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Heart, Play, X } from 'lucide-react'

function extractTikTokId(url: string): string | null {
    try {
        const m = new URL(url).pathname.match(/\/video\/(\d+)/)
        return m?.[1] ?? null
    } catch { return null }
}

function extractTikTokUsername(url: string): string | null {
    try {
        const m = new URL(url).pathname.match(/^\/@?([^/]+)/)
        return m?.[1] ? `@${m[1]}` : null
    } catch { return null }
}

function TikTokLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
        </svg>
    )
}

interface TikTokItem {
    title: string
    url: string
    id: string
    thumbnail: string | null
}

function OfficialTikTokEmbed({ item }: { item: TikTokItem }) {
    useEffect(() => {
        const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.tiktok.com/embed.js"]')
        if (!existingScript) {
            const script = document.createElement('script')
            script.src = 'https://www.tiktok.com/embed.js'
            script.async = true
            document.body.appendChild(script)
            return
        }

        const tiktok = (window as typeof window & { tiktok?: { load?: () => void } }).tiktok
        tiktok?.load?.()
    }, [item.id])

    return (
        <div className="flex min-h-[650px] items-start justify-center overflow-hidden bg-black px-2 py-4 sm:px-4">
            <blockquote
                key={item.id}
                className="tiktok-embed"
                cite={item.url}
                data-video-id={item.id}
                data-embed-from="oembed"
                style={{ maxWidth: 605, minWidth: 325 }}
            >
                <section>
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {item.title}
                    </a>
                </section>
            </blockquote>
        </div>
    )
}

function TikTokPreview({ item, onPlay }: { item: TikTokItem; onPlay: () => void }) {
    return (
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <button
                type="button"
                onClick={onPlay}
                className="group relative mx-auto w-full max-w-[180px] overflow-hidden bg-black text-left sm:mx-0"
                style={{ aspectRatio: '9 / 16' }}
                title={item.title}
            >
                {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <TikTokLogo className="h-9 w-9 text-white/25" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-transform duration-300 group-hover:scale-105">
                        <Play className="ml-1 h-6 w-6 fill-white text-white" />
                    </div>
                </div>
            </button>

            <div className="flex min-w-0 flex-col justify-center">
                <div className="mb-2 flex items-center gap-2">
                    <TikTokLogo className="h-4 w-4 text-white" />
                    <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#fe2c55]">Em destaque</span>
                </div>
                <h4 className="text-[24px] font-black leading-tight text-white sm:text-[30px]">
                    {item.title}
                </h4>
                <div className="mt-5 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={onPlay}
                        className="inline-flex h-10 items-center justify-center gap-2 bg-[#fe2c55] px-4 text-[13px] font-black text-white transition-opacity hover:opacity-85"
                    >
                        <Play className="h-4 w-4 fill-white text-white" />
                        Assistir
                    </button>
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center justify-center gap-1.5 border border-white/20 px-4 text-[13px] font-black text-white transition-colors hover:border-white"
                    >
                        Abrir
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </div>
            </div>
        </div>
    )
}

// Thumbnail card — só navegação, nunca embeds inline
function TikTokCard({ item, username, active, onSelect }: {
    item: TikTokItem
    username: string | null
    active: boolean
    onSelect: () => void
}) {
    return (
        <button
            onClick={onSelect}
            className={`group grid w-full grid-cols-[64px_1fr] gap-3 border p-2 text-left transition-colors sm:grid-cols-[74px_1fr] ${active
                ? 'border-[#fe2c55] bg-white text-black'
                : 'border-white/10 bg-white/[0.06] text-white hover:border-[#25f4ee]/45 hover:bg-white/[0.09]'
                }`}
            title={item.title}
        >
            <div className="relative overflow-hidden bg-[#111]" style={{ aspectRatio: '9 / 16' }}>
                {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.thumbnail}
                        alt={item.title}
                        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 ${active ? 'brightness-75' : 'group-hover:scale-105'}`}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <TikTokLogo className="h-7 w-7 text-white/25" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                    <Play className="ml-0.5 h-3 w-3 fill-white text-white" />
                </div>
            </div>
            <div className="min-w-0 py-1">
                <div className="mb-2 flex items-center gap-1.5">
                    <TikTokLogo className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-black' : 'text-white'}`} />
                    <span className="truncate text-[11px] font-black uppercase tracking-[0.08em] text-[#fe2c55]">
                        {active ? 'Em destaque' : 'TikTok'}
                    </span>
                </div>
                <p className="line-clamp-2 text-[13px] font-bold leading-snug sm:text-[14px]">
                    {item.title}
                </p>
                {username && (
                    <div className={`mt-3 flex items-center gap-1.5 ${active ? 'text-black/55' : 'text-white/55'}`}>
                        <Heart className="h-3 w-3 shrink-0 fill-current" />
                        <span className="truncate text-[12px] font-semibold leading-none">{username}</span>
                    </div>
                )}
            </div>
        </button>
    )
}

interface TikTokSectionProps {
    videos: { title: string; url: string; thumbnail?: string | null }[]
    accent: string
    artistName?: string
    artistImageUrl?: string | null
}

export function TikTokSection({ videos, artistName, artistImageUrl }: TikTokSectionProps) {
    const items: TikTokItem[] = videos
        .map(v => {
            const id = extractTikTokId(v.url)
            return id ? { title: v.title, url: v.url, id, thumbnail: v.thumbnail ?? null } : null
        })
        .filter((v): v is TikTokItem => v !== null)

    const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
    const [isPlayerOpen, setIsPlayerOpen] = useState(false)

    if (items.length === 0) return null

    const username = extractTikTokUsername(items[0].url)
    const profileUrl = username ? `https://www.tiktok.com/${username}` : undefined
    const activeItem = items.find(i => i.id === activeId) ?? items[0]

    const handleSelect = (id: string) => {
        setActiveId(id)
    }

    return (
        <>
            <section className="mx-auto max-w-[920px] overflow-hidden border border-black bg-[#07070a] text-white" style={{ fontFamily: 'ProximaNova, Arial, Tahoma, PingFangSC, sans-serif' }}>
                <div className="h-1 bg-[linear-gradient(90deg,#25f4ee,#fe2c55,#111)]" />

                <div className="flex flex-col gap-4 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(37,244,238,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(254,44,85,0.18),transparent_30%)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        {artistImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={artistImageUrl} alt={artistName ?? ''} className="h-12 w-12 shrink-0 rounded-full object-cover object-top ring-2 ring-[#fe2c55]" />
                        ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 ring-2 ring-[#fe2c55]">
                                <TikTokLogo className="h-5 w-5 text-white" />
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                                <TikTokLogo className="h-4 w-4 shrink-0 text-white" />
                                <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#fe2c55]">TikTok</span>
                            </div>
                            <h3 className="truncate text-[24px] font-black leading-none text-white sm:text-[30px]">
                                {artistName ?? username}
                            </h3>
                            {username && <p className="mt-1 text-[12px] font-semibold text-white/55">{username}</p>}
                        </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                        {profileUrl && (
                            <a
                                href={profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 items-center justify-center bg-[#fe2c55] px-4 text-[13px] font-black text-white transition-opacity hover:opacity-85"
                            >
                                Seguir
                            </a>
                        )}
                        <a
                            href={activeItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 items-center justify-center gap-1.5 border border-white/20 px-3 text-[13px] font-black text-white transition-colors hover:border-white"
                        >
                            Abrir
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>
                </div>

                <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="border border-white/10 bg-white/[0.04] p-3 sm:p-4">
                        <TikTokPreview item={activeItem} onPlay={() => setIsPlayerOpen(true)} />
                    </div>

                    <div className="min-w-0">
                        <div className="mb-3 flex items-end justify-between gap-3 border-b border-white/10 pb-3">
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/45">Seleção</p>
                                <h4 className="truncate text-[18px] font-black leading-tight text-white">
                                    {activeItem.title}
                                </h4>
                            </div>
                            <span className="shrink-0 font-mono text-[11px] font-black text-[#fe2c55]">
                                {items.findIndex(item => item.id === activeItem.id) + 1}/{items.length}
                            </span>
                        </div>

                        <div className="grid gap-2">
                            {items.map(item => (
                                <TikTokCard
                                    key={item.id}
                                    item={item}
                                    username={username}
                                    active={activeItem.id === item.id}
                                    onSelect={() => handleSelect(item.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {isPlayerOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`TikTok: ${activeItem.title}`}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
                >
                    <div className="relative max-h-[92vh] w-full max-w-[680px] overflow-auto border border-white/15 bg-black shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/95 px-4 py-3 text-white">
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#fe2c55]">TikTok</p>
                                <p className="truncate text-[15px] font-black">{activeItem.title}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPlayerOpen(false)}
                                aria-label="Fechar"
                                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center border border-white/15 text-white transition-colors hover:border-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <OfficialTikTokEmbed item={activeItem} />
                    </div>
                </div>
            )}
        </>
    )
}
