'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
    Upload, CheckCircle, XCircle, AlertTriangle, Loader2,
    ChevronDown, ChevronRight, FileJson, Sparkles, ExternalLink, RotateCcw,
    Globe, Server, Image as ImageIcon, Link2, Eye, Clock, Hash, Wifi, WifiOff,
} from 'lucide-react'
import Link from 'next/link'
import { BlogBlockRenderer } from '@/components/ui/BlogBlockRenderer'
import type { BlogBlock } from '@/lib/types/blocks'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ValidationIssue { block: number; type: string; message: string }
interface ValidationResult {
    valid: boolean; blockCount: number; issues: ValidationIssue[]
    suggestions: string; summary: { types: Record<string, number> }
}
interface Category { id: string; name: string; slug: string }
interface LinkSuggestion { label: string; url: string; type: string; matchedTerm: string }
interface ImportedPost { id: string; slug: string; title: string }
interface RecentImport { id: string; title: string; slug: string; createdAt: string }

const LS_JSON_KEY = 'blog_import_json'
const LS_HISTORY_KEY = 'blog_import_history'

// ── Word count ────────────────────────────────────────────────────────────────

function countWords(json: string): number {
    try {
        const parsed = JSON.parse(json.trim())
        const blocks: Record<string, unknown>[] = Array.isArray(parsed)
            ? parsed : parsed.blocks ?? []
        return blocks.reduce((total, b) => {
            const texts: string[] = []
            if (typeof b.text === 'string') texts.push(b.text)
            if (Array.isArray(b.items)) texts.push(...(b.items as string[]))
            return total + texts.join(' ').split(/\s+/).filter(Boolean).length
        }, 0)
    } catch { return 0 }
}

// ── Block preview ─────────────────────────────────────────────────────────────

const BLOCK_COLORS: Record<string, string> = {
    blog_heading:   'border-l-accent bg-accent/5',
    blog_paragraph: 'border-l-border bg-surface/50',
    blog_quote:     'border-l-purple-400 bg-purple-500/5',
    blog_curiosity: 'border-l-amber-400 bg-amber-500/5',
    blog_list:      'border-l-green-400 bg-green-500/5',
    blog_rating:    'border-l-pink-400 bg-pink-500/5',
    blog_image:     'border-l-blue-400 bg-blue-500/5',
    blog_video:     'border-l-red-400 bg-red-500/5',
}

