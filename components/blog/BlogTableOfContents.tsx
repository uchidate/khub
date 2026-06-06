'use client'

import { useEffect, useState, useRef } from 'react'
import { AlignLeft, ChevronDown } from 'lucide-react'

interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

function headingText(h: HTMLHeadingElement): string {
  return Array.from(h.childNodes)
    .filter(n => n.nodeType === Node.TEXT_NODE)
    .map(n => n.textContent ?? '')
    .join('')
    .trim()
}

const STORAGE_KEY = 'khub-toc-open'

export function BlogTableOfContents() {
  const [items, setItems] = useState<TocItem[]>([])
  const [active, setActive] = useState<string>('')
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === null ? true : saved === '1'
  })
  const observerRef = useRef<IntersectionObserver | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  function toggle() {
    setOpen(v => {
      localStorage.setItem(STORAGE_KEY, v ? '0' : '1')
      const next = !v
      if (next && active) {
        // Após a animação de abertura, rola o item ativo para a vista
        setTimeout(() => {
          listRef.current?.querySelector(`[data-id="${active}"]`)?.scrollIntoView({ block: 'nearest' })
        }, 300)
      }
      return next
    })
  }

  // Auto-scroll do item ativo — rola APENAS o container overflow da sidebar,
  // nunca a página. listRef.current não tem overflow próprio; usamos scrollTop
  // diretamente no ancestral mais próximo que tenha overflow-y-auto.
  useEffect(() => {
    if (!active || !open) return
    const item = listRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`)
    if (!item) return
    // Encontra o primeiro ancestral com overflow scroll/auto (sidebar div)
    let container: HTMLElement | null = item.parentElement
    while (container && container !== document.body) {
      const { overflowY } = getComputedStyle(container)
      if (overflowY === 'auto' || overflowY === 'scroll') break
      container = container.parentElement
    }
    if (!container || container === document.body) return
    const itemTop = item.offsetTop
    const containerScrollTop = container.scrollTop
    const containerHeight = container.clientHeight
    const itemHeight = item.clientHeight
    if (itemTop < containerScrollTop || itemTop + itemHeight > containerScrollTop + containerHeight) {
      container.scrollTop = itemTop - containerHeight / 2 + itemHeight / 2
    }
  }, [active, open])

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

      // Rastreia qual heading está mais próxima do topo visível
      const visibleMap = new Map<string, number>()
      observerRef.current = new IntersectionObserver(
        entries => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              visibleMap.set(e.target.id, e.boundingClientRect.top)
            } else {
              visibleMap.delete(e.target.id)
            }
          })
          if (visibleMap.size > 0) {
            const topmost = [...visibleMap.entries()].sort((a, b) => a[1] - b[1])[0]
            setActive(topmost[0])
          } else {
            const scrollY = window.scrollY
            const passed = headings
              .filter(h => h.getBoundingClientRect().top + scrollY < scrollY + 120)
              .at(-1)
            if (passed) setActive(passed.id)
          }
        },
        // rootMargin: detecta headings que entram na faixa 80px-70% do viewport
        { rootMargin: '-80px 0px -30% 0px', threshold: 0 }
      )
      headings.forEach(h => observerRef.current!.observe(h))
      return true
    }

    if (!init()) {
      // Retry com MutationObserver em vez de timeout fixo — detecta quando o conteúdo monta
      const mo = new MutationObserver(() => { if (init()) mo.disconnect() })
      mo.observe(document.body, { childList: true, subtree: true })
      const fallback = setTimeout(() => { init(); mo.disconnect() }, 1500)
      return () => { mo.disconnect(); clearTimeout(fallback); observerRef.current?.disconnect() }
    }
    return () => observerRef.current?.disconnect()
  }, [])

  if (items.length < 2) return null

  return (
    <nav aria-label="Índice do artigo" className="rounded-xl border border-border bg-surface overflow-hidden">
      <button
        onClick={toggle}
        className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-surface-hover transition-colors"
        aria-expanded={open}
      >
        <AlignLeft className="w-3.5 h-3.5 text-muted shrink-0" />
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted flex-1 text-left">Neste artigo</p>
        {active && !open && (
          <span className="text-[10px] text-accent font-semibold truncate max-w-[120px] text-right">
            {items.find(i => i.id === active)?.text}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* lista animada */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <ul ref={listRef} className="py-2">
            {(() => {
              let h2Count = 0
              return items.map((item) => {
                const isActive = active === item.id
                if (item.level === 2) h2Count++
                const num = item.level === 2 ? h2Count : null
                return (
                  <li key={item.id} data-id={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={e => {
                        e.preventDefault()
                        const el = document.getElementById(item.id)
                        if (el) {
                          const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--site-header-h') || '92') + 48 + 16
                          const top = el.getBoundingClientRect().top + window.scrollY - offset
                          window.scrollTo({ top, behavior: 'smooth' })
                        }
                        setActive(item.id)
                      }}
                      className={[
                        'group relative flex items-start gap-2 px-4 py-1.5 text-[12px] leading-snug transition-all',
                        item.level === 3 ? 'pl-8' : '',
                        isActive ? 'text-accent font-semibold' : 'text-muted hover:text-foreground',
                      ].join(' ')}
                    >
                      <span className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-r transition-all duration-200 ${isActive ? 'bg-accent' : 'bg-transparent group-hover:bg-border'}`} />
                      {num !== null && (
                        <span className={`shrink-0 text-[10px] font-mono mt-0.5 transition-colors ${isActive ? 'text-accent' : 'text-muted/50'}`}>
                          {String(num).padStart(2, '0')}
                        </span>
                      )}
                      <span className="flex-1 min-w-0">{item.text}</span>
                    </a>
                  </li>
                )
              })
            })()}
          </ul>
        </div>
      </div>
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
