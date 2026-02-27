'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
    MessageSquare, Search, X, Trash2, Flag, CheckCircle,
    ChevronLeft, ChevronRight, ExternalLink, AlertTriangle,
    RefreshCw, Filter,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'

interface Comment {
    id: string
    content: string
    status: 'ACTIVE' | 'FLAGGED' | 'REMOVED'
    moderationNote: string | null
    moderatedAt: string | null
    createdAt: string
    user: { id: string; name: string | null; email: string; image: string | null; role: string }
    news: { id: string; title: string }
}

interface Stats {
    total: number
    active: number
    flagged: number
    removed: number
}

const STATUS_OPTS = [
    { value: '',        label: 'Todos',       color: 'text-zinc-300' },
    { value: 'ACTIVE',  label: 'Ativos',      color: 'text-green-400' },
    { value: 'FLAGGED', label: 'Sinalizados', color: 'text-yellow-400' },
    { value: 'REMOVED', label: 'Removidos',   color: 'text-red-400' },
]

const STATUS_BADGE: Record<string, string> = {
    ACTIVE:  'bg-green-500/15 text-green-400 border-green-500/20',
    FLAGGED: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    REMOVED: 'bg-red-500/15 text-red-400 border-red-500/20',
}
const STATUS_LABEL: Record<string, string> = {
    ACTIVE: 'Ativo', FLAGGED: 'Sinalizado', REMOVED: 'Removido',
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-center">
            <div className={`text-2xl font-black ${color}`}>{value.toLocaleString('pt-BR')}</div>
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{label}</div>
        </div>
    )
}

