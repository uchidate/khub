'use client'

import { useState, useRef, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Sparkles, Send, Loader2, ChevronDown, ChevronRight, Bot, User, RotateCcw } from 'lucide-react'

interface ToolCall {
    name: string
    input: unknown
    result: unknown
}

interface Message {
    role: 'user' | 'assistant'
    content: string
    toolCalls?: ToolCall[]
    meta?: { iterations: number; tokensUsed?: { input: number; output: number } }
    error?: boolean
}

const TOOL_LABELS: Record<string, string> = {
    search_artists: 'Buscar artistas',
    search_groups: 'Buscar grupos',
    search_productions: 'Buscar produções',
    get_group_details: 'Detalhes do grupo',
    get_blog_post: 'Buscar artigo',
    list_blog_posts: 'Listar artigos',
    create_draft_blog: 'Criar rascunho',
    update_blog_draft: 'Atualizar rascunho',
}

function ToolCallItem({ tc }: { tc: ToolCall }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="border border-border rounded-md overflow-hidden text-[11px]">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-surface hover:bg-surface-hover transition-colors text-left"
            >
                {open ? <ChevronDown className="w-3 h-3 text-muted shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted shrink-0" />}
                <span className="font-mono text-accent">{TOOL_LABELS[tc.name] ?? tc.name}</span>
                <span className="text-muted ml-auto font-mono">{tc.name}</span>
            </button>
            {open && (
                <div className="border-t border-border divide-y divide-border">
                    <div className="px-3 py-2 bg-background">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">Input</p>
                        <pre className="text-[10px] text-foreground/80 whitespace-pre-wrap break-all">{JSON.stringify(tc.input, null, 2)}</pre>
                    </div>
                    <div className="px-3 py-2 bg-background">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">Output</p>
                        <pre className="text-[10px] text-foreground/80 whitespace-pre-wrap break-all">
                            {typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    )
}

function MessageBubble({ msg }: { msg: Message }) {
    const isUser = msg.role === 'user'
    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isUser ? 'bg-accent/15 text-accent' : 'bg-surface border border-border text-muted'}`}>
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                    isUser
                        ? 'bg-accent text-white rounded-tr-sm'
                        : msg.error
                            ? 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-tl-sm'
                            : 'bg-surface border border-border text-foreground rounded-tl-sm'
                }`}>
                    {msg.content}
                </div>

                {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="w-full flex flex-col gap-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted px-1">
                            {msg.toolCalls.length} tool call{msg.toolCalls.length > 1 ? 's' : ''}
                        </p>
                        {msg.toolCalls.map((tc, i) => (
                            <ToolCallItem key={i} tc={tc} />
                        ))}
                    </div>
                )}

                {msg.meta && (
                    <p className="text-[10px] text-muted/60 px-1">
                        {msg.meta.iterations} iteraç{msg.meta.iterations === 1 ? 'ão' : 'ões'}
                        {msg.meta.tokensUsed && ` · ${msg.meta.tokensUsed.input + msg.meta.tokensUsed.output} tokens`}
                    </p>
                )}
            </div>
        </div>
    )
}

const SUGGESTIONS = [
    'Liste os 5 artigos mais recentes do blog',
    'Crie um rascunho sobre o BTS com dados do banco',
    'Busque informações sobre o grupo BLACKPINK',
    'Quais produções (dramas) temos cadastradas?',
]

export default function BlogAgentPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const send = async (query: string) => {
        if (!query.trim() || loading) return
        const userMsg: Message = { role: 'user', content: query.trim() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await fetch('/api/agents/blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim() }),
            })
            const json = await res.json()
            if (!res.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: json.error ?? 'Erro desconhecido', error: true }])
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: json.data.message,
                    toolCalls: json.data.toolCalls ?? [],
                    meta: json.data.metadata,
                }])
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão com o agente.', error: true }])
        } finally {
            setLoading(false)
            setTimeout(() => textareaRef.current?.focus(), 50)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send(input)
        }
    }

    return (
        <AdminLayout title="Agente de Blog" subtitle="IA especializada em criar e gerenciar conteúdo">
            <div className="flex flex-col h-[calc(100vh-140px)] max-w-3xl mx-auto">

                {/* Chat area */}
                <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
                            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                                <Sparkles className="w-7 h-7 text-accent" />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-bold text-foreground mb-1">Agente de Blog</h2>
                                <p className="text-[13px] text-muted max-w-[40ch]">
                                    Pesquisa artistas, grupos e produções no banco e cria rascunhos de artigos automaticamente.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                                {SUGGESTIONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => send(s)}
                                        className="text-left px-3 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-colors text-[12px] text-muted hover:text-foreground"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, i) => (
                                <MessageBubble key={i} msg={msg} />
                            ))}
                            {loading && (
                                <div className="flex gap-3">
                                    <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 mt-0.5">
                                        <Bot className="w-3.5 h-3.5 text-muted" />
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-surface border border-border flex items-center gap-2">
                                        <Loader2 className="w-3.5 h-3.5 text-muted animate-spin" />
                                        <span className="text-[13px] text-muted">Pensando…</span>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </>
                    )}
                </div>

                {/* Input */}
                <div className="border-t border-border pt-4 pb-2">
                    {messages.length > 0 && (
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={() => setMessages([])}
                                className="flex items-center gap-1.5 text-[11px] text-muted hover:text-foreground transition-colors"
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
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite uma instrução… (Enter para enviar, Shift+Enter para nova linha)"
                            disabled={loading}
                            rows={2}
                            className="flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-3 text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 transition-all"
                        />
                        <button
                            onClick={() => send(input)}
                            disabled={loading || !input.trim()}
                            className="h-[54px] w-[54px] rounded-xl bg-accent text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-muted/50 mt-2 text-center">
                        O agente pode criar rascunhos reais no banco — revise antes de publicar.
                    </p>
                </div>
            </div>
        </AdminLayout>
    )
}
