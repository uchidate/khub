'use client'

import { motion } from 'framer-motion'

interface SectionHeaderProps {
    title: string
    subtitle?: string
    align?: 'left' | 'center'
    className?: string
}

export function SectionHeader({ title, subtitle, align = 'left', className = '' }: SectionHeaderProps) {
    return (
        <div className={`mb-12 ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
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
