import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import prisma from '@/lib/prisma'
import {
    Activity, Shield, Server, User,
    LogIn, LogOut, UserPlus, Search, Eye, Heart, HeartOff,
    ThumbsUp, ThumbsDown, MessageSquare, Settings,
    Plus, Pencil, Trash2, CheckCircle, XCircle, Send, Database,
    ChevronLeft, ChevronRight, Globe,
} from 'lucide-react'
import type { Activity as PActivity, AuditLog, SystemEvent, User as PUser } from '@prisma/client'

type ActivityWithUser = PActivity & { user: Pick<PUser, 'id' | 'name' | 'email'> | null }
type AuditLogWithAdmin = AuditLog & { admin: Pick<PUser, 'id' | 'name' | 'email'> | null }

// ─── Config ──────────────────────────────────────────────────────────────────

const ACTIVITY_TYPE_CONFIG: Record<string, {
    label: string
    color: string
    border: string
    icon: React.ElementType
}> = {
    LOGIN:           { label: 'Login',          color: 'text-blue-400 bg-blue-400/10',    border: 'border-blue-500/40',   icon: LogIn },
    LOGOUT:          { label: 'Logout',         color: 'text-zinc-400 bg-zinc-400/10',    border: 'border-zinc-500/30',   icon: LogOut },
    REGISTER:        { label: 'Registro',       color: 'text-green-400 bg-green-400/10',  border: 'border-green-500/40',  icon: UserPlus },
    SEARCH:          { label: 'Busca',          color: 'text-purple-400 bg-purple-400/10',border: 'border-purple-500/40', icon: Search },
    VIEW:            { label: 'Visualização',   color: 'text-zinc-500 bg-zinc-500/10',    border: 'border-zinc-600/30',   icon: Eye },
    FAVORITE_ADD:    { label: 'Fav. Adicionado',color: 'text-pink-400 bg-pink-400/10',    border: 'border-pink-500/40',   icon: Heart },
    FAVORITE_REMOVE: { label: 'Fav. Removido',  color: 'text-orange-400 bg-orange-400/10',border: 'border-orange-500/40', icon: HeartOff },
    LIKE:            { label: 'Like',           color: 'text-rose-400 bg-rose-400/10',    border: 'border-rose-500/40',   icon: ThumbsUp },
    UNLIKE:          { label: 'Unlike',         color: 'text-zinc-400 bg-zinc-400/10',    border: 'border-zinc-600/30',   icon: ThumbsDown },
    COMMENT_CREATE:  { label: 'Comentário',     color: 'text-yellow-400 bg-yellow-400/10',border: 'border-yellow-500/40', icon: MessageSquare },
    PROFILE_UPDATE:  { label: 'Perfil',         color: 'text-teal-400 bg-teal-400/10',    border: 'border-teal-500/40',   icon: Settings },
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; border: string }> = {
    DEBUG: { label: 'DEBUG', color: 'text-zinc-400 bg-zinc-400/10',  border: 'border-zinc-600/30' },
    INFO:  { label: 'INFO',  color: 'text-blue-400 bg-blue-400/10',  border: 'border-blue-500/40' },
    WARN:  { label: 'WARN',  color: 'text-yellow-400 bg-yellow-400/10', border: 'border-yellow-500/40' },
    ERROR: { label: 'ERROR', color: 'text-red-400 bg-red-400/10',    border: 'border-red-500/40' },
}

const AUDIT_ACTION_CONFIG: Record<string, { label: string; color: string; border: string; icon: React.ElementType }> = {
    CREATE:  { label: 'Criação',   color: 'text-green-400 bg-green-400/10',   border: 'border-green-500/40',  icon: Plus },
    UPDATE:  { label: 'Edição',    color: 'text-blue-400 bg-blue-400/10',     border: 'border-blue-500/40',   icon: Pencil },
    DELETE:  { label: 'Exclusão',  color: 'text-red-400 bg-red-400/10',       border: 'border-red-500/40',    icon: Trash2 },
    APPROVE: { label: 'Aprovado',  color: 'text-green-400 bg-green-400/10',   border: 'border-green-500/40',  icon: CheckCircle },
    REJECT:  { label: 'Rejeitado', color: 'text-orange-400 bg-orange-400/10', border: 'border-orange-500/40', icon: XCircle },
    RESEND:  { label: 'Reenvio',   color: 'text-purple-400 bg-purple-400/10', border: 'border-purple-500/40', icon: Send },
    SEED:    { label: 'Seed',      color: 'text-zinc-400 bg-zinc-400/10',     border: 'border-zinc-600/30',   icon: Database },
}

