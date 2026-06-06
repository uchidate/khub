'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageHeader } from '@/components/admin/PageHeader'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { Save, RefreshCw, User, Search, CheckCircle, XCircle, Download, ExternalLink, Sparkles, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { AdminEmptyState } from '@/components/admin'

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
    bloodType: string | null
    zodiacSign: string | null
    gender: string | null
    roles: string[]
    bio: string | null
    analiseEditorial: string | null
    curiosidades: string[]
    socialLinks: Record<string, string> | null
    videos: { title: string; url: string }[] | null
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
    const [form, setForm] = useState<Partial<Artist>>({})
    // Social links edit state: array of [key, value] pairs
    const [socialPairs, setSocialPairs] = useState<[string, string][]>([])
    // Videos edit state
    const [videos, setVideos] = useState<{ title: string; url: string }[]>([])

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
    const [spotifyQuery, setSpotifyQuery] = useState('')
    const [spotifyCandidates, setSpotifyCandidates] = useState<SpotifyArtistCandidate[]>([])
    const [spotifyLink, setSpotifyLink] = useState<SpotifyArtistLink | null>(null)
    const [spotifyLoading, setSpotifyLoading] = useState(false)
    const [spotifySavingId, setSpotifySavingId] = useState<string | null>(null)
    const [spotifyError, setSpotifyError] = useState('')
    const [spotifySyncing, setSpotifySyncing] = useState(false)
    const [spotifySyncResult, setSpotifySyncResult] = useState<string | null>(null)

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
                setVideos(Array.isArray(data.videos) ? data.videos : [])
            })
            .catch(() => toast.error('Erro ao carregar artista'))
            .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    useEffect(() => {
        fetch(`/api/admin/artists/${id}/spotify-link`)
            .then(r => r.json())
            .then(data => setSpotifyLink(data.link ?? null))
            .catch(() => null)
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
                bloodType: form.bloodType || '',
                zodiacSign: form.zodiacSign || '',
                gender: form.gender ? parseInt(form.gender as string) : null,
                roles: typeof form.roles === 'string'
                    ? (form.roles as string).split(',').map((s: string) => s.trim()).filter(Boolean)
                    : (form.roles ?? []),
                bio: form.bio || '',
                analiseEditorial: form.analiseEditorial || '',
                curiosidades: form.curiosidades ?? [],
                socialLinks: socialLinks ?? {},
                videos: videos.filter(v => v.url.trim() && v.title.trim()),
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

    const searchSpotify = async () => {
        const query = (spotifyQuery || form.nameRomanized || '').trim()
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
            const res = await fetch(`/api/admin/artists/${id}/spotify-link`, {
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
            const res = await fetch(`/api/admin/artists/${id}/spotify-link`, { method: 'DELETE' })
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
            const res = await fetch(`/api/admin/artists/${id}/spotify-sync`, { method: 'POST' })
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
        [form.nameRomanized, ...(form.stageNames ?? []), form.nameHangul]
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

    const inputCls = "w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent text-sm"
    const labelCls = "block text-xs font-bold text-muted uppercase tracking-widest mb-1.5"

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
            <span className="text-xs font-bold text-muted uppercase tracking-widest">{label}{req ? ' *' : ''}</span>
            <SourceBadge field={field} />
        </div>
    )

    return (
        <AdminLayout title={artist ? `Editar: ${artist.nameRomanized}` : 'Editar Artista'} hideTitle>
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
                            className="flex items-center gap-1.5 text-xs text-foreground border border-border hover:bg-surface-hover px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Ver no site
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                    )}
                </PageHeader>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 text-muted animate-spin" />
                    </div>
                )}

                {!loading && !artist && (
                    <AdminEmptyState title="Artista não encontrado." size="lg" />
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
                                    <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center">
                                        <User className="w-8 h-8 text-muted" />
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

                        {/* Altura + Tipo Sanguíneo + Signo */}
                        <div className="grid grid-cols-3 gap-4">
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
                                <label className={labelCls}>Tipo Sanguíneo</label>
                                <select
                                    value={form.bloodType ?? ''}
                                    onChange={e => setManual('bloodType', e.target.value)}
                                    className={inputCls}
                                >
                                    <option value="">Não informado</option>
                                    {['A', 'B', 'AB', 'O'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
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
                                <span className="text-xs font-bold text-muted uppercase tracking-widest">Biografia</span>
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
                                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface disabled:opacity-50 text-foreground rounded-lg text-xs font-medium transition-colors border border-border"
                                >
                                    {previewLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                    Buscar do TMDB
                                </button>
                            )}
                        </div>

                        {/* Análise Editorial */}
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-bold text-muted uppercase tracking-widest">Análise Editorial</span>
                                {form.analiseEditorial && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-accent/10 text-accent border-accent/30">
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
                            <p className="mt-1 text-[10px] text-muted">
                                Formato: <code className="text-muted">**Título da Seção**</code> seguido de nova linha e conteúdo
                            </p>
                        </div>

                        {/* Curiosidades */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-muted uppercase tracking-widest">
                                    Curiosidades ({(form.curiosidades ?? []).length})
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, curiosidades: [...(prev.curiosidades ?? []), ''] }))}
                                    className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/70 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Adicionar
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(form.curiosidades ?? []).length === 0 && (
                                    <p className="text-xs text-muted py-2">Nenhuma curiosidade. Prepare no Gemini ou adicione manualmente.</p>
                                )}
                                {(form.curiosidades ?? []).map((item, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <span className="text-[10px] text-muted font-mono mt-2.5 w-5 text-right flex-shrink-0">{i + 1}</span>
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
                                            className="mt-2 text-muted hover:text-red-400 transition-colors flex-shrink-0"
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
                                <span className="text-xs font-bold text-muted uppercase tracking-widest">
                                    Redes Sociais ({socialPairs.length})
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSocialPairs(prev => [...prev, ['', '']])}
                                    className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/70 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Adicionar
                                </button>
                            </div>
                            <div className="space-y-2">
                                {socialPairs.length === 0 && (
                                    <p className="text-xs text-muted py-2">Nenhum link social. Sincronize via Wikidata/MusicBrainz ou adicione manualmente.</p>
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
                                            className="w-36 px-2 py-2 bg-surface border border-border rounded-lg text-foreground text-xs focus:outline-none focus:border-accent"
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
                                            className="text-muted hover:text-red-400 transition-colors flex-shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Vídeos do YouTube */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-muted uppercase tracking-widest">
                                    Vídeos do YouTube ({videos.length})
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setVideos(prev => [...prev, { title: '', url: '' }])}
                                    className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/70 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Adicionar
                                </button>
                            </div>
                            <div className="space-y-2">
                                {videos.length === 0 && (
                                    <p className="text-xs text-muted py-2">Nenhum vídeo. URLs devem ser do formato <code className="text-muted">youtube.com/watch?v=ID</code></p>
                                )}
                                {videos.map((v, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <span className="text-[10px] text-muted font-mono mt-2.5 w-5 text-right flex-shrink-0">{i + 1}</span>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <input
                                                type="text"
                                                placeholder="Título (ex: IU — Celebrity MV)"
                                                value={v.title}
                                                onChange={e => setVideos(prev => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                                                className={inputCls + ' text-xs'}
                                            />
                                            <input
                                                type="url"
                                                placeholder="https://www.youtube.com/watch?v=ID"
                                                value={v.url}
                                                onChange={e => setVideos(prev => prev.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                                                className={`${inputCls} text-xs font-mono ${v.url && !v.url.includes('youtube.com/watch') && !v.url.includes('youtu.be') ? 'border-red-500/60 focus:border-red-400' : ''}`}
                                            />
                                            {v.url && !v.url.includes('youtube.com/watch') && !v.url.includes('youtu.be') && (
                                                <p className="text-[10px] text-red-400">URL deve ser do YouTube (youtube.com/watch?v=...)</p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setVideos(prev => prev.filter((_, j) => j !== i))}
                                            className="mt-2 text-muted hover:text-red-400 transition-colors flex-shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Catálogo musical */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-bold text-muted uppercase tracking-widest">
                                    Catálogo Musical
                                </span>
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
                                    placeholder={form.nameRomanized ? `Buscar por ${form.nameRomanized}` : 'Buscar artista no Spotify'}
                                    className={inputCls}
                                />
                                <button
                                    type="button"
                                    onClick={searchSpotify}
                                    disabled={spotifyLoading}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-sm disabled:opacity-50"
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
                                        <div key={candidate.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
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
                                                <div className="w-11 h-11 rounded bg-background flex items-center justify-center">
                                                    <User className="w-4 h-4 text-muted" />
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
                                                className="inline-flex items-center gap-1 px-2 py-2 rounded-lg border border-border text-xs text-muted hover:text-foreground hover:bg-background transition-colors"
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

                        {/* Conteudo editorial revisado */}
                        <div className="border border-accent/20 rounded-xl p-4 bg-accent/5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-accent" />
                                    <span className="text-sm font-semibold text-foreground">Conteudo Editorial</span>
                                    <span className="text-[10px] text-muted font-mono">Gemini + revisao</span>
                                </div>
                                <Link
                                    href={`/admin/artists/${id}/enrich`}
                                    className="text-[10px] text-muted hover:text-accent transition-colors"
                                >
                                    Abrir curadoria →
                                </Link>
                            </div>
                            <p className="text-xs text-muted mb-3">
                                A geracao automatica foi desativada. Copie o prompt, gere no Gemini e aplique somente o JSON revisado.
                            </p>
                            <Link
                                href={`/admin/artists/${id}/enrich`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-accent/20 text-accent border border-accent/30 hover:bg-accent/40 transition-colors"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Preparar no Gemini
                            </Link>
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
                                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface disabled:opacity-40 text-foreground rounded-lg text-xs font-bold transition-colors"
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
                            <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
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
                                        <div className="w-16 h-24 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                                            <User className="w-6 h-6 text-muted" />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-1.5 text-xs">
                                        <div>
                                            <span className="text-muted">Nome TMDB:</span>{' '}
                                            <span className="text-foreground font-bold">{tmdbPreview.name}</span>
                                        </div>
                                        {tmdbPreview.hangulName && (
                                            <div>
                                                <span className="text-muted">Hangul:</span>{' '}
                                                <span className="text-accent">{tmdbPreview.hangulName}</span>
                                            </div>
                                        )}
                                        {tmdbPreview.birthday && (
                                            <div>
                                                <span className="text-muted">Nascimento:</span>{' '}
                                                <span className="text-foreground">{tmdbPreview.birthday}{tmdbPreview.placeOfBirth ? ` — ${tmdbPreview.placeOfBirth}` : ''}</span>
                                            </div>
                                        )}
                                        {tmdbPreview.knownFor && (
                                            <div>
                                                <span className="text-muted">Conhecido por:</span>{' '}
                                                <span className="text-foreground">{tmdbPreview.knownFor}</span>
                                            </div>
                                        )}
                                        {tmdbPreview.biography && (
                                            <p className="text-muted line-clamp-2 mt-1">{tmdbPreview.biography}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
                                    <span className="text-[10px] text-muted self-center">Aplicar ao artista (só campos vazios):</span>
                                    {tmdbPreview.photoUrl && !form.primaryImageUrl && (
                                        <button type="button" onClick={() => applyFromTmdb('primaryImageUrl', tmdbPreview.photoUrl)}
                                            className="text-[10px] px-2 py-1 bg-accent/20 hover:bg-accent/40 text-accent rounded font-bold transition-colors">
                                            + Foto
                                        </button>
                                    )}
                                    {tmdbPreview.hangulName && !form.nameHangul && (
                                        <button type="button" onClick={() => applyFromTmdb('nameHangul', tmdbPreview.hangulName)}
                                            className="text-[10px] px-2 py-1 bg-accent/20 hover:bg-accent/40 text-accent rounded font-bold transition-colors">
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
                                            className="text-[10px] px-2 py-1 bg-accent/20 hover:bg-accent/40 text-accent rounded font-bold transition-colors">
                                            + Bio
                                        </button>
                                    )}
                                    {tmdbPreview.birthday && !form.birthDate && (
                                        <button type="button" onClick={() => applyFromTmdb('birthDate', tmdbPreview.birthday)}
                                            className="text-[10px] px-2 py-1 bg-accent/20 hover:bg-accent/40 text-accent rounded font-bold transition-colors">
                                            + Nascimento
                                        </button>
                                    )}
                                    {tmdbPreview.placeOfBirth && !form.placeOfBirth && (
                                        <button type="button" onClick={() => applyFromTmdb('placeOfBirth', tmdbPreview.placeOfBirth)}
                                            className="text-[10px] px-2 py-1 bg-accent/20 hover:bg-accent/40 text-accent rounded font-bold transition-colors">
                                            + Local
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Visibilidade */}
                        <div className="border border-border rounded-xl p-4 bg-surface">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={form.isHidden ?? false}
                                        onChange={e => set('isHidden' as keyof Artist, e.target.checked)}
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
                                    <div className="w-10 h-6 bg-border peer-checked:bg-amber-600 rounded-full transition-colors" />
                                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                        <p className="text-sm font-bold text-foreground">Flaggado como não-coreano</p>
                                    </div>
                                    <p className="text-xs text-muted mt-0.5">
                                        Exclui este artista da fila de curadoria e das filas de moderação
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
                                href="/admin/artists"
                                className="px-5 py-2.5 bg-surface border border-border text-foreground hover:bg-surface-hover rounded-lg text-sm font-bold transition-colors"
                            >
                                Cancelar
                            </Link>
                            <Link
                                href={`/admin/artists/${id}/enrich`}
                                className="ml-auto px-5 py-2.5 bg-surface border border-accent/30 text-accent hover:bg-accent/10 rounded-lg text-sm font-bold transition-colors"
                            >
                                Curar no Gemini →
                            </Link>
                            <Link
                                href={`/admin/artists/${id}/discography`}
                                className="px-5 py-2.5 bg-surface border border-border text-foreground hover:bg-surface-hover rounded-lg text-sm font-bold transition-colors"
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
