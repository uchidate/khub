'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface SectionHeaderProps {
    title: string
    subtitle?: string
    align?: 'left' | 'center'
    className?: string
    backHref?: string
    backLabel?: string
}

export function SectionHeader({ title, subtitle, align = 'left', className = '', backHref, backLabel = 'Início' }: SectionHeaderProps) {
    return (
        <div className={`mb-6 ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
            {backHref && (
                <Link href={backHref} className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-white transition-colors mb-3 uppercase tracking-wider">
                    <ChevronLeft className="w-3 h-3" />
                    {backLabel}
                </Link>
            )}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-4xl md:text-6xl font-black mb-4 hallyu-gradient-text uppercase tracking-tighter italic"
            >
                {title}
            </motion.h1>

            {subtitle && (
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    className={`text-zinc-500 text-lg font-medium max-w-xl ${align === 'center' ? 'mx-auto' : ''}`}
                >
                    {subtitle}
                </motion.p>
            )}
        </div>
    )
}
