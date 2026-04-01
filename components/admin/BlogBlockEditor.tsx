'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Plus, Trash2, GripVertical, ChevronUp, ChevronDown,
    Type, AlignLeft, Quote, Image as ImageIcon, Twitter, Instagram, Video, Music2,
    User, Film, BarChart2, Star, Minus, GalleryHorizontal, X,
    ChevronRight, Copy, Search, Loader2, Users, Zap,
} from 'lucide-react'
import type { BlogBlock, BlogBlockType } from '@/lib/types/blocks'
import { BLOG_BLOCK_TYPE_LABELS } from '@/lib/types/blocks'

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
    blog_artist_card:     <User className="w-3.5 h-3.5" />,
    blog_production_card: <Film className="w-3.5 h-3.5" />,
    blog_group_card:      <Users className="w-3.5 h-3.5" />,
    blog_stats_row:       <BarChart2 className="w-3.5 h-3.5" />,
    blog_rating:          <Star className="w-3.5 h-3.5" />,
    blog_divider:         <Minus className="w-3.5 h-3.5" />,
    blog_callout:         <Zap className="w-3.5 h-3.5" />,
    blog_curiosity:       <Zap className="w-3.5 h-3.5" />,
    blog_highlight:       <Quote className="w-3.5 h-3.5" />,
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
    blog_artist_card:     'bg-violet-500/20 text-violet-300 border-violet-500/30',
    blog_production_card: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    blog_group_card:      'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    blog_stats_row:       'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    blog_rating:          'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    blog_divider:         'bg-surface text-muted border-border',
    blog_callout:         'bg-rose-500/20 text-rose-300 border-rose-500/30',
    blog_curiosity:       'bg-pink-500/20 text-pink-300 border-pink-500/30',
    blog_highlight:       'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

// ─── Block groups for the type selector ───────────────────────────────────────

