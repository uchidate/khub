'use client'

import { useState } from 'react'

interface GroupColorIdentityProps {
    officialColor: string | null
    groupName: string
    fanClubName: string | null
    nameMeaning?: string | null
    bio?: string | null
}

function toRgba(hex: string, alpha: number) {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

function hexToHsl(hex: string): string {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16) / 255
    const g = parseInt(h.slice(2, 4), 16) / 255
    const b = parseInt(h.slice(4, 6), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let hue = 0, sat = 0
    const lum = (max + min) / 2
    if (max !== min) {
        const d = max - min
        sat = lum > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
            case g: hue = ((b - r) / d + 2) / 6; break
            case b: hue = ((r - g) / d + 4) / 6; break
        }
    }
    return `${Math.round(hue * 360)}° ${Math.round(sat * 100)}% ${Math.round(lum * 100)}%`
}

export function GroupColorIdentity({ officialColor, groupName, fanClubName, nameMeaning }: GroupColorIdentityProps) {
    const [copied, setCopied] = useState(false)
    if (!officialColor) return null

    const hsl = hexToHsl(officialColor)

    const copy = () => {
        navigator.clipboard.writeText(officialColor).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        })
    }

    return (
        <section id="identidade">
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-foreground pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-border"
                        style={{ background: officialColor }} />
                    <div>
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Dossiê</p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">Identidade Visual</h2>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {/* Paleta de cores */}
                <div className="border border-border overflow-hidden">
                    <div className="h-28 cursor-pointer" style={{ background: officialColor }} onClick={copy} />
                    <div className="p-3 bg-background border-t border-border">
                        <p className="font-mono text-[9px] font-black uppercase tracking-widest text-muted mb-1">Cor oficial</p>
                        <p className="font-mono text-xs text-foreground cursor-pointer" onClick={copy}>
                            {copied ? 'copiado!' : officialColor}
                        </p>
                        <p className="font-mono text-[9px] text-muted mt-0.5">HSL {hsl} · clique para copiar</p>
                    </div>
                </div>

                {/* Significado do nome */}
                <div className="border border-border bg-background p-4 flex flex-col justify-between"
                    style={{ borderTopColor: officialColor, borderTopWidth: 2 }}>
                    <div>
                        <p className="font-mono text-[9px] font-black uppercase tracking-widest text-muted mb-2">O nome</p>
                        <p className="font-display text-4xl font-black leading-none tracking-tight mb-3"
                            style={{ color: officialColor }}>
                            {groupName}
                        </p>
                        {nameMeaning && (
                            <p className="text-xs text-muted leading-relaxed">{nameMeaning}</p>
                        )}
                    </div>
                    {fanClubName && (
                        <div className="mt-3 pt-3 border-t border-border">
                            <p className="font-mono text-[9px] font-black uppercase tracking-widest text-muted">Fandom</p>
                            <p className="font-bold text-foreground text-sm mt-0.5">
                                {fanClubName}
                                <span className="text-muted font-normal"> — fãs oficiais do {groupName}</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Gradiente showcase */}
            <div className="mt-3 h-8 overflow-hidden"
                style={{ background: `linear-gradient(to right, #000 0%, ${toRgba(officialColor, 0.6)} 40%, ${officialColor} 70%, #fff 100%)` }}>
                <div className="h-full flex items-center justify-center">
                    <p className="font-mono text-[8px] font-black uppercase tracking-[0.3em] mix-blend-difference text-white">
                        {groupName} · Gradiente oficial
                    </p>
                </div>
            </div>
        </section>
    )
}
