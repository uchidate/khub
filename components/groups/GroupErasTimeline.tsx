'use client'

import { useState } from 'react'

interface EraItem {
    year: string
    text: string
}

interface GroupErasTimelineProps {
    historico: string[]
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

// Hue-rotate the accent to create era-variant colors
function rotateHue(hex: string, degrees: number): string {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16) / 255
    const g = parseInt(h.slice(2, 4), 16) / 255
    const b = parseInt(h.slice(4, 6), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let hue = 0
    const lum = (max + min) / 2
    const sat = max === min ? 0 : lum > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
    if (max !== min) {
        switch (max) {
            case r: hue = ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6; break
            case g: hue = ((b - r) / (max - min) + 2) / 6; break
            case b: hue = ((r - g) / (max - min) + 4) / 6; break
        }
    }
    const newHue = (hue * 360 + degrees + 360) % 360
    // HSL to hex
    const h1 = newHue / 360
    const s = sat, l = lum
    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1; if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
    }
    const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p2 = 2 * l - q2
    const nr = Math.round(hue2rgb(p2, q2, h1 + 1/3) * 255)
    const ng = Math.round(hue2rgb(p2, q2, h1) * 255)
    const nb = Math.round(hue2rgb(p2, q2, h1 - 1/3) * 255)
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
}

// Agrupar itens por proximidade de anos (gap > 2 anos = nova era)
function groupIntoEras(items: EraItem[]): { label: string; years: string; items: EraItem[]; startYear: number }[] {
    if (items.length === 0) return []
    const sorted = [...items].sort((a, b) => parseInt(a.year) - parseInt(b.year))
    const groups: typeof sorted[] = []
    let current: typeof sorted = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
        const gap = parseInt(sorted[i].year) - parseInt(sorted[i - 1].year)
        if (gap > 2) {
            groups.push(current)
            current = [sorted[i]]
        } else {
            current.push(sorted[i])
        }
    }
    groups.push(current)

    const eraNames = ['Debut', 'Ascensão', 'Consolidação', 'Era de Ouro', 'Reinvenção', 'Legado', 'Nova Fase']

    return groups.map((g, i) => {
        const years = g.map(x => x.year)
        const minY = Math.min(...years.map(Number))
        const maxY = Math.max(...years.map(Number))
        return {
            label: eraNames[i] ?? `Era ${minY}`,
            years: minY === maxY ? String(minY) : `${minY}–${maxY}`,
            items: g,
            startYear: minY,
        }
    })
}

const ERA_ICONS = ['✦', '◈', '◉', '⬡', '◆', '★', '◎']

