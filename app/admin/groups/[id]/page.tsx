'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ArrowLeft, ExternalLink, Save, RefreshCw, Users, Trash2 } from 'lucide-react'

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

const SOCIAL_PLATFORMS = ['website', 'instagram', 'youtube', 'twitter', 'tiktok', 'spotify', 'weverse', 'vlive'] as const
const SOCIAL_LABELS: Record<typeof SOCIAL_PLATFORMS[number], string> = {
    website: '🌐 Site Oficial',
    instagram: '📸 Instagram',
    youtube: '▶️ YouTube',
    twitter: '🐦 Twitter / X',
    tiktok: '🎵 TikTok',
    spotify: '🎧 Spotify',
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
    sl_spotify: string
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
    const returnToRef = useRef<string | null>(null)
    const [group, setGroup] = useState<MusicalGroup | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState<FormState | null>(null)
    const [agencies, setAgencies] = useState<Agency[]>([])

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
            .catch(() => setError('Erro ao carregar grupo'))
            .finally(() => setLoading(false))
    }, [id])

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(prev => prev ? { ...prev, [key]: value } : prev)
    }

    const handleDelete = async () => {
        setDeleting(true)
        setError('')
        try {
            const res = await fetch('/api/admin/groups', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [id] }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao excluir')
            }
            router.push('/admin/groups')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao excluir')
            setConfirmDelete(false)
        } finally {
            setDeleting(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form) return
        setSaving(true)
        setError('')
        setSuccess('')
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

            const res = await fetch(`/api/admin/groups?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao salvar')
            }
            setSuccess('Salvo com sucesso!')
            if (returnToRef.current) {
                setTimeout(() => router.push(returnToRef.current!), 800)
            } else {
                setTimeout(() => setSuccess(''), 3000)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    const inputCls = "w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 text-sm"
    const labelCls = "block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5"

    return (
        <AdminLayout title={group ? `Editar: ${group.name}` : 'Editar Grupo'}>
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Header */}
                {error && (
                    <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                        <span className="flex-shrink-0">⚠</span>
                        <span>{error}</span>
                    </div>
                )}
                <div className="flex items-center gap-3 mb-8 flex-wrap">
                    <button
                        onClick={() => returnToRef.current ? router.push(returnToRef.current) : router.back()}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>
                    <div className="ml-auto flex items-center gap-2">
                        {group && (
                            <Link
                                href={`/groups/${id}`}
                                target="_blank"
                                className="flex items-center gap-1.5 text-zinc-500 hover:text-purple-400 transition-colors text-sm"
                            >
                                Ver no site
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        )}
                        {group && !confirmDelete && (
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-red-950 border border-zinc-700 hover:border-red-800 text-zinc-400 hover:text-red-400 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Excluir
                            </button>
                        )}
                        {group && confirmDelete && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-red-400 font-medium">Confirmar?</span>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 disabled:bg-red-900 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                    {deleting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    {deleting ? 'Excluindo...' : 'Sim, excluir'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmDelete(false)}
                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-colors"
                                >
                                    Não
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {!loading && !group && (
                    <div className="text-center py-20 text-zinc-500">Grupo não encontrado.</div>
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
                                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
                                        <Users className="w-8 h-8 text-zinc-600" />
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
                        <div className="border border-white/10 rounded-xl p-4 bg-zinc-900/50 space-y-3">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Redes Sociais</h3>
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

                        {/* MVs */}
                        <div className="border border-white/10 rounded-xl p-4 bg-zinc-900/50 space-y-4">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">🎬 MVs Principais</h3>
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
                        <div className="border border-white/10 rounded-xl p-4 bg-zinc-900/50">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={form.isHidden}
                                        onChange={e => set('isHidden', e.target.checked)}
                                    />
                                    <div className="w-10 h-6 bg-zinc-600 peer-checked:bg-red-600 rounded-full transition-colors" />
                                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-200">
                                        {form.isHidden ? 'Oculto do site público' : 'Visível no site público'}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {form.isHidden
                                            ? 'Este grupo não aparece em listagens públicas'
                                            : 'Este grupo aparece normalmente no site'}
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Feedback */}
                        {success && <p className="text-sm text-green-400 font-medium">{success}</p>}

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                            <Link
                                href="/admin/groups"
                                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-bold transition-colors"
                            >
                                Cancelar
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </AdminLayout>
    )
}
