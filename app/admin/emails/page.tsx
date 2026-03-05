import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import prisma from '@/lib/prisma'
import { Mail, CheckCircle, XCircle, Clock, FileText } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
    WELCOME: 'Boas-vindas',
    PASSWORD_RESET: 'Reset de Senha',
    NEWS_INSTANT: 'Notícia',
    NEWS_DIGEST: 'Digest',
    MANUAL: 'Manual',
    TEST: 'Teste',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    SENT: { label: 'Enviado', color: 'text-green-400 bg-green-400/10', icon: CheckCircle },
    FAILED: { label: 'Falhou', color: 'text-red-400 bg-red-400/10', icon: XCircle },
    PENDING: { label: 'Pendente', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
}

interface Props {
    searchParams: Promise<{ type?: string; status?: string; days?: string; page?: string }>
}

export default async function AdminEmailsPage({ searchParams }: Props) {
    const session = await auth()
    if (!session) redirect('/auth/login?callbackUrl=/admin/emails')
    if (session.user.role?.toLowerCase() !== 'admin') redirect('/dashboard')

    const sp = await searchParams
    const type = sp.type || ''
    const status = sp.status || ''
    const days = parseInt(sp.days || '30')
    const page = Math.max(1, parseInt(sp.page || '1'))
    const limit = 20

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const where = {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        createdAt: { gte: since },
    }

    const [logs, total, counts] = await Promise.all([
        prisma.emailLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                to: true,
                subject: true,
                type: true,
                status: true,
                resendId: true,
                sentAt: true,
                createdAt: true,
                user: { select: { name: true } },
            },
        }),
        prisma.emailLog.count({ where }),
        prisma.emailLog.groupBy({ by: ['status'], _count: true, where: { createdAt: { gte: since } } }),
    ])

    const countMap = Object.fromEntries(counts.map(c => [c.status, c._count]))
    const pages = Math.ceil(total / limit)

    const buildUrl = (params: Record<string, string>) => {
        const sp = new URLSearchParams({ ...(type && { type }), ...(status && { status }), days: String(days), page: '1', ...params })
        return `/admin/emails?${sp.toString()}`
    }

    return (
        <AdminLayout title="Histórico de Emails">
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-2">
                            <Mail size={22} className="text-purple-400" />
                            Histórico de Emails
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">{total} emails nos últimos {days} dias</p>
                    </div>
                    <Link href="/admin/emails/templates" className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors px-3 py-2 bg-purple-400/10 rounded-lg border border-purple-400/20">
                        <FileText size={14} />
                        Templates
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {(['SENT', 'FAILED', 'PENDING'] as const).map(s => {
                        const cfg = STATUS_CONFIG[s]
                        const Icon = cfg.icon
                        return (
                            <Link key={s} href={buildUrl({ status: status === s ? '' : s })}
                                className={`glass-card p-4 flex items-center gap-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors ${status === s ? 'border-white/20' : ''}`}>
                                <Icon size={18} className={cfg.color.split(' ')[0]} />
                                <div>
                                    <p className="text-xl font-black text-white">{countMap[s] ?? 0}</p>
                                    <p className="text-[11px] text-zinc-500">{cfg.label}</p>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {[7, 30, 90].map(d => (
                        <Link key={d} href={buildUrl({ days: String(d) })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${days === d ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                            {d}d
                        </Link>
                    ))}
                    <div className="w-px bg-zinc-700 mx-1" />
                    {Object.entries(TYPE_LABELS).map(([t, label]) => (
                        <Link key={t} href={buildUrl({ type: type === t ? '' : t })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${type === t ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                            {label}
                        </Link>
                    ))}
                </div>

                {/* Tabela */}
                <div className="glass-card rounded-xl overflow-hidden overflow-x-auto border border-white/5">
                    <table className="w-full min-w-[600px] text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-zinc-500">
                                <th className="text-left px-4 py-3">Para</th>
                                <th className="text-left px-4 py-3">Assunto</th>
                                <th className="text-left px-4 py-3">Tipo</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3">Data</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-12 text-zinc-600">Nenhum email encontrado</td></tr>
                            )}
                            {logs.map(log => {
                                const cfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.PENDING
                                const Icon = cfg.icon
                                return (
                                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-white font-medium truncate max-w-[160px]">{log.to}</p>
                                            {log.user?.name && <p className="text-[11px] text-zinc-500">{log.user.name}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-300 truncate max-w-[200px]">{log.subject}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-zinc-800 text-zinc-400">
                                                {TYPE_LABELS[log.type] ?? log.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`flex items-center gap-1.5 w-fit px-2 py-0.5 rounded text-[10px] font-black ${cfg.color}`}>
                                                <Icon size={10} />
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-500 text-[11px] whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/admin/emails/${log.id}`} className="text-xs text-purple-400 hover:text-purple-300 font-bold">
                                                Ver →
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                {pages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                            <Link key={p} href={buildUrl({ page: String(p) })}
                                className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${p === page ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                                {p}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
