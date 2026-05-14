'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
    Upload, CheckCircle, XCircle, AlertTriangle, Loader2,
    ChevronDown, ChevronRight, FileJson, Sparkles, ExternalLink, RotateCcw,
} from 'lucide-react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ValidationIssue { block: number; type: string; message: string }
interface ValidationResult {
    valid: boolean
    blockCount: number
    issues: ValidationIssue[]
    suggestions: string
    summary: { types: Record<string, number> }
}
interface Category { id: string; name: string; slug: string }

// ── Block preview ─────────────────────────────────────────────────────────────

const BLOCK_COLORS: Record<string, string> = {
    blog_heading:   'border-l-accent bg-accent/5',
    blog_paragraph: 'border-l-border bg-surface/50',
    blog_quote:     'border-l-purple-400 bg-purple-500/5',
    blog_curiosity: 'border-l-amber-400 bg-amber-500/5',
    blog_list:      'border-l-green-400 bg-green-500/5',
    blog_rating:    'border-l-pink-400 bg-pink-500/5',
    blog_image:     'border-l-blue-400 bg-blue-500/5',
    embed:          'border-l-red-400 bg-red-500/5',
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
            case 'embed':          return <p className="text-[12px] text-red-600">▶ {block.url as string}</p>
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
    const [blocks, setBlocks] = useState<Record<string, unknown>[]>([])
    const [parseError, setParseError] = useState('')
    const [validation, setValidation] = useState<ValidationResult | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [form, setForm] = useState({ title: '', slug: '', excerpt: '', categoryId: '' })
    const [importedPost, setImportedPost] = useState<{ id: string; slug: string; title: string } | null>(null)
    const [importError, setImportError] = useState('')

    useEffect(() => {
        fetch('/api/admin/blog/categories').then(r => r.json()).then(d => setCategories(d.categories ?? d ?? [])).catch(() => {})
    }, [])

    const handleTitleChange = (title: string) => {
        const slug = title.toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim().replace(/\s+/g, '-')
        setForm(f => ({ ...f, title, slug }))
    }

    const parseJson = () => {
        setParseError('')
        try {
            const parsed = JSON.parse(rawJson.trim())
            const arr = Array.isArray(parsed) ? parsed : parsed.blocks ?? parsed.content ?? []
            if (!Array.isArray(arr) || arr.length === 0) throw new Error('JSON deve ser um array de blocos')
            setBlocks(arr)
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
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocks: arr }),
            })
            const data = await res.json()
            setValidation(data)
            setStep('validated')
        } catch {
            setStep('input')
            setParseError('Erro ao conectar com o validador')
        }
    }

    const importPost = async () => {
        if (!form.title || !form.slug) return
        setStep('importing')
        setImportError('')
        try {
            const res = await fetch('/api/admin/blog/import-blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, blocks }),
            })
            const data = await res.json()
            if (!res.ok) { setImportError(data.error ?? 'Erro desconhecido'); setStep('validated'); return }
            setImportedPost(data.post)
            setStep('done')
        } catch {
            setImportError('Erro de conexão')
            setStep('validated')
        }
    }

    const reset = () => {
        setStep('input'); setRawJson(''); setBlocks([]); setParseError('')
        setValidation(null); setForm({ title: '', slug: '', excerpt: '', categoryId: '' })
        setImportedPost(null); setImportError('')
    }

    return (
        <AdminLayout title="Importar Artigo" subtitle="Cole o JSON gerado pelo Gemini, valide e insira como rascunho">
            <div className="max-w-5xl mx-auto">

                {/* Steps indicator */}
                <div className="flex items-center gap-2 mb-6 text-[11px] font-semibold">
                    {(['input','validated','done'] as const).map((s, i) => {
                        const labels = ['1. JSON', '2. Validar & Preencher', '3. Importado']
                        const active = s === step || (s === 'validated' && step === 'validating') || (s === 'validated' && step === 'importing')
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
                    <div className="flex flex-col gap-4">
                        <div className="border border-border rounded-xl bg-surface/30 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <FileJson className="w-4 h-4 text-accent" />
                                <p className="text-[13px] font-semibold text-foreground">JSON do Gemini</p>
                                <span className="text-[10px] text-muted ml-auto">Cole o array de BlogBlocks</span>
                            </div>
                            <textarea
                                value={rawJson}
                                onChange={e => setRawJson(e.target.value)}
                                placeholder={'[\n  {"type": "blog_heading", "text": "Título..."},\n  {"type": "blog_paragraph", "text": "Conteúdo..."}\n]'}
                                className="w-full h-80 resize-none rounded-lg border border-border bg-background font-mono text-[12px] text-foreground p-4 focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-muted/40"
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

                        {/* Left: preview + validation */}
                        <div className="flex flex-col gap-4 min-w-0">
                            {/* Validation result */}
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

                                {/* Type summary */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {Object.entries(validation.summary.types).map(([t, n]) => (
                                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background border border-border text-muted">
                                            {t} ×{n}
                                        </span>
                                    ))}
                                </div>

                                {/* Issues */}
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

                                {/* Ollama suggestions */}
                                {validation.suggestions && (
                                    <div className="border-t border-border/50 pt-3 mt-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3" /> Sugestões do Ollama
                                        </p>
                                        <p className="text-[12px] text-muted leading-relaxed whitespace-pre-line">{validation.suggestions}</p>
                                    </div>
                                )}
                            </div>

                            {/* Block preview */}
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">Preview dos blocos</p>
                                <div className="flex flex-col gap-1.5 max-h-[480px] overflow-y-auto pr-1">
                                    {blocks.map((block, i) => <BlockPreview key={i} block={block} index={i} />)}
                                </div>
                            </div>
                        </div>

                        {/* Right: form */}
                        <div className="flex flex-col gap-4">
                            <div className="border border-border rounded-xl bg-surface/30 p-4 flex flex-col gap-3">
                                <p className="text-[13px] font-semibold text-foreground mb-1">Dados do artigo</p>

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Título *</label>
                                    <input
                                        value={form.title}
                                        onChange={e => handleTitleChange(e.target.value)}
                                        placeholder="Ex: aespa: O Grupo que Redefiniu o K-Pop"
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Slug *</label>
                                    <input
                                        value={form.slug}
                                        onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                        placeholder="aespa-grupo-redefiniu-kpop"
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] font-mono text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Excerpt</label>
                                    <textarea
                                        value={form.excerpt}
                                        onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                                        placeholder="Resumo curto para SEO e listagens (até 160 caracteres)"
                                        rows={2}
                                        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">Categoria</label>
                                    <select
                                        value={form.categoryId}
                                        onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                                    >
                                        <option value="">Sem categoria</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                {importError && (
                                    <div className="flex items-center gap-2 text-[12px] text-red-600 dark:text-red-400">
                                        <XCircle className="w-3.5 h-3.5 shrink-0" /> {importError}
                                    </div>
                                )}

                                <button
                                    onClick={importPost}
                                    disabled={!form.title || !form.slug || step === 'importing'}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-accent text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 mt-1"
                                >
                                    {step === 'importing'
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Inserindo…</>
                                        : <><Upload className="w-4 h-4" /> Inserir como rascunho</>
                                    }
                                </button>
                                <p className="text-[10px] text-muted/50 text-center">Salvo como DRAFT — revise antes de publicar</p>
                            </div>

                            <button
                                onClick={reset}
                                className="flex items-center justify-center gap-1.5 text-[11px] text-muted hover:text-foreground transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" /> Recomeçar com novo JSON
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Done ── */}
                {step === 'done' && importedPost && (
                    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-bold text-foreground mb-1">Rascunho criado!</h2>
                            <p className="text-[13px] text-muted">"{importedPost.title}" foi salvo como DRAFT no banco.</p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href={`/admin/blog/${importedPost.id}/edit`}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
                            >
                                <ExternalLink className="w-4 h-4" /> Abrir no editor
                            </Link>
                            <button
                                onClick={reset}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-[13px] font-semibold text-muted hover:text-foreground hover:bg-surface transition-colors"
                            >
                                <Upload className="w-4 h-4" /> Importar outro
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
