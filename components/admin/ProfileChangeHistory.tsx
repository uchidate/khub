'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock3, RefreshCw, History } from 'lucide-react'
import { AdminEmptyState } from '@/components/admin'

type ProfileEntity = 'Artist' | 'MusicalGroup' | 'Production'

interface AuditAdmin {
    id: string
    name: string | null
    email: string
}

interface AuditLog {
    id: string
    action: string
    entity: ProfileEntity
    entityId: string | null
    details: string | null
    before: unknown
    after: unknown
    createdAt: string
    admin: AuditAdmin | null
}

interface FieldChange {
    field: string
    before: unknown
    after: unknown
}

interface Props {
    entity: ProfileEntity
    entityId: string
}

const FIELD_LABELS: Record<string, string> = {
    nameRomanized: 'Nome romanizado',
    nameHangul: 'Nome em hangul',
    birthName: 'Nome de nascimento',
    stageNames: 'Stage names',
    primaryImageUrl: 'Imagem principal',
    profileImageUrl: 'Imagem principal',
    imageUrl: 'Poster',
    backdropUrl: 'Backdrop',
    birthDate: 'Nascimento',
    placeOfBirth: 'Local de nascimento',
    height: 'Altura',
    bloodType: 'Tipo sanguíneo',
    zodiacSign: 'Signo',
    gender: 'Gênero',
    roles: 'Funções',
    bio: 'Bio',
    analiseEditorial: 'Análise editorial',
    curiosidades: 'Curiosidades',
    socialLinks: 'Redes sociais',
    videos: 'Vídeos',
    tmdbId: 'TMDB ID',
    mbid: 'MusicBrainz ID',
    isHidden: 'Visibilidade',
    flaggedAsNonKorean: 'Não-coreano',
    name: 'Nome',
    debutDate: 'Debut',
    disbandDate: 'Disband',
    agencyId: 'Agência',
    fanClubName: 'Fandom',
    officialColor: 'Cor oficial',
    titlePt: 'Título PT',
    titleKr: 'Título original',
    type: 'Tipo',
    year: 'Ano',
    releaseDate: 'Lançamento',
    tagline: 'Tagline',
    synopsis: 'Sinopse',
    synopsisSource: 'Fonte da sinopse',
    galleryUrls: 'Galeria',
    trailerUrl: 'Trailer',
    streamingPlatforms: 'Streaming',
    sourceUrls: 'Fontes',
    tags: 'Tags',
    ageRating: 'Classificação',
    runtime: 'Duração',
    episodeCount: 'Episódios',
    seasonCount: 'Temporadas',
    episodeRuntime: 'Duração episódio',
    voteAverage: 'Nota TMDB',
    productionStatus: 'Status',
    network: 'Emissora',
    editorialReview: 'Review editorial',
    editorialRating: 'Nota editorial',
    whyWatch: 'Por que assistir',
    needsCuration: 'Precisa curadoria',
    isAdultContent: 'Conteúdo adulto',
    adultContentType: 'Tipo adulto',
    categoryId: 'Categoria',
}

const IGNORED_FIELDS = new Set(['updatedAt'])

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalize(value: unknown) {
    return JSON.stringify(value ?? null)
}

function getChanges(before: unknown, after: unknown): FieldChange[] {
    if (!isRecord(before) || !isRecord(after)) return []

    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    return Array.from(keys)
        .filter(key => !IGNORED_FIELDS.has(key))
        .filter(key => normalize(before[key]) !== normalize(after[key]))
        .map(field => ({ field, before: before[field], after: after[field] }))
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value))
}

function formatValue(value: unknown) {
    if (value === null || value === undefined || value === '') return 'vazio'
    if (typeof value === 'boolean') return value ? 'sim' : 'não'
    if (typeof value === 'number') return String(value)
    if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed.length > 72 ? `${trimmed.slice(0, 72)}...` : trimmed
    }
    if (Array.isArray(value)) {
        if (value.length === 0) return 'vazio'
        const text = value.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join(', ')
        return text.length > 72 ? `${text.slice(0, 72)}...` : text
    }

    const text = JSON.stringify(value)
    return text.length > 72 ? `${text.slice(0, 72)}...` : text
}

export function ProfileChangeHistory({ entity, entityId }: Props) {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const url = useMemo(
        () => `/api/admin/profile-history?entity=${entity}&entityId=${entityId}&limit=20`,
        [entity, entityId],
    )

    const load = async (soft = false) => {
        if (soft) setRefreshing(true)
        else setLoading(true)
        try {
            const res = await fetch(url)
            const data = await res.json()
            setLogs(Array.isArray(data.logs) ? data.logs : [])
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        void load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url])

    return (
        <section className="border border-border rounded-xl bg-surface overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2 min-w-0">
                    <History className="w-4 h-4 text-accent flex-shrink-0" />
                    <div className="min-w-0">
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Histórico de alterações</h2>
                        <p className="text-[11px] text-muted truncate">Últimas mudanças registradas neste perfil</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => void load(true)}
                    disabled={refreshing}
                    title="Atualizar histórico"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted hover:text-foreground hover:bg-surface-hover disabled:opacity-50 transition-colors"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="divide-y divide-border">
                {loading ? (
                    <div className="p-4 space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="h-16 rounded-lg bg-background animate-pulse" />
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-4">
                        <AdminEmptyState title="Nenhuma alteração registrada" size="sm" />
                    </div>
                ) : (
                    logs.map(log => {
                        const changes = getChanges(log.before, log.after)
                        const visibleChanges = changes.slice(0, 5)
                        const hiddenCount = Math.max(0, changes.length - visibleChanges.length)

                        return (
                            <article key={log.id} className="px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-foreground">{log.admin?.name ?? log.admin?.email ?? 'Sistema'}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-muted font-black uppercase">{log.action}</span>
                                            {changes.length > 0 && (
                                                <span className="text-[10px] text-muted">{changes.length} campo{changes.length === 1 ? '' : 's'}</span>
                                            )}
                                        </div>
                                        {log.details && (
                                            <p className="text-[11px] text-muted mt-1 line-clamp-2">{log.details}</p>
                                        )}
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[10px] text-muted whitespace-nowrap" title={formatDate(log.createdAt)}>
                                        <Clock3 className="w-3 h-3" />
                                        {formatDate(log.createdAt)}
                                    </span>
                                </div>

                                {visibleChanges.length > 0 && (
                                    <div className="mt-3 grid gap-2">
                                        {visibleChanges.map(change => (
                                            <div key={change.field} className="rounded-lg border border-border bg-background px-3 py-2">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">
                                                    {FIELD_LABELS[change.field] ?? change.field}
                                                </div>
                                                <div className="grid gap-1 sm:grid-cols-[1fr_auto_1fr] sm:items-center text-[11px]">
                                                    <span className="text-red-300 break-words">{formatValue(change.before)}</span>
                                                    <span className="hidden sm:inline text-muted">→</span>
                                                    <span className="text-emerald-300 break-words">{formatValue(change.after)}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {hiddenCount > 0 && (
                                            <p className="text-[11px] text-muted">+{hiddenCount} campo{hiddenCount === 1 ? '' : 's'} alterado{hiddenCount === 1 ? '' : 's'}</p>
                                        )}
                                    </div>
                                )}
                            </article>
                        )
                    })
                )}
            </div>
        </section>
    )
}
