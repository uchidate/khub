'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Globe, Pencil, X, Check, Loader2, User, Film, Users } from 'lucide-react'

interface ListItem {
    id: string
    entityType: 'ARTIST' | 'PRODUCTION' | 'GROUP'
    entityId: string
    note: string | null
    addedAt: string
}

interface UserList {
    id: string
    name: string
    description: string | null
    isPublic: boolean
    items: ListItem[]
    updatedAt: string
}

// Entity data fetched per item type
interface EntityData {
    id: string
    label: string
    sublabel?: string
    imageUrl?: string | null
    href: string
}

async function fetchEntityData(type: string, id: string): Promise<EntityData | null> {
    try {
        if (type === 'ARTIST') {
            const res = await fetch(`/api/artists/${id}`)
            if (!res.ok) return null
            const a = await res.json()
            return { id, label: a.nameRomanized, sublabel: a.nameHangul, imageUrl: a.primaryImageUrl, href: `/artists/${id}` }
        } else if (type === 'GROUP') {
            const res = await fetch(`/api/groups/${id}`)
            if (!res.ok) return null
            const g = await res.json()
            return { id, label: g.name, sublabel: g.nameHangul, imageUrl: g.profileImageUrl, href: `/groups/${id}` }
        } else if (type === 'PRODUCTION') {
            const res = await fetch(`/api/productions/${id}`)
            if (!res.ok) return null
            const p = await res.json()
            return { id, label: p.titlePt, sublabel: `${p.type} ${p.year ? `• ${p.year}` : ''}`, imageUrl: p.imageUrl, href: `/productions/${id}` }
        }
    } catch { return null }
    return null
}

const typeIcon = { ARTIST: User, GROUP: Users, PRODUCTION: Film }
const typeLabel = { ARTIST: 'Artista', GROUP: 'Grupo', PRODUCTION: 'Produção' }
const typeColor = { ARTIST: 'text-purple-400', GROUP: 'text-pink-400', PRODUCTION: 'text-cyan-400' }

export default function ListDetailPage() {
    const params = useParams()
    const router = useRouter()
    const listId = params.id as string

    const [list, setList] = useState<UserList | null>(null)
    const [entityData, setEntityData] = useState<Record<string, EntityData | null>>({})
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [editName, setEditName] = useState('')
    const [editDesc, setEditDesc] = useState('')
    const [editPublic, setEditPublic] = useState(false)
    const [saving, setSaving] = useState(false)

    const fetchList = useCallback(async () => {
        const res = await fetch(`/api/users/lists/${listId}`)
        if (!res.ok) { router.push('/lists'); return }
        const data: UserList = await res.json()
        setList(data)
        setEditName(data.name)
        setEditDesc(data.description ?? '')
        setEditPublic(data.isPublic)
        setLoading(false)
        // Fetch entity data for each item
        for (const item of data.items) {
            fetchEntityData(item.entityType, item.entityId).then(e => {
                setEntityData(prev => ({ ...prev, [`${item.entityType}:${item.entityId}`]: e }))
            })
        }
    }, [listId, router])

    useEffect(() => { fetchList() }, [fetchList])

    const handleSave = async () => {
        setSaving(true)
        const res = await fetch(`/api/users/lists/${listId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editName, description: editDesc || null, isPublic: editPublic }),
        })
        if (res.ok) {
            setList(prev => prev ? { ...prev, name: editName, description: editDesc || null, isPublic: editPublic } : null)
            setEditing(false)
        }
        setSaving(false)
    }

    const handleRemoveItem = async (item: ListItem) => {
        await fetch(`/api/users/lists/${listId}/items`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entityType: item.entityType, entityId: item.entityId }),
        })
        setList(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== item.id) } : null)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
            </div>
        )
    }

    if (!list) return null

    return (
        <div className="min-h-screen bg-black pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <div className="max-w-4xl mx-auto">
                <Link href="/lists" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Minhas Listas
                </Link>

                {/* Header */}
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 mb-6">
                    {editing ? (
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-purple-500"
                            />
                            <textarea
                                value={editDesc}
                                onChange={e => setEditDesc(e.target.value.slice(0, 500))}
                                rows={2}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                                placeholder="Descrição..."
                            />
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={editPublic} onChange={e => setEditPublic(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                                <span className="text-sm text-zinc-300">Lista pública</span>
                            </label>
                            <div className="flex gap-3">
                                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-sm font-bold transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                                <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-colors flex items-center gap-2">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Salvar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <h1 className="text-2xl font-black text-white mb-1">{list.name}</h1>
                                {list.description && <p className="text-zinc-400 text-sm">{list.description}</p>}
                                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2">
                                    <span>{list.items.length} item{list.items.length !== 1 ? 's' : ''}</span>
                                    <span className="flex items-center gap-1">
                                        {list.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                        {list.isPublic ? 'Pública' : 'Privada'}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setEditing(true)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
                                <Pencil className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Items */}
                {list.items.length === 0 ? (
                    <div className="text-center py-16 text-zinc-600">
                        <p>Nenhum item nesta lista.</p>
                        <p className="text-sm mt-1">Adicione artistas, grupos ou produções nos cards do site.</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {list.items.map(item => {
                            const key = `${item.entityType}:${item.entityId}`
                            const entity = entityData[key]
                            const Icon = typeIcon[item.entityType]
                            const color = typeColor[item.entityType]

                            return (
                                <div key={item.id} className="group bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden">
                                    <div className="relative aspect-[3/2] bg-zinc-800">
                                        {entity?.imageUrl ? (
                                            <Image src={entity.imageUrl} alt={entity.label} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Icon className={`w-8 h-8 ${color} opacity-40`} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 ${color}`}>
                                            {typeLabel[item.entityType]}
                                        </span>
                                        <button
                                            onClick={() => handleRemoveItem(item)}
                                            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="p-3">
                                        {entity ? (
                                            <Link href={entity.href} className="font-bold text-white hover:text-purple-400 transition-colors line-clamp-1 text-sm">
                                                {entity.label}
                                            </Link>
                                        ) : (
                                            <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
                                        )}
                                        {entity?.sublabel && (
                                            <p className="text-xs text-zinc-500 truncate mt-0.5">{entity.sublabel}</p>
                                        )}
                                        {item.note && <p className="text-xs text-zinc-600 mt-1 italic line-clamp-2">{item.note}</p>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