const TYPE_GROUPS: { label: string; types: BlogBlockType[] }[] = [
    { label: 'Texto',     types: ['blog_heading', 'blog_paragraph', 'blog_quote', 'blog_callout', 'blog_curiosity', 'blog_highlight', 'blog_divider'] },
    { label: 'Mídia',     types: ['blog_image', 'blog_gallery', 'blog_video', 'blog_twitter', 'blog_instagram', 'blog_tiktok'] },
    { label: 'HallyuHub', types: ['blog_artist_card', 'blog_group_card', 'blog_production_card', 'blog_stats_row', 'blog_rating'] },
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
        case 'blog_artist_card':     return { type, artistId: '', note: '' }
        case 'blog_production_card': return { type, productionId: '', note: '' }
        case 'blog_group_card':      return { type, groupId: '', note: '' }
        case 'blog_stats_row':       return { type, items: [{ label: '', value: '' }] }
        case 'blog_rating':          return { type, score: 8, label: '', summary: '' }
        case 'blog_divider':         return { type }
        case 'blog_callout':         return { type, variant: 'fact', title: '', text: '' }
        case 'blog_curiosity':       return { type, text: '', emoji: '💡' }
        case 'blog_highlight':       return { type, text: '', attribution: '' }
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
    return (
        <div className="absolute z-20 mt-1 bg-surface border border-border rounded-xl shadow-2xl p-3 min-w-[220px] left-0">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Tipo de bloco</span>
                <button onClick={onClose} className="text-muted hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            {TYPE_GROUPS.map(group => (
                <div key={group.label} className="mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted px-2 mb-1">{group.label}</p>
                    {group.types.map(type => (
                        <button
                            key={type}
                            onClick={() => { onSelect(type); onClose() }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-surface-hover transition-colors text-left"
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

const inputCls = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-purple-500/50 resize-y"
const labelCls = "text-[10px] font-bold uppercase tracking-widest text-muted mb-1 block"

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
            return <textarea value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
                rows={4} placeholder="Escreva o parágrafo... (**negrito**, [link](url))" className={inputCls} />

        case 'blog_quote':
            return (
                <div className="space-y-2">
                    <textarea value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
                        rows={3} placeholder="Texto da citação..." className={inputCls} />
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
                        <div key={i} className="flex gap-2">
                            <input value={url} onChange={e => {
                                const urls = [...block.urls]; urls[i] = e.target.value
                                onChange({ ...block, urls })
                            }} placeholder={`URL da imagem ${i + 1}...`} className={inputCls} />
                            <button onClick={() => onChange({ ...block, urls: block.urls.filter((_, j) => j !== i) })}
                                className="text-muted hover:text-red-400 shrink-0">
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
                            block.type === 'blog_video' ? 'URL do YouTube...' :
                            block.type === 'blog_twitter' ? 'URL do tweet...' :
                            block.type === 'blog_instagram' ? 'URL do post do Instagram...' :
                            'URL do TikTok...'
                        }
                        className={inputCls} />
                    {'caption' in block && (
                        <input value={(block as { caption?: string }).caption || ''}
                            onChange={e => onChange({ ...block, caption: e.target.value } as BlogBlock)}
                            placeholder="Legenda (opcional)..." className={inputCls} />
                    )}
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
                    <textarea value={block.summary || ''} onChange={e => onChange({ ...block, summary: e.target.value })}
                        rows={2} placeholder="Resumo da avaliação..." className={inputCls} />
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
                    <textarea value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
                        rows={2} placeholder="Texto do destaque... (**negrito** suportado)" className={inputCls} />
                </div>
            )
        case 'blog_curiosity':
            return (
                <div className="space-y-2">
                    <input value={block.emoji || ''} onChange={e => onChange({ ...block, emoji: e.target.value })}
                        placeholder="Emoji (ex: 🎤)" className={inputCls} />
                    <textarea value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
                        rows={3} placeholder="Curiosidade... (**negrito** e [links](/url) suportados)" className={inputCls} />
                </div>
            )
        case 'blog_highlight':
            return (
                <div className="space-y-2">
                    <textarea value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
                        rows={2} placeholder="Texto em destaque visual grande..." className={inputCls} />
                    <input value={block.attribution || ''} onChange={e => onChange({ ...block, attribution: e.target.value })}
                        placeholder="Atribuição (opcional)..." className={inputCls} />
                </div>
            )
    }
}

// ─── Block preview (collapsed state) ─────────────────────────────────────────

function blockPreview(block: BlogBlock): string {
    switch (block.type) {
        case 'blog_heading':         return block.text || '(sem texto)'
        case 'blog_paragraph':       return block.text ? block.text.slice(0, 80) + (block.text.length > 80 ? '…' : '') : '(vazio)'
        case 'blog_quote':           return `"${block.text.slice(0, 60)}"` || '(vazio)'
        case 'blog_image':           return block.caption || block.url.split('/').pop() || block.url.slice(0, 50) || '(sem URL)'
        case 'blog_gallery':         return `${block.urls.length} imagem(ns)`
        case 'blog_video':           return block.url || '(sem URL)'
        case 'blog_twitter':         return block.url || '(sem URL)'
        case 'blog_instagram':       return block.url || '(sem URL)'
        case 'blog_tiktok':          return block.url || '(sem URL)'
        case 'blog_artist_card':     return block.artistId ? block.artistId.slice(0, 24) + '…' : '(sem artista)'
        case 'blog_group_card':      return block.groupId ? block.groupId.slice(0, 24) + '…' : '(sem grupo)'
        case 'blog_production_card': return block.productionId ? block.productionId.slice(0, 24) + '…' : '(sem produção)'
        case 'blog_stats_row':       return `${block.items.length} campo(s)`
        case 'blog_rating':          return `Nota: ${block.score}/10${block.label ? ` — ${block.label}` : ''}`
        case 'blog_divider':         return '───────'
        case 'blog_callout':         return block.title || block.text.slice(0, 60) || '(vazio)'
        case 'blog_curiosity':       return block.text.slice(0, 60) || '(vazio)'
        case 'blog_highlight':       return block.text.slice(0, 60) || '(vazio)'
    }
}

// ─── Insert strip ─────────────────────────────────────────────────────────────

function InsertStrip({ onInsert }: { onInsert: (type: BlogBlockType) => void }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="relative flex items-center justify-center h-5 group/strip">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border opacity-0 group-hover/strip:opacity-100 transition-opacity" />
            <button
                onClick={() => setOpen(v => !v)}
                className="relative z-10 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-surface border border-border text-muted hover:text-purple-400 hover:border-purple-500/40 transition-all opacity-0 group-hover/strip:opacity-100 text-[10px] font-bold"
            >
                <Plus className="w-3 h-3" /> inserir
            </button>
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
    block, index, total, onChange, onDelete, onMoveUp, onMoveDown, onDuplicate,
}: {
    block: BlogBlock; index: number; total: number
    onChange: (b: BlogBlock) => void
    onDelete: () => void
    onMoveUp: () => void
    onMoveDown: () => void
    onDuplicate: () => void
}) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className={`group relative bg-surface border rounded-xl transition-colors ${collapsed ? 'border-border' : 'border-border hover:border-border/80'}`}>
            {/* Header bar */}
            <div className="flex items-center gap-2 px-3 py-2.5">
                {/* Reorder controls */}
                <div className="flex flex-col items-center gap-0 shrink-0">
                    <button onClick={onMoveUp} disabled={index === 0}
                        className="text-muted hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={onMoveDown} disabled={index === total - 1}
                        className="text-muted hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <ChevronDown className="w-3.5 h-3.5" />
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
                    <span className="text-[10px] text-muted shrink-0">#{index + 1}</span>
                    {collapsed && (
                        <span className="text-xs text-muted truncate ml-1 italic">{blockPreview(block)}</span>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 text-muted ml-auto shrink-0 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={onDuplicate} title="Duplicar"
                        className="p-1 text-muted hover:text-foreground transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={onDelete} title="Remover"
                        className="p-1 text-muted hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
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

    return (
        <div className="space-y-0">
            {blocks.length === 0 && (
                <div className="text-center py-12 text-muted text-sm border border-dashed border-border rounded-xl">
                    Nenhum bloco ainda. Clique em <span className="text-foreground font-medium">+ Bloco</span> para começar.
                </div>
            )}

            {blocks.map((block, i) => (
                <div key={i}>
                    {i === 0 && (
                        <InsertStrip onInsert={type => insertBlock(-1, type)} />
                    )}
                    <BlockRow
                        block={block} index={i} total={blocks.length}
                        onChange={updated => updateBlock(i, updated)}
                        onDelete={() => deleteBlock(i)}
                        onMoveUp={() => moveBlock(i, i - 1)}
                        onMoveDown={() => moveBlock(i, i + 1)}
                        onDuplicate={() => duplicateBlock(i)}
                    />
                    <InsertStrip onInsert={type => insertBlock(i, type)} />
                </div>
            ))}

            {/* Add at end */}
            <div className="relative pt-1">
                <button
                    onClick={() => setShowSelector(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-sm text-muted hover:text-foreground hover:border-purple-500/30 transition-colors w-full justify-center"
                >
                    <Plus className="w-4 h-4" /> Bloco
                </button>
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
