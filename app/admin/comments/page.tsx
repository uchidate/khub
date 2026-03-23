'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
    MessageSquare, Search, X, Trash2, Flag, CheckCircle,
    ChevronLeft, ChevronRight, ExternalLink, AlertTriangle,
    RefreshCw, Filter,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { ConfirmDialog, AdminEmptyState, AdminModalOverlay, AdminIconButton, AdminButton, BulkActionBar } from '@/components/admin'
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge'
import { StatCard } from '@/components/admin'

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
    { value: '',        label: 'Todos',       color: 'text-foreground' },
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

function CommentCard({
    comment, selected, onToggle, onPatch, onDelete, onNote,
}: {
    comment: Comment
    selected: boolean
    onToggle: () => void
    onPatch: (id: string, body: object) => void
    onDelete: (id: string) => void
    onNote: (id: string, current: string | null) => void
}) {
    return (
        <div className={`p-4 border-b border-border last:border-0 ${selected ? 'bg-purple-500/5' : ''}`}>
            <div className="flex items-start gap-3">
                {/* Checkbox + Avatar */}
                <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                    <input type="checkbox" checked={selected} onChange={onToggle}
                        className="w-4 h-4 rounded border-border bg-surface accent-purple-500 cursor-pointer" />
                    {comment.user.image ? (
                        <img src={comment.user.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-surface flex items-center justify-center">
                            <span className="text-[10px] font-black text-muted">
                                {(comment.user.name ?? comment.user.email)[0]?.toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-foreground truncate">{comment.user.name ?? comment.user.email}</span>
                        <AdminStatusBadge
                            label={STATUS_LABEL[comment.status] ?? comment.status}
                            color={STATUS_BADGE[comment.status] ?? 'bg-surface text-muted'}
                            variant="pill"
                        />
                        <span className="text-[10px] text-muted ml-auto flex-shrink-0">
                            {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed line-clamp-3 break-words mb-2">{comment.content}</p>
                    {comment.moderationNote && (
                        <p className="text-[11px] text-yellow-500/80 italic mb-2">📝 {comment.moderationNote}</p>
                    )}
                    <Link href={`/news/${comment.news.id}`} target="_blank"
                        className="text-xs text-muted hover:text-purple-400 flex items-center gap-1 transition-colors mb-3">
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{comment.news.title}</span>
                    </Link>
                    <div className="flex items-center gap-1">
                        {comment.status !== 'ACTIVE' && (
                            <AdminIconButton onClick={() => onPatch(comment.id, { status: 'ACTIVE' })} title="Ativar" variant="success">
                                <CheckCircle className="w-4 h-4" />
                            </AdminIconButton>
                        )}
                        {comment.status !== 'FLAGGED' && (
                            <AdminIconButton onClick={() => onPatch(comment.id, { status: 'FLAGGED' })} title="Sinalizar" variant="warning">
                                <Flag className="w-4 h-4" />
                            </AdminIconButton>
                        )}
                        {comment.status !== 'REMOVED' && (
                            <AdminIconButton onClick={() => onPatch(comment.id, { status: 'REMOVED' })} title="Remover" variant="warning">
                                <AlertTriangle className="w-4 h-4" />
                            </AdminIconButton>
                        )}
                        <AdminIconButton onClick={() => onNote(comment.id, comment.moderationNote)} title="Nota de moderação" variant="default">
                            <span className="text-[11px] font-black">📝</span>
                        </AdminIconButton>
                        <AdminIconButton onClick={() => onDelete(comment.id)} title="Excluir permanentemente" variant="danger">
                            <Trash2 className="w-4 h-4" />
                        </AdminIconButton>
                    </div>
                </div>
            </div>
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
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} })

    const toast = useAdminToast()
    const clear = () => setSelected(new Set())

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
        } catch (err) {
            toast.error((err as Error).message || 'Erro ao carregar dados')
        } finally {
            setIsLoading(false)
        }
    }, [page, search, status, sortBy, toast])

    useEffect(() => { fetchComments() }, [fetchComments])

    /* ── Single comment actions ── */
    const patch = async (id: string, body: object) => {
        try {
            const res = await fetch(`/api/admin/comments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok) throw new Error('Falha ao atualizar comentário')
            toast.success('Comentário atualizado')
            fetchComments()
        } catch (err) {
            toast.error((err as Error).message || 'Erro ao atualizar comentário')
        }
    }

    const deleteSingle = (id: string) => {
        setConfirmModal({
            open: true,
            message: 'Excluir este comentário permanentemente?',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
                    if (!res.ok) throw new Error('Falha ao excluir comentário')
                    toast.success('Comentário excluído')
                    fetchComments()
                } catch (err) {
                    toast.error((err as Error).message || 'Erro ao excluir comentário')
                }
            },
        })
    }

    /* ── Bulk actions ── */
    const bulkAction = (action: 'flag' | 'remove' | 'activate' | 'delete') => {
        if (selected.size === 0) return
        const ids = Array.from(selected)
        if (action === 'delete') {
            setConfirmModal({
                open: true,
                message: `Excluir ${ids.length} comentário(s) permanentemente?`,
                onConfirm: async () => {
                    setBulkWorking(true)
                    try {
                        const res = await fetch('/api/admin/comments', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ids }),
                        })
                        if (!res.ok) throw new Error('Falha ao excluir comentários')
                        toast.success(`${ids.length} comentário(s) excluído(s)`)
                        fetchComments()
                    } catch (err) {
                        toast.error((err as Error).message || 'Erro ao excluir comentários')
                    } finally {
                        setBulkWorking(false)
                    }
                },
            })
        } else {
            setBulkWorking(true)
            const statusMap = { flag: 'FLAGGED', remove: 'REMOVED', activate: 'ACTIVE' } as const
            Promise.all(ids.map(id =>
                fetch(`/api/admin/comments/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: statusMap[action as keyof typeof statusMap] }),
                })
            )).then(() => {
                toast.success(`${ids.length} comentário(s) atualizados`)
                fetchComments()
            }).catch(err => {
                toast.error((err as Error).message || 'Erro ao atualizar comentários')
            }).finally(() => setBulkWorking(false))
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
        <ConfirmDialog
            open={confirmModal.open}
            title={confirmModal.message}
            variant="danger"
            onConfirm={() => { confirmModal.onConfirm(); setConfirmModal(m => ({ ...m, open: false })) }}
            onCancel={() => setConfirmModal(m => ({ ...m, open: false }))}
        />
        <div className="space-y-6">
            {/* Header row: description + refresh */}
            <div className="flex items-center justify-between flex-wrap gap-3 -mt-6">
                <p className="text-sm text-muted">Gerencie e modere os comentários dos usuários</p>
                <AdminButton onClick={fetchComments} variant="secondary" size="sm">
                    <RefreshCw className="w-3.5 h-3.5" /> Atualizar
                </AdminButton>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total"       value={stats.total}   color="text-foreground" />
                <StatCard label="Ativos"      value={stats.active}  color="text-green-400" />
                <StatCard label="Sinalizados" value={stats.flagged} color="text-yellow-400" />
                <StatCard label="Removidos"   value={stats.removed} color="text-red-400" />
            </div>

            {/* Filters */}
            <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Buscar no conteúdo dos comentários..."
                        className="w-full px-4 pr-10 py-3 bg-background border border-border rounded-xl text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-accent/50 transition-all"
                    />
                    {search && (
                        <button onClick={() => handleSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Status + Sort */}
                <div className="flex flex-wrap gap-3">
                    {/* Status tabs */}
                    <div className="flex gap-1 p-1 bg-surface border border-border rounded-xl">
                        {STATUS_OPTS.map(opt => (
                            <button key={opt.value}
                                onClick={() => handleStatus(opt.value)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                    status === opt.value
                                        ? 'bg-accent text-white'
                                        : `${opt.color} hover:bg-surface`
                                }`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="flex gap-1 p-1 bg-surface border border-border rounded-xl ml-auto">
                        {[{ v: 'newest', l: 'Recentes' }, { v: 'oldest', l: 'Antigos' }].map(({ v, l }) => (
                            <button key={v}
                                onClick={() => { setSortBy(v); setPage(1) }}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                    sortBy === v ? 'bg-accent text-white' : 'text-muted hover:text-foreground'
                                }`}>
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Result count */}
                {!isLoading && (
                    <p className="text-xs text-muted">
                        {pagination.total.toLocaleString('pt-BR')} comentário(s) encontrado(s)
                    </p>
                )}
            </div>

            {/* Bulk action bar */}
            {selected.size > 0 && (
                <BulkActionBar count={selected.size} onClear={clear}>
                    <AdminButton onClick={() => bulkAction('activate')} disabled={bulkWorking} variant="secondary" size="sm">
                        <CheckCircle className="w-3.5 h-3.5" /> Ativar
                    </AdminButton>
                    <AdminButton onClick={() => bulkAction('flag')} disabled={bulkWorking} variant="warning" size="sm">
                        <Flag className="w-3.5 h-3.5" /> Sinalizar
                    </AdminButton>
                    <AdminButton onClick={() => bulkAction('remove')} disabled={bulkWorking} variant="warning" size="sm">
                        <AlertTriangle className="w-3.5 h-3.5" /> Remover
                    </AdminButton>
                    <AdminButton onClick={() => bulkAction('delete')} disabled={bulkWorking} variant="danger" size="sm">
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </AdminButton>
                </BulkActionBar>
            )}

            {/* Table */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-surface animate-pulse" />
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-border">
                    <AdminEmptyState
                        icon={<MessageSquare className="w-12 h-12" />}
                        title="Nenhum comentário encontrado"
                        description="Tente ajustar os filtros"
                        size="lg"
                    />
                </div>
            ) : (
                <>
                {/* Mobile cards */}
                <div className="md:hidden bg-surface border border-border rounded-2xl overflow-hidden">
                    {/* Header com select-all */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface">
                        <input type="checkbox"
                            checked={selected.size === comments.length && comments.length > 0}
                            onChange={toggleAll}
                            className="w-4 h-4 rounded border-border bg-surface accent-purple-500 cursor-pointer"
                        />
                        <span className="text-xs font-black text-muted uppercase tracking-wider">
                            {selected.size > 0 ? `${selected.size} selecionado(s)` : 'Selecionar todos'}
                        </span>
                    </div>
                    {comments.map(comment => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}
                            selected={selected.has(comment.id)}
                            onToggle={() => toggleSelect(comment.id)}
                            onPatch={patch}
                            onDelete={deleteSingle}
                            onNote={openNote}
                        />
                    ))}
                </div>

                {/* Desktop grid */}
                <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden overflow-x-auto">
                  <div className="min-w-[700px]">
                    {/* Table header */}
                    <div className="grid grid-cols-[auto_1fr_200px_100px_110px] gap-4 px-4 py-3 border-b border-border bg-surface text-xs font-black text-muted uppercase tracking-wider">
                        <div className="flex items-center">
                            <input type="checkbox"
                                checked={selected.size === comments.length && comments.length > 0}
                                onChange={toggleAll}
                                className="w-4 h-4 rounded border-border bg-surface accent-purple-500 cursor-pointer"
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
                            className={`grid grid-cols-[auto_1fr_200px_100px_110px] gap-4 px-4 py-4 border-b border-border last:border-0 hover:bg-surface transition-colors items-start ${
                                selected.has(comment.id) ? 'bg-purple-500/5' : ''
                            }`}>
                            {/* Checkbox */}
                            <div className="pt-1">
                                <input type="checkbox"
                                    checked={selected.has(comment.id)}
                                    onChange={() => toggleSelect(comment.id)}
                                    className="w-4 h-4 rounded border-border bg-surface accent-purple-500 cursor-pointer"
                                />
                            </div>

                            {/* Content + User */}
                            <div className="min-w-0">
                                {/* User */}
                                <div className="flex items-center gap-2 mb-2">
                                    {comment.user.image ? (
                                        <img src={comment.user.image} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-black text-muted">
                                                {(comment.user.name ?? comment.user.email)[0]?.toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-xs font-bold text-foreground truncate">
                                        {comment.user.name ?? comment.user.email}
                                    </span>
                                    <span className="text-[10px] text-muted flex-shrink-0">
                                        {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                {/* Text */}
                                <p className="text-sm text-foreground leading-relaxed line-clamp-3 break-words">
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
                                    className="text-xs text-muted hover:text-purple-400 line-clamp-2 flex items-start gap-1 transition-colors group">
                                    <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {comment.news.title}
                                </Link>
                            </div>

                            {/* Status badge */}
                            <div>
                                <AdminStatusBadge
                                    label={STATUS_LABEL[comment.status] ?? comment.status}
                                    color={STATUS_BADGE[comment.status] ?? 'bg-surface text-muted'}
                                    variant="pill"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-wrap">
                                {comment.status !== 'ACTIVE' && (
                                    <AdminIconButton onClick={() => patch(comment.id, { status: 'ACTIVE' })} title="Ativar" variant="success">
                                        <CheckCircle className="w-4 h-4" />
                                    </AdminIconButton>
                                )}
                                {comment.status !== 'FLAGGED' && (
                                    <AdminIconButton onClick={() => patch(comment.id, { status: 'FLAGGED' })} title="Sinalizar" variant="warning">
                                        <Flag className="w-4 h-4" />
                                    </AdminIconButton>
                                )}
                                {comment.status !== 'REMOVED' && (
                                    <AdminIconButton onClick={() => patch(comment.id, { status: 'REMOVED' })} title="Remover" variant="warning">
                                        <AlertTriangle className="w-4 h-4" />
                                    </AdminIconButton>
                                )}
                                <AdminIconButton onClick={() => openNote(comment.id, comment.moderationNote)} title="Nota de moderação" variant="default">
                                    <span className="text-[11px] font-black">📝</span>
                                </AdminIconButton>
                                <AdminIconButton onClick={() => deleteSingle(comment.id)} title="Excluir permanentemente" variant="danger">
                                    <Trash2 className="w-4 h-4" />
                                </AdminIconButton>
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
                </>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted">Página</span>
                        {editingPage ? (
                            <input autoFocus type="number" min={1} max={pagination.pages}
                                value={pageJump} onChange={e => setPageJump(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handlePageJump()
                                    if (e.key === 'Escape') { setEditingPage(false); setPageJump('') }
                                }}
                                onBlur={() => { setEditingPage(false); setPageJump('') }}
                                className="w-14 text-center px-2 py-1 bg-surface border border-purple-500/50 rounded text-sm text-foreground focus:outline-none"
                            />
                        ) : (
                            <button onClick={() => { setEditingPage(true); setPageJump(String(page)) }}
                                className="px-2 py-1 rounded text-sm font-bold text-foreground bg-surface hover:bg-surface-hover transition-colors min-w-[2rem] text-center"
                                title="Clique para ir a uma página específica">
                                {page}
                            </button>
                        )}
                        <span className="text-sm text-muted">de {pagination.pages}</span>
                        <span className="text-xs text-muted hidden sm:inline">
                            ({pagination.total.toLocaleString('pt-BR')} total)
                        </span>
                    </div>

                    <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                        disabled={page === pagination.pages}
                        className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm text-foreground hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        Próxima <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Moderation note modal */}
            <AdminModalOverlay
                open={!!noteModal}
                onClose={() => setNoteModal(null)}
                title="Nota de Moderação"
                maxWidth="md"
            >
                <textarea
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder="Descreva o motivo da ação de moderação..."
                    rows={4}
                    className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 resize-none"
                />
                <div className="flex justify-end gap-3 mt-4">
                    <AdminButton onClick={() => setNoteModal(null)} variant="ghost">
                        Cancelar
                    </AdminButton>
                    <AdminButton onClick={saveNote} variant="primary">
                        Salvar Nota
                    </AdminButton>
                </div>
            </AdminModalOverlay>
        </div>
        </AdminLayout>
    )
}
