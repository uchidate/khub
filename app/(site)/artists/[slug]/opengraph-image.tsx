import { ImageResponse } from 'next/og'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const alt = 'Artista — HallyuHub'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const where = slug.match(/^c[a-z0-9]{24}$/) ? { id: slug } : { slug }
    const artist = await prisma.artist.findFirst({
        where,
        select: { nameRomanized: true, nameHangul: true, primaryImageUrl: true, roles: true },
    })

    const name = artist?.nameRomanized ?? 'Artista'
    const hangul = artist?.nameHangul ?? ''
    const imageUrl = artist?.primaryImageUrl ?? null
    const roleLabel = artist?.roles?.[0]
        ? artist.roles[0].charAt(0).toUpperCase() + artist.roles[0].slice(1).toLowerCase()
        : 'Artista K-Pop'

    return new ImageResponse(
        (
            <div
                style={{
                    background: '#0a0a0a',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    fontFamily: 'sans-serif',
                    overflow: 'hidden',
                }}
            >
                {/* Left: text panel */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '56px 64px',
                        gap: 12,
                        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a0a12 100%)',
                    }}
                >
                    {/* Badge */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(255,45,120,0.15)',
                            border: '1px solid rgba(255,45,120,0.35)',
                            borderRadius: 32,
                            padding: '6px 18px',
                            width: 'fit-content',
                            marginBottom: 4,
                        }}
                    >
                        <span style={{ color: '#ff2d78', fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
                            {roleLabel.toUpperCase()}
                        </span>
                    </div>

                    <span style={{ fontSize: 68, fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: -2 }}>
                        {name}
                    </span>
                    {hangul && (
                        <span style={{ fontSize: 32, fontWeight: 700, color: '#ff2d78', lineHeight: 1 }}>
                            {hangul}
                        </span>
                    )}
                    <span style={{ fontSize: 15, color: '#555', fontWeight: 600, marginTop: 12 }}>
                        hallyuhub.com.br
                    </span>
                </div>

                {/* Right: portrait photo contained */}
                {imageUrl && (
                    <div
                        style={{
                            width: 380,
                            height: '100%',
                            position: 'relative',
                            display: 'flex',
                            flexShrink: 0,
                        }}
                    >
                        {/* fade from left */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0, left: 0, bottom: 0,
                                width: 80,
                                background: 'linear-gradient(to right, #0f0f0f, transparent)',
                                zIndex: 1,
                            }}
                        />
                        <img
                            src={imageUrl}
                            alt=""
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'top center',
                            }}
                        />
                    </div>
                )}
            </div>
        ),
        { ...size },
    )
}
