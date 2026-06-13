'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { CheckCircle, ExternalLink, Save, RefreshCw, Search, Users, Trash2 } from 'lucide-react'
import { adminApi, ApiError } from '@/lib/admin-api'
import { AdminEmptyState, AdminTableSkeleton } from '@/components/admin'
import { ProfileChangeHistory } from '@/components/admin/ProfileChangeHistory'

interface MusicalGroup {
    id: string
    name: string
    nameHangul: string | null
    mbid: string | null
    bio: string | null
    profileImageUrl: string | null
    debutDate: string | null
    disbandDate: string | null
    agencyId: string | null
    agency: { id: string; name: string } | null
    socialLinks: Record<string, string> | null
    fanClubName: string | null
    officialColor: string | null
    videos: Array<{ title: string; url: string }> | null
    isHidden: boolean
}

interface Agency {
    id: string
    name: string
}

interface SpotifyArtistCandidate {
    id: string
    name: string
    url: string
    imageUrl: string | null
    followers: number
    popularity: number
    genres: string[]
}

interface SpotifyArtistLink {
    externalId: string
    url: string
    matchStatus: string
    matchedAt: string | null
}

const SOCIAL_PLATFORMS = ['website', 'instagram', 'youtube', 'twitter', 'tiktok', 'weverse', 'vlive'] as const
const SOCIAL_LABELS: Record<typeof SOCIAL_PLATFORMS[number], string> = {
    website: '🌐 Site Oficial',
    instagram: '📸 Instagram',
    youtube: '▶️ YouTube',
    twitter: '🐦 Twitter / X',
    tiktok: '🎵 TikTok',
    weverse: '💬 Weverse',
    vlive: '📺 VLive',
}
const MAX_MVS = 6

interface FormState {
    name: string
    nameHangul: string
    mbid: string
    bio: string
    profileImageUrl: string
    debutDate: string
    disbandDate: string
    agencyId: string
    fanClubName: string
    officialColor: string
    isHidden: boolean
    // Social links flat
    sl_website: string
    sl_instagram: string
    sl_youtube: string
    sl_twitter: string
    sl_tiktok: string
    sl_weverse: string
    sl_vlive: string
    // MV flat
    mv1_title: string; mv1_url: string
    mv2_title: string; mv2_url: string
    mv3_title: string; mv3_url: string
    mv4_title: string; mv4_url: string
    mv5_title: string; mv5_url: string
    mv6_title: string; mv6_url: string
}

function groupToForm(group: MusicalGroup): FormState {
    const sl: Record<string, string> = {}
    for (const p of SOCIAL_PLATFORMS) {
        sl[`sl_${p}`] = group.socialLinks?.[p] ?? ''
    }
    const mv: Record<string, string> = {}
    for (let i = 1; i <= MAX_MVS; i++) {
        const v = group.videos?.[i - 1]
        mv[`mv${i}_title`] = v?.title ?? ''
        mv[`mv${i}_url`] = v?.url ?? ''
    }
    return {
        name: group.name,
        nameHangul: group.nameHangul ?? '',
        mbid: group.mbid ?? '',
        bio: group.bio ?? '',
        profileImageUrl: group.profileImageUrl ?? '',
        debutDate: group.debutDate ? new Date(group.debutDate).toISOString().split('T')[0] : '',
        disbandDate: group.disbandDate ? new Date(group.disbandDate).toISOString().split('T')[0] : '',
        agencyId: group.agencyId ?? '',
        fanClubName: group.fanClubName ?? '',
        officialColor: group.officialColor ?? '',
        isHidden: group.isHidden ?? false,
        ...sl,
        ...mv,
    } as FormState
}

