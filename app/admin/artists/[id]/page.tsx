'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageHeader } from '@/components/admin/PageHeader'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { Save, RefreshCw, User, Search, CheckCircle, XCircle, Download, ExternalLink, Sparkles, Plus, Trash2, AlertTriangle } from 'lucide-react'

type FieldSource = { source: 'manual' | 'tmdb' | 'wikidata' | 'system'; at: string; by?: string }
type FieldSources = Record<string, FieldSource>

interface Artist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    birthName: string | null
    stageNames: string[]
    primaryImageUrl: string | null
    birthDate: string | null
    placeOfBirth: string | null
    height: string | null
    zodiacSign: string | null
    gender: string | null
    roles: string[]
    bio: string | null
    analiseEditorial: string | null
    curiosidades: string[]
    socialLinks: Record<string, string> | null
    tmdbId: string | null
    mbid: string | null
    isHidden: boolean
    flaggedAsNonKorean: boolean
    fieldSources: FieldSources | null
}

interface TMDBPreview {
    tmdbId: string
    name: string
    hangulName: string | null
    biography: string | null
    biographyPt: string | null
    biographyEn: string | null
    birthday: string | null
    placeOfBirth: string | null
    photoUrl: string | null
    gender: number
    knownFor: string | null
    popularity: number
    alsoKnownAs: string[]
}

const ZODIAC_SIGNS = [
    'Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
    'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes',
]

const KNOWN_SOCIAL_KEYS = [
    { key: 'instagram', label: 'Instagram' },
    { key: 'twitter', label: 'Twitter/X' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'tiktok', label: 'TikTok' },
    { key: 'weibo', label: 'Weibo' },
    { key: 'vlive', label: 'V Live' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'website', label: 'Website' },
]

