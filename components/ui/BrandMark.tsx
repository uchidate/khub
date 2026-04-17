export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 38 38" fill="none" width={size} height={size}>
      <rect x="4" y="7" width="6" height="24" rx="3" fill="currentColor" />
      <rect x="28" y="7" width="6" height="24" rx="3" fill="currentColor" />
      <path
        d="M10 19 C13 14, 17 14, 19 19 C21 24, 25 24, 28 19"
        stroke="#ff2d78"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
