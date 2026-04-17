interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
  className?: string
}

export function Sparkline({ data, color = '#3b82f6', width = 48, height = 18, className }: SparklineProps) {
  if (!data || data.length < 2) return null

  const max   = Math.max(...data, 1)
  const min   = Math.min(...data, 0)
  const range = max - min || 1
  const pad   = 1.5

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width  - pad * 2)
    const y = height - pad - ((v - min) / range) * (height - pad * 2)
    return [+x.toFixed(1), +y.toFixed(1)] as [number, number]
  })

  const line = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `${pad},${height} ${line} ${(width - pad).toFixed(1)},${height}`

  return (
    <svg width={width} height={height} className={className} aria-hidden viewBox={`0 0 ${width} ${height}`}>
      <polygon points={area} fill={color} fillOpacity="0.12" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
    </svg>
  )
}
