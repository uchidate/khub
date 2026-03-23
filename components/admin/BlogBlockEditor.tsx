'use client'

import { useState } from 'react'
import {
    Plus, Trash2, GripVertical, ChevronUp, ChevronDown,
    Type, AlignLeft, Quote, Image, Twitter, Instagram, Video, Music2,
    User, Film, BarChart2, Star, Minus, GalleryHorizontal, X,
} from 'lucide-react'
import type { BlogBlock, BlogBlockType } from '@/lib/types/blocks'
import { BLOG_BLOCK_TYPE_LABELS } from '@/lib/types/blocks'

// ─── Icons & colors ───────────────────────────────────────────────────────────

const ICONS: Record<BlogBlockType, React.ReactNode> = {
    blog_heading:         <Type className="w-3.5 h-3.5" />,
    blog_paragraph:       <AlignLeft className="w-3.5 h-3.5" />,
    blog_quote:           <Quote className="w-3.5 h-3.5" />,
    blog_image:           <Image className="w-3.5 h-3.5" />,
    blog_gallery:         <GalleryHorizontal className="w-3.5 h-3.5" />,
    blog_video:           <Video className="w-3.5 h-3.5" />,
    blog_twitter:         <Twitter className="w-3.5 h-3.5" />,
    blog_instagram:       <Instagram className="w-3.5 h-3.5" />,
    blog_tiktok:          <Music2 className="w-3.5 h-3.5" />,
    blog_artist_card:     <User className="w-3.5 h-3.5" />,
    blog_production_card: <Film className="w-3.5 h-3.5" />,
    blog_stats_row:       <BarChart2 className="w-3.5 h-3.5" />,
    blog_rating:          <Star className="w-3.5 h-3.5" />,
    blog_divider:         <Minus className="w-3.5 h-3.5" />,
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
    blog_stats_row:       'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    blog_rating:          'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    blog_divider:         'bg-surface text-muted border-border',
}

// ─── Block groups for the type selector ───────────────────────────────────────

const TYPE_GROUPS: { label: string; types: BlogBlockType[] }[] = [
    { label: 'Texto', types: ['blog_heading', 'blog_paragraph', 'blog_quote', 'blog_divider'] },
    { label: 'Mídia', types: ['blog_image', 'blog_gallery', 'blog_video', 'blog_twitter', 'blog_instagram', 'blog_tiktok'] },
    { label: 'HallyuHub', types: ['blog_artist_card', 'blog_production_card', 'blog_stats_row', 'blog_rating'] },
]

// ─── Default block factory ────────────────────────────────────────────────────

