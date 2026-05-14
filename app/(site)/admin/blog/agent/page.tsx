'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
    Sparkles, Send, Loader2, ChevronDown, ChevronRight, Bot, User,
    RotateCcw, Copy, Check, ExternalLink, Cpu, Zap, AlertCircle,
    FileText, Search, Users, Film, BookOpen, PenLine,
} from 'lucide-react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ToolCall { name: string; input: unknown; result: unknown }
interface Message {
    role: 'user' | 'assistant'
    content: string
    toolCalls?: ToolCall[]
    meta?: { iterations: number; tokensUsed?: { input: number; output: number } }
    error?: boolean
    ts: number
}

// ── Tool metadata ─────────────────────────────────────────────────────────────

const TOOL_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    search_artists:    { label: 'Buscar artistas',    icon: <Users className="w-3 h-3" />,    color: 'text-purple-500' },
    search_groups:     { label: 'Buscar grupos',      icon: <Users className="w-3 h-3" />,    color: 'text-blue-500' },
    search_productions:{ label: 'Buscar produções',   icon: <Film className="w-3 h-3" />,     color: 'text-pink-500' },
    get_group_details: { label: 'Detalhes do grupo',  icon: <Search className="w-3 h-3" />,   color: 'text-indigo-500' },
    get_blog_post:     { label: 'Buscar artigo',      icon: <BookOpen className="w-3 h-3" />, color: 'text-green-500' },
    list_blog_posts:   { label: 'Listar artigos',     icon: <FileText className="w-3 h-3" />, color: 'text-teal-500' },
    create_draft_blog: { label: 'Criar rascunho',     icon: <PenLine className="w-3 h-3" />,  color: 'text-orange-500' },
    update_blog_draft: { label: 'Atualizar rascunho', icon: <PenLine className="w-3 h-3" />,  color: 'text-amber-500' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function extractDraftId(toolCalls?: ToolCall[]): string | null {
    for (const tc of toolCalls ?? []) {
        if (tc.name === 'create_draft_blog' || tc.name === 'update_blog_draft') {
            try {
                const r = typeof tc.result === 'string' ? JSON.parse(tc.result) : tc.result as Record<string, unknown>
                if (r && typeof r === 'object' && 'id' in r && typeof r.id === 'string') return r.id as string
            } catch { /* ignore */ }
        }
    }
    return null
}

// Simple markdown-to-JSX: bold, italic, code, line breaks
function renderMarkdown(text: string) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
        const parts = line
            .split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
            .map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**'))
                    return <strong key={j}>{part.slice(2, -2)}</strong>
                if (part.startsWith('`') && part.endsWith('`'))
                    return <code key={j} className="font-mono text-[11px] bg-black/10 dark:bg-white/10 px-1 rounded">{part.slice(1, -1)}</code>
                if (part.startsWith('*') && part.endsWith('*'))
                    return <em key={j}>{part.slice(1, -1)}</em>
                return part
            })
        return <span key={i}>{parts}{i < lines.length - 1 && <br />}</span>
    })
}

// ── ToolCallItem ──────────────────────────────────────────────────────────────

