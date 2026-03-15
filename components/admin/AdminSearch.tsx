'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Music2, UsersRound, Film, Newspaper, X, Clock, ArrowRight } from 'lucide-react'
import type { AdminSearchResult } from '@/app/api/admin/search/route'
import Image from 'next/image'

// ─── Tipos ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AdminSearchResult['type'], { label: string; icon: React.ElementType; color: string }> = {
  artist:     { label: 'Artista',   icon: Music2,      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  group:      { label: 'Grupo',     icon: UsersRound,  color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  production: { label: 'Produção',  icon: Film,        color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  news:       { label: 'Notícia',   icon: Newspaper,   color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
}

const RECENT_KEY = 'admin-recent-items'
const MAX_RECENT = 8

function getRecentItems(): AdminSearchResult[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function addRecentItem(item: AdminSearchResult) {
  const recents = getRecentItems().filter(r => r.id !== item.id)
  const updated = [item, ...recents].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

// ─── ResultItem ───────────────────────────────────────────────────────────────

function ResultItem({
  result,
  active,
  onSelect,
}: {
  result: AdminSearchResult
  active: boolean
  onSelect: (r: AdminSearchResult) => void
}) {
  const config = TYPE_CONFIG[result.type]
  const Icon = config.icon

  return (
    <button
      type="button"
      onClick={() => onSelect(result)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        active ? 'bg-zinc-800' : 'hover:bg-zinc-800/60'
      }`}
    >
      {/* Thumbnail */}
      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 flex items-center justify-center border border-zinc-700/50">
        {result.imageUrl ? (
          <Image
            src={result.imageUrl}
            alt=""
            width={32}
            height={32}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <Icon size={14} className="text-zinc-600" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-200 truncate">{result.title}</div>
        {result.subtitle && (
          <div className="text-xs text-zinc-500 truncate">{result.subtitle}</div>
        )}
      </div>

      {/* Type badge */}
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex-shrink-0 ${config.color}`}>
        {config.label}
      </span>

      <ArrowRight size={13} className="text-zinc-700 flex-shrink-0" />
    </button>
  )
}

// ─── AdminSearch ──────────────────────────────────────────────────────────────

export function AdminSearch({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [recents, setRecents] = useState<AdminSearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Carrega recentes ao abrir
  useEffect(() => {
    if (open) {
      setRecents(getRecentItems())
      setQuery('')
      setResults([])
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Busca com debounce
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.results ?? [])
        setActiveIdx(0)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 200)
  }

  const displayItems = query.length >= 2 ? results : recents
  const showRecentsLabel = query.length < 2 && recents.length > 0

  const handleSelect = useCallback((result: AdminSearchResult) => {
    addRecentItem(result)
    onClose()
    router.push(result.href)
  }, [onClose, router])

  // Teclado: setas + enter + esc
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, displayItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && displayItems[activeIdx]) {
      handleSelect(displayItems[activeIdx])
    }
  }

  const clearRecents = () => {
    localStorage.removeItem(RECENT_KEY)
    setRecents([])
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search size={15} className="text-zinc-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleQueryChange}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-zinc-500 outline-none"
            placeholder="Buscar artistas, grupos, produções, notícias..."
          />
          {loading && (
            <div className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin flex-shrink-0" />
          )}
          {query && !loading && (
            <button
              onClick={() => { setQuery(''); setResults([]) }}
              className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          )}
          <kbd
            onClick={onClose}
            className="text-[10px] text-zinc-600 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded font-mono flex-shrink-0 cursor-pointer hover:text-zinc-400 transition-colors"
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {showRecentsLabel && (
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                <Clock size={11} />
                Recentes
              </div>
              <button
                onClick={clearRecents}
                className="text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors"
              >
                Limpar
              </button>
            </div>
          )}

          {displayItems.length > 0 ? (
            <div className="py-1">
              {displayItems.map((result, i) => (
                <ResultItem
                  key={result.id}
                  result={result}
                  active={i === activeIdx}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : query.length >= 2 && !loading ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-600">
              Nenhum resultado para <span className="text-zinc-400">&quot;{query}&quot;</span>
            </div>
          ) : query.length < 2 && recents.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-600">
              Digite para buscar em todo o admin
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-4 py-2 flex items-center gap-4 text-[10px] text-zinc-700">
          <span><kbd className="font-mono bg-zinc-800 px-1 rounded">↑↓</kbd> navegar</span>
          <span><kbd className="font-mono bg-zinc-800 px-1 rounded">↵</kbd> abrir</span>
          <span><kbd className="font-mono bg-zinc-800 px-1 rounded">Esc</kbd> fechar</span>
        </div>
      </div>
    </div>
  )
}
