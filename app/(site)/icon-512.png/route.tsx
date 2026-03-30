import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
    return new ImageResponse(
        <div
            style={{
                width: 512,
                height: 512,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#09090b',
                borderRadius: 100,
            }}
        >
            <span
                style={{
                    color: '#ffffff',
                    fontSize: 260,
                    fontWeight: 900,
                    fontFamily: 'Arial Black, Arial, sans-serif',
                    lineHeight: 1,
                    marginBottom: 24,
                    letterSpacing: -10,
                }}
            >
                H
            </span>
            <div
                style={{
                    width: 220,
                    height: 24,
                    background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
                    borderRadius: 12,
                    display: 'flex',
                }}
            />
        </div>,
        { width: 512, height: 512 }
    )
}
