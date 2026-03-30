import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
    return new ImageResponse(
        <div
            style={{
                width: 180,
                height: 180,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#09090b',
                borderRadius: 36,
            }}
        >
            <span
                style={{
                    color: '#ffffff',
                    fontSize: 96,
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
                    width: 80,
                    height: 10,
                    background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
                    borderRadius: 5,
                    display: 'flex',
                }}
            />
        </div>,
        { ...size }
    )
}
