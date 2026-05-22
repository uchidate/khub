'use client'

import { useEffect, useState, useRef } from 'react'
import { Twitter, MessageCircle } from 'lucide-react'

interface BlogTextShareProps {
  shareUrl: string
}

export function BlogTextShare({ shareUrl }: BlogTextShareProps) {
  const [popup, setPopup] = useState<{ x: number; y: number; text: string } | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onMouseUp = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => {
        const sel = window.getSelection()
        const text = sel?.toString().trim() ?? ''
        if (text.length < 10 || text.length > 280) { setPopup(null); return }
        const range = sel!.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setPopup({
          x: rect.left + rect.width / 2 + window.scrollX,
          y: rect.top + window.scrollY - 44,
          text,
        })
      }, 200)
    }
    const onSelChange = () => {
      const sel = window.getSelection()
      if (!sel || sel.toString().trim().length === 0) setPopup(null)
    }
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('selectionchange', onSelChange)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('selectionchange', onSelChange)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  if (!popup) return null

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${popup.text}"`)}&url=${encodeURIComponent(shareUrl)}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`"${popup.text}" — ${shareUrl}`)}`

  return (
    <div
      className="fixed z-50 flex items-center gap-1 rounded-full bg-foreground px-2 py-1.5 shadow-xl"
      style={{ left: popup.x, top: popup.y, transform: 'translateX(-50%)' }}
    >
      <span className="text-[10px] font-semibold text-background/70 px-1">Compartilhar trecho</span>
      <a href={tweetUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold text-background hover:bg-white/20 transition-colors">
        <Twitter className="w-3 h-3" /> X
      </a>
      <a href={waUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold text-background hover:bg-white/20 transition-colors">
        <MessageCircle className="w-3 h-3" /> WA
      </a>
      {/* seta apontando para baixo */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rotate-45" />
    </div>
  )
}
