'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Tag, X, ChevronDown } from 'lucide-react'
import { getTagStyle } from '@/lib/utils/tag-colors'

interface TagFilterProps {
  tags: { tag: string; count: number }[]
  activeTag?: string
  activeCategory?: string
}

const INITIAL_COUNT = 12

export function TagFilter({ tags, activeTag, activeCategory }: TagFilterProps) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tags
    return tags.filter(t => t.tag.includes(q))
  }, [search, tags])

  const displayed = expanded || search ? filtered : filtered.slice(0, INITIAL_COUNT)
  const hiddenCount = filtered.length - INITIAL_COUNT

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar tag..."
          className="w-full sm:w-48 pl-7 pr-7 py-1.5 text-[11px] rounded-full bg-surface border border-border focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-muted/60"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
          >
            <X size={10} />
          </button>
        )}
      </div>

      {/* Tag pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Tag size={10} className="text-muted shrink-0" />
        {displayed.length > 0 ? displayed.map(({ tag, count }) => {
          const ts = getTagStyle(tag)
          const isActive = activeTag === tag
          const href = isActive
            ? (activeCategory ? `/blog?category=${activeCategory}` : '/blog')
            : (activeCategory
                ? `/blog?category=${activeCategory}&tag=${encodeURIComponent(tag)}`
                : `/blog?tag=${encodeURIComponent(tag)}`)
          return (
            <Link
              key={tag}
              href={href}
              scroll={false}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap"
              style={{
                color: isActive ? '#fff' : ts.color,
                backgroundColor: isActive ? ts.color : ts.bg,
                outline: isActive ? `2px solid ${ts.color}` : 'none',
                outlineOffset: '1px',
              }}
            >
              {tag}
              <span
                className="text-[9px] font-bold opacity-60"
                style={{ color: isActive ? '#fff' : ts.color }}
              >
                {count}
              </span>
            </Link>
          )
        }) : (
          <span className="text-[11px] text-muted italic">Nenhuma tag encontrada para &ldquo;{search}&rdquo;</span>
        )}

        {!search && !expanded && hiddenCount > 0 && (
          <button
            onClick={() => setExpanded(true)}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-muted hover:text-foreground bg-surface border border-border hover:border-accent/40 transition-all whitespace-nowrap"
          >
            +{hiddenCount} <ChevronDown size={10} />
          </button>
        )}

        {expanded && !search && (
          <button
            onClick={() => setExpanded(false)}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-muted hover:text-foreground bg-surface border border-border hover:border-accent/40 transition-all"
          >
            <ChevronDown size={10} className="rotate-180" /> Menos
          </button>
        )}
      </div>
    </div>
  )
}
