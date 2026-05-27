'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminLinkButton, AdminButton, AdminBadge, AdminEmptyState } from '@/components/admin'
import { AdminTabGroup } from '@/components/admin/AdminTabGroup'
import { AdminTableSkeleton } from '@/components/admin/AdminTableSkeleton'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import Image from 'next/image'
import Link from 'next/link'
import { EyeOff, Eye, Music2, Film, UsersRound, ExternalLink, ShieldAlert, ShoppingBag } from 'lucide-react'

interface HiddenSummary {
    hiddenArtists: number
    autoHiddenArtists: number
    hiddenProductions: number
    activeTakedowns: number
    hiddenGroups: number
    hiddenStoreProducts: number
}

interface HiddenArtist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    autoHidden: boolean
    updatedAt: string
}

interface HiddenProduction {
    id: string
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
    hasActiveTakedown: boolean
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
    const [summary, setSummary] = useState<HiddenSummary | null>(null)
    const [artists, setArtists] = useState<HiddenArtist[]>([])
    const [productions, setProductions] = useState<HiddenProduction[]>([])
    const [groups, setGroups] = useState<HiddenGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [restoringId, setRestoringId] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [s, a, p, g] = await Promise.all([
                fetch('/api/admin/hidden?type=summary').then(r => r.json()),
                fetch('/api/admin/hidden?type=artists').then(r => r.json()),
                fetch('/api/admin/hidden?type=productions').then(r => r.json()),
                fetch('/api/admin/hidden?type=groups').then(r => r.json()),
            ])
            setSummary(s)
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
            title="Central de visibilidade"
            subtitle="Triagem de conteúdo fora do site público, com encaminhamento seguro para regras automáticas, restrições legais e loja."
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
                        Restaure diretamente apenas ocultações manuais. Itens retirados por regra automática ou takedown precisam passar pela fila especializada antes de voltar ao público.
                    </p>
                </div>

                {!loading && summary && (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <VisibilityQueueCard
                            href="/admin/artists/visibility"
                            icon={<Music2 size={18} />}
                            title="Auto-ocultos"
                            value={summary.autoHiddenArtists}
                            description="Reconciliar artistas"
                            variant={summary.autoHiddenArtists > 0 ? 'warning' : 'neutral'}
                        />
                        <VisibilityQueueCard
                            href="/admin/productions/takedowns"
                            icon={<ShieldAlert size={18} />}
                            title="Takedowns ativos"
                            value={summary.activeTakedowns}
                            description="Revisão legal"
                            variant={summary.activeTakedowns > 0 ? 'error' : 'neutral'}
                        />
                        <VisibilityQueueCard
                            href="/admin/loja"
                            icon={<ShoppingBag size={18} />}
                            title="Produtos ocultos"
                            value={summary.hiddenStoreProducts}
                            description="Sincronização da loja"
                            variant={summary.hiddenStoreProducts > 0 ? 'warning' : 'neutral'}
                        />
                        <VisibilityQueueCard
                            href="/admin/productions/moderation?filter=hidden"
                            icon={<Film size={18} />}
                            title="Produções ocultas"
                            value={summary.hiddenProductions}
                            description="Moderação editorial"
                            variant="neutral"
                        />
                        <VisibilityQueueCard
                            href="/admin/groups"
                            icon={<UsersRound size={18} />}
                            title="Grupos ocultos"
                            value={summary.hiddenGroups}
                            description="Cadastro e revisão"
                            variant="neutral"
                        />
                    </div>
                )}

                {!loading && (
                    <p className="text-muted text-sm font-medium">
                        {total === 0
                            ? 'Nenhum artista, produção ou grupo oculto no momento.'
                            : `${total} registro(s) na fila de restauração manual e encaminhamento.`}
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
                                            restriction={a.autoHidden ? 'Ocultação automática' : undefined}
                                            reviewHref={a.autoHidden ? '/admin/artists/visibility' : undefined}
                                            reviewLabel="Revisar regra"
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
                                            restriction={p.hasActiveTakedown ? 'Takedown ativo' : undefined}
                                            reviewHref={p.hasActiveTakedown ? '/admin/productions/takedowns' : undefined}
                                            reviewLabel="Revisar restrição"
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
                                            editHref={`/admin/groups/${g.id}`}
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
    imageUrl, name, subtitle, updatedAt, editHref, onRestore, restoring, imageRounded, restriction, reviewHref, reviewLabel,
}: {
    imageUrl: string | null
    name: string
    subtitle?: string
    updatedAt: string
    editHref: string
    onRestore: () => void
    restoring: boolean
    imageRounded?: boolean
    restriction?: string
    reviewHref?: string
    reviewLabel?: string
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
                {restriction && <AdminBadge variant="warning" className="mt-1">{restriction}</AdminBadge>}
                <p className="text-[10px] text-muted mt-0.5">
                    Oculto desde {new Date(updatedAt).toLocaleDateString('pt-BR')}
                </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <AdminLinkButton href={editHref} variant="secondary" size="sm">
                    <ExternalLink size={12} />
                    Editar
                </AdminLinkButton>
                {reviewHref ? (
                    <AdminLinkButton href={reviewHref} variant="primary" size="sm">
                        <ShieldAlert size={12} />
                        {reviewLabel ?? 'Revisar'}
                    </AdminLinkButton>
                ) : (
                    <AdminButton
                        onClick={onRestore}
                        disabled={restoring}
                        variant="primary"
                        size="sm"
                    >
                        <Eye size={12} />
                        {restoring ? 'Restaurando...' : 'Restaurar'}
                    </AdminButton>
                )}
            </div>
        </div>
    )
}

function VisibilityQueueCard({
    href, icon, title, value, description, variant,
}: {
    href: string
    icon: React.ReactNode
    title: string
    value: number
    description: string
    variant: 'warning' | 'error' | 'neutral'
}) {
    return (
        <Link href={href} className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40">
            <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-muted group-hover:text-accent transition-colors">{icon}</span>
                <AdminBadge variant={variant} shape="pill">{value}</AdminBadge>
            </div>
            <p className="text-sm font-bold text-foreground">{title}</p>
            <p className="text-xs text-muted mt-1">{description}</p>
        </Link>
    )
}
