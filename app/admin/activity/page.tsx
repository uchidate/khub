import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import prisma from '@/lib/prisma'
import { Activity, Shield, Server, User } from 'lucide-react'
import type { Activity as PActivity, AuditLog, SystemEvent, User as PUser } from '@prisma/client'

type ActivityWithUser = PActivity & { user: Pick<PUser, 'id' | 'name' | 'email'> | null }
type AuditLogWithAdmin = AuditLog & { admin: Pick<PUser, 'id' | 'name' | 'email'> | null }

// ─── Config ──────────────────────────────────────────────────────────────────

const ACTIVITY_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
    LOGIN:            { label: 'Login',           color: 'text-blue-400 bg-blue-400/10' },
    LOGOUT:           { label: 'Logout',          color: 'text-zinc-400 bg-zinc-400/10' },
    REGISTER:         { label: 'Registro',        color: 'text-green-400 bg-green-400/10' },
    SEARCH:           { label: 'Busca',           color: 'text-purple-400 bg-purple-400/10' },
    VIEW:             { label: 'Visualização',    color: 'text-zinc-400 bg-zinc-400/10' },
    FAVORITE_ADD:     { label: 'Fav. Adicionado', color: 'text-pink-400 bg-pink-400/10' },
    FAVORITE_REMOVE:  { label: 'Fav. Removido',  color: 'text-orange-400 bg-orange-400/10' },
    COMMENT_CREATE:   { label: 'Comentário',      color: 'text-yellow-400 bg-yellow-400/10' },
    PROFILE_UPDATE:   { label: 'Perfil',          color: 'text-teal-400 bg-teal-400/10' },
}

const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
    DEBUG: { label: 'DEBUG', color: 'text-zinc-400 bg-zinc-400/10' },
    INFO:  { label: 'INFO',  color: 'text-blue-400 bg-blue-400/10' },
    WARN:  { label: 'WARN',  color: 'text-yellow-400 bg-yellow-400/10' },
    ERROR: { label: 'ERROR', color: 'text-red-400 bg-red-400/10' },
}

const AUDIT_ACTION_CONFIG: Record<string, { label: string; color: string }> = {
    CREATE:  { label: 'Criação',   color: 'text-green-400 bg-green-400/10' },
    UPDATE:  { label: 'Edição',    color: 'text-blue-400 bg-blue-400/10' },
    DELETE:  { label: 'Exclusão',  color: 'text-red-400 bg-red-400/10' },
    APPROVE: { label: 'Aprovado',  color: 'text-green-400 bg-green-400/10' },
    REJECT:  { label: 'Rejeitado', color: 'text-orange-400 bg-orange-400/10' },
    RESEND:  { label: 'Reenvio',   color: 'text-purple-400 bg-purple-400/10' },
    SEED:    { label: 'Seed',      color: 'text-zinc-400 bg-zinc-400/10' },
}