const ENTITY_HREF: Record<string, (id: string) => string> = {
    ARTIST:     (id) => `/admin/artists/${id}`,
    PRODUCTION: (id) => `/admin/productions/${id}`,
    NEWS:       (id) => `/admin/news/${id}`,
}

function formatTimeAgo(date: Date | string): string {
    const d = new Date(date)
    const diff = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diff < 60) return `${diff}s atrás`
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatFullDate(date: Date | string): string {
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
}

function initials(name: string | null | undefined): string {
    if (!name) return '?'
    return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

function Avatar({ name, size = 'sm' }: { name?: string | null; size?: 'sm' | 'md' }) {
    const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs'
    return (
        <div className={`${sz} rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center font-black text-white flex-shrink-0`}>
            {initials(name)}
        </div>
    )
}

function Badge({ label, color }: { label: string; color: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${color}`}>
            {label}
        </span>
    )
}

function StatCard({ label, value, sub, color = 'text-white' }: { label: string; value: number | string; sub?: string; color?: string }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-medium mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</p>
            {sub && <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>}
        </div>
    )
}

function Pagination({ page, pages, buildUrl }: { page: number; pages: number; buildUrl: (p: Record<string, string>) => string }) {
    if (pages <= 1) return null
    const pagesToShow: (number | '…')[] = []
    if (pages <= 7) {
        for (let i = 1; i <= pages; i++) pagesToShow.push(i)
    } else {
        pagesToShow.push(1)
        if (page > 3) pagesToShow.push('…')
        for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) pagesToShow.push(i)
        if (page < pages - 2) pagesToShow.push('…')
        pagesToShow.push(pages)
    }
    return (
        <div className="flex items-center justify-between text-sm mt-4">
            <Link
                href={buildUrl({ page: String(page - 1) })}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    page <= 1 ? 'text-zinc-700 pointer-events-none' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
            >
                <ChevronLeft size={14} /> Anterior
            </Link>
            <div className="flex items-center gap-1">
                {pagesToShow.map((p, i) =>
                    p === '…' ? (
                        <span key={`ellipsis-${i}`} className="w-8 text-center text-zinc-600 text-xs">…</span>
                    ) : (
                        <Link
                            key={p}
                            href={buildUrl({ page: String(p) })}
                            className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${
                                p === page ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                        >
                            {p}
                        </Link>
                    )
                )}
            </div>
            <Link
                href={buildUrl({ page: String(page + 1) })}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    page >= pages ? 'text-zinc-700 pointer-events-none' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
            >
                Próxima <ChevronRight size={14} />
            </Link>
        </div>
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
    const limit = 40
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const today = new Date(); today.setHours(0, 0, 0, 0)

    const buildUrl = (params: Record<string, string>) => {
        const next = new URLSearchParams({ tab, days: String(days), page: '1', ...params })
        return `/admin/activity?${next.toString()}`
    }

    // ── Stats globais (sempre) ──
    const [todayActivity, activeUsers7d, auditTotal, systemErrors, tabCounts] = await Promise.all([
        prisma.activity.count({ where: { createdAt: { gte: today } } }),
        prisma.activity.groupBy({ by: ['userId'], where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }).then(r => r.length),
        prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
        prisma.systemEvent.count({ where: { level: 'ERROR', createdAt: { gte: since } } }),
        Promise.all([
            prisma.activity.count({ where: { createdAt: { gte: since } } }),
            prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
            prisma.systemEvent.count({ where: { createdAt: { gte: since } } }),
        ]),
    ])

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

        const artistIds     = userLogs.filter(l => l.entityType === 'ARTIST' && l.entityId).map(l => l.entityId!)
        const newsIds       = userLogs.filter(l => l.entityType === 'NEWS' && l.entityId).map(l => l.entityId!)
        const productionIds = userLogs.filter(l => l.entityType === 'PRODUCTION' && l.entityId).map(l => l.entityId!)

        const [artists, newsList, productions] = await Promise.all([
            artistIds.length     ? prisma.artist.findMany({ where: { id: { in: artistIds } }, select: { id: true, nameRomanized: true } }) : [],
            newsIds.length       ? prisma.news.findMany({ where: { id: { in: newsIds } }, select: { id: true, title: true } }) : [],
            productionIds.length ? prisma.production.findMany({ where: { id: { in: productionIds } }, select: { id: true, titlePt: true } }) : [],
        ])

        artists.forEach(a => entityNameMap.set(a.id, a.nameRomanized))
        newsList.forEach(n => entityNameMap.set(n.id, n.title))
        productions.forEach(p => entityNameMap.set(p.id, p.titlePt))
    }

    // ── Aba Admin ──
    let auditLogs: AuditLogWithAdmin[] = []
    let auditLogTotal = 0
    if (tab === 'admin') {
        const entityFilter = sp.entity || ''
        const actionFilter = sp.action || ''
        const where = {
            createdAt: { gte: since },
            ...(entityFilter ? { entity: entityFilter } : {}),
            ...(actionFilter ? { action: actionFilter } : {}),
        }
        ;[auditLogs, auditLogTotal] = await Promise.all([
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
        const levelFilter  = sp.level || ''
        const sourceFilter = sp.source || ''
        const where = {
            createdAt: { gte: since },
            ...(levelFilter  ? { level: levelFilter } : {}),
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

    const total = tab === 'user' ? userTotal : tab === 'admin' ? auditLogTotal : systemTotal
    const pages = Math.ceil(total / limit)

    const TABS = [
        { key: 'user',   label: 'Usuários', icon: User,   count: tabCounts[0] },
        { key: 'admin',  label: 'Admin',    icon: Shield, count: tabCounts[1] },
        { key: 'system', label: 'Sistema',  icon: Server, count: tabCounts[2] },
    ]

    return (
        <AdminLayout title="Atividade">
            <div className="space-y-5">

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Atividade hoje"      value={todayActivity}  sub="eventos registrados" />
                    <StatCard label="Usuários ativos (7d)" value={activeUsers7d} sub="usuários únicos" />
                    <StatCard label="Ações admin"          value={auditTotal}    sub={`últimos ${days}d`} />
                    <StatCard
                        label="Erros de sistema"
                        value={systemErrors}
                        sub={`últimos ${days}d`}
                        color={systemErrors > 0 ? 'text-red-400' : 'text-white'}
                    />
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl w-fit">
                    {TABS.map(({ key, label, icon: Icon, count }) => (
                        <Link
                            key={key}
                            href={buildUrl({ tab: key, page: '1' })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                tab === key ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <Icon size={14} />
                            {label}
                            {count > 0 && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                    tab === key ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-500'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Período */}
                    <div className="flex items-center gap-1.5">
                        {[1, 7, 30, 90].map(d => (
                            <Link
                                key={d}
                                href={buildUrl({ days: String(d), page: '1' })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    days === d
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                        : 'bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'
                                }`}
                            >
                                {d === 1 ? 'Hoje' : `${d}d`}
                            </Link>
                        ))}
                    </div>

                    {/* Filtros por tipo — Usuário */}
                    {tab === 'user' && (
                        <>
                            <div className="w-px bg-zinc-700 h-5" />
                            {Object.entries(ACTIVITY_TYPE_CONFIG).map(([type, cfg]) => {
                                const Icon = cfg.icon
                                const active = sp.type === type
                                return (
                                    <Link
                                        key={type}
                                        href={buildUrl({ type: active ? '' : type, page: '1' })}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                                            active
                                                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                                : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300 border-transparent'
                                        }`}
                                    >
                                        <Icon size={11} />
                                        {cfg.label}
                                    </Link>
                                )
                            })}
                        </>
                    )}

                    {/* Filtros por nível — Sistema */}
                    {tab === 'system' && (
                        <>
                            <div className="w-px bg-zinc-700 h-5" />
                            {(['ERROR', 'WARN', 'INFO', 'DEBUG'] as const).map(l => {
                                const cfg = LEVEL_CONFIG[l]
                                const active = sp.level === l
                                return (
                                    <Link
                                        key={l}
                                        href={buildUrl({ level: active ? '' : l, page: '1' })}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                                            active
                                                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                                : `${cfg.color} border-transparent hover:border-current/20`
                                        }`}
                                    >
                                        {l}
                                    </Link>
                                )
                            })}
                        </>
                    )}
                </div>

                {/* Resultado */}
                <p className="text-xs text-zinc-500">
                    {total.toLocaleString('pt-BR')} registro{total !== 1 ? 's' : ''}
                    {pages > 1 && ` · página ${page} de ${pages}`}
                </p>

                {/* Lista de eventos */}
                <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800/60">

                    {/* ── Aba Usuário ── */}
                    {tab === 'user' && (
                        userLogs.length === 0
                            ? <p className="text-center py-16 text-zinc-600 text-sm">Nenhuma atividade no período</p>
                            : userLogs.map((log: ActivityWithUser) => {
                                const cfg = ACTIVITY_TYPE_CONFIG[log.type] ?? { label: log.type, color: 'text-zinc-400 bg-zinc-400/10', border: 'border-zinc-600/30', icon: Activity }
                                const TypeIcon = cfg.icon
                                const meta = log.metadata as Record<string, string> | null
                                const entityName = log.entityId ? (entityNameMap.get(log.entityId) ?? null) : null
                                const entityHref = log.entityType && log.entityId ? ENTITY_HREF[log.entityType]?.(log.entityId) : null
                                return (
                                    <div key={log.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-900/40 transition-colors border-l-2 ${cfg.border}`}>
                                        <Avatar name={log.user?.name} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-white">{log.user?.name ?? '—'}</span>
                                                <span className="text-[11px] text-zinc-500 hidden sm:inline">{log.user?.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${cfg.color}`}>
                                                    <TypeIcon size={9} />
                                                    {cfg.label}
                                                </span>
                                                {entityName && (
                                                    entityHref ? (
                                                        <Link href={entityHref} className="text-xs text-zinc-300 hover:text-purple-300 hover:underline truncate max-w-[200px]">
                                                            {entityName}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-xs text-zinc-400 truncate max-w-[200px]">{entityName}</span>
                                                    )
                                                )}
                                                {log.entityType && (
                                                    <span className="text-[10px] text-zinc-600 font-mono">{log.entityType}</span>
                                                )}
                                                {(meta?.query ?? meta?.context) && (
                                                    <span className="text-[11px] text-zinc-500 italic truncate max-w-[200px]">
                                                        &ldquo;{meta?.query ?? meta?.context}&rdquo;
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-zinc-600 whitespace-nowrap shrink-0 mt-0.5" title={formatFullDate(log.createdAt)}>
                                            {formatTimeAgo(log.createdAt)}
                                        </span>
                                    </div>
                                )
                            })
                    )}

                    {/* ── Aba Admin ── */}
                    {tab === 'admin' && (
                        auditLogs.length === 0
                            ? <p className="text-center py-16 text-zinc-600 text-sm">Nenhuma ação administrativa no período</p>
                            : auditLogs.map((log: AuditLogWithAdmin) => {
                                const cfg = AUDIT_ACTION_CONFIG[log.action] ?? { label: log.action, color: 'text-zinc-400 bg-zinc-400/10', border: 'border-zinc-600/30', icon: Activity }
                                const ActionIcon = cfg.icon
                                const hasDiff = log.before != null || log.after != null
                                return (
                                    <div key={log.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-900/40 transition-colors border-l-2 ${cfg.border}`}>
                                        <Avatar name={log.admin?.name} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-white">{log.admin?.name ?? '—'}</span>
                                                <span className="text-[11px] text-zinc-500 hidden sm:inline">{log.admin?.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${cfg.color}`}>
                                                    <ActionIcon size={9} />
                                                    {cfg.label}
                                                </span>
                                                <span className="text-xs text-zinc-400 font-mono">{log.entity}</span>
                                                {log.entityId && (
                                                    <span className="text-[10px] text-zinc-600 font-mono">#{log.entityId.slice(-8)}</span>
                                                )}
                                                {hasDiff && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">diff</span>
                                                )}
                                                {log.ip && (
                                                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-600">
                                                        <Globe size={9} />{log.ip}
                                                    </span>
                                                )}
                                            </div>
                                            {log.details && (
                                                <p className="text-[11px] text-zinc-500 mt-1 truncate max-w-[400px]">{log.details}</p>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-zinc-600 whitespace-nowrap shrink-0 mt-0.5" title={formatFullDate(log.createdAt)}>
                                            {formatTimeAgo(log.createdAt)}
                                        </span>
                                    </div>
                                )
                            })
                    )}

                    {/* ── Aba Sistema ── */}
                    {tab === 'system' && (
                        systemEvents.length === 0
                            ? <p className="text-center py-16 text-zinc-600 text-sm">Nenhum evento de sistema no período</p>
                            : systemEvents.map((ev: SystemEvent) => {
                                const cfg = LEVEL_CONFIG[ev.level] ?? LEVEL_CONFIG.INFO
                                return (
                                    <div key={ev.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-900/40 transition-colors border-l-2 ${cfg.border}`}>
                                        <div className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex-shrink-0 ${cfg.color}`}>
                                            {ev.level}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/60 px-1.5 py-0.5 rounded">{ev.source}</span>
                                            </div>
                                            <p className="text-xs text-zinc-300 line-clamp-2">{ev.message}</p>
                                        </div>
                                        <span className="text-[10px] text-zinc-600 whitespace-nowrap shrink-0 mt-0.5" title={formatFullDate(ev.createdAt)}>
                                            {formatTimeAgo(ev.createdAt)}
                                        </span>
                                    </div>
                                )
                            })
                    )}
                </div>

                <Pagination page={page} pages={pages} buildUrl={(p) => buildUrl(p)} />
            </div>
        </AdminLayout>
    )
}
