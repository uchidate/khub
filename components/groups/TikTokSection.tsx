'use client'

import { useState } from 'react'
import { Play, Heart, X } from 'lucide-react'

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
            className="group relative block w-full overflow-hidden bg-[#111] text-left"
            style={{ paddingBottom: '177.78%' }}
            title={item.title}
        >
            {item.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={item.thumbnail}
                    alt={item.title}
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 ${active ? 'brightness-50' : 'group-hover:scale-105'}`}
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <TikTokLogo className="h-8 w-8 text-white/20" />
                </div>
            )}

            {/* Borda accent quando ativo */}
            {active && (
                <div className="absolute inset-0 border-2 border-[#fe2c55]" />
            )}

            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/90 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 space-y-0.5">
                <p className="text-[9px] text-white/90 leading-snug line-clamp-2">{item.title}</p>
                {username && (
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-semibold text-white/50 truncate leading-none">{username}</span>
                        <Heart className="h-2.5 w-2.5 shrink-0 text-white/60 fill-white/60" />
                    </div>
                )}
            </div>

            {!active && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm">
                        <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                    </div>
                </div>
            )}
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

    const [activeId, setActiveId] = useState<string | null>(null)

    if (items.length === 0) return null

    const username = extractTikTokUsername(items[0].url)
    const profileUrl = username ? `https://www.tiktok.com/${username}` : undefined
    const activeItem = items.find(i => i.id === activeId) ?? null

    const handleSelect = (id: string) => {
        setActiveId(prev => prev === id ? null : id)
    }

    return (
        <section id="tiktoks" className="overflow-hidden border border-[#e8e8e8] dark:border-[#2a2a2a] max-w-[720px]" style={{ fontFamily: 'ProximaNova, Arial, Tahoma, PingFangSC, sans-serif' }}>

            {/* Header linha única */}
            <div className="bg-white dark:bg-[#121212] px-3 py-2.5 flex items-center gap-2.5">
                <TikTokLogo className="h-4 w-4 shrink-0 text-black dark:text-white" />

                {artistImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artistImageUrl} alt={artistName ?? ''} className="h-8 w-8 shrink-0 rounded-full object-cover object-top" />
                ) : (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 dark:bg-white/10" />
                )}

                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-black dark:text-white leading-tight truncate">{artistName ?? username}</p>
                    {username && <p className="text-[11px] text-[#858585] leading-none">{username}</p>}
                </div>

                {profileUrl && (
                    <a href={profileUrl}
                        className="shrink-0 rounded px-4 py-1.5 text-[13px] font-semibold text-white hover:opacity-85 transition-opacity"
                        style={{ background: '#fe2c55' }}>
                        Follow
                    </a>
                )}
            </div>

            {/* Grade 3 colunas — só thumbnails */}
            <div className="grid grid-cols-3 gap-[3px] bg-[#d0d0d0] dark:bg-[#333]">
                {items.map(item => (
                    <TikTokCard
                        key={item.id}
                        item={item}
                        username={username}
                        active={activeId === item.id}
                        onSelect={() => handleSelect(item.id)}
                    />
                ))}
            </div>

            {/* Painel do vídeo — aparece abaixo da grade quando selecionado */}
            {activeItem && (
                <div className="relative bg-black">
                    <button
                        onClick={() => setActiveId(null)}
                        aria-label="Fechar"
                        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                    {/*
                      O embed TikTok tem ~605px de altura total (vídeo + UI social).
                      O container fixa 400px e esconde o resto — mostra só o vídeo.
                    */}
                    <div className="relative mx-auto overflow-hidden" style={{ width: 340, height: 400 }}>
                        <iframe
                            key={activeItem.id}
                            src={`https://www.tiktok.com/embed/v2/${activeItem.id}`}
                            className="absolute top-0 left-0 border-0"
                            style={{ width: 340, height: 605 }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={activeItem.title}
                        />
                    </div>
                </div>
            )}
        </section>
    )
}
