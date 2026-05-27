'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminLinkButton, AdminButton, AdminEmptyState } from '@/components/admin'
import { AdminTabGroup } from '@/components/admin/AdminTabGroup'
import { AdminTableSkeleton } from '@/components/admin/AdminTableSkeleton'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import Image from 'next/image'
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
    const toast = useAdminToast()
    const [tab, setTab] = useState<Tab>('artists')
    const [artists, setArtists] = useState<HiddenArtist[]>([])
    const [productions, setProductions] = useState<HiddenProduction[]>([])
    const [groups, setGroups] = useState<HiddenGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [restoringId, setRestoringId] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
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
            toast.error('Erro ao carregar itens ocultos')
        } finally {
            setLoading(false)
        }
    }, [toast])

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
            toast.success('Item restaurado com sucesso')
            await load()
        } catch {
            toast.error('Erro ao restaurar item')
        } finally {
            setRestoringId(null)
        }
    }

    const total = artists.length + productions.length + groups.length

    const tabs = [
        { key: 'artists',     label: 'Artistas',  icon: <Music2 size={14} />,     badge: artists.length     || undefined },
        { key: 'productions', label: 'Produções',  icon: <Film size={14} />,       badge: productions.length || undefined },
        { key: 'groups',      label: 'Grupos',     icon: <UsersRound size={14} />, badge: groups.length      || undefined },
    ]

    return (
        <AdminLayout
            title="Itens Ocultos"
            subtitle="Fila de curadoria para artistas, produções e grupos retirados do site público, com revisão e restauração rápida."
            actions={
                <div className="flex flex-wrap gap-2">
                    <AdminLinkButton href="/admin/activity?tab=admin" variant="secondary" size="sm">
                        <Eye size={14} />
                        Ver auditoria
                    </AdminLinkButton>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-surface border border-border rounded-xl p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted mb-2">Como usar</p>
                    <p className="text-sm text-muted leading-relaxed">
                        Esta área serve para revisão editorial de conteúdo oculto. Restaure aqui quando o item puder voltar ao público e use Editar para corrigir o cadastro antes de republicar.
                    </p>
                </div>

                {!loading && (
                    <p className="text-muted text-sm">
                        {total === 0
                            ? 'Nenhum item oculto no momento.'
                            : `${total} item(ns) oculto(s) do site público.`}
                    </p>
                )}

                <AdminTabGroup tabs={tabs} active={tab} onChange={k => setTab(k as Tab)} />

                {loading ? (
                    <AdminTableSkeleton rows={5} />
                ) : (
                    <>
                        {tab === 'artists' && (
                            artists.length === 0 ? (
                                <AdminEmptyState icon={<Music2 size={32} />} title="Nenhum artista oculto" />
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

                        {tab === 'productions' && (
                            productions.length === 0 ? (
                                <AdminEmptyState icon={<Film size={32} />} title="Nenhuma produção oculta" />
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

                        {tab === 'groups' && (
                            groups.length === 0 ? (
                                <AdminEmptyState icon={<UsersRound size={32} />} title="Nenhum grupo oculto" />
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
        <div className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl">
            <div className={`w-12 h-12 flex-shrink-0 overflow-hidden bg-surface-hover flex items-center justify-center ${imageRounded ? 'rounded-full' : 'rounded-lg'}`}>
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <EyeOff size={18} className="text-muted" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm truncate">{name}</p>
                {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
                <p className="text-[10px] text-muted mt-0.5">
                    Oculto desde {new Date(updatedAt).toLocaleDateString('pt-BR')}
                </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <AdminLinkButton href={editHref} variant="secondary" size="sm">
                    <ExternalLink size={12} />
                    Editar
                </AdminLinkButton>
                <AdminButton
                    onClick={onRestore}
                    disabled={restoring}
                    variant="primary"
                    size="sm"
                >
                    <Eye size={12} />
                    {restoring ? 'Restaurando...' : 'Restaurar'}
                </AdminButton>
            </div>
        </div>
    )
}
