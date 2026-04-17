import { Instagram, Twitter, Youtube, Globe, Music2, ExternalLink } from 'lucide-react'

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
    instagram: <Instagram size={12} />,
    twitter:   <Twitter size={12} />,
    youtube:   <Youtube size={12} />,
    tiktok:    <Music2 size={12} />,
    website:   <Globe size={12} />,
}

const SOCIAL_COLORS: Record<string, string> = {
    instagram: 'text-pink-400 bg-pink-500/10 hover:bg-pink-500/20',
    twitter:   'text-sky-400 bg-sky-500/10 hover:bg-sky-500/20',
    youtube:   'text-red-400 bg-red-500/10 hover:bg-red-500/20',
    tiktok:    'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20',
    website:   'text-muted bg-surface hover:bg-surface-hover',
}

interface SocialBadgesProps {
    links: Record<string, string> | null
    showLabels?: boolean
    maxItems?: number
}

export function SocialBadges({ links, showLabels = true, maxItems }: SocialBadgesProps) {
    if (!links || Object.keys(links).length === 0) {
        return <span className="text-muted text-xs">—</span>
    }
    const entries = maxItems ? Object.entries(links).slice(0, maxItems) : Object.entries(links)
    return (
        <div className="flex items-center gap-1 flex-wrap">
            {entries.map(([platform, url]) => (
                <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    title={platform}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                        SOCIAL_COLORS[platform] ?? 'text-muted bg-surface hover:bg-surface-hover'
                    }`}
                >
                    {SOCIAL_ICONS[platform] ?? <ExternalLink size={12} />}
                    {showLabels && <span className="capitalize">{platform}</span>}
                </a>
            ))}
        </div>
    )
}
