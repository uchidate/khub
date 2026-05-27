'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminButton, AdminLinkButton } from '@/components/admin'
import { AdminTableSkeleton } from '@/components/admin/AdminTableSkeleton'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'

interface EmailLog {
    id: string
    to: string
    subject: string
    type: string
    templateSlug: string | null
    status: string
    resendId: string | null
    errorMessage: string | null
    metadata: Record<string, unknown> | null
    sentAt: string | null
    createdAt: string
    user: { id: string; name: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    SENT:    { label: 'Enviado',  color: 'text-green-400',  icon: CheckCircle },
    FAILED:  { label: 'Falhou',   color: 'text-red-400',    icon: XCircle },
    PENDING: { label: 'Pendente', color: 'text-yellow-400', icon: Clock },
}

export default function AdminEmailDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const toast = useAdminToast()
    const [log, setLog] = useState<EmailLog | null>(null)
    const [loading, setLoading] = useState(true)
    const [resending, setResending] = useState(false)

    useEffect(() => {
        fetch(`/api/admin/emails?page=1`)
            .then(r => r.json())
            .then(data => { setLog(data.logs?.find((l: EmailLog) => l.id === id) ?? null) })
            .catch(() => toast.error('Erro ao carregar email'))
            .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    const handleResend = async () => {
        setResending(true)
        try {
            const res = await fetch(`/api/admin/emails/${id}/resend`, { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                toast.success('Email reenviado com sucesso!')
                setTimeout(() => router.push('/admin/emails'), 1500)
            } else {
                toast.error(data.error || 'Erro ao reenviar')
            }
        } finally {
            setResending(false)
        }
    }

    if (loading) return (
        <AdminLayout title="Detalhe do Email">
            <AdminTableSkeleton rows={8} />
        </AdminLayout>
    )

    if (!log) return (
        <AdminLayout title="Email não encontrado">
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-muted text-sm">Email não encontrado.</p>
                <AdminLinkButton href="/admin/emails" variant="secondary" size="sm">
                    <ArrowLeft size={14} /> Histórico
                </AdminLinkButton>
            </div>
        </AdminLayout>
    )

    const cfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.PENDING
    const StatusIcon = cfg.icon

    return (
        <AdminLayout
            title={log.subject}
            subtitle={log.to}
            actions={
                <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-black ${cfg.color} bg-white/5`}>
                        <StatusIcon size={14} />
                        {cfg.label}
                    </span>
                    <AdminLinkButton href="/admin/emails" variant="secondary" size="sm">
                        <ArrowLeft size={14} />
                        Histórico
                    </AdminLinkButton>
                </div>
            }
        >
            <div className="max-w-3xl space-y-3">
                {[
                    { label: 'Para',        value: log.to },
                    { label: 'Assunto',     value: log.subject },
                    { label: 'Tipo',        value: log.type },
                    { label: 'Template',    value: log.templateSlug ?? '—' },
                    { label: 'Resend ID',   value: log.resendId ?? '—' },
                    { label: 'Usuário',     value: log.user ? `${log.user.name} (${log.user.id})` : '—' },
                    { label: 'Enviado em',  value: log.sentAt ? new Date(log.sentAt).toLocaleString('pt-BR') : '—' },
                    { label: 'Criado em',   value: new Date(log.createdAt).toLocaleString('pt-BR') },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-surface border border-border px-4 py-3 rounded-xl flex gap-4">
                        <span className="text-xs font-black text-muted uppercase tracking-wider w-28 flex-shrink-0 pt-0.5">{label}</span>
                        <span className="text-sm text-foreground break-all">{value}</span>
                    </div>
                ))}

                {log.errorMessage && (
                    <div className="bg-red-500/5 border border-red-500/20 px-4 py-3 rounded-xl">
                        <p className="text-xs font-black text-red-400 uppercase tracking-wider mb-1">Erro</p>
                        <p className="text-sm text-red-300 font-mono">{log.errorMessage}</p>
                    </div>
                )}

                {log.metadata && (
                    <div className="bg-surface border border-border px-4 py-3 rounded-xl">
                        <p className="text-xs font-black text-muted uppercase tracking-wider mb-2">Metadata</p>
                        <pre className="text-xs text-muted font-mono overflow-auto">{JSON.stringify(log.metadata, null, 2)}</pre>
                    </div>
                )}

                {log.templateSlug && (
                    <div className="pt-3">
                        <AdminButton onClick={handleResend} disabled={resending} variant="primary">
                            <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                            {resending ? 'Reenviando...' : 'Reenviar Email'}
                        </AdminButton>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
