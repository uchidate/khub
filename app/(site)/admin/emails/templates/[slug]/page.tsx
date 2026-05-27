'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminButton, AdminLinkButton } from '@/components/admin'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { AdminTableSkeleton } from '@/components/admin/AdminTableSkeleton'
import { ArrowLeft, Save, RefreshCw, Eye, EyeOff } from 'lucide-react'

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
    const toast = useAdminToast()

    const [template, setTemplate] = useState<Template | null>(null)
    const [subject, setSubject] = useState('')
    const [htmlContent, setHtmlContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
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
            .catch(() => toast.error('Erro ao carregar template'))
            .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/emails/templates/${slug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, htmlContent }),
            })
            const data = await res.json()
            if (res.ok) {
                toast.saved()
            } else {
                toast.error(data.error || 'Erro ao salvar')
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <AdminLayout title="Template de Email" subtitle="Edite o conteúdo e variáveis do template de email">
            <AdminTableSkeleton rows={6} />
        </AdminLayout>
    )

    if (!template) return (
        <AdminLayout title="Template de Email" subtitle="Edite o conteúdo e variáveis do template de email">
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-muted text-sm">Template não encontrado.</p>
                <AdminLinkButton href="/admin/emails/templates" variant="secondary" size="sm">
                    <ArrowLeft size={14} /> Templates
                </AdminLinkButton>
            </div>
        </AdminLayout>
    )

    return (
        <AdminLayout
            title={template.name}
            subtitle={template.slug}
            actions={
                <div className="flex items-center gap-2">
                    <AdminLinkButton href="/admin/emails/templates" variant="secondary" size="sm">
                        <ArrowLeft size={14} />
                        Templates
                    </AdminLinkButton>
                    <AdminButton variant="secondary" size="md" onClick={() => setPreview(p => !p)}>
                        {preview ? <EyeOff size={14} /> : <Eye size={14} />}
                        {preview ? 'Editar' : 'Preview'}
                    </AdminButton>
                    <AdminButton variant="primary" size="md" onClick={handleSave} disabled={saving}>
                        {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                        Salvar
                    </AdminButton>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
                {/* Editor */}
                <div className="space-y-4">
                    <div className="bg-surface border border-border p-4 rounded-xl">
                        <label className="text-[11px] font-black text-muted uppercase tracking-wider mb-2 block">Assunto</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-accent"
                        />
                    </div>

                    <div className="bg-surface border border-border p-4 rounded-xl">
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
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-xs font-mono focus:outline-none focus:border-accent resize-none"
                                rows={30}
                                spellCheck={false}
                            />
                        )}
                    </div>
                </div>

                {/* Sidebar: variables */}
                <div className="bg-surface border border-border p-4 rounded-xl h-fit">
                    <p className="text-[11px] font-black text-muted uppercase tracking-wider mb-3">Variáveis disponíveis</p>
                    <div className="space-y-2">
                        {template.variables.map(v => (
                            <div key={v}>
                                <code
                                    className="text-xs text-accent bg-accent/10 border border-accent/20 rounded px-2 py-1 font-mono cursor-pointer hover:bg-accent/20 transition-colors select-all"
                                    title="Clique para copiar"
                                    onClick={() => navigator.clipboard.writeText(`{{${v}}}`)}
                                >
                                    {`{{${v}}}`}
                                </code>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-muted mt-4">Clique numa variável para copiar.</p>
                </div>
            </div>
        </AdminLayout>
    )
}
