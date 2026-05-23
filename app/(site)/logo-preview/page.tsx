'use client'

import { useEffect, useRef, useState } from 'react'

// ── BrandMark base SVG ────────────────────────────────────────────────────────

function BrandMarkBase({ size = 72, curveColor = '#ff2d78' }: { size?: number; curveColor?: string }) {
    return (
        <svg viewBox="0 0 38 38" fill="none" width={size} height={size}>
            <rect x="4" y="7" width="6" height="24" rx="3" fill="currentColor" />
            <rect x="28" y="7" width="6" height="24" rx="3" fill="currentColor" />
            <path
                d="M10 19 C13 14, 17 14, 19 19 C21 24, 25 24, 28 19"
                stroke={curveColor}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                style={{ transition: 'stroke 0.6s ease' }}
            />
        </svg>
    )
}

// ── Cores de marca ────────────────────────────────────────────────────────────

const COLORS = ['#ff246e', '#b14cff', '#ff6bb0', '#00d4ff', '#ff246e']
const LABELS = ['Rosa', 'Roxo', 'Dourado', 'Ciano']

// ── Opção 1: Dot cromático ────────────────────────────────────────────────────

function Option1() {
    const [idx, setIdx] = useState(0)
    const [fade, setFade] = useState(true)

    useEffect(() => {
        const iv = setInterval(() => {
            setFade(false)
            setTimeout(() => {
                setIdx(i => (i + 1) % (COLORS.length - 1))
                setFade(true)
            }, 300)
        }, 2500)
        return () => clearInterval(iv)
    }, [])

    return (
        <div className="flex items-end gap-5">
            <BrandMarkBase size={72} />
            <div>
                <span className="block text-[58px] font-black leading-[0.86] tracking-[-0.055em]" style={{ color: 'var(--color-fg)' }}>
                    HallyuHub
                    <span style={{
                        color: COLORS[idx],
                        opacity: fade ? 1 : 0,
                        transition: 'opacity 0.3s ease, color 0s',
                        display: 'inline-block',
                    }}>.</span>
                </span>
                <span className="mt-2 block text-[14px] font-semibold tracking-[-0.02em]" style={{ color: 'var(--color-muted)' }}>
                    k-pop · k-drama · cultura coreana, em português
                </span>
            </div>
        </div>
    )
}

// ── Opção 2: BrandMark glow + dot sincronizado ────────────────────────────────

function Option2() {
    const [idx, setIdx] = useState(0)
    const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('hold')

    useEffect(() => {
        const cycle = () => {
            setPhase('in')
            setTimeout(() => setPhase('hold'), 400)
            setTimeout(() => setPhase('out'), 2000)
            setTimeout(() => {
                setIdx(i => (i + 1) % (COLORS.length - 1))
                setPhase('hold')
            }, 2400)
        }
        cycle()
        const iv = setInterval(cycle, 2800)
        return () => clearInterval(iv)
    }, [])

    const glowIntensity = phase === 'in' || phase === 'hold' ? 1 : 0

    return (
        <div className="flex items-end gap-5">
            <div style={{
                filter: `drop-shadow(0 0 ${12 * glowIntensity}px ${COLORS[idx]}88)`,
                transition: 'filter 0.4s ease',
                color: 'var(--color-fg)',
            }}>
                <BrandMarkBase size={72} curveColor={COLORS[idx]} />
            </div>
            <div>
                <span className="block text-[58px] font-black leading-[0.86] tracking-[-0.055em]" style={{ color: 'var(--color-fg)' }}>
                    HallyuHub
                    <span style={{ color: COLORS[idx], transition: 'color 0.4s ease' }}>.</span>
                </span>
                <span className="mt-2 block text-[14px] font-semibold tracking-[-0.02em]" style={{ color: 'var(--color-muted)' }}>
                    k-pop · k-drama · cultura coreana, em português
                </span>
            </div>
        </div>
    )
}

