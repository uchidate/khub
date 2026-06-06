import { ImageResponse } from 'next/og'
import { ARCHIVE_HUB_BY_SLUG } from '@/lib/seo/archive-hubs'

export const runtime = 'edge'
export const alt = 'Hub — HallyuHub'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const hub = ARCHIVE_HUB_BY_SLUG[slug]

    const title = hub?.shortTitle ?? hub?.title ?? 'Hub K-Pop'
    const description = hub?.description ?? 'Cultura coreana em português no HallyuHub.'
    const kindLabel = hub?.kind === 'productions' ? 'DORAMAS & FILMES' : hub?.kind === 'groups' ? 'GRUPOS K-POP' : 'ARTISTAS K-POP'

    return new ImageResponse(
        (
            <div
                style={{
                    background: '#0a0a0a',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-end',
                    padding: '64px 72px',
                    position: 'relative',
                    fontFamily: 'sans-serif',
                    overflow: 'hidden',
                }}
            >
                {/* Gradient glow top-right */}
                <div
                    style={{
                        position: 'absolute',
                        top: -80,
                        right: -80,
                        width: 520,
                        height: 520,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,45,120,0.25) 0%, transparent 70%)',
                    }}
                />
                {/* Subtle grid overlay */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: 'linear-gradient(rgba(255,45,120,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,120,0.04) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 24,
                        background: 'rgba(255,45,120,0.12)',
                        border: '1px solid rgba(255,45,120,0.3)',
                        borderRadius: 32,
                        padding: '8px 20px',
                    }}
                >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff2d78' }} />
                    <span style={{ color: '#ff2d78', fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
                        {kindLabel}
                    </span>
                </div>

                {/* Title */}
                <span
                    style={{
                        fontSize: title.length > 20 ? 56 : 72,
                        fontWeight: 900,
                        color: '#fff',
                        lineHeight: 1.05,
                        letterSpacing: -2,
                        marginBottom: 16,
                        maxWidth: 900,
                    }}
                >
                    {title}
                </span>

                {/* Description */}
                <span
                    style={{
                        fontSize: 20,
                        color: '#777',
                        lineHeight: 1.5,
                        maxWidth: 800,
                        marginBottom: 40,
                    }}
                >
                    {description.slice(0, 120)}
                </span>

                <span style={{ fontSize: 16, color: '#444', fontWeight: 600 }}>
                    hallyuhub.com.br
                </span>
            </div>
        ),
        { ...size },
    )
}
