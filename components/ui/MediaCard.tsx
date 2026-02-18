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
    artists?: string[] // Artistas mencionados (apenas para type="news")
    aspectRatio?: 'poster' | 'video' | 'square' // poster = 2:3, video = 16:9, square = 1:1
}

export function MediaCard({
    id,
    title,
    subtitle,
    imageUrl,
    type,
    href,
    badges = [],
    artists = [],
    aspectRatio = 'poster'
}: MediaCardProps) {
    const aspectClass = aspectRatio === 'poster' ? 'aspect-[2/3]' : aspectRatio === 'video' ? 'aspect-video' : 'aspect-square'
    const [imgError, setImgError] = useState(false)

    // Placeholder blur data URL (low-quality gradient)
    const blurDataURL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2318181b;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%2309090b;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='600' fill='url(%23g)' /%3E%3C/svg%3E"

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
                    className={`${aspectClass} relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5 shadow-xl transition-all duration-500 group-hover:shadow-[0_0_30px_-5px_var(--neon-pink)] group-hover:border-white/20`}
                >
                    {/* Image Layer */}
                    <div className="absolute inset-0 z-0">
                        {imageUrl && !imgError ? (
                            <Image
                                src={imageUrl}
                                alt={title}
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110 grayscale-[20%] group-hover:grayscale-0"
                                placeholder="blur"
                                blurDataURL={blurDataURL}
                                onError={() => setImgError(true)}
                                loading="lazy"
                                quality={85}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-black text-zinc-600">
                                <svg className="w-16 h-16 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {type === 'news' ? 'Sem Imagem' : 'No Image'}
                                </span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
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
                            <h3 className="text-xl md:text-2xl font-display font-black text-white leading-[0.9] mb-1 drop-shadow-lg uppercase italic tracking-tighter">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-sm text-neon-pink font-bold mb-3 drop-shadow-md tracking-wider uppercase">
                                    {subtitle}
                                </p>
                            )}

                            {/* Badges container */}
                            <div className="flex flex-wrap gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0">
                                {badges.slice(0, 3).map((badge) => (
                                    <span key={badge} className="text-[9px] uppercase font-black px-2 py-1 bg-white text-black rounded-sm shadow-lg tracking-widest">
                                        {badge}
                                    </span>
                                ))}
                            </div>

                            {/* Artists mentioned (news only) */}
                            {artists.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0">
                                    {artists.slice(0, 3).map((name) => (
                                        <span key={name} className="text-[9px] uppercase font-black px-2 py-1 bg-neon-pink/80 text-white rounded-sm shadow-lg tracking-widest">
                                            {name}
                                        </span>
                                    ))}
                                    {artists.length > 3 && (
                                        <span className="text-[9px] uppercase font-black px-2 py-1 bg-white/20 text-white rounded-sm shadow-lg tracking-widest">
                                            +{artists.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
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
