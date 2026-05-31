'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, Type, AlignLeft, Quote, Image as ImageIcon, Video, Music2, User, Film, BarChart2, Star, Minus, GalleryHorizontal, X, ChevronRight, Copy, Search, Loader2, Users, Zap, Clock, Headphones, ChevronsUpDown, GripVertical } from 'lucide-react'
import { Instagram, Twitter } from '@/components/ui/BrandIcons'
import type { BlogBlock, BlogBlockType } from '@/lib/types/blocks'
import { BLOG_BLOCK_TYPE_LABELS } from '@/lib/types/blocks'
import { BlockCommandPalette } from './BlockCommandPalette'
import { MediaPicker } from './MediaPicker'

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
    blog_ad:              <BarChart2 className="w-3.5 h-3.5" />,
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
    blog_ad:              'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

// ─── Block groups for the type selector ───────────────────────────────────────

const TYPE_GROUPS: { label: string; types: BlogBlockType[] }[] = [
    { label: 'Texto',     types: ['blog_heading', 'blog_paragraph', 'blog_quote', 'blog_list', 'blog_callout', 'blog_curiosity', 'blog_highlight', 'blog_divider'] },
    { label: 'Mídia',     types: ['blog_image', 'blog_gallery', 'blog_video', 'blog_twitter', 'blog_instagram', 'blog_tiktok', 'blog_spotify'] },
    { label: 'Layout',    types: ['blog_timeline', 'blog_steps', 'blog_pros_cons', 'blog_comparison', 'blog_accordion', 'blog_tabs', 'blog_ranking', 'blog_alert', 'blog_ad'] },
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
        case 'blog_ad':              return { type, label: '' }
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
    kind, currentId, onChange, initialLabel,
}: {
    kind: EntityKind
    currentId: string
    onChange: (id: string, label: string) => void
    initialLabel?: string
}) {
    const [searching, setSearching] = useState(!currentId)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<EntityResult[]>([])
    const [loading, setLoading] = useState(false)
    const [pickedLabel, setPickedLabel] = useState(initialLabel ?? '')
    const ref = useRef<HTMLDivElement>(null)

    // Resolve name for pre-existing ID only if no label cached in block data
    useEffect(() => {
        if (!currentId || pickedLabel) return
        async function resolveName() {
            try {
                if (kind === 'artist') {
                    const r = await fetch(`/api/artists/list?ids=${currentId}&limit=1`)
                    const d = await r.json()
                    const a = (d.artists ?? [])[0]
                    if (a?.nameRomanized) setPickedLabel(a.nameRomanized)
                } else if (kind === 'group') {
                    const r = await fetch(`/api/groups/list`)
                    const d = await r.json()
                    const g = (d.groups ?? []).find((x: { id: string; name: string }) => x.id === currentId)
                    if (g) setPickedLabel(g.name)
                } else {
                    const r = await fetch(`/api/productions/list?ids=${currentId}&limit=1`)
                    const d = await r.json()
                    const p = (d.productions ?? [])[0]
                    if (p) setPickedLabel(p.titlePt || p.titleKr || currentId)
                }
            } catch { /* silent */ }
        }
        resolveName()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentId])

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
    const [activeIdx, setActiveIdx] = useState(0)
    const listRef = useRef<HTMLDivElement>(null)
    const q = query.toLowerCase()

    const TYPE_ALIASES_LOCAL: Partial<Record<BlogBlockType, string[]>> = {
        blog_image: ['foto', 'imagem', 'img'], blog_gallery: ['fotos', 'galeria'],
        blog_video: ['youtube', 'yt', 'shorts'], blog_spotify: ['musica', 'música', 'playlist'],
        blog_paragraph: ['texto', 'paragrafo', 'parágrafo'], blog_heading: ['titulo', 'título', 'h2', 'h3'],
        blog_quote: ['citação', 'citacao'], blog_list: ['lista', 'bullet'],
        blog_pros_cons: ['prós', 'contras', 'pros', 'vantagens'], blog_steps: ['passos', 'tutorial'],
        blog_rating: ['nota', 'avaliação', 'score'], blog_artist_card: ['artista', 'idol'],
        blog_group_card: ['grupo', 'kpop', 'k-pop'], blog_production_card: ['drama', 'filme', 'serie'],
        blog_lyrics: ['letra', 'lyric'], blog_alert: ['aviso', 'spoiler', 'warning'],
        blog_divider: ['linha', 'separador'], blog_accordion: ['faq', 'perguntas'],
    }

    function matchesQuery(type: BlogBlockType) {
        if (q === '') return true
        if (BLOG_BLOCK_TYPE_LABELS[type].toLowerCase().includes(q)) return true
        if (type.replace('blog_', '').includes(q)) return true
        return TYPE_ALIASES_LOCAL[type]?.some(a => a.includes(q)) ?? false
    }

    const flatTypes = useMemo(() => TYPE_GROUPS.flatMap(group =>
        group.types.filter(matchesQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [q])

    const filteredGroups = useMemo(() => TYPE_GROUPS.map(group => ({
        ...group,
        types: group.types.filter(matchesQuery),
    })).filter(g => g.types.length > 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    , [q])

    // Reset active index when query changes
    useEffect(() => { setActiveIdx(0) }, [q])

    // Scroll active item into view
    useEffect(() => {
        const el = listRef.current?.querySelector('[data-active="true"]') as HTMLElement | null
        el?.scrollIntoView({ block: 'nearest' })
    }, [activeIdx])

    return (
        <div className="absolute z-20 mt-1 bg-surface border border-border rounded-xl shadow-2xl p-3 min-w-[240px] left-0">
            <div className="flex items-center gap-2 mb-2 bg-background border border-border rounded-lg px-2.5 py-1.5">
                <Search className="w-3.5 h-3.5 text-muted shrink-0" />
                <input
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flatTypes.length - 1)) }
                        if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
                        if (e.key === 'Enter' && flatTypes[activeIdx]) { onSelect(flatTypes[activeIdx]); onClose() }
                        if (e.key === 'Escape') onClose()
                    }}
                    placeholder="Filtrar tipo de bloco..."
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-none"
                />
                <button onClick={onClose} className="text-muted hover:text-foreground shrink-0">
                    <X className="w-3 h-3" />
                </button>
            </div>
            <div ref={listRef} className="max-h-64 overflow-y-auto">
                {filteredGroups.length === 0 ? (
                    <p className="text-xs text-muted text-center py-4">Nenhum tipo encontrado</p>
                ) : filteredGroups.map(group => (
                    <div key={group.label} className="mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted px-2 mb-1">{group.label}</p>
                        {group.types.map(type => {
                            const idx = flatTypes.indexOf(type)
                            const isActive = idx === activeIdx
                            return (
                                <button
                                    key={type}
                                    data-active={isActive}
                                    onClick={() => { onSelect(type); onClose() }}
                                    onMouseEnter={() => setActiveIdx(idx)}
                                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-foreground transition-colors text-left ${isActive ? 'bg-surface-hover' : 'hover:bg-surface-hover'}`}
                                >
                                    <span className={`flex items-center justify-center w-6 h-6 rounded border ${COLORS[type]}`}>
                                        {ICONS[type]}
                                    </span>
                                    {BLOG_BLOCK_TYPE_LABELS[type]}
                                </button>
                            )
                        })}
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

function AutoTextarea({ value, onChange, placeholder, minRows = 3, className = '', onKeyDown }: {
    value: string; onChange: (v: string) => void; placeholder?: string; minRows?: number; className?: string
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
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
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={minRows}
            className={`${inputCls} ${className}`}
            style={{ overflow: 'hidden' }}
        />
    )
}

function ParagraphBlockEditor({ block, onChange }: { block: Extract<BlogBlock, { type: 'blog_paragraph' }>; onChange: (b: BlogBlock) => void }) {
    const [showSlash, setShowSlash] = useState(false)
    const wc = block.text ? block.text.split(/\s+/).filter(Boolean).length : 0
    return (
        <div className="relative space-y-1">
            {showSlash && (
                <div className="absolute z-20 top-full mt-1 left-0">
                    <TypeSelector
                        onSelect={t => { onChange(defaultBlock(t)); setShowSlash(false) }}
                        onClose={() => setShowSlash(false)}
                    />
                </div>
            )}
            <AutoTextarea
                value={block.text}
                onChange={v => {
                    if (!block.text && v === '/') { setShowSlash(true); return }
                    onChange({ ...block, text: v })
                }}
                onKeyDown={e => { if (e.key === 'Escape' && showSlash) { e.preventDefault(); setShowSlash(false) } }}
                placeholder="Escreva um parágrafo... (/ para transformar em outro bloco)"
                minRows={3}
            />
            {wc >= 30 && (
                <p className={`text-[10px] text-right tabular-nums ${wc > 150 ? 'text-orange-400' : 'text-muted/40'}`}>
                    {wc} palavras{wc > 150 ? ' — parágrafo longo' : ''}
                </p>
            )}
        </div>
    )
}

function ImageBlockEditor({ block, onChange }: { block: Extract<BlogBlock, { type: 'blog_image' }>; onChange: (b: BlogBlock) => void }) {
    const size = block.size ?? 'medium'
    const [showPicker, setShowPicker] = useState(false)
    return (
        <div className="space-y-2">
            {showPicker && (
                <MediaPicker
                    value={block.url}
                    onChange={url => { onChange({ ...block, url }); setShowPicker(false) }}
                    onClose={() => setShowPicker(false)}
                />
            )}
            <div className="flex gap-2">
                <input value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
                    placeholder="URL da imagem..." className={`${inputCls} flex-1`} />
                <button
                    onClick={() => setShowPicker(true)}
                    className="shrink-0 px-3 py-2 rounded-lg border border-border text-xs text-muted hover:text-foreground hover:bg-surface-hover transition-colors flex items-center gap-1.5"
                >
                    <ImageIcon className="w-3.5 h-3.5" /> Biblioteca
                </button>
            </div>
            {block.url && (
                <div className="relative h-36 rounded-lg border border-border overflow-hidden bg-surface cursor-pointer" onClick={() => setShowPicker(true)}>
                    <img src={block.url} alt="preview" className="w-full h-full object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                </div>
            )}
            <div className="space-y-1">
                <input value={block.alt || ''} onChange={e => onChange({ ...block, alt: e.target.value })}
                    placeholder="Texto alternativo (alt) — descreva a imagem para SEO e acessibilidade..."
                    className={`${inputCls} ${block.url && !block.alt ? 'border-orange-500/40 focus:border-orange-500/60' : ''}`} />
                {block.url && !block.alt && (
                    <p className="text-[11px] text-orange-400">Alt text vazio — importante para SEO e acessibilidade</p>
                )}
            </div>
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

function GalleryBlockEditor({ block, onChange }: { block: Extract<BlogBlock, { type: 'blog_gallery' }>; onChange: (b: BlogBlock) => void }) {
    const [galleryPickerIdx, setGalleryPickerIdx] = useState<number | null>(null)
    const filledUrls = block.urls.filter(Boolean)
    return (
        <div className="space-y-2">
            {/* Strip preview — only when 2+ images */}
            {filledUrls.length >= 2 && (
                <div className={`grid gap-1 rounded-lg overflow-hidden border border-border ${filledUrls.length === 2 ? 'grid-cols-2' : filledUrls.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}
                    style={{ height: '80px' }}>
                    {filledUrls.slice(0, 4).map((url, i) => (
                        <div key={i} className="relative overflow-hidden bg-surface">
                            <img src={url} alt="" className="w-full h-full object-cover"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                            {filledUrls.length > 4 && i === 3 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm font-bold">
                                    +{filledUrls.length - 4}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {galleryPickerIdx !== null && (
                <MediaPicker
                    value={block.urls[galleryPickerIdx] ?? null}
                    onChange={url => {
                        const urls = [...block.urls]; urls[galleryPickerIdx] = url
                        onChange({ ...block, urls }); setGalleryPickerIdx(null)
                    }}
                    onClose={() => setGalleryPickerIdx(null)}
                />
            )}
            {block.urls.map((url, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <div
                        onClick={() => setGalleryPickerIdx(i)}
                        className={`w-16 h-12 rounded-lg border border-border overflow-hidden shrink-0 bg-surface cursor-pointer hover:border-purple-500/40 transition-colors flex items-center justify-center ${!url ? 'border-dashed' : ''}`}
                    >
                        {url
                            ? <img src={url} alt="" className="w-full h-full object-cover"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                            : <ImageIcon className="w-4 h-4 text-muted/40" />
                        }
                    </div>
                    <input value={url} onChange={e => {
                        const urls = [...block.urls]; urls[i] = e.target.value
                        onChange({ ...block, urls })
                    }} placeholder={`URL da imagem ${i + 1}...`} className={`${inputCls} flex-1`} />
                    <button onClick={() => onChange({ ...block, urls: block.urls.filter((_, j) => j !== i) })}
                        className="text-muted hover:text-red-400 shrink-0 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <div className="flex gap-2">
                <button onClick={() => onChange({ ...block, urls: [...block.urls, ''] })}
                    className="text-xs text-muted hover:text-purple-400 transition-colors flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Adicionar URL
                </button>
                <button onClick={() => { onChange({ ...block, urls: [...block.urls, ''] }); setGalleryPickerIdx(block.urls.length) }}
                    className="text-xs text-muted hover:text-blue-400 transition-colors flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> Da biblioteca
                </button>
            </div>
            <input value={block.caption || ''} onChange={e => onChange({ ...block, caption: e.target.value })}
                placeholder="Legenda da galeria (opcional)..." className={inputCls} />
        </div>
    )
}

function StringListInput({ items, onChange, placeholder, addLabel, accentClass }: {
    items: string[]; onChange: (items: string[]) => void
    placeholder: (i: number) => string; addLabel: string; accentClass: string
}) {
    const refs = useRef<(HTMLInputElement | null)[]>([])
    return (
        <div className="space-y-1.5">
            {items.map((item, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                    <input
                        ref={el => { refs.current[i] = el }}
                        value={item}
                        onChange={e => { const next = [...items]; next[i] = e.target.value; onChange(next) }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                const next = [...items]; next.splice(i + 1, 0, ''); onChange(next)
                                setTimeout(() => refs.current[i + 1]?.focus(), 0)
                            }
                            if (e.key === 'Backspace' && !item && items.length > 1) {
                                e.preventDefault()
                                onChange(items.filter((_, j) => j !== i))
                                setTimeout(() => refs.current[Math.max(0, i - 1)]?.focus(), 0)
                            }
                        }}
                        placeholder={placeholder(i)}
                        className={`${inputCls} flex-1`}
                    />
                    <button onClick={() => onChange(items.filter((_, j) => j !== i))}
                        className="text-muted hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                </div>
            ))}
            <button onClick={() => { onChange([...items, '']); setTimeout(() => refs.current[items.length]?.focus(), 0) }}
                className={`text-xs text-muted ${accentClass} flex items-center gap-1`}>
                <Plus className="w-3 h-3" /> {addLabel}
            </button>
        </div>
    )
}

function StatsRowEditor({ block, onChange }: { block: Extract<BlogBlock, { type: 'blog_stats_row' }>; onChange: (b: BlogBlock) => void }) {
    const labelRefs = useRef<(HTMLInputElement | null)[]>([])
    const valueRefs = useRef<(HTMLInputElement | null)[]>([])

    function addItem(afterIdx: number) {
        const items = [...block.items]
        items.splice(afterIdx + 1, 0, { label: '', value: '' })
        onChange({ ...block, items })
        setTimeout(() => labelRefs.current[afterIdx + 1]?.focus(), 0)
    }
    function removeItem(i: number) {
        if (block.items.length <= 1) return
        onChange({ ...block, items: block.items.filter((_, j) => j !== i) })
        setTimeout(() => labelRefs.current[Math.max(0, i - 1)]?.focus(), 0)
    }

    return (
        <div className="space-y-1.5">
            {block.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <input value={(item as { emoji?: string }).emoji || ''} onChange={e => {
                        const items = [...block.items]
                        items[i] = { ...item, emoji: e.target.value } as typeof item
                        onChange({ ...block, items })
                    }} onKeyDown={e => {
                        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); labelRefs.current[i]?.focus() }
                    }} placeholder="🌟" className={`${inputCls} w-12 text-center`} />
                    <input
                        ref={el => { labelRefs.current[i] = el }}
                        value={item.label}
                        onChange={e => {
                            const items = [...block.items]; items[i] = { ...item, label: e.target.value }
                            onChange({ ...block, items })
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); valueRefs.current[i]?.focus() }
                            if (e.key === 'Backspace' && !item.label && !item.value && block.items.length > 1) {
                                e.preventDefault(); removeItem(i)
                            }
                        }}
                        placeholder="Rótulo..." className={`${inputCls} w-1/3`}
                    />
                    <input
                        ref={el => { valueRefs.current[i] = el }}
                        value={item.value}
                        onChange={e => {
                            const items = [...block.items]; items[i] = { ...item, value: e.target.value }
                            onChange({ ...block, items })
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); addItem(i) }
                            if (e.key === 'Tab' && !e.shiftKey && i === block.items.length - 1) {
                                e.preventDefault(); addItem(i)
                            }
                        }}
                        placeholder="Valor..." className={`${inputCls} flex-1`}
                    />
                    <button onClick={() => removeItem(i)} className="text-muted hover:text-red-400 shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button onClick={() => addItem(block.items.length - 1)}
                className="text-xs text-muted hover:text-cyan-400 transition-colors flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Adicionar linha
            </button>
        </div>
    )
}

function ProsConsBlockEditor({ block, onChange }: { block: Extract<BlogBlock, { type: 'blog_pros_cons' }>; onChange: (b: BlogBlock) => void }) {
    return (
        <div className="space-y-3">
            <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                placeholder="Título (opcional)..." className={inputCls} />
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-emerald-400">Prós</p>
                    <StringListInput
                        items={block.pros} onChange={pros => onChange({ ...block, pros })}
                        placeholder={i => `Pró ${i + 1}...`} addLabel="Adicionar" accentClass="hover:text-emerald-400"
                    />
                </div>
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-red-400">Contras</p>
                    <StringListInput
                        items={block.cons} onChange={cons => onChange({ ...block, cons })}
                        placeholder={i => `Contra ${i + 1}...`} addLabel="Adicionar" accentClass="hover:text-red-400"
                    />
                </div>
            </div>
        </div>
    )
}

function ListBlockEditor({ block, onChange }: { block: Extract<BlogBlock, { type: 'blog_list' }>; onChange: (b: BlogBlock) => void }) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    return (
        <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted">
                <input type="checkbox" checked={block.ordered ?? false}
                    onChange={e => onChange({ ...block, ordered: e.target.checked })}
                    className="accent-purple-500" />
                Lista numerada
            </label>
            {block.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <span className="text-xs text-muted shrink-0 w-5 text-right">{block.ordered ? `${i + 1}.` : '•'}</span>
                    <input
                        ref={el => { inputRefs.current[i] = el }}
                        value={item}
                        onChange={e => {
                            const items = [...block.items]; items[i] = e.target.value
                            onChange({ ...block, items })
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                const items = [...block.items]; items.splice(i + 1, 0, '')
                                onChange({ ...block, items })
                                setTimeout(() => inputRefs.current[i + 1]?.focus(), 0)
                            }
                            if (e.key === 'Backspace' && !item && block.items.length > 1) {
                                e.preventDefault()
                                onChange({ ...block, items: block.items.filter((_, j) => j !== i) })
                                setTimeout(() => inputRefs.current[Math.max(0, i - 1)]?.focus(), 0)
                            }
                        }}
                        placeholder={`Item ${i + 1}...`}
                        className={`${inputCls} flex-1`}
                    />
                    <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                        className="text-muted hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
                </div>
            ))}
            <button onClick={() => {
                onChange({ ...block, items: [...block.items, ''] })
                setTimeout(() => inputRefs.current[block.items.length]?.focus(), 0)
            }} className="text-xs text-muted hover:text-purple-400 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Adicionar item
            </button>
        </div>
    )
}

function LyricsBlockEditor({ block, onChange }: { block: Extract<BlogBlock, { type: 'blog_lyrics' }>; onChange: (b: BlogBlock) => void }) {
    const lyricsOrigRefs = useRef<(HTMLInputElement | null)[]>([])
    const lyricsTranRefs = useRef<(HTMLInputElement | null)[]>([])
    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                    placeholder="Título da música..." className={`${inputCls} flex-1`} />
                <input value={block.source || ''} onChange={e => onChange({ ...block, source: e.target.value })}
                    placeholder="Artista / álbum..." className={`${inputCls} w-44`} />
            </div>
            <div className="grid grid-cols-2 gap-2 px-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Original (🇰🇷)</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Tradução (🇧🇷)</span>
            </div>
            {block.lines.map((line, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 items-center group/line">
                    <input
                        ref={el => { lyricsOrigRefs.current[i] = el }}
                        value={line.original}
                        onChange={e => {
                            const lines = [...block.lines]; lines[i] = { ...line, original: e.target.value }
                            onChange({ ...block, lines })
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                const lines = [...block.lines]
                                lines.splice(i + 1, 0, { original: '', translation: '' })
                                onChange({ ...block, lines })
                                setTimeout(() => lyricsOrigRefs.current[i + 1]?.focus(), 0)
                            }
                            if (e.key === 'Tab') {
                                e.preventDefault()
                                lyricsTranRefs.current[i]?.focus()
                            }
                            if (e.key === 'Backspace' && !line.original && !line.translation && block.lines.length > 1) {
                                e.preventDefault()
                                onChange({ ...block, lines: block.lines.filter((_, j) => j !== i) })
                                setTimeout(() => lyricsOrigRefs.current[Math.max(0, i - 1)]?.focus(), 0)
                            }
                        }}
                        placeholder="가사..."
                        className={`${inputCls} text-sm`}
                    />
                    <div className="flex gap-1 items-center">
                        <input
                            ref={el => { lyricsTranRefs.current[i] = el }}
                            value={line.translation || ''}
                            onChange={e => {
                                const lines = [...block.lines]; lines[i] = { ...line, translation: e.target.value }
                                onChange({ ...block, lines })
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    const lines = [...block.lines]
                                    lines.splice(i + 1, 0, { original: '', translation: '' })
                                    onChange({ ...block, lines })
                                    setTimeout(() => lyricsOrigRefs.current[i + 1]?.focus(), 0)
                                }
                                if (e.key === 'Tab' && !e.shiftKey) {
                                    e.preventDefault()
                                    lyricsOrigRefs.current[i + 1]?.focus()
                                }
                            }}
                            placeholder="tradução..."
                            className={`${inputCls} flex-1 text-sm`}
                        />
                        <button onClick={() => onChange({ ...block, lines: block.lines.filter((_, j) => j !== i) })}
                            className="opacity-0 group-hover/line:opacity-100 text-muted hover:text-red-400 shrink-0 transition-opacity">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ))}
            <button onClick={() => {
                onChange({ ...block, lines: [...block.lines, { original: '', translation: '' }] })
                setTimeout(() => lyricsOrigRefs.current[block.lines.length]?.focus(), 0)
            }} className="text-xs text-muted hover:text-purple-400 flex items-center gap-1 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Adicionar linha
            </button>
        </div>
    )
}

