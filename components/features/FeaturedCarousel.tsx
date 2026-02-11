'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface FeaturedNews {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: string
    tags: string[]
}

interface FeaturedCarouselProps {
    news: FeaturedNews[]
}

export function FeaturedCarousel({ news }: FeaturedCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length)
    }, [news.length])

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + news.length) % news.length)
    }, [news.length])

    const goToSlide = (index: number) => {
        setCurrentIndex(index)
    }

    // Auto-play
    useEffect(() => {
        if (isPaused || news.length <= 1) return

        const interval = setInterval(() => {
            nextSlide()
        }, 5000) // 5 segundos

        return () => clearInterval(interval)
    }, [isPaused, nextSlide, news.length])

    if (news.length === 0) return null

    const currentNews = news[currentIndex]

    return (
        <div
            className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-3xl group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Slides */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="absolute inset-0"
                >
                    <Link href={`/news/${currentNews.id}`} className="block w-full h-full">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            {currentNews.imageUrl ? (
                                <Image
                                    src={currentNews.imageUrl}
                                    alt={currentNews.title}
                                    fill
                                    className="object-cover"
                                    priority={currentIndex === 0}
                                    sizes="100vw"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900" />
                            )}
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                            {/* Tags */}
                            {currentNews.tags.length > 0 && (
                                <div className="flex gap-2 mb-4">
                                    {currentNews.tags.slice(0, 3).map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 bg-purple-600/80 backdrop-blur-sm text-white text-xs font-black uppercase tracking-widest rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Title */}
                            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight max-w-4xl">
                                {currentNews.title}
                            </h2>

                            {/* Date */}
                            <div className="flex items-center gap-2 text-zinc-300">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {new Date(currentNews.publishedAt).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {news.length > 1 && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            prevSlide()
                        }}
                        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                        aria-label="Slide anterior"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            nextSlide()
                        }}
                        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                        aria-label="Próximo slide"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Indicators (Dots) */}
            {news.length > 1 && (
                <div className="absolute bottom-4 md:bottom-8 right-8 md:right-12 flex gap-2">
                    {news.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                                index === currentIndex
                                    ? 'bg-white w-8'
                                    : 'bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`Ir para slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Play/Pause Indicator */}
            {isPaused && news.length > 1 && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-bold rounded-full">
                    PAUSADO
                </div>
            )}
        </div>
    )
}