function BlockPreview({ block, index }: { block: Record<string, unknown>; index: number }) {
    const [open, setOpen] = useState(index < 3)
    const color = BLOCK_COLORS[block.type as string] ?? 'border-l-border bg-surface/30'

    const preview = () => {
        switch (block.type) {
            case 'blog_heading':   return <h3 className="font-bold text-foreground text-[14px]">{block.text as string}</h3>
            case 'blog_paragraph': return <p className="text-[12px] text-muted leading-relaxed line-clamp-3">{block.text as string}</p>
            case 'blog_quote':     return <blockquote className="text-[12px] italic text-muted">"{block.text as string}"<span className="block text-[10px] mt-1 not-italic">— {(block.author as string) ?? 'Anônimo'}</span></blockquote>
            case 'blog_curiosity': return <p className="text-[12px] text-amber-700 dark:text-amber-300 line-clamp-2">💡 {block.text as string}</p>
            case 'blog_list':      return <ul className="text-[12px] text-muted list-disc list-inside space-y-0.5">{(block.items as string[])?.slice(0, 3).map((item, i) => <li key={i} className="line-clamp-1">{item}</li>)}</ul>
            case 'blog_rating':    return <p className="text-[12px] text-pink-600 font-semibold">⭐ {block.score as number}/10 {block.label ? `— ${block.label}` : ''}</p>
            case 'blog_image':     return <p className="text-[12px] text-blue-600">🖼 {block.alt as string}</p>
            case 'blog_video':     return <p className="text-[12px] text-red-600">▶ {block.url as string}</p>
            default:               return <p className="text-[11px] text-muted font-mono">{JSON.stringify(block).slice(0, 80)}</p>
        }
    }

    return (
        <div className={`border-l-2 rounded-r-lg px-3 py-2.5 ${color}`}>
            <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2 text-left">
                <span className="text-[9px] font-mono font-bold text-muted/60 w-5 shrink-0">{index + 1}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted/70 w-28 shrink-0">{block.type as string}</span>
                <div className="flex-1 min-w-0 overflow-hidden">{preview()}</div>
                {open ? <ChevronDown className="w-3 h-3 text-muted shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted shrink-0" />}
            </button>
            {open && (
                <pre className="mt-2 ml-7 text-[10px] font-mono text-muted/70 whitespace-pre-wrap break-all bg-background/60 rounded p-2">
                    {JSON.stringify(block, null, 2)}
                </pre>
            )}
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Step = 'input' | 'validating' | 'validated' | 'importing' | 'done'

export default function BlogImportPage() {
    const [step, setStep] = useState<Step>('input')
    const [rawJson, setRawJson] = useState('')
    const [wordCount, setWordCount] = useState(0)
    const [blocks, setBlocks] = useState<Record<string, unknown>[]>([])
    const [parseError, setParseError] = useState('')
    const [validation, setValidation] = useState<ValidationResult | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [form, setForm] = useState({ title: '', slug: '', excerpt: '', categoryId: '', coverImageUrl: '', focusKeyword: '' })
    const [tags, setTags] = useState<string[]>([])
    const [metaAutoFilled, setMetaAutoFilled] = useState(false)
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
    const [slugTaken, setSlugTaken] = useState<{ id: string; title: string } | null>(null)
    const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>([])
    const [importedPost, setImportedPost] = useState<ImportedPost | null>(null)
    const [importError, setImportError] = useState('')
    const [publishEnvs, setPublishEnvs] = useState({ staging: false, production: false })
    const [publishing, setPublishing] = useState(false)
    const [publishResults, setPublishResults] = useState<Record<string, { success: boolean; error?: string }> | null>(null)
    const [recentImports, setRecentImports] = useState<RecentImport[]>([])
    const [uploadingCover, setUploadingCover] = useState(false)
    const [tunnelStatus, setTunnelStatus] = useState<{ staging: boolean; production: boolean } | null>(null)
    const [showBlockPreview, setShowBlockPreview] = useState(false)
    const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)

    // Load categories + restore localStorage + check tunnels
    useEffect(() => {
        fetch('/api/admin/blog/categories').then(r => r.json()).then(d => setCategories(d.categories ?? d ?? [])).catch(() => {})
        const saved = localStorage.getItem(LS_JSON_KEY)
        if (saved) { setRawJson(saved); setWordCount(countWords(saved)) }
        const hist = localStorage.getItem(LS_HISTORY_KEY)
        if (hist) { try { setRecentImports(JSON.parse(hist)) } catch (_e) { /* invalid JSON */ } }
        fetch('/api/admin/blog/tunnel-status').then(r => r.json()).then(setTunnelStatus).catch(() => {})
    }, [])

    // Persist JSON to localStorage
    useEffect(() => {
        if (rawJson) localStorage.setItem(LS_JSON_KEY, rawJson)
        else localStorage.removeItem(LS_JSON_KEY)
        setWordCount(countWords(rawJson))
    }, [rawJson])

    // Slug check with debounce
    const checkSlug = useCallback((slug: string) => {
        if (!slug) { setSlugStatus('idle'); return }
        setSlugStatus('checking')
        if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current)
        slugCheckTimer.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/admin/blog/check-slug?slug=${encodeURIComponent(slug)}`)
                const data = await res.json()
                setSlugStatus(data.available ? 'available' : 'taken')
                setSlugTaken(data.existing ?? null)
            } catch { setSlugStatus('idle') }
        }, 500)
    }, [])

    const handleTitleChange = (title: string) => {
        const slug = title.toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim().replace(/\s+/g, '-')
        setForm(f => ({ ...f, title, slug }))
        checkSlug(slug)
    }

    const handleSlugChange = (slug: string) => {
        setForm(f => ({ ...f, slug }))
        checkSlug(slug)
    }

    const handleCoverUpload = async (file: File) => {
        setUploadingCover(true)
        try {
            const fd = new FormData()
            fd.append('file', file)
            const res = await fetch('/api/admin/blog/upload-cover', { method: 'POST', body: fd })
            const data = await res.json()
            if (data.url) setForm(f => ({ ...f, coverImageUrl: data.url }))
            else alert(data.error ?? 'Erro no upload')
        } finally {
            setUploadingCover(false)
        }
    }

    const parseJson = () => {
        setParseError('')
        try {
            const parsed = JSON.parse(rawJson.trim())
            const arr = Array.isArray(parsed) ? parsed : parsed.blocks ?? parsed.content ?? []
            if (!Array.isArray(arr) || arr.length === 0) throw new Error('JSON deve ser um array de blocos')
            setBlocks(arr)

            if (!Array.isArray(parsed) && parsed.meta) {
                const m = parsed.meta as Record<string, unknown>
                const title = (m.title as string) ?? ''
                const autoSlug = title.toLowerCase()
                    .normalize('NFD').replace(/[̀-ͯ]/g, '')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .trim().replace(/\s+/g, '-')
                const slug = (m.slug as string) ?? (autoSlug || '')
                setForm(f => ({
                    ...f,
                    title,
                    slug,
                    excerpt: (m.excerpt as string) ?? f.excerpt,
                    focusKeyword: (m.focusKeyword as string) ?? f.focusKeyword,
                }))
                if (slug) checkSlug(slug)
                if (Array.isArray(m.tags)) setTags(m.tags.map(String))
                setMetaAutoFilled(true)

                // Suggest internal links from block text
                const allText = arr.map((b: Record<string, unknown>) =>
                    [b.text, ...(Array.isArray(b.items) ? b.items : [])].filter(Boolean).join(' ')
                ).join(' ')
                fetch('/api/admin/blog/suggest-links', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: allText }),
                }).then(r => r.json()).then(d => setLinkSuggestions(d.suggestions ?? [])).catch(() => {})
            } else {
                setMetaAutoFilled(false)
            }
            return arr
        } catch (e) {
            setParseError(`JSON inválido: ${e instanceof Error ? e.message : e}`)
            return null
        }
    }

    const validate = async () => {
        const arr = parseJson()
        if (!arr) return
        setStep('validating')
        try {
            const res = await fetch('/api/admin/blog/validate-blocks', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocks: arr }),
            })
            setValidation(await res.json())
            setStep('validated')
        } catch { setStep('input'); setParseError('Erro ao conectar com o validador') }
    }

    const importPost = async () => {
        if (!form.title || !form.slug) return
        setStep('importing'); setImportError('')
        try {
            const res = await fetch('/api/admin/blog/import-blocks', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, tags, blocks }),
            })
            const data = await res.json()
            if (!res.ok) { setImportError(data.error ?? 'Erro desconhecido'); setStep('validated'); return }
            setImportedPost(data.post)
            localStorage.removeItem(LS_JSON_KEY)

            // Save to history
            const newEntry: RecentImport = { ...data.post, createdAt: new Date().toISOString() }
            setRecentImports(prev => {
                const updated = [newEntry, ...prev.filter(p => p.id !== newEntry.id)].slice(0, 8)
                localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(updated))
                return updated
            })
            setStep('done')
        } catch { setImportError('Erro de conexão'); setStep('validated') }
    }

    const publishRemote = async () => {
        if (!importedPost) return
        const envs = (Object.keys(publishEnvs) as Array<'staging' | 'production'>).filter(k => publishEnvs[k])
        if (envs.length === 0) return
        setPublishing(true); setPublishResults(null)
        try {
            const res = await fetch('/api/admin/blog/publish-remote', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: importedPost.id, environments: envs }),
            })
            const data = await res.json()
            setPublishResults(data.results ?? { error: data.error })
        } catch { setPublishResults({ error: { success: false, error: 'Erro de conexão' } }) }
        finally { setPublishing(false) }
    }

    const reset = () => {
        setStep('input'); setRawJson(''); setBlocks([]); setParseError(''); setWordCount(0)
        setValidation(null); setForm({ title: '', slug: '', excerpt: '', categoryId: '', coverImageUrl: '', focusKeyword: '' })
        setMetaAutoFilled(false); setTags([]); setSlugStatus('idle'); setSlugTaken(null)
        setLinkSuggestions([]); setImportedPost(null); setImportError('')
        setPublishEnvs({ staging: false, production: false }); setPublishing(false); setPublishResults(null)
    }

    const slugStatusIcon = () => {
        if (slugStatus === 'checking') return <Loader2 className="w-3 h-3 animate-spin text-muted" />
        if (slugStatus === 'available') return <CheckCircle className="w-3 h-3 text-green-500" />
        if (slugStatus === 'taken') return <XCircle className="w-3 h-3 text-red-500" />
        return null
    }

    const TYPE_ICONS: Record<string, string> = { artist: '🎤', group: '👥', production: '🎬', post: '📝' }

    return (
        <AdminLayout title="Importar Artigo" subtitle="Cole o JSON gerado pelo Gemini, valide e insira como rascunho">
            <div className="max-w-5xl mx-auto">

                {/* Referência editorial de blocos */}
                <div className="mb-4 flex justify-end">
                    <Link href="/admin/blog/blocks-demo"
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-muted hover:text-accent transition-colors border border-border rounded-lg px-3 py-1.5 hover:border-accent/30">
                        <Eye className="w-3 h-3" /> Guia de blocos
                    </Link>
                </div>

                {/* Steps indicator */}
                <div className="flex items-center gap-2 mb-6 text-[11px] font-semibold">
                    {(['input','validated','done'] as const).map((s, i) => {
                        const labels = ['1. JSON', '2. Validar & Preencher', '3. Importado']
                        const active = s === step || (s === 'validated' && (step === 'validating' || step === 'importing'))
                        const done = (i === 0 && step !== 'input') || (i === 1 && step === 'done')
                        return (
                            <span key={s} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                                done ? 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400' :
                                active ? 'border-accent/40 bg-accent/10 text-accent' :
                                'border-border text-muted'
                            }`}>
                                {done && <CheckCircle className="w-3 h-3" />}
                                {labels[i]}
                            </span>
                        )
                    })}
                </div>

                {/* ── STEP 1: Input ── */}
                {step === 'input' && (
                    <div className="grid lg:grid-cols-[1fr_240px] gap-5">
                        <div className="flex flex-col gap-4">
                            <div className="border border-border rounded-xl bg-surface/30 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileJson className="w-4 h-4 text-accent" />
                                    <p className="text-[13px] font-semibold text-foreground">JSON do Gemini</p>
                                    <div className="ml-auto flex items-center gap-3">
                                        {wordCount > 0 && (
                                            <span className={`text-[10px] font-semibold flex items-center gap-1 ${wordCount >= 1300 ? 'text-green-600' : wordCount >= 800 ? 'text-amber-500' : 'text-muted'}`}>
                                                <Hash className="w-2.5 h-2.5" />
                                                {wordCount} palavras {wordCount < 1300 && `(faltam ${1300 - wordCount})`}
                                            </span>
                                        )}
                                        {rawJson && (
                                            <button onClick={() => { setRawJson(''); setWordCount(0) }} className="text-[10px] text-muted hover:text-red-500 transition-colors">
                                                limpar
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <textarea
                                    value={rawJson}
                                    onChange={e => setRawJson(e.target.value)}
                                    placeholder={'{\n  "meta": { "title": "...", "slug": "...", "excerpt": "...", "tags": [] },\n  "blocks": [\n    {"type": "blog_heading", "text": "Título..."},\n    {"type": "blog_paragraph", "text": "Conteúdo..."}\n  ]\n}'}
                                    className="w-full h-96 resize-none rounded-lg border border-border bg-background font-mono text-[12px] text-foreground p-4 focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-muted/40"
                                />
                                {parseError && (
                                    <div className="flex items-center gap-2 mt-2 text-[12px] text-red-600 dark:text-red-400">
                                        <XCircle className="w-3.5 h-3.5 shrink-0" /> {parseError}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={validate}
                                    disabled={!rawJson.trim()}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Validar com Ollama
                                </button>
                            </div>
                        </div>

                        {/* Recent imports sidebar */}
                        {recentImports.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" /> Importados recentemente
                                </p>
                                <div className="flex flex-col gap-1.5">
                                    {recentImports.map(p => (
                                        <div key={p.id} className="border border-border rounded-lg bg-surface/30 p-2.5 flex flex-col gap-1">
                                            <p className="text-[11px] font-semibold text-foreground line-clamp-2 leading-tight">{p.title}</p>
                                            <div className="flex gap-1.5">
                                                <Link href={`/admin/blog/${p.id}/edit`} className="text-[10px] text-accent hover:underline flex items-center gap-0.5">
                                                    <ExternalLink className="w-2.5 h-2.5" /> editor
                                                </Link>
                                                <Link href={`/blog/${p.slug}`} target="_blank" className="text-[10px] text-muted hover:text-foreground flex items-center gap-0.5">
                                                    <Eye className="w-2.5 h-2.5" /> ver
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP: Validating ── */}
                {step === 'validating' && (
                    <div className="flex flex-col items-center justify-center gap-4 py-20">
                        <Loader2 className="w-8 h-8 text-accent animate-spin" />
                        <p className="text-[13px] text-muted">Validando estrutura e consultando Ollama…</p>
                    </div>
                )}

                {/* ── STEP 2: Validated ── */}
                {(step === 'validated' || step === 'importing') && validation && (
                    <div className="grid lg:grid-cols-[1fr_380px] gap-6">

                        {/* Left: validation + links + preview */}
                        <div className="flex flex-col gap-4 min-w-0">
                            <div className={`border rounded-xl p-4 ${validation.valid ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {validation.valid
                                        ? <CheckCircle className="w-4 h-4 text-green-500" />
                                        : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                    <p className="text-[13px] font-semibold text-foreground">
                                        {validation.valid ? 'Estrutura válida' : `${validation.issues.length} problema(s) encontrado(s)`}
                                    </p>
                                    <span className="text-[11px] text-muted ml-auto">{validation.blockCount} blocos</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {Object.entries(validation.summary.types).map(([t, n]) => (
                                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background border border-border text-muted">
                                            {t} ×{n}
                                        </span>
                                    ))}
                                </div>
                                {validation.issues.length > 0 && (
                                    <div className="flex flex-col gap-1 mb-3">
                                        {validation.issues.map((issue, i) => (
                                            <div key={i} className="flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300">
                                                <XCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                                <span>Bloco {issue.block}: {issue.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {validation.suggestions && (
                                    <div className="border-t border-border/50 pt-3 mt-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3" /> Sugestões do Ollama
                                        </p>
                                        <p className="text-[12px] text-muted leading-relaxed whitespace-pre-line">{validation.suggestions}</p>
                                    </div>
                                )}
                            </div>

                            {/* Internal link suggestions */}
                            {linkSuggestions.length > 0 && (
                                <div className="border border-border rounded-xl p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2.5 flex items-center gap-1.5">
                                        <Link2 className="w-3 h-3" /> Links internos sugeridos
                                        <span className="text-[10px] normal-case font-normal">(adicione no editor)</span>
                                    </p>
                                    <div className="flex flex-col gap-1.5">
                                        {linkSuggestions.map((s, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[11px]">
                                                <span className="shrink-0">{TYPE_ICONS[s.type] ?? '🔗'}</span>
                                                <span className="text-foreground font-medium">{s.label}</span>
                                                <code className="text-muted/70 font-mono text-[10px] ml-auto">{s.url}</code>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Block preview */}
                            <div>
                                <button onClick={() => setShowBlockPreview(v => !v)}
                                    className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted mb-2 hover:text-foreground transition-colors">
                                    <Eye className="w-3 h-3" />
                                    {showBlockPreview ? 'Ocultar preview' : 'Ver preview real dos blocos'}
                                    {showBlockPreview ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </button>
                                {showBlockPreview ? (
                                    <div className="border border-border rounded-xl overflow-hidden">
                                        <div className="bg-background px-6 py-4 max-h-[600px] overflow-y-auto">
                                            <BlogBlockRenderer blocks={blocks as BlogBlock[]} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1.5 max-h-[480px] overflow-y-auto pr-1">
                                        {blocks.map((block, i) => <BlockPreview key={i} block={block} index={i} />)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: form */}
                        <div className="flex flex-col gap-4">
                            <div className="border border-border rounded-xl bg-surface/30 p-4 flex flex-col gap-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[13px] font-semibold text-foreground">Dados do artigo</p>
                                    {metaAutoFilled && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 font-semibold">
                                            ✦ Gemini
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Título *</label>
                                    <input value={form.title} onChange={e => handleTitleChange(e.target.value)}
                                        placeholder="Ex: aespa: O Grupo que Redefiniu o K-Pop"
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40" />
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Slug *</label>
                                    <div className="relative">
                                        <input value={form.slug} onChange={e => handleSlugChange(e.target.value)}
                                            placeholder="aespa-grupo-redefiniu-kpop"
                                            className={`w-full rounded-lg border bg-background px-3 py-2 pr-8 text-[13px] font-mono text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                                                slugStatus === 'taken' ? 'border-red-400' : slugStatus === 'available' ? 'border-green-400' : 'border-border'
                                            }`} />
                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{slugStatusIcon()}</span>
                                    </div>
                                    {slugStatus === 'taken' && slugTaken && (
                                        <p className="text-[10px] text-red-500 mt-1">
                                            Já existe: "{slugTaken.title}" —{' '}
                                            <Link href={`/admin/blog/${slugTaken.id}/edit`} className="underline">editar</Link>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Excerpt</label>
                                    <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                                        placeholder="Resumo curto para SEO (até 160 caracteres)" rows={2}
                                        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40" />
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1 flex items-center gap-1.5">
                                        <Hash className="w-2.5 h-2.5" /> Palavra-chave foco (SEO)
                                    </label>
                                    <input value={form.focusKeyword} onChange={e => setForm(f => ({ ...f, focusKeyword: e.target.value }))}
                                        placeholder="Ex: BTS, Go Doo-shim, K-Drama 2025"
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40" />
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1 flex items-center gap-1.5">
                                        <ImageIcon className="w-2.5 h-2.5" /> Imagem de capa
                                    </label>
                                    <div className="flex gap-2">
                                        <input value={form.coverImageUrl} onChange={e => setForm(f => ({ ...f, coverImageUrl: e.target.value }))}
                                            placeholder="https:// ou faça upload →"
                                            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[12px] font-mono text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40" />
                                        <button onClick={() => coverInputRef.current?.click()}
                                            disabled={uploadingCover}
                                            className="shrink-0 px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-[11px] font-medium text-foreground transition-colors flex items-center gap-1.5">
                                            {uploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                            Upload
                                        </button>
                                        <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                                            onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f) }} />
                                    </div>
                                    {form.coverImageUrl && (
                                        <img src={form.coverImageUrl} alt="cover preview"
                                            className="mt-2 w-full h-28 object-cover rounded-lg border border-border"
                                            onError={e => (e.currentTarget.style.display = 'none')} />
                                    )}
                                </div>

                                {tags.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Tags</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {tags.map(tag => (
                                                <button key={tag} onClick={() => setTags(t => t.filter(x => x !== tag))}
                                                    className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-medium hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-colors">
                                                    {tag} ×
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Categoria</label>
                                    <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40">
                                        <option value="">Sem categoria</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                {importError && (
                                    <div className="flex items-center gap-2 text-[12px] text-red-600 dark:text-red-400">
                                        <XCircle className="w-3.5 h-3.5 shrink-0" /> {importError}
                                    </div>
                                )}

                                <button onClick={importPost}
                                    disabled={!form.title || !form.slug || slugStatus === 'taken' || step === 'importing'}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-accent text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 mt-1">
                                    {step === 'importing'
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Inserindo…</>
                                        : <><Upload className="w-4 h-4" /> Inserir como rascunho</>}
                                </button>
                                <p className="text-[10px] text-muted/50 text-center">Salvo como DRAFT — revise antes de publicar</p>
                            </div>

                            <button onClick={reset} className="flex items-center justify-center gap-1.5 text-[11px] text-muted hover:text-foreground transition-colors">
                                <RotateCcw className="w-3 h-3" /> Recomeçar com novo JSON
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Done ── */}
                {step === 'done' && importedPost && (
                    <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-bold text-foreground mb-1">Rascunho criado!</h2>
                            <p className="text-[13px] text-muted">"{importedPost.title}" foi salvo como DRAFT no banco.</p>
                        </div>
                        <div className="flex gap-3 flex-wrap justify-center">
                            <Link href={`/admin/blog/${importedPost.id}/edit`}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-[13px] font-semibold hover:opacity-90 transition-opacity">
                                <ExternalLink className="w-4 h-4" /> Abrir no editor
                            </Link>
                            <Link href={`/blog/${importedPost.slug}`} target="_blank"
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-[13px] font-semibold text-muted hover:text-foreground hover:bg-surface transition-colors">
                                <Eye className="w-4 h-4" /> Ver no blog
                            </Link>
                            <button onClick={reset}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-[13px] font-semibold text-muted hover:text-foreground hover:bg-surface transition-colors">
                                <Upload className="w-4 h-4" /> Importar outro
                            </button>
                        </div>

                        {/* Publish to remote */}
                        <div className="w-full max-w-sm border border-border rounded-xl bg-surface/30 p-4 flex flex-col gap-3">
                            <p className="text-[12px] font-semibold text-foreground flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-accent" />
                                Publicar nos ambientes remotos
                            </p>
                            {tunnelStatus && (
                                <div className="flex gap-3 text-[10px]">
                                    {(['staging', 'production'] as const).map(env => {
                                        const port = env === 'staging' ? 5434 : 5433
                                        const ok = tunnelStatus[env]
                                        return (
                                            <span key={env} className={`flex items-center gap-1 font-medium ${ok ? 'text-green-500' : 'text-red-500'}`}>
                                                {ok ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                                Tunnel {env} :{port} {ok ? 'ativo' : 'inativo'}
                                            </span>
                                        )
                                    })}
                                </div>
                            )}
                            <div className="flex gap-4">
                                {(['staging', 'production'] as const).map(env => (
                                    <label key={env} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={publishEnvs[env]}
                                            onChange={e => setPublishEnvs(p => ({ ...p, [env]: e.target.checked }))}
                                            className="rounded border-border accent-accent" />
                                        <span className={`text-[12px] font-semibold capitalize ${env === 'production' ? 'text-red-500' : 'text-amber-500'}`}>
                                            {env}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <button onClick={publishRemote}
                                disabled={publishing || (!publishEnvs.staging && !publishEnvs.production)}
                                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-foreground text-background text-[12px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40">
                                {publishing
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Publicando…</>
                                    : <><Server className="w-3.5 h-3.5" /> Publicar e marcar como PUBLISHED</>}
                            </button>
                            {publishResults && (
                                <div className="flex flex-col gap-1.5">
                                    {Object.entries(publishResults).map(([env, r]) => (
                                        <div key={env} className={`flex items-center gap-2 text-[11px] ${r.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {r.success ? <CheckCircle className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                                            <span className="capitalize font-semibold">{env}:</span>
                                            <span>{r.success ? 'publicado' : (r.error ?? 'erro')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-[10px] text-muted/50">Requer STAGING_DATABASE_URL e PRODUCTION_DATABASE_URL no .env.local</p>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