function defaultBlock(type: BlogBlockType): BlogBlock {
    switch (type) {
        case 'blog_heading':         return { type, text: '', level: 2 }
        case 'blog_paragraph':       return { type, text: '' }
        case 'blog_quote':           return { type, text: '', author: '' }
        case 'blog_image':           return { type, url: '', caption: '' }
        case 'blog_gallery':         return { type, urls: [''], caption: '' }
        case 'blog_video':           return { type, url: '', caption: '' }
        case 'blog_twitter':         return { type, url: '' }
        case 'blog_instagram':       return { type, url: '' }
        case 'blog_tiktok':          return { type, url: '' }
        case 'blog_artist_card':     return { type, artistId: '', note: '' }
        case 'blog_production_card': return { type, productionId: '', note: '' }
        case 'blog_stats_row':       return { type, items: [{ label: '', value: '' }] }
        case 'blog_rating':          return { type, score: 8, label: '', summary: '' }
        case 'blog_divider':         return { type }
    }
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
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-surface-hover hover:text-foreground transition-colors text-left"
                        >
                            <span className={`flex items-center justify-center w-6 h-6 rounded border text-[11px] ${COLORS[type]}`}>
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
                            <button
                                key={l}
                                onClick={() => onChange({ ...block, level: l })}
                                className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${block.level === l ? 'bg-purple-600/30 border-purple-500/40 text-purple-300' : 'border-border text-muted hover:text-foreground'}`}
                            >
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
                rows={4} placeholder="Escreva o parágrafo..." className={inputCls} />

        case 'blog_quote':
            return (
                <div className="space-y-2">
                    <textarea value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
                        rows={3} placeholder="Texto da citação..." className={inputCls} />
                    <input value={block.author || ''} onChange={e => onChange({ ...block, author: e.target.value })}
                        placeholder="Autor (opcional)..." className={inputCls} />
                </div>
            )

        case 'blog_image':
            return (
                <div className="space-y-2">
                    <input value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
                        placeholder="URL da imagem..." className={inputCls} />
                    <input value={block.caption || ''} onChange={e => onChange({ ...block, caption: e.target.value })}
                        placeholder="Legenda (opcional)..." className={inputCls} />
                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                        <input type="checkbox" checked={block.fullWidth || false}
                            onChange={e => onChange({ ...block, fullWidth: e.target.checked })}
                            className="rounded" />
                        Largura total
                    </label>
                </div>
            )

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
                        <label className={labelCls}>ID do Artista</label>
                        <input value={block.artistId} onChange={e => onChange({ ...block, artistId: e.target.value })}
                            placeholder="ID do artista (ex: cma1b2c3d...)..." className={inputCls} />
                    </div>
                    <input value={block.note || ''} onChange={e => onChange({ ...block, note: e.target.value })}
                        placeholder="Nota editorial (opcional)..." className={inputCls} />
                </div>
            )

        case 'blog_production_card':
            return (
                <div className="space-y-2">
                    <div>
                        <label className={labelCls}>ID da Produção</label>
                        <input value={block.productionId} onChange={e => onChange({ ...block, productionId: e.target.value })}
                            placeholder="ID da produção (ex: cmm1b2c3d...)..." className={inputCls} />
                    </div>
                    <input value={block.note || ''} onChange={e => onChange({ ...block, note: e.target.value })}
                        placeholder="Nota editorial (opcional)..." className={inputCls} />
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
                            }} placeholder="Rótulo (ex: Altura)..." className={`${inputCls} w-1/3`} />
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
    }
}

// ─── Block row ────────────────────────────────────────────────────────────────

function BlockRow({
    block, index, total, onChange, onDelete, onMoveUp, onMoveDown,
}: {
    block: BlogBlock; index: number; total: number
    onChange: (b: BlogBlock) => void
    onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void
}) {
    return (
        <div className="group relative bg-surface border border-border rounded-xl p-4 hover:border-border transition-colors">
            <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0">
                    <GripVertical className="w-4 h-4 text-muted group-hover:text-muted transition-colors cursor-grab" />
                    <button onClick={onMoveUp} disabled={index === 0}
                        className="text-muted hover:text-muted disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={onMoveDown} disabled={index === total - 1}
                        className="text-muted hover:text-muted disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${COLORS[block.type]}`}>
                            {ICONS[block.type]}
                            {BLOG_BLOCK_TYPE_LABELS[block.type]}
                        </span>
                        <span className="text-[10px] text-muted">#{index + 1}</span>
                    </div>
                    <BlockFieldEditor block={block} onChange={onChange} />
                </div>
                <button onClick={onDelete} className="shrink-0 text-muted hover:text-red-400 transition-colors mt-0.5">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
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
    function addBlock(type: BlogBlockType) { onChange([...blocks, defaultBlock(type)]) }
    function moveBlock(from: number, to: number) {
        const next = [...blocks]
        const [removed] = next.splice(from, 1)
        next.splice(to, 0, removed)
        onChange(next)
    }

    return (
        <div className="space-y-3">
            {blocks.length === 0 && (
                <div className="text-center py-12 text-muted text-sm border border-dashed border-border rounded-xl">
                    Nenhum bloco ainda. Clique em <span className="text-foreground">+ Bloco</span> para começar, ou escolha um template acima.
                </div>
            )}

            {blocks.map((block, i) => (
                <BlockRow key={i} block={block} index={i} total={blocks.length}
                    onChange={updated => updateBlock(i, updated)}
                    onDelete={() => deleteBlock(i)}
                    onMoveUp={() => moveBlock(i, i - 1)}
                    onMoveDown={() => moveBlock(i, i + 1)}
                />
            ))}

            <div className="relative">
                <button
                    onClick={() => setShowSelector(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-sm text-muted hover:text-foreground hover:border-border transition-colors w-full justify-center"
                >
                    <Plus className="w-4 h-4" /> Bloco
                </button>
                {showSelector && (
                    <TypeSelector onSelect={addBlock} onClose={() => setShowSelector(false)} />
                )}
            </div>
        </div>
    )
}
