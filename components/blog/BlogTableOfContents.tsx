'use client'

import { useEffect, useState, useRef } from 'react'
import { AlignLeft } from 'lucide-react'

interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

function headingText(h: HTMLHeadingElement): string {
  // pega só os text nodes, ignorando o filho <a> do anchor
  return Array.from(h.childNodes)
    .filter(n => n.nodeType === Node.TEXT_NODE)
    .map(n => n.textContent ?? '')
    .join('')
    .trim()
}

export function BlogTableOfContents() {
  const [items, setItems] = useState<TocItem[]>([])
  const [active, setActive] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    function init() {
      const headings = Array.from(
        document.querySelectorAll<HTMLHeadingElement>('article h2[id], article h3[id]')
      )
      if (headings.length < 2) return false

      setItems(
        headings.map(h => ({
          id: h.id,
          text: headingText(h),
          level: parseInt(h.tagName[1]) as 2 | 3,
        }))
      )

      observerRef.current?.disconnect()
      observerRef.current = new IntersectionObserver(
        entries => {
          const visible = entries.filter(e => e.isIntersecting)
          if (visible.length > 0) setActive(visible[0].target.id)
        },
        { rootMargin: '-80px 0px -55% 0px' }
      )
      headings.forEach(h => observerRef.current!.observe(h))
      return true
    }

    // Tenta imediatamente; se BlogBlockRenderer ainda não hidratou, tenta novamente
    if (!init()) {
      const t = setTimeout(init, 400)
      return () => { clearTimeout(t); observerRef.current?.disconnect() }
    }
    return () => observerRef.current?.disconnect()
  }, [])

  if (items.length < 2) return null

  return (
    <nav aria-label="Índice do artigo" className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
        <AlignLeft className="w-3.5 h-3.5 text-muted shrink-0" />
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">Neste artigo</p>
      </div>
      <ul className="py-2">
        {items.map((item, idx) => {
          const isActive = active === item.id
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={e => {
                  e.preventDefault()
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setActive(item.id)
                }}
                className={[
                  'group relative flex items-start gap-2 px-4 py-1.5 text-[12px] leading-snug transition-all',
                  item.level === 3 ? 'pl-8' : '',
                  isActive
                    ? 'text-accent font-semibold'
                    : 'text-muted hover:text-foreground',
                ].join(' ')}
              >
                {/* indicador lateral ativo */}
                <span className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-r transition-all duration-200 ${isActive ? 'bg-accent' : 'bg-transparent group-hover:bg-border'}`} />
                {/* número da seção */}
                {item.level === 2 && (
                  <span className={`shrink-0 text-[10px] font-mono mt-0.5 transition-colors ${isActive ? 'text-accent' : 'text-muted/50'}`}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                )}
                <span className="flex-1 min-w-0">{item.text}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