function ToolCallItem({ tc }: { tc: ToolCall }) {
    const [open, setOpen] = useState(false)
    const meta = TOOL_META[tc.name]
    return (
        <div className="border border-border rounded-lg overflow-hidden text-[11px] bg-background">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface/60 transition-colors text-left"
            >
                <span className={`${meta?.color ?? 'text-muted'} shrink-0`}>{meta?.icon ?? <Search className="w-3 h-3" />}</span>
                <span className="font-medium text-foreground">{meta?.label ?? tc.name}</span>
                <span className="text-muted/50 font-mono ml-auto mr-2 hidden sm:block">{tc.name}</span>
                {open ? <ChevronDown className="w-3 h-3 text-muted shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted shrink-0" />}
            </button>
            {open && (
                <div className="border-t border-border divide-y divide-border/60">
                    <div className="px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Input</p>
                        <pre className="text-[10px] text-foreground/70 whitespace-pre-wrap break-all font-mono">{JSON.stringify(tc.input, null, 2)}</pre>
                    </div>
                    <div className="px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Output</p>
                        <pre className="text-[10px] text-foreground/70 whitespace-pre-wrap break-all font-mono">
                            {typeof tc.result === 'string'
                                ? (() => { try { return JSON.stringify(JSON.parse(tc.result), null, 2) } catch { return tc.result } })()
                                : JSON.stringify(tc.result, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    const copy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }
    return (
        <button onClick={copy} className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-muted/60 hover:text-muted">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
    )
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
    const isUser = msg.role === 'user'
    const draftId = extractDraftId(msg.toolCalls)

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                isUser ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-surface border-border text-muted'
            }`}>
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div className={`flex flex-col gap-2 min-w-0 ${isUser ? 'items-end max-w-[75%]' : 'items-start w-full max-w-[85%]'}`}>
                {/* Bubble */}
                <div className={`relative group px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                    isUser
                        ? 'bg-accent text-white rounded-tr-sm'
                        : msg.error
                            ? 'bg-red-500/8 border border-red-500/25 text-red-600 dark:text-red-400 rounded-tl-sm w-full'
                            : 'bg-surface border border-border text-foreground rounded-tl-sm w-full'
                }`}>
                    {msg.error && <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 shrink-0 -mt-0.5" />}
                    {isUser ? msg.content : <span>{renderMarkdown(msg.content)}</span>}
                    {!isUser && !msg.error && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyButton text={msg.content} />
                        </div>
                    )}
                </div>

                {/* Tool calls */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="w-full flex flex-col gap-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted/70 px-0.5">
                            {msg.toolCalls.length} ferramenta{msg.toolCalls.length > 1 ? 's' : ''} usada{msg.toolCalls.length > 1 ? 's' : ''}
                        </p>
                        {msg.toolCalls.map((tc, i) => <ToolCallItem key={i} tc={tc} />)}
                    </div>
                )}

                {/* Draft link */}
                {draftId && (
                    <Link
                        href={`/admin/blog/${draftId}/edit`}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:underline"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Abrir rascunho no editor
                    </Link>
                )}

                {/* Meta */}
                <div className="flex items-center gap-2 px-0.5">
                    <span className="text-[10px] text-muted/50">{formatTime(msg.ts)}</span>
                    {msg.meta && (
                        <span className="text-[10px] text-muted/40">
                            · {msg.meta.iterations} iter.
                            {msg.meta.tokensUsed ? ` · ${(msg.meta.tokensUsed.input + msg.meta.tokensUsed.output).toLocaleString()} tokens` : ''}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Suggestions ───────────────────────────────────────────────────────────────

const SUGGESTIONS = [
    { text: 'Liste os 5 artigos mais recentes do blog', icon: <FileText className="w-3.5 h-3.5" /> },
    { text: 'Crie um rascunho sobre o BTS com dados do banco', icon: <PenLine className="w-3.5 h-3.5" /> },
    { text: 'Busque informações sobre o grupo BLACKPINK', icon: <Users className="w-3.5 h-3.5" /> },
    { text: 'Quais produções (dramas) temos cadastradas?', icon: <Film className="w-3.5 h-3.5" /> },
    { text: 'Crie um artigo de review do álbum mais recente do IVE', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { text: 'Quais artistas estão em alta no banco?', icon: <Search className="w-3.5 h-3.5" /> },
]

// ── Main ──────────────────────────────────────────────────────────────────────

export default function BlogAgentPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [provider, setProvider] = useState<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        fetch('/api/agents/blog').then(r => r.json()).then(d => setProvider(d.provider ?? 'anthropic')).catch(() => {})
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
        e.target.style.height = 'auto'
        e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
    }

    const send = useCallback(async (query: string) => {
        if (!query.trim() || loading) return
        setMessages(prev => [...prev, { role: 'user', content: query.trim(), ts: Date.now() }])
        setInput('')
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
        setLoading(true)

        try {
            const res = await fetch('/api/agents/blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim() }),
            })
            const json = await res.json()
            if (!res.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: json.error ?? 'Erro desconhecido', error: true, ts: Date.now() }])
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: json.data.message,
                    toolCalls: json.data.toolCalls ?? [],
                    meta: json.data.metadata,
                    ts: Date.now(),
                }])
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão com o agente.', error: true, ts: Date.now() }])
        } finally {
            setLoading(false)
            setTimeout(() => textareaRef.current?.focus(), 50)
        }
    }, [loading])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
    }

    const providerLabel = provider === 'ollama' ? 'Ollama · qwen2.5:7b' : 'Claude · Anthropic'
    const ProviderIcon = provider === 'ollama' ? Cpu : Zap

    return (
        <AdminLayout title="Agente de Blog" subtitle="IA especializada em criar e gerenciar conteúdo">
            <div className="flex h-[calc(100vh-140px)] gap-0 -mx-4 sm:-mx-6">

                {/* ── Sidebar ── */}
                <aside className="hidden lg:flex flex-col w-64 border-r border-border shrink-0 bg-surface/30">
                    <div className="px-4 py-3 border-b border-border">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Provider</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <ProviderIcon className="w-3.5 h-3.5 text-accent" />
                            <span className="text-[12px] font-medium text-foreground">{providerLabel}</span>
                        </div>
                    </div>

                    <div className="px-4 py-3 border-b border-border">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Ferramentas disponíveis</p>
                        <div className="flex flex-col gap-1">
                            {Object.entries(TOOL_META).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2 py-1">
                                    <span className={val.color}>{val.icon}</span>
                                    <span className="text-[11px] text-muted">{val.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="px-4 py-3 mt-auto border-t border-border">
                        <p className="text-[10px] text-muted/50 leading-relaxed">
                            Rascunhos criados ficam em <span className="font-mono">DRAFT</span> — revise antes de publicar.
                        </p>
                    </div>
                </aside>

                {/* ── Chat ── */}
                <div className="flex flex-col flex-1 min-w-0">
                    {/* Chat messages */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-accent" />
                                </div>
                                <div>
                                    <h2 className="text-[16px] font-bold text-foreground mb-1.5">Agente de Blog</h2>
                                    <p className="text-[13px] text-muted max-w-[44ch] leading-relaxed">
                                        Pesquisa artistas, grupos e produções no banco e cria rascunhos de artigos automaticamente.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                                    {SUGGESTIONS.map(s => (
                                        <button
                                            key={s.text}
                                            onClick={() => send(s.text)}
                                            className="flex items-start gap-2.5 text-left px-3.5 py-3 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent/30 transition-all text-[12px] text-muted hover:text-foreground group"
                                        >
                                            <span className="text-muted group-hover:text-accent transition-colors mt-0.5 shrink-0">{s.icon}</span>
                                            {s.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                                {loading && (
                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 mt-0.5">
                                            <Bot className="w-3.5 h-3.5 text-muted" />
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-surface border border-border flex items-center gap-2.5">
                                            <span className="flex gap-1">
                                                {[0, 1, 2].map(i => (
                                                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted/50 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                                                ))}
                                            </span>
                                            <span className="text-[12px] text-muted">Processando…</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </>
                        )}
                    </div>

                    {/* Input area */}
                    <div className="border-t border-border px-4 sm:px-6 pt-3 pb-4 bg-background">
                        {messages.length > 0 && (
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5 lg:hidden">
                                    <ProviderIcon className="w-3 h-3 text-accent" />
                                    <span className="text-[10px] text-muted">{providerLabel}</span>
                                </div>
                                <button
                                    onClick={() => setMessages([])}
                                    className="flex items-center gap-1.5 text-[11px] text-muted hover:text-foreground transition-colors ml-auto"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Nova conversa
                                </button>
                            </div>
                        )}
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={autoResize}
                                onKeyDown={handleKeyDown}
                                placeholder="Digite uma instrução… (Enter envia · Shift+Enter nova linha)"
                                disabled={loading}
                                rows={1}
                                className="flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-3 text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 transition-all leading-relaxed overflow-hidden"
                                style={{ minHeight: '44px' }}
                            />
                            <button
                                onClick={() => send(input)}
                                disabled={loading || !input.trim()}
                                className="h-[44px] w-[44px] rounded-xl bg-accent text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-35 shrink-0"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
