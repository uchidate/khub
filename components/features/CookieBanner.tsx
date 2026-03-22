'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, Shield, BarChart2, X } from 'lucide-react'
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

    return (
        <AnimatePresence>
            {loaded && consent === null && (
                <>
                    {/* Mobile: barra na base */}
                    <motion.div
                        key="cookie-mobile"
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="md:hidden fixed bottom-0 left-0 right-0 z-[9998] bg-background border-t border-border px-4 pt-4 pb-5 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-[#ff2d78]/15 flex items-center justify-center shrink-0">
                                <Cookie className="w-4 h-4 text-[#ff2d78]" />
                            </div>
                            <p className="text-sm font-bold text-foreground">Preferências de cookies</p>
                        </div>

                        {/* Text */}
                        <p className="text-xs text-muted leading-relaxed mb-4">
                            Usamos cookies para manter sua sessão e entender como o site é utilizado.{' '}
                            <Link href="/privacidade" className="text-[#ff2d78] hover:text-[#ff2d78] underline-offset-2 underline">
                                Saiba mais
                            </Link>
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={acceptNecessary}
                                className="flex-1 py-2.5 text-sm font-semibold text-foreground bg-surface hover:bg-[#e8e8e8] rounded-xl transition-colors border border-border"
                            >
                                Apenas essenciais
                            </button>
                            <button
                                onClick={acceptAll}
                                className="flex-1 py-2.5 text-sm font-bold text-white bg-[#ff2d78] hover:bg-[#ff2d78] rounded-xl transition-colors shadow-lg"
                            >
                                Aceitar todos
                            </button>
                        </div>
                    </motion.div>

                    {/* Desktop / Tablet: card flutuante no canto inferior direito */}
                    <motion.div
                        key="cookie-desktop"
                        initial={{ y: 24, opacity: 0, scale: 0.97 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 24, opacity: 0, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.3 }}
                        className="hidden md:block fixed bottom-6 right-6 z-[9998] w-[380px] rounded-2xl border border-border bg-background shadow-xl overflow-hidden"
                    >
                        {/* Top bar accent */}
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#ff2d78]/40 to-transparent" />

                        <div className="p-5">
                            {/* Header */}
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

                            {/* Cookie categories */}
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

                            {/* Privacy link */}
                            <p className="text-[11px] text-muted mb-4">
                                Ao continuar, você concorda com nossa{' '}
                                <Link href="/privacidade" className="text-[#ff2d78] hover:text-[#ff2d78] underline-offset-2 underline">
                                    Política de Privacidade
                                </Link>
                                .
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-2.5">
                                <button
                                    onClick={acceptNecessary}
                                    className="flex-1 py-2.5 text-xs font-semibold text-foreground bg-surface hover:bg-[#e8e8e8] rounded-xl transition-all border border-border"
                                >
                                    Apenas essenciais
                                </button>
                                <button
                                    onClick={acceptAll}
                                    className="flex-1 py-2.5 text-xs font-bold text-white bg-[#ff2d78] hover:bg-[#ff2d78] rounded-xl transition-all shadow-lg"
                                >
                                    Aceitar todos
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
