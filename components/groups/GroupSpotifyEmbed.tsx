'use client'

import { useState } from 'react'
import { Music, ExternalLink } from 'lucide-react'

interface GroupSpotifyEmbedProps {
    spotifyUrl: string
    groupName: string
    accent: string
}

function toEmbedUrl(url: string): string | null {
    try {
        const u = new URL(url)
        if (u.hostname !== 'open.spotify.com') return null
        // https://open.spotify.com/artist/ID → https://open.spotify.com/embed/artist/ID
        const embedPath = u.pathname.startsWith('/embed') ? u.pathname : `/embed${u.pathname}`
        return `https://open.spotify.com${embedPath}?utm_source=generator&theme=0`
    } catch {
        return null
    }
}

export function GroupSpotifyEmbed({ spotifyUrl, groupName, accent }: GroupSpotifyEmbedProps) {
    const [loaded, setLoaded] = useState(false)
    const embedUrl = toEmbedUrl(spotifyUrl)
    if (!embedUrl) return null

    return (
        <section id="spotify">
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-foreground pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-green-500/30 bg-green-500/10">
                        <Music className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Dossiê</p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">Spotify</h2>
                    </div>
                </div>
                <a href={spotifyUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 hover:text-green-400 transition-colors">
                    Abrir no Spotify
                    <ExternalLink className="h-3 w-3" />
                </a>
            </div>
            <div className="relative overflow-hidden border border-green-500/20 bg-black"
                style={{ borderTopColor: accent, borderTopWidth: 2 }}>
                {!loaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                        <div className="text-center">
                            <Music className="mx-auto mb-2 h-8 w-8 text-green-500 animate-pulse" />
                            <p className="text-xs text-muted">Carregando {groupName} no Spotify…</p>
                        </div>
                    </div>
                )}
                <iframe
                    src={embedUrl}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    title={`${groupName} no Spotify`}
                />
            </div>
        </section>
    )
}
