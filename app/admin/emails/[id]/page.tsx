'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, Mail } from 'lucide-react'

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
    SENT: { label: 'Enviado', color: 'text-green-400', icon: CheckCircle },
    FAILED: { label: 'Falhou', color: 'text-red-400', icon: XCircle },
    PENDING: { label: 'Pendente', color: 'text-yellow-400', icon: Clock },
}

export default function AdminEmailDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [log, setLog] = useState<EmailLog | null>(null)
    const [loading, setLoading] = useState(true)
    const [resending, setResending] = useState(false)
    const [resendMsg, setResendMsg] = useState('')

    useEffect(() => {
        fetch(`/api/admin/emails?page=1`)
            .then(r => r.json())
            .then(data => {
                const found = data.logs?.find((l: EmailLog) => l.id === id)
                setLog(found ?? null)
            })
            .finally(() => setLoading(false))
    }, [id])

    const handleResend = async () => {
        setResending(true)
        setResendMsg('')
        const res = await fetch(`/api/admin/emails/${id}/resend`, { method: 'POST' })
        if (res.ok) {
            setResendMsg('Email reenviado com sucesso!')
            setTimeout(() => router.push('/admin/emails'), 1500)
        } else {
            const data = await res.json()
            setResendMsg(data.error || 'Erro ao reenviar')
        }
        setResending(false)
    }

    if (loading) return (
        <AdminLayout title="Email">
            <div className="p-6 flex items-center justify-center min-h-[200px]">
                <RefreshCw className="animate-spin text-zinc-600" size={24} />
            </div>
        </AdminLayout>
    )

    if (!log) return (
        <AdminLayout title="Email">
            <div className="p-6">
                <p className="text-zinc-500">Email não encontrado.</p>
                <Link href="/admin/emails" className="text-purple-400 text-sm mt-2 inline-block">← Voltar</Link>
            </div>
        </AdminLayout>
    )

    const cfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.PENDING
    const StatusIcon = cfg.icon

    return (
        <AdminLayout title="Email">
            <div className="p-6 max-w-3xl mx-auto">
                <Link href="/admin/emails" className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-6 transition-colors w-fit">
                    <ArrowLeft size={14} /> Histórico de Emails
                </Link>

                <div className="flex items-center gap-3 mb-6">
                    <Mail size={20} className="text-purple-400" />
                    <h1 className="text-xl font-black text-white">Detalhe do Email</h1>
                    <span className={`flex items-center gap-1.5 ml-auto px-3 py-1 rounded-lg text-sm font-black ${cfg.color} bg-white/5`}>
                        <StatusIcon size={14} />
                        {cfg.label}
                    </span>
                </div>

                <div className="space-y-3">
                    {[
                        { label: 'Para', value: log.to },
                        { label: 'Assunto', value: log.subject },
                        { label: 'Tipo', value: log.type },
                        { label: 'Template', value: log.templateSlug ?? '—' },
                        { label: 'Resend ID', value: log.resendId ?? '—' },
                        { label: 'Usuário', value: log.user ? `${log.user.name} (${log.user.id})` : '—' },
                        { label: 'Enviado em', value: log.sentAt ? new Date(log.sentAt).toLocaleString('pt-BR') : '—' },
                        { label: 'Criado em', value: new Date(log.createdAt).toLocaleString('pt-BR') },
                    ].map(({ label, value }) => (
                        <div key={label} className="glass-card px-4 py-3 rounded-xl border border-white/5 flex gap-4">
                            <span className="text-xs font-black text-zinc-500 uppercase tracking-wider w-28 flex-shrink-0 pt-0.5">{label}</span>
                            <span className="text-sm text-white break-all">{value}</span>
                        </div>
                    ))}

                    {log.errorMessage && (
                        <div className="glass-card px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5">
                            <p className="text-xs font-black text-red-400 uppercase tracking-wider mb-1">Erro</p>
                            <p className="text-sm text-red-300 font-mono">{log.errorMessage}</p>
                        </div>
                    )}

                    {log.metadata && (
                        <div className="glass-card px-4 py-3 rounded-xl border border-white/5">
                            <p className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">Metadata</p>
                            <pre className="text-xs text-zinc-400 font-mono overflow-auto">{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                    )}
                </div>

                {log.templateSlug && (
                    <div className="mt-6">
                        {resendMsg && (
                            <p className={`text-sm mb-3 font-bold ${resendMsg.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>
                                {resendMsg}
                            </p>
                        )}
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors"
                        >
                            <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                            {resending ? 'Reenviando...' : 'Reenviar Email'}
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
