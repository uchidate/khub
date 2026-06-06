import { ImageResponse } from 'next/og'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const alt = 'Grupo K-Pop — HallyuHub'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const where = slug.match(/^c[a-z0-9]{24}$/) ? { id: slug } : { slug }
    const group = await prisma.musicalGroup.findFirst({
        where,
        select: {
            name: true,
            nameHangul: true,
            profileImageUrl: true,
            officialColor: true,
            members: {
                take: 3,
                where: { artist: { isHidden: false } },
                select: { artist: { select: { nameRomanized: true } } },
            },
        },
    })

    const name = group?.name ?? 'Grupo'
    const hangul = group?.nameHangul ?? ''
    const imageUrl = group?.profileImageUrl ?? null
    const accent = group?.officialColor ?? '#ff2d78'
    const memberPreview = group?.members?.map(m => m.artist.nameRomanized).join(' · ') ?? ''

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
                        background: 'linear-gradient(135deg, #0f0f0f 0%, #0a0a0a 100%)',
                    }}
                >
                    {/* Badge */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: `rgba(${hexToRgb(accent)},0.15)`,
                            border: `1px solid rgba(${hexToRgb(accent)},0.35)`,
                            borderRadius: 32,
                            padding: '6px 18px',
                            width: 'fit-content',
                            marginBottom: 4,
                        }}
                    >
                        <span style={{ color: accent, fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
                            GRUPO K-POP
                        </span>
                    </div>

                    <span style={{ fontSize: 68, fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: -2 }}>
                        {name}
                    </span>
                    {hangul && (
                        <span style={{ fontSize: 32, fontWeight: 700, color: accent, lineHeight: 1 }}>
                            {hangul}
                        </span>
                    )}
                    {memberPreview && (
                        <span style={{ fontSize: 16, color: '#666', fontWeight: 500, marginTop: 4 }}>
                            {memberPreview}
                        </span>
                    )}
                    <span style={{ fontSize: 15, color: '#555', fontWeight: 600, marginTop: 12 }}>
                        hallyuhub.com.br
                    </span>
                </div>

                {/* Right: group photo */}
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

function hexToRgb(hex: string): string {
    const clean = hex.replace('#', '')
    const full = clean.length === 3
        ? clean.split('').map(c => c + c).join('')
        : clean
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    if (isNaN(r)) return '255,45,120'
    return `${r},${g},${b}`
}
