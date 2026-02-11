'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            // Show button when page is scrolled down 400px
            setIsVisible(window.scrollY > 400)
        }

        window.addEventListener('scroll', toggleVisibility)
        return () => window.removeEventListener('scroll', toggleVisibility)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 z-50 p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full shadow-2xl shadow-purple-900/50 transition-all hover:scale-110 active:scale-95 group"
                    aria-label="Voltar ao topo"
                    title="Voltar ao topo"
                >
                    <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-1" />
                </motion.button>
            )}
        </AnimatePresence>
    )
}
