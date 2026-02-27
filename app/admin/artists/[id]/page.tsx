'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ArrowLeft, ExternalLink, Save, RefreshCw, User } from 'lucide-react'

interface Artist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    stageNames: string[]
    primaryImageUrl: string | null
    birthDate: string | null
    placeOfBirth: string | null
    gender: string | null
    roles: string[]
    bio: string | null
    tmdbId: string | null
    mbid: string | null
}

export default function EditArtistPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [artist, setArtist] = useState<Artist | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState<Partial<Artist>>({})

    useEffect(() => {
        fetch(`/api/admin/artists?id=${id}`)
            .then(r => r.json())
            .then(data => {
                setArtist(data)
                setForm({
                    ...data,
                    birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
                })
            })
            .catch(() => setError('Erro ao carregar artista'))
            .finally(() => setLoading(false))
    }, [id])

    const set = (key: keyof Artist, value: unknown) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        setSuccess('')
        try {
            const body: Record<string, unknown> = {
                nameRomanized: form.nameRomanized,
                nameHangul: form.nameHangul || '',
                stageNames: typeof form.stageNames === 'string'
                    ? (form.stageNames as string).split(',').map((s: string) => s.trim()).filter(Boolean)
                    : (form.stageNames ?? []),
                primaryImageUrl: form.primaryImageUrl || '',
                birthDate: form.birthDate || '',
                placeOfBirth: form.placeOfBirth || '',
                gender: form.gender || '',
                roles: typeof form.roles === 'string'
                    ? (form.roles as string).split(',').map((s: string) => s.trim()).filter(Boolean)
                    : (form.roles ?? []),
                bio: form.bio || '',
                tmdbId: form.tmdbId || '',
                mbid: form.mbid || '',
            }
            const res = await fetch(`/api/admin/artists?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao salvar')
            }
            setSuccess('Salvo com sucesso!')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    const inputCls = "w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 text-sm"
    const labelCls = "block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5"

    return (
        <AdminLayout title={artist ? `Editar: ${artist.nameRomanized}` : 'Editar Artista'}>
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>
                    {artist && (
                        <Link
                            href={`/artists/${id}`}
                            target="_blank"
                            className="flex items-center gap-1.5 text-zinc-500 hover:text-purple-400 transition-colors text-sm ml-auto"
                        >
                            Ver no site
                            <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    )}
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {!loading && !artist && (
                    <div className="text-center py-20 text-zinc-500">Artista não encontrado.</div>
                )}

                {artist && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Foto + nomes */}
                        <div className="flex gap-5 items-start">
                            <div className="w-24 flex-shrink-0">
                                {form.primaryImageUrl ? (
                                    <Image
                                        src={form.primaryImageUrl}
                                        alt={form.nameRomanized ?? ''}
                                        width={96}
                                        height={96}
                                        className="rounded-full object-cover w-24 h-24"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
                                        <User className="w-8 h-8 text-zinc-600" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className={labelCls}>Nome Romanizado *</label>
                                    <input
                                        type="text"
                                        value={form.nameRomanized ?? ''}
                                        onChange={e => set('nameRomanized', e.target.value)}
                                        className={inputCls}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Nome em Hangul</label>
                                    <input
                                        type="text"
                                        value={form.nameHangul ?? ''}
                                        onChange={e => set('nameHangul', e.target.value)}
                                        placeholder="홍길동"
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Nomes artísticos + gênero */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Nomes Artísticos (separados por vírgula)</label>
                                <input
                                    type="text"
                                    value={(form.stageNames ?? []).join(', ')}
                                    onChange={e => set('stageNames', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    placeholder="IU, Lee Ji-eun"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Gênero</label>
                                <select
                                    value={form.gender ?? ''}
                                    onChange={e => set('gender', e.target.value || null)}
                                    className={inputCls}
                                >
                                    <option value="">Não informado</option>
                                    <option value="MALE">Masculino</option>
                                    <option value="FEMALE">Feminino</option>
                                </select>
                            </div>
                        </div>

                        {/* Nascimento + local */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Data de Nascimento</label>
                                <input
                                    type="date"
                                    value={form.birthDate ?? ''}
                                    onChange={e => set('birthDate', e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Local de Nascimento</label>
                                <input
                                    type="text"
                                    value={form.placeOfBirth ?? ''}
                                    onChange={e => set('placeOfBirth', e.target.value)}
                                    placeholder="Seul, Coreia do Sul"
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Roles */}
                        <div>
                            <label className={labelCls}>Funções (separadas por vírgula)</label>
                            <input
                                type="text"
                                value={(form.roles ?? []).join(', ')}
                                onChange={e => set('roles', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                placeholder="IDOL, ACTOR, SINGER"
                                className={inputCls}
                            />
                        </div>

                        {/* Foto URL */}
                        <div>
                            <label className={labelCls}>URL da Foto</label>
                            <input
                                type="text"
                                value={form.primaryImageUrl ?? ''}
                                onChange={e => set('primaryImageUrl', e.target.value)}
                                placeholder="https://..."
                                className={inputCls}
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className={labelCls}>Biografia</label>
                            <textarea
                                value={form.bio ?? ''}
                                onChange={e => set('bio', e.target.value)}
                                placeholder="Breve biografia do artista..."
                                rows={4}
                                className={inputCls + ' resize-none'}
                            />
                        </div>

                        {/* TMDB + MBID */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>TMDB ID</label>
                                <input
                                    type="text"
                                    value={form.tmdbId ?? ''}
                                    onChange={e => set('tmdbId', e.target.value)}
                                    placeholder="12345"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>MusicBrainz ID</label>
                                <input
                                    type="text"
                                    value={form.mbid ?? ''}
                                    onChange={e => set('mbid', e.target.value)}
                                    placeholder="uuid"
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Feedback */}
                        {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
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
                                href="/admin/artists"
                                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-bold transition-colors"
                            >
                                Cancelar
                            </Link>
                            <Link
                                href={`/admin/artists/${id}/discography`}
                                className="ml-auto px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-bold transition-colors"
                            >
                                Discografia →
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </AdminLayout>
    )
}
