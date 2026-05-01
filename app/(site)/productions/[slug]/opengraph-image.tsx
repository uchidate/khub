import { ImageResponse } from 'next/og'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const alt = 'Produção — HallyuHub'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const where = slug.match(/^c[a-z0-9]{24}$/) ? { id: slug } : { slug }
    const production = await prisma.production.findFirst({
        where,
        select: { titlePt: true, titleKr: true, backdropUrl: true, imageUrl: true, type: true, year: true },
    })

    const title = production?.titlePt ?? 'Produção'
    const titleKr = production?.titleKr ?? ''
    const imageUrl = production?.backdropUrl ?? production?.imageUrl ?? null
    const typeLabel = production?.type === 'movie' ? 'K-FILM' : 'K-DRAMA'
    const year = production?.year

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
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt=""
                        style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                        }}
                    />
                )}
                <div
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(to top, rgba(10,10,10,0.98) 35%, rgba(10,10,10,0.5) 70%, rgba(10,10,10,0.2) 100%)',
                    }}
                />

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
                            {typeLabel}{year ? ` · ${year}` : ''}
                        </span>
                    </div>

                    <span style={{ fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: -1 }}>
                        {title}
                    </span>
                    {titleKr && (
                        <span style={{ fontSize: 28, fontWeight: 700, color: '#ff2d78', lineHeight: 1 }}>
                            {titleKr}
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
