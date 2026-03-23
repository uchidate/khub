'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ArrowLeft, Save, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { AdminButton } from '@/components/admin'

interface Template {
    slug: string
    name: string
    subject: string
    htmlContent: string
    variables: string[]
    isActive: boolean
}

export default function AdminTemplateEditorPage() {
    const { slug } = useParams<{ slug: string }>()

    const [template, setTemplate] = useState<Template | null>(null)
    const [subject, setSubject] = useState('')
    const [htmlContent, setHtmlContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState('')
    const [preview, setPreview] = useState(false)

    useEffect(() => {
        fetch(`/api/admin/emails/templates/${slug}`)
            .then(r => r.json())
            .then(data => {
                if (data.template) {
                    setTemplate(data.template)
                    setSubject(data.template.subject)
                    setHtmlContent(data.template.htmlContent)
                }
            })
            .finally(() => setLoading(false))
    }, [slug])

    const handleSave = async () => {
        setSaving(true)
        setMsg('')
        const res = await fetch(`/api/admin/emails/templates/${slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, htmlContent }),
        })
        const data = await res.json()
        if (res.ok) {
            setMsg('✅ Template salvo!')
            setTimeout(() => setMsg(''), 3000)
        } else {
            setMsg(`❌ ${data.error || 'Erro ao salvar'}`)
        }
        setSaving(false)
    }

    if (loading) return (
        <AdminLayout title="Email">
            <div className="p-6 flex items-center justify-center min-h-[200px]">
                <RefreshCw className="animate-spin text-muted" size={24} />
            </div>
        </AdminLayout>
    )

    if (!template) return (
        <AdminLayout title="Email">
            <div className="p-6">
                <p className="text-muted">Template não encontrado.</p>
                <Link href="/admin/emails/templates" className="text-purple-400 text-sm mt-2 inline-block">← Voltar</Link>
            </div>
        </AdminLayout>
    )

    return (
        <AdminLayout title="Email">
            <div className="p-6 max-w-6xl mx-auto">
                <Link href="/admin/emails/templates" className="flex items-center gap-2 text-muted hover:text-foreground text-sm mb-6 transition-colors w-fit">
                    <ArrowLeft size={14} /> Templates
                </Link>

                <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                    <div>
                        <h1 className="text-xl font-black text-foreground">{template.name}</h1>
                        <p className="text-xs text-muted font-mono mt-0.5">{template.slug}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {msg && <span className="text-sm font-bold text-green-400">{msg}</span>}
                        <AdminButton
                            variant="secondary"
                            size="md"
                            onClick={() => setPreview(p => !p)}
                        >
                            {preview ? <EyeOff size={14} /> : <Eye size={14} />}
                            {preview ? 'Editar' : 'Preview'}
                        </AdminButton>
                        <AdminButton
                            variant="primary"
                            size="lg"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            Salvar
                        </AdminButton>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
                    {/* Editor */}
                    <div className="space-y-4">
                        {/* Assunto */}
                        <div className="glass-card p-4 rounded-xl border border-border">
                            <label className="text-[11px] font-black text-muted uppercase tracking-wider mb-2 block">Assunto</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        {/* HTML ou Preview */}
                        <div className="glass-card p-4 rounded-xl border border-border">
                            <label className="text-[11px] font-black text-muted uppercase tracking-wider mb-2 block">
                                {preview ? 'Preview HTML' : 'Conteúdo HTML'}
                            </label>
                            {preview ? (
                                <div
                                    className="rounded-lg overflow-auto bg-white min-h-[500px]"
                                    style={{ maxHeight: '70vh' }}
                                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                                />
                            ) : (
                                <textarea
                                    value={htmlContent}
                                    onChange={e => setHtmlContent(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground text-xs font-mono focus:outline-none focus:border-purple-500 resize-none"
                                    rows={30}
                                    spellCheck={false}
                                />
                            )}
                        </div>
                    </div>

                    {/* Sidebar: variáveis */}
                    <div className="glass-card p-4 rounded-xl border border-border h-fit">
                        <p className="text-[11px] font-black text-muted uppercase tracking-wider mb-3">Variáveis disponíveis</p>
                        <div className="space-y-2">
                            {template.variables.map(v => (
                                <div key={v} className="flex items-center gap-2">
                                    <code
                                        className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded px-2 py-1 font-mono cursor-pointer hover:bg-purple-500/20 transition-colors select-all"
                                        title="Clique para copiar"
                                        onClick={() => navigator.clipboard.writeText(`{{${v}}}`)}
                                    >
                                        {`{{${v}}}`}
                                    </code>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted mt-4">Clique numa variável para copiar. Use-as no assunto ou no HTML.</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
