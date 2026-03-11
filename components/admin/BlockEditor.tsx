'use client'

import { useState } from 'react'
import {
    Plus, Trash2, GripVertical, ChevronUp, ChevronDown,
    Type, AlignLeft, Quote, Image, Twitter, Instagram, Video, X
} from 'lucide-react'
import type {
    NewsBlock, NewsBlockType,
    HeadingBlock, ParagraphBlock, QuoteBlock,
    ImageBlock, TwitterEmbedBlock, InstagramEmbedBlock, VideoBlock
} from '@/lib/types/blocks'
import { BLOCK_TYPE_LABELS, TEXT_BLOCK_TYPES } from '@/lib/types/blocks'

// ─── Block type icon map ───────────────────────────────────────────────────────

const BLOCK_ICONS: Record<NewsBlockType, React.ReactNode> = {
    heading:         <Type className="w-3.5 h-3.5" />,
    paragraph:       <AlignLeft className="w-3.5 h-3.5" />,
    quote:           <Quote className="w-3.5 h-3.5" />,
    image:           <Image className="w-3.5 h-3.5" />,
    twitter_embed:   <Twitter className="w-3.5 h-3.5" />,
    instagram_embed: <Instagram className="w-3.5 h-3.5" />,
    video:           <Video className="w-3.5 h-3.5" />,
}

const BLOCK_COLORS: Record<NewsBlockType, string> = {
    heading:         'bg-purple-500/20 text-purple-300 border-purple-500/30',
    paragraph:       'bg-zinc-700/50 text-zinc-400 border-zinc-600/30',
    quote:           'bg-amber-500/20 text-amber-300 border-amber-500/30',
    image:           'bg-blue-500/20 text-blue-300 border-blue-500/30',
    twitter_embed:   'bg-sky-500/20 text-sky-300 border-sky-500/30',
    instagram_embed: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    video:           'bg-red-500/20 text-red-300 border-red-500/30',
}

// ─── Default block factories ───────────────────────────────────────────────────

function defaultBlock(type: NewsBlockType): NewsBlock {
    switch (type) {
        case 'heading':         return { type, original: '', translated: '' }
        case 'paragraph':       return { type, original: '', translated: '' }
        case 'quote':           return { type, original: '', translated: '' }
        case 'image':           return { type, url: '', caption: '' }
        case 'twitter_embed':   return { type, url: '' }
        case 'instagram_embed': return { type, url: '' }
        case 'video':           return { type, url: '', caption: '' }
    }
}

// ─── Block type selector ───────────────────────────────────────────────────────

