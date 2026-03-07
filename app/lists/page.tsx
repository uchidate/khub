'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, List, Lock, Globe, ChevronRight, Loader2, Trash2, X } from 'lucide-react'

interface UserList {
    id: string
    name: string
    description: string | null
    isPublic: boolean
    itemCount: number
    createdAt: string
    updatedAt: string
}

function CreateListModal({ onClose, onCreate }: { onClose: () => void; onCreate: (list: UserList) => void }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isPublic, setIsPublic] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (name.trim().length < 1) { setError('Nome obrigatório'); return }
        setSaving(true)
        try {
            const res = await fetch('/api/users/lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), description: description.trim() || null, isPublic }),
            })
            if (!res.ok) { const e = await res.json(); setError(e.error); return }
            const list = await res.json()
            onCreate({ ...list, itemCount: 0 })
            onClose()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <h2 className="text-lg font-black text-white">Nova Lista</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Nome *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            maxLength={100}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                            placeholder="Ex: K-Dramas favoritos"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Descrição</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value.slice(0, 500))}
                            rows={3}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                            placeholder="Descrição opcional..."
                        />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={e => setIsPublic(e.target.checked)}
                            className="w-4 h-4 accent-purple-600"
                        />
                        <span className="text-sm text-zinc-300">Lista pública</span>
                    </label>
                </div>
                <div className="flex gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white font-bold text-sm transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Criar Lista
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function ListsPage() {
    const [lists, setLists] = useState<UserList[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)

    const fetchLists = useCallback(async () => {
        try {
            const res = await fetch('/api/users/lists')
            if (res.ok) setLists(await res.json())
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchLists() }, [fetchLists])

    const handleDelete = async (id: string) => {
        if (!confirm('Deletar esta lista?')) return
        await fetch(`/api/users/lists/${id}`, { method: 'DELETE' })
        setLists(prev => prev.filter(l => l.id !== id))
    }

    return (
        <div className="min-h-screen bg-black pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white">Minhas Listas</h1>
                        <p className="text-zinc-400 mt-1">Organize artistas, grupos e produções em listas personalizadas</p>
                    </div>
                    <button
                        onClick={() => setCreating(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Lista
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
                    </div>
                ) : lists.length === 0 ? (
                    <div className="text-center py-20">
                        <List className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 text-lg mb-2">Nenhuma lista criada</p>
                        <p className="text-zinc-600 text-sm mb-6">Crie listas para organizar seus favoritos</p>
                        <button
                            onClick={() => setCreating(true)}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
                        >
                            Criar primeira lista
                        </button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {lists.map(list => (
                            <div key={list.id} className="group bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden">
                                <Link href={`/lists/${list.id}`} className="block p-5">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="p-2 bg-purple-600/20 rounded-lg flex-shrink-0">
                                            <List className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="font-black text-white group-hover:text-purple-400 transition-colors truncate">{list.name}</h2>
                                            {list.description && (
                                                <p className="text-sm text-zinc-500 line-clamp-2 mt-0.5">{list.description}</p>
                                            )}
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors flex-shrink-0 mt-1" />
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                                        <span>{list.itemCount} item{list.itemCount !== 1 ? 's' : ''}</span>
                                        <span className="flex items-center gap-1">
                                            {list.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                            {list.isPublic ? 'Pública' : 'Privada'}
                                        </span>
                                    </div>
                                </Link>
                                <div className="border-t border-zinc-800 px-5 py-2 flex justify-end">
                                    <button
                                        onClick={() => handleDelete(list.id)}
                                        className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Deletar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {creating && (
                <CreateListModal
                    onClose={() => setCreating(false)}
                    onCreate={list => setLists(prev => [list, ...prev])}
                />
            )}
        </div>
    )
}