export function GroupErasTimeline({ historico, accent, groupName }: GroupErasTimelineProps) {
    const [activeEra, setActiveEra] = useState(0)
    const [expandedItem, setExpandedItem] = useState<string | null>(null)

    const items: EraItem[] = historico
        .filter(c => c.startsWith('HISTÓRICO|'))
        .map(c => { const [, year, ...rest] = c.split('|'); return { year, text: rest.join('|') } })

    if (items.length === 0) return null

    const eras = groupIntoEras(items)
    const HUE_STEPS = [0, 30, -30, 60, -60, 90, -90]
    const eraColors = eras.map((_, i) => rotateHue(accent, HUE_STEPS[i % HUE_STEPS.length]))
    const active = eras[activeEra]
    const activeColor = eraColors[activeEra]

    return (
        <section id="timeline">
            {/* Section header */}
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-foreground pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-border bg-background"
                        style={{ color: accent, fontSize: '16px' }}>
                        {ERA_ICONS[activeEra % ERA_ICONS.length]}
                    </div>
                    <div>
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Dossiê</p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">Linha do Tempo</h2>
                    </div>
                </div>
                <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    {items.length} marcos · {eras.length} eras
                </p>
            </div>

            {/* Era selector tabs */}
            <div className="flex gap-1.5 flex-wrap mb-5 overflow-x-auto pb-1">
                {eras.map((era, i) => {
                    const color = eraColors[i]
                    const isActive = i === activeEra
                    return (
                        <button
                            key={i}
                            onClick={() => { setActiveEra(i); setExpandedItem(null) }}
                            className="flex items-center gap-2 px-3 py-2 border font-mono text-[10px] font-black uppercase tracking-[0.08em] transition-all duration-200 whitespace-nowrap"
                            style={isActive ? {
                                background: color,
                                borderColor: color,
                                color: '#fff',
                            } : {
                                borderColor: toRgba(color, 0.35),
                                color: toRgba(color, 0.8),
                                background: toRgba(color, 0.04),
                            }}
                        >
                            <span>{ERA_ICONS[i % ERA_ICONS.length]}</span>
                            <span>{era.label}</span>
                            <span className="opacity-60">{era.years}</span>
                        </button>
                    )
                })}
            </div>

            {/* Active era — card visual */}
            <div className="border border-border overflow-hidden"
                style={{ borderTopColor: activeColor, borderTopWidth: 3 }}>
                {/* Era hero */}
                <div className="relative px-5 py-5 overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${toRgba(activeColor, 0.08)} 0%, ${toRgba(activeColor, 0.02)} 100%)` }}>
                    {/* Watermark */}
                    <div className="absolute -right-4 -top-4 text-[120px] font-black leading-none select-none pointer-events-none opacity-[0.04]"
                        style={{ color: activeColor }}>
                        {active.startYear}
                    </div>
                    <div className="relative flex items-end gap-4 flex-wrap">
                        <div>
                            <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em]"
                                style={{ color: toRgba(activeColor, 0.7) }}>
                                {ERA_ICONS[activeEra % ERA_ICONS.length]} Era {activeEra + 1} de {eras.length}
                            </span>
                            <h3 className="font-display text-4xl font-black leading-none mt-1" style={{ color: activeColor }}>
                                {active.label}
                            </h3>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="font-mono text-2xl font-black text-foreground/60">{active.years}</p>
                            <p className="font-mono text-[10px] text-muted">{active.items.length} {active.items.length === 1 ? 'marco' : 'marcos'}</p>
                        </div>
                    </div>
                </div>

                {/* Timeline items */}
                <div className="divide-y divide-border">
                    {active.items.map((item, i) => {
                        const key = `${item.year}-${i}`
                        const isExpanded = expandedItem === key
                        const isLong = item.text.length > 100
                        return (
                            <div
                                key={key}
                                className={`flex gap-0 transition-colors ${isLong ? 'cursor-pointer hover:bg-surface/40' : ''}`}
                                onClick={() => isLong && setExpandedItem(isExpanded ? null : key)}
                            >
                                {/* Year column */}
                                <div className="flex-shrink-0 w-16 sm:w-20 flex items-start justify-center pt-4 pb-4 px-2">
                                    <span className="font-display text-[13px] font-black" style={{ color: activeColor }}>
                                        {item.year}
                                    </span>
                                </div>

                                {/* Dot + line */}
                                <div className="flex-shrink-0 flex flex-col items-center pt-5 mr-3">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ background: activeColor, boxShadow: `0 0 0 3px ${toRgba(activeColor, 0.15)}` }} />
                                    {i < active.items.length - 1 && (
                                        <div className="flex-1 w-px mt-1" style={{ background: toRgba(activeColor, 0.2) }} />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 py-4 pr-4">
                                    <p className={`text-[13px] leading-relaxed text-foreground ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}>
                                        {item.text}
                                    </p>
                                    {isLong && (
                                        <p className="font-mono text-[9px] mt-1.5 uppercase tracking-wider"
                                            style={{ color: toRgba(activeColor, 0.7) }}>
                                            {isExpanded ? '↑ menos' : '↓ mais'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Era footer */}
                <div className="px-5 py-3 border-t border-border flex items-center justify-between"
                    style={{ background: toRgba(activeColor, 0.03) }}>
                    <p className="font-mono text-[9px] text-muted uppercase tracking-widest">
                        {groupName} · {active.label} · {active.years}
                    </p>
                    <div className="flex gap-1">
                        <button
                            onClick={() => { setActiveEra(i => Math.max(0, i - 1)); setExpandedItem(null) }}
                            disabled={activeEra === 0}
                            className="font-mono text-[10px] px-2 py-1 border border-border text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            ←
                        </button>
                        <button
                            onClick={() => { setActiveEra(i => Math.min(eras.length - 1, i + 1)); setExpandedItem(null) }}
                            disabled={activeEra === eras.length - 1}
                            className="font-mono text-[10px] px-2 py-1 border border-border text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            →
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
