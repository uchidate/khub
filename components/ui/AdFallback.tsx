'use client'

import Link from 'next/link'
import { ArrowRight, Bell } from 'lucide-react'

interface AdFallbackProps {
    variant?: 'auto' | 'fluid' | 'multiplex'
    className?: string
}

/**
 * House ad exibido quando o slot AdSense retorna unfilled.
 * auto/fluid → CTA de newsletter ou artigos em destaque
 * multiplex  → grid de seções do site (replica o discovery)
 */
export function AdFallback({ variant = 'auto', className = '' }: AdFallbackProps) {
    if (variant === 'multiplex') {
        return (
            <div className={`w-full py-6 border-t border-border ${className}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-4 text-center">Explore o HallyuHub</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { href: '/artists', label: 'Artistas', emoji: '🎤' },
                        { href: '/groups', label: 'Grupos', emoji: '👥' },
                        { href: '/productions', label: 'K-Dramas', emoji: '🎬' },
                        { href: '/blog', label: 'Blog', emoji: '✍️' },
                    ].map(({ href, label, emoji }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center gap-2 p-4 bg-surface hover:bg-surface-hover border border-border rounded-xl transition-colors text-center"
                        >
                            <span className="text-2xl">{emoji}</span>
                            <span className="text-xs font-semibold text-foreground">{label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        )
    }

    // auto / fluid → newsletter CTA compacto
    return (
        <div className={`flex items-center gap-4 px-4 py-3 bg-surface border border-border rounded-xl ${className}`}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ff2d78]/10 shrink-0">
                <Bell className="w-4 h-4 text-[#ff2d78]" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-tight">Fique por dentro do K-Pop</p>
                <p className="text-xs text-muted mt-0.5">Novidades de artistas, grupos e dramas todo dia.</p>
            </div>
            <Link
                href="/blog"
                className="flex items-center gap-1 text-xs font-semibold text-[#ff2d78] shrink-0 hover:underline"
            >
                Ver blog <ArrowRight className="w-3 h-3" />
            </Link>
        </div>
    )
}