function FandomBlockEditor({ block, onChange }: { block: Extract<BlogBlock, { type: 'blog_fandom' }>; onChange: (b: BlogBlock) => void }) {
    const fandomRefs = useRef<(HTMLInputElement | null)[]>([])
    return (
        <div className="space-y-2">
            <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                placeholder="Nome do fandom (ex: MYs)" className={inputCls} />
            {block.quotes.map((q, i) => (
                <div key={i} className="flex gap-2 items-center group/quote">
                    <input
                        ref={el => { fandomRefs.current[i] = el }}
                        value={q.text}
                        onChange={e => {
                            const quotes = [...block.quotes]; quotes[i] = { ...q, text: e.target.value }
                            onChange({ ...block, quotes })
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                const quotes = [...block.quotes]; quotes.splice(i + 1, 0, { text: '' })
                                onChange({ ...block, quotes })
                                setTimeout(() => fandomRefs.current[i + 1]?.focus(), 0)
                            }
                            if (e.key === 'Backspace' && !q.text && block.quotes.length > 1) {
                                e.preventDefault()
                                onChange({ ...block, quotes: block.quotes.filter((_, j) => j !== i) })
                                setTimeout(() => fandomRefs.current[Math.max(0, i - 1)]?.focus(), 0)
                            }
                        }}
                        placeholder={`Citação ${i + 1}...`}
                        className={`${inputCls} flex-1`}
                    />
                    <button onClick={() => onChange({ ...block, quotes: block.quotes.filter((_, j) => j !== i) })}
                        className="opacity-0 group-hover/quote:opacity-100 text-muted hover:text-red-400 shrink-0 transition-opacity">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
            <button onClick={() => {
                onChange({ ...block, quotes: [...block.quotes, { text: '' }] })
                setTimeout(() => fandomRefs.current[block.quotes.length]?.focus(), 0)
            }} className="text-xs text-muted hover:text-purple-400 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Adicionar citação
            </button>
        </div>
    )
}

function SetlistBlockEditor({ block, onChange }: { block: Extract<BlogBlock, { type: 'blog_setlist' }>; onChange: (b: BlogBlock) => void }) {
    const setlistRefs = useRef<(HTMLInputElement | null)[]>([])
    return (
        <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
                <input value={block.event || ''} onChange={e => onChange({ ...block, event: e.target.value })}
                    placeholder="Evento..." className={inputCls} />
                <input value={block.date || ''} onChange={e => onChange({ ...block, date: e.target.value })}
                    placeholder="Data (ex: 2024-01-20)..." className={inputCls} />
                <input value={block.venue || ''} onChange={e => onChange({ ...block, venue: e.target.value })}
                    placeholder="Local..." className={inputCls} />
            </div>
            {block.tracks.map((track, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <span className="text-xs text-muted shrink-0 w-5 text-right tabular-nums">{track.number}.</span>
                    <input
                        ref={el => { setlistRefs.current[i] = el }}
                        value={track.title} onChange={e => {
                        const tracks = [...block.tracks]; tracks[i] = { ...track, title: e.target.value }
                        onChange({ ...block, tracks })
                    }} onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            const tracks = [...block.tracks]
                            tracks.splice(i + 1, 0, { number: i + 2, title: '' })
                            const renum = tracks.map((t, j) => ({ ...t, number: j + 1 }))
                            onChange({ ...block, tracks: renum })
                            setTimeout(() => setlistRefs.current[i + 1]?.focus(), 0)
                        }
                        if (e.key === 'Backspace' && !track.title && block.tracks.length > 1) {
                            e.preventDefault()
                            const tracks = block.tracks.filter((_, j) => j !== i).map((t, j) => ({ ...t, number: j + 1 }))
                            onChange({ ...block, tracks })
                            setTimeout(() => setlistRefs.current[Math.max(0, i - 1)]?.focus(), 0)
                        }
                    }}
                    placeholder="Título da música..." className={`${inputCls} flex-1`} />
                    <input value={track.note || ''} onChange={e => {
                        const tracks = [...block.tracks]; tracks[i] = { ...track, note: e.target.value }
                        onChange({ ...block, tracks })
                    }} placeholder="Nota (encore, remix...)" className={`${inputCls} w-36`} />
                    <button onClick={() => {
                        const tracks = block.tracks.filter((_, j) => j !== i).map((t, j) => ({ ...t, number: j + 1 }))
                        onChange({ ...block, tracks })
                    }} className="text-muted hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
                </div>
            ))}
            <button onClick={() => onChange({ ...block, tracks: [...block.tracks, { number: block.tracks.length + 1, title: '' }] })}
                className="text-xs text-muted hover:text-green-400 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Adicionar faixa
            </button>
        </div>
    )
}

