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
            <div data-cookie-banner="mobile" className="md:hidden fixed left-3 right-3 bottom-[calc(70px+env(safe-area-inset-bottom,0px))] z-[260] rounded-2xl border border-border bg-white p-3 shadow-[0_12px_32px_rgba(18,15,21,0.18)] animate-[slideUp_300ms_ease-out] dark:bg-background">
                <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ff2d78]/15">
                        <Cookie className="h-4 w-4 text-[#ff2d78]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold leading-tight text-foreground">Cookies</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-muted">
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
                        className="flex-1 rounded-xl border border-border bg-surface px-2 py-2 text-[11px] font-semibold text-foreground transition-colors hover:bg-surface-hover"
                    >
                        Essenciais
                    </button>
                    <button
                        onClick={acceptAll}
                        className="flex-1 rounded-xl bg-[#ff2d78] px-2 py-2 text-[11px] font-bold text-white shadow-lg transition-colors"
                    >
                        Aceitar todos
                    </button>
                </div>
            </div>

            {/* Desktop: card flutuante no canto inferior direito */}
            <div data-cookie-banner="desktop" className="hidden md:block fixed bottom-6 right-6 z-[9998] w-[380px] rounded-2xl border border-border bg-background shadow-xl overflow-hidden animate-[fadeInUp_350ms_ease-out]">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-[#ff2d78]/40 to-transparent" />
                <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#ff2d78]/15 border border-[#ff2d78]/20 flex items-center justify-center shrink-0">
                                <Cookie className="w-4 h-4 text-[#ff2d78]" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground leading-tight">Preferências de cookies</p>
                                <p className="text-[11px] text-muted mt-0.5">HallyuHub respeita sua privacidade</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 mb-4">
                        {categories.map(({ icon: Icon, label, desc, color, bg }) => (
                            <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border">
                                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-xs font-semibold ${color}`}>{label}</p>
                                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-muted mb-4">
                        Ao continuar, você concorda com nossa{' '}
                        <Link href="/privacidade" className="text-[#ff2d78] underline-offset-2 underline">
                            Política de Privacidade
                        </Link>
                        .
                    </p>
                    <div className="flex gap-2.5">
                        <button
                            onClick={acceptNecessary}
                            className="flex-1 py-2.5 text-xs font-semibold text-foreground bg-surface hover:bg-surface-hover rounded-xl transition-all border border-border"
                        >
                            Apenas essenciais
                        </button>
                        <button
                            onClick={acceptAll}
                            className="flex-1 py-2.5 text-xs font-bold text-white bg-[#ff2d78] rounded-xl transition-all shadow-lg"
                        >
                            Aceitar todos
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
