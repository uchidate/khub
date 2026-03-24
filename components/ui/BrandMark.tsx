export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 38 38" fill="none" width={size} height={size}>
      <rect x="4" y="7" width="6" height="24" rx="3" fill="currentColor" />
      <rect x="28" y="7" width="6" height="24" rx="3" fill="currentColor" />

      {/* Nested SVG clips the traveling wave between the two bars */}
      <svg x="10" y="7" width="18" height="24" overflow="hidden" viewBox="0 0 18 24">
        <path
          d="M-18 12 C-15 7,-11 7,-9 12 C-7 17,-3 17,0 12 C3 7,7 7,9 12 C11 17,15 17,18 12 C21 7,25 7,27 12 C29 17,33 17,36 12"
          stroke="#ff2d78"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 36,0; 36,0"
            keyTimes="0; 0.3; 1"
            dur="10s"
            repeatCount="indefinite"
            calcMode="linear"
          />
        </path>
      </svg>
    </svg>
  )
}
