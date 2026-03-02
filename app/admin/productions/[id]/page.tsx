'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ArrowLeft, ExternalLink, Save, RefreshCw, Film } from 'lucide-react'

interface Production {
    id: string
    titlePt: string
    titleKr: string | null
    type: string
    year: number | null
    tagline: string | null
    synopsis: string | null
    imageUrl: string | null
    trailerUrl: string | null
    tags: string[]
    ageRating: string | null
    tmdbId: string | null
    isHidden: boolean
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
    const [production, setProduction] = useState<Production | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState<Partial<Production>>({})

    useEffect(() => {
        fetch(`/api/admin/productions/by-id?id=${id}`)
            .then(r => r.json())
            .then(data => {
                setProduction(data)
                setForm(data)
            })
            .catch(() => setError('Erro ao carregar produção'))
            .finally(() => setLoading(false))
    }, [id])

    const set = (key: keyof Production, value: unknown) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        setSuccess('')
        try {
            const body: Record<string, unknown> = { ...form }
            if (body.year && typeof body.year === 'string') body.year = parseInt(body.year as string)
            const res = await fetch(`/api/admin/productions?id=${id}`, {
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
        <AdminLayout title={production ? `Editar: ${production.titlePt}` : 'Editar Produção'}>
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
                    {production && (
                        <Link
                            href={`/productions/${id}`}
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

                {!loading && !production && (
                    <div className="text-center py-20 text-zinc-500">Produção não encontrada.</div>
                )}

                {production && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Poster + título */}
                        <div className="flex gap-5 items-start">
                            <div className="w-24 flex-shrink-0">
                                {form.imageUrl ? (
                                    <Image
                                        src={form.imageUrl}
                                        alt={form.titlePt ?? ''}
                                        width={96}
                                        height={144}
                                        className="rounded-lg object-cover w-24 h-36"
                                    />
                                ) : (
                                    <div className="w-24 h-36 rounded-lg bg-zinc-800 flex items-center justify-center">
                                        <Film className="w-8 h-8 text-zinc-600" />
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
                                    <label className={labelCls}>Título em Português</label>
                                    <input
                                        type="text"
                                        value={form.titlePt ?? ''}
                                        onChange={e => set('titlePt', e.target.value)}
                                        className={inputCls}
                                        placeholder="Se vazio, usa o título original"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tipo + Ano + Faixa etária */}
                        <div className="grid grid-cols-3 gap-4">
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
                                <label className={labelCls}>Ano</label>
                                <input
                                    type="number"
                                    value={form.year ?? ''}
                                    onChange={e => set('year', e.target.value)}
                                    placeholder="2024"
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
                        </div>

                        {/* Tagline */}
                        <div>
                            <label className={labelCls}>Tagline / Slogan</label>
                            <input
                                type="text"
                                value={form.tagline ?? ''}
                                onChange={e => set('tagline', e.target.value)}
                                placeholder='Ex: "사랑은 눈물이다"'
                                className={inputCls}
                            />
                        </div>

                        {/* Sinopse */}
                        <div>
                            <label className={labelCls}>Sinopse</label>
                            <textarea
                                value={form.synopsis ?? ''}
                                onChange={e => set('synopsis', e.target.value)}
                                placeholder="Breve descrição da produção..."
                                rows={4}
                                className={inputCls + ' resize-none'}
                            />
                        </div>

                        {/* URLs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>URL da Imagem / Poster</label>
                                <input
                                    type="text"
                                    value={form.imageUrl ?? ''}
                                    onChange={e => set('imageUrl', e.target.value)}
                                    placeholder="https://..."
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>URL do Trailer</label>
                                <input
                                    type="text"
                                    value={form.trailerUrl ?? ''}
                                    onChange={e => set('trailerUrl', e.target.value)}
                                    placeholder="https://youtube.com/..."
                                    className={inputCls}
                                />
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

                        {/* TMDB ID (readonly info) */}
                        {production.tmdbId && (
                            <div className="text-xs text-zinc-600 font-mono">
                                TMDB ID: {production.tmdbId}
                            </div>
                        )}

                        {/* Visibilidade */}
                        <div className="border border-white/10 rounded-xl p-4 bg-zinc-900/50">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex-shrink-0">
                                    <input type="checkbox" className="sr-only peer"
                                        checked={form.isHidden ?? false}
                                        onChange={e => set('isHidden' as any, e.target.checked)} />
                                    <div className="w-10 h-6 bg-zinc-600 peer-checked:bg-red-600 rounded-full transition-colors" />
                                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-200">
                                        {form.isHidden ? 'Oculto do site público' : 'Visível no site público'}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {form.isHidden
                                            ? 'Esta produção não aparece em listagens públicas'
                                            : 'Esta produção aparece normalmente no site'}
                                    </p>
                                </div>
                            </label>
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
                                href="/admin/productions"
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
