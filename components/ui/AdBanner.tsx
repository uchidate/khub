'use client'

import { useContext, useEffect, useRef, useState } from 'react'
import { AdFrequencyContext } from '@/components/features/AdFrequencyProvider'

/**
 * Variantes:
 *  auto       — responsivo, Google decide tamanho. Usar na maioria dos casos.
 *  fluid      — in-article, flui com o texto. Usar dentro de artigos de blog.
 *  multiplex  — discovery widget no final de páginas. Usa data-ad-format="autorelaxed".
 */
export type AdVariant = 'auto' | 'fluid' | 'multiplex'

// Aliases para compatibilidade com usos antigos
export type AdVariantLegacy = AdVariant | 'leaderboard' | 'banner' | 'rectangle'

interface AdBannerProps {
    slot: string
    variant?: AdVariantLegacy
    minimal?: boolean
    hideLabel?: boolean
    eager?: boolean
    className?: string
    devLabel?: string
    /** Agrupa o slot no AdSense por seção para análise de RPM separado */
    channel?: string
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const IS_DEV = process.env.NODE_ENV === 'development'
const SIDEBAR_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR
const MULTIPLEX_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX

// Multiplex e fluid são "fora do fold" por design — não contam para o limite
const ABOVE_FOLD_VARIANTS: AdVariant[] = ['auto']
const MAX_ABOVE_FOLD = 3

type RuntimeAdSettings = {
    adsGloballyPaused: boolean
    adsMultiplexEnabled: boolean
    adsSidebarEnabled: boolean
}

const SLOT_NAMES: Record<string, string> = {
    [process.env.NEXT_PUBLIC_ADSENSE_SLOT_AUTO!]:       'Auto Geral',
    [process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR!]:    'Sidebar Detalhe',
    [process.env.NEXT_PUBLIC_ADSENSE_SLOT_FLUID!]:      'Blog In-Article',
    [process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME!]:       'Homepage',
    [process.env.NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX!]:  'Multiplex',
}

const DEV_INFO: Record<AdVariant, { size: string; format: string; use: string }> = {
    auto:      { size: '728×90 desktop / 320×50 mobile', format: 'auto responsivo', use: 'uso geral' },
    fluid:     { size: 'variável',                        format: 'fluid in-article', use: 'dentro de artigos' },
    multiplex: { size: 'variável',                        format: 'autorelaxed',      use: 'discovery no final' },
}

function normalizeVariant(v: AdVariantLegacy = 'auto'): AdVariant {
    if (v === 'leaderboard' || v === 'banner' || v === 'rectangle') return 'auto'
    return v
}

function isDisabledBySettings(settings: RuntimeAdSettings | undefined, variant: AdVariant, slot: string) {
    if (!settings) return false
    if (settings.adsGloballyPaused) return true
    if (settings.adsMultiplexEnabled === false && (variant === 'multiplex' || slot === MULTIPLEX_SLOT)) return true
    if (settings.adsSidebarEnabled === false && slot === SIDEBAR_SLOT) return true
    return false
}

export function AdBanner({
    slot,
    variant: rawVariant = 'auto',
    minimal = false,
    hideLabel = false,
    eager = false,
    className = '',
    devLabel,
    channel,
}: AdBannerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const insRef = useRef<HTMLModElement>(null)
    const pushed = useRef(false)
    const [filled, setFilled] = useState<boolean | null>(null) // null = loading
    const [settingsDisabled, setSettingsDisabled] = useState(false)

    const variant = normalizeVariant(rawVariant)
    const isAboveFold = ABOVE_FOLD_VARIANTS.includes(variant)

    // Frequency limit — conta apenas anúncios 'auto' (above-fold)
    const freq = useContext(AdFrequencyContext)
    const [freqAllowed, setFreqAllowed] = useState(true)
    useEffect(() => {
        if (!isAboveFold) return
        const allowed = freq.register()
        setFreqAllowed(allowed)
        return () => { if (allowed) freq.unregister() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slot])

    // Push do ad via IntersectionObserver (ou eager)
    useEffect(() => {
        const adSettings = window.__adSettings as RuntimeAdSettings | undefined
        const disabled = isDisabledBySettings(adSettings, variant, slot)
        setSettingsDisabled(disabled)
        if (disabled) return
        if (!freqAllowed) return
        if (IS_DEV || !CLIENT || !slot) return

        const pushOnce = () => {
            if (pushed.current) return
            pushed.current = true
            try {
                ;((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle = (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({})
            } catch { /* AdSense ainda não carregou */ }
        }

        if (eager) {
            pushOnce()
            return
        }

        const el = containerRef.current
        if (!el) return
        const io = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    pushOnce()
                    io.disconnect()
                }
            },
            { rootMargin: '200px' }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [slot, eager, variant, freqAllowed])

    // Detectar se o AdSense preencheu ou não o slot
    // O AdSense seta data-ad-status="unfilled" quando não há anúncio disponível
    useEffect(() => {
        if (settingsDisabled || !freqAllowed) return
        if (IS_DEV || !CLIENT || !slot) return
        const ins = insRef.current
        if (!ins) return

        const check = () => {
            const status = ins.getAttribute('data-ad-status')
            if (status === 'unfilled') setFilled(false)
            else if (status === 'filled') setFilled(true)
        }

        const mo = new MutationObserver(check)
        mo.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] })

        // Timeout folgado: em produção o leilão pode demorar, principalmente após navegação.
        const timeout = setTimeout(() => {
            const status = ins.getAttribute('data-ad-status')
            if (!status) setFilled(false)
        }, 6000)

        return () => { mo.disconnect(); clearTimeout(timeout) }
    }, [slot, settingsDisabled, freqAllowed])

    if (settingsDisabled || !freqAllowed) return null

    if (IS_DEV) {
        const info = DEV_INFO[variant]
        const heightClass =
            variant === 'auto'
                ? 'h-[50px] sm:h-[90px]'
                : 'h-[250px]'
        return (
            <div className={`relative flex flex-col items-center justify-center gap-1 bg-amber-500/10 border-2 border-dashed border-amber-500/50 rounded overflow-hidden ${heightClass} ${className}`}>
                <span className="text-label font-semibold text-amber-600 dark:text-amber-400 select-none">📢 {devLabel ?? SLOT_NAMES[slot] ?? 'Anúncio'}</span>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5">
                    <span className="text-caption font-mono text-amber-700 dark:text-amber-300 select-none">{info.size}</span>
                    <span className="text-caption font-mono text-amber-500/60 select-none">·</span>
                    <span className="text-caption font-mono text-amber-600/80 dark:text-amber-400/80 select-none">{info.format}</span>
                    <span className="text-caption font-mono text-amber-500/60 select-none">·</span>
                    <span className="text-caption font-mono text-amber-600/80 dark:text-amber-400/80 select-none">{info.use}</span>
                </div>
                <span className="text-micro font-mono text-amber-600/60 dark:text-amber-400/60 select-none">slot: {slot}{channel ? ` · ch:${channel}` : ''}{eager ? ' · eager' : ''}</span>
            </div>
        )
    }

    if (!CLIENT || !slot) return null

    // filled === false → não renderizar nada (sem CLS)
    if (filled === false) return null

    const isFluid = variant === 'fluid'
    const isMultiplex = variant === 'multiplex'

    // Altura fixa reservada antes do ad preencher — evita layout shift (CLS)
    const skeletonClass =
        variant === 'auto'
            ? 'h-[50px] sm:h-[90px]'
            : 'min-h-[250px]'

    return (
        <div ref={containerRef}>
            <div className={filled === true ? className : `overflow-hidden w-full relative bg-surface/40 animate-pulse ${skeletonClass} ${className}`}>
                {filled === null && (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-widest text-muted/20 select-none pointer-events-none">
                        Publicidade
                    </span>
                )}

                {!hideLabel && filled === true && (
                    <p className={`text-micro font-semibold uppercase tracking-widest text-muted/40 text-center select-none ${minimal ? 'mb-1' : 'mb-2'}`}>
                        Publicidade
                    </p>
                )}

                <ins
                    ref={insRef}
                    className="adsbygoogle"
                    style={{ display: 'block', textAlign: 'center' }}
                    data-ad-client={CLIENT}
                    data-ad-slot={slot}
                    data-ad-format={isMultiplex ? 'autorelaxed' : isFluid ? 'fluid' : 'auto'}
                    data-full-width-responsive={isFluid || isMultiplex ? undefined : 'true'}
                    {...(isFluid ? { 'data-ad-layout': 'in-article' } : {})}
                    {...(channel ? { 'data-ad-channel': channel } : {})}
                />

                {!minimal && !hideLabel && filled === true && (
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-px bg-border/40" />
                        <span className="text-micro font-semibold uppercase tracking-widest text-muted/40 select-none">Continua abaixo</span>
                        <div className="flex-1 h-px bg-border/40" />
                    </div>
                )}
            </div>
        </div>
    )
}
