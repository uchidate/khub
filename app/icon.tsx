import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        <div
            style={{
                width: 32,
                height: 32,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#09090b',
                borderRadius: 7,
            }}
        >
            <span
                style={{
                    color: '#ffffff',
                    fontSize: 20,
                    fontWeight: 900,
                    fontFamily: 'Arial Black, Arial, sans-serif',
                    lineHeight: 1,
                    marginBottom: 3,
                    letterSpacing: -1,
                }}
            >
                H
            </span>
            <div
                style={{
                    width: 18,
                    height: 3,
                    background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
                    borderRadius: 2,
                    display: 'flex',
                }}
            />
        </div>,
        { ...size }
    )
}
