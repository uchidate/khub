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
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        borderRadius: 7,
      }}
    >
      <svg viewBox="0 0 38 38" width={26} height={26} fill="none">
        <rect x="4" y="7" width="6" height="24" rx="3" fill="white" />
        <rect x="28" y="7" width="6" height="24" rx="3" fill="white" />
        <path
          d="M10 19 C13 14, 17 14, 19 19 C21 24, 25 24, 28 19"
          stroke="#ff2d78"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>,
    { ...size }
  )
}
