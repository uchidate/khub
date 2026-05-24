'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { BlogBlockType } from '@/lib/types/blocks'
import { BLOG_BLOCK_TYPE_LABELS } from '@/lib/types/blocks'

const TYPE_GROUPS: { label: string; types: BlogBlockType[] }[] = [
    { label: 'Texto',     types: ['blog_heading', 'blog_paragraph', 'blog_quote', 'blog_list', 'blog_callout', 'blog_curiosity', 'blog_highlight', 'blog_divider'] },
    { label: 'Mídia',     types: ['blog_image', 'blog_gallery', 'blog_video', 'blog_twitter', 'blog_instagram', 'blog_tiktok', 'blog_spotify'] },
    { label: 'Layout',    types: ['blog_timeline', 'blog_steps', 'blog_pros_cons', 'blog_comparison', 'blog_accordion', 'blog_tabs', 'blog_ranking', 'blog_alert'] },
    { label: 'HallyuHub', types: ['blog_artist_card', 'blog_group_card', 'blog_production_card', 'blog_stats_row', 'blog_rating', 'blog_product_card', 'blog_member_grid', 'blog_setlist', 'blog_comeback_card', 'blog_trivia', 'blog_idol_facts'] },
    { label: 'Interativo', types: ['blog_vs', 'blog_poll', 'blog_quiz', 'blog_flashcard', 'blog_countdown', 'blog_before_after'] },
    { label: 'K-Pop',     types: ['blog_lyrics', 'blog_lyrics_parallel', 'blog_era_card', 'blog_chart_history', 'blog_fandom', 'blog_lightstick', 'blog_positions', 'blog_discography_grid', 'blog_achievement', 'blog_mv_breakdown'] },
]

const ALL_TYPES: BlogBlockType[] = TYPE_GROUPS.flatMap(g => g.types)

const TYPE_ICONS: Partial<Record<BlogBlockType, string>> = {
    blog_heading: 'H', blog_paragraph: '¶', blog_quote: '"', blog_list: '•',
    blog_callout: '!', blog_curiosity: '?', blog_highlight: '★', blog_divider: '—',
    blog_image: '🖼', blog_gallery: '⬜', blog_video: '▶', blog_twitter: '𝕏',
    blog_instagram: '◎', blog_tiktok: '♪', blog_spotify: '◉',
    blog_timeline: '⏱', blog_steps: '①', blog_pros_cons: '±', blog_comparison: '⇔',
    blog_accordion: '▾', blog_tabs: '⊞', blog_ranking: '🏆', blog_alert: '⚠',
    blog_artist_card: '👤', blog_group_card: '👥', blog_production_card: '🎬',
    blog_stats_row: '📊', blog_rating: '⭐', blog_product_card: '🛍',
    blog_member_grid: '⊡', blog_setlist: '♫', blog_comeback_card: '💿',
    blog_trivia: '💡', blog_idol_facts: '📋',
    blog_vs: '⚡', blog_poll: '📊', blog_quiz: '🧠', blog_flashcard: '🃏',
    blog_countdown: '⏳', blog_before_after: '↔',
    blog_lyrics: '🎵', blog_lyrics_parallel: '🎶', blog_era_card: '🗂',
    blog_chart_history: '📈', blog_fandom: '💜', blog_lightstick: '🔦',
    blog_positions: '👑', blog_discography_grid: '💽', blog_achievement: '🏅',
    blog_mv_breakdown: '🎥',
}

interface Props {
    onSelect: (type: BlogBlockType) => void
    onClose: () => void
}

export function BlockCommandPalette({ onSelect, onClose }: Props) {
    const [query, setQuery] = useState('')
    const [activeIdx, setActiveIdx] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    useEffect(() => { inputRef.current?.focus() }, [])

    const filtered = query.trim()
        ? ALL_TYPES.filter(t =>
            BLOG_BLOCK_TYPE_LABELS[t].toLowerCase().includes(query.toLowerCase()) ||
            t.replace('blog_', '').includes(query.toLowerCase())
          )
        : ALL_TYPES

    useEffect(() => { setActiveIdx(0) }, [query])

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
        if (e.key === 'Enter')     { e.preventDefault(); if (filtered[activeIdx]) onSelect(filtered[activeIdx]) }
        if (e.key === 'Escape')    { e.preventDefault(); onClose() }
    }

    // Scroll active item into view
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null
        el?.scrollIntoView({ block: 'nearest' })
    }, [activeIdx])

    // Groups for display when no query
    const groups = query.trim()
        ? [{ label: 'Resultados', types: filtered }]
        : TYPE_GROUPS

    return (
        <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                    <Search className="w-4 h-4 text-muted shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Buscar tipo de bloco…"
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted text-sm focus:outline-none"
                    />
                    <kbd className="hidden sm:flex items-center gap-1 text-[10px] text-muted border border-border rounded px-1.5 py-0.5 font-mono">ESC</kbd>
                    <button onClick={onClose} className="p-1 text-muted hover:text-foreground transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
                    {filtered.length === 0 ? (
                        <p className="text-sm text-muted text-center py-8">Nenhum bloco encontrado.</p>
                    ) : (
                        groups.map(group => {
                            const groupFiltered = query.trim() ? group.types : group.types
                            if (groupFiltered.length === 0) return null
                            return (
                                <div key={group.label}>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-muted px-4 pt-3 pb-1">{group.label}</p>
                                    {groupFiltered.map(type => {
                                        const idx = filtered.indexOf(type)
                                        return (
                                            <button
                                                key={type}
                                                data-idx={idx}
                                                onClick={() => onSelect(type)}
                                                onMouseEnter={() => setActiveIdx(idx)}
                                                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${idx === activeIdx ? 'bg-accent/10 text-accent' : 'text-foreground hover:bg-surface'}`}
                                            >
                                                <span className="w-6 text-center text-sm shrink-0 select-none">{TYPE_ICONS[type] ?? '◻'}</span>
                                                <span className="text-sm font-medium flex-1">{BLOG_BLOCK_TYPE_LABELS[type]}</span>
                                                <span className="text-[10px] text-muted font-mono">{type.replace('blog_', '')}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 text-[10px] text-muted">
                    <span><kbd className="font-mono border border-border rounded px-1">↑↓</kbd> navegar</span>
                    <span><kbd className="font-mono border border-border rounded px-1">↵</kbd> inserir</span>
                    <span><kbd className="font-mono border border-border rounded px-1">ESC</kbd> fechar</span>
                </div>
            </div>
        </div>
    )
}