// ── Opção 3: Typewriter subtítulo ─────────────────────────────────────────────

const SUBTITLES = [
    'k-pop · k-drama · cultura coreana, em português',
    'artistas · grupos · produções',
    'tendências · notícias · calendário',
    'tudo sobre o universo hallyu',
]

function Option3() {
    const [si, setSi] = useState(0)
    const [text, setText] = useState('')
    const [deleting, setDeleting] = useState(false)
    const pos = useRef(0)

    useEffect(() => {
        const target = SUBTITLES[si]
        let timeout: ReturnType<typeof setTimeout>

        if (!deleting) {
            if (pos.current < target.length) {
                timeout = setTimeout(() => {
                    pos.current++
                    setText(target.slice(0, pos.current))
                }, 35)
            } else {
                timeout = setTimeout(() => setDeleting(true), 2200)
            }
        } else {
            if (pos.current > 0) {
                timeout = setTimeout(() => {
                    pos.current--
                    setText(target.slice(0, pos.current))
                }, 18)
            } else {
                setDeleting(false)
                setSi(i => (i + 1) % SUBTITLES.length)
            }
        }
        return () => clearTimeout(timeout)
    }, [text, deleting, si])

    return (
        <div className="flex items-end gap-5">
            <BrandMarkBase size={72} />
            <div>
                <span className="block text-[58px] font-black leading-[0.86] tracking-[-0.055em]" style={{ color: 'var(--color-fg)' }}>
                    HallyuHub<span style={{ color: 'var(--color-accent)' }}>.</span>
                </span>
                <span className="mt-2 block text-[14px] font-semibold tracking-[-0.02em] min-h-[20px]" style={{ color: 'var(--color-muted)' }}>
                    {text}<span className="animate-pulse">|</span>
                </span>
            </div>
        </div>
    )
}

// ── Opção 4: BrandMark H anima curva + dot fixo ───────────────────────────────

function Option4() {
    const [idx, setIdx] = useState(0)
    const [t, setT] = useState(0)

    useEffect(() => {
        let frame: number
        let start: number
        const DURATION = 3000

        const animate = (ts: number) => {
            if (!start) start = ts
            const elapsed = (ts - start) % DURATION
            setT(elapsed / DURATION)
            frame = requestAnimationFrame(animate)
        }
        frame = requestAnimationFrame(animate)

        const iv = setInterval(() => setIdx(i => (i + 1) % (COLORS.length - 1)), DURATION)
        return () => { cancelAnimationFrame(frame); clearInterval(iv) }
    }, [])

    // Curva ondulada animada via pathLength offset
    const wave = Math.sin(t * Math.PI * 2) * 3
    const curve = `M10 ${19 + wave} C13 ${14 - wave}, 17 ${14 + wave}, 19 ${19} C21 ${24 - wave}, 25 ${24 + wave}, 28 ${19 - wave}`

    return (
        <div className="flex items-end gap-5">
            <svg viewBox="0 0 38 38" fill="none" width={72} height={72} style={{ color: 'var(--color-fg)' }}>
                <rect x="4" y="7" width="6" height="24" rx="3" fill="currentColor" />
                <rect x="28" y="7" width="6" height="24" rx="3" fill="currentColor" />
                <path
                    d={curve}
                    stroke={COLORS[idx]}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                />
            </svg>
            <div>
                <span className="block text-[58px] font-black leading-[0.86] tracking-[-0.055em]" style={{ color: 'var(--color-fg)' }}>
                    HallyuHub<span style={{ color: COLORS[idx], transition: 'color 0.6s ease' }}>.</span>
                </span>
                <span className="mt-2 block text-[14px] font-semibold tracking-[-0.02em]" style={{ color: 'var(--color-muted)' }}>
                    k-pop · k-drama · cultura coreana, em português
                </span>
            </div>
        </div>
    )
}

// ── Opção 5: Combinação — glow + dot + curva cromática ────────────────────────

