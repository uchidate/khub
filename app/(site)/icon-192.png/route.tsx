import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
    return new ImageResponse(
        <div
            style={{
                width: 192,
                height: 192,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#09090b',
                borderRadius: 38,
            }}
        >
            <span
                style={{
                    color: '#ffffff',
                    fontSize: 100,
                    fontWeight: 900,
                    fontFamily: 'Arial Black, Arial, sans-serif',
                    lineHeight: 1,
                    marginBottom: 10,
                    letterSpacing: -4,
                }}
            >
                H
            </span>
            <div
                style={{
                    width: 88,
                    height: 10,
                    background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
                    borderRadius: 5,
                    display: 'flex',
                }}
            />
        </div>,
        { width: 192, height: 192 }
    )
}
