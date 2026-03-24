export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 38 38" fill="none" width={size} height={size}>
      <rect x="4" y="7" width="6" height="24" rx="3" fill="currentColor" />
      <rect x="28" y="7" width="6" height="24" rx="3" fill="currentColor" />
      <path
        stroke="#ff2d78"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 2px #ff2d78)' }}
      >
        <animate
          attributeName="d"
          values="M10 19 C13 14, 17 14, 19 19 C21 24, 25 24, 28 19;M10 19 C13 24, 17 24, 19 19 C21 14, 25 14, 28 19;M10 19 C13 14, 17 14, 19 19 C21 24, 25 24, 28 19"
          dur="2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
          keyTimes="0; 0.5; 1"
        />
      </path>
    </svg>
  )
}