function Option5() {
    const [idx, setIdx] = useState(0)
    const [t, setT] = useState(0)

    useEffect(() => {
        let frame: number
        let start: number
        const DURATION = 4000
        const animate = (ts: number) => {
            if (!start) start = ts
            setT(((ts - start) % DURATION) / DURATION)
            frame = requestAnimationFrame(animate)
        }
        frame = requestAnimationFrame(animate)
        const iv = setInterval(() => setIdx(i => (i + 1) % (COLORS.length - 1)), DURATION)
        return () => { cancelAnimationFrame(frame); clearInterval(iv) }
    }, [])

    const pulse = 0.5 + Math.sin(t * Math.PI * 2) * 0.5
    const wave = Math.sin(t * Math.PI * 2) * 2

    return (
        <div className="flex items-end gap-5">
            <div style={{
                filter: `drop-shadow(0 0 ${8 * pulse}px ${COLORS[idx]}99)`,
                color: 'var(--color-fg)',
            }}>
                <svg viewBox="0 0 38 38" fill="none" width={72} height={72}>
                    <rect x="4" y="7" width="6" height="24" rx="3" fill="currentColor" />
                    <rect x="28" y="7" width="6" height="24" rx="3" fill="currentColor" />
                    <path
                        d={`M10 ${19 + wave} C13 ${14}, 17 ${14}, 19 ${19} C21 ${24}, 25 ${24}, 28 ${19 - wave}`}
                        stroke={COLORS[idx]}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
            <div>
                <span className="block text-[58px] font-black leading-[0.86] tracking-[-0.055em]" style={{ color: 'var(--color-fg)' }}>
                    HallyuHub<span style={{ color: COLORS[idx], transition: 'color 0.6s ease' }}>.</span>
                </span>
                <span className="mt-2 block text-[14px] font-semibold tracking-[-0.02em]" style={{ color: 'var(--color-muted)' }}>
                    k-pop · k-drama · cultura coreana, em português
                </span>
            </div>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const OPTIONS = [
    { id: 1, label: 'Dot cromático', desc: 'Só o ponto muda de cor a cada 2.5s', Component: Option1 },
    { id: 2, label: 'Glow sincronizado', desc: 'H brilha e ponto muda cor juntos', Component: Option2 },
    { id: 3, label: 'Typewriter', desc: 'Subtítulo digita e apaga frases diferentes', Component: Option3 },
    { id: 4, label: 'Curva viva', desc: 'Curva do H ondula continuamente + dot muda cor', Component: Option4 },
    { id: 5, label: 'Combinação', desc: 'Glow pulsante + curva ondulante + dot cromático', Component: Option5 },
]

export default function LogoPreviewPage() {
    return (
        <div className="min-h-screen px-8 py-16 font-sora" style={{ background: 'var(--color-bg)' }}>
            <div className="max-w-3xl mx-auto">
                <h1 className="text-sm font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--color-muted)' }}>
                    Preview · Logo animado
                </h1>
                <p className="text-xs mb-12" style={{ color: 'var(--color-muted)' }}>
                    Página temporária — <code>/logo-preview</code>
                </p>

                <div className="flex flex-col gap-16">
                    {OPTIONS.map(({ id, label, desc, Component }) => (
                        <div key={id}>
                            <div className="flex items-baseline gap-3 mb-6 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <span className="text-xs font-black font-mono" style={{ color: 'var(--color-accent)' }}>0{id}</span>
                                <span className="text-sm font-bold" style={{ color: 'var(--color-fg)' }}>{label}</span>
                                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{desc}</span>
                            </div>
                            <Component />
                        </div>
                    ))}
                </div>

                <p className="mt-16 text-xs" style={{ color: 'var(--color-muted)' }}>
                    Diga qual opção (01–05) quer implementar de verdade na navbar.
                </p>
            </div>
        </div>
    )
}
