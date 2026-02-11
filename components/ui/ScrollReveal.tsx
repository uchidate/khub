'use client'

import { useRef, ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'

interface ScrollRevealProps {
    children: ReactNode
    direction?: 'up' | 'down' | 'left' | 'right'
    delay?: number
    duration?: number
    className?: string
}

export function ScrollReveal({
    children,
    direction = 'up',
    delay = 0,
    duration = 0.5,
    className = ''
}: ScrollRevealProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-100px' })

    const getInitialPosition = () => {
        switch (direction) {
            case 'up':
                return { y: 40, x: 0 }
            case 'down':
                return { y: -40, x: 0 }
            case 'left':
                return { x: 40, y: 0 }
            case 'right':
                return { x: -40, y: 0 }
            default:
                return { y: 40, x: 0 }
        }
    }

    const initial = {
        opacity: 0,
        ...getInitialPosition()
    }

    const animate = isInView ? {
        opacity: 1,
        y: 0,
        x: 0
    } : initial

    return (
        <motion.div
            ref={ref}
            initial={initial}
            animate={animate}
            transition={{
                duration,
                delay,
                ease: 'easeOut'
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
