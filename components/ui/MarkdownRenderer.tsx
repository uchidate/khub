'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface MarkdownRendererProps {
    content: string
    className?: string
}

function isExternalUrl(href: string): boolean {
    return href.startsWith('http://') || href.startsWith('https://')
}

function preprocessMarkdown(content: string): string {
    let text = content

    // Normalize Windows line endings
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // Remove leading bold English title pattern: first line "**Title**"
    text = text.replace(/^\*\*[^\n]+\*\*\n+/, '')

    // Remove trailing "---\n*Fonte: Notícia original*" (the page footer already shows this)
    text = text.replace(/\n+---\n+\*[^\n]*[Ff]onte[^\n]*\*/g, '')
    text = text.replace(/\n+---\n+\*[^\n]*[Ss]ource[^\n]*\*/g, '')

    // If no paragraph breaks exist and content is long, add them at sentence boundaries
    if (!text.includes('\n\n') && text.length > 200) {
        text = text.replace(/([.!?])\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ"'])/g, '$1\n\n$2')
    }

    return text.trim()
}

const components: Components = {
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
    h2: ({ children }) => (
        <h2 className="text-2xl font-bold text-white mt-8 mb-4 pb-2 border-b border-white/10 leading-tight">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-xl font-bold text-purple-300 mt-7 mb-3 leading-tight">
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
                className="text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors"
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
        <blockquote className="border-l-4 border-purple-500 pl-5 my-7 text-zinc-400 italic bg-purple-950/10 py-3 pr-4 rounded-r-xl">
            {children}
        </blockquote>
    ),

    hr: () => (
        <hr className="border-white/10 my-10" />
    ),

    ul: ({ children }) => (
        <ul className="list-disc list-outside ml-6 space-y-2 mb-6 text-zinc-300">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="list-decimal list-outside ml-6 space-y-2 mb-6 text-zinc-300">
            {children}
        </ol>
    ),
    li: ({ children }) => (
        <li className="leading-relaxed pl-1">
            {children}
        </li>
    ),

    code: ({ children, className }) => {
        const isBlock = className?.startsWith('language-')
        if (isBlock) {
            return (
                <code className="block text-sm font-mono text-purple-300 leading-relaxed">
                    {children}
                </code>
            )
        }
        return (
            <code className="bg-zinc-800 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono">
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

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    const processedContent = preprocessMarkdown(content)

    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    )
}
