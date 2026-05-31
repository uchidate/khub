'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Link2, Check, Share2 } from 'lucide-react'
import { Facebook, Twitter } from '@/components/ui/BrandIcons'

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

  const shareArticle = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl })
        return
      } catch {
        // Usuário cancelou ou o navegador bloqueou; cai no copiar link.
      }
    }
    await copyLink()
  }

  const enc = encodeURIComponent

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[330] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-border shadow-sm transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}
      style={{ willChange: 'transform' }}
    >
      {/* Barra de progresso */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-accent transition-all duration-150" style={{ width: `${progress}%` }} />

      <div className="page-wrap flex h-14 items-center gap-2 sm:h-12 sm:gap-4">
        {/* Voltar */}
        <Link href="/blog" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground sm:h-auto sm:w-auto sm:gap-1.5 sm:rounded-none">
          <ArrowLeft className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          <span className="text-[11px] font-semibold hidden sm:block">Artigos</span>
        </Link>

        <div className="hidden h-4 w-px shrink-0 bg-border sm:block" />

        {/* Categoria */}
        {categoryName && (
          <Link href={`/blog?category=${categorySlug}`} className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent hidden sm:block">
            {categoryName}
          </Link>
        )}

        {/* Título + contexto mobile */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-black leading-tight text-foreground sm:font-semibold">{title}</p>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-muted sm:hidden">
            {categoryName && (
              <>
                <span className="truncate uppercase tracking-[0.08em] text-accent">{categoryName}</span>
                <span className="h-1 w-1 shrink-0 rounded-full bg-border" />
              </>
            )}
            <span className="flex shrink-0 items-center gap-1">
              <Clock className="h-3 w-3" />
              {minsLeft > 0 ? `${minsLeft} min` : 'Quase lá'}
            </span>
          </div>
        </div>

        {/* Tempo restante */}
        <span className="hidden shrink-0 items-center gap-1 text-[11px] text-muted sm:flex">
          <Clock className="h-3 w-3" />
          {minsLeft > 0 ? `${minsLeft} min restantes` : 'Quase lá'}
        </span>

        <div className="hidden h-4 w-px shrink-0 bg-border sm:block" />

        {/* Share compacto */}
        <div className="flex items-center gap-1 shrink-0">
          <a href={`https://twitter.com/intent/tweet?text=${enc(shareTitle)}&url=${enc(shareUrl)}`} target="_blank" rel="noopener noreferrer"
            className="hidden rounded-md p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground sm:block" aria-label="X">
            <Twitter className="w-3.5 h-3.5" />
          </a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`} target="_blank" rel="noopener noreferrer"
            className="hidden rounded-md p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground sm:block" aria-label="Facebook">
            <Facebook className="w-3.5 h-3.5" />
          </a>
          <button onClick={shareArticle}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground sm:hidden" aria-label="Compartilhar artigo">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
          </button>
          <button onClick={copyLink}
            className="hidden rounded-md p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground sm:block" aria-label="Copiar link">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Link2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
