'use client'

import Link from 'next/link'
import { Cookie, Shield, BarChart2 } from 'lucide-react'
import { useCookieConsent } from '@/hooks/useCookieConsent'

const categories = [
    {
        icon: Shield,
        label: 'Essenciais',
        desc: 'Login, sessão e segurança. Sempre ativos.',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
    },
    {
        icon: BarChart2,
        label: 'Analíticos',
        desc: 'Google Analytics — como o site é usado.',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
    },
]

export function CookieBanner() {
    const { consent, loaded, acceptAll, acceptNecessary } = useCookieConsent()

    if (!loaded || consent !== null) return null

    return (
        <>
            {/* Mobile: card compacto acima da navegação inferior */}
            <div data-cookie-banner="mobile" className="md:hidden fixed left-2.5 right-2.5 bottom-[calc(66px+env(safe-area-inset-bottom,0px))] z-[260] border border-border bg-background p-2.5 shadow-[0_8px_24px_rgba(18,15,21,0.12)] animate-[slideUp_300ms_ease-out]">
                <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-[#ff2d78]/20 bg-[#ff2d78]/10">
                        <Cookie className="h-4 w-4 text-[#ff2d78]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] leading-tight text-foreground">Cookies</p>
                        <p className="mt-0.5 text-[10.5px] leading-snug text-muted">
                            Usamos cookies essenciais e métricas para melhorar o site.{' '}
                            <Link href="/privacidade" className="text-[#ff2d78] underline underline-offset-2">
                                Saiba mais
                            </Link>
                        </p>
                    </div>
                </div>
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={acceptNecessary}
                        className="flex-1 border border-border bg-surface px-2 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-surface-hover"
                    >
                        Essenciais
                    </button>
                    <button
                        onClick={acceptAll}
                        className="flex-1 bg-[#ff2d78] px-2 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white transition-colors"
                    >
                        Aceitar todos
                    </button>
                </div>
            </div>

            {/* Desktop: card flutuante no canto inferior direito */}
            <div data-cookie-banner="desktop" className="hidden md:block fixed bottom-5 right-5 z-[9998] w-[300px] border border-border bg-background shadow-[0_12px_32px_rgba(18,15,21,0.12)] overflow-hidden animate-[fadeInUp_350ms_ease-out]">
                <div className="h-0.5 w-full bg-[#ff2d78]" />
                <div className="p-3.5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-[#ff2d78]/10 border border-[#ff2d78]/20 flex items-center justify-center shrink-0">
                                <Cookie className="w-4 h-4 text-[#ff2d78]" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground leading-tight">Preferências de cookies</p>
                                <p className="text-[11px] text-muted mt-0.5">HallyuHub respeita sua privacidade</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {categories.map(({ icon: Icon, label, desc, color, bg }) => (
                            <div key={label} className="bg-surface border border-border p-2.5">
                                <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 ${bg} flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                                    </div>
                                    <p className={`text-xs font-semibold ${color}`}>{label}</p>
                                </div>
                                <p className="mt-1.5 line-clamp-2 text-[10px] leading-snug text-muted">{desc}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-muted mb-3 leading-snug">
                        Ao continuar, você concorda com nossa{' '}
                        <Link href="/privacidade" className="text-[#ff2d78] underline-offset-2 underline">
                            Política de Privacidade
                        </Link>
                        .
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={acceptNecessary}
                            className="flex-1 border border-border bg-surface py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-hover"
                        >
                            Apenas essenciais
                        </button>
                        <button
                            onClick={acceptAll}
                            className="flex-1 bg-[#ff2d78] py-2.5 text-xs font-bold text-white transition-colors"
                        >
                            Aceitar todos
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
