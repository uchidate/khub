'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Music2, UsersRound, Film, Newspaper, X, Clock, ArrowRight,
  LayoutDashboard, Workflow, FileText, Users, Building2, TrendingUp,
  Languages, Sparkles, Bot, Flag, MessageSquare, ChevronRight, Terminal,
} from 'lucide-react'
import type { AdminSearchResult } from '@/app/api/admin/search/route'
import Image from 'next/image'
import Link from 'next/link'

// ─── Tipos ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AdminSearchResult['type'], { label: string; icon: React.ElementType; color: string }> = {
  artist:     { label: 'Artista',   icon: Music2,      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  group:      { label: 'Grupo',     icon: UsersRound,  color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  production: { label: 'Produção',  icon: Film,        color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  news:       { label: 'Notícia',   icon: Newspaper,   color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
}

const RECENT_KEY = 'admin-recent-items'
const MAX_RECENT = 8

// ─── Quick nav (exibido quando busca está vazia) ──────────────────────────────

const QUICK_NAV: Array<{ href: string; label: string; icon: React.ElementType; shortcut?: string }> = [
  { href: '/admin',              label: 'Dashboard',       icon: LayoutDashboard, shortcut: 'g d' },
  { href: '/admin/pipeline',     label: 'Pipeline',        icon: Workflow,        shortcut: 'g p' },
  { href: '/admin/artists',      label: 'Artistas',        icon: Music2,          shortcut: 'g a' },
  { href: '/admin/groups',       label: 'Grupos',          icon: UsersRound,      shortcut: 'g g' },
  { href: '/admin/productions',  label: 'Produções',       icon: Film,            shortcut: 'g r' },
  { href: '/admin/blog',         label: 'Blog',            icon: FileText,        shortcut: 'g b' },
  { href: '/admin/news',         label: 'Notícias',        icon: Newspaper,       shortcut: 'g n' },
  { href: '/admin/users',        label: 'Usuários',        icon: Users,           shortcut: 'g u' },
  { href: '/admin/translations', label: 'Traduções',       icon: Languages },
  { href: '/admin/enrichment',   label: 'Enriquecimento',  icon: Sparkles },
  { href: '/admin/agencies',     label: 'Agências',        icon: Building2 },
  { href: '/admin/ai',           label: 'IA',              icon: Bot,             shortcut: 'g i' },
  { href: '/admin/reports',      label: 'Reportes',        icon: Flag },
  { href: '/admin/comments',     label: 'Comentários',     icon: MessageSquare },
  { href: '/admin/trending',     label: 'Trending',        icon: TrendingUp },
]

// Comandos rápidos (prefixo ">")
const COMMANDS: Array<{ label: string; icon: React.ElementType; action: (router: ReturnType<typeof useRouter>) => void }> = [
  { label: 'Ir para Dashboard', icon: LayoutDashboard, action: r => r.push('/admin') },
  { label: 'Ir para Pipeline',  icon: Workflow,        action: r => r.push('/admin/pipeline') },
  { label: 'Abrir Analytics',   icon: TrendingUp,      action: r => r.push('/admin/analytics') },
  { label: 'Ver Artistas',      icon: Music2,          action: r => r.push('/admin/artists') },
  { label: 'Ver Grupos',        icon: UsersRound,      action: r => r.push('/admin/groups') },
  { label: 'Ver Produções',     icon: Film,            action: r => r.push('/admin/productions') },
  { label: 'Abrir Enriquecimento', icon: Sparkles,     action: r => r.push('/admin/enrichment') },
]

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
        active ? 'bg-surface-hover' : 'hover:bg-surface-hover'
      }`}
    >
      {/* Thumbnail */}
      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-surface flex items-center justify-center border border-border">
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
          <Icon size={14} className="text-muted" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{result.title}</div>
        {result.subtitle && (
          <div className="text-xs text-muted truncate">{result.subtitle}</div>
        )}
      </div>

      {/* Type badge */}
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex-shrink-0 ${config.color}`}>
        {config.label}
      </span>

      <ArrowRight size={13} className="text-muted flex-shrink-0" />
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

  const isCommandMode = query.startsWith('>')
  const commandQuery = isCommandMode ? query.slice(1).trim().toLowerCase() : ''
  const filteredCommands = isCommandMode
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(commandQuery))
    : []

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
    // não busca no command mode ou query muito curta
    if (!q.startsWith('>')) {
      debounceRef.current = setTimeout(() => search(q), 200)
    }
  }

  const displayItems = !isCommandMode && query.length >= 2 ? results : recents
  const showRecentsLabel = !isCommandMode && query.length < 2 && recents.length > 0
  const showQuickNav = !isCommandMode && query.length < 2 && recents.length === 0

  const handleSelect = useCallback((result: AdminSearchResult) => {
    addRecentItem(result)
    onClose()
    router.push(result.href)
  }, [onClose, router])

  // Teclado: setas + enter + esc
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (query) { setQuery(''); setResults([]) }
      else onClose()
      return
    }
    const itemCount = isCommandMode ? filteredCommands.length : displayItems.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, itemCount - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (isCommandMode && filteredCommands[activeIdx]) {
        filteredCommands[activeIdx].action(router)
        onClose()
      } else if (!isCommandMode && displayItems[activeIdx]) {
        handleSelect(displayItems[activeIdx])
      }
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
      aria-hidden="false"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Busca do admin"
        className="w-full max-w-xl mx-4 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Input */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b border-border ${isCommandMode ? 'bg-purple-500/5' : ''}`}>
          {isCommandMode
            ? <Terminal size={15} className="text-purple-400 flex-shrink-0" />
            : <Search size={15} className="text-muted flex-shrink-0" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={handleQueryChange}
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted outline-none"
            placeholder={isCommandMode ? 'Digite um comando...' : 'Buscar artistas, grupos, produções, notícias... ou » para comandos'}
          />
          {loading && (
            <div className="w-3.5 h-3.5 border-2 border-border border-t-foreground rounded-full animate-spin flex-shrink-0" />
          )}
          {query && !loading && (
            <button
              onClick={() => { setQuery(''); setResults([]) }}
              aria-label="Limpar busca"
              className="text-muted hover:text-foreground transition-colors flex-shrink-0"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
          <kbd
            onClick={onClose}
            className="text-[10px] text-muted bg-surface border border-border px-1.5 py-0.5 rounded font-mono flex-shrink-0 cursor-pointer hover:text-foreground transition-colors"
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Command mode */}
          {isCommandMode && (
            <div className="py-1">
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-purple-400">
                <Terminal size={11} />
                Comandos
              </div>
              {filteredCommands.length > 0 ? filteredCommands.map((cmd, i) => (
                <button
                  key={cmd.label}
                  type="button"
                  onClick={() => { cmd.action(router); onClose() }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${
                    i === activeIdx ? 'bg-surface-hover' : 'hover:bg-surface-hover'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <cmd.icon size={13} className="text-purple-400" />
                  </div>
                  <span className="flex-1 text-sm text-foreground">{cmd.label}</span>
                  <ChevronRight size={13} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )) : (
                <p className="px-4 py-6 text-center text-sm text-muted">Nenhum comando encontrado</p>
              )}
            </div>
          )}

          {/* Recentes label */}
          {!isCommandMode && showRecentsLabel && (
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                <Clock size={11} />
                Recentes
              </div>
              <button
                onClick={clearRecents}
                className="text-[10px] text-muted hover:text-foreground transition-colors"
              >
                Limpar
              </button>
            </div>
          )}

          {/* Items (recentes ou resultados) */}
          {!isCommandMode && displayItems.length > 0 && (
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
          )}

          {/* Quick nav grid — estado inicial (sem recentes, sem query) */}
          {showQuickNav && (
            <div className="p-3">
              <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Navegação rápida</p>
              <div className="grid grid-cols-2 gap-1">
                {QUICK_NAV.map(nav => (
                  <Link
                    key={nav.href}
                    href={nav.href}
                    onClick={onClose}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors group"
                  >
                    <div className="w-6 h-6 rounded-md bg-surface border border-border flex items-center justify-center flex-shrink-0 group-hover:border-border-strong transition-colors">
                      <nav.icon size={12} className="text-muted group-hover:text-foreground transition-colors" />
                    </div>
                    <span className="text-sm text-foreground flex-1 leading-tight">{nav.label}</span>
                    {nav.shortcut && (
                      <kbd className="hidden lg:inline text-[9px] text-muted font-mono bg-surface border border-border px-1 py-0.5 rounded whitespace-nowrap">{nav.shortcut}</kbd>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Sem resultados */}
          {!isCommandMode && query.length >= 2 && !loading && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              Nenhum resultado para <span className="text-foreground">&quot;{query}&quot;</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center justify-between gap-4 text-[10px] text-muted">
          <div className="flex items-center gap-4">
            <span><kbd className="font-mono bg-surface px-1 rounded">↑↓</kbd> navegar</span>
            <span><kbd className="font-mono bg-surface px-1 rounded">↵</kbd> abrir</span>
            <span><kbd className="font-mono bg-surface px-1 rounded">Esc</kbd> fechar</span>
          </div>
          <button
            type="button"
            onClick={() => { setQuery('>'); setResults([]) }}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              isCommandMode
                ? 'text-purple-400 bg-purple-500/10'
                : 'text-muted hover:text-foreground hover:bg-surface-hover'
            }`}
            title="Modo comandos (>)"
          >
            <Terminal size={10} />
            <span className="font-mono">&gt;</span> comandos
          </button>
        </div>
      </div>
    </div>
  )
}
