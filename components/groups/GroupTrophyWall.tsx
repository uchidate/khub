'use client'

import { useState } from 'react'
import { Trophy, Music2, Star, Globe, Crown, Zap } from 'lucide-react'
import { Youtube } from '@/components/ui/BrandIcons'

interface TrophyWallProps {
    curiosidades: string[]
    accent: string
    groupName: string
}

function toRgba(hex: string, alpha: number) {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

type Category = 'youtube' | 'billboard' | 'guinness' | 'live' | 'royal' | 'streaming' | 'record'

const CATEGORY_META: Record<Category, { label: string; icon: React.ReactNode; color: string }> = {
    youtube:   { label: 'YouTube',    icon: <Youtube className="w-4 h-4" />,  color: '#ef4444' },
    billboard: { label: 'Billboard',  icon: <Music2 className="w-4 h-4" />,   color: '#f59e0b' },
    guinness:  { label: 'Guinness',   icon: <Trophy className="w-4 h-4" />,   color: '#a855f7' },
    live:      { label: 'Ao Vivo',    icon: <Zap className="w-4 h-4" />,      color: '#10b981' },
    royal:     { label: 'Realeza',    icon: <Crown className="w-4 h-4" />,    color: '#eab308' },
    streaming: { label: 'Streaming',  icon: <Globe className="w-4 h-4" />,    color: '#06b6d4' },
    record:    { label: 'Recorde',    icon: <Star className="w-4 h-4" />,     color: '#f97316' },
}

function detectCategory(text: string): Category {
    const t = text.toLowerCase()
    if (t.includes('youtube') || t.includes('views') || t.includes('visualizaç') || t.includes('mv') || t.includes('assistido')) return 'youtube'
    if (t.includes('billboard') || t.includes('álbum') || t.includes('chart') || t.includes('vendido') || t.includes('hot 100')) return 'billboard'
    if (t.includes('guinness') || t.includes('mundial')) return 'guinness'
    if (t.includes('coachella') || t.includes('tour') || t.includes('show') || t.includes('apresent')) return 'live'
    if (t.includes('rei') || t.includes('mbe') || t.includes('buckingham') || t.includes('condecorou')) return 'royal'
    if (t.includes('spotify') || t.includes('stream') || t.includes('bilh')) return 'streaming'
    return 'record'
}

function extractHeadline(text: string): string {
    // Pegar a parte mais marcante (até o primeiro ponto/travessão)
    const parts = text.split(/[.–—]/)
    return parts[0].trim().slice(0, 80)
}

export function GroupTrophyWall({ curiosidades, accent, groupName }: TrophyWallProps) {
    const [active, setActive] = useState<number | null>(null)

    // Combinar facts e HISTÓRICO milestones
    const facts = curiosidades.filter(c => !c.startsWith('HISTÓRICO|'))

    // Achievements: apenas facts (HISTÓRICO fica na Linha do Tempo)
    const achievements = facts.map(text => ({ text, year: null })).slice(0, 9)

    if (achievements.length === 0) return null

    return (
        <section id="conquistas">
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-foreground pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-border bg-background">
                        <Trophy className="w-4 h-4" style={{ color: accent }} />
                    </div>
                    <div>
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Dossiê</p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">Hall da Fama</h2>
                    </div>
                </div>
                <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    {achievements.length} conquistas
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {achievements.map((item, i) => {
                    const cat = detectCategory(item.text)
                    const meta = CATEGORY_META[cat]
                    const isOpen = active === i
                    return (
                        <button
                            key={i}
                            onClick={() => setActive(isOpen ? null : i)}
                            className="group relative overflow-hidden border border-border bg-background p-4 text-left transition-all duration-200 hover:border-foreground/40"
                            style={isOpen ? { borderColor: toRgba(meta.color, 0.6), background: toRgba(meta.color, 0.04) } : undefined}
                        >
                            {/* Background glow */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                style={{ background: `radial-gradient(circle at top left, ${toRgba(meta.color, 0.08)}, transparent 70%)` }} />

                            {/* Category badge */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-widest text-white"
                                    style={{ background: meta.color }}>
                                    {meta.icon}
                                    {meta.label}
                                </span>
                                {item.year && (
                                    <span className="font-mono text-[9px] font-black text-muted">{item.year}</span>
                                )}
                            </div>

                            {/* Trophy icon watermark */}
                            <div className="absolute -bottom-3 -right-2 opacity-[0.06] pointer-events-none" style={{ color: meta.color }}>
                                <div className="text-[72px]">{meta.icon}</div>
                            </div>

                            <p className="text-[13px] font-semibold text-foreground leading-snug relative z-10">
                                {isOpen ? item.text : extractHeadline(item.text)}
                            </p>

                            {!isOpen && item.text.length > 80 && (
                                <p className="mt-1.5 font-mono text-[9px] text-muted uppercase tracking-wider">
                                    + ver detalhes
                                </p>
                            )}
                        </button>
                    )
                })}
            </div>

            <p className="mt-3 font-mono text-[9px] text-muted text-right uppercase tracking-widest">
                {groupName} · conquistas verificadas
            </p>
        </section>
    )
}
