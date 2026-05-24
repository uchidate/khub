'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
    Plus, Trash2, ChevronUp, ChevronDown,
    Type, AlignLeft, Quote, Image as ImageIcon, Twitter, Instagram, Video, Music2,
    User, Film, BarChart2, Star, Minus, GalleryHorizontal, X,
    ChevronRight, Copy, Search, Loader2, Users, Zap, Clock, Headphones,
    ChevronsUpDown, GripVertical,
} from 'lucide-react'
import type { BlogBlock, BlogBlockType } from '@/lib/types/blocks'
import { BLOG_BLOCK_TYPE_LABELS } from '@/lib/types/blocks'
import { BlockCommandPalette } from './BlockCommandPalette'

// ─── Icons & colors ───────────────────────────────────────────────────────────

const ICONS: Record<BlogBlockType, React.ReactNode> = {
    blog_heading:         <Type className="w-3.5 h-3.5" />,
    blog_paragraph:       <AlignLeft className="w-3.5 h-3.5" />,
    blog_quote:           <Quote className="w-3.5 h-3.5" />,
    blog_image:           <ImageIcon className="w-3.5 h-3.5" />,
    blog_gallery:         <GalleryHorizontal className="w-3.5 h-3.5" />,
    blog_video:           <Video className="w-3.5 h-3.5" />,
    blog_twitter:         <Twitter className="w-3.5 h-3.5" />,
    blog_instagram:       <Instagram className="w-3.5 h-3.5" />,
    blog_tiktok:          <Music2 className="w-3.5 h-3.5" />,
    blog_spotify:         <Headphones className="w-3.5 h-3.5" />,
    blog_timeline:        <Clock className="w-3.5 h-3.5" />,
    blog_artist_card:     <User className="w-3.5 h-3.5" />,
    blog_production_card: <Film className="w-3.5 h-3.5" />,
    blog_group_card:      <Users className="w-3.5 h-3.5" />,
    blog_stats_row:       <BarChart2 className="w-3.5 h-3.5" />,
    blog_rating:          <Star className="w-3.5 h-3.5" />,
    blog_divider:         <Minus className="w-3.5 h-3.5" />,
    blog_callout:         <Zap className="w-3.5 h-3.5" />,
    blog_curiosity:       <Zap className="w-3.5 h-3.5" />,
    blog_highlight:       <Quote className="w-3.5 h-3.5" />,
    blog_list:            <AlignLeft className="w-3.5 h-3.5" />,
    blog_pros_cons:       <BarChart2 className="w-3.5 h-3.5" />,
    blog_steps:           <ChevronRight className="w-3.5 h-3.5" />,
    blog_product_card:    <Star className="w-3.5 h-3.5" />,
    blog_comparison:      <BarChart2 className="w-3.5 h-3.5" />,
    blog_accordion:       <ChevronRight className="w-3.5 h-3.5" />,
    blog_tabs:            <AlignLeft className="w-3.5 h-3.5" />,
    blog_ranking:         <BarChart2 className="w-3.5 h-3.5" />,
    blog_trivia:          <Zap className="w-3.5 h-3.5" />,
    blog_comeback_card:   <Star className="w-3.5 h-3.5" />,
    blog_member_grid:     <Users className="w-3.5 h-3.5" />,
    blog_setlist:         <Music2 className="w-3.5 h-3.5" />,
    blog_alert:           <Zap className="w-3.5 h-3.5" />,
    blog_vs:              <BarChart2 className="w-3.5 h-3.5" />,
    blog_poll:            <BarChart2 className="w-3.5 h-3.5" />,
    blog_lyrics:          <Music2 className="w-3.5 h-3.5" />,
    blog_lyrics_parallel: <Music2 className="w-3.5 h-3.5" />,
    blog_era_card:        <Clock className="w-3.5 h-3.5" />,
    blog_chart_history:   <BarChart2 className="w-3.5 h-3.5" />,
    blog_before_after:    <GalleryHorizontal className="w-3.5 h-3.5" />,
    blog_fandom:          <Quote className="w-3.5 h-3.5" />,
    blog_lightstick:      <Zap className="w-3.5 h-3.5" />,
    blog_positions:       <Users className="w-3.5 h-3.5" />,
    blog_quiz:            <Zap className="w-3.5 h-3.5" />,
    blog_countdown:       <Clock className="w-3.5 h-3.5" />,
    blog_discography_grid:<GalleryHorizontal className="w-3.5 h-3.5" />,
    blog_achievement:     <Star className="w-3.5 h-3.5" />,
    blog_mv_breakdown:    <Video className="w-3.5 h-3.5" />,
    blog_flashcard:       <AlignLeft className="w-3.5 h-3.5" />,
    blog_idol_facts:      <User className="w-3.5 h-3.5" />,
}

const COLORS: Record<BlogBlockType, string> = {
    blog_heading:         'bg-purple-500/20 text-purple-300 border-purple-500/30',
    blog_paragraph:       'bg-surface text-muted border-border',
    blog_quote:           'bg-amber-500/20 text-amber-300 border-amber-500/30',
    blog_image:           'bg-blue-500/20 text-blue-300 border-blue-500/30',
    blog_gallery:         'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    blog_video:           'bg-red-500/20 text-red-300 border-red-500/30',
    blog_twitter:         'bg-sky-500/20 text-sky-300 border-sky-500/30',
    blog_instagram:       'bg-pink-500/20 text-pink-300 border-pink-500/30',
    blog_tiktok:          'bg-surface text-foreground border-border',
    blog_spotify:         'bg-green-500/20 text-green-300 border-green-500/30',
    blog_timeline:        'bg-violet-500/20 text-violet-300 border-violet-500/30',
    blog_artist_card:     'bg-violet-500/20 text-violet-300 border-violet-500/30',
    blog_production_card: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    blog_group_card:      'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    blog_stats_row:       'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    blog_rating:          'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    blog_divider:         'bg-surface text-muted border-border',
    blog_callout:         'bg-rose-500/20 text-rose-300 border-rose-500/30',
    blog_curiosity:       'bg-pink-500/20 text-pink-300 border-pink-500/30',
    blog_highlight:       'bg-amber-500/20 text-amber-300 border-amber-500/30',
    blog_list:            'bg-slate-500/20 text-slate-300 border-slate-500/30',
    blog_pros_cons:       'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    blog_steps:           'bg-orange-500/20 text-orange-300 border-orange-500/30',
    blog_product_card:    'bg-orange-500/20 text-orange-300 border-orange-500/30',
    blog_comparison:      'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    blog_accordion:       'bg-violet-500/20 text-violet-300 border-violet-500/30',
    blog_tabs:            'bg-blue-500/20 text-blue-300 border-blue-500/30',
    blog_ranking:         'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    blog_trivia:          'bg-purple-500/20 text-purple-300 border-purple-500/30',
    blog_comeback_card:   'bg-pink-500/20 text-pink-300 border-pink-500/30',
    blog_member_grid:     'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    blog_setlist:         'bg-green-500/20 text-green-300 border-green-500/30',
    blog_alert:           'bg-amber-500/20 text-amber-300 border-amber-500/30',
    blog_vs:              'bg-red-500/20 text-red-300 border-red-500/30',
    blog_poll:            'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    blog_lyrics:          'bg-purple-500/20 text-purple-300 border-purple-500/30',
    blog_lyrics_parallel: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    blog_era_card:        'bg-pink-500/20 text-pink-300 border-pink-500/30',
    blog_chart_history:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    blog_before_after:    'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    blog_fandom:          'bg-rose-500/20 text-rose-300 border-rose-500/30',
    blog_lightstick:      'bg-violet-500/20 text-violet-300 border-violet-500/30',
    blog_positions:       'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    blog_quiz:            'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    blog_countdown:       'bg-orange-500/20 text-orange-300 border-orange-500/30',
    blog_discography_grid:'bg-blue-500/20 text-blue-300 border-blue-500/30',
    blog_achievement:     'bg-amber-500/20 text-amber-300 border-amber-500/30',
    blog_mv_breakdown:    'bg-red-500/20 text-red-300 border-red-500/30',
    blog_flashcard:       'bg-slate-500/20 text-slate-300 border-slate-500/30',
    blog_idol_facts:      'bg-pink-500/20 text-pink-300 border-pink-500/30',
}

