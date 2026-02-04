'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { FavoriteButton } from '@/components/ui/FavoriteButton'

interface MediaCardProps {
    id: string
    title: string
    subtitle?: string
    imageUrl: string | null
    type: 'artist' | 'production' | 'news'
    href: string
    badges?: string[]
    aspectRatio?: 'poster' | 'video' // poster = 2:3, video = 16:9
}

export function MediaCard({
    id,
    title,
    subtitle,
    imageUrl,
    type,
    href,
    badges = [],
    aspectRatio = 'poster'
}: MediaCardProps) {
    const isPoster = aspectRatio === 'poster'
    const aspectClass = isPoster ? 'aspect-[2/3]' : 'aspect-video'

    // 3D Tilt Logic
    const ref = useRef<HTMLDivElement>(null)
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseXSpring = useSpring(x)
    const mouseYSpring = useSpring(y)

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"])
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return

        const rect = ref.current.getBoundingClientRect()

        const width = rect.width
        const height = rect.height

        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const xPct = mouseX / width - 0.5
        const yPct = mouseY / height - 0.5

        x.set(xPct)
        y.set(yPct)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    const getFavoriteType = () => {
        switch (type) {
            case 'artist': return 'artista'
            case 'production': return 'produção'
            case 'news': return 'notícia'
            default: return 'artista'
        }
    }

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
            }}
            className="relative group cursor-pointer"
        >
            <Link href={href}>
                <div
                    style={{
                        transform: "translateZ(75px)",
                        transformStyle: "preserve-3d",
                    }}
                    className={`${aspectClass} relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5 shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-purple-500/20`}
                >
                    {/* Image Layer */}
                    <div className="absolute inset-0 z-0">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={title}
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110 brightness-[0.8] group-hover:brightness-100"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-zinc-900 text-zinc-700 italic font-black uppercase">
                                No Image
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    </div>

                    {/* Content Layer (Floating) */}
                    <div
                        style={{ transform: "translateZ(50px)" }}
                        className="absolute inset-0 flex flex-col justify-end p-6 z-20"
                    >
                        <motion.div
                            initial={{ y: 0 }}
                            whileHover={{ y: -5 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h3 className="text-xl md:text-2xl font-black text-white leading-tight mb-1 drop-shadow-md">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-sm text-purple-400 font-bold mb-3 drop-shadow-md">
                                    {subtitle}
                                </p>
                            )}

                            {/* Badges container */}
                            <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                                {badges.slice(0, 3).map((badge) => (
                                    <span key={badge} className="text-[10px] uppercase font-black px-2 py-0.5 bg-white text-black rounded-sm shadow-sm">
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </Link>

            {/* Actions Layer (Outside to avoid extreme skewing but translated Z) */}
            <div
                style={{ transform: "translateZ(100px)" }}
                className="absolute top-3 right-3 z-30"
            >
                <FavoriteButton
                    id={id}
                    itemName={title}
                    itemType={getFavoriteType()}
                    className="bg-black/40 backdrop-blur-md border border-white/10 hover:bg-purple-600 hover:border-purple-500 transition-colors"
                />
            </div>
        </motion.div>
    )
}
