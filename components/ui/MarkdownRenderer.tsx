'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { cleanContentBySource } from '@/lib/utils/content-cleaner'

interface MarkdownRendererProps {
    content: string
    className?: string
    coverImageUrl?: string
    source?: string | null
}

// ── Source display config ──────────────────────────────────────────────────────

/** Classes de container e overrides visuais por fonte */
const SOURCE_STYLES: Record<string, { container: string; accentColor: string }> = {
    Soompi:         { container: 'source-soompi',        accentColor: '#a855f7' }, // purple
    Koreaboo:       { container: 'source-koreaboo',      accentColor: '#ec4899' }, // pink
    Dramabeans:     { container: 'source-dramabeans',    accentColor: '#3b82f6' }, // blue
    'Asian Junkie': { container: 'source-asian-junkie',  accentColor: '#f59e0b' }, // amber
    HelloKpop:      { container: 'source-hellokpop',     accentColor: '#10b981' }, // emerald
    Kpopmap:        { container: 'source-kpopmap',       accentColor: '#8b5cf6' }, // violet
}

// ── Preprocessing ──────────────────────────────────────────────────────────────

function isExternalUrl(href: string): boolean {
    return href.startsWith('http://') || href.startsWith('https://')
}

function preprocessMarkdown(content: string, coverImageUrl?: string, source?: string | null): string {
    let text = content

    // Normalize Windows line endings
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // Remove leading bold English title pattern: first line "**Title**"
    text = text.replace(/^\*\*[^\n]+\*\*\n+/, '')

    // Remove leading H1 heading (duplicates the page <h1>)
    text = text.replace(/^#{1,2}\s+[^\n]+\n+/, '')

    // Remove trailing "---\n*Fonte: Notícia original*" (the page footer already shows this)
    text = text.replace(/\n+---\n+\*[^\n]*[Ff]onte[^\n]*\*/g, '')
    text = text.replace(/\n+---\n+\*[^\n]*[Ss]ource[^\n]*\*/g, '')

    // Remove duplicate cover image if it appears as the first image in the content
    if (coverImageUrl) {
        const escapedUrl = coverImageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        text = text.replace(new RegExp(`^!\\[[^\\]]*\\]\\(${escapedUrl}\\)\\n+`, ''), '')
    }

    // Apply per-source cleaning rules
    text = cleanContentBySource(text, source)

    // If no paragraph breaks exist and content is long, add them at sentence boundaries
    if (!text.includes('\n\n') && text.length > 200) {
        text = text.replace(/([.!?])\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ"'])/g, '$1\n\n$2')
    }

    return text.trim()
}

function buildComponents(source?: string | null): Components {
    const style = source ? (SOURCE_STYLES[source] ?? null) : null
    const accent = style?.accentColor ?? '#a855f7'

    // Dramabeans: headers de episódio recebem badge azul em vez de heading comum
    const isDramabeans = source === 'Dramabeans'
    // Koreaboo: listicles — ol items com numeração em destaque
    const isKoreaboo = source === 'Koreaboo'
    // Asian Junkie: blockquotes com acento âmbar (editorial)
    const isAsianJunkie = source === 'Asian Junkie'

    return {
        p: ({ children }) => (
            <p className="mb-5 leading-relaxed text-zinc-300 text-lg">
                {children}
            </p>
        ),

        h1: ({ children }) => (
            <h1 className="text-3xl font-black text-white mt-10 mb-5 leading-tight tracking-tight">
                {children}
            </h1>
        ),
        h2: ({ children }) => {
            if (isDramabeans) {
                return (
                    <div className="flex items-center gap-3 mt-10 mb-5">
                        <span
                            className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest text-white"
                            style={{ backgroundColor: `${accent}33`, border: `1px solid ${accent}55`, color: accent }}
                        >
                            {children}
                        </span>
                    </div>
                )
            }
            return (
                <h2
                    className="text-2xl font-bold text-white mt-8 mb-4 pb-2 leading-tight"
                    style={{ borderBottom: `1px solid ${accent}22` }}
                >
                    {children}
                </h2>
            )
        },
        h3: ({ children }) => (
            <h3 className="text-xl font-bold mt-7 mb-3 leading-tight" style={{ color: accent }}>
                {children}
            </h3>
        ),
        h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-zinc-200 mt-6 mb-2">
                {children}
            </h4>
        ),

        strong: ({ children }) => (
            <strong className="font-bold text-white">
                {children}
            </strong>
        ),
        em: ({ children }) => (
            <em className="italic text-zinc-400">
                {children}
            </em>
        ),

        a: ({ href, children }) => {
            const external = href ? isExternalUrl(href) : false
            return (
                <a
                    href={href}
                    className="underline underline-offset-4 transition-colors"
                    style={{ color: accent }}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                    {children}
                </a>
            )
        },

        img: ({ src, alt }) => (
            <span className="block my-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt || ''}
                    className="rounded-2xl w-full object-cover border border-white/10 shadow-xl"
                />
                {alt && (
                    <span className="block text-center text-xs text-zinc-500 mt-2 italic">
                        {alt}
                    </span>
                )}
            </span>
        ),

        blockquote: ({ children }) => (
            <blockquote
                className="pl-5 my-7 italic py-3 pr-4 rounded-r-xl"
                style={{
                    borderLeft: `4px solid ${accent}`,
                    backgroundColor: `${accent}0d`,
                    color: isAsianJunkie ? '#d1d5db' : '#a1a1aa',
                }}
            >
                {children}
            </blockquote>
        ),

        hr: () => (
            <hr className="my-10" style={{ borderColor: `${accent}22` }} />
        ),

        ul: ({ children }) => (
            <ul className="list-disc list-outside ml-6 space-y-2 mb-6 text-zinc-300">
                {children}
            </ul>
        ),
        ol: ({ children }) => (
            <ol
                className={`list-outside ml-6 mb-6 text-zinc-300 ${isKoreaboo ? 'space-y-4 list-none ml-0' : 'list-decimal space-y-2'}`}
            >
                {children}
            </ol>
        ),
        li: ({ children }) => {
            if (isKoreaboo) {
                return (
                    <li
                        className="pb-4 mb-1 border-b border-white/5 last:border-0 leading-relaxed text-zinc-200"
                        style={{ borderBottomColor: `${accent}18` }}
                    >
                        {children}
                    </li>
                )
            }
            return <li className="leading-relaxed pl-1">{children}</li>
        },

        code: ({ children, className: codeClass }) => {
            const isBlock = codeClass?.startsWith('language-')
            if (isBlock) {
                return (
                    <code className="block text-sm font-mono leading-relaxed" style={{ color: accent }}>
                        {children}
                    </code>
                )
            }
            return (
                <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono" style={{ color: accent }}>
                    {children}
                </code>
            )
        },
        pre: ({ children }) => (
            <pre className="bg-zinc-900 rounded-xl p-5 overflow-x-auto my-7 border border-white/10 text-sm">
                {children}
            </pre>
        ),

        table: ({ children }) => (
            <div className="overflow-x-auto my-7 rounded-xl border border-white/10">
                <table className="w-full text-sm">
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }) => (
            <thead className="bg-zinc-800/60 text-zinc-200 font-semibold">
                {children}
            </thead>
        ),
        tbody: ({ children }) => (
            <tbody className="divide-y divide-white/5">
                {children}
            </tbody>
        ),
        tr: ({ children }) => (
            <tr className="hover:bg-zinc-800/30 transition-colors">
                {children}
            </tr>
        ),
        th: ({ children }) => (
            <th className="px-4 py-3 text-left">
                {children}
            </th>
        ),
        td: ({ children }) => (
            <td className="px-4 py-3 text-zinc-400">
                {children}
            </td>
        ),
    }
}

export function MarkdownRenderer({ content, className, coverImageUrl, source }: MarkdownRendererProps) {
    const processedContent = preprocessMarkdown(content, coverImageUrl, source)
    const components = buildComponents(source)
    const style = source ? (SOURCE_STYLES[source] ?? null) : null

    return (
        <div
            className={className}
            data-source={source ?? undefined}
            data-source-class={style?.container ?? undefined}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    )
}