export default function EditArtistPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const toast = useAdminToast()
    const returnToRef = useRef<string | null>(null)
    const [artist, setArtist] = useState<Artist | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [generatingEditorial, setGeneratingEditorial] = useState(false)
    const [form, setForm] = useState<Partial<Artist>>({})
    // Social links edit state: array of [key, value] pairs
    const [socialPairs, setSocialPairs] = useState<[string, string][]>([])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const returnTo = params.get('returnTo')
        if (returnTo) returnToRef.current = returnTo
    }, [])

    // Preview TMDB
    const [tmdbPreview, setTmdbPreview] = useState<TMDBPreview | null>(null)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewError, setPreviewError] = useState('')
    const [bioSource, setBioSource] = useState<'tmdb_pt' | 'tmdb_en' | null>(null)
    const [tmdbAppliedFields, setTmdbAppliedFields] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetch(`/api/admin/artists?id=${id}`)
            .then(r => r.json())
            .then(data => {
                setArtist(data)
                setForm({
                    ...data,
                    birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
                    gender: data.gender != null ? String(data.gender) : '',
                })
                const links = (data.socialLinks as Record<string, string> | null) ?? {}
                setSocialPairs(Object.entries(links))
            })
            .catch(() => toast.error('Erro ao carregar artista'))
            .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    const set = (key: keyof Artist, value: unknown) => {
        setForm(prev => ({ ...prev, [key]: value }))
        if (key === 'tmdbId') {
            setTmdbPreview(null)
            setPreviewError('')
        }
    }
    const setManual = (key: keyof Artist, value: unknown) => {
        set(key, value)
        setTmdbAppliedFields(prev => { const s = new Set(Array.from(prev)); s.delete(key as string); return s })
    }
    const applyFromTmdb = (key: keyof Artist, value: unknown) => {
        set(key, value)
        setTmdbAppliedFields(prev => new Set(Array.from(prev).concat(key as string)))
    }

    const fetchTMDBPreview = useCallback(async (): Promise<TMDBPreview | null> => {
        if (tmdbPreview) return tmdbPreview
        const tmdbId = form.tmdbId?.trim()
        if (!tmdbId || !/^\d+$/.test(tmdbId)) {
            setPreviewError('TMDB ID deve ser numérico')
            return null
        }
        setPreviewLoading(true)
        setPreviewError('')
        try {
            const res = await fetch(`/api/admin/artists/tmdb-preview?tmdbId=${tmdbId}`)
            const data = await res.json()
            if (!res.ok) {
                setPreviewError(data.error || 'Erro ao buscar no TMDB')
                return null
            }
            setTmdbPreview(data)
            return data as TMDBPreview
        } catch {
            setPreviewError('Erro de rede')
            return null
        } finally {
            setPreviewLoading(false)
        }
    }, [form.tmdbId, tmdbPreview])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            // Build socialLinks from pairs
            const socialLinks = socialPairs.length > 0
                ? Object.fromEntries(socialPairs.filter(([k, v]) => k.trim() && v.trim()))
                : null

            const body: Record<string, unknown> = {
                nameRomanized: form.nameRomanized,
                nameHangul: form.nameHangul || '',
                birthName: form.birthName || '',
                stageNames: typeof form.stageNames === 'string'
                    ? (form.stageNames as string).split(',').map((s: string) => s.trim()).filter(Boolean)
                    : (form.stageNames ?? []),
                primaryImageUrl: form.primaryImageUrl || '',
                birthDate: form.birthDate || '',
                placeOfBirth: form.placeOfBirth || '',
                height: form.height || '',
                zodiacSign: form.zodiacSign || '',
                gender: form.gender ? parseInt(form.gender as string) : null,
                roles: typeof form.roles === 'string'
                    ? (form.roles as string).split(',').map((s: string) => s.trim()).filter(Boolean)
                    : (form.roles ?? []),
                bio: form.bio || '',
                analiseEditorial: form.analiseEditorial || '',
                curiosidades: form.curiosidades ?? [],
                socialLinks: socialLinks ?? {},
                tmdbId: form.tmdbId || '',
                mbid: form.mbid || '',
                isHidden: form.isHidden ?? false,
                flaggedAsNonKorean: form.flaggedAsNonKorean ?? false,
                tmdbSyncedFields: Array.from(tmdbAppliedFields),
            }
            const res = await fetch(`/api/admin/artists?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok) {
                const err = await res.json()
                const detail = err.details?.[0]
                    ? ` (campo: ${err.details[0].path?.join('.') ?? '?'} — ${err.details[0].message})`
                    : ''
                toast.error((err.error || 'Erro ao salvar') + detail)
                return
            }
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

    const handleGenerateEditorial = async (fields: string[]) => {
        if (!id) return
        setGeneratingEditorial(true)
        try {
            const res = await fetch(`/api/admin/artists/${id}/generate-editorial`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ generate: fields }),
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.error ?? 'Erro ao gerar conteúdo editorial'); return }
            if (data.generated.bio) setForm(prev => ({ ...prev, bio: data.generated.bio }))
            if (data.generated.editorial) setForm(prev => ({ ...prev, analiseEditorial: data.generated.editorial }))
            if (data.generated.curiosidades) setForm(prev => ({ ...prev, curiosidades: data.generated.curiosidades }))
            toast.success(`Conteúdo gerado! Custo: $${data.totalCostUsd.toFixed(4)}`)
            if (Object.keys(data.errors ?? {}).length > 0) {
                toast.error('Alguns campos falharam: ' + Object.values(data.errors).join('; '))
            }
        } catch {
            toast.error('Erro ao gerar conteúdo editorial')
        } finally {
            setGeneratingEditorial(false)
        }
    }

    const inputCls = "w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 text-sm"
    const labelCls = "block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5"

    const sources = (form.fieldSources ?? {}) as FieldSources
    const SourceBadge = ({ field }: { field: string }) => {
        const src = sources[field]
        if (!src) return null
        if (src.source === 'manual') {
            const date = new Date(src.at).toLocaleDateString('pt-BR')
            return (
                <button type="button"
                    onClick={() => setTmdbAppliedFields(prev => new Set(Array.from(prev).concat(field)))}
                    title={`Editado manualmente em ${date} — clique para liberar sync automático do TMDB`}
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                        tmdbAppliedFields.has(field)
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                    }`}>
                    {tmdbAppliedFields.has(field) ? '🔓 liberado' : '🔒 manual'}
                </button>
            )
        }
        if (src.source === 'tmdb') {
            return (
                <span title={`Sincronizado do TMDB em ${new Date(src.at).toLocaleDateString('pt-BR')}`}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/30">
                    TMDB
                </span>
            )
        }
        return null
    }
    const FieldLabel = ({ label, field, required: req }: { label: string; field: string; required?: boolean }) => (
        <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{label}{req ? ' *' : ''}</span>
            <SourceBadge field={field} />
        </div>
    )

    return (
        <AdminLayout title={artist ? `Editar: ${artist.nameRomanized}` : 'Editar Artista'}>
            <div className="max-w-3xl mx-auto px-4 py-8">
                <PageHeader
                    title={artist ? artist.nameRomanized : 'Editar Artista'}
                    backHref="/admin/artists"
                    backLabel="Artistas"
                >
                    {artist && (
                        <Link
                            href={`/artists/${id}`}
                            target="_blank"
                            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-purple-400 border border-zinc-700 hover:border-purple-500/50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Ver no site
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                    )}
                </PageHeader>

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
                        {/* Foto + nomes principais */}
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
                                    <FieldLabel label="Nome em Hangul" field="nameHangul" />
                                    <input
                                        type="text"
                                        value={form.nameHangul ?? ''}
                                        onChange={e => setManual('nameHangul', e.target.value)}
                                        placeholder="홍길동"
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Nome real + Nomes artísticos + Gênero */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Nome Real (Birth Name)</label>
                                <input
                                    type="text"
                                    value={form.birthName ?? ''}
                                    onChange={e => setManual('birthName', e.target.value)}
                                    placeholder="Kim Ji-eun"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <FieldLabel label="Gênero" field="gender" />
                                <select
                                    value={form.gender ?? ''}
                                    onChange={e => setManual('gender', e.target.value)}
                                    className={inputCls}
                                >
                                    <option value="">Não informado</option>
                                    <option value="2">Masculino</option>
                                    <option value="1">Feminino</option>
                                </select>
                            </div>
                        </div>

                        {/* Nomes artísticos */}
                        <div>
                            <FieldLabel label="Nomes Artísticos (separados por vírgula)" field="stageNames" />
                            <input
                                type="text"
                                value={(form.stageNames ?? []).join(', ')}
                                onChange={e => setManual('stageNames', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                placeholder="IU, Lee Ji-eun"
                                className={inputCls}
                            />
                        </div>

                        {/* Nascimento + local */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FieldLabel label="Data de Nascimento" field="birthDate" />
                                <input
                                    type="date"
                                    value={form.birthDate ?? ''}
                                    onChange={e => setManual('birthDate', e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <FieldLabel label="Local de Nascimento" field="placeOfBirth" />
                                <input
                                    type="text"
                                    value={form.placeOfBirth ?? ''}
                                    onChange={e => setManual('placeOfBirth', e.target.value)}
                                    placeholder="Seul, Coreia do Sul"
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Altura + Signo */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Altura</label>
                                <input
                                    type="text"
                                    value={form.height ?? ''}
                                    onChange={e => setManual('height', e.target.value)}
                                    placeholder="163 cm"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Signo</label>
                                <select
                                    value={form.zodiacSign ?? ''}
                                    onChange={e => setManual('zodiacSign', e.target.value)}
                                    className={inputCls}
                                >
                                    <option value="">Não informado</option>
                                    {ZODIAC_SIGNS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
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
                            <FieldLabel label="URL da Foto" field="primaryImageUrl" />
                            <input
                                type="text"
                                value={form.primaryImageUrl ?? ''}
                                onChange={e => setManual('primaryImageUrl', e.target.value)}
                                placeholder="https://..."
                                className={inputCls}
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Biografia</span>
                                <SourceBadge field="bio" />
                                {bioSource && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                        bioSource === 'tmdb_pt'
                                            ? 'bg-green-500/15 text-green-400 border-green-500/30'
                                            : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                    }`}>
                                        {bioSource === 'tmdb_pt' ? 'TMDB · pt-BR' : 'TMDB · en'}
                                    </span>
                                )}
                            </div>
                            <textarea
                                value={form.bio ?? ''}
                                onChange={e => setManual('bio', e.target.value)}
                                placeholder="Breve biografia do artista..."
                                rows={4}
                                className={inputCls + ' resize-none'}
                            />
                            {form.tmdbId && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const data = await fetchTMDBPreview()
                                        if (data?.biographyPt) {
                                            applyFromTmdb('bio', data.biographyPt)
                                            setBioSource('tmdb_pt')
                                        } else if (data?.biographyEn) {
                                            applyFromTmdb('bio', data.biographyEn)
                                            setBioSource('tmdb_en')
                                        }
                                    }}
                                    disabled={previewLoading}
                                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded-lg text-xs font-medium transition-colors border border-white/10"
                                >
                                    {previewLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                    Buscar do TMDB
                                </button>
                            )}
                        </div>

                        {/* Análise Editorial */}
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Análise Editorial</span>
                                {form.analiseEditorial && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/30">
                                        {form.analiseEditorial.length} chars
                                    </span>
                                )}
                            </div>
                            <textarea
                                value={form.analiseEditorial ?? ''}
                                onChange={e => setManual('analiseEditorial', e.target.value)}
                                placeholder={'**Perfil Artístico**\nTexto sobre a trajetória...\n\n**Estilo Musical**\nTexto sobre o estilo...'}
                                rows={8}
                                className={inputCls + ' resize-y font-mono text-xs'}
                            />
                            <p className="mt-1 text-[10px] text-zinc-600">
                                Formato: <code className="text-zinc-500">**Título da Seção**</code> seguido de nova linha e conteúdo
                            </p>
                        </div>

                        {/* Curiosidades */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                    Curiosidades ({(form.curiosidades ?? []).length})
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, curiosidades: [...(prev.curiosidades ?? []), ''] }))}
                                    className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Adicionar
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(form.curiosidades ?? []).length === 0 && (
                                    <p className="text-xs text-zinc-600 py-2">Nenhuma curiosidade. Gere via IA ou adicione manualmente.</p>
                                )}
                                {(form.curiosidades ?? []).map((item, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <span className="text-[10px] text-zinc-600 font-mono mt-2.5 w-5 text-right flex-shrink-0">{i + 1}</span>
                                        <textarea
                                            value={item}
                                            onChange={e => {
                                                const next = [...(form.curiosidades ?? [])]
                                                next[i] = e.target.value
                                                setForm(prev => ({ ...prev, curiosidades: next }))
                                            }}
                                            rows={2}
                                            className={inputCls + ' resize-none text-xs flex-1'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const next = (form.curiosidades ?? []).filter((_, j) => j !== i)
                                                setForm(prev => ({ ...prev, curiosidades: next }))
                                            }}
                                            className="mt-2 text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Redes Sociais */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                    Redes Sociais ({socialPairs.length})
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSocialPairs(prev => [...prev, ['', '']])}
                                    className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Adicionar
                                </button>
                            </div>
                            <div className="space-y-2">
                                {socialPairs.length === 0 && (
                                    <p className="text-xs text-zinc-600 py-2">Nenhum link social. Sincronize via Wikidata/MusicBrainz ou adicione manualmente.</p>
                                )}
                                {socialPairs.map(([key, value], i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <select
                                            value={key}
                                            onChange={e => {
                                                const next: [string, string][] = [...socialPairs]
                                                next[i] = [e.target.value, value]
                                                setSocialPairs(next)
                                            }}
                                            className="w-36 px-2 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500/50"
                                        >
                                            <option value="">Plataforma...</option>
                                            {KNOWN_SOCIAL_KEYS.map(({ key: k, label }) => (
                                                <option key={k} value={k}>{label}</option>
                                            ))}
                                            {!KNOWN_SOCIAL_KEYS.some(x => x.key === key) && key && (
                                                <option value={key}>{key}</option>
                                            )}
                                        </select>
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={e => {
                                                const next: [string, string][] = [...socialPairs]
                                                next[i] = [key, e.target.value]
                                                setSocialPairs(next)
                                            }}
                                            placeholder="https://..."
                                            className={inputCls + ' flex-1'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setSocialPairs(prev => prev.filter((_, j) => j !== i))}
                                            className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Conteúdo Editorial (IA) */}
                        <div className="border border-purple-500/20 rounded-xl p-4 bg-purple-900/5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-semibold text-white">Conteúdo Editorial</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">DeepSeek-V3</span>
                                </div>
                                <Link
                                    href="/admin/enrichment"
                                    className="text-[10px] text-zinc-600 hover:text-purple-400 transition-colors"
                                >
                                    Ver lote →
                                </Link>
                            </div>
                            <p className="text-xs text-zinc-500 mb-3">
                                Gera conteúdo autoral em PT-BR (bio 400+ palavras, análise editorial, curiosidades). Salve antes de gerar.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleGenerateEditorial(['bio'])}
                                    disabled={generatingEditorial}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-purple-300 border border-purple-500/30 hover:border-purple-500/60 disabled:opacity-40 transition-colors"
                                >
                                    {generatingEditorial ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    Bio (~$0.002)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleGenerateEditorial(['editorial', 'curiosidades'])}
                                    disabled={generatingEditorial}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-purple-300 border border-purple-500/30 hover:border-purple-500/60 disabled:opacity-40 transition-colors"
                                >
                                    {generatingEditorial ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    Análise + Curiosidades (~$0.003)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleGenerateEditorial(['bio', 'editorial', 'curiosidades'])}
                                    disabled={generatingEditorial}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/40 disabled:opacity-40 transition-colors"
                                >
                                    {generatingEditorial ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    Tudo (~$0.005)
                                </button>
                            </div>
                        </div>

                        {/* TMDB + MBID */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>TMDB ID</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.tmdbId ?? ''}
                                        onChange={e => set('tmdbId', e.target.value)}
                                        placeholder="12345"
                                        className={inputCls}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fetchTMDBPreview()}
                                        disabled={previewLoading || !form.tmdbId}
                                        title="Verificar no TMDB"
                                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        {previewLoading
                                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            : <Search className="w-3.5 h-3.5" />
                                        }
                                        Verificar
                                    </button>
                                </div>
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

                        {/* Preview TMDB */}
                        {previewError && (
                            <div className="flex items-center gap-2 text-sm text-red-400">
                                <XCircle className="w-4 h-4 flex-shrink-0" />
                                {previewError}
                            </div>
                        )}
                        {tmdbPreview && (
                            <div className="bg-zinc-800/60 border border-white/10 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-green-400 mb-1">
                                    <CheckCircle className="w-4 h-4" />
                                    TMDB verificado — confirme se é a pessoa correta
                                </div>
                                <div className="flex gap-4 items-start">
                                    {tmdbPreview.photoUrl ? (
                                        <Image
                                            src={tmdbPreview.photoUrl}
                                            alt={tmdbPreview.name}
                                            width={64}
                                            height={96}
                                            className="rounded-lg object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-16 h-24 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                            <User className="w-6 h-6 text-zinc-500" />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-1.5 text-xs">
                                        <div>
                                            <span className="text-zinc-500">Nome TMDB:</span>{' '}
                                            <span className="text-white font-bold">{tmdbPreview.name}</span>
                                        </div>
                                        {tmdbPreview.hangulName && (
                                            <div>
                                                <span className="text-zinc-500">Hangul:</span>{' '}
                                                <span className="text-purple-300">{tmdbPreview.hangulName}</span>
                                            </div>
                                        )}
                                        {tmdbPreview.birthday && (
                                            <div>
                                                <span className="text-zinc-500">Nascimento:</span>{' '}
                                                <span className="text-zinc-300">{tmdbPreview.birthday}{tmdbPreview.placeOfBirth ? ` — ${tmdbPreview.placeOfBirth}` : ''}</span>
                                            </div>
                                        )}
                                        {tmdbPreview.knownFor && (
                                            <div>
                                                <span className="text-zinc-500">Conhecido por:</span>{' '}
                                                <span className="text-zinc-300">{tmdbPreview.knownFor}</span>
                                            </div>
                                        )}
                                        {tmdbPreview.biography && (
                                            <p className="text-zinc-400 line-clamp-2 mt-1">{tmdbPreview.biography}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
                                    <span className="text-[10px] text-zinc-500 self-center">Aplicar ao artista (só campos vazios):</span>
                                    {tmdbPreview.photoUrl && !form.primaryImageUrl && (
                                        <button type="button" onClick={() => applyFromTmdb('primaryImageUrl', tmdbPreview.photoUrl)}
                                            className="text-[10px] px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded font-bold transition-colors">
                                            + Foto
                                        </button>
                                    )}
                                    {tmdbPreview.hangulName && !form.nameHangul && (
                                        <button type="button" onClick={() => applyFromTmdb('nameHangul', tmdbPreview.hangulName)}
                                            className="text-[10px] px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded font-bold transition-colors">
                                            + Hangul
                                        </button>
                                    )}
                                    {(tmdbPreview.biographyPt || tmdbPreview.biographyEn) && !form.bio && (
                                        <button type="button" onClick={() => {
                                            if (tmdbPreview.biographyPt) {
                                                applyFromTmdb('bio', tmdbPreview.biographyPt)
                                                setBioSource('tmdb_pt')
                                            } else if (tmdbPreview.biographyEn) {
                                                applyFromTmdb('bio', tmdbPreview.biographyEn)
                                                setBioSource('tmdb_en')
                                            }
                                        }}
                                            className="text-[10px] px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded font-bold transition-colors">
                                            + Bio
                                        </button>
                                    )}
                                    {tmdbPreview.birthday && !form.birthDate && (
                                        <button type="button" onClick={() => applyFromTmdb('birthDate', tmdbPreview.birthday)}
                                            className="text-[10px] px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded font-bold transition-colors">
                                            + Nascimento
                                        </button>
                                    )}
                                    {tmdbPreview.placeOfBirth && !form.placeOfBirth && (
                                        <button type="button" onClick={() => applyFromTmdb('placeOfBirth', tmdbPreview.placeOfBirth)}
                                            className="text-[10px] px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded font-bold transition-colors">
                                            + Local
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Visibilidade */}
                        <div className="border border-white/10 rounded-xl p-4 bg-zinc-900/50">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={form.isHidden ?? false}
                                        onChange={e => set('isHidden' as keyof Artist, e.target.checked)}
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
                                            ? 'Este artista não aparece em listagens públicas'
                                            : 'Este artista aparece normalmente no site'}
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Moderação */}
                        <div className="border border-amber-500/20 rounded-xl p-4 bg-amber-900/5">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={form.flaggedAsNonKorean ?? false}
                                        onChange={e => set('flaggedAsNonKorean' as keyof Artist, e.target.checked)}
                                    />
                                    <div className="w-10 h-6 bg-zinc-600 peer-checked:bg-amber-600 rounded-full transition-colors" />
                                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                        <p className="text-sm font-bold text-zinc-200">Flaggado como não-coreano</p>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        Exclui este artista de enrichment automático e filas de moderação
                                    </p>
                                </div>
                            </label>
                        </div>

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
