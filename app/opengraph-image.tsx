import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'HallyuHub — K-Pop, K-Drama e Cultura Coreana'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
        }}
      >
        {/* Gradient glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,45,120,0.35) 0%, transparent 70%)',
          }}
        />
        {/* Gradient glow bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: 60,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,45,120,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
            background: 'rgba(255,45,120,0.15)',
            border: '1px solid rgba(255,45,120,0.3)',
            borderRadius: 32,
            padding: '8px 20px',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ff2d78',
            }}
          />
          <span style={{ color: '#ff2d78', fontSize: 15, fontWeight: 700, letterSpacing: 2 }}>
            PORTAL HALLYU BRASIL
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            marginBottom: 28,
          }}
        >
          <span
            style={{
              fontSize: 76,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1,
              letterSpacing: -2,
              textTransform: 'uppercase',
            }}
          >
            Hallyu
          </span>
          <span
            style={{
              fontSize: 76,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: -2,
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #ff2d78, #ff6fa3)',
              // @ts-ignore
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Hub
          </span>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 22,
            color: '#888',
            margin: 0,
            lineHeight: 1.5,
            maxWidth: 620,
          }}
        >
          Artistas K-Pop, grupos, dramas e filmes coreanos — tudo em português.
        </p>

        {/* URL bottom-right */}
        <span
          style={{
            position: 'absolute',
            bottom: 48,
            right: 72,
            fontSize: 16,
            color: '#444',
            fontWeight: 600,
          }}
        >
          hallyuhub.com.br
        </span>
      </div>
    ),
    { ...size },
  )
}