function BlockTypeSelector({ onSelect, onClose }: {
    onSelect: (type: NewsBlockType) => void
    onClose: () => void
}) {
    const types: NewsBlockType[] = ['heading', 'paragraph', 'quote', 'image', 'twitter_embed', 'instagram_embed', 'video']
    return (
        <div className="absolute z-10 mt-1 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-2 min-w-[180px]">
            <div className="flex justify-between items-center px-2 py-1 mb-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tipo de bloco</span>
                <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            {types.map(type => (
                <button
                    key={type}
                    onClick={() => { onSelect(type); onClose() }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                >
                    <span className={`flex items-center justify-center w-6 h-6 rounded border text-[11px] ${BLOCK_COLORS[type]}`}>
                        {BLOCK_ICONS[type]}
                    </span>
                    {BLOCK_TYPE_LABELS[type]}
                </button>
            ))}
        </div>
    )
}

// ─── Individual block editors ──────────────────────────────────────────────────

function TextBlockEditor({
    block,
    onChange,
    label,
    multiline = true,
}: {
    block: HeadingBlock | ParagraphBlock | QuoteBlock
    onChange: (updated: NewsBlock) => void
    label: string
    multiline?: boolean
}) {
    const El = multiline ? 'textarea' : 'input'
    return (
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1 block">
                    Original
                </label>
                <El
                    value={block.original}
                    onChange={e => onChange({ ...block, original: e.target.value })}
                    rows={multiline ? 3 : undefined}
                    placeholder="Texto original..."
                    className="w-full bg-zinc-900 border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 resize-y"
                />
            </div>
            <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1 block">
                    Tradução (pt-BR)
                </label>
                <El
                    value={block.translated}
                    onChange={e => onChange({ ...block, translated: e.target.value })}
                    rows={multiline ? 3 : undefined}
                    placeholder={`Tradução do ${label.toLowerCase()}...`}
                    className="w-full bg-zinc-900 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 resize-y"
                />
            </div>
        </div>
    )
}

function ImageBlockEditor({ block, onChange }: { block: ImageBlock; onChange: (updated: NewsBlock) => void }) {
    return (
        <div className="space-y-2">
            <input
                value={block.url}
                onChange={e => onChange({ ...block, url: e.target.value })}
                placeholder="URL da imagem..."
                className="w-full bg-zinc-900 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500/50"
            />
            <input
                value={block.caption || ''}
                onChange={e => onChange({ ...block, caption: e.target.value })}
                placeholder="Legenda (opcional)..."
                className="w-full bg-zinc-900 border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-blue-500/50"
            />
        </div>
    )
}

function UrlBlockEditor({
    block,
    onChange,
    placeholder,
}: {
    block: TwitterEmbedBlock | InstagramEmbedBlock | VideoBlock
    onChange: (updated: NewsBlock) => void
    placeholder: string
}) {
    return (
        <div className="space-y-2">
            <input
                value={block.url}
                onChange={e => onChange({ ...block, url: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-zinc-900 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-500/50"
            />
            {'caption' in block && (
                <input
                    value={(block as VideoBlock).caption || ''}
                    onChange={e => onChange({ ...(block as VideoBlock), caption: e.target.value })}
                    placeholder="Legenda (opcional)..."
                    className="w-full bg-zinc-900 border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-500/50"
                />
            )}
        </div>
    )
}

function BlockFieldEditor({ block, onChange }: { block: NewsBlock; onChange: (updated: NewsBlock) => void }) {
    switch (block.type) {
        case 'heading':   return <TextBlockEditor block={block} onChange={onChange} label="Título" multiline={false} />
        case 'paragraph': return <TextBlockEditor block={block} onChange={onChange} label="Parágrafo" />
        case 'quote':     return <TextBlockEditor block={block} onChange={onChange} label="Citação" />
        case 'image':     return <ImageBlockEditor block={block} onChange={onChange} />
        case 'twitter_embed':   return <UrlBlockEditor block={block} onChange={onChange} placeholder="URL do tweet (twitter.com ou x.com)..." />
        case 'instagram_embed': return <UrlBlockEditor block={block} onChange={onChange} placeholder="URL do post do Instagram..." />
        case 'video':     return <UrlBlockEditor block={block} onChange={onChange} placeholder="URL do YouTube..." />
    }
}

// ─── Single block row ──────────────────────────────────────────────────────────

function BlockRow({
    block,
    index,
    total,
    onChange,
    onDelete,
    onMoveUp,
    onMoveDown,
}: {
    block: NewsBlock
    index: number
    total: number
    onChange: (updated: NewsBlock) => void
    onDelete: () => void
    onMoveUp: () => void
    onMoveDown: () => void
}) {
    return (
        <div className="group relative bg-zinc-800/40 border border-white/6 rounded-xl p-4 hover:border-white/10 transition-colors">
            <div className="flex items-start gap-3">
                {/* Drag handle + move buttons */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0">
                    <GripVertical className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors cursor-grab" />
                    <button
                        onClick={onMoveUp}
                        disabled={index === 0}
                        className="text-zinc-700 hover:text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={index === total - 1}
                        className="text-zinc-700 hover:text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Block content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${BLOCK_COLORS[block.type]}`}>
                            {BLOCK_ICONS[block.type]}
                            {BLOCK_TYPE_LABELS[block.type]}
                        </span>
                        <span className="text-[10px] text-zinc-700">#{index + 1}</span>
                    </div>
                    <BlockFieldEditor block={block} onChange={onChange} />
                </div>

                {/* Delete */}
                <button
                    onClick={onDelete}
                    className="shrink-0 text-zinc-700 hover:text-red-400 transition-colors mt-0.5"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

// ─── Main BlockEditor ──────────────────────────────────────────────────────────

interface BlockEditorProps {
    blocks: NewsBlock[]
    onChange: (blocks: NewsBlock[]) => void
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
    const [showTypeSelector, setShowTypeSelector] = useState(false)

    function updateBlock(index: number, updated: NewsBlock) {
        const next = [...blocks]
        next[index] = updated
        onChange(next)
    }

    function deleteBlock(index: number) {
        onChange(blocks.filter((_, i) => i !== index))
    }

    function addBlock(type: NewsBlockType) {
        onChange([...blocks, defaultBlock(type)])
    }

    function moveBlock(from: number, to: number) {
        const next = [...blocks]
        const [removed] = next.splice(from, 1)
        next.splice(to, 0, removed)
        onChange(next)
    }

    return (
        <div className="space-y-3">
            {blocks.length === 0 && (
                <div className="text-center py-10 text-zinc-600 text-sm border border-dashed border-white/8 rounded-xl">
                    Nenhum bloco. Clique em &quot;+ Bloco&quot; para começar.
                </div>
            )}

            {blocks.map((block, i) => (
                <BlockRow
                    key={i}
                    block={block}
                    index={i}
                    total={blocks.length}
                    onChange={updated => updateBlock(i, updated)}
                    onDelete={() => deleteBlock(i)}
                    onMoveUp={() => moveBlock(i, i - 1)}
                    onMoveDown={() => moveBlock(i, i + 1)}
                />
            ))}

            {/* Add block button */}
            <div className="relative">
                <button
                    onClick={() => setShowTypeSelector(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-white/10 text-sm text-zinc-500 hover:text-zinc-300 hover:border-white/20 transition-colors w-full justify-center"
                >
                    <Plus className="w-4 h-4" />
                    Bloco
                </button>
                {showTypeSelector && (
                    <BlockTypeSelector
                        onSelect={addBlock}
                        onClose={() => setShowTypeSelector(false)}
                    />
                )}
            </div>
        </div>
    )
}
