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
        select: { nameRomanized: true, nameHangul: true, primaryImageUrl: true, profileImageUrl: true },
    })

    const name = artist?.nameRomanized ?? 'Artista'
    const hangul = artist?.nameHangul ?? ''
    const imageUrl = artist?.primaryImageUrl ?? artist?.profileImageUrl ?? null

    return new ImageResponse(
        (
            <div
                style={{
                    background: '#0a0a0a',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    position: 'relative',
                    fontFamily: 'sans-serif',
                    overflow: 'hidden',
                }}
            >
                {/* Background image with overlay */}
                {imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt=""
                        style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'top center',
                        }}
                    />
                )}
                {/* Dark gradient overlay */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(to right, rgba(10,10,10,0.95) 45%, rgba(10,10,10,0.4) 100%)',
                    }}
                />

                {/* Content */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0, left: 0, right: 0,
                        padding: '64px 72px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                >
                    {/* Badge */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'rgba(255,45,120,0.15)',
                            border: '1px solid rgba(255,45,120,0.3)',
                            borderRadius: 32,
                            padding: '6px 16px',
                            width: 'fit-content',
                            marginBottom: 8,
                        }}
                    >
                        <span style={{ color: '#ff2d78', fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
                            ARTISTA K-POP
                        </span>
                    </div>

                    <span style={{ fontSize: 72, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -2 }}>
                        {name}
                    </span>
                    {hangul && (
                        <span style={{ fontSize: 36, fontWeight: 700, color: '#ff2d78', lineHeight: 1 }}>
                            {hangul}
                        </span>
                    )}
                    <span style={{ fontSize: 16, color: '#666', fontWeight: 600, marginTop: 8 }}>
                        hallyuhub.com.br
                    </span>
                </div>
            </div>
        ),
        { ...size },
    )
}
