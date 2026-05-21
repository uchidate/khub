'use client'

import { Instagram, Twitter, Youtube, Music, Globe, ExternalLink } from 'lucide-react'

interface SocialStat {
    platform: string
    url: string
    followers?: string
    label?: string
}

interface GroupSocialPresenceProps {
    socialLinks: Record<string, string>
    spotifyUrl?: string | null
    accent: string
    groupName: string
}

const PLATFORM_META: Record<string, {
    icon: React.ReactNode
    color: string
    bg: string
    border: string
    label: string
}> = {
    instagram: {
        icon: <Instagram className="w-5 h-5" />,
        color: '#E1306C',
        bg: 'rgba(225,48,108,0.08)',
        border: 'rgba(225,48,108,0.25)',
        label: 'Instagram',
    },
    twitter: {
        icon: <Twitter className="w-5 h-5" />,
        color: '#1DA1F2',
        bg: 'rgba(29,161,242,0.08)',
        border: 'rgba(29,161,242,0.25)',
        label: 'X (Twitter)',
    },
    x: {
        icon: <Twitter className="w-5 h-5" />,
        color: '#1DA1F2',
        bg: 'rgba(29,161,242,0.08)',
        border: 'rgba(29,161,242,0.25)',
        label: 'X (Twitter)',
    },
    youtube: {
        icon: <Youtube className="w-5 h-5" />,
        color: '#FF0000',
        bg: 'rgba(255,0,0,0.08)',
        border: 'rgba(255,0,0,0.25)',
        label: 'YouTube',
    },
    spotify: {
        icon: <Music className="w-5 h-5" />,
        color: '#1DB954',
        bg: 'rgba(29,185,84,0.08)',
        border: 'rgba(29,185,84,0.25)',
        label: 'Spotify',
    },
    tiktok: {
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.53V6.78a4.86 4.86 0 01-1.01-.09z"/>
            </svg>
        ),
        color: '#010101',
        bg: 'rgba(1,1,1,0.06)',
        border: 'rgba(1,1,1,0.15)',
        label: 'TikTok',
    },
    website: {
        icon: <Globe className="w-5 h-5" />,
        color: '#6b6b6b',
        bg: 'rgba(107,107,107,0.08)',
        border: 'rgba(107,107,107,0.2)',
        label: 'Site oficial',
    },
}

// Seguidores conhecidos (atualizados via pesquisa — maio 2026)
const KNOWN_FOLLOWERS: Record<string, { count: string; suffix: string }> = {
    youtube: { count: '101.4', suffix: 'M inscritos' },
    instagram: { count: '57.7', suffix: 'M seguidores' },
    tiktok: { count: '49.2', suffix: 'M seguidores' },
}

export function GroupSocialPresence({ socialLinks, spotifyUrl, accent, groupName }: GroupSocialPresenceProps) {
    const entries: SocialStat[] = Object.entries(socialLinks)
        .filter(([key]) => !['website', 'Website', 'official'].includes(key))
        .map(([platform, url]) => ({
            platform: platform.toLowerCase(),
            url,
            followers: KNOWN_FOLLOWERS[platform.toLowerCase()]
                ? `${KNOWN_FOLLOWERS[platform.toLowerCase()].count} ${KNOWN_FOLLOWERS[platform.toLowerCase()].suffix}`
                : undefined,
        }))

    if (spotifyUrl) {
        entries.push({ platform: 'spotify', url: spotifyUrl })
    }

    if (entries.length === 0) return null

    return (
        <section id="redes">
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-foreground pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-border bg-background">
                        <Globe className="h-4 w-4" style={{ color: accent }} />
                    </div>
                    <div>
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Dossiê</p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">Presença Digital</h2>
                    </div>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {entries.length} plataformas
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {entries.map(entry => {
                    const meta = PLATFORM_META[entry.platform] ?? PLATFORM_META.website
                    const known = KNOWN_FOLLOWERS[entry.platform]
                    return (
                        <a
                            key={entry.platform}
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-4 border p-4 transition-all hover:scale-[1.01] hover:shadow-md"
                            style={{ background: meta.bg, borderColor: meta.border }}
                        >
                            {/* Platform icon */}
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center border"
                                style={{ color: meta.color, borderColor: meta.border, background: `${meta.bg}` }}>
                                {meta.icon}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-mono text-[9px] font-black uppercase tracking-widest text-muted">{meta.label}</p>
                                <p className="font-bold text-foreground text-sm">{groupName}</p>
                                {known && (
                                    <p className="text-[11px] font-black mt-0.5" style={{ color: meta.color }}>
                                        {known.count}
                                        <span className="font-normal text-muted"> {known.suffix}</span>
                                    </p>
                                )}
                            </div>

                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted opacity-60 group-hover:opacity-100 transition-opacity" />
                        </a>
                    )
                })}
            </div>

            {/* Barra visual de alcance total */}
            <div className="mt-4 border border-border bg-background p-4">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted mb-3">Alcance combinado estimado</p>
                {[
                    { platform: 'YouTube', count: 101.4, max: 150, color: '#FF0000' },
                    { platform: 'Instagram', count: 57.7, max: 150, color: '#E1306C' },
                    { platform: 'TikTok', count: 49.2, max: 150, color: '#010101' },
                ].map(item => (
                    <div key={item.platform} className="mb-2.5 last:mb-0">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-foreground">{item.platform}</span>
                            <span className="font-mono font-bold" style={{ color: item.color }}>{item.count}M</span>
                        </div>
                        <div className="h-1.5 overflow-hidden bg-surface">
                            <div className="h-full transition-all duration-700"
                                style={{ width: `${(item.count / item.max) * 100}%`, background: item.color }} />
                        </div>
                    </div>
                ))}
                <p className="mt-3 text-[10px] text-muted">
                    Total combinado: <strong className="text-foreground">~208 milhões</strong> de seguidores nas principais plataformas · Dados: maio 2026
                </p>
            </div>
        </section>
    )
}
