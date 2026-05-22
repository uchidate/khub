'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Twitter, Facebook, Link2, Check } from 'lucide-react'

interface BlogStickyNavProps {
  title: string
  readingTimeMin: number
  shareUrl: string
  shareTitle: string
  categoryName?: string
  categorySlug?: string
}

export function BlogStickyNav({ title, readingTimeMin, shareUrl, shareTitle, categoryName, categorySlug }: BlogStickyNavProps) {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [minsLeft, setMinsLeft] = useState(readingTimeMin)
  const [copied, setCopied] = useState(false)
  const ticking = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const scrollY = window.scrollY
        const docH = document.documentElement.scrollHeight - window.innerHeight
        const pct = docH > 0 ? Math.min(100, (scrollY / docH) * 100) : 0
        setProgress(pct)
        setVisible(scrollY > 250)
        const remaining = Math.max(0, Math.round(readingTimeMin * (1 - pct / 100)))
        setMinsLeft(remaining)
        ticking.current = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [readingTimeMin])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* silencioso */ }
  }

  const enc = encodeURIComponent

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[330] bg-background/95 backdrop-blur-sm border-b border-border shadow-sm transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}
      style={{ willChange: 'transform' }}
    >
      {/* Barra de progresso */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-accent transition-all duration-150" style={{ width: `${progress}%` }} />

      <div className="page-wrap h-12 flex items-center gap-4">
        {/* Voltar */}
        <Link href="/blog" className="shrink-0 flex items-center gap-1.5 text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold hidden sm:block">Artigos</span>
        </Link>

        <div className="w-px h-4 bg-border shrink-0" />

        {/* Categoria */}
        {categoryName && (
          <Link href={`/blog?category=${categorySlug}`} className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent hidden sm:block">
            {categoryName}
          </Link>
        )}

        {/* Título */}
        <p className="flex-1 min-w-0 text-[13px] font-semibold text-foreground truncate">{title}</p>

        {/* Tempo restante */}
        <span className="shrink-0 flex items-center gap-1 text-[11px] text-muted">
          <Clock className="w-3 h-3" />
          {minsLeft > 0 ? `${minsLeft} min restantes` : 'Quase lá'}
        </span>

        <div className="w-px h-4 bg-border shrink-0" />

        {/* Share compacto */}
        <div className="flex items-center gap-1 shrink-0">
          <a href={`https://twitter.com/intent/tweet?text=${enc(shareTitle)}&url=${enc(shareUrl)}`} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors" aria-label="X">
            <Twitter className="w-3.5 h-3.5" />
          </a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors" aria-label="Facebook">
            <Facebook className="w-3.5 h-3.5" />
          </a>
          <button onClick={copyLink}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors" aria-label="Copiar link">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Link2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
