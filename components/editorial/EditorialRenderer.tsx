// Renderizador compartilhado de analiseEditorial com suporte a todos os marcadores:
// [FATOS], [TIMELINE], [TAGS], [DESTAQUE], [RECORDE], [MOMENTO], [QUOTE], [DIVISOR], [VIDEO]
// **Título** → cabeçalho de seção

type EditorialBlock =
    | { type: 'section-title'; text: string }
    | { type: 'quote'; text: string }
    | { type: 'destaque'; text: string }
    | { type: 'recorde'; text: string }
    | { type: 'tags'; items: string[] }
    | { type: 'fatos'; items: { label: string; valor: string }[] }
    | { type: 'timeline'; items: { label: string; valor: string }[] }
    | { type: 'momento'; label: string; text: string }
    | { type: 'video'; url: string }
    | { type: 'divisor' }
    | { type: 'paragraph'; text: string }

const SECTION_TITLE_RE = /^\*\*(.+?)\*\*\s*$/m
const INLINE_TAGS = ['[QUOTE]', '[DESTAQUE]', '[RECORDE]', '[TAGS]', '[FATOS]', '[TIMELINE]', '[MOMENTO]', '[VIDEO]', '[DIVISOR]']

function nextTagPosition(s: string): number {
    return Math.min(...INLINE_TAGS.map(t => { const i = s.indexOf(t); return i >= 0 ? i : Infinity }))
}

function createParagraphBlocks(text: string): EditorialBlock[] {
    return text.split(/\n{2,}/).map(part => part.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean).map(part => ({ type: 'paragraph', text: part }))
}

function parseEditorialBlocks(raw: string): EditorialBlock[] {
    const blocks: EditorialBlock[] = []
    const parts = raw.split(/(\n\*\*[^\n*]+\*\*\n?|\*\*[^\n*]+\*\*\n)/).filter(Boolean)

    for (const part of parts) {
        const titleMatch = part.match(SECTION_TITLE_RE)
        if (titleMatch) { blocks.push({ type: 'section-title', text: titleMatch[1].trim() }); continue }

        let remaining = part.trim()
        while (remaining.length > 0) {
            const next = nextTagPosition(remaining)
            if (next === Infinity) { const text = remaining.trim(); if (text) blocks.push(...createParagraphBlocks(text)); break }
            if (next > 0) { const text = remaining.slice(0, next).trim(); if (text) blocks.push(...createParagraphBlocks(text)); remaining = remaining.slice(next); continue }

            if (remaining.startsWith('[DIVISOR]')) { blocks.push({ type: 'divisor' }); remaining = remaining.slice(9).trim(); continue }

            if (remaining.startsWith('[VIDEO]')) {
                const end = remaining.indexOf('[/VIDEO]')
                if (end === -1) { blocks.push({ type: 'paragraph', text: remaining.trim() }); remaining = ''; break }
                const url = remaining.slice(7, end).trim()
                if (url) blocks.push({ type: 'video', url })
                remaining = remaining.slice(end + 8).trim()
                continue
            }

            const pairs: Array<[string, string, (text: string) => EditorialBlock]> = [
                ['[QUOTE]', '[/QUOTE]', (t) => ({ type: 'quote', text: t })],
                ['[DESTAQUE]', '[/DESTAQUE]', (t) => ({ type: 'destaque', text: t })],
                ['[RECORDE]', '[/RECORDE]', (t) => ({ type: 'recorde', text: t })],
                ['[TAGS]', '[/TAGS]', (t) => ({ type: 'tags', items: t.split(',').map(s => s.trim()).filter(Boolean) })],
                ['[FATOS]', '[/FATOS]', (t) => ({ type: 'fatos', items: t.split('|').map(s => { const c = s.indexOf(':'); return c === -1 ? { label: s.trim(), valor: '' } : { label: s.slice(0, c).trim(), valor: s.slice(c + 1).trim() } }).filter(f => f.label) })],
                ['[TIMELINE]', '[/TIMELINE]', (t) => ({ type: 'timeline', items: t.split('|').map(s => { const c = s.indexOf(':'); return c === -1 ? { label: s.trim(), valor: '' } : { label: s.slice(0, c).trim(), valor: s.slice(c + 1).trim() } }).filter(f => f.label) })],
                ['[MOMENTO]', '[/MOMENTO]', (t) => { const c = t.indexOf(':'); return c === -1 ? { type: 'momento', label: 'Momento-chave', text: t } : { type: 'momento', label: t.slice(0, c).trim(), text: t.slice(c + 1).trim() } }],
            ]

            let matched = false
            for (const [open, close, builder] of pairs) {
                if (remaining.startsWith(open)) {
                    const end = remaining.indexOf(close)
                    if (end === -1) { blocks.push({ type: 'paragraph', text: remaining.trim() }); remaining = ''; break }
                    const text = remaining.slice(open.length, end).trim()
                    if (text) blocks.push(builder(text))
                    remaining = remaining.slice(end + close.length).trim()
                    matched = true; break
                }
            }
            if (!matched) break
        }
    }
    return blocks
}