function BlockFieldEditor({ block, onChange }: { block: BlogBlock; onChange: (b: BlogBlock) => void }) {
    switch (block.type) {
        case 'blog_heading': {
            const fontCls = block.level === 1 ? 'text-2xl font-black' : block.level === 3 ? 'text-base font-bold' : 'text-xl font-bold'
            return (
                <div className="space-y-2">
                    <div className="flex gap-1">
                        {([2, 3] as const).map(l => (
                            <button key={l} onClick={() => onChange({ ...block, level: l })}
                                className={`px-2.5 py-1 rounded text-xs font-black border transition-colors ${block.level === l ? 'bg-purple-600/30 border-purple-500/40 text-purple-300' : 'border-border text-muted hover:text-foreground'}`}>
                                H{l}
                            </button>
                        ))}
                    </div>
                    <input value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
                        placeholder={`Título H${block.level ?? 2}...`}
                        className={`w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted focus:outline-none focus:border-purple-500/50 ${fontCls}`} />
                </div>
            )
        }

        case 'blog_paragraph':
            return <ParagraphBlockEditor block={block} onChange={onChange} />

        case 'blog_quote':
            return (
                <div className="space-y-2">
                    <AutoTextarea value={block.text} onChange={v => onChange({ ...block, text: v })}
                        placeholder="Texto da citação..." minRows={3} />
                    <input value={block.author || ''} onChange={e => onChange({ ...block, author: e.target.value })}
                        placeholder="Autor (opcional)..." className={inputCls} />
                    {block.text && (
                        <div className="flex gap-3 rounded-lg px-4 py-3 bg-amber-500/10 border-l-4 border-amber-400/60">
                            <div className="min-w-0">
                                <p className="text-xs text-muted/80 italic leading-relaxed">"{block.text.slice(0, 140)}{block.text.length > 140 ? '…' : ''}"</p>
                                {block.author && <p className="text-[10px] text-amber-400/80 mt-1">— {block.author}</p>}
                            </div>
                        </div>
                    )}
                </div>
            )

        case 'blog_image':
            return <ImageBlockEditor block={block} onChange={onChange} />

        case 'blog_gallery':
            return <GalleryBlockEditor block={block} onChange={onChange} />

        case 'blog_video': {
            const ytMatch = block.url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/)
            const ytId = ytMatch?.[1] ?? null
            return (
                <div className="space-y-2">
                    <input value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
                        placeholder="URL do YouTube (incluindo /shorts/...)"
                        className={inputCls} />
                    {ytId && (
                        <div className="relative rounded-lg overflow-hidden border border-border h-36 bg-surface group/thumb cursor-pointer"
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${ytId}`, '_blank')}>
                            <img
                                src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                alt="thumbnail"
                                className="w-full h-full object-cover"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                                    <Video className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <span className="absolute bottom-1 right-1 text-[10px] font-mono bg-black/70 text-white px-1.5 py-0.5 rounded">{ytId}</span>
                        </div>
                    )}
                    {!ytId && block.url && (
                        <p className="text-[11px] text-orange-400">URL inválida — use um link youtube.com/watch?v=... ou youtu.be/...</p>
                    )}
                    <input value={block.caption || ''} onChange={e => onChange({ ...block, caption: e.target.value })}
                        placeholder="Legenda (opcional)..." className={inputCls} />
                </div>
            )
        }

        case 'blog_twitter':
        case 'blog_instagram':
        case 'blog_tiktok': {
            const domain = block.url ? (() => { try { return new URL(block.url).hostname.replace('www.', '') } catch { return null } })() : null
            const expectedDomains: Record<string, string[]> = {
                blog_twitter: ['twitter.com', 'x.com'],
                blog_instagram: ['instagram.com'],
                blog_tiktok: ['tiktok.com'],
            }
            const isValid = domain ? expectedDomains[block.type]?.some(d => domain.includes(d)) : false
            return (
                <div className="space-y-2">
                    <input value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
                        placeholder={
                            block.type === 'blog_twitter' ? 'URL do tweet (x.com ou twitter.com/...)' :
                            block.type === 'blog_instagram' ? 'URL do post do Instagram (instagram.com/p/...)' :
                            'URL do vídeo no TikTok (tiktok.com/@.../video/...)'
                        }
                        className={inputCls} />
                    {block.url && (
                        <div className={`flex items-center gap-1.5 text-[11px] ${isValid ? 'text-green-400' : 'text-orange-400'}`}>
                            {isValid
                                ? <><span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />{domain}</>
                                : <><span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />Domínio inesperado: {domain ?? 'URL inválida'}</>
                            }
                        </div>
                    )}
                </div>
            )
        }

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
                        <EntityPicker kind="artist" currentId={block.artistId} initialLabel={block._label}
                            onChange={(id, label) => onChange({ ...block, artistId: id, _label: label || block._label })} />
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
                        <EntityPicker kind="group" currentId={block.groupId} initialLabel={block._label}
                            onChange={(id, label) => onChange({ ...block, groupId: id, _label: label || block._label })} />
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
                        <EntityPicker kind="production" currentId={block.productionId} initialLabel={block._label}
                            onChange={(id, label) => onChange({ ...block, productionId: id, _label: label || block._label })} />
                    </div>
                    <input value={block.note || ''} onChange={e => onChange({ ...block, note: e.target.value })}
                        placeholder="Nota editorial (opcional)..." className={inputCls} />
                    <CompactToggle value={block.compact ?? false}
                        onChange={v => onChange({ ...block, compact: v })} />
                </div>
            )

        case 'blog_stats_row':
            return <StatsRowEditor block={block} onChange={onChange} />

        case 'blog_rating': {
            const score = block.score ?? 8
            const scoreColor = score >= 9 ? 'text-emerald-400' : score >= 7 ? 'text-yellow-400' : score >= 5 ? 'text-orange-400' : 'text-red-400'
            return (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className={labelCls + ' mb-0'}>Nota</label>
                            <span className={`text-2xl font-black tabular-nums ${scoreColor}`}>{score}<span className="text-sm font-normal text-muted">/10</span></span>
                        </div>
                        <input type="range" min={0} max={10} step={0.5}
                            value={score}
                            onChange={e => onChange({ ...block, score: parseFloat(e.target.value) })}
                            className="w-full accent-yellow-400 h-2 rounded-full cursor-pointer" />
                        <div className="flex justify-between text-[10px] text-muted/50 px-0.5">
                            {[0,1,2,3,4,5,6,7,8,9,10].map(n => <span key={n}>{n}</span>)}
                        </div>
                    </div>
                    <input value={block.label || ''} onChange={e => onChange({ ...block, label: e.target.value })}
                        placeholder="Rótulo (ex: Drama, Álbum, Trilha sonora)..." className={inputCls} />
                    <AutoTextarea value={block.summary || ''} onChange={v => onChange({ ...block, summary: v })}
                        placeholder="Resumo da avaliação..." minRows={2} />
                </div>
            )
        }

        case 'blog_divider':
            return <div className="h-px bg-border my-1 rounded" />

        case 'blog_ad':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-amber-400/40 bg-amber-400/[.04]">
                        <span className="text-amber-500 text-xs font-bold uppercase tracking-wide shrink-0">AD</span>
                        <span className="text-xs text-muted flex-1">Slot de anúncio — exibido automaticamente na renderização</span>
                    </div>
                    <input value={block.label || ''} onChange={e => onChange({ ...block, label: e.target.value })}
                        placeholder="Rótulo interno (ex: entre parágrafos 3 e 4)..."
                        className={inputCls} />
                </div>
            )

        case 'blog_callout': {
            const calloutStyles = {
                fact:    { bar: 'bg-pink-500',   bg: 'bg-pink-500/10',   text: 'text-pink-300',   emoji: '✨' },
                stat:    { bar: 'bg-amber-500',  bg: 'bg-amber-500/10',  text: 'text-amber-300',  emoji: '📊' },
                info:    { bar: 'bg-blue-500',   bg: 'bg-blue-500/10',   text: 'text-blue-300',   emoji: 'ℹ️' },
                warning: { bar: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-300', emoji: '⚠️' },
            } as const
            const cs = calloutStyles[block.variant ?? 'fact']
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
                    {(block.title || block.text) && (
                        <div className={`flex gap-3 rounded-lg p-3 ${cs.bg} border border-current/10 border-opacity-20`}>
                            <div className={`w-1 rounded-full shrink-0 self-stretch ${cs.bar}`} />
                            <div className="min-w-0 space-y-0.5">
                                {block.title && <p className={`text-xs font-bold ${cs.text}`}>{cs.emoji} {block.title}</p>}
                                {block.text && <p className="text-xs text-muted/80 leading-relaxed">{block.text.slice(0, 120)}{block.text.length > 120 ? '…' : ''}</p>}
                            </div>
                        </div>
                    )}
                </div>
            )
        }
        case 'blog_curiosity':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <label className={labelCls + ' mb-0'}>Emoji</label>
                        <input value={block.emoji || ''} onChange={e => onChange({ ...block, emoji: e.target.value })}
                            placeholder="💡" className={`${inputCls} w-16 text-center text-lg`} />
                    </div>
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
                    {block.text && (
                        <div className="rounded-lg p-3 bg-amber-400/10 border border-amber-400/20 text-center">
                            <p className="text-sm font-bold text-amber-300 leading-snug">"{block.text.slice(0, 100)}{block.text.length > 100 ? '…' : ''}"</p>
                            {block.attribution && <p className="text-[10px] text-muted/60 mt-1">— {block.attribution}</p>}
                        </div>
                    )}
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
                                }} onKeyDown={e => {
                                    if (e.key === 'Tab' && !e.shiftKey) {
                                        e.preventDefault()
                                        const next = (e.currentTarget as HTMLInputElement).nextElementSibling as HTMLElement | null
                                        next?.focus()
                                    }
                                }} placeholder="2020" className={`${inputCls} w-24`} />
                                <input value={item.title} onChange={e => {
                                    const items = [...block.items]; items[i] = { ...item, title: e.target.value }
                                    onChange({ ...block, items })
                                }} onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        const items = [...block.items]
                                        items.splice(i + 1, 0, { year: '', title: '', text: '', emoji: '' })
                                        onChange({ ...block, items })
                                    }
                                    if (e.key === 'Backspace' && !item.title && !item.year && block.items.length > 1) {
                                        e.preventDefault()
                                        onChange({ ...block, items: block.items.filter((_, j) => j !== i) })
                                    }
                                }} placeholder="Marco da carreira..." className={`${inputCls} flex-1`} />
                                <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                                    className="text-muted hover:text-red-400 shrink-0">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <AutoTextarea value={item.text || ''} onChange={v => {
                                const items = [...block.items]; items[i] = { ...item, text: v }
                                onChange({ ...block, items })
                            }} minRows={2} placeholder="Detalhes opcionais..." />
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
                    <div className="grid grid-cols-2 gap-3">
                        {(['optionA', 'optionB'] as const).map((side, si) => {
                            const opt = block[side] as { label: string; imageUrl?: string }
                            return (
                                <div key={side} className="space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{si === 0 ? 'Opção A' : 'Opção B'}</p>
                                    {opt.imageUrl && (
                                        <div className="h-24 rounded-lg border border-border overflow-hidden bg-surface">
                                            <img src={opt.imageUrl} alt="" className="w-full h-full object-cover"
                                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                                        </div>
                                    )}
                                    <input value={opt.label} onChange={e => onChange({ ...block, [side]: { ...opt, label: e.target.value } })}
                                        placeholder="Rótulo..." className={inputCls} />
                                    <input value={opt.imageUrl || ''} onChange={e => onChange({ ...block, [side]: { ...opt, imageUrl: e.target.value } })}
                                        placeholder="Foto URL (opcional)..." className={inputCls} />
                                </div>
                            )
                        })}
                    </div>
                </div>
            )

        case 'blog_poll':
            return (
                <div className="space-y-2">
                    <input value={block.question} onChange={e => onChange({ ...block, question: e.target.value })}
                        placeholder="Pergunta da enquete..." className={inputCls} />
                    <StringListInput
                        items={block.options}
                        onChange={options => onChange({ ...block, options })}
                        placeholder={i => `Opção ${i + 1}`}
                        addLabel="Adicionar opção"
                        accentClass="hover:text-cyan-400"
                    />
                </div>
            )

        case 'blog_lyrics':
            return <LyricsBlockEditor block={block} onChange={onChange} />

        case 'blog_era_card':
            return (
                <div className="space-y-2">
                    <input value={block.era} onChange={e => onChange({ ...block, era: e.target.value })}
                        placeholder="Nome da era (ex: DRAMA era)" className={inputCls} />
                    <input value={block.period} onChange={e => onChange({ ...block, period: e.target.value })}
                        placeholder="Período (ex: 2023–2024)" className={inputCls} />
                    <input value={block.concept || ''} onChange={e => onChange({ ...block, concept: e.target.value })}
                        placeholder="Conceito da era..." className={inputCls} />
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {(block.colors ?? []).filter(c => /^#[0-9a-fA-F]{3,6}$/.test(c)).map((c, i) => (
                                <div key={i} className="w-6 h-6 rounded-full border border-border/60 shrink-0"
                                    style={{ backgroundColor: c }} title={c} />
                            ))}
                        </div>
                        <input value={(block.colors ?? []).join(', ')} onChange={e => onChange({ ...block, colors: e.target.value.split(',').map(c => c.trim()) })}
                            placeholder="Cores hex separadas por vírgula (ex: #FF6B9D, #9C27B0)" className={inputCls} />
                    </div>
                    {block.imageUrl && (
                        <div className="h-28 rounded-lg border border-border overflow-hidden bg-surface">
                            <img src={block.imageUrl} alt="" className="w-full h-full object-cover"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                        </div>
                    )}
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
                            }} onKeyDown={e => {
                                if (e.key === 'Enter') { e.preventDefault(); const en = [...block.entries]; en.splice(i + 1, 0, { date: '', position: 1, label: '' }); onChange({ ...block, entries: en }) }
                                if (e.key === 'Backspace' && !entry.label && !entry.date && block.entries.length > 1) { e.preventDefault(); onChange({ ...block, entries: block.entries.filter((_, j) => j !== i) }) }
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
                            {block[side].url && (
                                <div className="h-28 rounded-lg border border-border overflow-hidden bg-surface">
                                    <img src={block[side].url} alt="" className="w-full h-full object-cover"
                                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                                </div>
                            )}
                            <input value={block[side].url} onChange={e => onChange({ ...block, [side]: { ...block[side], url: e.target.value } })}
                                placeholder="URL da imagem..." className={inputCls} />
                            <input value={block[side].label} onChange={e => onChange({ ...block, [side]: { ...block[side], label: e.target.value } })}
                                placeholder="Rótulo..." className={inputCls} />
                        </div>
                    ))}
                </div>
            )

        case 'blog_fandom':
            return <FandomBlockEditor block={block} onChange={onChange} />

        case 'blog_lightstick':
            return (
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <input value={block.group} onChange={e => onChange({ ...block, group: e.target.value })}
                            placeholder="Grupo (ex: aespa)" className={inputCls} />
                        <input value={block.name} onChange={e => onChange({ ...block, name: e.target.value })}
                            placeholder="Nome do lightstick (ex: MY Stick)" className={inputCls} />
                    </div>
                    <div className="space-y-1">
                        {block.colors.filter(c => /^#[0-9a-fA-F]{3,6}$/.test(c)).length > 0 && (
                            <div className="flex items-center gap-2">
                                {block.colors.filter(c => /^#[0-9a-fA-F]{3,6}$/.test(c)).map((c, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full border border-border/60 shrink-0"
                                        style={{ backgroundColor: c }} title={c} />
                                ))}
                            </div>
                        )}
                        <input value={block.colors.join(', ')} onChange={e => onChange({ ...block, colors: e.target.value.split(',').map(c => c.trim()) })}
                            placeholder="Cores separadas por vírgula (ex: #FF6B9D, #9C27B0)" className={inputCls} />
                    </div>
                    {block.imageUrl && (
                        <div className="h-28 rounded-lg border border-border overflow-hidden bg-surface">
                            <img src={block.imageUrl} alt="" className="w-full h-full object-contain p-2"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                        </div>
                    )}
                    <input value={block.imageUrl || ''} onChange={e => onChange({ ...block, imageUrl: e.target.value })}
                        placeholder="URL da imagem (opcional)" className={inputCls} />
                </div>
            )

        case 'blog_positions':
            return (
                <div className="space-y-2">
                    {block.members.map((member, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <div className="w-8 h-8 rounded-full border border-border overflow-hidden shrink-0 bg-surface flex items-center justify-center">
                                {member.imageUrl
                                    ? <img src={member.imageUrl} alt="" className="w-full h-full object-cover object-top"
                                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                                    : <User className="w-3.5 h-3.5 text-muted/40" />}
                            </div>
                            <input value={member.imageUrl || ''} onChange={e => {
                                const members = [...block.members]; members[i] = { ...member, imageUrl: e.target.value }
                                onChange({ ...block, members })
                            }} placeholder="Foto URL" className={`${inputCls} w-24`} />
                            <input value={member.name} onChange={e => {
                                const members = [...block.members]; members[i] = { ...member, name: e.target.value }
                                onChange({ ...block, members })
                            }} onKeyDown={e => {
                                if (e.key === 'Enter') { e.preventDefault(); const m = [...block.members]; m.splice(i + 1, 0, { name: '', positions: [''], imageUrl: '' }); onChange({ ...block, members: m }) }
                                if (e.key === 'Backspace' && !member.name && block.members.length > 1) { e.preventDefault(); onChange({ ...block, members: block.members.filter((_, j) => j !== i) }) }
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
                                    }} onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            const questions = [...block.questions]
                                            const options = [...q.options]; options.splice(oi + 1, 0, '')
                                            questions[i] = { ...q, options }
                                            onChange({ ...block, questions })
                                        }
                                        if (e.key === 'Backspace' && !opt && q.options.length > 2) {
                                            e.preventDefault()
                                            const questions = [...block.questions]
                                            const options = q.options.filter((_, j) => j !== oi)
                                            const correct = q.correct >= oi && q.correct > 0 ? q.correct - 1 : q.correct
                                            questions[i] = { ...q, options, correct }
                                            onChange({ ...block, questions })
                                        }
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

        case 'blog_countdown': {
            const daysRemaining = block.targetDate
                ? Math.ceil((new Date(block.targetDate).getTime() - Date.now()) / 86400000)
                : null
            return (
                <div className="space-y-2">
                    <input value={block.title} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Título (ex: Comeback de)" className={inputCls} />
                    <input value={block.artist} onChange={e => onChange({ ...block, artist: e.target.value })}
                        placeholder="Nome do artista/grupo..." className={inputCls} />
                    <div className="space-y-1">
                        <input type="datetime-local" value={block.targetDate} onChange={e => onChange({ ...block, targetDate: e.target.value })}
                            className={inputCls} />
                        {daysRemaining !== null && (
                            <p className={`text-[11px] ${daysRemaining > 0 ? 'text-orange-400' : daysRemaining === 0 ? 'text-green-400' : 'text-muted'}`}>
                                {daysRemaining > 0 ? `${daysRemaining} dia(s) restante(s)` : daysRemaining === 0 ? 'Hoje!' : `Encerrado há ${Math.abs(daysRemaining)} dia(s)`}
                            </p>
                        )}
                    </div>
                </div>
            )
        }

        case 'blog_discography_grid':
            return (
                <div className="space-y-2">
                    <input value={block.artist} onChange={e => onChange({ ...block, artist: e.target.value })}
                        placeholder="Nome do artista/grupo..." className={inputCls} />
                    {block.albums.map((album, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <div className="w-10 h-10 rounded-md border border-border overflow-hidden shrink-0 bg-surface flex items-center justify-center">
                                {album.imageUrl
                                    ? <img src={album.imageUrl} alt="" className="w-full h-full object-cover"
                                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                                    : <GalleryHorizontal className="w-4 h-4 text-muted/40" />}
                            </div>
                            <input value={album.imageUrl || ''} onChange={e => {
                                const albums = [...block.albums]; albums[i] = { ...album, imageUrl: e.target.value }
                                onChange({ ...block, albums })
                            }} placeholder="URL da capa" className={`${inputCls} w-28`} />
                            <input value={album.title} onChange={e => {
                                const albums = [...block.albums]; albums[i] = { ...album, title: e.target.value }
                                onChange({ ...block, albums })
                            }} onKeyDown={e => {
                                if (e.key === 'Tab' && !e.shiftKey) {
                                    e.preventDefault()
                                    const next = (e.currentTarget as HTMLInputElement).nextElementSibling as HTMLElement | null
                                    next?.focus()
                                }
                                if (e.key === 'Enter') { e.preventDefault(); const a = [...block.albums]; a.splice(i + 1, 0, { title: '', year: '', imageUrl: '', type: 'Album' }); onChange({ ...block, albums: a }) }
                                if (e.key === 'Backspace' && !album.title && block.albums.length > 1) { e.preventDefault(); onChange({ ...block, albums: block.albums.filter((_, j) => j !== i) }) }
                            }} placeholder="Título" className={`${inputCls} flex-1`} />
                            <input value={album.year || ''} onChange={e => {
                                const albums = [...block.albums]; albums[i] = { ...album, year: e.target.value }
                                onChange({ ...block, albums })
                            }} onKeyDown={e => {
                                if (e.key === 'Enter') { e.preventDefault(); const a = [...block.albums]; a.splice(i + 1, 0, { title: '', year: '', imageUrl: '', type: 'Album' }); onChange({ ...block, albums: a }) }
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
                            }} onKeyDown={e => {
                                if (e.key === 'Tab' && !e.shiftKey) {
                                    e.preventDefault()
                                    const next = (e.currentTarget as HTMLInputElement).nextElementSibling as HTMLElement | null
                                    next?.focus()
                                }
                            }} className={`${inputCls} w-14 text-center`} />
                            <input value={item.title} onChange={e => {
                                const items = [...block.items]; items[i] = { ...item, title: e.target.value }
                                onChange({ ...block, items })
                            }} onKeyDown={e => {
                                if (e.key === 'Tab' && !e.shiftKey) {
                                    e.preventDefault()
                                    const next = (e.currentTarget as HTMLInputElement).nextElementSibling as HTMLElement | null
                                    next?.focus()
                                }
                                if (e.key === 'Enter') { e.preventDefault(); onChange({ ...block, items: [...block.items.slice(0, i + 1), { icon: '🏆', title: '', description: '' }, ...block.items.slice(i + 1)] }) }
                                if (e.key === 'Backspace' && !item.title && block.items.length > 1) { e.preventDefault(); onChange({ ...block, items: block.items.filter((_, j) => j !== i) }) }
                            }} placeholder="Conquista..." className={`${inputCls} flex-1`} />
                            <input value={item.description} onChange={e => {
                                const items = [...block.items]; items[i] = { ...item, description: e.target.value }
                                onChange({ ...block, items })
                            }} onKeyDown={e => {
                                if (e.key === 'Enter') { e.preventDefault(); onChange({ ...block, items: [...block.items.slice(0, i + 1), { icon: '🏆', title: '', description: '' }, ...block.items.slice(i + 1)] }) }
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
                    <input value={block.videoId} onChange={e => {
                        const raw = e.target.value
                        const match = raw.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/)
                        onChange({ ...block, videoId: match ? match[1] : raw })
                    }} placeholder="YouTube URL ou video ID (ex: dQw4w9WgXcQ)" className={inputCls} />
                    {block.videoId && block.videoId.length === 11 && (
                        <div className="relative rounded-lg overflow-hidden border border-border h-24 bg-surface group/mvthumb cursor-pointer"
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${block.videoId}`, '_blank')}>
                            <img src={`https://img.youtube.com/vi/${block.videoId}/hqdefault.jpg`}
                                alt="thumbnail" className="w-full h-full object-cover"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/mvthumb:opacity-100 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                                    <Video className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <span className="absolute bottom-1 right-1 text-[10px] font-mono bg-black/70 text-white px-1.5 py-0.5 rounded">{block.videoId}</span>
                        </div>
                    )}
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
                            }} onKeyDown={e => {
                                if (e.key === 'Enter') { e.preventDefault(); const s = [...block.scenes]; s.splice(i + 1, 0, { time: '0:00', label: '', description: '' }); onChange({ ...block, scenes: s }) }
                                if (e.key === 'Backspace' && !scene.label && block.scenes.length > 1) { e.preventDefault(); onChange({ ...block, scenes: block.scenes.filter((_, j) => j !== i) }) }
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
                    {/* Column headers */}
                    <div className="grid grid-cols-2 gap-2 px-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Frente</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Verso</span>
                    </div>
                    {block.cards.map((card, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2 items-start group/card">
                            <AutoTextarea value={card.front} onChange={v => {
                                const cards = [...block.cards]; cards[i] = { ...card, front: v }
                                onChange({ ...block, cards })
                            }} minRows={2} placeholder="Pergunta / termo..." />
                            <div className="flex gap-1 items-start">
                                <AutoTextarea value={card.back} onChange={v => {
                                    const cards = [...block.cards]; cards[i] = { ...card, back: v }
                                    onChange({ ...block, cards })
                                }} minRows={2} placeholder="Resposta / definição..." className="flex-1" />
                                <button onClick={() => onChange({ ...block, cards: block.cards.filter((_, j) => j !== i) })}
                                    className="opacity-0 group-hover/card:opacity-100 text-muted hover:text-red-400 pt-2 shrink-0 transition-opacity">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, cards: [...block.cards, { front: '', back: '' }] })}
                        className="text-xs text-muted hover:text-purple-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar card
                    </button>
                </div>
            )

        case 'blog_list':
            return <ListBlockEditor block={block} onChange={onChange} />

        case 'blog_pros_cons':
            return <ProsConsBlockEditor block={block} onChange={onChange} />

        case 'blog_steps':
            return (
                <div className="space-y-2">
                    <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Título da sequência (opcional)..." className={inputCls} />
                    {block.steps.map((step, i) => (
                        <div key={i} className="step-item p-3 rounded-lg border border-border bg-background space-y-1.5">
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-bold text-orange-400 shrink-0 w-5">{i + 1}</span>
                                <input value={step.title} onChange={e => {
                                    const steps = [...block.steps]; steps[i] = { ...step, title: e.target.value }
                                    onChange({ ...block, steps })
                                }} onKeyDown={e => {
                                    if (e.key === 'Tab' && !e.shiftKey) {
                                        e.preventDefault()
                                        const ta = (e.currentTarget as HTMLInputElement).closest('.step-item')?.querySelector('textarea')
                                        ;(ta as HTMLElement | null)?.focus()
                                    }
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        const steps = [...block.steps]
                                        steps.splice(i + 1, 0, { title: '', text: '' })
                                        onChange({ ...block, steps })
                                    }
                                    if (e.key === 'Backspace' && !step.title && !step.text && block.steps.length > 1) {
                                        e.preventDefault()
                                        onChange({ ...block, steps: block.steps.filter((_, j) => j !== i) })
                                    }
                                }} placeholder="Título do passo..." className={`${inputCls} flex-1`} />
                                <button onClick={() => onChange({ ...block, steps: block.steps.filter((_, j) => j !== i) })}
                                    className="text-muted hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
                            </div>
                            <AutoTextarea value={step.text} onChange={v => {
                                const steps = [...block.steps]; steps[i] = { ...step, text: v }
                                onChange({ ...block, steps })
                            }} minRows={2} placeholder="Descrição do passo..." />
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, steps: [...block.steps, { title: '', text: '' }] })}
                        className="text-xs text-muted hover:text-orange-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar passo
                    </button>
                </div>
            )

        case 'blog_accordion':
            return (
                <div className="space-y-2">
                    <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Título do acordeão (opcional)..." className={inputCls} />
                    {block.items.map((item, i) => (
                        <div key={i} className="accordion-item p-3 rounded-lg border border-border bg-background space-y-1.5">
                            <div className="flex gap-2 items-center">
                                <input value={item.question} onChange={e => {
                                    const items = [...block.items]; items[i] = { ...item, question: e.target.value }
                                    onChange({ ...block, items })
                                }} onKeyDown={e => {
                                    if (e.key === 'Tab' && !e.shiftKey) {
                                        e.preventDefault()
                                        const ta = (e.currentTarget as HTMLInputElement).closest('.accordion-item')?.querySelector('textarea')
                                        ;(ta as HTMLElement | null)?.focus()
                                    }
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        const items = [...block.items]
                                        items.splice(i + 1, 0, { question: '', answer: '' })
                                        onChange({ ...block, items })
                                    }
                                    if (e.key === 'Backspace' && !item.question && !item.answer && block.items.length > 1) {
                                        e.preventDefault()
                                        onChange({ ...block, items: block.items.filter((_, j) => j !== i) })
                                    }
                                }} placeholder="Pergunta / título da seção..." className={`${inputCls} flex-1`} />
                                <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                                    className="text-muted hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
                            </div>
                            <AutoTextarea value={item.answer} onChange={v => {
                                const items = [...block.items]; items[i] = { ...item, answer: v }
                                onChange({ ...block, items })
                            }} minRows={2} placeholder="Resposta / conteúdo expandido..." />
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, items: [...block.items, { question: '', answer: '' }] })}
                        className="text-xs text-muted hover:text-violet-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar item
                    </button>
                </div>
            )

        case 'blog_tabs':
            return (
                <div className="space-y-2">
                    {block.tabs.map((tab, i) => (
                        <div key={i} className="tab-item p-3 rounded-lg border border-border bg-background space-y-1.5">
                            <div className="flex gap-2 items-center">
                                <input value={tab.label} onChange={e => {
                                    const tabs = [...block.tabs]; tabs[i] = { ...tab, label: e.target.value }
                                    onChange({ ...block, tabs })
                                }} onKeyDown={e => {
                                    if (e.key === 'Tab' && !e.shiftKey) {
                                        e.preventDefault()
                                        const ta = (e.currentTarget as HTMLInputElement).closest('.tab-item')?.querySelector('textarea')
                                        ;(ta as HTMLElement | null)?.focus()
                                    }
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        const tabs = [...block.tabs]
                                        tabs.splice(i + 1, 0, { label: `Aba ${block.tabs.length + 1}`, content: '' })
                                        onChange({ ...block, tabs })
                                    }
                                    if (e.key === 'Backspace' && !tab.label && !tab.content && block.tabs.length > 1) {
                                        e.preventDefault()
                                        onChange({ ...block, tabs: block.tabs.filter((_, j) => j !== i) })
                                    }
                                }} placeholder="Nome da aba..." className={`${inputCls} w-40 shrink-0`} />
                                <button onClick={() => onChange({ ...block, tabs: block.tabs.filter((_, j) => j !== i) })}
                                    className="text-muted hover:text-red-400 ml-auto"><X className="w-4 h-4" /></button>
                            </div>
                            <AutoTextarea value={tab.content} onChange={v => {
                                const tabs = [...block.tabs]; tabs[i] = { ...tab, content: v }
                                onChange({ ...block, tabs })
                            }} minRows={3} placeholder="Conteúdo da aba... (**negrito**, [link](url))" />
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, tabs: [...block.tabs, { label: `Aba ${block.tabs.length + 1}`, content: '' }] })}
                        className="text-xs text-muted hover:text-blue-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar aba
                    </button>
                </div>
            )

        case 'blog_comparison': {
            const cols = block.columns
            const LABEL_W = 140
            // grid: label col + N value cols + delete col
            const gridStyle = {
                display: 'grid',
                gridTemplateColumns: `${LABEL_W}px repeat(${cols.length}, 1fr) 28px`,
                gap: '4px',
                alignItems: 'center',
            }
            return (
                <div className="space-y-2">
                    <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Título da tabela (opcional)..." className={inputCls} />

                    {/* Header row */}
                    <div style={gridStyle}>
                        {/* Critério label */}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">Critério</span>
                        {/* Column name inputs */}
                        {cols.map((col, ci) => (
                            <div key={ci} className="flex items-center gap-1">
                                <input
                                    value={col}
                                    onChange={e => {
                                        const columns = [...cols]; columns[ci] = e.target.value
                                        onChange({ ...block, columns })
                                    }}
                                    placeholder={`Coluna ${ci + 1}`}
                                    className={`${inputCls} flex-1 text-center font-semibold text-xs`}
                                />
                                {cols.length > 2 && (
                                    <button onClick={() => {
                                        const columns = cols.filter((_, j) => j !== ci)
                                        const rows = block.rows.map(r => ({ ...r, values: r.values.filter((_, j) => j !== ci) }))
                                        onChange({ ...block, columns, rows })
                                    }} className="text-muted hover:text-red-400 shrink-0 p-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {/* Add column button */}
                        <div>
                            {cols.length < 5 && (
                                <button onClick={() => {
                                    const columns = [...cols, `Opção ${cols.length + 1}`]
                                    const rows = block.rows.map(r => ({ ...r, values: [...r.values, ''] }))
                                    onChange({ ...block, columns, rows })
                                }} title="Adicionar coluna"
                                    className="w-7 h-7 flex items-center justify-center rounded-md border border-dashed border-border text-muted hover:text-cyan-400 hover:border-cyan-500/40 transition-colors text-xs">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/60" />

                    {/* Data rows */}
                    {block.rows.map((row, ri) => (
                        <div key={ri} style={gridStyle}>
                            <input
                                value={row.label}
                                onChange={e => {
                                    const rows = [...block.rows]; rows[ri] = { ...row, label: e.target.value }
                                    onChange({ ...block, rows })
                                }}
                                placeholder="Critério..."
                                className={`${inputCls} text-xs font-medium`}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        const rows = [...block.rows]
                                        rows.splice(ri + 1, 0, { label: '', values: cols.map(() => '') })
                                        onChange({ ...block, rows })
                                    }
                                    if (e.key === 'Backspace' && !row.label && block.rows.length > 1) {
                                        e.preventDefault()
                                        onChange({ ...block, rows: block.rows.filter((_, j) => j !== ri) })
                                    }
                                }}
                            />
                            {row.values.map((val, vi) => (
                                <input key={vi} value={val} onChange={e => {
                                    const rows = [...block.rows]
                                    const values = [...row.values]; values[vi] = e.target.value
                                    rows[ri] = { ...row, values }
                                    onChange({ ...block, rows })
                                }}
                                placeholder="—"
                                className={`${inputCls} text-xs text-center`}
                                />
                            ))}
                            <button tabIndex={-1} onClick={() => onChange({ ...block, rows: block.rows.filter((_, j) => j !== ri) })}
                                className="flex items-center justify-center text-muted hover:text-red-400 transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}

                    <button onClick={() => onChange({ ...block, rows: [...block.rows, { label: '', values: cols.map(() => '') }] })}
                        className="text-xs text-muted hover:text-cyan-400 flex items-center gap-1 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Adicionar linha
                    </button>
                </div>
            )
        }

        case 'blog_ranking':
            return (
                <div className="space-y-2">
                    <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Título do ranking (opcional)..." className={inputCls} />
                    {block.items.map((item, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <span className="text-xs font-bold text-yellow-400 shrink-0 w-5 text-right tabular-nums">{item.position}</span>
                            <div className="w-8 h-8 rounded-lg border border-border overflow-hidden shrink-0 bg-surface flex items-center justify-center">
                                {item.imageUrl
                                    ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover"
                                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                                    : <span className="text-[10px] text-muted/40">#{i+1}</span>}
                            </div>
                            <input value={item.imageUrl || ''} onChange={e => {
                                const items = [...block.items]; items[i] = { ...item, imageUrl: e.target.value }
                                onChange({ ...block, items })
                            }} placeholder="Foto URL" className={`${inputCls} w-28`} />
                            <input value={item.name} onChange={e => {
                                const items = [...block.items]; items[i] = { ...item, name: e.target.value }
                                onChange({ ...block, items })
                            }} onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    const items = [...block.items]
                                    items.splice(i + 1, 0, { position: i + 2, name: '' })
                                    const renum = items.map((it, j) => ({ ...it, position: j + 1 }))
                                    onChange({ ...block, items: renum })
                                }
                                if (e.key === 'Backspace' && !item.name && block.items.length > 1) {
                                    e.preventDefault()
                                    const items = block.items.filter((_, j) => j !== i).map((it, j) => ({ ...it, position: j + 1 }))
                                    onChange({ ...block, items })
                                }
                            }} placeholder="Nome..." className={`${inputCls} flex-1`} />
                            <input value={(item as { description?: string }).description || ''} onChange={e => {
                                const items = [...block.items]; items[i] = { ...item, description: e.target.value } as typeof item
                                onChange({ ...block, items })
                            }} placeholder="Descrição..." className={`${inputCls} w-36`} />
                            <input value={item.badge || ''} onChange={e => {
                                const items = [...block.items]; items[i] = { ...item, badge: e.target.value }
                                onChange({ ...block, items })
                            }} placeholder="Badge" className={`${inputCls} w-20`} />
                            <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                                className="text-muted hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, items: [...block.items, { position: block.items.length + 1, name: '' }] })}
                        className="text-xs text-muted hover:text-yellow-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar item
                    </button>
                </div>
            )

        case 'blog_member_grid':
            return (
                <div className="space-y-2">
                    <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Título (ex: Integrantes)..." className={inputCls} />
                    {block.members.map((member, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <div className="w-10 h-10 rounded-lg border border-border overflow-hidden shrink-0 bg-surface flex items-center justify-center">
                                {member.imageUrl
                                    ? <img src={member.imageUrl} alt="" className="w-full h-full object-cover"
                                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                                    : <User className="w-4 h-4 text-muted/40" />}
                            </div>
                            <input value={member.imageUrl || ''} onChange={e => {
                                const members = [...block.members]; members[i] = { ...member, imageUrl: e.target.value }
                                onChange({ ...block, members })
                            }} placeholder="Foto URL..." className={`${inputCls} w-28`} />
                            <input value={member.name} onChange={e => {
                                const members = [...block.members]; members[i] = { ...member, name: e.target.value }
                                onChange({ ...block, members })
                            }} onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    const members = [...block.members]
                                    members.splice(i + 1, 0, { name: '' })
                                    onChange({ ...block, members })
                                }
                                if (e.key === 'Backspace' && !member.name && block.members.length > 1) {
                                    e.preventDefault()
                                    onChange({ ...block, members: block.members.filter((_, j) => j !== i) })
                                }
                            }} placeholder="Nome..." className={`${inputCls} flex-1`} />
                            <input value={member.role || ''} onChange={e => {
                                const members = [...block.members]; members[i] = { ...member, role: e.target.value }
                                onChange({ ...block, members })
                            }} placeholder="Cargo..." className={`${inputCls} w-28`} />
                            <button onClick={() => onChange({ ...block, members: block.members.filter((_, j) => j !== i) })}
                                className="text-muted hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, members: [...block.members, { name: '' }] })}
                        className="text-xs text-muted hover:text-fuchsia-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar membro
                    </button>
                </div>
            )

        case 'blog_setlist':
            return <SetlistBlockEditor block={block} onChange={onChange} />

        case 'blog_idol_facts':
            return (
                <div className="space-y-2">
                    <div className="flex gap-3">
                        {block.imageUrl && (
                            <div className="w-16 h-16 rounded-lg border border-border overflow-hidden shrink-0 bg-surface">
                                <img src={block.imageUrl} alt="" className="w-full h-full object-cover object-top"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                            </div>
                        )}
                        <div className="flex-1 space-y-1.5 min-w-0">
                            <input value={block.name} onChange={e => onChange({ ...block, name: e.target.value })}
                                placeholder="Nome do idol..." className={inputCls} />
                            <input value={block.imageUrl || ''} onChange={e => onChange({ ...block, imageUrl: e.target.value })}
                                placeholder="Foto URL (opcional)..." className={inputCls} />
                        </div>
                    </div>
                    {block.facts.map((fact, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <input value={fact.label} onChange={e => {
                                const facts = [...block.facts]; facts[i] = { ...fact, label: e.target.value }
                                onChange({ ...block, facts })
                            }} onKeyDown={e => {
                                if (e.key === 'Tab' && !e.shiftKey) {
                                    e.preventDefault()
                                    const next = (e.currentTarget as HTMLInputElement).nextElementSibling as HTMLElement | null
                                    next?.focus()
                                }
                            }} placeholder="Rótulo (ex: Altura)..." className={`${inputCls} w-32 shrink-0`} />
                            <input value={fact.value} onChange={e => {
                                const facts = [...block.facts]; facts[i] = { ...fact, value: e.target.value }
                                onChange({ ...block, facts })
                            }} onKeyDown={e => {
                                if (e.key === 'Enter') { e.preventDefault(); const f = [...block.facts]; f.splice(i + 1, 0, { label: '', value: '' }); onChange({ ...block, facts: f }) }
                                if (e.key === 'Backspace' && !fact.value && !fact.label && block.facts.length > 1) { e.preventDefault(); onChange({ ...block, facts: block.facts.filter((_, j) => j !== i) }) }
                            }} placeholder="Valor (ex: 182cm)..." className={`${inputCls} flex-1`} />
                            <button onClick={() => onChange({ ...block, facts: block.facts.filter((_, j) => j !== i) })}
                                className="text-muted hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <button onClick={() => onChange({ ...block, facts: [...block.facts, { label: '', value: '' }] })}
                        className="text-xs text-muted hover:text-pink-400 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Adicionar fato
                    </button>
                </div>
            )

        case 'blog_product_card':
            return (
                <div className="space-y-2">
                    <div className="flex gap-3">
                        {block.imageUrl && (
                            <div className="w-20 h-20 rounded-lg border border-border overflow-hidden shrink-0 bg-surface">
                                <img src={block.imageUrl} alt="" className="w-full h-full object-cover"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                            </div>
                        )}
                        <div className="flex-1 space-y-2 min-w-0">
                            <input value={block.imageUrl} onChange={e => onChange({ ...block, imageUrl: e.target.value })}
                                placeholder="URL da imagem..." className={inputCls} />
                            <input value={block.name} onChange={e => onChange({ ...block, name: e.target.value })}
                                placeholder="Nome do produto..." className={inputCls} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <input value={block.price} onChange={e => onChange({ ...block, price: e.target.value })}
                            placeholder="Preço (ex: R$ 49,90)" className={inputCls} />
                        <input value={block.originalPrice || ''} onChange={e => onChange({ ...block, originalPrice: e.target.value })}
                            placeholder="Preço original (opcional)" className={inputCls} />
                        <input value={block.badge || ''} onChange={e => onChange({ ...block, badge: e.target.value })}
                            placeholder="Badge (ex: Mais vendido)" className={inputCls} />
                    </div>
                    <input value={block.affiliateUrl} onChange={e => onChange({ ...block, affiliateUrl: e.target.value })}
                        placeholder="URL afiliado / compra..." className={inputCls} />
                    <div className="flex gap-2">
                        <input value={block.cta || ''} onChange={e => onChange({ ...block, cta: e.target.value })}
                            placeholder="Texto do botão (ex: Comprar agora)" className={`${inputCls} flex-1`} />
                        <div className="flex items-center gap-2">
                            <label className={labelCls + ' mb-0'}>Nota</label>
                            <input type="number" min={0} max={5} step={0.5} value={block.rating ?? ''}
                                onChange={e => onChange({ ...block, rating: parseFloat(e.target.value) || undefined })}
                                className="w-16 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-yellow-500/50" />
                        </div>
                    </div>
                </div>
            )

        case 'blog_trivia':
            return (
                <div className="space-y-2">
                    <input value={block.question} onChange={e => onChange({ ...block, question: e.target.value })}
                        placeholder="Pergunta..." className={inputCls} />
                    <input value={block.hint || ''} onChange={e => onChange({ ...block, hint: e.target.value })}
                        placeholder="Dica (opcional)..." className={inputCls} />
                    <AutoTextarea value={block.answer} onChange={v => onChange({ ...block, answer: v })}
                        minRows={2} placeholder="Resposta (revelada ao clicar)..." />
                </div>
            )

        case 'blog_comeback_card':
            return (
                <div className="space-y-2">
                    <div className="flex gap-3">
                        {block.imageUrl && (
                            <div className="w-20 h-20 rounded-lg border border-border overflow-hidden shrink-0 bg-surface">
                                <img src={block.imageUrl} alt="" className="w-full h-full object-cover"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                            </div>
                        )}
                        <div className="flex-1 space-y-2 min-w-0">
                            <div className="grid grid-cols-2 gap-2">
                                <input value={block.artist} onChange={e => onChange({ ...block, artist: e.target.value })}
                                    onKeyDown={e => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus() } }}
                                    placeholder="Artista / grupo..." className={inputCls} />
                                <input value={block.title} onChange={e => onChange({ ...block, title: e.target.value })}
                                    placeholder="Título do lançamento..." className={inputCls} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input value={block.date} onChange={e => onChange({ ...block, date: e.target.value })}
                                    onKeyDown={e => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus() } }}
                                    placeholder="Data (ex: 2025-06-15)..." className={inputCls} />
                                <input value={block.type_label || ''} onChange={e => onChange({ ...block, type_label: e.target.value })}
                                    placeholder="Tipo (Mini Album, Single...)" className={inputCls} />
                            </div>
                        </div>
                    </div>
                    <input value={block.imageUrl || ''} onChange={e => onChange({ ...block, imageUrl: e.target.value })}
                        placeholder="URL da capa (opcional)..." className={inputCls} />
                    <AutoTextarea value={block.description || ''} onChange={v => onChange({ ...block, description: v })}
                        minRows={2} placeholder="Descrição (opcional)..." />
                </div>
            )

        case 'blog_alert': {
            const alertStyles = {
                info:    { bar: 'bg-blue-500',    bg: 'bg-blue-500/10',    text: 'text-blue-300',    emoji: 'ℹ️' },
                tip:     { bar: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-300', emoji: '💡' },
                warning: { bar: 'bg-orange-500',  bg: 'bg-orange-500/10',  text: 'text-orange-300',  emoji: '⚠️' },
                spoiler: { bar: 'bg-purple-500',  bg: 'bg-purple-500/10',  text: 'text-purple-300',  emoji: '🔮' },
            } as const
            const as = alertStyles[block.variant ?? 'info']
            return (
                <div className="space-y-2">
                    <div className="flex gap-1">
                        {([
                            { v: 'info',    label: 'Info',    cls: 'bg-blue-600/30 border-blue-500/40 text-blue-300' },
                            { v: 'tip',     label: 'Dica',    cls: 'bg-emerald-600/30 border-emerald-500/40 text-emerald-300' },
                            { v: 'warning', label: 'Aviso',   cls: 'bg-orange-600/30 border-orange-500/40 text-orange-300' },
                            { v: 'spoiler', label: 'Spoiler', cls: 'bg-purple-600/30 border-purple-500/40 text-purple-300' },
                        ] as const).map(({ v, label, cls }) => (
                            <button key={v} onClick={() => onChange({ ...block, variant: v })}
                                className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${block.variant === v ? cls : 'border-border text-muted hover:text-foreground'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                        placeholder="Título (opcional)..." className={inputCls} />
                    <AutoTextarea value={block.text} onChange={v => onChange({ ...block, text: v })}
                        minRows={2} placeholder="Texto do alerta..." />
                    {(block.title || block.text) && (
                        <div className={`flex gap-3 rounded-lg p-3 ${as.bg}`}>
                            <div className={`w-1 rounded-full shrink-0 self-stretch ${as.bar}`} />
                            <div className="min-w-0 space-y-0.5">
                                {block.title && <p className={`text-xs font-bold ${as.text}`}>{as.emoji} {block.title}</p>}
                                {block.text && <p className="text-xs text-muted/80 leading-relaxed">{block.text.slice(0, 120)}{block.text.length > 120 ? '…' : ''}</p>}
                            </div>
                        </div>
                    )}
                </div>
            )
        }

        case 'blog_lyrics_parallel':
            return (
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <input value={block.title || ''} onChange={e => onChange({ ...block, title: e.target.value })}
                            placeholder="Título da música..." className={inputCls} />
                        <input value={block.artist || ''} onChange={e => onChange({ ...block, artist: e.target.value })}
                            placeholder="Artista..." className={inputCls} />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className={labelCls + ' mb-0'}>Idioma original</label>
                        <div className="flex gap-1">
                            {(['ko', 'en', 'ja'] as const).map(l => (
                                <button key={l} onClick={() => onChange({ ...block, lang: l })}
                                    className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${(block.lang ?? 'ko') === l ? 'bg-purple-600/30 border-purple-500/40 text-purple-300' : 'border-border text-muted hover:text-foreground'}`}>
                                    {l === 'ko' ? '한국어' : l === 'ja' ? '日本語' : 'EN'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {block.sections.map((section, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border bg-background space-y-2">
                            <div className="flex gap-2 items-center">
                                <input value={section.label || ''} onChange={e => {
                                    const sections = [...block.sections]; sections[i] = { ...section, label: e.target.value }
                                    onChange({ ...block, sections })
                                }} placeholder="Seção (Estrofe 1, Refrão...)..." className={`${inputCls} flex-1`} />
                                <button onClick={() => onChange({ ...block, sections: block.sections.filter((_, j) => j !== i) })}
                                    className="text-muted hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <AutoTextarea value={section.original} onChange={v => {
                                    const sections = [...block.sections]; sections[i] = { ...section, original: v }
                                    onChange({ ...block, sections })
                                }} minRows={3} placeholder="Original (uma linha por verso)..." />
                                <AutoTextarea value={section.translation} onChange={v => {
                                    const sections = [...block.sections]; sections[i] = { ...section, translation: v }
                                    onChange({ ...block, sections })
                                }} minRows={3} placeholder="Tradução pt-BR (uma linha por verso)..." />
                            </div>
                            <AutoTextarea value={section.romanized || ''} onChange={v => {
                                const sections = [...block.sections]; sections[i] = { ...section, romanized: v }
                                onChange({ ...block, sections })
                            }} minRows={2} placeholder="Romanização (opcional, uma linha por verso)..." />
                        </div>
                    ))}
                    <div className="flex gap-2 items-center">
                        <button onClick={() => onChange({ ...block, sections: [...block.sections, { original: '', translation: '', romanized: '' }] })}
                            className="text-xs text-muted hover:text-purple-400 flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> Adicionar seção
                        </button>
                        <input value={block.source || ''} onChange={e => onChange({ ...block, source: e.target.value })}
                            placeholder="Fonte (opcional)..." className={`${inputCls} flex-1 ml-auto`} />
                    </div>
                </div>
            )
    }
}

// ─── Block Outline panel (exported for sidebar use) ──────────────────────────

export function BlockOutlinePanel({ blocks }: { blocks: BlogBlock[] }) {
    const [open, setOpen] = useState(true)
    const [highlighted, setHighlighted] = useState<number | null>(null)

    function scrollToBlock(i: number) {
        const el = document.querySelector<HTMLElement>(`[data-block-index="${i}"]`)
        if (!el) return
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Flash highlight
        setHighlighted(i)
        el.style.transition = 'box-shadow 0.15s'
        el.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.5)'
        setTimeout(() => {
            el.style.boxShadow = ''
            setHighlighted(null)
        }, 900)
    }

    if (blocks.length === 0) return null

    return (
        <div className="space-y-1">
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-1.5 w-full text-left"
            >
                <span className="text-xs font-semibold text-muted uppercase tracking-wider flex-1">
                    Estrutura do artigo
                </span>
                <span className="text-[10px] text-muted/50 tabular-nums">{blocks.length}</span>
                <ChevronRight className={`w-3.5 h-3.5 text-muted/50 transition-transform duration-150 ${open ? 'rotate-90' : ''}`} />
            </button>
            {open && (
                <div className="space-y-0.5 max-h-80 overflow-y-auto rounded-lg border border-border p-1 bg-surface/50">
                    {blocks.map((block, i) => (
                        <button
                            key={i}
                            onClick={() => scrollToBlock(i)}
                            className={`flex items-center gap-2 w-full px-2 py-1 rounded-md transition-colors text-left group ${highlighted === i ? 'bg-purple-500/15 text-foreground' : 'hover:bg-surface-hover'}`}
                        >
                            <span className={`inline-flex items-center justify-center w-4 h-4 rounded border shrink-0 ${COLORS[block.type]}`}>
                                {ICONS[block.type]}
                            </span>
                            <span className="text-[10px] text-muted/40 tabular-nums shrink-0 w-4">{i + 1}</span>
                            <span className="text-[11px] text-muted group-hover:text-foreground truncate leading-tight">
                                {blockPreview(block)}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Block preview (collapsed state) ─────────────────────────────────────────

function blockPreview(block: BlogBlock): string {
    switch (block.type) {
        case 'blog_heading':         return block.text || '(sem texto)'
        case 'blog_paragraph':       return block.text ? block.text.slice(0, 80) + (block.text.length > 80 ? '…' : '') : '(vazio)'
        case 'blog_quote':           return block.text ? `"${block.text.slice(0, 60)}"` : '(vazio)'
        case 'blog_image':           return block.caption || block.url.split('/').pop() || block.url.slice(0, 50) || '(sem URL)'
        case 'blog_gallery':         return `${block.urls.length} imagem(ns)`
        case 'blog_video': {
            const m = block.url?.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/)
            return m ? `youtube.com/watch?v=${m[1]}` : block.url || '(sem URL)'
        }
        case 'blog_twitter':         return block.url || '(sem URL)'
        case 'blog_instagram':       return block.url || '(sem URL)'
        case 'blog_tiktok':          return block.url || '(sem URL)'
        case 'blog_spotify':         return block.url || '(sem URL)'
        case 'blog_timeline':        return `${block.items.length} marco(s)${block.items[0]?.year ? ` — de ${block.items[0].year}` : ''}`
        case 'blog_artist_card':     return block._label || (block.artistId ? block.artistId.slice(0, 24) + '…' : '(sem artista)')
        case 'blog_group_card':      return block._label || (block.groupId ? block.groupId.slice(0, 24) + '…' : '(sem grupo)')
        case 'blog_production_card': return block._label || (block.productionId ? block.productionId.slice(0, 24) + '…' : '(sem produção)')
        case 'blog_stats_row': {
            const first = block.items[0]
            return first?.label ? `${first.label}: ${first.value}${block.items.length > 1 ? ` +${block.items.length - 1}` : ''}` : `${block.items.length} campo(s)`
        }
        case 'blog_rating':          return `Nota: ${block.score}/10${block.label ? ` — ${block.label}` : ''}`
        case 'blog_divider':         return '───✦───'
        case 'blog_ad':              return block.label || 'Slot de anúncio'
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
        case 'blog_idol_facts': {
            const firstFact = block.facts[0]
            return block.name ? `${block.name}${firstFact?.label ? ` · ${firstFact.label}: ${firstFact.value}` : ` — ${block.facts.length} fato(s)`}` : '(sem nome)'
        }
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
    block, index, total, onChange, onDelete, onMoveUp, onMoveDown, onDuplicate, forceCollapsed, fresh, onFreshHandled,
}: {
    block: BlogBlock; index: number; total: number
    onChange: (b: BlogBlock) => void
    onDelete: () => void
    onMoveUp: () => void
    onMoveDown: () => void
    onDuplicate: () => void
    forceCollapsed?: boolean
    fresh?: boolean
    onFreshHandled?: () => void
}) {
    const [collapsed, setCollapsed] = useState(false)
    const [showTypeSwitcher, setShowTypeSwitcher] = useState(false)
    const fieldRef = useRef<HTMLDivElement>(null)

    // Extract text content for smart type conversion
    function extractText(b: BlogBlock): string {
        const bx = b as Record<string, unknown>
        if (typeof bx.text === 'string') return bx.text
        if (typeof bx.title === 'string') return bx.title
        if (Array.isArray(bx.items) && typeof (bx.items as unknown[])[0] === 'string') return (bx.items as string[]).join('\n')
        return ''
    }

    const TEXT_TYPES = new Set<BlogBlockType>(['blog_paragraph', 'blog_heading', 'blog_quote', 'blog_curiosity', 'blog_highlight', 'blog_callout', 'blog_list', 'blog_alert'])

    function switchType(newType: BlogBlockType) {
        const newBlock = defaultBlock(newType)
        // Preserve text when switching between text-based blocks
        if (TEXT_TYPES.has(block.type) && TEXT_TYPES.has(newType)) {
            const text = extractText(block)
            if (text) {
                const nb = newBlock as Record<string, unknown>
                if ('text' in nb) nb.text = text
                else if ('title' in nb) nb.title = text
                else if ('items' in nb && Array.isArray(nb.items) && typeof (nb.items as unknown[])[0] === 'string') nb.items = text.split('\n').filter(Boolean)
            }
        }
        onChange(newBlock as BlogBlock)
        setShowTypeSwitcher(false)
    }

    useEffect(() => {
        if (forceCollapsed !== undefined) setCollapsed(forceCollapsed)
    }, [forceCollapsed])

    useEffect(() => {
        if (!fresh) return
        setCollapsed(false)
        setTimeout(() => {
            const first = fieldRef.current?.querySelector<HTMLElement>('input, textarea')
            first?.focus()
            onFreshHandled?.()
        }, 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fresh])

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
                <button onClick={() => {
                    setCollapsed(v => {
                        if (v) {
                            // expanding — focus first field after render
                            setTimeout(() => {
                                const first = fieldRef.current?.querySelector<HTMLElement>('input, textarea')
                                first?.focus()
                            }, 30)
                        }
                        return !v
                    })
                }}
                    className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                >
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold shrink-0 ${COLORS[block.type]}`}>
                        {ICONS[block.type]}
                        {block.type === 'blog_heading' ? `H${(block as { level?: number }).level ?? 2}` : BLOG_BLOCK_TYPE_LABELS[block.type]}
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
                            {(block.type === 'blog_video' && block.url) && (() => {
                                const m = block.url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/)
                                return m ? <img src={`https://img.youtube.com/vi/${m[1]}/default.jpg`} alt="" className="w-10 h-7 rounded object-cover shrink-0 ml-2 border border-border/60"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} /> : null
                            })()}
                            {(block.type === 'blog_rating') && (
                                <span className={`ml-2 shrink-0 text-sm font-black tabular-nums ${block.score >= 9 ? 'text-emerald-400' : block.score >= 7 ? 'text-yellow-400' : block.score >= 5 ? 'text-orange-400' : 'text-red-400'}`}>
                                    {block.score}<span className="text-[10px] font-normal text-muted">/10</span>
                                </span>
                            )}
                            {(block.type === 'blog_era_card' || block.type === 'blog_lightstick') && (() => {
                                const colors = (block as { colors?: string[] }).colors?.filter(c => /^#[0-9a-fA-F]{3,6}$/.test(c)) ?? []
                                return colors.length > 0 ? (
                                    <div className="flex gap-0.5 ml-2 shrink-0">
                                        {colors.slice(0, 4).map((c, i) => (
                                            <div key={i} className="w-3.5 h-3.5 rounded-full border border-border/60" style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                ) : null
                            })()}
                            {blockPreview(block) && (
                                <span className="text-[11px] text-muted/70 truncate ml-2 max-w-xs">{blockPreview(block)}</span>
                            )}
                        </>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 text-muted/40 ml-auto shrink-0 transition-transform duration-150 ${collapsed ? '' : 'rotate-90'}`} />
                </button>

                {/* Actions — visible only on hover */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    {/* Type switcher */}
                    <div className="relative">
                        <button onClick={() => setShowTypeSwitcher(v => !v)} title="Trocar tipo do bloco"
                            className="p-1.5 rounded-md text-muted hover:text-purple-400 hover:bg-surface-hover transition-colors text-[10px] font-bold">
                            <ChevronsUpDown className="w-3 h-3" />
                        </button>
                        {showTypeSwitcher && (
                            <div className="absolute right-0 top-full mt-1 z-40">
                                <TypeSelector onSelect={switchType} onClose={() => setShowTypeSwitcher(false)} />
                            </div>
                        )}
                    </div>
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
                <div ref={fieldRef} className="px-4 pb-4 pt-1 border-t border-border/50"
                    onKeyDown={e => {
                        if (e.key === 'Escape' && !e.defaultPrevented) {
                            e.stopPropagation()
                            setCollapsed(true)
                        }
                    }}
                >
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

let _keyCounter = 0
function nextKey() { return `bk_${++_keyCounter}` }

export function BlogBlockEditor({ blocks, onChange }: BlogBlockEditorProps) {
    const [showSelector, setShowSelector] = useState(false)
    const [forceCollapsed, setForceCollapsed] = useState<boolean | undefined>(undefined)
    const [showCommandPalette, setShowCommandPalette] = useState(false)
    const [paletteInsertAfter, setPaletteInsertAfter] = useState(-1)
    const [dragIdx, setDragIdx] = useState<number | null>(null)
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
    const [freshIndex, setFreshIndex] = useState<number | null>(null)
    const lastActiveIndex = useRef<number>(-1)

    // Stable keys parallel to blocks — prevents remount on reorder/insert
    const [blockKeys, setBlockKeys] = useState<string[]>(() => blocks.map(() => nextKey()))

    // Sync keys length when blocks change externally (e.g., restore, template pick)
    useEffect(() => {
        setBlockKeys(prev => {
            if (prev.length === blocks.length) return prev
            if (blocks.length > prev.length) {
                return [...prev, ...Array.from({ length: blocks.length - prev.length }, nextKey)]
            }
            return prev.slice(0, blocks.length)
        })
    }, [blocks.length])

    function updateBlock(i: number, updated: BlogBlock) {
        const next = [...blocks]; next[i] = updated; onChange(next)
    }
    function deleteBlock(i: number) {
        setBlockKeys(k => k.filter((_, j) => j !== i))
        onChange(blocks.filter((_, j) => j !== i))
    }
    function insertBlock(afterIndex: number, type: BlogBlockType) {
        const next = [...blocks]
        next.splice(afterIndex + 1, 0, defaultBlock(type))
        setBlockKeys(k => { const nk = [...k]; nk.splice(afterIndex + 1, 0, nextKey()); return nk })
        setFreshIndex(afterIndex + 1)
        onChange(next)
    }
    function duplicateBlock(i: number) {
        const next = [...blocks]
        next.splice(i + 1, 0, { ...blocks[i] })
        setBlockKeys(k => { const nk = [...k]; nk.splice(i + 1, 0, nextKey()); return nk })
        onChange(next)
    }
    function moveBlock(from: number, to: number) {
        const next = [...blocks]
        const [removed] = next.splice(from, 1)
        next.splice(to, 0, removed)
        setBlockKeys(k => { const nk = [...k]; const [rk] = nk.splice(from, 1); nk.splice(to, 0, rk); return nk })
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

    // URL paste detection — inserts after the last active block
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
        } else if (/\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(text) || /r2\.dev\/|cloudflare|imagekit\.io|supabase\.co\/storage/i.test(text)) {
            type = 'blog_image'; extra = { url: text, caption: '' }
        }

        if (type) {
            e.preventDefault()
            const insertAfter = lastActiveIndex.current >= 0 ? lastActiveIndex.current : blocks.length - 1
            const next = [...blocks]
            next.splice(insertAfter + 1, 0, { ...defaultBlock(type), ...extra } as BlogBlock)
            setBlockKeys(k => { const nk = [...k]; nk.splice(insertAfter + 1, 0, nextKey()); return nk })
            setFreshIndex(insertAfter + 1)
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
                    key={blockKeys[i] ?? i}
                    data-block-index={i}
                    onClick={() => { lastActiveIndex.current = i }}
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
                        fresh={freshIndex === i}
                        onFreshHandled={() => setFreshIndex(null)}
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