export default function EditGroupPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const toast = useAdminToast()
    const returnToRef = useRef<string | null>(null)
    const [group, setGroup] = useState<MusicalGroup | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [form, setForm] = useState<FormState | null>(null)
    const [agencies, setAgencies] = useState<Agency[]>([])
    const [spotifyQuery, setSpotifyQuery] = useState('')
    const [spotifyCandidates, setSpotifyCandidates] = useState<SpotifyArtistCandidate[]>([])
    const [spotifyLink, setSpotifyLink] = useState<SpotifyArtistLink | null>(null)
    const [spotifyLoading, setSpotifyLoading] = useState(false)
    const [spotifySavingId, setSpotifySavingId] = useState<string | null>(null)
    const [spotifyError, setSpotifyError] = useState('')
    const [spotifySyncing, setSpotifySyncing] = useState(false)
    const [spotifySyncResult, setSpotifySyncResult] = useState<string | null>(null)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const returnTo = params.get('returnTo')
        if (returnTo) returnToRef.current = returnTo
    }, [])

    useEffect(() => {
        Promise.all([
            fetch(`/api/admin/groups?id=${id}`).then(r => r.json()),
            fetch('/api/admin/agencies/all').then(r => r.json()),
        ])
            .then(([groupData, agencyData]) => {
                setGroup(groupData)
                setForm(groupToForm(groupData))
                setAgencies(agencyData?.data ?? [])
            })
            .catch(() => toast.error('Erro ao carregar grupo'))
            .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    useEffect(() => {
        fetch(`/api/admin/groups/${id}/spotify-link`)
            .then(r => r.json())
            .then(data => setSpotifyLink(data.link ?? null))
            .catch(() => null)
    }, [id])

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(prev => prev ? { ...prev, [key]: value } : prev)
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await adminApi.groups.delete([id])
            toast.deleted('Grupo')
            router.push('/admin/groups')
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Erro ao excluir')
            setConfirmDelete(false)
        } finally {
            setDeleting(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form) return
        setSaving(true)
        try {
            // Assemble socialLinks
            const socialLinks: Record<string, string> = {}
            for (const p of SOCIAL_PLATFORMS) {
                const val = form[`sl_${p}` as keyof FormState] as string
                if (val?.trim()) socialLinks[p] = val.trim()
            }
            // Assemble videos
            const videos: Array<{ title: string; url: string }> = []
            for (let i = 1; i <= MAX_MVS; i++) {
                const title = (form[`mv${i}_title` as keyof FormState] as string)?.trim() ?? ''
                const url = (form[`mv${i}_url` as keyof FormState] as string)?.trim() ?? ''
                if (url) videos.push({ title: title || `MV ${i}`, url })
            }

            const payload: Record<string, unknown> = {
                name: form.name,
                nameHangul: form.nameHangul || null,
                mbid: form.mbid || null,
                bio: form.bio || null,
                profileImageUrl: form.profileImageUrl || null,
                debutDate: form.debutDate || null,
                disbandDate: form.disbandDate || null,
                agencyId: form.agencyId || null,
                fanClubName: form.fanClubName || null,
                officialColor: form.officialColor || null,
                isHidden: form.isHidden,
                socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
                videos: videos.length > 0 ? videos : null,
            }

            await adminApi.groups.update(id, payload)
            toast.saved()
            if (returnToRef.current) {
                router.push(returnToRef.current!)
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    const searchSpotify = async () => {
        const query = (spotifyQuery || form?.name || '').trim()
        if (!query) return
        setSpotifyLoading(true)
        setSpotifyError('')
        try {
            const res = await fetch(`/api/admin/artists/spotify-search?name=${encodeURIComponent(query)}`)
            const raw = await res.text()
            const data = raw ? JSON.parse(raw) : {}
            if (!res.ok) {
                setSpotifyError(data.error || `Erro ao buscar no Spotify (${res.status})`)
                return
            }
            setSpotifyCandidates(data.artists ?? [])
        } catch (error) {
            setSpotifyError(error instanceof SyntaxError
                ? 'Resposta inválida do servidor. Verifique se a versão nova foi implantada em produção.'
                : 'Erro de rede')
        } finally {
            setSpotifyLoading(false)
        }
    }

    const linkSpotify = async (candidate: SpotifyArtistCandidate) => {
        setSpotifySavingId(candidate.id)
        try {
            const res = await fetch(`/api/admin/groups/${id}/spotify-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ externalId: candidate.id, url: candidate.url }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'Erro ao vincular Spotify')
                return
            }
            setSpotifyLink(data.link)
            setSpotifyCandidates([])
            toast.success('Perfil do Spotify vinculado')
        } catch {
            toast.error('Erro ao vincular Spotify')
        } finally {
            setSpotifySavingId(null)
        }
    }

    const unlinkSpotify = async () => {
        try {
            const res = await fetch(`/api/admin/groups/${id}/spotify-link`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json().catch(() => null)
                toast.error(data?.error || 'Erro ao remover vínculo')
                return
            }
            setSpotifyLink(null)
            setSpotifySyncResult(null)
            toast.success('Vínculo removido')
        } catch {
            toast.error('Erro ao remover vínculo')
        }
    }

    const syncSpotify = async () => {
        setSpotifySyncing(true)
        setSpotifySyncResult(null)
        try {
            const res = await fetch(`/api/admin/groups/${id}/spotify-sync`, { method: 'POST' })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'Erro ao sincronizar')
                return
            }
            const msg = `${data.releasesSynced ?? 0} lançamentos, ${data.tracksSynced ?? 0} faixas`
            setSpotifySyncResult(msg)
            toast.success(`Discografia sincronizada — ${msg}`)
        } catch {
            toast.error('Erro ao sincronizar discografia')
        } finally {
            setSpotifySyncing(false)
        }
    }

    const spotifySearchTerms = Array.from(new Set(
        [form?.name, form?.nameHangul]
            .map(value => typeof value === 'string' ? value.trim() : '')
            .filter(Boolean)
    ))
    const normalizeName = (value: string) => value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, '')
    const knownSpotifyNames = new Set(spotifySearchTerms.map(normalizeName))
    const getSpotifyMatchLabel = (candidate: SpotifyArtistCandidate) => {
        const normalized = normalizeName(candidate.name)
        if (knownSpotifyNames.has(normalized)) return 'Correspondência forte'
        if (spotifySearchTerms.some(term => normalized.includes(normalizeName(term)) || normalizeName(term).includes(normalized))) {
            return 'Nome parecido'
        }
        return null
    }

    const inputCls = "w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 text-sm"
    const labelCls = "block text-xs font-bold text-muted uppercase tracking-widest mb-1.5"

    return (
        <AdminLayout title={group ? `Editar: ${group.name}` : 'Editar Grupo'} hideTitle>
            <div className="max-w-3xl mx-auto px-4 py-8">
                <PageHeader
                    title={group ? group.name : 'Editar Grupo'}
                    backHref="/admin/groups"
                    backLabel="Grupos"
                >
                    {group && (
                        <Link
                            href={`/groups/${id}`}
                            target="_blank"
                            className="flex items-center gap-1.5 text-xs text-foreground border border-border hover:bg-surface-hover px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Ver no site
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                    )}
                    {group && (
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-red-950 border border-border hover:border-red-800 text-muted hover:text-red-400 rounded-lg text-xs font-medium transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                        </button>
                    )}
                </PageHeader>

                <ConfirmDialog
                    open={confirmDelete}
                    title="Excluir este grupo?"
                    description="Esta ação não pode ser desfeita. Todos os dados do grupo serão removidos permanentemente."
                    confirmLabel="Excluir"
                    variant="danger"
                    loading={deleting}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDelete(false)}
                />

                {loading && <AdminTableSkeleton rows={6} />}

                {!loading && !group && (
                    <AdminEmptyState title="Grupo não encontrado." size="lg" />
                )}

                {group && form && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar + nome */}
                        <div className="flex gap-5 items-start">
                            <div className="w-20 flex-shrink-0">
                                {form.profileImageUrl ? (
                                    <Image
                                        src={form.profileImageUrl}
                                        alt={form.name}
                                        width={80}
                                        height={80}
                                        className="rounded-full object-cover w-20 h-20"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
                                        <Users className="w-8 h-8 text-muted" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className={labelCls}>Nome do Grupo *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => set('name', e.target.value)}
                                        className={inputCls}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Nome em Hangul</label>
                                    <input
                                        type="text"
                                        value={form.nameHangul}
                                        onChange={e => set('nameHangul', e.target.value)}
                                        placeholder="Ex: 방탄소년단"
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* MusicBrainz ID */}
                        <div>
                            <label className={labelCls}>MusicBrainz ID</label>
                            <input
                                type="text"
                                value={form.mbid}
                                onChange={e => set('mbid', e.target.value)}
                                placeholder="UUID do MusicBrainz"
                                className={inputCls}
                            />
                        </div>

                        {/* URL da foto */}
                        <div>
                            <label className={labelCls}>URL da Foto</label>
                            <input
                                type="text"
                                value={form.profileImageUrl}
                                onChange={e => set('profileImageUrl', e.target.value)}
                                placeholder="https://..."
                                className={inputCls}
                            />
                        </div>

                        {/* Datas + Agência */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Data de Debut</label>
                                <input
                                    type="date"
                                    value={form.debutDate}
                                    onChange={e => set('debutDate', e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Data de Disbandamento</label>
                                <input
                                    type="date"
                                    value={form.disbandDate}
                                    onChange={e => set('disbandDate', e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Agência */}
                        <div>
                            <label className={labelCls}>Agência</label>
                            <select
                                value={form.agencyId}
                                onChange={e => set('agencyId', e.target.value)}
                                className={inputCls}
                            >
                                <option value="">— Sem agência —</option>
                                {agencies.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Biografia */}
                        <div>
                            <label className={labelCls}>Biografia</label>
                            <textarea
                                value={form.bio}
                                onChange={e => set('bio', e.target.value)}
                                placeholder="Descrição do grupo..."
                                rows={4}
                                className={inputCls + ' resize-none'}
                            />
                        </div>

                        {/* Fã-clube + Cor oficial */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>💜 Nome do Fã-Clube</label>
                                <input
                                    type="text"
                                    value={form.fanClubName}
                                    onChange={e => set('fanClubName', e.target.value)}
                                    placeholder="Ex: ARMY, BLINK, ONCE"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>🎨 Cor Oficial (hex)</label>
                                <input
                                    type="text"
                                    value={form.officialColor}
                                    onChange={e => set('officialColor', e.target.value)}
                                    placeholder="#c6a852"
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Redes sociais */}
                        <div className="border border-border rounded-xl p-4 bg-surface space-y-3">
                            <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Redes Sociais</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {SOCIAL_PLATFORMS.map(p => (
                                    <div key={p}>
                                        <label className={labelCls}>{SOCIAL_LABELS[p]}</label>
                                        <input
                                            type="text"
                                            value={form[`sl_${p}` as keyof FormState] as string}
                                            onChange={e => set(`sl_${p}` as keyof FormState, e.target.value as FormState[keyof FormState])}
                                            placeholder="https://..."
                                            className={inputCls}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Catálogo musical */}
                        <div className="border border-border rounded-xl p-4 bg-surface space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Catálogo Musical</h3>
                                {spotifyLink && (
                                    <a
                                        href={spotifyLink.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 hover:text-green-300"
                                    >
                                        Abrir Spotify
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>

                            {spotifyLink ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground">Spotify vinculado</p>
                                        <p className="text-xs text-muted truncate">{spotifyLink.url}</p>
                                    </div>
                                    <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-green-500/15 text-green-400">
                                        Confirmado
                                    </span>
                                    <button
                                        type="button"
                                        onClick={unlinkSpotify}
                                        className="text-xs text-muted hover:text-red-400 transition-colors"
                                    >
                                        Remover
                                    </button>
                                </div>
                            ) : (
                                <p className="text-xs text-muted">Nenhum perfil do Spotify vinculado.</p>
                            )}

                            {spotifyLink && (
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={syncSpotify}
                                        disabled={spotifySyncing}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50 text-green-400 rounded-lg text-xs font-bold transition-colors border border-green-500/20"
                                    >
                                        {spotifySyncing
                                            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sincronizando...</>
                                            : <><RefreshCw className="w-3.5 h-3.5" /> Sincronizar discografia</>
                                        }
                                    </button>
                                    {spotifySyncResult && (
                                        <span className="text-[10px] text-muted">{spotifySyncResult}</span>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={spotifyQuery}
                                    onChange={e => setSpotifyQuery(e.target.value)}
                                    placeholder={form.name ? `Buscar por ${form.name}` : 'Buscar grupo no Spotify'}
                                    className={inputCls}
                                />
                                <button
                                    type="button"
                                    onClick={searchSpotify}
                                    disabled={spotifyLoading}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-surface-hover text-sm disabled:opacity-50"
                                >
                                    {spotifyLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    Buscar Spotify
                                </button>
                            </div>

                            {spotifySearchTerms.length > 1 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {spotifySearchTerms.map(term => (
                                        <button
                                            key={term}
                                            type="button"
                                            onClick={() => setSpotifyQuery(term)}
                                            className="px-2 py-1 rounded-md border border-border bg-background text-[11px] text-muted hover:text-foreground hover:border-accent/40 transition-colors"
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {spotifyError && <p className="text-xs text-red-400">{spotifyError}</p>}

                            {spotifyCandidates.length > 0 && (
                                <div className="space-y-2">
                                    {spotifyCandidates.map(candidate => (
                                        <div key={candidate.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                                            {candidate.imageUrl ? (
                                                <Image
                                                    src={candidate.imageUrl}
                                                    alt={candidate.name}
                                                    width={44}
                                                    height={44}
                                                    className="w-11 h-11 rounded object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded bg-surface flex items-center justify-center">
                                                    <Users className="w-4 h-4 text-muted" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <p className="text-sm font-semibold text-foreground truncate">{candidate.name}</p>
                                                    {getSpotifyMatchLabel(candidate) && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                                                            {getSpotifyMatchLabel(candidate)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted">
                                                    {candidate.followers.toLocaleString('pt-BR')} seguidores
                                                    {' · '}
                                                    popularidade {candidate.popularity}
                                                </p>
                                                {candidate.genres.length > 0 && (
                                                    <p className="text-[10px] text-muted truncate">{candidate.genres.join(', ')}</p>
                                                )}
                                            </div>
                                            <a
                                                href={candidate.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-2 rounded-lg border border-border text-xs text-muted hover:text-foreground hover:bg-surface transition-colors"
                                            >
                                                Abrir
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => linkSpotify(candidate)}
                                                disabled={spotifySavingId === candidate.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 text-xs font-bold disabled:opacity-50"
                                            >
                                                {spotifySavingId === candidate.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                                Vincular
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* MVs */}
                        <div className="border border-border rounded-xl p-4 bg-surface space-y-4">
                            <h3 className="text-xs font-bold text-muted uppercase tracking-widest">🎬 MVs Principais</h3>
                            {Array.from({ length: MAX_MVS }, (_, i) => i + 1).map(i => (
                                <div key={i} className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>MV {i} — Título</label>
                                        <input
                                            type="text"
                                            value={form[`mv${i}_title` as keyof FormState] as string}
                                            onChange={e => set(`mv${i}_title` as keyof FormState, e.target.value as FormState[keyof FormState])}
                                            placeholder={`Ex: Dynamite`}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>MV {i} — URL YouTube</label>
                                        <input
                                            type="text"
                                            value={form[`mv${i}_url` as keyof FormState] as string}
                                            onChange={e => set(`mv${i}_url` as keyof FormState, e.target.value as FormState[keyof FormState])}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Visibilidade */}
                        <div className="border border-border rounded-xl p-4 bg-surface">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={form.isHidden}
                                        onChange={e => set('isHidden', e.target.checked)}
                                    />
                                    <div className="w-10 h-6 bg-border peer-checked:bg-red-600 rounded-full transition-colors" />
                                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">
                                        {form.isHidden ? 'Oculto do site público' : 'Visível no site público'}
                                    </p>
                                    <p className="text-xs text-muted">
                                        {form.isHidden
                                            ? 'Este grupo não aparece em listagens públicas'
                                            : 'Este grupo aparece normalmente no site'}
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:bg-purple-900 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                            <Link
                                href="/admin/groups"
                                className="px-5 py-2.5 bg-surface border border-border text-foreground hover:bg-surface-hover rounded-lg text-sm font-bold transition-colors"
                            >
                                Cancelar
                            </Link>
                        </div>
                    </form>
                )}
                {!loading && group && (
                    <ProfileChangeHistory entity="MusicalGroup" entityId={id} />
                )}
            </div>
        </AdminLayout>
    )
}
