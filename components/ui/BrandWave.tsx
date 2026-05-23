const COLOR = '#ff246e'

interface BrandWaveProps {
    width?: number
    height?: number
    duration?: number
    className?: string
}

export function BrandWave({ width = 180, height = 16, className = '' }: BrandWaveProps) {
    const mid = height / 2
    const amp = height * 0.38
    const points = Array.from({ length: width + 1 }, (_, x) => {
        const y = mid + Math.sin((x / width) * Math.PI * 4) * amp
        return `${x},${y}`
    }).join(' ')

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className={className}
            style={{ display: 'block' }}
            aria-hidden="true"
        >
            <polyline
                points={points}
                fill="none"
                stroke={COLOR}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    )
}

// Versão full-width para dividir seções
export function BrandWaveDivider({ className = '' }: { duration?: number; className?: string }) {
    const H = 20
    const W = 800, mid = H / 2, amp = H * 0.38
    const points = Array.from({ length: W + 1 }, (_, x) => {
        const y = mid + Math.sin((x / W) * Math.PI * 6) * amp
        return `${x},${y}`
    }).join(' ')

    return (
        <div className={`w-full overflow-hidden ${className}`} style={{ height: H }} aria-hidden="true">
            <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                <polyline
                    points={points}
                    fill="none"
                    stroke={COLOR}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    )
}
