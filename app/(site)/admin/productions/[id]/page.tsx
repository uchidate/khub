'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageHeader } from '@/components/admin/PageHeader'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { ExternalLink, Save, RefreshCw, Film, Download, Wand2, Check, Sparkles, ShieldAlert, RotateCcw, Loader2 } from 'lucide-react'
import { AdminEmptyState } from '@/components/admin'
import { TakedownModal } from '@/components/admin/TakedownModal'
import { RestoreModal } from '@/components/admin/RestoreModal'
import { adminApi } from '@/lib/admin-api'

interface TakedownRecord {
    id: string
    reason: string
    noticeReference: string | null
    noticeDate: string | null
    hiddenAt: string
    hiddenBy: { id: string; name: string | null; email: string }
}

interface Production {
    id: string
    titlePt: string
    titleKr: string | null
    type: string
    year: number | null
    releaseDate: string | null
    tagline: string | null
    synopsis: string | null
    synopsisSource: 'tmdb_pt' | 'tmdb_en' | 'ai' | 'manual' | null
    imageUrl: string | null
    backdropUrl: string | null
    galleryUrls: string[]
    trailerUrl: string | null
    streamingPlatforms: string[]
    sourceUrls: string[]
    tags: string[]
    ageRating: string | null
    tmdbId: string | null
    tmdbType: string | null
    runtime: number | null
    episodeCount: number | null
    seasonCount: number | null
    episodeRuntime: number | null
    voteAverage: number | null
    productionStatus: string | null
    network: string | null
    editorialReview: string | null
    editorialRating: number | null
    whyWatch: string | null
    isHidden: boolean
    isTakenDown: boolean
    needsCuration: boolean
    flaggedAsNonKorean: boolean
    isAdultContent: boolean | null
    adultContentType: string | null
    categoryId: string | null
}

interface TmdbPreview {
    titlePt: string | null
    titleEn: string | null
    synopsisPt: string | null
    synopsisEn: string | null
    taglinePt: string | null
    taglineEn: string | null
    imageUrl: string | null
    backdropUrl: string | null
    year: number | null
    voteAverage: number | null
    runtime: number | null
    episodeCount: number | null
    seasonCount: number | null
    episodeRuntime: number | null
    network: string | null
    productionStatus: string | null
    trailerUrl: string | null
}

