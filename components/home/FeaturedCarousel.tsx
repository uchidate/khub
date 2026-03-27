'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BLOG_CATEGORY_BY_SLUG } from '@/lib/config/categories'

interface CarouselPost {
    slug: string
    title: string
    coverImageUrl: string | null
    publishedAt: string | null
    excerpt?: string | null
    category: { name: string; slug: string } | null
    tags: string[]
}

interface FeaturedCarouselProps {
    posts: CarouselPost[]
}

function getCategoryStyle(slug: string | undefined): { color: string; bg: string } {
    if (!slug) return { color: '#9ca3af', bg: 'transparent' }
    const key = slug.toLowerCase().replace(/\s/g, '-')
    const cat = BLOG_CATEGORY_BY_SLUG[key]
    return cat ? { color: cat.color, bg: cat.bg } : { color: '#9ca3af', bg: '#f3f4f6' }
}

function formatDate(iso: string | null) {
    if (!iso) return ''
    try {
        return new Date(iso).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return iso
    }
}

const INTERVAL_MS = 6000
const TRANSITION_MS = 500

export function FeaturedCarousel({ posts }: FeaturedCarouselProps) {
    const [active, setActive] = useState(0)
    const [paused, setPaused] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const goTo = useCallback((idx: number) => {
        setActive(idx)
    }, [])

    const next = useCallback(() => {
        setActive(i => (i + 1) % posts.length)
    }, [posts.length])

    const prev = useCallback(() => {
        setActive(i => (i - 1 + posts.length) % posts.length)
    }, [posts.length])

    useEffect(() => {
        if (posts.length <= 1 || paused) return
        timerRef.current = setInterval(next, INTERVAL_MS)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [next, paused, posts.length])

    if (!posts.length) return null

    return (
        <div
            className="relative h-[340px] md:h-[480px] overflow-hidden bg-accent-soft"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* All slides rendered simultaneously — opacity controls visibility */}
            {posts.map((story, i) => {
                const cs = getCategoryStyle(story.category?.slug ?? story.tags?.[0])
                const isActive = i === active
                return (
                    <Link
                        key={story.slug}
                        href={`/blog/${story.slug}`}
                        className="block group absolute inset-0"
                        style={{
                            opacity: isActive ? 1 : 0,
                            transition: `opacity ${TRANSITION_MS}ms ease`,
                            pointerEvents: isActive ? 'auto' : 'none',
                            zIndex: isActive ? 1 : 0,
                        }}
                        tabIndex={isActive ? 0 : -1}
                    >
                        {story.coverImageUrl ? (
                            <Image
                                src={story.coverImageUrl}
                                alt={story.title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 62vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                priority
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-accent-soft to-accent-soft" />
                        )}
                        <div
                            className="absolute inset-0"
                            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0) 100%)' }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-10">
                            <div className="flex items-center gap-1.5 mb-3">
                                <span
                                    className="text-[8px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                                    style={{ color: cs.color, backgroundColor: `${cs.bg}dd` }}
                                >
                                    {story.category?.name ?? story.tags?.[0] ?? 'Blog'}
                                </span>
                                <span className="text-[8px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-white/20 text-white backdrop-blur-sm">
                                    Destaque
                                </span>
                            </div>
                            <h1 className="text-[1.15rem] sm:text-[1.4rem] lg:text-[1.7rem] font-extrabold tracking-[-0.03em] text-white leading-[1.15] mb-2 group-hover:text-white/90 transition-colors line-clamp-3">
                                {story.title}
                            </h1>
                            {story.excerpt && (
                                <p className="text-[12.5px] text-white/70 leading-relaxed line-clamp-2 mb-2">
                                    {story.excerpt}
                                </p>
                            )}
                            <div className="flex items-center gap-2 text-[9.5px] text-white/50 flex-wrap">
                                <span>HallyuHub Redação</span>
                                <span className="w-[3px] h-[3px] rounded-full bg-white/40" />
                                <span>{formatDate(story.publishedAt)}</span>
                            </div>
                        </div>
                    </Link>
                )
            })}

            {/* Controls — only when multiple posts */}
            {posts.length > 1 && (
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
                    {/* Prev/Next arrows */}
                    <button
                        onClick={(e) => { e.preventDefault(); prev() }}
                        className="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/70 transition-colors"
                        aria-label="Anterior"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); next() }}
                        className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/70 transition-colors"
                        aria-label="Próximo"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    {/* Dots */}
                    <div className="pointer-events-auto absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {posts.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.preventDefault(); goTo(i) }}
                                className={`rounded-full transition-all duration-300 ${i === active ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'}`}
                                aria-label={`Slide ${i + 1}`}
                            />
                        ))}
                    </div>

                    {/* Progress bar */}
                    {!paused && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                            <div
                                key={`${active}-progress`}
                                className="h-full bg-white/50"
                                style={{ animation: `carousel-progress ${INTERVAL_MS}ms linear forwards` }}
                            />
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes carousel-progress {
                    from { width: 0% }
                    to { width: 100% }
                }
            `}</style>
        </div>
    )
}
