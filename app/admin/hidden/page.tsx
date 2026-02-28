'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import Image from 'next/image'
import Link from 'next/link'
import { EyeOff, Eye, Music2, Film, UsersRound, ExternalLink } from 'lucide-react'

interface HiddenArtist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    updatedAt: string
}

interface HiddenProduction {
    id: string
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
    updatedAt: string
}

interface HiddenGroup {
    id: string
    name: string
    nameHangul: string | null
    profileImageUrl: string | null
    updatedAt: string
}

type Tab = 'artists' | 'productions' | 'groups'

export default function HiddenItemsPage() {
    const [tab, setTab] = useState<Tab>('artists')
    const [artists, setArtists] = useState<HiddenArtist[]>([])
    const [productions, setProductions] = useState<HiddenProduction[]>([])
    const [groups, setGroups] = useState<HiddenGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [restoringId, setRestoringId] = useState<string | null>(null)
    const [error, setError] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const [a, p, g] = await Promise.all([
                fetch('/api/admin/hidden?type=artists').then(r => r.json()),
                fetch('/api/admin/hidden?type=productions').then(r => r.json()),
                fetch('/api/admin/hidden?type=groups').then(r => r.json()),
            ])
            setArtists(a.items ?? [])
            setProductions(p.items ?? [])
            setGroups(g.items ?? [])
        } catch {
            setError('Erro ao carregar itens ocultos')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const restore = async (type: string, id: string) => {
        setRestoringId(id)
        try {
            const url =
                type === 'artists' ? `/api/admin/artists?id=${id}` :
                type === 'productions' ? `/api/admin/productions?id=${id}` :
                `/api/admin/groups?id=${id}`
            const res = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isHidden: false }),
            })
            if (!res.ok) throw new Error()
            await load()
        } catch {
            setError('Erro ao restaurar item')
        } finally {
            setRestoringId(null)
        }
    }

    const tabs: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
        { key: 'artists', label: 'Artistas', icon: Music2, count: artists.length },
        { key: 'productions', label: 'Produções', icon: Film, count: productions.length },
        { key: 'groups', label: 'Grupos', icon: UsersRound, count: groups.length },
    ]

    const total = artists.length + productions.length + groups.length

    return (
        <AdminLayout title="Itens Ocultos">
            <div className="space-y-6">
                <p className="text-zinc-400 text-sm">
                    {total === 0 && !loading
                        ? 'Nenhum item oculto no momento.'
                        : `${total} item(ns) oculto(s) do site público.`}
                </p>

                {error && (
                    <p className="text-sm text-red-400">{error}</p>
                )}

                {/* Tabs */}
                <div className="flex gap-1 border-b border-zinc-800 pb-0">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${
                                tab === t.key
                                    ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            <t.icon size={14} />
                            {t.label}
                            {t.count > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-red-600/80 text-white text-[10px] font-black leading-none">
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Artists Tab */}
                        {tab === 'artists' && (
                            artists.length === 0 ? (
                                <EmptyState icon={Music2} label="Nenhum artista oculto" />
                            ) : (
                                <div className="space-y-2">
                                    {artists.map(a => (
                                        <HiddenCard
                                            key={a.id}
                                            imageUrl={a.primaryImageUrl}
                                            name={a.nameRomanized}
                                            subtitle={a.nameHangul ?? undefined}
                                            updatedAt={a.updatedAt}
                                            editHref={`/admin/artists/${a.id}`}
                                            onRestore={() => restore('artists', a.id)}
                                            restoring={restoringId === a.id}
                                            imageRounded
                                        />
                                    ))}
                                </div>
                            )
                        )}

                        {/* Productions Tab */}
                        {tab === 'productions' && (
                            productions.length === 0 ? (
                                <EmptyState icon={Film} label="Nenhuma produção oculta" />
                            ) : (
                                <div className="space-y-2">
                                    {productions.map(p => (
                                        <HiddenCard
                                            key={p.id}
                                            imageUrl={p.imageUrl}
                                            name={p.titlePt}
                                            subtitle={`${p.type}${p.year ? ` · ${p.year}` : ''}`}
                                            updatedAt={p.updatedAt}
                                            editHref={`/admin/productions/${p.id}`}
                                            onRestore={() => restore('productions', p.id)}
                                            restoring={restoringId === p.id}
                                        />
                                    ))}
                                </div>
                            )
                        )}

                        {/* Groups Tab */}
                        {tab === 'groups' && (
                            groups.length === 0 ? (
                                <EmptyState icon={UsersRound} label="Nenhum grupo oculto" />
                            ) : (
                                <div className="space-y-2">
                                    {groups.map(g => (
                                        <HiddenCard
                                            key={g.id}
                                            imageUrl={g.profileImageUrl}
                                            name={g.name}
                                            subtitle={g.nameHangul ?? undefined}
                                            updatedAt={g.updatedAt}
                                            editHref={`/admin/groups`}
                                            onRestore={() => restore('groups', g.id)}
                                            restoring={restoringId === g.id}
                                            imageRounded
                                        />
                                    ))}
                                </div>
                            )
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    )
}

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
            <Icon size={40} className="mb-3 opacity-40" />
            <p className="text-sm">{label}</p>
        </div>
    )
}

function HiddenCard({
    imageUrl, name, subtitle, updatedAt, editHref, onRestore, restoring, imageRounded,
}: {
    imageUrl: string | null
    name: string
    subtitle?: string
    updatedAt: string
    editHref: string
    onRestore: () => void
    restoring: boolean
    imageRounded?: boolean
}) {
    return (
        <div className="flex items-center gap-4 p-4 bg-zinc-900/60 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
            {/* Image */}
            <div className={`w-12 h-12 flex-shrink-0 overflow-hidden bg-zinc-800 flex items-center justify-center ${imageRounded ? 'rounded-full' : 'rounded-lg'}`}>
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <EyeOff size={18} className="text-zinc-600" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{name}</p>
                {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
                <p className="text-[10px] text-zinc-700 mt-0.5">
                    Oculto desde {new Date(updatedAt).toLocaleDateString('pt-BR')}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                    href={editHref}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors"
                >
                    <ExternalLink size={12} />
                    Editar
                </Link>
                <button
                    onClick={onRestore}
                    disabled={restoring}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-green-400 hover:text-white bg-green-900/20 hover:bg-green-600 border border-green-800/40 hover:border-green-500 rounded-lg transition-colors disabled:opacity-50"
                >
                    <Eye size={12} />
                    {restoring ? 'Restaurando...' : 'Restaurar'}
                </button>
            </div>
        </div>
    )
}