const SYNOPSIS_SOURCE_LABELS: Record<string, { label: string; cls: string }> = {
    tmdb_pt: { label: 'TMDB · pt-BR', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    tmdb_en: { label: 'TMDB · en', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    ai:      { label: 'IA', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    manual:  { label: 'Manual', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
}

const AGE_RATINGS = [
    { value: '', label: 'Não classificado' },
    { value: 'L', label: 'Livre' },
    { value: '10', label: '10 anos' },
    { value: '12', label: '12 anos' },
    { value: '14', label: '14 anos' },
    { value: '16', label: '16 anos' },
    { value: '18', label: '18 anos' },
]

export default function EditProductionPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const toast = useAdminToast()
    const returnToRef = useRef<string | null>(null)
    const [production, setProduction] = useState<Production | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<Partial<Production>>({})

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const returnTo = params.get('returnTo')
        if (returnTo) returnToRef.current = returnTo
    }, [])
    const [tmdbData, setTmdbData] = useState<TmdbPreview | null>(null)
    const [fetchingTmdb, setFetchingTmdb] = useState(false)
    const [tmdbError, setTmdbError] = useState('')
    const [syncedFields, setSyncedFields] = useState<Set<string>>(new Set())
    const [showTakedownModal, setShowTakedownModal] = useState(false)
    const [showRestoreModal, setShowRestoreModal] = useState(false)
    const [activeTakedown, setActiveTakedown] = useState<TakedownRecord | null>(null)
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

    useEffect(() => {
        fetch(`/api/admin/productions/by-id?id=${id}`)
            .then(r => r.json())
            .then(data => {
                setProduction(data)
                setForm(data)
                if (data.isTakenDown) {
                    fetch(`/api/admin/productions/${id}/takedown`)
                        .then(r => r.json())
                        .then((history: TakedownRecord[]) => {
                            const active = history.find((t: TakedownRecord & { isActive?: boolean }) => (t as TakedownRecord & { isActive: boolean }).isActive !== false)
                            if (active) setActiveTakedown(active)
                        })
                        .catch(() => {})
                }
            })
            .catch(() => toast.error('Erro ao carregar produção'))
            .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    useEffect(() => {
        fetch('/api/blog/categories')
            .then(r => r.json())
            .then(data => setCategories(Array.isArray(data) ? data : []))
            .catch(() => {})
    }, [])

    const set = (key: keyof Production, value: unknown) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    const handleFetchTmdb = async (): Promise<TmdbPreview | null> => {
        if (tmdbData) return tmdbData
        setFetchingTmdb(true)
        setTmdbError('')
        try {
            const res = await fetch(`/api/admin/productions/tmdb-preview?id=${id}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao buscar do TMDB')
            setTmdbData(data)
            return data
        } catch (err) {
            setTmdbError(err instanceof Error ? err.message : 'Erro ao buscar do TMDB')
            return null
        } finally {
            setFetchingTmdb(false)
        }
    }

    const handleSyncAll = async (mode: 'empty_only' | 'all') => {
        const data = await handleFetchTmdb()
        if (!data) return

        const applied = new Set<string>()

        setForm(prev => {
            const next = { ...prev }

            const apply = <K extends keyof Production>(key: K, value: Production[K] | null | undefined) => {
                if (value == null) return
                if (mode === 'all' || prev[key] === null || prev[key] === undefined || prev[key] === '') {
                    (next as Record<string, unknown>)[key] = value
                    applied.add(key)
                }
            }

            apply('titlePt', (data.titlePt || data.titleEn) as string)
            apply('tagline', (data.taglinePt || data.taglineEn) as string)
            apply('imageUrl', data.imageUrl as string)
            apply('backdropUrl', data.backdropUrl as string)
            apply('trailerUrl', data.trailerUrl as string)
            apply('year', data.year as number)
            apply('voteAverage', data.voteAverage as number)
            apply('runtime', data.runtime as number)
            apply('episodeCount', data.episodeCount as number)
            apply('seasonCount', data.seasonCount as number)
            apply('episodeRuntime', data.episodeRuntime as number)
            apply('network', data.network as string)
            apply('productionStatus', data.productionStatus as string)

            const synopsisValue = data.synopsisPt || data.synopsisEn
            if (synopsisValue && (mode === 'all' || !prev.synopsis)) {
                next.synopsis = synopsisValue
                next.synopsisSource = data.synopsisPt ? 'tmdb_pt' : 'tmdb_en'
                applied.add('synopsis')
            }

            return next
        })

        setSyncedFields(applied)
        setTimeout(() => setSyncedFields(new Set()), 3000)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const body: Record<string, unknown> = { ...form }
            // Ensure numeric fields are numbers, not strings
            for (const key of ['year', 'runtime', 'episodeCount', 'seasonCount', 'episodeRuntime'] as const) {
                if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
                    body[key] = parseInt(String(body[key]))
                } else if (body[key] === '') {
                    body[key] = null
                }
            }
            if (body.voteAverage === '' || Number.isNaN(body.voteAverage)) {
                body.voteAverage = null
            } else if (body.voteAverage !== undefined && body.voteAverage !== null) {
                body.voteAverage = Number(body.voteAverage)
            }
            if (body.editorialRating === '' || Number.isNaN(body.editorialRating)) {
                body.editorialRating = null
            } else if (body.editorialRating !== undefined && body.editorialRating !== null) {
                body.editorialRating = Number(body.editorialRating)
            }
            // Strip empty URL strings → null
            for (const key of ['imageUrl', 'backdropUrl', 'trailerUrl', 'releaseDate'] as const) {
                if (body[key] === '') body[key] = null
            }
            await adminApi.productions.update(id, body)
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

    const inputCls = "w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-purple-500/50 text-sm"
    const labelCls = "block text-xs font-bold text-muted uppercase tracking-widest mb-1.5"
    const synced = (key: string) => syncedFields.has(key)

    return (
        <AdminLayout title={production ? `Editar: ${production.titlePt}` : 'Editar Produção'} hideTitle>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <PageHeader
                    title={production ? production.titlePt : 'Editar Produção'}
                    backHref="/admin/productions"
                    backLabel="Produções"
                >
                    {production && (
                        <Link
                            href={`/productions/${id}`}
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

                {!loading && !production && (
                    <AdminEmptyState title="Produção não encontrada." size="lg" />
                )}

                {production && (
                    <>
                    {/* Banner de takedown ativo */}
                    {production.isTakenDown && (
                        <div className="mb-6 rounded-xl border border-red-700/60 bg-red-950/30 p-4">
                            <div className="flex items-start gap-3">
                                <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-red-300">Takedown Legal Ativo</p>
                                    {activeTakedown && (
                                        <div className="mt-1 space-y-0.5 text-xs text-red-400/80">
                                            <p>Tipo: <span className="font-medium text-red-300">{activeTakedown.reason}</span></p>
                                            {activeTakedown.noticeReference && (
                                                <p>Referência: <span className="font-medium text-red-300">{activeTakedown.noticeReference}</span></p>
                                            )}
                                            {activeTakedown.noticeDate && (
                                                <p>Data da notificação: <span className="font-medium text-red-300">{new Date(activeTakedown.noticeDate).toLocaleDateString('pt-BR')}</span></p>
                                            )}
                                            <p>Ocultado em: <span className="font-medium text-red-300">{new Date(activeTakedown.hiddenAt).toLocaleString('pt-BR')}</span> por <span className="font-medium text-red-300">{activeTakedown.hiddenBy.name ?? activeTakedown.hiddenBy.email}</span></p>
                                        </div>
                                    )}
                                    <p className="mt-2 text-xs text-red-500">Esta produção está oculta do site público por motivo legal. Use o botão &quot;Restaurar&quot; para remover o takedown.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Sincronizar do TMDB — botões principal */}
                        {production.tmdbId && (
                            <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-surface">
                                <div>
                                    <p className="text-sm font-bold text-foreground">Sincronizar dados do TMDB</p>
                                    <p className="text-xs text-muted mt-0.5">
                                        Preencher vazios: só campos em branco · Forçar: sobrescreve tudo
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleSyncAll('empty_only')}
                                        disabled={fetchingTmdb}
                                        className="flex items-center gap-2 px-3 py-2 bg-surface hover:bg-surface-hover disabled:opacity-50 text-foreground rounded-lg text-sm font-bold transition-colors"
                                    >
                                        {fetchingTmdb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                                        Preencher vazios
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSyncAll('all')}
                                        disabled={fetchingTmdb}
                                        className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-foreground rounded-lg text-sm font-bold transition-colors"
                                    >
                                        {fetchingTmdb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                        Forçar todos
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Poster + títulos */}
                        <div className="flex gap-5 items-start">
                            <div className="flex-shrink-0 space-y-2">
                                {/* Poster atual */}
                                {form.imageUrl ? (
                                    <Image
                                        src={form.imageUrl}
                                        alt={form.titlePt ?? ''}
                                        width={96}
                                        height={144}
                                        className="rounded-lg object-cover w-24 h-36"
                                    />
                                ) : (
                                    <div className="w-24 h-36 rounded-lg bg-surface flex items-center justify-center">
                                        <Film className="w-8 h-8 text-muted" />
                                    </div>
                                )}
                                {/* Poster TMDB (se diferente) */}
                                {tmdbData?.imageUrl && tmdbData.imageUrl !== form.imageUrl && (
                                    <div className="relative group">
                                        <Image
                                            src={tmdbData.imageUrl}
                                            alt="TMDB"
                                            width={96}
                                            height={144}
                                            className="rounded-lg object-cover w-24 h-36 opacity-70 group-hover:opacity-100 transition-opacity"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => set('imageUrl', tmdbData.imageUrl)}
                                            className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <span className="bg-black/80 text-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                                                Usar TMDB
                                            </span>
                                        </button>
                                        <span className="absolute top-1 left-1 bg-black/70 text-[8px] text-foreground px-1 rounded">TMDB</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className={labelCls}>Título Original (Coreano/Inglês) *</label>
                                    <input
                                        type="text"
                                        value={form.titleKr ?? ''}
                                        onChange={e => set('titleKr', e.target.value)}
                                        className={inputCls}
                                        required
                                        placeholder="Ex: 사랑의 불시착 ou Crash Landing on You"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>
                                        Título em Português
                                        {synced('titlePt') && <SyncedBadge />}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={form.titlePt ?? ''}
                                            onChange={e => set('titlePt', e.target.value)}
                                            className={inputCls}
                                            placeholder="Se vazio, usa o título original"
                                        />
                                        {production.tmdbId && (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const data = await handleFetchTmdb()
                                                    const title = data?.titlePt || data?.titleEn || form.titleKr || null
                                                    if (title) set('titlePt', title)
                                                }}
                                                disabled={fetchingTmdb}
                                                title="Buscar título do TMDB"
                                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface disabled:opacity-50 text-foreground rounded-lg text-xs font-medium transition-colors border border-border"
                                            >
                                                {fetchingTmdb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                                TMDB
                                            </button>
                                        )}
                                    </div>
                                    {/* Sugestões de título do TMDB */}
                                    {tmdbData && (
                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                            {tmdbData.titlePt && tmdbData.titlePt !== form.titlePt && (
                                                <button
                                                    type="button"
                                                    onClick={() => set('titlePt', tmdbData.titlePt)}
                                                    className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"
                                                >
                                                    pt-BR: &ldquo;{tmdbData.titlePt}&rdquo;
                                                </button>
                                            )}
                                            {tmdbData.titleEn && tmdbData.titleEn !== form.titlePt && tmdbData.titleEn !== tmdbData.titlePt && (
                                                <button
                                                    type="button"
                                                    onClick={() => set('titlePt', tmdbData.titleEn)}
                                                    className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"
                                                >
                                                    en: &ldquo;{tmdbData.titleEn}&rdquo;
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {tmdbError && <p className="mt-1 text-xs text-red-400">{tmdbError}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Tipo + Ano + Data de estreia + Faixa etária + Categoria */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <label className={labelCls}>Tipo *</label>
                                <input
                                    type="text"
                                    value={form.type ?? ''}
                                    onChange={e => set('type', e.target.value)}
                                    placeholder="Drama, Filme, Reality..."
                                    className={inputCls}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelCls}>
                                    Ano
                                    {synced('year') && <SyncedBadge />}
                                </label>
                                <input
                                    type="number"
                                    value={form.year ?? ''}
                                    onChange={e => set('year', e.target.value)}
                                    placeholder="2024"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Data de Estreia</label>
                                <input
                                    type="date"
                                    value={form.releaseDate ? form.releaseDate.slice(0, 10) : ''}
                                    onChange={e => set('releaseDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Faixa Etária</label>
                                <select
                                    value={form.ageRating ?? ''}
                                    onChange={e => set('ageRating', e.target.value || null)}
                                    className={inputCls}
                                >
                                    {AGE_RATINGS.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Categoria</label>
                                <select
                                    value={form.categoryId ?? ''}
                                    onChange={e => set('categoryId', e.target.value || null)}
                                    className={inputCls}
                                >
                                    <option value="">Sem categoria</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Tagline */}
                        <div>
                            <label className={labelCls}>
                                Tagline / Slogan
                                {synced('tagline') && <SyncedBadge />}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={form.tagline ?? ''}
                                    onChange={e => set('tagline', e.target.value)}
                                    placeholder='Ex: "사랑은 눈물이다"'
                                    className={inputCls}
                                />
                                {production.tmdbId && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const data = await handleFetchTmdb()
                                            const tagline = data?.taglinePt || data?.taglineEn
                                            if (tagline) set('tagline', tagline)
                                        }}
                                        disabled={fetchingTmdb}
                                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface disabled:opacity-50 text-foreground rounded-lg text-xs font-medium transition-colors border border-border"
                                    >
                                        {fetchingTmdb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                        TMDB
                                    </button>
                                )}
                            </div>
                            {tmdbData && (tmdbData.taglinePt || tmdbData.taglineEn) && (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {tmdbData.taglinePt && tmdbData.taglinePt !== form.tagline && (
                                        <button
                                            type="button"
                                            onClick={() => set('tagline', tmdbData.taglinePt)}
                                            className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"
                                        >
                                            pt-BR: &ldquo;{tmdbData.taglinePt}&rdquo;
                                        </button>
                                    )}
                                    {tmdbData.taglineEn && tmdbData.taglineEn !== form.tagline && tmdbData.taglineEn !== tmdbData.taglinePt && (
                                        <button
                                            type="button"
                                            onClick={() => set('tagline', tmdbData.taglineEn)}
                                            className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"
                                        >
                                            en: &ldquo;{tmdbData.taglineEn}&rdquo;
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Imagens */}
                        <div className="space-y-3">
                            <div>
                                <label className={labelCls}>
                                    URL do Poster
                                    {synced('imageUrl') && <SyncedBadge />}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.imageUrl ?? ''}
                                        onChange={e => set('imageUrl', e.target.value)}
                                        placeholder="https://image.tmdb.org/t/p/w500/..."
                                        className={inputCls}
                                    />
                                    {production.tmdbId && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const data = await handleFetchTmdb()
                                                if (data?.imageUrl) set('imageUrl', data.imageUrl)
                                            }}
                                            disabled={fetchingTmdb}
                                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface disabled:opacity-50 text-foreground rounded-lg text-xs font-medium transition-colors border border-border"
                                        >
                                            {fetchingTmdb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                            TMDB
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>
                                    URL do Backdrop / Banner
                                    {synced('backdropUrl') && <SyncedBadge />}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.backdropUrl ?? ''}
                                        onChange={e => set('backdropUrl', e.target.value)}
                                        placeholder="https://image.tmdb.org/t/p/original/..."
                                        className={inputCls}
                                    />
                                    {production.tmdbId && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const data = await handleFetchTmdb()
                                                if (data?.backdropUrl) set('backdropUrl', data.backdropUrl)
                                            }}
                                            disabled={fetchingTmdb}
                                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface disabled:opacity-50 text-foreground rounded-lg text-xs font-medium transition-colors border border-border"
                                        >
                                            {fetchingTmdb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                            TMDB
                                        </button>
                                    )}
                                </div>
                                {/* Preview do backdrop */}
                                {form.backdropUrl && (
                                    <div className="mt-2 relative w-full h-20 rounded-lg overflow-hidden">
                                        <Image
                                            src={form.backdropUrl}
                                            alt="Backdrop"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sinopse */}
                        <div className="space-y-3">
                            {/* Referências TMDB (somente quando carregado) */}
                            {tmdbData && (tmdbData.synopsisPt || tmdbData.synopsisEn) && (
                                <div className="grid grid-cols-2 gap-3">
                                    {tmdbData.synopsisPt && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={labelCls + ' mb-0'}>TMDB · pt-BR</span>
                                                <button
                                                    type="button"
                                                    onClick={() => { set('synopsis', tmdbData.synopsisPt); set('synopsisSource', 'tmdb_pt') }}
                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"
                                                >
                                                    Usar
                                                </button>
                                            </div>
                                            <p className="text-xs text-muted bg-surface rounded-lg p-2.5 border border-border leading-relaxed line-clamp-6">
                                                {tmdbData.synopsisPt}
                                            </p>
                                        </div>
                                    )}
                                    {tmdbData.synopsisEn && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={labelCls + ' mb-0'}>TMDB · en</span>
                                                <button
                                                    type="button"
                                                    onClick={() => { set('synopsis', tmdbData.synopsisEn); set('synopsisSource', 'tmdb_en') }}
                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"
                                                >
                                                    Usar
                                                </button>
                                            </div>
                                            <p className="text-xs text-muted bg-surface rounded-lg p-2.5 border border-border leading-relaxed line-clamp-6">
                                                {tmdbData.synopsisEn}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sinopse editável */}
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <label className={labelCls + ' mb-0'}>
                                        Sinopse em Português
                                        {synced('synopsis') && <SyncedBadge />}
                                    </label>
                                    {form.synopsisSource && SYNOPSIS_SOURCE_LABELS[form.synopsisSource] && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SYNOPSIS_SOURCE_LABELS[form.synopsisSource].cls}`}>
                                            {SYNOPSIS_SOURCE_LABELS[form.synopsisSource].label}
                                        </span>
                                    )}
                                </div>
                                <textarea
                                    value={form.synopsis ?? ''}
                                    onChange={e => set('synopsis', e.target.value)}
                                    placeholder="Breve descrição da produção em português..."
                                    rows={4}
                                    className={inputCls + ' resize-none'}
                                />
                                {production.tmdbId && !tmdbData && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const data = await handleFetchTmdb()
                                            if (data?.synopsisPt) {
                                                set('synopsis', data.synopsisPt)
                                                set('synopsisSource', 'tmdb_pt')
                                            } else if (data?.synopsisEn) {
                                                set('synopsis', data.synopsisEn)
                                                set('synopsisSource', 'tmdb_en')
                                            }
                                        }}
                                        disabled={fetchingTmdb}
                                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface disabled:opacity-50 text-foreground rounded-lg text-xs font-medium transition-colors border border-border"
                                    >
                                        {fetchingTmdb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                        Buscar do TMDB
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Metadados */}
                        <div>
                            <label className={labelCls}>Metadados</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-surface">
                                <div>
                                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                                        Duração (filme, min)
                                        {synced('runtime') && <SyncedBadge />}
                                    </label>
                                    <input
                                        type="number"
                                        value={form.runtime ?? ''}
                                        onChange={e => set('runtime', e.target.value)}
                                        placeholder="120"
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                                        Episódios
                                        {synced('episodeCount') && <SyncedBadge />}
                                    </label>
                                    <input
                                        type="number"
                                        value={form.episodeCount ?? ''}
                                        onChange={e => set('episodeCount', e.target.value)}
                                        placeholder="16"
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                                        Temporadas
                                        {synced('seasonCount') && <SyncedBadge />}
                                    </label>
                                    <input
                                        type="number"
                                        value={form.seasonCount ?? ''}
                                        onChange={e => set('seasonCount', e.target.value)}
                                        placeholder="1"
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                                        Duração/ep (min)
                                        {synced('episodeRuntime') && <SyncedBadge />}
                                    </label>
                                    <input
                                        type="number"
                                        value={form.episodeRuntime ?? ''}
                                        onChange={e => set('episodeRuntime', e.target.value)}
                                        placeholder="60"
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                                        Nota TMDB
                                        {synced('voteAverage') && <SyncedBadge />}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        value={form.voteAverage ?? ''}
                                        onChange={e => set('voteAverage', e.target.value === '' ? null : parseFloat(e.target.value))}
                                        placeholder="8.5"
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                                        Canal / Rede
                                        {synced('network') && <SyncedBadge />}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.network ?? ''}
                                        onChange={e => set('network', e.target.value)}
                                        placeholder="tvN, JTBC, Netflix..."
                                        className={inputCls}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                                        Status de Produção
                                        {synced('productionStatus') && <SyncedBadge />}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.productionStatus ?? ''}
                                        onChange={e => set('productionStatus', e.target.value)}
                                        placeholder="Returning Series, Ended, Cancelled..."
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Trailer */}
                        <div>
                            <label className={labelCls}>
                                URL do Trailer
                                {synced('trailerUrl') && <SyncedBadge />}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={form.trailerUrl ?? ''}
                                    onChange={e => set('trailerUrl', e.target.value)}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className={inputCls}
                                />
                                {production.tmdbId && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const data = await handleFetchTmdb()
                                            if (data?.trailerUrl) set('trailerUrl', data.trailerUrl)
                                        }}
                                        disabled={fetchingTmdb}
                                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface disabled:opacity-50 text-foreground rounded-lg text-xs font-medium transition-colors border border-border"
                                    >
                                        {fetchingTmdb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                        TMDB
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className={labelCls}>Tags (separadas por vírgula)</label>
                            <input
                                type="text"
                                value={(form.tags ?? []).join(', ')}
                                onChange={e => set('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                placeholder="k-drama, romance, 2024"
                                className={inputCls}
                            />
                        </div>

                        {/* TMDB ID + Tipo */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>TMDB ID</label>
                                <input
                                    type="text"
                                    value={form.tmdbId ?? ''}
                                    onChange={e => set('tmdbId', e.target.value || null)}
                                    placeholder="Ex: 12345"
                                    className={inputCls + ' font-mono'}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>TMDB Tipo</label>
                                <select
                                    value={form.tmdbType ?? ''}
                                    onChange={e => set('tmdbType', e.target.value || null)}
                                    className={inputCls}
                                >
                                    <option value="">Não definido</option>
                                    <option value="movie">Filme (movie)</option>
                                    <option value="tv">Série (tv)</option>
                                </select>
                            </div>
                        </div>

                        {/* Plataformas, fontes e galeria */}
                        <div className="space-y-3">
                            <div>
                                <label className={labelCls}>Plataformas de Streaming (separadas por vírgula)</label>
                                <input
                                    type="text"
                                    value={(form.streamingPlatforms ?? []).join(', ')}
                                    onChange={e => set('streamingPlatforms', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                    placeholder="Netflix, Disney+, Prime..."
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>URLs de Fonte (uma por linha)</label>
                                <textarea
                                    value={(form.sourceUrls ?? []).join('\n')}
                                    onChange={e => set('sourceUrls', e.target.value.split('\n').map(t => t.trim()).filter(Boolean))}
                                    placeholder="https://..."
                                    rows={3}
                                    className={inputCls + ' resize-none font-mono text-xs'}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>URLs da Galeria (uma por linha)</label>
                                <textarea
                                    value={(form.galleryUrls ?? []).join('\n')}
                                    onChange={e => set('galleryUrls', e.target.value.split('\n').map(t => t.trim()).filter(Boolean))}
                                    placeholder="https://image.tmdb.org/..."
                                    rows={3}
                                    className={inputCls + ' resize-none font-mono text-xs'}
                                />
                            </div>
                        </div>

                        {/* Visibilidade */}
                        <div className="border border-border rounded-xl p-4 bg-surface">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex-shrink-0">
                                    <input type="checkbox" className="sr-only peer"
                                        checked={form.isHidden ?? false}
                                        onChange={e => set('isHidden' as keyof Production, e.target.checked)} />
                                    <div className="w-10 h-6 bg-border peer-checked:bg-red-600 rounded-full transition-colors" />
                                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">
                                        {form.isHidden ? 'Oculto do site público' : 'Visível no site público'}
                                    </p>
                                    <p className="text-xs text-muted">
                                        {form.isHidden
                                            ? 'Esta produção não aparece em listagens públicas'
                                            : 'Esta produção aparece normalmente no site'}
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Flags e Curadoria */}
                        <div className="border border-border rounded-xl p-4 bg-surface space-y-3">
                            <p className="text-xs font-bold text-muted uppercase tracking-widest">Flags e Curadoria</p>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex-shrink-0">
                                    <input type="checkbox" className="sr-only peer"
                                        checked={form.needsCuration ?? false}
                                        onChange={e => set('needsCuration' as keyof Production, e.target.checked)} />
                                    <div className="w-10 h-6 bg-border peer-checked:bg-orange-500 rounded-full transition-colors" />
                                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">Aguardando curadoria</p>
                                    <p className="text-xs text-muted">Aparece na fila de curadoria do pipeline</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex-shrink-0">
                                    <input type="checkbox" className="sr-only peer"
                                        checked={form.flaggedAsNonKorean ?? false}
                                        onChange={e => set('flaggedAsNonKorean' as keyof Production, e.target.checked)} />
                                    <div className="w-10 h-6 bg-border peer-checked:bg-orange-500 rounded-full transition-colors" />
                                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">Não coreana</p>
                                    <p className="text-xs text-muted">Excluída das listas e pipeline de produções coreanas</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex-shrink-0">
                                    <input type="checkbox" className="sr-only peer"
                                        checked={form.isAdultContent ?? false}
                                        onChange={e => set('isAdultContent' as keyof Production, e.target.checked)} />
                                    <div className="w-10 h-6 bg-border peer-checked:bg-red-600 rounded-full transition-colors" />
                                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">Conteúdo adulto</p>
                                    <p className="text-xs text-muted">Marcado como 18+ ou impróprio para menores</p>
                                </div>
                            </label>
                            {form.isAdultContent && (
                                <div>
                                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Tipo de conteúdo adulto</label>
                                    <select
                                        value={form.adultContentType ?? ''}
                                        onChange={e => set('adultContentType' as keyof Production, e.target.value || null)}
                                        className={inputCls}
                                    >
                                        <option value="">Não especificado</option>
                                        <option value="sexual">Sexual</option>
                                        <option value="violent">Violento</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Conteudo editorial revisado */}
                        <div className="border border-purple-500/20 rounded-xl p-4 bg-purple-900/5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-semibold text-foreground">Review Editorial</span>
                                    <span className="text-[10px] text-muted font-mono">Gemini + revisao</span>
                                </div>
                                <Link href={`/admin/productions/${id}/enrich`} className="text-[10px] text-muted hover:text-purple-400 transition-colors">
                                    Abrir curadoria →
                                </Link>
                            </div>
                            <p className="text-xs text-muted mb-3">
                                A geracao automatica foi desativada. Gere o JSON no Gemini, revise e aplique na fila de producoes.
                            </p>
                            <Link
                                href={`/admin/productions/${id}/enrich`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/40 disabled:opacity-40 transition-colors"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Preparar no Gemini
                            </Link>
                            {/* Campos editoriais editáveis */}
                            <div className="mt-4 space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Nossa Nota (0–10)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        value={form.editorialRating ?? ''}
                                        onChange={e => set('editorialRating' as keyof Production, e.target.value === '' ? null : parseFloat(e.target.value))}
                                        placeholder="8.5"
                                        className={inputCls + ' w-32'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Por que assistir?</label>
                                    <textarea
                                        value={form.whyWatch ?? ''}
                                        onChange={e => set('whyWatch' as keyof Production, e.target.value || null)}
                                        placeholder="Parágrafo curto sobre por que vale a pena..."
                                        rows={3}
                                        className={inputCls + ' resize-none'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Review Editorial</label>
                                    <textarea
                                        value={form.editorialReview ?? ''}
                                        onChange={e => set('editorialReview' as keyof Production, e.target.value || null)}
                                        placeholder="Review completa 350-450 palavras..."
                                        rows={8}
                                        className={inputCls + ' resize-y'}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2 flex-wrap">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:bg-purple-900 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                            <Link
                                href="/admin/productions"
                                className="px-5 py-2.5 bg-surface border border-border text-foreground hover:bg-surface-hover rounded-lg text-sm font-bold transition-colors"
                            >
                                Cancelar
                            </Link>

                            {/* Takedown / Restore buttons */}
                            {!production.isTakenDown && (
                                <button
                                    type="button"
                                    onClick={() => setShowTakedownModal(true)}
                                    className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-400 rounded-lg text-sm font-bold transition-colors"
                                >
                                    <ShieldAlert className="w-4 h-4" />
                                    Notificação Legal
                                </button>
                            )}
                            {production.isTakenDown && (
                                <button
                                    type="button"
                                    onClick={() => setShowRestoreModal(true)}
                                    className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-700/50 text-yellow-400 rounded-lg text-sm font-bold transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Restaurar
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Modals */}
                    {showTakedownModal && (
                        <TakedownModal
                            productionId={id}
                            productionTitle={production.titlePt}
                            onSuccess={() => {
                                setShowTakedownModal(false)
                                // Reload production data
                                setLoading(true)
                                fetch(`/api/admin/productions/by-id?id=${id}`)
                                    .then(r => r.json())
                                    .then(data => {
                                        setProduction(data)
                                        setForm(data)
                                        if (data.isTakenDown) {
                                            fetch(`/api/admin/productions/${id}/takedown`)
                                                .then(r => r.json())
                                                .then((history: TakedownRecord[]) => {
                                                    const active = history.find((t: TakedownRecord & { isActive?: boolean }) => (t as TakedownRecord & { isActive: boolean }).isActive !== false)
                                                    if (active) setActiveTakedown(active)
                                                })
                                                .catch(() => {})
                                        }
                                    })
                                    .finally(() => setLoading(false))
                                toast.success('Takedown emitido com sucesso')
                            }}
                            onClose={() => setShowTakedownModal(false)}
                        />
                    )}
                    {showRestoreModal && activeTakedown && (
                        <RestoreModal
                            productionId={id}
                            productionTitle={production.titlePt}
                            takedownReason={activeTakedown.reason}
                            onSuccess={() => {
                                setShowRestoreModal(false)
                                setActiveTakedown(null)
                                // Reload production data
                                setLoading(true)
                                fetch(`/api/admin/productions/by-id?id=${id}`)
                                    .then(r => r.json())
                                    .then(data => { setProduction(data); setForm(data) })
                                    .finally(() => setLoading(false))
                                toast.success('Produção restaurada com sucesso')
                            }}
                            onClose={() => setShowRestoreModal(false)}
                        />
                    )}
                    </>
                )}
            </div>
        </AdminLayout>
    )
}

function SyncedBadge() {
    return (
        <span className="inline-flex items-center gap-0.5 ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/30 normal-case tracking-normal">
            <Check className="w-2.5 h-2.5" />
            sync
        </span>
    )
}