// ─── Block groups for the type selector ───────────────────────────────────────

const TYPE_GROUPS: { label: string; types: BlogBlockType[] }[] = [
    { label: 'Texto',     types: ['blog_heading', 'blog_paragraph', 'blog_quote', 'blog_list', 'blog_callout', 'blog_curiosity', 'blog_highlight', 'blog_divider'] },
    { label: 'Mídia',     types: ['blog_image', 'blog_gallery', 'blog_video', 'blog_twitter', 'blog_instagram', 'blog_tiktok', 'blog_spotify'] },
    { label: 'Layout',    types: ['blog_timeline', 'blog_steps', 'blog_pros_cons', 'blog_comparison', 'blog_accordion', 'blog_tabs', 'blog_ranking', 'blog_alert'] },
    { label: 'HallyuHub', types: ['blog_artist_card', 'blog_group_card', 'blog_production_card', 'blog_stats_row', 'blog_rating', 'blog_product_card', 'blog_member_grid', 'blog_setlist', 'blog_comeback_card', 'blog_trivia', 'blog_idol_facts'] },
    { label: 'Interativo', types: ['blog_vs', 'blog_poll', 'blog_quiz', 'blog_flashcard', 'blog_countdown', 'blog_before_after'] },
    { label: 'K-Pop', types: ['blog_lyrics', 'blog_lyrics_parallel', 'blog_era_card', 'blog_chart_history', 'blog_fandom', 'blog_lightstick', 'blog_positions', 'blog_discography_grid', 'blog_achievement', 'blog_mv_breakdown'] },
]

// ─── Default block factory ────────────────────────────────────────────────────

function defaultBlock(type: BlogBlockType): BlogBlock {
    switch (type) {
        case 'blog_heading':         return { type, text: '', level: 2 }
        case 'blog_paragraph':       return { type, text: '' }
        case 'blog_quote':           return { type, text: '', author: '' }
        case 'blog_image':           return { type, url: '', caption: '', size: 'medium' }
        case 'blog_gallery':         return { type, urls: [''], caption: '' }
        case 'blog_video':           return { type, url: '', caption: '' }
        case 'blog_twitter':         return { type, url: '' }
        case 'blog_instagram':       return { type, url: '' }
        case 'blog_tiktok':          return { type, url: '' }
        case 'blog_spotify':         return { type, url: '', compact: false }
        case 'blog_timeline':        return { type, items: [{ year: '', title: '', text: '', emoji: '' }] }
        case 'blog_artist_card':     return { type, artistId: '', note: '' }
        case 'blog_production_card': return { type, productionId: '', note: '' }
        case 'blog_group_card':      return { type, groupId: '', note: '' }
        case 'blog_stats_row':       return { type, items: [{ label: '', value: '' }] }
        case 'blog_rating':          return { type, score: 8, label: '', summary: '' }
        case 'blog_divider':         return { type }
        case 'blog_callout':         return { type, variant: 'fact', title: '', text: '' }
        case 'blog_curiosity':       return { type, text: '', emoji: '💡' }
        case 'blog_highlight':       return { type, text: '', attribution: '' }
        case 'blog_list':            return { type, items: [''], ordered: false }
        case 'blog_pros_cons':       return { type, pros: [''], cons: [''], title: '' }
        case 'blog_steps':           return { type, steps: [{ title: '', text: '' }], title: '' }
        case 'blog_product_card':    return { type, name: '', imageUrl: '', price: '', affiliateUrl: '', cta: 'Comprar na Shopee' }
        case 'blog_comparison':      return { type, columns: ['Opção A', 'Opção B'], rows: [{ label: '', values: ['', ''] }], title: '' }
        case 'blog_accordion':       return { type, title: '', items: [{ question: '', answer: '' }] }
        case 'blog_tabs':            return { type, tabs: [{ label: 'Aba 1', content: '' }, { label: 'Aba 2', content: '' }] }
        case 'blog_ranking':         return { type, title: '', items: [{ position: 1, name: '', description: '' }] }
        case 'blog_trivia':          return { type, question: '', answer: '', hint: '' }
        case 'blog_comeback_card':   return { type, artist: '', title: '', date: '', type_label: '', description: '', imageUrl: '' }
        case 'blog_member_grid':     return { type, title: '', members: [{ name: '', role: '', imageUrl: '', note: '' }] }
        case 'blog_setlist':         return { type, event: '', date: '', venue: '', tracks: [{ number: 1, title: '', note: '' }] }
        case 'blog_alert':           return { type, variant: 'info', title: '', text: '' }
        case 'blog_vs':              return { type, optionA: { label: 'Opção A' }, optionB: { label: 'Opção B' }, question: '' }
        case 'blog_poll':            return { type, question: '', options: ['Opção 1', 'Opção 2'] }
        case 'blog_lyrics':          return { type, title: '', lines: [{ original: '', translation: '' }] }
        case 'blog_lyrics_parallel': return { type, title: '', lang: 'ko', sections: [{ label: 'Estrofe 1', original: '', romanized: '', translation: '' }] }
        case 'blog_era_card':        return { type, era: '', period: '', concept: '', colors: [] }
        case 'blog_chart_history':   return { type, chart: 'Billboard Hot 100', entries: [{ date: '', position: 1, label: '' }] }
        case 'blog_before_after':    return { type, before: { url: '', label: 'Antes' }, after: { url: '', label: 'Depois' } }
        case 'blog_fandom':          return { type, quotes: [{ text: '' }] }
        case 'blog_lightstick':      return { type, group: '', name: '', colors: [''] }
        case 'blog_positions':       return { type, members: [{ name: '', positions: [''], imageUrl: '' }] }
        case 'blog_quiz':            return { type, title: '', questions: [{ question: '', options: ['', ''], correct: 0 }] }
        case 'blog_countdown':       return { type, title: '', artist: '', targetDate: '' }
        case 'blog_discography_grid':return { type, artist: '', albums: [{ title: '', year: '', type: 'Album' }] }
        case 'blog_achievement':     return { type, items: [{ icon: '🏆', title: '', description: '' }] }
        case 'blog_mv_breakdown':    return { type, videoId: '', title: '', scenes: [{ time: '0:00', label: '', description: '' }] }
        case 'blog_flashcard':       return { type, title: '', cards: [{ front: '', back: '' }] }
        case 'blog_idol_facts':      return { type, name: '', facts: [{ label: '', value: '' }] }
    }
}

// ─── Entity Picker ────────────────────────────────────────────────────────────

type EntityKind = 'artist' | 'group' | 'production'
type EntityResult = { id: string; label: string; sublabel?: string; imageUrl?: string | null }

