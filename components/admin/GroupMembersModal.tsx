'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Trash2, UserCheck, UserMinus, Search } from 'lucide-react'
import Image from 'next/image'

interface Artist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
}

interface Membership {
    id: string
    artistId: string
    groupId: string
    role: string | null
    isActive: boolean
    joinDate: string | null
    leaveDate: string | null
    position: number | null
    artist: Artist
}

interface Props {
    groupId: string
    groupName: string
    open: boolean
    onClose: () => void
}

export function GroupMembersModal({ groupId, groupName, open, onClose }: Props) {
    const [members, setMembers] = useState<Membership[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState<string | null>(null)

    // Add member state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Artist[]>([])
    const [searching, setSearching] = useState(false)
    const [addRole, setAddRole] = useState('')

    const fetchMembers = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/groups/${groupId}/members`)
            const data = await res.json()
            setMembers(data.members ?? [])
        } catch {
            setMembers([])
        } finally {
            setLoading(false)
        }
    }, [groupId])

    useEffect(() => {
        if (open) fetchMembers()
    }, [open, fetchMembers])

    // Search artists
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([])
            return
        }
        const timer = setTimeout(async () => {
            setSearching(true)
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
                const data = await res.json()
                const artists = (data as Array<{ type: string; id: string; title: string; subtitle?: string; imageUrl?: string }>)
                    .filter(r => r.type === 'artist')
                    .map(r => ({
                        id: r.id,
                        nameRomanized: r.title,
                        nameHangul: r.subtitle || null,
                        primaryImageUrl: r.imageUrl || null,
                    }))
                setSearchResults(artists)
            } catch {
                setSearchResults([])
            } finally {
                setSearching(false)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const addMember = async (artist: Artist) => {
        setSaving(artist.id)
        try {
            await fetch(`/api/admin/groups/${groupId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artistId: artist.id, role: addRole || undefined, isActive: true }),
            })
            setSearchQuery('')
            setAddRole('')
            setSearchResults([])
            await fetchMembers()
        } finally {
            setSaving(null)
        }
    }

    const toggleActive = async (m: Membership) => {
        setSaving(m.artistId)
        try {
            await fetch(`/api/admin/groups/${groupId}/members`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    artistId: m.artistId,
                    isActive: !m.isActive,
                    leaveDate: !m.isActive ? null : new Date().toISOString().split('T')[0],
                }),
            })
            await fetchMembers()
        } finally {
            setSaving(null)
        }
    }

    const removeMember = async (artistId: string) => {
        if (!confirm('Remover este membro permanentemente?')) return
        setSaving(artistId)
        try {
            await fetch(`/api/admin/groups/${groupId}/members?artistId=${artistId}`, { method: 'DELETE' })
            await fetchMembers()
        } finally {
            setSaving(null)
        }
    }

    if (!open) return null

    const activeMembers = members.filter(m => m.isActive)
    const formerMembers = members.filter(m => !m.isActive)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-lg font-bold text-white">Membros — {groupName}</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">{activeMembers.length} ativos · {formerMembers.length} ex-membros</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Add member */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Adicionar Membro</h3>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                <input
                                    type="text"
                                    placeholder="Buscar artista..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Papel (ex: vocal)"
                                value={addRole}
                                onChange={e => setAddRole(e.target.value)}
                                className="w-40 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        {/* Search results */}
                        {searchResults.length > 0 && (
                            <div className="bg-zinc-800/80 border border-white/10 rounded-lg overflow-hidden divide-y divide-white/5">
                                {searchResults.map(artist => {
                                    const alreadyMember = members.some(m => m.artistId === artist.id)
                                    return (
                                        <div key={artist.id} className="flex items-center gap-3 p-3">
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                                                {artist.primaryImageUrl ? (
                                                    <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                                        {artist.nameRomanized[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{artist.nameRomanized}</p>
                                                {artist.nameHangul && <p className="text-xs text-zinc-500">{artist.nameHangul}</p>}
                                            </div>
                                            <button
                                                onClick={() => !alreadyMember && addMember(artist)}
                                                disabled={alreadyMember || saving === artist.id}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    alreadyMember
                                                        ? 'bg-zinc-700 text-zinc-500 cursor-default'
                                                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                                                }`}
                                            >
                                                <Plus size={12} />
                                                {alreadyMember ? 'Já membro' : 'Adicionar'}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        {searching && <p className="text-xs text-zinc-500">Buscando...</p>}
                    </div>

                    {/* Active members */}
                    {loading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-14 bg-zinc-800/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {activeMembers.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                        <UserCheck size={14} className="text-green-500" />
                                        Membros Ativos ({activeMembers.length})
                                    </h3>
                                    {activeMembers.map(m => (
                                        <MemberRow key={m.artistId} m={m} saving={saving} onToggle={toggleActive} onRemove={removeMember} />
                                    ))}
                                </div>
                            )}

                            {formerMembers.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                        <UserMinus size={14} className="text-red-400" />
                                        Ex-Membros ({formerMembers.length})
                                    </h3>
                                    {formerMembers.map(m => (
                                        <MemberRow key={m.artistId} m={m} saving={saving} onToggle={toggleActive} onRemove={removeMember} />
                                    ))}
                                </div>
                            )}

                            {members.length === 0 && (
                                <p className="text-center text-zinc-500 text-sm py-8">Nenhum membro cadastrado. Use a busca acima para adicionar.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function MemberRow({
    m,
    saving,
    onToggle,
    onRemove,
}: {
    m: Membership
    saving: string | null
    onToggle: (m: Membership) => void
    onRemove: (id: string) => void
}) {
    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${m.isActive ? 'bg-zinc-800/40 border-white/5' : 'bg-zinc-900/40 border-white/5 opacity-60'}`}>
            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                {m.artist.primaryImageUrl ? (
                    <Image src={m.artist.primaryImageUrl} alt={m.artist.nameRomanized} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                        {m.artist.nameRomanized[0]}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{m.artist.nameRomanized}</p>
                <p className="text-xs text-zinc-500">
                    {m.role || 'Sem papel definido'}
                    {m.leaveDate && ` · Saiu em ${new Date(m.leaveDate).getFullYear()}`}
                </p>
            </div>
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => onToggle(m)}
                    disabled={saving === m.artistId}
                    title={m.isActive ? 'Marcar como ex-membro' : 'Reativar membro'}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all"
                >
                    {m.isActive ? <UserMinus size={14} /> : <UserCheck size={14} />}
                </button>
                <button
                    onClick={() => onRemove(m.artistId)}
                    disabled={saving === m.artistId}
                    title="Remover do grupo"
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-all"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    )
}
