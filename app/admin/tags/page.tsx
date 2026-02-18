'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Tag, RefreshCw, Pencil, Trash2, Check, X, Search, Newspaper, Film } from 'lucide-react'

interface TagEntry {
    tag: string
    newsCount: number
    productionCount: number
    total: number
}

export default function TagsAdminPage() {
    const [tags, setTags] = useState<TagEntry[]>([])
    const [filtered, setFiltered] = useState<TagEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'news' | 'productions'>('all')

    // Rename state
    const [editingTag, setEditingTag] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [saving, setSaving] = useState(false)

    // Delete confirm
    const [deletingTag, setDeletingTag] = useState<string | null>(null)

    const fetchTags = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/tags')
            const data = await res.json()
            setTags(data.tags || [])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchTags() }, [fetchTags])

    useEffect(() => {
        let list = tags
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(t => t.tag.toLowerCase().includes(q))
        }
        if (filterType === 'news') list = list.filter(t => t.newsCount > 0)
        if (filterType === 'productions') list = list.filter(t => t.productionCount > 0)
        setFiltered(list)
    }, [tags, search, filterType])

    const startEdit = (tag: string) => {
        setEditingTag(tag)
        setEditValue(tag)
    }

    const cancelEdit = () => {
        setEditingTag(null)
        setEditValue('')
    }

    const saveRename = async (oldTag: string) => {
        const newTag = editValue.trim()
        if (!newTag || newTag === oldTag) { cancelEdit(); return }
        setSaving(true)
        try {
            const res = await fetch('/api/admin/tags', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldTag, newTag }),
            })
            if (!res.ok) {
                const err = await res.json()
                alert(err.error || 'Erro ao renomear')
                return
            }
            cancelEdit()
            await fetchTags()
        } finally {
            setSaving(false)
        }
    }

    const confirmDelete = async (tag: string) => {
        const res = await fetch('/api/admin/tags', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag }),
        })
        if (!res.ok) {
            const err = await res.json()
            alert(err.error || 'Erro ao deletar')
            return
        }
        setDeletingTag(null)
        await fetchTags()
    }

    const totalUsage = tags.reduce((acc, t) => acc + t.total, 0)
    const newsOnly = tags.filter(t => t.newsCount > 0 && t.productionCount === 0).length
    const prodsOnly = tags.filter(t => t.productionCount > 0 && t.newsCount === 0).length
    const shared = tags.filter(t => t.newsCount > 0 && t.productionCount > 0).length

    return (
        <AdminLayout title="Gestão de Tags">
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-white">{tags.length}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Tags únicas</p>
                    </div>
                    <div className="bg-zinc-900 border border-purple-500/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-purple-400">{totalUsage}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Usos totais</p>
                    </div>
                    <div className="bg-zinc-900 border border-blue-500/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-blue-400">{shared}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Partilhadas</p>
                    </div>
                    <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-amber-400">{newsOnly + prodsOnly}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Exclusivas</p>
                    </div>
                </div>

                {/* Strategy note */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
                    <p className="font-bold mb-1">Estratégia global de tags</p>
                    <p className="text-blue-400/80 text-xs">
                        Tags são aplicadas em <strong>Notícias</strong> e <strong>Produções</strong>.
                        Use nomes em minúsculas e hífens (ex: <code className="bg-blue-500/10 px-1 rounded">k-pop</code>, <code className="bg-blue-500/10 px-1 rounded">k-drama</code>).
                        Tags partilhadas entre conteúdos permitem navegação cruzada e recomendações.
                        Evite duplicatas com capitalização diferente — use Renomear para padronizar.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar tag..."
                            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
                        />
                    </div>
                    <div className="flex gap-2">
                        {([['all', 'Todas'], ['news', 'Notícias'], ['productions', 'Produções']] as const).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setFilterType(val)}
                                className={`px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${filterType === val ? 'bg-purple-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                            >
                                {label}
                            </button>
                        ))}
                        <button
                            onClick={fetchTags}
                            disabled={loading}
                            className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Tag list */}
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-zinc-500">
                        <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>Nenhuma tag encontrada</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {filtered.map(entry => (
                            <div
                                key={entry.tag}
                                className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group"
                            >
                                {/* Tag icon */}
                                <Tag className="w-4 h-4 text-zinc-600 flex-shrink-0" />

                                {/* Tag name or edit input */}
                                {editingTag === entry.tag ? (
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') saveRename(entry.tag)
                                            if (e.key === 'Escape') cancelEdit()
                                        }}
                                        autoFocus
                                        className="flex-1 bg-zinc-800 border border-purple-500/50 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                                    />
                                ) : (
                                    <span className="flex-1 text-sm font-bold text-white font-mono">{entry.tag}</span>
                                )}

                                {/* Usage badges */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {entry.newsCount > 0 && (
                                        <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5">
                                            <Newspaper className="w-3 h-3" />
                                            {entry.newsCount}
                                        </span>
                                    )}
                                    {entry.productionCount > 0 && (
                                        <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-2 py-0.5">
                                            <Film className="w-3 h-3" />
                                            {entry.productionCount}
                                        </span>
                                    )}
                                    <span className="text-xs text-zinc-500 w-8 text-right">{entry.total}×</span>
                                </div>

                                {/* Actions */}
                                {editingTag === entry.tag ? (
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => saveRename(entry.tag)}
                                            disabled={saving}
                                            className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(entry.tag)}
                                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                            title="Renomear"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingTag(entry.tag)}
                                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                                            title="Remover de todos os conteúdos"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete confirm modal */}
            {deletingTag && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-3">
                            <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <h2 className="text-base font-black text-white">Remover tag</h2>
                        </div>
                        <p className="text-zinc-400 text-sm mb-1">
                            Remover <span className="font-mono font-bold text-white">{deletingTag}</span> de todos os conteúdos?
                        </p>
                        <p className="text-zinc-600 text-xs mb-5">Esta ação não pode ser desfeita.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingTag(null)}
                                className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm font-bold hover:border-zinc-500 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => confirmDelete(deletingTag)}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors"
                            >
                                Remover
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
