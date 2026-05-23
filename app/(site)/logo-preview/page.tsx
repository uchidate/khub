'use client'

import { useEffect, useRef, useState } from 'react'

const COLORS = ['#ff246e', '#b14cff', '#ff6bb0', '#00d4ff']

// ── Hook compartilhado de animação ────────────────────────────────────────────

function useBrandAnim(duration = 4000) {
    const [idx, setIdx] = useState(0)
    const [t, setT] = useState(0)
    const frameRef = useRef<number>(0)
    const startRef = useRef<number>(0)

    useEffect(() => {
        const animate = (ts: number) => {
            if (!startRef.current) startRef.current = ts
            setT(((ts - startRef.current) % duration) / duration)
            frameRef.current = requestAnimationFrame(animate)
        }
        frameRef.current = requestAnimationFrame(animate)
        const iv = setInterval(() => setIdx(i => (i + 1) % COLORS.length), duration)
        return () => { cancelAnimationFrame(frameRef.current); clearInterval(iv) }
    }, [duration])

    const pulse = 0.5 + Math.sin(t * Math.PI * 2) * 0.5
    const wave = Math.sin(t * Math.PI * 2) * 2
    const color = COLORS[idx]
    return { color, pulse, wave, t }
}

// ── BrandDot — ponto cromático animado ───────────────────────────────────────

function BrandDot({ size = 'text-[1em]', duration = 4000 }: { size?: string; duration?: number }) {
    const { color } = useBrandAnim(duration)
    return <span className={size} style={{ color, transition: 'color 0.6s ease' }}>.</span>
}

// ── BrandWave — onda decorativa horizontal ───────────────────────────────────

function BrandWave({ width = 200, height = 24, duration = 4000 }: { width?: number; height?: number; duration?: number }) {
    const { color, t } = useBrandAnim(duration)
    const mid = height / 2
    const amp = height * 0.35
    // Gera pontos de onda senoidal
    const points = Array.from({ length: width + 1 }, (_, x) => {
        const y = mid + Math.sin((x / width) * Math.PI * 4 + t * Math.PI * 2) * amp
        return `${x},${y}`
    }).join(' ')

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
            <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={{ transition: 'stroke 0.6s ease' }} />
        </svg>
    )
}

// ── BrandWaveDivider — divisor de seção ──────────────────────────────────────

function BrandWaveDivider({ duration = 4000 }: { duration?: number }) {
    const { color, t } = useBrandAnim(duration)
    const W = 600, H = 20, mid = H / 2, amp = H * 0.4
    const points = Array.from({ length: W + 1 }, (_, x) => {
        const y = mid + Math.sin((x / W) * Math.PI * 6 + t * Math.PI * 2) * amp
        return `${x},${y}`
    }).join(' ')

    return (
        <div className="w-full overflow-hidden" style={{ height: H }}>
            <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" style={{ transition: 'stroke 0.6s ease' }} />
            </svg>
        </div>
    )
}

// ── Seção de preview ──────────────────────────────────────────────────────────

function PreviewSection({ id, label, desc, children }: { id: string; label: string; desc: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="flex items-baseline gap-3 mb-6 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span className="text-xs font-black font-mono" style={{ color: 'var(--color-accent)' }}>{id}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--color-fg)' }}>{label}</span>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{desc}</span>
            </div>
            {children}
        </div>
    )
}

// ── Opções do logo (mantidas) ─────────────────────────────────────────────────

