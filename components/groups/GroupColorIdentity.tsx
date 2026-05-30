'use client'

import { useState } from 'react'

interface GroupColorIdentityProps {
    officialColor: string | null
    groupName: string
    fanClubName: string | null
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

export function GroupColorIdentity({ officialColor, groupName, fanClubName }: GroupColorIdentityProps) {
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
                    <div className="grid grid-cols-2 h-28">
                        <div className="relative flex items-end p-3" style={{ background: '#000000' }}>
                            <div>
                                <p className="font-mono text-[8px] font-black uppercase tracking-widest text-white/40">BLACK</p>
                                <p className="font-mono text-xs font-black text-white">#000000</p>
                            </div>
                        </div>
                        <div className="relative flex items-end p-3 cursor-pointer group" style={{ background: officialColor }} onClick={copy}>
                            <div>
                                <p className="font-mono text-[8px] font-black uppercase tracking-widest text-white/70">PINK</p>
                                <p className="font-mono text-xs font-black text-white">
                                    {copied ? 'copiado!' : officialColor}
                                </p>
                            </div>
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                        </div>
                    </div>
                    <div className="p-3 bg-background border-t border-border">
                        <p className="font-mono text-[9px] font-black uppercase tracking-widest text-muted mb-1">HSL</p>
                        <p className="font-mono text-xs text-foreground">{hsl}</p>
                        <p className="font-mono text-[9px] text-muted mt-0.5">Clique no rosa para copiar o hex</p>
                    </div>
                </div>

                {/* Significado do nome */}
                <div className="border border-border bg-background p-4 flex flex-col justify-between"
                    style={{ borderTopColor: officialColor, borderTopWidth: 2 }}>
                    <div>
                        <p className="font-mono text-[9px] font-black uppercase tracking-widest text-muted mb-2">O nome</p>
                        <p className="font-display text-4xl font-black leading-none tracking-tight mb-3">
                            <span style={{ color: '#111' }} className="dark:text-white">BLACK</span>
                            <span style={{ color: officialColor }}>PINK</span>
                        </p>
                        <p className="text-xs text-muted leading-relaxed">
                            Uma inversão consciente de clichês — o preto representa poder e escuridão; o rosa,
                            doçura e feminilidade. Juntos, rejeitam a obrigação de escolher entre um e outro.
                        </p>
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