function EntityPicker({
    kind, currentId, onChange,
}: {
    kind: EntityKind
    currentId: string
    onChange: (id: string, label: string) => void
}) {
    const [searching, setSearching] = useState(!currentId)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<EntityResult[]>([])
    const [loading, setLoading] = useState(false)
    const [pickedLabel, setPickedLabel] = useState('')
    const ref = useRef<HTMLDivElement>(null)

    // Close dropdown on outside click
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setResults([])
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [])

    // Debounced search
    useEffect(() => {
        if (!query.trim()) { setResults([]); return }
        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                if (kind === 'artist') {
                    const r = await fetch(`/api/artists/list?search=${encodeURIComponent(query)}&limit=8&sortBy=name`)
                    const d = await r.json()
                    setResults((d.artists ?? []).map((a: any) => ({
                        id: a.id,
                        label: a.nameRomanized,
                        imageUrl: a.primaryImageUrl,
                    })))
                } else if (kind === 'group') {
                    const r = await fetch(`/api/groups/list`)
                    const d = await r.json()
                    const q = query.toLowerCase()
                    setResults(
                        (d.groups ?? [])
                            .filter((g: any) => g.name.toLowerCase().includes(q))
                            .slice(0, 8)
                            .map((g: any) => ({ id: g.id, label: g.name }))
                    )
                } else {
                    const r = await fetch(`/api/productions/list?search=${encodeURIComponent(query)}&limit=8&sortBy=name`)
                    const d = await r.json()
                    setResults((d.productions ?? []).map((p: any) => ({
                        id: p.id,
                        label: p.titlePt || p.titleKr || p.id,
                        sublabel: p.year ? String(p.year) : undefined,
                    })))
                }
            } finally {
                setLoading(false)
            }
        }, 280)
        return () => clearTimeout(timer)
    }, [query, kind])

    const placeholders: Record<EntityKind, string> = {
        artist: 'Buscar artista pelo nome...',
        group: 'Buscar grupo musical...',
        production: 'Buscar drama / filme...',
    }

    if (!searching && currentId) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-sm">
                <span className="flex-1 text-foreground truncate font-medium">
                    {pickedLabel || <span className="font-mono text-xs text-muted">{currentId.slice(0, 20)}…</span>}
                </span>
                <button onClick={() => setSearching(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 shrink-0 transition-colors">
                    Trocar
                </button>
            </div>
        )
    }

    return (
        <div ref={ref} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted animate-spin" />}
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={placeholders[kind]}
                    className="w-full bg-surface border border-border rounded-lg pl-8 pr-9 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-purple-500/50"
                    autoFocus
                    autoComplete="off"
                />
            </div>

            {results.length > 0 && (
                <div className="absolute z-30 mt-1 w-full bg-background border border-border rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                    {results.map(r => (
                        <button key={r.id}
                            onClick={() => {
                                onChange(r.id, r.label)
                                setPickedLabel(r.label)
                                setQuery('')
                                setResults([])
                                setSearching(false)
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-surface transition-colors text-left"
                        >
                            {r.imageUrl && (
                                <img src={r.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-foreground truncate">{r.label}</p>
                                {r.sublabel && <p className="text-xs text-muted">{r.sublabel}</p>}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Also allow pasting raw ID */}
            <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-[10px] text-muted">ou cole o ID diretamente:</span>
                <input
                    value={currentId}
                    onChange={e => onChange(e.target.value, '')}
                    placeholder="cma1b2c3d..."
                    className="flex-1 bg-transparent text-[11px] font-mono text-muted placeholder:text-muted/40 focus:outline-none border-b border-border focus:border-purple-500/40"
                />
            </div>
        </div>
    )
}

// ─── Type selector ────────────────────────────────────────────────────────────

function TypeSelector({ onSelect, onClose }: {
    onSelect: (type: BlogBlockType) => void
    onClose: () => void
}) {
    const [query, setQuery] = useState('')
    const q = query.toLowerCase()

    const filteredGroups = useMemo(() => TYPE_GROUPS.map(group => ({
        ...group,
        types: group.types.filter(type =>
            q === '' || BLOG_BLOCK_TYPE_LABELS[type].toLowerCase().includes(q)
        ),
    })).filter(g => g.types.length > 0), [q])

    const firstResult = filteredGroups[0]?.types[0]

    return (
        <div className="absolute z-20 mt-1 bg-surface border border-border rounded-xl shadow-2xl p-3 min-w-[240px] left-0">
            <div className="flex items-center gap-2 mb-2 bg-background border border-border rounded-lg px-2.5 py-1.5">
                <Search className="w-3.5 h-3.5 text-muted shrink-0" />
                <input
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && firstResult) { onSelect(firstResult); onClose() }
                        if (e.key === 'Escape') onClose()
                    }}
                    placeholder="Filtrar tipo de bloco..."
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-none"
                />
                <button onClick={onClose} className="text-muted hover:text-foreground shrink-0">
                    <X className="w-3 h-3" />
                </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
                {filteredGroups.length === 0 ? (
                    <p className="text-xs text-muted text-center py-4">Nenhum tipo encontrado</p>
                ) : filteredGroups.map(group => (
                    <div key={group.label} className="mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted px-2 mb-1">{group.label}</p>
                        {group.types.map(type => (
                            <button
                                key={type}
                                onClick={() => { onSelect(type); onClose() }}
                                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-surface-hover transition-colors text-left ${type === firstResult && query ? 'bg-surface-hover' : ''}`}
                            >
                                <span className={`flex items-center justify-center w-6 h-6 rounded border ${COLORS[type]}`}>
                                    {ICONS[type]}
                                </span>
                                {BLOG_BLOCK_TYPE_LABELS[type]}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Compact toggle ────────────────────────────────────────────────────────────

function CompactToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
                type="button"
                onClick={() => onChange(!value)}
                className={`relative w-8 h-4 rounded-full transition-colors ${value ? 'bg-purple-600' : 'bg-surface-hover border border-border'}`}
            >
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-4' : ''}`} />
            </button>
            <span className="text-xs text-muted">Compacto</span>
        </label>
    )
}

// ─── Individual field editors ─────────────────────────────────────────────────

const inputCls = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-purple-500/50 resize-none"
const labelCls = "text-[10px] font-bold uppercase tracking-widest text-muted mb-1 block"

function AutoTextarea({ value, onChange, placeholder, minRows = 3, className = '' }: {
    value: string; onChange: (v: string) => void; placeholder?: string; minRows?: number; className?: string
}) {
    const ref = useRef<HTMLTextAreaElement>(null)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.max(el.scrollHeight, minRows * 24)}px`
    }, [value, minRows])
    return (
        <textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={minRows}
            className={`${inputCls} ${className}`}
            style={{ overflow: 'hidden' }}
        />
    )
}

function BlockFieldEditor({ block, onChange }: { block: BlogBlock; onChange: (b: BlogBlock) => void }) {
    switch (block.type) {
        case 'blog_heading':
            return (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        {([1, 2, 3] as const).map(l => (
                            <button key={l} onClick={() => onChange({ ...block, level: l })}
                                className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${block.level === l ? 'bg-purple-600/30 border-purple-500/40 text-purple-300' : 'border-border text-muted hover:text-foreground'}`}>
                                H{l}
                            </button>
                        ))}
                    </div>
                    <input value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
                        placeholder="Título do bloco..." className={inputCls} />
                </div>
            )

        case 'blog_paragraph':
            return <AutoTextarea value={block.text} onChange={v => onChange({ ...block, text: v })}
                placeholder="Escreva o parágrafo... (**negrito**, [link](url))" minRows={4} />

        case 'blog_quote':
            return (
                <div className="space-y-2">
                    <AutoTextarea value={block.text} onChange={v => onChange({ ...block, text: v })}
                        placeholder="Texto da citação..." minRows={3} />
                    <input value={block.author || ''} onChange={e => onChange({ ...block, author: e.target.value })}
                        placeholder="Autor (opcional)..." className={inputCls} />
                </div>
            )

        case 'blog_image': {
            const size = block.size ?? 'medium'
            return (
                <div className="space-y-2">
                    <input value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
                        placeholder="URL da imagem..." className={inputCls} />
                    {block.url && (
                        <div className="relative h-36 rounded-lg border border-border overflow-hidden bg-surface">
                            <img src={block.url} alt="preview" className="w-full h-full object-cover"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                        </div>
                    )}
                    <input value={block.caption || ''} onChange={e => onChange({ ...block, caption: e.target.value })}
                        placeholder="Legenda (opcional)..." className={inputCls} />
                    <div className="flex items-center gap-3">
                        <label className={labelCls + ' mb-0'}>Tamanho</label>
                        <div className="flex gap-1">
                            {(['small', 'medium', 'full'] as const).map(s => (
                                <button key={s} onClick={() => onChange({ ...block, size: s })}
                                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${size === s ? 'bg-blue-600/30 border-blue-500/40 text-blue-300' : 'border-border text-muted hover:text-foreground'}`}>
                                    {s === 'small' ? 'Pequena' : s === 'medium' ? 'Média' : 'Cheia'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )
        }

        case 'blog_gallery':
            return (
                <div className="space-y-2">
                    {block.urls.map((url, i) => (
                        <div key={i} className="flex gap-2 items-start">
                            {url && (
                                <div className="w-16 h-12 rounded-lg border border-border overflow-hidden shrink-0 bg-surface">
                                    <img src={url} alt="" className="w-full h-full object-cover"
                                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                                </div>
                            )}
                            <input value={url} onChange={e => {
                                const urls = [...block.urls]; urls[i] = e.target.value
                                onChange({ ...block, urls })
                            }} placeholder={`URL da imagem ${i + 1}...`} className={`${inputCls} flex-1`} />
                            <button onClick={() => onChange({ ...block, urls: block.urls.filter((_, j) => j !== i) })}
                                className="text-muted hover:text-red-400 shrink-0 pt-2">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, urls: [...block.urls, ''] })}
                        className="text-xs text-muted hover:text-purple-400 transition-colors flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar imagem
                    </button>
                    <input value={block.caption || ''} onChange={e => onChange({ ...block, caption: e.target.value })}
                        placeholder="Legenda da galeria (opcional)..." className={inputCls} />
                </div>
            )

        case 'blog_video':
        case 'blog_twitter':
        case 'blog_instagram':
        case 'blog_tiktok':
            return (
                <div className="space-y-2">
                    <input value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
                        placeholder={
                            block.type === 'blog_video' ? 'URL do YouTube (incluindo /shorts/...)' :
                            block.type === 'blog_twitter' ? 'URL do tweet (x.com ou twitter.com)' :
                            block.type === 'blog_instagram' ? 'URL do post do Instagram...' :
                            'URL do vídeo no TikTok...'
                        }
                        className={inputCls} />
                    {'caption' in block && (
                        <input value={(block as { caption?: string }).caption || ''}
                            onChange={e => onChange({ ...block, caption: e.target.value } as BlogBlock)}
                            placeholder="Legenda (opcional)..." className={inputCls} />
                    )}
                </div>
            )

        case 'blog_spotify':
            return (
                <div className="space-y-2">
                    <input value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
                        placeholder="URL do Spotify (track, álbum, playlist, artista)..."
                        className={inputCls} />
                    {block.url && !block.url.includes('open.spotify.com') && (
                        <p className="text-[11px] text-orange-400">Use o link de compartilhamento do Spotify (open.spotify.com/...)</p>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button
                            type="button"
                            onClick={() => onChange({ ...block, compact: !block.compact })}
                            className={`relative w-8 h-4 rounded-full transition-colors ${block.compact ? 'bg-green-600' : 'bg-surface-hover border border-border'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${block.compact ? 'translate-x-4' : ''}`} />
                        </button>
                        <span className="text-xs text-muted">Player compacto (uma música)</span>
                    </label>
                </div>
            )

        case 'blog_artist_card':
            return (
                <div className="space-y-2">
                    <div>
                        <label className={labelCls}>Artista</label>
                        <EntityPicker kind="artist" currentId={block.artistId}
                            onChange={(id) => onChange({ ...block, artistId: id })} />
                    </div>
                    <input value={block.note || ''} onChange={e => onChange({ ...block, note: e.target.value })}
                        placeholder="Nota editorial (opcional)..." className={inputCls} />
                    <CompactToggle value={block.compact ?? false}
                        onChange={v => onChange({ ...block, compact: v })} />
                </div>
            )

        case 'blog_group_card':
            return (
                <div className="space-y-2">
                    <div>
                        <label className={labelCls}>Grupo</label>
                        <EntityPicker kind="group" currentId={block.groupId}
                            onChange={(id) => onChange({ ...block, groupId: id })} />
                    </div>
                    <input value={block.note || ''} onChange={e => onChange({ ...block, note: e.target.value })}
                        placeholder="Nota editorial (opcional)..." className={inputCls} />
                    <CompactToggle value={block.compact ?? false}
                        onChange={v => onChange({ ...block, compact: v })} />
                </div>
            )

        case 'blog_production_card':
            return (
                <div className="space-y-2">
                    <div>
                        <label className={labelCls}>Produção</label>
                        <EntityPicker kind="production" currentId={block.productionId}
                            onChange={(id) => onChange({ ...block, productionId: id })} />
                    </div>
                    <input value={block.note || ''} onChange={e => onChange({ ...block, note: e.target.value })}
                        placeholder="Nota editorial (opcional)..." className={inputCls} />
                    <CompactToggle value={block.compact ?? false}
                        onChange={v => onChange({ ...block, compact: v })} />
                </div>
            )

        case 'blog_stats_row':
            return (
                <div className="space-y-2">
                    {block.items.map((item, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <input value={(item as { emoji?: string }).emoji || ''} onChange={e => {
                                const items = [...block.items]
                                items[i] = { ...item, emoji: e.target.value } as typeof item
                                onChange({ ...block, items })
                            }} placeholder="🌟" className={`${inputCls} w-14 text-center`} />
                            <input value={item.label} onChange={e => {
                                const items = [...block.items]
                                items[i] = { ...item, label: e.target.value }
                                onChange({ ...block, items })
                            }} placeholder="Rótulo..." className={`${inputCls} w-1/3`} />
                            <input value={item.value} onChange={e => {
                                const items = [...block.items]
                                items[i] = { ...item, value: e.target.value }
                                onChange({ ...block, items })
                            }} placeholder="Valor..." className={inputCls} />
                            <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                                className="text-muted hover:text-red-400 shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, items: [...block.items, { label: '', value: '' }] })}
                        className="text-xs text-muted hover:text-purple-400 transition-colors flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar linha
                    </button>
                </div>
            )

        case 'blog_rating':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <label className={labelCls + ' mb-0'}>Nota (0–10)</label>
                        <input type="number" min={0} max={10} step={0.5}
                            value={block.score}
                            onChange={e => onChange({ ...block, score: parseFloat(e.target.value) || 0 })}
                            className="w-20 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-yellow-500/50" />
                        <input value={block.label || ''} onChange={e => onChange({ ...block, label: e.target.value })}
                            placeholder="Rótulo (ex: Drama, Álbum)..." className={inputCls} />
                    </div>
                    <AutoTextarea value={block.summary || ''} onChange={v => onChange({ ...block, summary: v })}
                        placeholder="Resumo da avaliação..." minRows={2} />
                </div>
            )

        case 'blog_divider':
            return <div className="h-px bg-border my-1 rounded" />

        case 'blog_callout':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <label className={labelCls + ' mb-0'}>Tipo</label>
                        <div className="flex gap-1">
                            {([
                                { v: 'fact',    label: 'Fato',  cls: 'bg-pink-600/30 border-pink-500/40 text-pink-300' },
                                { v: 'stat',    label: 'Dado',  cls: 'bg-amber-600/30 border-amber-500/40 text-amber-300' },
                                { v: 'info',    label: 'Info',  cls: 'bg-blue-600/30 border-blue-500/40 text-blue-300' },
                                { v: 'warning', label: 'Aviso', cls: 'bg-orange-600/30 border-orange-500/40 text-orange-300' },
                            ] as const).map(({ v, label, cls }) => (
                                <button key={v} onClick={() => onChange({ ...block, variant: v })}
                                    className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${block.variant === v ? cls : 'border-border text-muted hover:text-foreground'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Título (opcional)..." className={inputCls} />
                    <AutoTextarea value={block.text} onChange={v => onChange({ ...block, text: v })}
                        placeholder="Texto do destaque... (**negrito** suportado)" minRows={2} />
                </div>
            )
        case 'blog_curiosity':
            return (
                <div className="space-y-2">
                    <input value={block.emoji || ''} onChange={e => onChange({ ...block, emoji: e.target.value })}
                        placeholder="Emoji (ex: 🎤)" className={inputCls} />
                    <AutoTextarea value={block.text} onChange={v => onChange({ ...block, text: v })}
                        placeholder="Curiosidade... (**negrito** e [links](/url) suportados)" minRows={3} />
                </div>
            )
        case 'blog_highlight':
            return (
                <div className="space-y-2">
                    <AutoTextarea value={block.text} onChange={v => onChange({ ...block, text: v })}
                        placeholder="Texto em destaque visual grande..." minRows={2} />
                    <input value={block.attribution || ''} onChange={e => onChange({ ...block, attribution: e.target.value })}
                        placeholder="Atribuição (opcional)..." className={inputCls} />
                </div>
            )

        case 'blog_timeline':
            return (
                <div className="space-y-3">
                    {block.items.map((item, i) => (
                        <div key={i} className="space-y-1.5 p-3 rounded-lg bg-background border border-border">
                            <div className="flex gap-2 items-center">
                                <input value={item.emoji || ''} onChange={e => {
                                    const items = [...block.items]; items[i] = { ...item, emoji: e.target.value }
                                    onChange({ ...block, items })
                                }} placeholder="⭐" className={`${inputCls} w-14 text-center`} />
                                <input value={item.year} onChange={e => {
                                    const items = [...block.items]; items[i] = { ...item, year: e.target.value }
                                    onChange({ ...block, items })
                                }} placeholder="2020" className={`${inputCls} w-24`} />
                                <input value={item.title} onChange={e => {
                                    const items = [...block.items]; items[i] = { ...item, title: e.target.value }
                                    onChange({ ...block, items })
                                }} placeholder="Marco da carreira..." className={`${inputCls} flex-1`} />
                                <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                                    className="text-muted hover:text-red-400 shrink-0">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <textarea value={item.text || ''} onChange={e => {
                                const items = [...block.items]; items[i] = { ...item, text: e.target.value }
                                onChange({ ...block, items })
                            }} rows={2} placeholder="Detalhes opcionais..." className={inputCls} />
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, items: [...block.items, { year: '', title: '', text: '', emoji: '' }] })}
                        className="text-xs text-muted hover:text-purple-400 transition-colors flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar marco
                    </button>
                </div>
            )

        case 'blog_vs':
            return (
                <div className="space-y-2">
                    <input value={block.question || ''} onChange={e => onChange({ ...block, question: e.target.value })}
                        placeholder="Pergunta (ex: Quem é melhor?)" className={inputCls} />
                    <div className="grid grid-cols-2 gap-2">
                        <input value={block.optionA.label} onChange={e => onChange({ ...block, optionA: { ...block.optionA, label: e.target.value } })}
                            placeholder="Opção A" className={inputCls} />
                        <input value={block.optionB.label} onChange={e => onChange({ ...block, optionB: { ...block.optionB, label: e.target.value } })}
                            placeholder="Opção B" className={inputCls} />
                    </div>
                </div>
            )

        case 'blog_poll':
            return (
                <div className="space-y-2">
                    <input value={block.question} onChange={e => onChange({ ...block, question: e.target.value })}
                        placeholder="Pergunta da enquete..." className={inputCls} />
                    {block.options.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                            <input value={opt} onChange={e => {
                                const options = [...block.options]; options[i] = e.target.value
                                onChange({ ...block, options })
                            }} placeholder={`Opção ${i + 1}`} className={`${inputCls} flex-1`} />
                            <button onClick={() => onChange({ ...block, options: block.options.filter((_, j) => j !== i) })}
                                className="text-muted hover:text-red-400"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, options: [...block.options, ''] })}
                        className="text-xs text-muted hover:text-purple-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar opção
                    </button>
                </div>
            )

        case 'blog_lyrics':
            return (
                <div className="space-y-2">
                    <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Título da música..." className={inputCls} />
                    <input value={block.source || ''} onChange={e => onChange({ ...block, source: e.target.value })}
                        placeholder="Fonte (artista, álbum)..." className={inputCls} />
                    <textarea value={block.lines.map(l => l.original).join('\n')}
                        onChange={e => onChange({ ...block, lines: e.target.value.split('\n').map(original => ({ original, translation: '' })) })}
                        rows={4} placeholder="Letras originais (coreano), uma por linha..." className={inputCls} />
                    <textarea value={block.lines.map(l => l.translation).join('\n')}
                        onChange={e => {
                            const translations = e.target.value.split('\n')
                            onChange({ ...block, lines: block.lines.map((l, i) => ({ ...l, translation: translations[i] ?? '' })) })
                        }}
                        rows={4} placeholder="Traduções (uma por linha)..." className={inputCls} />
                </div>
            )

        case 'blog_era_card':
            return (
                <div className="space-y-2">
                    <input value={block.era} onChange={e => onChange({ ...block, era: e.target.value })}
                        placeholder="Nome da era (ex: DRAMA era)" className={inputCls} />
                    <input value={block.period} onChange={e => onChange({ ...block, period: e.target.value })}
                        placeholder="Período (ex: 2023–2024)" className={inputCls} />
                    <input value={block.concept || ''} onChange={e => onChange({ ...block, concept: e.target.value })}
                        placeholder="Conceito da era..." className={inputCls} />
                    <input value={(block.colors ?? []).join(', ')} onChange={e => onChange({ ...block, colors: e.target.value.split(',').map(c => c.trim()) })}
                        placeholder="Cores hex separadas por vírgula (ex: #FF6B9D, #9C27B0)" className={inputCls} />
                    <input value={block.imageUrl || ''} onChange={e => onChange({ ...block, imageUrl: e.target.value })}
                        placeholder="URL da imagem representativa (opcional)" className={inputCls} />
                </div>
            )

        case 'blog_chart_history':
            return (
                <div className="space-y-2">
                    <input value={block.chart} onChange={e => onChange({ ...block, chart: e.target.value })}
                        placeholder="Nome do chart (ex: Billboard Hot 100)" className={inputCls} />
                    {block.entries.map((entry, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <input value={entry.date} onChange={e => {
                                const entries = [...block.entries]; entries[i] = { ...entry, date: e.target.value }
                                onChange({ ...block, entries })
                            }} placeholder="Data" className={`${inputCls} w-28`} />
                            <input type="number" value={entry.position} onChange={e => {
                                const entries = [...block.entries]; entries[i] = { ...entry, position: parseInt(e.target.value) || 1 }
                                onChange({ ...block, entries })
                            }} placeholder="#" className={`${inputCls} w-16`} />
                            <input value={entry.label || ''} onChange={e => {
                                const entries = [...block.entries]; entries[i] = { ...entry, label: e.target.value }
                                onChange({ ...block, entries })
                            }} placeholder="Rótulo (música/nota)..." className={`${inputCls} flex-1`} />
                            <button onClick={() => onChange({ ...block, entries: block.entries.filter((_, j) => j !== i) })}
                                className="text-muted hover:text-red-400"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, entries: [...block.entries, { date: '', position: 1, label: '' }] })}
                        className="text-xs text-muted hover:text-purple-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar entrada
                    </button>
                </div>
            )

        case 'blog_before_after':
            return (
                <div className="grid grid-cols-2 gap-3">
                    {(['before', 'after'] as const).map(side => (
                        <div key={side} className="space-y-2">
                            <label className={labelCls}>{side === 'before' ? 'Antes' : 'Depois'}</label>
                            <input value={block[side].url} onChange={e => onChange({ ...block, [side]: { ...block[side], url: e.target.value } })}
                                placeholder="URL da imagem..." className={inputCls} />
                            <input value={block[side].label} onChange={e => onChange({ ...block, [side]: { ...block[side], label: e.target.value } })}
                                placeholder="Rótulo..." className={inputCls} />
                        </div>
                    ))}
                </div>
            )

        case 'blog_fandom':
            return (
                <div className="space-y-2">
                    <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Nome do fandom (ex: MYs)" className={inputCls} />
                    {block.quotes.map((q, i) => (
                        <div key={i} className="flex gap-2 items-start">
                            <textarea value={q.text} onChange={e => {
                                const quotes = [...block.quotes]; quotes[i] = { ...q, text: e.target.value }
                                onChange({ ...block, quotes })
                            }} rows={2} placeholder={`Citação ${i + 1}`} className={`${inputCls} flex-1`} />
                            <button onClick={() => onChange({ ...block, quotes: block.quotes.filter((_, j) => j !== i) })}
                                className="text-muted hover:text-red-400 pt-2"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, quotes: [...block.quotes, { text: '' }] })}
                        className="text-xs text-muted hover:text-purple-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar citação
                    </button>
                </div>
            )

        case 'blog_lightstick':
            return (
                <div className="space-y-2">
                    <input value={block.group} onChange={e => onChange({ ...block, group: e.target.value })}
                        placeholder="Grupo (ex: aespa)" className={inputCls} />
                    <input value={block.name} onChange={e => onChange({ ...block, name: e.target.value })}
                        placeholder="Nome do lightstick (ex: MY Stick)" className={inputCls} />
                    <input value={block.colors.join(', ')} onChange={e => onChange({ ...block, colors: e.target.value.split(',').map(c => c.trim()) })}
                        placeholder="Cores separadas por vírgula (ex: #FF6B9D, #9C27B0)" className={inputCls} />
                    <input value={block.imageUrl || ''} onChange={e => onChange({ ...block, imageUrl: e.target.value })}
                        placeholder="URL da imagem (opcional)" className={inputCls} />
                </div>
            )

        case 'blog_positions':
            return (
                <div className="space-y-2">
                    {block.members.map((member, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <input value={member.name} onChange={e => {
                                const members = [...block.members]; members[i] = { ...member, name: e.target.value }
                                onChange({ ...block, members })
                            }} placeholder="Nome" className={`${inputCls} flex-1`} />
                            <input value={member.positions.join(', ')} onChange={e => {
                                const members = [...block.members]; members[i] = { ...member, positions: e.target.value.split(',').map(p => p.trim()) }
                                onChange({ ...block, members })
                            }} placeholder="Posições (vírgula)" className={`${inputCls} flex-1`} />
                            <button onClick={() => onChange({ ...block, members: block.members.filter((_, j) => j !== i) })}
                                className="text-muted hover:text-red-400"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, members: [...block.members, { name: '', positions: [''], imageUrl: '' }] })}
                        className="text-xs text-muted hover:text-purple-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar membro
                    </button>
                </div>
            )

        case 'blog_quiz':
            return (
                <div className="space-y-3">
                    <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Título do quiz..." className={inputCls} />
                    {block.questions.map((q, i) => (
                        <div key={i} className="p-3 rounded-lg bg-background border border-border space-y-2">
                            <div className="flex gap-2">
                                <input value={q.question} onChange={e => {
                                    const questions = [...block.questions]; questions[i] = { ...q, question: e.target.value }
                                    onChange({ ...block, questions })
                                }} placeholder={`Pergunta ${i + 1}`} className={`${inputCls} flex-1`} />
                                <button onClick={() => onChange({ ...block, questions: block.questions.filter((_, j) => j !== i) })}
                                    className="text-muted hover:text-red-400"><X className="w-4 h-4" /></button>
                            </div>
                            {q.options.map((opt, oi) => (
                                <div key={oi} className="flex gap-2 items-center">
                                    <button onClick={() => {
                                        const questions = [...block.questions]; questions[i] = { ...q, correct: oi }
                                        onChange({ ...block, questions })
                                    }} className={`w-5 h-5 rounded-full border-2 shrink-0 ${q.correct === oi ? 'border-green-500 bg-green-500' : 'border-border'}`} />
                                    <input value={opt} onChange={e => {
                                        const questions = [...block.questions]
                                        const options = [...q.options]; options[oi] = e.target.value
                                        questions[i] = { ...q, options }
                                        onChange({ ...block, questions })
                                    }} placeholder={`Opção ${oi + 1}`} className={`${inputCls} flex-1`} />
                                </div>
                            ))}
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, questions: [...block.questions, { question: '', options: ['', ''], correct: 0 }] })}
                        className="text-xs text-muted hover:text-purple-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar pergunta
                    </button>
                </div>
            )

        case 'blog_countdown':
            return (
                <div className="space-y-2">
                    <input value={block.title} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Título (ex: Comeback de)" className={inputCls} />
                    <input value={block.artist} onChange={e => onChange({ ...block, artist: e.target.value })}
                        placeholder="Nome do artista/grupo..." className={inputCls} />
                    <input type="datetime-local" value={block.targetDate} onChange={e => onChange({ ...block, targetDate: e.target.value })}
                        className={inputCls} />
                </div>
            )

        case 'blog_discography_grid':
            return (
                <div className="space-y-2">
                    <input value={block.artist} onChange={e => onChange({ ...block, artist: e.target.value })}
                        placeholder="Nome do artista/grupo..." className={inputCls} />
                    {block.albums.map((album, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <input value={album.imageUrl || ''} onChange={e => {
                                const albums = [...block.albums]; albums[i] = { ...album, imageUrl: e.target.value }
                                onChange({ ...block, albums })
                            }} placeholder="URL da capa" className={`${inputCls} w-32`} />
                            <input value={album.title} onChange={e => {
                                const albums = [...block.albums]; albums[i] = { ...album, title: e.target.value }
                                onChange({ ...block, albums })
                            }} placeholder="Título" className={`${inputCls} flex-1`} />
                            <input value={album.year || ''} onChange={e => {
                                const albums = [...block.albums]; albums[i] = { ...album, year: e.target.value }
                                onChange({ ...block, albums })
                            }} placeholder="Ano" className={`${inputCls} w-20`} />
                            <button onClick={() => onChange({ ...block, albums: block.albums.filter((_, j) => j !== i) })}
                                className="text-muted hover:text-red-400"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, albums: [...block.albums, { title: '', year: '', imageUrl: '', type: 'Album' }] })}
                        className="text-xs text-muted hover:text-purple-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar álbum
                    </button>
                </div>
            )

        case 'blog_achievement':
            return (
                <div className="space-y-2">
                    {block.items.map((item, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <input value={item.icon} onChange={e => {
                                const items = [...block.items]; items[i] = { ...item, icon: e.target.value }
                                onChange({ ...block, items })
                            }} className={`${inputCls} w-14 text-center`} />
                            <input value={item.title} onChange={e => {
                                const items = [...block.items]; items[i] = { ...item, title: e.target.value }
                                onChange({ ...block, items })
                            }} placeholder="Conquista..." className={`${inputCls} flex-1`} />
                            <input value={item.description} onChange={e => {
                                const items = [...block.items]; items[i] = { ...item, description: e.target.value }
                                onChange({ ...block, items })
                            }} placeholder="Descrição/detalhe" className={`${inputCls} w-40`} />
                            <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                                className="text-muted hover:text-red-400"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, items: [...block.items, { icon: '🏆', title: '', description: '' }] })}
                        className="text-xs text-muted hover:text-purple-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar conquista
                    </button>
                </div>
            )

        case 'blog_mv_breakdown':
            return (
                <div className="space-y-2">
                    <input value={block.videoId} onChange={e => onChange({ ...block, videoId: e.target.value })}
                        placeholder="YouTube video ID (ex: dQw4w9WgXcQ)" className={inputCls} />
                    <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Título do MV..." className={inputCls} />
                    {block.scenes.map((scene, i) => (
                        <div key={i} className="flex gap-2 items-start">
                            <input value={scene.time} onChange={e => {
                                const scenes = [...block.scenes]; scenes[i] = { ...scene, time: e.target.value }
                                onChange({ ...block, scenes })
                            }} placeholder="0:00" className={`${inputCls} w-16`} />
                            <input value={scene.label} onChange={e => {
                                const scenes = [...block.scenes]; scenes[i] = { ...scene, label: e.target.value }
                                onChange({ ...block, scenes })
                            }} placeholder="Título da cena..." className={`${inputCls} flex-1`} />
                            <button onClick={() => onChange({ ...block, scenes: block.scenes.filter((_, j) => j !== i) })}
                                className="text-muted hover:text-red-400"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, scenes: [...block.scenes, { time: '0:00', label: '', description: '' }] })}
                        className="text-xs text-muted hover:text-purple-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar cena
                    </button>
                </div>
            )

        case 'blog_flashcard':
            return (
                <div className="space-y-2">
                    <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Título do deck..." className={inputCls} />
                    {block.cards.map((card, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2 p-2 rounded-lg border border-border">
                            <textarea value={card.front} onChange={e => {
                                const cards = [...block.cards]; cards[i] = { ...card, front: e.target.value }
                                onChange({ ...block, cards })
                            }} rows={2} placeholder="Frente" className={inputCls} />
                            <textarea value={card.back} onChange={e => {
                                const cards = [...block.cards]; cards[i] = { ...card, back: e.target.value }
                                onChange({ ...block, cards })
                            }} rows={2} placeholder="Verso" className={inputCls} />
                            <button onClick={() => onChange({ ...block, cards: block.cards.filter((_, j) => j !== i) })}
                                className="col-span-2 text-xs text-muted hover:text-red-400 text-right">
                                remover card
                            </button>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, cards: [...block.cards, { front: '', back: '' }] })}
                        className="text-xs text-muted hover:text-purple-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar card
                    </button>
                </div>
            )
    }
}

// ─── Block preview (collapsed state) ─────────────────────────────────────────

function blockPreview(block: BlogBlock): string {
    switch (block.type) {
        case 'blog_heading':         return block.text || '(sem texto)'
        case 'blog_paragraph':       return block.text ? block.text.slice(0, 80) + (block.text.length > 80 ? '…' : '') : '(vazio)'
        case 'blog_quote':           return block.text ? `"${block.text.slice(0, 60)}"` : '(vazio)'
        case 'blog_image':           return block.caption || block.url.split('/').pop() || block.url.slice(0, 50) || '(sem URL)'
        case 'blog_gallery':         return `${block.urls.length} imagem(ns)`
        case 'blog_video':           return block.url || '(sem URL)'
        case 'blog_twitter':         return block.url || '(sem URL)'
        case 'blog_instagram':       return block.url || '(sem URL)'
        case 'blog_tiktok':          return block.url || '(sem URL)'
        case 'blog_spotify':         return block.url || '(sem URL)'
        case 'blog_timeline':        return `${block.items.length} marco(s)${block.items[0]?.year ? ` — de ${block.items[0].year}` : ''}`
        case 'blog_artist_card':     return block.artistId ? block.artistId.slice(0, 24) + '…' : '(sem artista)'
        case 'blog_group_card':      return block.groupId ? block.groupId.slice(0, 24) + '…' : '(sem grupo)'
        case 'blog_production_card': return block.productionId ? block.productionId.slice(0, 24) + '…' : '(sem produção)'
        case 'blog_stats_row':       return `${block.items.length} campo(s)`
        case 'blog_rating':          return `Nota: ${block.score}/10${block.label ? ` — ${block.label}` : ''}`
        case 'blog_divider':         return '───✦───'
        case 'blog_callout':         return block.title || block.text.slice(0, 60) || '(vazio)'
        case 'blog_curiosity':       return block.text.slice(0, 60) || '(vazio)'
        case 'blog_highlight':       return block.text.slice(0, 60) || '(vazio)'
        case 'blog_list':            return `${block.items.length} item(ns)`
        case 'blog_pros_cons':       return `${block.pros.length} prós, ${block.cons.length} contras`
        case 'blog_steps':           return `${block.steps.length} passo(s)`
        case 'blog_product_card':    return block.name || '(sem produto)'
        case 'blog_comparison':      return block.title || `${block.columns.length} colunas`
        case 'blog_accordion':       return block.title || `${block.items.length} item(ns)`
        case 'blog_tabs':            return `${block.tabs.length} aba(s)`
        case 'blog_ranking':         return block.title || `${block.items.length} item(ns)`
        case 'blog_trivia':          return block.question.slice(0, 60) || '(sem pergunta)'
        case 'blog_comeback_card':   return block.artist ? `${block.artist} — ${block.title}` : '(sem dados)'
        case 'blog_member_grid':     return `${block.members.length} membro(s)`
        case 'blog_setlist':         return block.event || `${block.tracks.length} faixa(s)`
        case 'blog_alert':           return block.title || block.text.slice(0, 60) || '(vazio)'
        case 'blog_vs':              return `${block.optionA.label} vs ${block.optionB.label}`
        case 'blog_poll':            return block.question || `${block.options.length} opções`
        case 'blog_lyrics':          return block.title || `${block.lines.length} linha(s)`
        case 'blog_lyrics_parallel': return block.title || `${block.sections.length} seção(ões)`
        case 'blog_era_card':        return `${block.era}${block.period ? ` (${block.period})` : ''}`
        case 'blog_chart_history':   return `${block.chart} — ${block.entries.length} entrada(s)`
        case 'blog_before_after':    return `${block.before.label} / ${block.after.label}`
        case 'blog_fandom':          return `${block.title || '(fandom)'} — ${block.quotes.length} citação(ões)`
        case 'blog_lightstick':      return `${block.group} — ${block.name}`
        case 'blog_positions':       return `${block.members.length} membro(s)`
        case 'blog_quiz':            return block.title || `${block.questions.length} pergunta(s)`
        case 'blog_countdown':       return `${block.artist} — ${block.title}`
        case 'blog_discography_grid':return `${block.artist} — ${block.albums.length} álbum(ns)`
        case 'blog_achievement':     return `${block.items.length} conquista(s)`
        case 'blog_mv_breakdown':    return `${block.title || block.videoId} — ${block.scenes.length} cena(s)`
        case 'blog_flashcard':       return `${block.title || ''} ${block.cards.length} card(s)`
        default:                     return '(bloco)'
    }
}

// ─── Insert strip ─────────────────────────────────────────────────────────────

function InsertStrip({ onInsert, onOpenPalette }: { onInsert: (type: BlogBlockType) => void; onOpenPalette?: () => void }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="relative flex items-center justify-center h-5 group/strip">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border opacity-0 group-hover/strip:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-center gap-1 opacity-0 group-hover/strip:opacity-100 transition-all">
                <button
                    onClick={() => setOpen(v => !v)}
                    className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-surface border border-border text-muted hover:text-purple-400 hover:border-purple-500/40 transition-all text-[10px] font-bold"
                >
                    <Plus className="w-3 h-3" /> inserir
                </button>
                {onOpenPalette && (
                    <button
                        onClick={onOpenPalette}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-surface border border-border text-muted hover:text-accent hover:border-accent/40 transition-all text-[10px] font-mono"
                        title="Abrir paleta de blocos (⌘K)"
                    >
                        ⌘K
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute z-30 top-full mt-1 left-1/2 -translate-x-1/2">
                    <TypeSelector onSelect={t => { onInsert(t); setOpen(false) }} onClose={() => setOpen(false)} />
                </div>
            )}
        </div>
    )
}

// ─── Block row ────────────────────────────────────────────────────────────────

function BlockRow({
    block, index, total, onChange, onDelete, onMoveUp, onMoveDown, onDuplicate, forceCollapsed,
}: {
    block: BlogBlock; index: number; total: number
    onChange: (b: BlogBlock) => void
    onDelete: () => void
    onMoveUp: () => void
    onMoveDown: () => void
    onDuplicate: () => void
    forceCollapsed?: boolean
}) {
    const [collapsed, setCollapsed] = useState(false)

    useEffect(() => {
        if (forceCollapsed !== undefined) setCollapsed(forceCollapsed)
    }, [forceCollapsed])

    return (
        <div className={`group/row relative bg-surface border rounded-xl transition-all ${collapsed ? 'border-border' : 'border-border hover:border-accent/20 hover:shadow-sm'}`}>
            {/* Header bar */}
            <div className="flex items-center gap-2 px-3 py-2">
                {/* Drag handle + reorder controls — visible only on hover */}
                <div className="flex flex-col items-center gap-0 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-3.5 h-3.5 text-muted/50 mb-0.5" />
                    <button onClick={onMoveUp} disabled={index === 0}
                        className="text-muted hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer">
                        <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={onMoveDown} disabled={index === total - 1}
                        className="text-muted hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer">
                        <ChevronDown className="w-3 h-3" />
                    </button>
                </div>

                {/* Type badge + collapse toggle */}
                <button onClick={() => setCollapsed(v => !v)}
                    className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                >
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold shrink-0 ${COLORS[block.type]}`}>
                        {ICONS[block.type]}
                        {BLOG_BLOCK_TYPE_LABELS[block.type]}
                    </span>
                    <span className="text-[10px] text-muted/40 shrink-0 group-hover/row:text-muted/70 transition-colors">#{index + 1}</span>
                    {collapsed && (
                        <>
                            {(block.type === 'blog_image' && block.url) && (
                                <img src={block.url} alt="" className="w-8 h-6 rounded object-cover shrink-0 ml-2 border border-border/60"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                            )}
                            {(block.type === 'blog_gallery' && block.urls.length > 0) && (
                                <div className="flex gap-0.5 ml-2 shrink-0">
                                    {block.urls.slice(0, 3).map((url, i) => url ? (
                                        <img key={i} src={url} alt="" className="w-6 h-6 rounded object-cover border border-border/60"
                                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                                    ) : null)}
                                </div>
                            )}
                            {blockPreview(block) && (
                                <span className="text-[11px] text-muted/70 truncate ml-2 max-w-xs">{blockPreview(block)}</span>
                            )}
                        </>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 text-muted/40 ml-auto shrink-0 transition-transform duration-150 ${collapsed ? '' : 'rotate-90'}`} />
                </button>

                {/* Actions — visible only on hover */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <button onClick={onDuplicate} title="Duplicar"
                        className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors">
                        <Copy className="w-3 h-3" />
                    </button>
                    <button onClick={onDelete} title="Remover"
                        className="p-1.5 rounded-md text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Fields */}
            {!collapsed && (
                <div className="px-4 pb-4 pt-1 border-t border-border/50">
                    <BlockFieldEditor block={block} onChange={onChange} />
                </div>
            )}
        </div>
    )
}

// ─── Main BlogBlockEditor ─────────────────────────────────────────────────────

interface BlogBlockEditorProps {
    blocks: BlogBlock[]
    onChange: (blocks: BlogBlock[]) => void
}

export function BlogBlockEditor({ blocks, onChange }: BlogBlockEditorProps) {
    const [showSelector, setShowSelector] = useState(false)
    const [forceCollapsed, setForceCollapsed] = useState<boolean | undefined>(undefined)
    const [showCommandPalette, setShowCommandPalette] = useState(false)
    const [paletteInsertAfter, setPaletteInsertAfter] = useState(-1)
    const [dragIdx, setDragIdx] = useState<number | null>(null)
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

    function updateBlock(i: number, updated: BlogBlock) {
        const next = [...blocks]; next[i] = updated; onChange(next)
    }
    function deleteBlock(i: number) { onChange(blocks.filter((_, j) => j !== i)) }
    function insertBlock(afterIndex: number, type: BlogBlockType) {
        const next = [...blocks]
        next.splice(afterIndex + 1, 0, defaultBlock(type))
        onChange(next)
    }
    function duplicateBlock(i: number) {
        const next = [...blocks]
        next.splice(i + 1, 0, { ...blocks[i] })
        onChange(next)
    }
    function moveBlock(from: number, to: number) {
        const next = [...blocks]
        const [removed] = next.splice(from, 1)
        next.splice(to, 0, removed)
        onChange(next)
    }

    // Cmd+K global shortcut
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                const tag = (e.target as HTMLElement)?.tagName
                if (tag === 'INPUT' || tag === 'TEXTAREA') return
                e.preventDefault()
                setPaletteInsertAfter(blocks.length - 1)
                setShowCommandPalette(true)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [blocks.length])

    // URL paste detection
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
        const text = e.clipboardData.getData('text/plain').trim()
        if (!text.startsWith('http')) return
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return

        let type: BlogBlockType | null = null
        let extra: Partial<BlogBlock> = {}

        if (/youtu(\.be|be\.com)/.test(text)) {
            type = 'blog_video'; extra = { url: text }
        } else if (/instagram\.com/.test(text)) {
            type = 'blog_instagram'; extra = { url: text }
        } else if (/twitter\.com|x\.com/.test(text)) {
            type = 'blog_twitter'; extra = { url: text }
        } else if (/open\.spotify\.com/.test(text)) {
            type = 'blog_spotify'; extra = { url: text }
        } else if (/tiktok\.com/.test(text)) {
            type = 'blog_tiktok'; extra = { url: text }
        } else if (/\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(text)) {
            type = 'blog_image'; extra = { url: text, caption: '' }
        }

        if (type) {
            e.preventDefault()
            const next = [...blocks]
            next.push({ ...defaultBlock(type), ...extra } as BlogBlock)
            onChange(next)
        }
    }, [blocks, onChange])

    return (
        <div className="space-y-0" onPaste={handlePaste}>
            {showCommandPalette && (
                <BlockCommandPalette
                    onSelect={type => {
                        insertBlock(paletteInsertAfter, type)
                        setShowCommandPalette(false)
                    }}
                    onClose={() => setShowCommandPalette(false)}
                />
            )}

            {blocks.length > 1 && (
                <div className="flex justify-end mb-1">
                    <button
                        onClick={() => setForceCollapsed(v => v === true ? false : true)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-[11px] text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                        title={forceCollapsed ? 'Expandir todos' : 'Colapsar todos'}
                    >
                        <ChevronsUpDown className="w-3 h-3" />
                        {forceCollapsed ? 'Expandir todos' : 'Colapsar todos'}
                    </button>
                </div>
            )}
            {blocks.length === 0 && (
                <div className="text-center py-12 text-muted text-sm border border-dashed border-border rounded-xl">
                    Nenhum bloco ainda. Clique em <span className="text-foreground font-medium">+ Bloco</span> ou pressione <kbd className="font-mono text-xs border border-border rounded px-1">⌘K</kbd> para começar.
                </div>
            )}

            {blocks.map((block, i) => (
                <div
                    key={i}
                    data-block-index={i}
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={e => { e.preventDefault(); setDragOverIdx(i) }}
                    onDrop={() => {
                        if (dragIdx !== null && dragIdx !== i) moveBlock(dragIdx, i)
                        setDragIdx(null); setDragOverIdx(null)
                    }}
                    onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                    className={dragOverIdx === i && dragIdx !== i ? 'ring-2 ring-accent/40 rounded-xl' : ''}
                >
                    {i === 0 && (
                        <InsertStrip
                            onInsert={type => { setPaletteInsertAfter(-1); insertBlock(-1, type) }}
                            onOpenPalette={() => { setPaletteInsertAfter(-1); setShowCommandPalette(true) }}
                        />
                    )}
                    <BlockRow
                        block={block} index={i} total={blocks.length}
                        onChange={updated => updateBlock(i, updated)}
                        onDelete={() => deleteBlock(i)}
                        onMoveUp={() => moveBlock(i, i - 1)}
                        onMoveDown={() => moveBlock(i, i + 1)}
                        onDuplicate={() => duplicateBlock(i)}
                        forceCollapsed={forceCollapsed}
                    />
                    <InsertStrip
                        onInsert={type => insertBlock(i, type)}
                        onOpenPalette={() => { setPaletteInsertAfter(i); setShowCommandPalette(true) }}
                    />
                </div>
            ))}

            {/* Add at end */}
            <div className="relative pt-1">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSelector(v => !v)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-sm text-muted hover:text-foreground hover:border-purple-500/30 transition-colors flex-1 justify-center"
                    >
                        <Plus className="w-4 h-4" /> Bloco
                    </button>
                    <button
                        onClick={() => { setPaletteInsertAfter(blocks.length - 1); setShowCommandPalette(true) }}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl border border-dashed border-border text-[11px] font-mono text-muted hover:text-accent hover:border-accent/40 transition-colors shrink-0"
                        title="Paleta de blocos (⌘K)"
                    >
                        ⌘K
                    </button>
                </div>
                {showSelector && (
                    <TypeSelector
                        onSelect={type => { insertBlock(blocks.length - 1, type); setShowSelector(false) }}
                        onClose={() => setShowSelector(false)}
                    />
                )}
            </div>
        </div>
    )
}