function LogoOption5() {
    const { color, pulse, wave } = useBrandAnim()
    return (
        <div className="flex items-end gap-5">
            <div style={{ filter: `drop-shadow(0 0 ${8 * pulse}px ${color}99)`, color: 'var(--color-fg)' }} className="mb-1 shrink-0">
                <svg viewBox="0 0 38 38" fill="none" width={72} height={72}>
                    <rect x="4" y="7" width="6" height="24" rx="3" fill="currentColor" />
                    <rect x="28" y="7" width="6" height="24" rx="3" fill="currentColor" />
                    <path d={`M10 ${19 + wave} C13 14, 17 14, 19 19 C21 24, 25 24, 28 ${19 - wave}`}
                        stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
            </div>
            <div>
                <span className="block text-[58px] font-black leading-[0.86] tracking-[-0.055em]" style={{ color: 'var(--color-fg)' }}>
                    HallyuHub<span style={{ color, transition: 'color 0.6s ease' }}>.</span>
                </span>
                <span className="mt-2 block text-[14px] font-semibold tracking-[-0.02em]" style={{ color: 'var(--color-muted)' }}>
                    k-pop · k-drama · cultura coreana, em português
                </span>
            </div>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LogoPreviewPage() {
    return (
        <div className="min-h-screen px-8 py-16 font-sora" style={{ background: 'var(--color-bg)' }}>
            <div className="max-w-3xl mx-auto">
                <h1 className="text-sm font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--color-muted)' }}>
                    Preview · Identidade Visual
                </h1>
                <p className="text-xs mb-12" style={{ color: 'var(--color-muted)' }}>
                    Página temporária — <code>/logo-preview</code>
                </p>

                <div className="flex flex-col gap-16">

                    {/* Logo escolhido */}
                    <PreviewSection id="✓" label="Logo atual (opção 5)" desc="já implementado na navbar">
                        <LogoOption5 />
                    </PreviewSection>

                    {/* BrandDot em títulos de seção */}
                    <PreviewSection id="A" label="BrandDot em títulos de seção" desc="ponto no final de headings de página">
                        <div className="flex flex-col gap-6">
                            <h2 className="text-[40px] font-black leading-tight tracking-tight" style={{ color: 'var(--color-fg)' }}>
                                Em Alta Agora<BrandDot size="text-[40px]" />
                            </h2>
                            <h2 className="text-[40px] font-black leading-tight tracking-tight" style={{ color: 'var(--color-fg)' }}>
                                Artistas K-Pop<BrandDot size="text-[40px]" />
                            </h2>
                            <h2 className="text-[40px] font-black leading-tight tracking-tight" style={{ color: 'var(--color-fg)' }}>
                                Últimos Artigos<BrandDot size="text-[40px]" />
                            </h2>
                            <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>Cicla a cada 4s entre rosa → roxo → dourado → ciano</p>
                        </div>
                    </PreviewSection>

                    {/* BrandDot em títulos de artigo */}
                    <PreviewSection id="B" label="BrandDot em h1 de artigo" desc="sutil no final do título do post">
                        <div className="flex flex-col gap-4 max-w-xl">
                            <h1 className="text-[32px] font-black leading-tight tracking-tight" style={{ color: 'var(--color-fg)' }}>
                                BLACKPINK anuncia turnê mundial em 2025<BrandDot size="text-[32px]" />
                            </h1>
                            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                                Por Equipe HallyuHub · 22 mai 2026
                            </p>
                        </div>
                    </PreviewSection>

                    {/* BrandWave como divisor */}
                    <PreviewSection id="C" label="BrandWave divisor de seção" desc="onda horizontal entre blocos da homepage">
                        <div className="flex flex-col gap-8">
                            <div className="py-4 rounded-xl px-6" style={{ background: 'var(--color-surface)' }}>
                                <p className="text-sm font-bold mb-4" style={{ color: 'var(--color-fg)' }}>Seção A — Trending Artists</p>
                                <div className="h-16 rounded" style={{ background: 'var(--color-skeleton)' }} />
                            </div>
                            <BrandWaveDivider />
                            <div className="py-4 rounded-xl px-6" style={{ background: 'var(--color-surface)' }}>
                                <p className="text-sm font-bold mb-4" style={{ color: 'var(--color-fg)' }}>Seção B — Últimas Notícias</p>
                                <div className="h-16 rounded" style={{ background: 'var(--color-skeleton)' }} />
                            </div>
                            <BrandWaveDivider duration={3000} />
                            <div className="py-4 rounded-xl px-6" style={{ background: 'var(--color-surface)' }}>
                                <p className="text-sm font-bold mb-4" style={{ color: 'var(--color-fg)' }}>Seção C — Produções</p>
                                <div className="h-16 rounded" style={{ background: 'var(--color-skeleton)' }} />
                            </div>
                        </div>
                    </PreviewSection>

                    {/* BrandWave inline pequena */}
                    <PreviewSection id="D" label="BrandWave inline decorativa" desc="onda pequena abaixo de títulos de seção">
                        <div className="flex flex-col gap-8">
                            <div>
                                <h2 className="text-[36px] font-black leading-tight tracking-tight mb-3" style={{ color: 'var(--color-fg)' }}>
                                    Grupos em Destaque
                                </h2>
                                <BrandWave width={180} height={16} duration={3500} />
                                <p className="mt-4 text-sm" style={{ color: 'var(--color-muted)' }}>
                                    Os grupos mais populares desta semana
                                </p>
                            </div>
                            <div>
                                <h2 className="text-[36px] font-black leading-tight tracking-tight mb-3" style={{ color: 'var(--color-fg)' }}>
                                    K-Dramas da Semana
                                </h2>
                                <BrandWave width={180} height={16} duration={5000} />
                                <p className="mt-4 text-sm" style={{ color: 'var(--color-muted)' }}>
                                    Séries em exibição agora nas plataformas
                                </p>
                            </div>
                        </div>
                    </PreviewSection>

                    {/* BrandDot no footer */}
                    <PreviewSection id="E" label="BrandDot no footer / taglines" desc="pontos cromáticos em separadores de texto">
                        <div className="flex flex-col gap-6">
                            <div className="py-6 px-8 rounded-xl" style={{ background: '#0c0c0c' }}>
                                <div className="text-[22px] font-black tracking-tight mb-2" style={{ color: '#f5f5f5' }}>
                                    HallyuHub<BrandDot />
                                </div>
                                <div className="flex items-center gap-2 text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    <span>k-pop</span>
                                    <BrandDot size="text-[13px]" duration={2000} />
                                    <span>k-drama</span>
                                    <BrandDot size="text-[13px]" duration={3000} />
                                    <span>cultura coreana</span>
                                </div>
                            </div>
                        </div>
                    </PreviewSection>

                    {/* BrandWave no topo de página de artista/grupo */}
                    <PreviewSection id="F" label="BrandWave em hero de perfil" desc="onda sob o nome do artista/grupo na página de detalhe">
                        <div className="flex flex-col gap-4 max-w-sm">
                            <div>
                                <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--color-muted)' }}>Artista</p>
                                <h1 className="text-[48px] font-black leading-none tracking-tight" style={{ color: 'var(--color-fg)' }}>IU</h1>
                                <BrandWave width={80} height={14} duration={5000} />
                            </div>
                            <div className="mt-4">
                                <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--color-muted)' }}>Grupo</p>
                                <h1 className="text-[48px] font-black leading-none tracking-tight" style={{ color: 'var(--color-fg)' }}>BLACKPINK</h1>
                                <BrandWave width={160} height={14} duration={3500} />
                            </div>
                        </div>
                    </PreviewSection>

                </div>

                <p className="mt-16 text-xs" style={{ color: 'var(--color-muted)' }}>
                    Diga quais elementos (A–F) quer implementar e em quais páginas.
                </p>
            </div>
        </div>
    )
}
