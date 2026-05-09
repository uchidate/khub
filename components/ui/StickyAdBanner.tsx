'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { useAdFilled } from '@/hooks/useAdFilled'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const IS_DEV = process.env.NODE_ENV === 'development'
const SESSION_KEY = 'sticky_ad_closed'

// Aparece após rolar SHOW_AT pixels, some ao voltar abaixo de HIDE_AT
const SHOW_AT = 300
const HIDE_AT = 80

interface Props {
    slot: string
}

export function StickyAdBanner({ slot }: Props) {
    const [show, setShow] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const pushed = useRef(false)
    const { insRef, filled } = useAdFilled(slot)

    // Push imediato no mount — não espera scroll — para o AdSense ter tempo de preencher
    useEffect(() => {
        if (IS_DEV || !CLIENT || !slot || pushed.current) return
        pushed.current = true
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch { /* AdSense ainda não carregou */ }
    }, [slot])

    const handleScroll = useCallback(() => {
        const y = window.scrollY
        if (y > SHOW_AT) setShow(true)
        else if (y < HIDE_AT) setShow(false)
    }, [])

    useEffect(() => {
        if (IS_DEV) return
        if (!CLIENT || !slot) return
        if (sessionStorage.getItem(SESSION_KEY)) { setDismissed(true); return }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [slot, handleScroll])

    const close = () => {
        setDismissed(true)
        setShow(false)
        sessionStorage.setItem(SESSION_KEY, '1')
    }

    // Dev: mostra placeholder animado para testar comportamento
    if (IS_DEV) {
        return (
            <>
                {/* Botão de preview para simular scroll em dev */}
                <button
                    onClick={() => setShow(s => !s)}
                    className="fixed bottom-4 left-4 z-50 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow"
                >
                    {show ? 'Ocultar' : 'Mostrar'} âncora
                </button>

                <div
                    className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out ${
                        show ? 'translate-y-0' : 'translate-y-full'
                    }`}
                    aria-hidden={!show}
                >
                    <div className="relative bg-background border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.15)]">
                        <button
                            onClick={close}
                            aria-label="Fechar anúncio"
                            className="absolute -top-7 right-4 bg-surface border border-border border-b-0 rounded-t-md px-3 py-1 flex items-center gap-1.5 text-[10px] font-medium text-muted hover:text-foreground transition-colors"
                        >
                            <X className="w-3 h-3" /> Fechar
                        </button>
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted/40 text-center pt-1.5 select-none">
                            Publicidade
                        </p>
                        <div className="flex justify-center items-center h-[50px] sm:h-[90px] bg-amber-500/10 border-dashed border-2 border-amber-500/30 mx-4 mb-2 mt-1 rounded">
                            <span className="text-[11px] font-semibold text-amber-600 select-none">📢 Âncora · {slot}</span>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    if (!CLIENT || !slot) return null

    // Renderiza sempre no DOM (para o AdSense preencher), mas controla visibilidade via transform.
    // Quando dismissed, remove do DOM completamente.
    if (dismissed) return null

    // Se o AdSense confirmou unfilled, não ocupa nenhum espaço
    if (filled === false) return null

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out ${
                show && filled === true ? 'translate-y-0' : 'translate-y-full'
            }`}
            aria-hidden={!show || filled !== true}
        >
            <div className="relative bg-background border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.15)]">
                {/* Aba "Fechar" acima do banner — idêntica ao padrão G1, UOL, iG */}
                <button
                    onClick={close}
                    aria-label="Fechar anúncio"
                    className="absolute -top-7 right-4 bg-surface border border-border border-b-0 rounded-t-md px-3 py-1 flex items-center gap-1.5 text-[10px] font-medium text-muted hover:text-foreground transition-colors"
                >
                    <X className="w-3 h-3" /> Fechar
                </button>

                <p className="text-[9px] font-semibold uppercase tracking-widest text-muted/40 text-center pt-1.5 select-none">
                    Publicidade
                </p>

                {/* ins sempre presente no DOM — AdSense preenche independente de visibilidade */}
                <div className="flex justify-center pb-2 pt-0.5">
                    <ins
                        ref={insRef}
                        className="adsbygoogle"
                        style={{ display: 'block' }}
                        data-ad-client={CLIENT}
                        data-ad-slot={slot}
                        data-ad-format="auto"
                        data-full-width-responsive="true"
                    />
                </div>
            </div>
        </div>
    )
}
