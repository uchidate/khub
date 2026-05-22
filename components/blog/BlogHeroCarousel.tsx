'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { BLOG_CATEGORY_BY_SLUG } from '@/lib/config/categories'

type Slide = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverImageUrl: string | null
  publishedAt: Date | null
  readingTimeMin: number
  viewCount: number
  featured: boolean
  tags: string[]
  category: { id: string; name: string; slug: string } | null
}

interface Props {
  slides: Slide[]
  authorName: string
  authorInitial: string
}

function isRecent(date: Date | string | null | undefined) {
  if (!date) return false
  return Date.now() - new Date(date).getTime() < 7 * 24 * 60 * 60 * 1000
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function BlogHeroCarousel({ slides, authorName, authorInitial }: Props) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const next = useCallback(() => setActive(i => (i + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setActive(i => (i - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (slides.length <= 1 || paused) return
    const t = setInterval(next, 6000)
    return () => clearInterval(t)
  }, [next, paused, slides.length])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    // só swipe horizontal (dx > 40px e horizontal dominante)
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy) {
      if (dx < 0) next()
      else prev()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  if (!slides.length) return null

  const post = slides[active]
  const cfg = post.category ? BLOG_CATEGORY_BY_SLUG[post.category.slug] : null

  return (
    <div
      className="relative h-[400px] w-full select-none overflow-hidden border border-border md:h-[520px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides — fade transition via opacity */}
      {slides.map((s, i) => {
        const sCfg = s.category ? BLOG_CATEGORY_BY_SLUG[s.category.slug] : null
        return (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === active ? 1 : 0, pointerEvents: i === active ? 'auto' : 'none' }}
          >
            {s.coverImageUrl ? (
              <Image
                src={s.coverImageUrl} alt={s.title} fill priority={i === 0}
                sizes="100vw" className="object-cover"
              />
            ) : (
              <div className="absolute inset-0"
                style={{ background: sCfg
                  ? `linear-gradient(135deg, ${sCfg.bg}, ${sCfg.color}55)`
                  : 'linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%)' }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
          </div>
        )
      })}

      {/* Conteúdo */}
      <div className="relative z-10 h-full flex flex-col justify-end px-4 sm:px-6 lg:px-12 py-8 md:py-12">
        <Link href={`/blog/${post.slug}`} className="group block max-w-3xl">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {cfg && (
              <span className="px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ backgroundColor: cfg.color, color: '#fff' }}>
                {post.category!.name}
              </span>
            )}
            {isRecent(post.publishedAt) && (
              <span className="bg-accent px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white">Novo</span>
            )}
            {post.featured && (
              <span className="bg-yellow-400/90 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-yellow-900">Destaque</span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-[2.6rem] font-black text-white leading-tight line-clamp-2 group-hover:text-accent transition-colors mb-3">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-white/60 text-sm md:text-[15px] line-clamp-2 leading-relaxed hidden sm:block mb-5">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-white/45 text-xs">
              <div className="flex h-5 w-5 items-center justify-center bg-white/15 text-[9px] font-bold text-white/80">
                {authorInitial}
              </div>
              <span>{authorName}</span>
              <span>·</span>
              {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
              {post.readingTimeMin > 0 && (
                <span className="flex items-center gap-1"><Clock size={9} />{post.readingTimeMin} min</span>
              )}
              {post.viewCount > 0 && (
                <span className="flex items-center gap-1"><Eye size={9} />{post.viewCount}</span>
              )}
            </div>
            <span className="ml-auto sm:ml-4 flex items-center gap-1.5 text-[13px] font-bold text-accent group-hover:gap-3 transition-all whitespace-nowrap">
              Ler artigo <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      </div>

      {/* Controles prev/next — só desktop */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center border border-white/15 bg-black/40 text-white/70 transition-colors hover:bg-black/60 hover:text-white sm:flex"
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center border border-white/15 bg-black/40 text-white/70 transition-colors hover:bg-black/60 hover:text-white sm:flex"
            aria-label="Próximo"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className="transition-all duration-300"
              style={{
                width: i === active ? 20 : 6,
                height: 6,
                backgroundColor: i === active ? '#fff' : 'rgba(255,255,255,0.35)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