function formatTimeAgo(date: Date | string): string {
    const d = new Date(date)
    const diff = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diff < 60) return `${diff}s atrás`
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function Badge({ label, color }: { label: string; color: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${color}`}>
            {label}
        </span>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
    searchParams: Promise<{ tab?: string; type?: string; level?: string; source?: string; entity?: string; action?: string; days?: string; page?: string }>
}

export default async function AdminActivityPage({ searchParams }: Props) {
    const session = await auth()
    if (!session) redirect('/auth/login?callbackUrl=/admin/activity')
    if (session.user.role?.toLowerCase() !== 'admin') redirect('/dashboard')

    const sp = await searchParams
    const tab = sp.tab || 'user'
    const days = parseInt(sp.days || '7')
    const page = Math.max(1, parseInt(sp.page || '1'))
    const limit = 30
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const buildUrl = (params: Record<string, string>) => {
        const next = new URLSearchParams({ tab, days: String(days), page: '1', ...params })
        return `/admin/activity?${next.toString()}`
    }

    // ── Aba Usuário ──
    let userLogs: ActivityWithUser[] = []
    let userTotal = 0
    const entityNameMap = new Map<string, string>()
    if (tab === 'user') {
        const typeFilter = sp.type || ''
        const where = {
            createdAt: { gte: since },
            ...(typeFilter ? { type: typeFilter } : {}),
        }
        ;[userLogs, userTotal] = await Promise.all([
            prisma.activity.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { user: { select: { id: true, name: true, email: true } } },
            }) as Promise<ActivityWithUser[]>,
            prisma.activity.count({ where }),
        ])

        // Resolve entity names by entityType
        const artistIds = userLogs.filter(l => l.entityType === 'ARTIST' && l.entityId).map(l => l.entityId!)
        const groupIds = userLogs.filter(l => l.entityType === 'GROUP' && l.entityId).map(l => l.entityId!)
        const newsIds = userLogs.filter(l => l.entityType === 'NEWS' && l.entityId).map(l => l.entityId!)
        const productionIds = userLogs.filter(l => l.entityType === 'PRODUCTION' && l.entityId).map(l => l.entityId!)

        const [artists, groups, newsList, productions] = await Promise.all([
            artistIds.length ? prisma.artist.findMany({ where: { id: { in: artistIds } }, select: { id: true, nameRomanized: true } }) : [],
            groupIds.length ? prisma.musicalGroup.findMany({ where: { id: { in: groupIds } }, select: { id: true, name: true } }) : [],
            newsIds.length ? prisma.news.findMany({ where: { id: { in: newsIds } }, select: { id: true, title: true } }) : [],
            productionIds.length ? prisma.production.findMany({ where: { id: { in: productionIds } }, select: { id: true, titlePt: true } }) : [],
        ])

        artists.forEach(a => entityNameMap.set(a.id, a.nameRomanized))
        groups.forEach(g => entityNameMap.set(g.id, g.name))
        newsList.forEach(n => entityNameMap.set(n.id, n.title))
        productions.forEach(p => entityNameMap.set(p.id, p.titlePt))
    }

    // ── Aba Admin ──
    let auditLogs: AuditLogWithAdmin[] = []
    let auditTotal = 0
    if (tab === 'admin') {
        const entityFilter = sp.entity || ''
        const actionFilter = sp.action || ''
        const where = {
            createdAt: { gte: since },
            ...(entityFilter ? { entity: entityFilter } : {}),
            ...(actionFilter ? { action: actionFilter } : {}),
        }
        ;[auditLogs, auditTotal] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { admin: { select: { id: true, name: true, email: true } } },
            }) as Promise<AuditLogWithAdmin[]>,
            prisma.auditLog.count({ where }),
        ])
    }

    // ── Aba Sistema ──
    let systemEvents: SystemEvent[] = []
    let systemTotal = 0
    if (tab === 'system') {
        const levelFilter = sp.level || ''
        const sourceFilter = sp.source || ''
        const where = {
            createdAt: { gte: since },
            ...(levelFilter ? { level: levelFilter } : {}),
            ...(sourceFilter ? { source: sourceFilter } : {}),
        }
        ;[systemEvents, systemTotal] = await Promise.all([
            prisma.systemEvent.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.systemEvent.count({ where }),
        ])
    }

    const total = tab === 'user' ? userTotal : tab === 'admin' ? auditTotal : systemTotal
    const pages = Math.ceil(total / limit)

    const TABS = [
        { key: 'user',   label: 'Usuários', icon: User },
        { key: 'admin',  label: 'Admin',    icon: Shield },
        { key: 'system', label: 'Sistema',  icon: Server },
    ]

    return (
        <AdminLayout title="Logs de Atividade">
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Activity size={20} className="text-purple-400" />
                    <h1 className="text-2xl font-black text-white">Logs de Atividade</h1>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mb-4 bg-zinc-900 p-1 rounded-xl w-fit">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <Link
                            key={key}
                            href={buildUrl({ tab: key, page: '1' })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                tab === key ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <Icon size={14} />
                            {label}
                        </Link>
                    ))}
                </div>

                {/* Filtros de período */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    {[1, 7, 30, 90].map(d => (
                        <Link
                            key={d}
                            href={buildUrl({ days: String(d), page: '1' })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                days === d
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                        >
                            {d === 1 ? 'Hoje' : `${d}d`}
                        </Link>
                    ))}

                    {tab === 'user' && (
                        <>
                            <div className="w-px bg-zinc-700 mx-1 h-5" />
                            {Object.entries(ACTIVITY_TYPE_CONFIG).map(([type, cfg]) => (
                                <Link
                                    key={type}
                                    href={buildUrl({ type: sp.type === type ? '' : type, page: '1' })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                        sp.type === type
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    {cfg.label}
                                </Link>
                            ))}
                        </>
                    )}

                    {tab === 'system' && (
                        <>
                            <div className="w-px bg-zinc-700 mx-1 h-5" />
                            {(['ERROR', 'WARN', 'INFO', 'DEBUG'] as const).map(l => (
                                <Link
                                    key={l}
                                    href={buildUrl({ level: sp.level === l ? '' : l, page: '1' })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                        sp.level === l
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    {l}
                                </Link>
                            ))}
                        </>
                    )}
                </div>

                <p className="text-xs text-zinc-500 mb-3">{total} registros encontrados</p>

                {/* Tabela */}
                <div className="glass-card rounded-xl overflow-hidden overflow-x-auto border border-white/5">
                    <table className="w-full min-w-[640px] text-sm">

                        {tab === 'user' && (
                            <>
                                <thead>
                                    <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-zinc-500">
                                        <th className="text-left px-4 py-3">Usuário</th>
                                        <th className="text-left px-4 py-3">Tipo</th>
                                        <th className="text-left px-4 py-3">Entidade</th>
                                        <th className="text-left px-4 py-3">Contexto</th>
                                        <th className="text-left px-4 py-3">Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userLogs.length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-12 text-zinc-600">Nenhuma atividade no período</td></tr>
                                    )}
                                    {userLogs.map((log: ActivityWithUser) => {
                                        const cfg = ACTIVITY_TYPE_CONFIG[log.type] ?? { label: log.type, color: 'text-zinc-400 bg-zinc-400/10' }
                                        const meta = log.metadata as Record<string, string> | null
                                        return (
                                            <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                                <td className="px-4 py-3">
                                                    <p className="text-white font-medium text-sm">{log.user?.name ?? '—'}</p>
                                                    <p className="text-[11px] text-zinc-500">{log.user?.email}</p>
                                                </td>
                                                <td className="px-4 py-3"><Badge label={cfg.label} color={cfg.color} /></td>
                                                <td className="px-4 py-3 max-w-[200px]">
                                                    {log.entityId ? (
                                                        <>
                                                            <p className="text-zinc-300 text-xs truncate">{entityNameMap.get(log.entityId) ?? log.entityId.slice(-8)}</p>
                                                            <p className="text-[10px] text-zinc-600">{log.entityType}</p>
                                                        </>
                                                    ) : (
                                                        <span className="text-zinc-600 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-zinc-500 text-xs max-w-[200px] truncate">
                                                    {meta?.query ?? meta?.context ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-zinc-500 text-[11px] whitespace-nowrap">{formatTimeAgo(log.createdAt)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </>
                        )}

                        {tab === 'admin' && (
                            <>
                                <thead>
                                    <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-zinc-500">
                                        <th className="text-left px-4 py-3">Admin</th>
                                        <th className="text-left px-4 py-3">Ação</th>
                                        <th className="text-left px-4 py-3">Entidade</th>
                                        <th className="text-left px-4 py-3">Detalhe</th>
                                        <th className="text-left px-4 py-3">Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-12 text-zinc-600">Nenhuma ação administrativa no período</td></tr>
                                    )}
                                    {auditLogs.map((log: AuditLogWithAdmin) => {
                                        const cfg = AUDIT_ACTION_CONFIG[log.action] ?? { label: log.action, color: 'text-zinc-400 bg-zinc-400/10' }
                                        return (
                                            <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                                <td className="px-4 py-3">
                                                    <p className="text-white font-medium text-sm">{log.admin?.name ?? '—'}</p>
                                                    <p className="text-[11px] text-zinc-500">{log.admin?.email}</p>
                                                </td>
                                                <td className="px-4 py-3"><Badge label={cfg.label} color={cfg.color} /></td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-zinc-400 font-mono">{log.entity}</span>
                                                    {log.entityId && <span className="text-[10px] text-zinc-600 ml-1">#{log.entityId.slice(-6)}</span>}
                                                </td>
                                                <td className="px-4 py-3 text-zinc-400 text-xs max-w-[240px] truncate">{log.details ?? '—'}</td>
                                                <td className="px-4 py-3 text-zinc-500 text-[11px] whitespace-nowrap">{formatTimeAgo(log.createdAt)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </>
                        )}

                        {tab === 'system' && (
                            <>
                                <thead>
                                    <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-zinc-500">
                                        <th className="text-left px-4 py-3">Nível</th>
                                        <th className="text-left px-4 py-3">Fonte</th>
                                        <th className="text-left px-4 py-3">Mensagem</th>
                                        <th className="text-left px-4 py-3">Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {systemEvents.length === 0 && (
                                        <tr><td colSpan={4} className="text-center py-12 text-zinc-600">Nenhum evento de sistema no período</td></tr>
                                    )}
                                    {systemEvents.map((ev: SystemEvent) => {
                                        const cfg = LEVEL_CONFIG[ev.level] ?? LEVEL_CONFIG.INFO
                                        return (
                                            <tr key={ev.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                                <td className="px-4 py-3"><Badge label={cfg.label} color={cfg.color} /></td>
                                                <td className="px-4 py-3 text-xs font-mono text-zinc-400">{ev.source}</td>
                                                <td className="px-4 py-3 text-zinc-300 text-xs max-w-[400px] truncate">{ev.message}</td>
                                                <td className="px-4 py-3 text-zinc-500 text-[11px] whitespace-nowrap">{formatTimeAgo(ev.createdAt)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </>
                        )}
                    </table>
                </div>

                {pages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                            <Link
                                key={p}
                                href={buildUrl({ page: String(p) })}
                                className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${
                                    p === page ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                            >
                                {p}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
