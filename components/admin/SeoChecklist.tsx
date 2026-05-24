'use client'

import { useMemo } from 'react'
import { CheckCircle2, XCircle, AlertCircle, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { BlogBlock } from '@/lib/types/blocks'

interface SeoChecklistProps {
    title: string
    excerpt: string
    contentMd: string
    blocks: BlogBlock[]
    focusKeyword: string
    onFocusKeywordChange: (kw: string) => void
    coverImageUrl: string
    tags: string[]
}

interface Check {
    id: string
    label: string
    status: 'ok' | 'warn' | 'fail'
    detail?: string
}

function blocksToText(blocks: BlogBlock[]): string {
    return blocks.map(b => {
        const bb = b as Record<string, unknown>
        switch (b.type) {
            case 'blog_paragraph':  return b.text
            case 'blog_heading':    return b.text
            case 'blog_quote':      return b.text
            case 'blog_callout':    return `${bb.title ?? ''} ${bb.text ?? ''}`
            case 'blog_curiosity':  return String(bb.text ?? '')
            case 'blog_highlight':  return String(bb.text ?? '')
            case 'blog_list':       return (bb.items as string[] | undefined)?.join(' ') ?? ''
            case 'blog_pros_cons':  return [...((bb.pros as string[] | undefined) ?? []), ...((bb.cons as string[] | undefined) ?? [])].join(' ')
            case 'blog_steps':      return ((bb.steps as { title: string; text: string }[] | undefined) ?? []).map(s => `${s.title} ${s.text}`).join(' ')
            case 'blog_stats_row':  return b.items.map(i => `${i.label} ${i.value}`).join(' ')
            case 'blog_rating':     return b.summary || ''
            case 'blog_accordion':  return ((bb.items as { question: string; answer: string }[] | undefined) ?? []).map(i => `${i.question} ${i.answer}`).join(' ')
            case 'blog_tabs':       return ((bb.tabs as { label: string; content: string }[] | undefined) ?? []).map(t => `${t.label} ${t.content}`).join(' ')
            case 'blog_ranking':    return ((bb.items as { name: string; description?: string }[] | undefined) ?? []).map(i => `${i.name} ${i.description ?? ''}`).join(' ')
            default: return ''
        }
    }).filter(Boolean).join(' ')
}

export function SeoChecklist({
    title, excerpt, contentMd, blocks, focusKeyword,
    onFocusKeywordChange, coverImageUrl, tags,
}: SeoChecklistProps) {
    const [open, setOpen] = useState(false)

    const bodyText = useMemo(() => {
        const fromBlocks = blocksToText(blocks)
        return fromBlocks.length > 50 ? fromBlocks : contentMd
    }, [blocks, contentMd])

    const wordCount = useMemo(() =>
        bodyText.split(/\s+/).filter(w => w.length > 0).length,
    [bodyText])

    const checks = useMemo((): Check[] => {
        const kw = focusKeyword.trim().toLowerCase()
        const titleLower = title.toLowerCase()
        const excerptLower = excerpt.toLowerCase()
        const bodyLower = bodyText.toLowerCase()

        // Count internal links: markdown/text paths + artist/production card blocks
        const mdLinks = (bodyText.match(/\/[a-z][a-z0-9\-/]+/g) || []).length
        const cardLinks = blocks.filter(b => b.type === 'blog_artist_card' || b.type === 'blog_production_card').length
        const internalLinks = mdLinks + cardLinks

        // Keyword density in body (words matching kw / total words)
        const kwCount = kw ? bodyLower.split(kw).length - 1 : 0
        const kwDensity = wordCount > 0 ? (kwCount / wordCount) * 100 : 0

        const result: Check[] = []

        // 1. Title length
        const tLen = title.length
        result.push({
            id: 'title_length',
            label: `Título: ${tLen} caracteres`,
            status: tLen >= 40 && tLen <= 65 ? 'ok' : tLen >= 30 && tLen <= 75 ? 'warn' : 'fail',
            detail: tLen < 40 ? 'Ideal: 40–65 caracteres' : tLen > 65 ? 'Muito longo — pode ser cortado no Google' : undefined,
        })

        // 2. Excerpt
        result.push({
            id: 'excerpt',
            label: excerpt ? `Resumo: ${excerpt.length} caracteres` : 'Resumo ausente',
            status: excerpt.length >= 120 && excerpt.length <= 160 ? 'ok' : excerpt.length > 0 ? 'warn' : 'fail',
            detail: !excerpt ? 'Adicione um resumo de 120–160 caracteres' : excerpt.length > 160 ? 'Muito longo para meta description' : excerpt.length < 120 ? `Muito curto: ${excerpt.length}/120 chars mínimo` : undefined,
        })

        // 3. Word count
        result.push({
            id: 'word_count',
            label: `Contagem: ${wordCount} palavras`,
            status: wordCount >= 600 ? 'ok' : wordCount >= 300 ? 'warn' : 'fail',
            detail: wordCount < 300 ? 'Conteúdo muito curto — mínimo 300 palavras' : wordCount < 600 ? 'Ideal: 600+ palavras' : undefined,
        })

        // 4. Cover image
        result.push({
            id: 'cover_image',
            label: coverImageUrl ? 'Imagem de capa presente' : 'Sem imagem de capa',
            status: coverImageUrl ? 'ok' : 'fail',
            detail: !coverImageUrl ? 'Adicione uma imagem de capa para melhor CTR' : undefined,
        })

        // 5. Tags
        result.push({
            id: 'tags',
            label: tags.length > 0 ? `${tags.length} tag${tags.length > 1 ? 's' : ''}` : 'Sem tags',
            status: tags.length >= 3 ? 'ok' : tags.length > 0 ? 'warn' : 'fail',
            detail: tags.length < 3 ? 'Adicione 3–8 tags relevantes' : undefined,
        })

        // 6. Keyword in title
        if (kw) {
            result.push({
                id: 'kw_in_title',
                label: titleLower.includes(kw) ? 'Palavra-chave no título ✓' : 'Palavra-chave ausente no título',
                status: titleLower.includes(kw) ? 'ok' : 'fail',
            })

            // 7. Keyword in excerpt
            result.push({
                id: 'kw_in_excerpt',
                label: excerptLower.includes(kw) ? 'Palavra-chave no resumo ✓' : 'Palavra-chave ausente no resumo',
                status: excerptLower.includes(kw) ? 'ok' : 'warn',
            })

            // 8. Keyword density
            result.push({
                id: 'kw_density',
                label: `Densidade: ${kwDensity.toFixed(1)}%`,
                status: kwDensity >= 0.5 && kwDensity <= 2.5 ? 'ok' : kwDensity > 0 ? 'warn' : 'fail',
                detail: kwDensity < 0.5 ? 'Use a palavra-chave mais vezes (0.5–2.5%)' : kwDensity > 2.5 ? 'Keyword stuffing detectado (> 2.5%)' : undefined,
            })
        }

        // 9. Internal links
        result.push({
            id: 'internal_links',
            label: internalLinks > 0 ? `${internalLinks} link${internalLinks > 1 ? 's' : ''} interno${internalLinks > 1 ? 's' : ''}` : 'Sem links internos',
            status: internalLinks >= 2 ? 'ok' : internalLinks > 0 ? 'warn' : 'fail',
            detail: internalLinks < 2 ? 'Adicione ao menos 2 links para outras páginas do site' : undefined,
        })

        return result
    }, [title, excerpt, bodyText, wordCount, focusKeyword, coverImageUrl, tags, blocks])

    const okCount = checks.filter(c => c.status === 'ok').length
    const failCount = checks.filter(c => c.status === 'fail').length
    const score = Math.round((okCount / checks.length) * 100)

    const scoreColor = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'
    const scoreBg = score >= 80 ? 'bg-green-500/10 border-green-500/20' : score >= 50 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'

    return (
        <div className={`rounded-xl border ${scoreBg} overflow-hidden`}>
            {/* Header */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
                <div className="flex items-center gap-3">
                    <span className={`text-2xl font-black ${scoreColor}`}>{score}</span>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-muted">SEO Score</p>
                        <p className="text-[10px] text-muted">
                            {okCount} ok · {failCount} problema{failCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Focus keyword */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-1 block">
                            Palavra-chave foco
                        </label>
                        <input
                            value={focusKeyword}
                            onChange={e => onFocusKeywordChange(e.target.value)}
                            placeholder="ex: Jisoo BLACKPINK"
                            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-purple-500/50"
                        />
                    </div>

                    {/* Checks */}
                    <div className="space-y-1.5">
                        {checks.map(check => (
                            <div key={check.id} className="flex items-start gap-2">
                                {check.status === 'ok' && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />}
                                {check.status === 'warn' && <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />}
                                {check.status === 'fail' && <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                                <div>
                                    <p className={`text-xs font-medium ${
                                        check.status === 'ok' ? 'text-foreground' :
                                        check.status === 'warn' ? 'text-yellow-300' : 'text-red-300'
                                    }`}>{check.label}</p>
                                    {check.detail && (
                                        <p className="text-[11px] text-muted">{check.detail}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