function toRgba(hex: string, alpha: number) {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

function youtubeId(url: string): string | null {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/)
    return m?.[1] ?? null
}

export function EditorialRenderer({ raw, accent }: { raw: string; accent: string }) {
    const blocks = parseEditorialBlocks(raw)

    return (
        <div className="space-y-4">
            {blocks.map((block, i) => {
                switch (block.type) {
                    case 'section-title':
                        return (
                            <div key={i} className="pt-2">
                                <h3 className="font-mono text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: accent }}>{block.text}</h3>
                            </div>
                        )
                    case 'paragraph':
                        return <p key={i} className="text-sm leading-[1.9] text-foreground sm:text-[15px]">{block.text}</p>
                    case 'quote':
                        return (
                            <blockquote key={i} className="pl-5 py-4 pr-5 italic"
                                style={{ borderLeft: `4px solid ${accent}`, background: toRgba(accent, 0.05) }}>
                                <p className="text-sm leading-relaxed sm:text-base" style={{ color: accent }}>
                                    &ldquo;{block.text}&rdquo;
                                </p>
                            </blockquote>
                        )
                    case 'destaque':
                        return (
                            <div key={i} className="py-6 px-5 border-l-4 text-sm leading-[1.7] font-semibold text-foreground"
                                style={{ borderColor: accent, background: toRgba(accent, 0.05) }}>
                                {block.text}
                            </div>
                        )
                    case 'recorde':
                        return (
                            <div key={i} className="border border-amber-400/30 bg-amber-50/10 dark:bg-amber-900/10 px-4 py-3 flex gap-3 items-start">
                                <span className="text-amber-500 text-base shrink-0">★</span>
                                <p className="text-sm leading-[1.65] font-semibold text-foreground">{block.text}</p>
                            </div>
                        )
                    case 'tags':
                        return (
                            <div key={i} className="flex flex-wrap gap-1.5">
                                {block.items.map(tag => (
                                    <span key={tag} className="rounded-full border border-accent/25 bg-accent/[0.06] px-3 py-1 font-mono text-[10px] font-semibold text-accent">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )
                    case 'fatos':
                        return (
                            <div key={i} className="grid grid-cols-2 border border-border bg-background sm:grid-cols-3">
                                {block.items.map((item, idx) => (
                                    <div key={`${item.label}-${idx}`} className="px-4 py-3 border-r border-b border-border/40 last:border-r-0">
                                        <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{item.label}</div>
                                        <div className="mt-1 text-[13px] font-black leading-tight text-foreground">{item.valor}</div>
                                    </div>
                                ))}
                            </div>
                        )
                    case 'timeline':
                        return (
                            <div key={i} className="border border-border/60 bg-background divide-y divide-border/35">
                                {block.items.map((item, idx) => (
                                    <div key={`${item.label}-${idx}`} className="grid grid-cols-[72px_1fr] gap-4 px-5 py-3">
                                        <div className="font-mono text-[12px] font-black" style={{ color: accent }}>{item.label}</div>
                                        <div className="text-[13px] leading-[1.55] font-medium text-foreground/85">{item.valor}</div>
                                    </div>
                                ))}
                            </div>
                        )
                    case 'momento':
                        return (
                            <div key={i} className="border border-foreground bg-foreground text-background px-5 py-4">
                                <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-background/60 mb-2">{block.label}</div>
                                <p className="text-[14px] leading-[1.6] font-semibold">{block.text}</p>
                            </div>
                        )
                    case 'video': {
                        const id = youtubeId(block.url)
                        if (!id) return null
                        return (
                            <div key={i} className="overflow-hidden border border-border/50 aspect-video w-full">
                                <iframe src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`} title="Vídeo"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen className="w-full h-full" loading="lazy" />
                            </div>
                        )
                    }
                    case 'divisor':
                        return <div key={i} className="flex items-center gap-3 py-1"><div className="flex-1 border-t border-border/40" /><div className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} /><div className="flex-1 border-t border-border/40" /></div>
                    default:
                        return null
                }
            })}
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${toRgba(accent, 0.15)}` }}>
                <div className="h-0.5 w-6 flex-shrink-0" style={{ background: accent }} />
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted">Editorial HallyuHub — análise independente</p>
            </div>
        </div>
    )
}
