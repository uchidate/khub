'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminEmptyState, ConfirmDialog } from '@/components/admin'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { Tag, Plus, Pencil, Trash2, Check, X, Loader2, ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'

interface BlogCategory {
    id: string
    name: string
    slug: string
    createdAt: string
    _count: { posts: number }
}

export default function BlogCategoriesPage() {
    const toast = useAdminToast()
    const [categories, setCategories] = useState<BlogCategory[]>([])
    const [loading,    setLoading]    = useState(true)
    const [newName,    setNewName]    = useState('')
    const [creating,   setCreating]   = useState(false)
    const [editId,     setEditId]     = useState<string | null>(null)
    const [editName,   setEditName]   = useState('')
    const [savingId,   setSavingId]   = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
    const editRef = useRef<HTMLInputElement>(null)

    const load = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/blog/categories')
            setCategories(await res.json())
        } catch {
            toast.error('Erro ao carregar categorias')
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => { load() }, [load])
    useEffect(() => { if (editId) editRef.current?.focus() }, [editId])

    async function create() {
        if (!newName.trim() || creating) return
        setCreating(true)
        try {
            const res = await fetch('/api/admin/blog/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() }),
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.error ?? 'Erro ao criar'); return }
            setNewName('')
            toast.success(`Categoria "${newName.trim()}" criada`)
            load()
        } catch { toast.error('Erro de rede') }
        finally { setCreating(false) }
    }

    async function save(id: string) {
        if (!editName.trim() || savingId) return
        setSavingId(id)
        try {
            const res = await fetch(`/api/admin/blog/categories/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim() }),
            })
            if (!res.ok) { toast.error('Erro ao renomear'); return }
            setEditId(null)
            toast.success('Categoria renomeada')
            load()
        } catch { toast.error('Erro de rede') }
        finally { setSavingId(null) }
    }

    function remove(id: string, name: string) {
        if (deletingId) return
        setConfirmDelete({ id, name })
    }

    async function executeRemove(id: string) {
        setDeletingId(id)
        try {
            await fetch(`/api/admin/blog/categories/${id}`, { method: 'DELETE' })
            toast.success('Categoria removida')
            load()
        } catch { toast.error('Erro de rede') }
        finally { setDeletingId(null) }
    }

    const totalPosts = categories.reduce((acc, c) => acc + c._count.posts, 0)

    return (
        <AdminLayout title="Categorias de Blog" subtitle="Organize os posts por categoria temática">

            {/* Stats bar */}
            <div className="flex items-center gap-6 mb-6 p-4 rounded-xl bg-surface border border-border">
                <div>
                    <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Categorias</p>
                    <p className="text-2xl font-black text-foreground">{categories.length}</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                    <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Posts categorizados</p>
                    <p className="text-2xl font-black text-foreground">{totalPosts}</p>
                </div>
                <Link
                    href="/admin/blog"
                    className="ml-auto flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={13} />
                    Voltar ao Blog
                </Link>
            </div>

            <div className="max-w-lg space-y-4">
                {/* Create */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Nome da nova categoria..."
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && create()}
                        className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                    />
                    <button
                        onClick={create}
                        disabled={creating || !newName.trim()}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-all"
                    >
                        {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        Criar
                    </button>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-muted" />
                    </div>
                ) : categories.length === 0 ? (
                    <AdminEmptyState
                        icon={<Tag className="w-8 h-8 text-muted" />}
                        title="Nenhuma categoria"
                        description="Crie categorias para organizar os posts do blog."
                        bordered
                    />
                ) : (
                    <div className="space-y-1.5">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-surface">
                                {editId === cat.id ? (
                                    <>
                                        <input
                                            ref={editRef}
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') save(cat.id)
                                                if (e.key === 'Escape') setEditId(null)
                                            }}
                                            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none border-b border-accent"
                                        />
                                        <button onClick={() => save(cat.id)} disabled={!!savingId} className="p-1 text-emerald-400 hover:text-emerald-300">
                                            {savingId === cat.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                        </button>
                                        <button onClick={() => setEditId(null)} className="p-1 text-muted hover:text-foreground">
                                            <X size={13} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Tag size={13} className="text-muted shrink-0" />
                                        <span className="flex-1 text-sm font-medium text-foreground">{cat.name}</span>
                                        <span className="text-[11px] text-muted">{cat._count.posts} post{cat._count.posts !== 1 ? 's' : ''}</span>
                                        <Link
                                            href={`/admin/blog?category=${cat.slug}`}
                                            className="p-1 text-muted hover:text-foreground transition-colors"
                                            title="Ver posts"
                                        >
                                            <FileText size={12} />
                                        </Link>
                                        <button
                                            onClick={() => { setEditId(cat.id); setEditName(cat.name) }}
                                            className="p-1 text-muted hover:text-foreground transition-colors"
                                            title="Renomear"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            onClick={() => remove(cat.id, cat.name)}
                                            disabled={deletingId === cat.id}
                                            className="p-1 text-muted hover:text-red-400 transition-colors"
                                            title="Remover"
                                        >
                                            {deletingId === cat.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <ConfirmDialog
                open={!!confirmDelete}
                title={`Remover categoria "${confirmDelete?.name}"?`}
                description="Os posts associados perderão a categoria."
                confirmLabel="Remover"
                variant="danger"
                onConfirm={async () => { await executeRemove(confirmDelete!.id); setConfirmDelete(null) }}
                onCancel={() => setConfirmDelete(null)}
            />
        </AdminLayout>
    )
}