export default function AdminCommentsPage() {
    const [comments, setComments]     = useState<Comment[]>([])
    const [stats, setStats]           = useState<Stats>({ total: 0, active: 0, flagged: 0, removed: 0 })
    const [isLoading, setIsLoading]   = useState(true)
    const [selected, setSelected]     = useState<Set<string>>(new Set())
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 })
    const [pageJump, setPageJump]     = useState('')
    const [editingPage, setEditingPage] = useState(false)
    const [noteModal, setNoteModal]   = useState<{ id: string; current: string } | null>(null)
    const [noteInput, setNoteInput]   = useState('')
    const [bulkWorking, setBulkWorking] = useState(false)

    // Filters
    const [search,  setSearch]  = useState('')
    const [status,  setStatus]  = useState('')
    const [sortBy,  setSortBy]  = useState('newest')
    const [page,    setPage]    = useState(1)

    const fetchComments = useCallback(async () => {
        setIsLoading(true)
        setSelected(new Set())
        try {
            const params = new URLSearchParams({
                page:  String(page),
                limit: '25',
                sortBy,
                ...(search && { search }),
                ...(status && { status }),
            })
            const res  = await fetch(`/api/admin/comments?${params}`)
            const data = await res.json()
            setComments(data.comments  || [])
            setPagination(data.pagination)
            setStats(data.stats)
        } finally {
            setIsLoading(false)
        }
    }, [page, search, status, sortBy])

    useEffect(() => { fetchComments() }, [fetchComments])

    /* ── Single comment actions ── */
    const patch = async (id: string, body: object) => {
        await fetch(`/api/admin/comments/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        fetchComments()
    }

    const deleteSingle = async (id: string) => {
        if (!confirm('Excluir este comentário permanentemente?')) return
        await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
        fetchComments()
    }

    /* ── Bulk actions ── */
    const bulkAction = async (action: 'flag' | 'remove' | 'activate' | 'delete') => {
        if (selected.size === 0) return
        setBulkWorking(true)
        try {
            const ids = Array.from(selected)
            if (action === 'delete') {
                if (!confirm(`Excluir ${ids.length} comentário(s) permanentemente?`)) return
                await fetch('/api/admin/comments', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids }),
                })
            } else {
                const statusMap = { flag: 'FLAGGED', remove: 'REMOVED', activate: 'ACTIVE' }
                await Promise.all(ids.map(id =>
                    fetch(`/api/admin/comments/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: statusMap[action] }),
                    })
                ))
            }
            fetchComments()
        } finally {
            setBulkWorking(false)
        }
    }

    /* ── Selection helpers ── */
    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }
    const toggleAll = () => {
        setSelected(prev =>
            prev.size === comments.length
                ? new Set()
                : new Set(comments.map(c => c.id))
        )
    }

    /* ── Moderation note modal ── */
    const openNote = (id: string, current: string | null) => {
        setNoteModal({ id, current: current ?? '' })
        setNoteInput(current ?? '')
    }
    const saveNote = async () => {
        if (!noteModal) return
        await patch(noteModal.id, { moderationNote: noteInput })
        setNoteModal(null)
    }

    /* ── Page jump ── */
    const handlePageJump = () => {
        const p = Math.min(pagination.pages, Math.max(1, parseInt(pageJump) || page))
        setPage(p)
        setEditingPage(false)
        setPageJump('')
    }

    const handleSearch = (v: string) => { setSearch(v); setPage(1) }
    const handleStatus = (v: string) => { setStatus(v); setPage(1) }

    return (
        <AdminLayout title="Comentários">
        <div className="space-y-6">
            {/* Header row: description + refresh */}
            <div className="flex items-center justify-between flex-wrap gap-3 -mt-6">
                <p className="text-sm text-zinc-500">Gerencie e modere os comentários dos usuários</p>
                <button onClick={fetchComments}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all text-sm">
                    <RefreshCw className="w-3.5 h-3.5" /> Atualizar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total"       value={stats.total}   color="text-zinc-300" />
                <StatCard label="Ativos"      value={stats.active}  color="text-green-400" />
                <StatCard label="Sinalizados" value={stats.flagged} color="text-yellow-400" />
                <StatCard label="Removidos"   value={stats.removed} color="text-red-400" />
            </div>

            {/* Filters */}
            <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Buscar no conteúdo dos comentários..."
                        className="w-full pl-10 pr-10 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                    {search && (
                        <button onClick={() => handleSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Status + Sort */}
                <div className="flex flex-wrap gap-3">
                    {/* Status tabs */}
                    <div className="flex gap-1 p-1 bg-zinc-900/50 border border-white/10 rounded-xl">
                        {STATUS_OPTS.map(opt => (
                            <button key={opt.value}
                                onClick={() => handleStatus(opt.value)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                    status === opt.value
                                        ? 'bg-purple-600 text-white'
                                        : `${opt.color} hover:bg-zinc-800`
                                }`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="flex gap-1 p-1 bg-zinc-900/50 border border-white/10 rounded-xl ml-auto">
                        {[{ v: 'newest', l: 'Recentes' }, { v: 'oldest', l: 'Antigos' }].map(({ v, l }) => (
                            <button key={v}
                                onClick={() => { setSortBy(v); setPage(1) }}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                    sortBy === v ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                                }`}>
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Result count */}
                {!isLoading && (
                    <p className="text-xs text-zinc-500">
                        {pagination.total.toLocaleString('pt-BR')} comentário(s) encontrado(s)
                    </p>
                )}
            </div>

            {/* Bulk action bar */}
            {selected.size > 0 && (
                <div className="flex items-center gap-3 flex-wrap p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <span className="text-sm font-bold text-purple-300">{selected.size} selecionado(s)</span>
                    <div className="flex gap-2 ml-auto flex-wrap">
                        <button onClick={() => bulkAction('activate')} disabled={bulkWorking}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50">
                            <CheckCircle className="w-3.5 h-3.5" /> Ativar
                        </button>
                        <button onClick={() => bulkAction('flag')} disabled={bulkWorking}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all disabled:opacity-50">
                            <Flag className="w-3.5 h-3.5" /> Sinalizar
                        </button>
                        <button onClick={() => bulkAction('remove')} disabled={bulkWorking}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-all disabled:opacity-50">
                            <AlertTriangle className="w-3.5 h-3.5" /> Remover
                        </button>
                        <button onClick={() => bulkAction('delete')} disabled={bulkWorking}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50">
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-zinc-900/50 animate-pulse" />
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-white/5">
                    <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-400 font-bold">Nenhum comentário encontrado</p>
                    <p className="text-zinc-600 text-sm mt-1">Tente ajustar os filtros</p>
                </div>
            ) : (
                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[auto_1fr_200px_100px_110px] gap-4 px-4 py-3 border-b border-white/5 bg-zinc-900/50 text-xs font-black text-zinc-500 uppercase tracking-wider">
                        <div className="flex items-center">
                            <input type="checkbox"
                                checked={selected.size === comments.length && comments.length > 0}
                                onChange={toggleAll}
                                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-purple-500 cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center gap-1"><Filter className="w-3 h-3" /> Comentário</div>
                        <div>Notícia</div>
                        <div>Status</div>
                        <div>Ações</div>
                    </div>

                    {/* Rows */}
                    {comments.map(comment => (
                        <div key={comment.id}
                            className={`grid grid-cols-[auto_1fr_200px_100px_110px] gap-4 px-4 py-4 border-b border-white/5 last:border-0 hover:bg-zinc-800/20 transition-colors items-start ${
                                selected.has(comment.id) ? 'bg-purple-500/5' : ''
                            }`}>
                            {/* Checkbox */}
                            <div className="pt-1">
                                <input type="checkbox"
                                    checked={selected.has(comment.id)}
                                    onChange={() => toggleSelect(comment.id)}
                                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-purple-500 cursor-pointer"
                                />
                            </div>

                            {/* Content + User */}
                            <div className="min-w-0">
                                {/* User */}
                                <div className="flex items-center gap-2 mb-2">
                                    {comment.user.image ? (
                                        <img src={comment.user.image} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-black text-zinc-400">
                                                {(comment.user.name ?? comment.user.email)[0]?.toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-xs font-bold text-zinc-300 truncate">
                                        {comment.user.name ?? comment.user.email}
                                    </span>
                                    <span className="text-[10px] text-zinc-600 flex-shrink-0">
                                        {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                {/* Text */}
                                <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3 break-words">
                                    {comment.content}
                                </p>
                                {/* Moderation note */}
                                {comment.moderationNote && (
                                    <p className="text-[11px] text-yellow-500/80 mt-1.5 italic">
                                        📝 {comment.moderationNote}
                                    </p>
                                )}
                            </div>

                            {/* News */}
                            <div className="min-w-0">
                                <Link href={`/news/${comment.news.id}`} target="_blank"
                                    className="text-xs text-zinc-400 hover:text-purple-400 line-clamp-2 flex items-start gap-1 transition-colors group">
                                    <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {comment.news.title}
                                </Link>
                            </div>

                            {/* Status badge */}
                            <div>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${STATUS_BADGE[comment.status] ?? ''}`}>
                                    {STATUS_LABEL[comment.status] ?? comment.status}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-wrap">
                                {comment.status !== 'ACTIVE' && (
                                    <button onClick={() => patch(comment.id, { status: 'ACTIVE' })}
                                        title="Ativar"
                                        className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/10 transition-colors">
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                )}
                                {comment.status !== 'FLAGGED' && (
                                    <button onClick={() => patch(comment.id, { status: 'FLAGGED' })}
                                        title="Sinalizar"
                                        className="p-1.5 rounded-lg text-yellow-500 hover:bg-yellow-500/10 transition-colors">
                                        <Flag className="w-4 h-4" />
                                    </button>
                                )}
                                {comment.status !== 'REMOVED' && (
                                    <button onClick={() => patch(comment.id, { status: 'REMOVED' })}
                                        title="Remover"
                                        className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-500/10 transition-colors">
                                        <AlertTriangle className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => openNote(comment.id, comment.moderationNote)}
                                    title="Nota de moderação"
                                    className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-700 hover:text-white transition-colors text-[11px] font-black">
                                    📝
                                </button>
                                <button onClick={() => deleteSingle(comment.id)}
                                    title="Excluir permanentemente"
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 hover:border-purple-500/50 hover:text-purple-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-500">Página</span>
                        {editingPage ? (
                            <input autoFocus type="number" min={1} max={pagination.pages}
                                value={pageJump} onChange={e => setPageJump(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handlePageJump()
                                    if (e.key === 'Escape') { setEditingPage(false); setPageJump('') }
                                }}
                                onBlur={() => { setEditingPage(false); setPageJump('') }}
                                className="w-14 text-center px-2 py-1 bg-zinc-800 border border-purple-500/50 rounded text-sm text-white focus:outline-none"
                            />
                        ) : (
                            <button onClick={() => { setEditingPage(true); setPageJump(String(page)) }}
                                className="px-2 py-1 rounded text-sm font-bold text-white bg-zinc-800 hover:bg-zinc-700 hover:text-purple-400 transition-colors min-w-[2rem] text-center"
                                title="Clique para ir a uma página específica">
                                {page}
                            </button>
                        )}
                        <span className="text-sm text-zinc-500">de {pagination.pages}</span>
                        <span className="text-xs text-zinc-600 hidden sm:inline">
                            ({pagination.total.toLocaleString('pt-BR')} total)
                        </span>
                    </div>

                    <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                        disabled={page === pagination.pages}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 hover:border-purple-500/50 hover:text-purple-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                        Próxima <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Moderation note modal */}
            {noteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-white font-black text-lg mb-4">Nota de Moderação</h3>
                        <textarea
                            value={noteInput}
                            onChange={e => setNoteInput(e.target.value)}
                            placeholder="Descreva o motivo da ação de moderação..."
                            rows={4}
                            className="w-full bg-zinc-800 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none"
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setNoteModal(null)}
                                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                                Cancelar
                            </button>
                            <button onClick={saveNote}
                                className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-500 transition-colors">
                                Salvar Nota
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </AdminLayout>
    )
}
