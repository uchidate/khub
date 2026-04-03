'use client'

import { useState, useCallback, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageGuide } from '@/components/admin/PageGuide'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { SocialBadges } from '@/components/admin/SocialBadges'
import { FilterPills } from '@/components/admin/FilterPills'
import { AdminButton, AdminLinkButton } from '@/components/admin/AdminButton'
import { Plus, RefreshCw, Type, ImagePlus, EyeOff, Languages, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { adminApi, ApiError } from '@/lib/admin-api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Artist {
  id: string
  nameRomanized: string
  nameHangul: string | null
  stageName: string | null
  country: string | null
  primaryImageUrl: string | null
  photoSyncAt: string | null
  gender: string | null
  createdAt: Date
  productionsCount: number
  albumsCount: number
  agencyName: string | null
  musicalGroupName: string | null
  musicalGroupId: string | null
  socialLinks: Record<string, string> | null
  socialLinksUpdatedAt: string | null
  tmdbId: string | null
  mbid: string | null
}

interface ArtistStats {
  total: number
  flagged: number
  withTmdb: number
  noTmdb: number
  noHangul: number
  noHangulPending: number
  noHangulAttempted: number
  noHangulNoTmdb: number
  noRomanized: number
  noRomanizedPending: number
  noRomanizedAttempted: number
  noRomanizedNoTmdb: number
  noPhoto: number
  noPhotoPending: number
  noPhotoAttempted: number
  noPhotoNoTmdb: number
  noSocialTotal: number
  noSocialPending: number
  noSocialAttempted: number
  noSocialNoTmdb: number
  noProductions: number
  autoHidden: number
  koreanNoTmdb: number
}

type FilterType =
  | ''
  | 'with_tmdb' | 'no_tmdb'
  | 'no_hangul' | 'no_hangul_pending' | 'no_hangul_attempted' | 'no_hangul_no_tmdb'
  | 'no_photo' | 'no_photo_pending' | 'no_photo_attempted' | 'no_photo_no_tmdb'
  | 'no_social' | 'no_social_pending' | 'no_social_attempted' | 'no_social_no_tmdb'
  | 'no_romanized' | 'no_romanized_pending' | 'no_romanized_attempted' | 'no_romanized_no_tmdb'
  | 'no_productions'
  | 'auto_hidden'
  | 'flagged'
  | 'korean_no_tmdb'

// ─── Action Buttons ───────────────────────────────────────────────────────────

const KOREAN_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u314F-\u3163]/

type BtnState = 'idle' | 'loading' | 'ok' | 'warn' | 'err'

function WikidataSyncButton({ artist, onSynced, onFailed }: {
  artist: Artist
  onSynced: (id: string, links: Record<string, string>) => void
  onFailed?: () => void
}) {
  const [state, setState] = useState<BtnState>('idle')
  const [tried, setTried] = useState(() => {
    const noLinks = !artist.socialLinks || Object.keys(artist.socialLinks).length === 0
    return !!(artist.socialLinksUpdatedAt && noLinks)
  })

  const handleSync = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    setState('loading')
    try {
      const res = await fetch('/api/admin/artists/wikidata-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId: artist.id }),
      })
      const data = await res.json()
      if (!res.ok) { setState('err'); return }
      if (data.updated) {
        onSynced(artist.id, data.links)
        setState('ok')
      } else {
        setState('warn')
        setTried(true)
        onFailed?.()
      }
    } catch { setState('err') }
    finally { setTimeout(() => setState('idle'), 3000) }
  }, [artist.id, onSynced, onFailed])

  const display = tried && state === 'idle' ? 'warn' : state

  const colorClass =
    display === 'ok'   ? 'text-green-400 border-green-500/30'
    : display === 'warn' ? 'text-muted border-border'
    : display === 'err'  ? 'text-red-400 border-red-500/30'
    : 'text-blue-400 border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/10'

  return (
    <button
      onClick={handleSync}
      disabled={state === 'loading'}
      title={display === 'warn' && tried ? 'Wikidata não encontrou redes sociais' : 'Sincronizar redes sociais via Wikidata'}
      className={`inline-flex items-center gap-1.5 px-2 py-1 border rounded text-xs font-medium transition-colors disabled:cursor-wait ${colorClass}`}
    >
      <RefreshCw size={12} className={state === 'loading' ? 'animate-spin' : ''} />
      {display === 'ok' ? '✓' : display === 'warn' ? '—' : display === 'err' ? '!' : 'Wiki'}
    </button>
  )
}

function PhotoSyncButton({ artist, onSynced, onFailed }: {
  artist: Artist
  onSynced: (id: string, url: string) => void
  onFailed?: () => void
}) {
  const canSync = !artist.primaryImageUrl && !!artist.tmdbId
  const [state, setState] = useState<BtnState>('idle')
  const [tried, setTried] = useState(() => !!(artist.photoSyncAt && !artist.primaryImageUrl))

  const handleSync = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canSync) return
    setState('loading')
    try {
      const res = await fetch('/api/admin/artists/fix-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId: artist.id, mode: 'sync-photo' }),
      })
      const data = await res.json()
      if (!res.ok) { setState('err'); return }
      if (data.ok) {
        onSynced(artist.id, data.primaryImageUrl)
        setState('ok')
      } else {
        setState('warn')
        setTried(true)
        onFailed?.()
      }
    } catch { setState('err') }
    finally { setTimeout(() => setState('idle'), 4000) }
  }, [artist.id, canSync, onSynced, onFailed])

  if (!canSync) return null

  const display = tried && state === 'idle' ? 'warn' : state

  const colorClass =
    display === 'ok'   ? 'text-green-400 border-green-500/30'
    : display === 'warn' ? 'text-muted border-border'
    : display === 'err'  ? 'text-red-400 border-red-500/30'
    : 'text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10'

  const label =
    display === 'ok' ? '✓'
    : display === 'warn' ? '—'
    : display === 'err' ? '!'
    : 'Foto'

  return (
    <button
      onClick={handleSync}
      disabled={state === 'loading'}
      title={display === 'warn' && tried ? 'Foto não encontrada no TMDB' : 'Sincronizar foto via TMDB'}
      className={`inline-flex items-center gap-1.5 px-2 py-1 border rounded text-xs font-medium transition-colors disabled:cursor-wait ${colorClass}`}
    >
      <ImagePlus size={11} className={state === 'loading' ? 'animate-pulse' : ''} />
      {label}
    </button>
  )
}

function FixNamesButton({ artist, onFixed, onFailed }: {
  artist: Artist
  onFixed: (id: string, nameRomanized: string, nameHangul: string | null) => void
  onFailed?: () => void
}) {
  const needsFixName = KOREAN_REGEX.test(artist.nameRomanized) && !!artist.tmdbId
  const needsFillHangul = !artist.nameHangul && !!artist.tmdbId
  const canFix = needsFixName || needsFillHangul

  const [state, setState] = useState<BtnState>('idle')
  const [tried, setTried] = useState(false)
  const [tooltip, setTooltip] = useState('')

  const handleFix = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canFix) return
    setState('loading')
    const mode = needsFixName ? 'fix-names' : 'fill-hangul'
    try {
      const res = await fetch('/api/admin/artists/fix-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId: artist.id, mode }),
      })
      const data = await res.json()
      if (!res.ok) { setState('err'); setTooltip('Erro HTTP'); return }
      if (data.ok) {
        onFixed(artist.id, data.nameRomanized ?? artist.nameRomanized, data.nameHangul ?? artist.nameHangul)
        setState('ok')
        setTooltip(mode === 'fix-names' ? `→ ${data.nameRomanized}` : `→ ${data.nameHangul}`)
      } else {
        setState('warn')
        setTried(true)
        setTooltip(data.reason ?? 'Sem dados no TMDB')
        onFailed?.()
      }
    } catch { setState('err'); setTooltip('Erro de rede') }
    finally { setTimeout(() => { setState('idle'); setTooltip('') }, 4000) }
  }, [artist.id, canFix, needsFixName, onFixed, onFailed, artist.nameRomanized, artist.nameHangul])

  if (!canFix) return null

  // `tried` persists after the timeout — reflects "already attempted, not found"
  const display = tried && state === 'idle' ? 'warn' : state

  const colorClass =
    display === 'ok'   ? 'text-green-400 border-green-500/30'
    : display === 'warn' ? 'text-muted border-border'
    : display === 'err'  ? 'text-red-400 border-red-500/30'
    : needsFixName
      ? 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10'
      : 'text-accent border-accent/30 hover:bg-accent/10'

  const label =
    display === 'ok' ? '✓'
    : display === 'warn' ? '—'
    : display === 'err' ? '!'
    : needsFixName ? 'Nome' : 'Hangul'

  return (
    <button
      onClick={handleFix}
      disabled={state === 'loading'}
      title={
        tooltip ||
        (display === 'warn' && tried
          ? 'Não encontrado no TMDB'
          : needsFixName
            ? 'nameRomanized tem Hangul — corrigir via TMDB'
            : 'Preencher nameHangul via TMDB also_known_as')
      }
      className={`inline-flex items-center gap-1.5 px-2 py-1 border rounded text-xs font-medium transition-colors disabled:cursor-wait ${colorClass}`}
    >
      <Type size={11} className={state === 'loading' ? 'animate-pulse' : ''} />
      {label}
    </button>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats, filter, onFilter }: {
  stats: ArtistStats | null
  filter: FilterType
  onFilter: (f: FilterType) => void
}) {
  const isTodos = filter === '' || filter === 'with_tmdb' || filter === 'no_tmdb'
  const isNoHangul = filter.startsWith('no_hangul')
  const isNoPhoto = filter.startsWith('no_photo')
  const isNoSocial = filter.startsWith('no_social')
  const isNoRomanized = filter.startsWith('no_romanized')
  const isNoProductions = filter === 'no_productions'
  const isAutoHidden = filter === 'auto_hidden'

  const mainTabs = [
    { label: 'Todos', value: '' as FilterType, count: stats?.total ?? null, dot: 'bg-foreground/40' },
    { label: 'Sem Hangul', value: 'no_hangul' as FilterType, count: stats?.noHangul ?? null, dot: 'bg-purple-400' },
    { label: 'Sem Romanizado', value: 'no_romanized' as FilterType, count: stats?.noRomanized ?? null, dot: 'bg-amber-400' },
    { label: 'Sem Foto', value: 'no_photo' as FilterType, count: stats?.noPhoto ?? null, dot: 'bg-orange-400' },
    { label: 'Sem Redes', value: 'no_social' as FilterType, count: stats?.noSocialTotal ?? null, dot: 'bg-blue-400' },
    { label: 'Sem Produção', value: 'no_productions' as FilterType, count: stats?.noProductions ?? null, dot: 'bg-yellow-500' },
    { label: 'Auto-ocultos', value: 'auto_hidden' as FilterType, count: stats?.autoHidden ?? null, dot: 'bg-muted' },
    { label: 'Flagged', value: 'flagged' as FilterType, count: stats?.flagged ?? null, dot: 'bg-red-400' },
  ]

  type SubTab = { label: string; value: FilterType; count: number | null; title: string; color: string; activeColor: string }

  const todosSubs: SubTab[] = [
    { label: 'Com TMDB', value: 'with_tmdb', count: stats?.withTmdb ?? null, title: 'Artistas com TMDB ID cadastrado', color: 'text-green-400 border-green-500/30 bg-green-500/10 hover:bg-green-500/20', activeColor: 'text-green-300 border-green-400/50 bg-green-500/20' },
    { label: 'Sem TMDB', value: 'no_tmdb', count: stats?.noTmdb ?? null, title: 'Artistas sem TMDB ID — requer curadoria', color: 'text-muted border-border bg-surface hover:bg-surface-hover', activeColor: 'text-muted border-border bg-surface-hover' },
  ]

  const hangulSubs: SubTab[] = [
    { label: 'Pendentes', value: 'no_hangul_pending', count: stats?.noHangulPending ?? null, title: 'Tem TMDB — nunca tentado, clique "Hangul" para preencher', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20', activeColor: 'text-orange-300 border-orange-400/50 bg-orange-500/20' },
    { label: 'Já tentados', value: 'no_hangul_attempted', count: stats?.noHangulAttempted ?? null, title: 'Já processado — TMDB não encontrou hangul', color: 'text-muted border-border bg-surface hover:bg-surface-hover', activeColor: 'text-foreground border-border bg-surface-hover' },
    { label: 'Sem TMDB', value: 'no_hangul_no_tmdb', count: stats?.noHangulNoTmdb ?? null, title: 'Sem TMDB ID — requer entrada manual', color: 'text-muted border-border bg-surface hover:bg-surface-hover', activeColor: 'text-muted border-border bg-surface-hover' },
  ]

  const photoSubs: SubTab[] = [
    { label: 'Pendentes', value: 'no_photo_pending', count: stats?.noPhotoPending ?? null, title: 'Tem TMDB — nunca tentado, clique "Foto" para sincronizar', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20', activeColor: 'text-orange-300 border-orange-400/50 bg-orange-500/20' },
    { label: 'Já tentados', value: 'no_photo_attempted', count: stats?.noPhotoAttempted ?? null, title: 'Já processado — TMDB não encontrou foto', color: 'text-muted border-border bg-surface hover:bg-surface-hover', activeColor: 'text-foreground border-border bg-surface-hover' },
    { label: 'Sem TMDB', value: 'no_photo_no_tmdb', count: stats?.noPhotoNoTmdb ?? null, title: 'Sem TMDB ID — requer entrada manual', color: 'text-muted border-border bg-surface hover:bg-surface-hover', activeColor: 'text-muted border-border bg-surface-hover' },
  ]

  const socialSubs: SubTab[] = [
    { label: 'Pendentes', value: 'no_social_pending', count: stats?.noSocialPending ?? null, title: 'Nunca tentado — clique "Wiki" para sincronizar', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20', activeColor: 'text-orange-300 border-orange-400/50 bg-orange-500/20' },
    { label: 'Já tentados', value: 'no_social_attempted', count: stats?.noSocialAttempted ?? null, title: 'Já processado, Wikidata não encontrou redes', color: 'text-muted border-border bg-surface hover:bg-surface-hover', activeColor: 'text-foreground border-border bg-surface-hover' },
    { label: 'Sem TMDB', value: 'no_social_no_tmdb', count: stats?.noSocialNoTmdb ?? null, title: 'Sem redes E sem TMDB ID — requer entrada manual', color: 'text-muted border-border bg-surface hover:bg-surface-hover', activeColor: 'text-muted border-border bg-surface-hover' },
  ]

  const romanizedSubs: SubTab[] = [
    { label: 'Pendentes', value: 'no_romanized_pending', count: stats?.noRomanizedPending ?? null, title: 'Tem TMDB — nunca tentado, clique "Nome" para corrigir', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20', activeColor: 'text-orange-300 border-orange-400/50 bg-orange-500/20' },
    { label: 'Já tentados', value: 'no_romanized_attempted', count: stats?.noRomanizedAttempted ?? null, title: 'Já processado — TMDB não encontrou nome romanizado', color: 'text-muted border-border bg-surface hover:bg-surface-hover', activeColor: 'text-foreground border-border bg-surface-hover' },
    { label: 'Sem TMDB', value: 'no_romanized_no_tmdb', count: stats?.noRomanizedNoTmdb ?? null, title: 'Sem TMDB ID — requer entrada manual', color: 'text-muted border-border bg-surface hover:bg-surface-hover', activeColor: 'text-muted border-border bg-surface-hover' },
  ]

  const subTabs = isTodos ? todosSubs : isNoHangul ? hangulSubs : isNoPhoto ? photoSubs : isNoSocial ? socialSubs : isNoRomanized ? romanizedSubs : []
  const parentFilter = isTodos ? '' : isNoHangul ? 'no_hangul' : isNoPhoto ? 'no_photo' : isNoSocial ? 'no_social' : isNoRomanized ? 'no_romanized' : isAutoHidden ? 'auto_hidden' : 'no_productions'

  const activeMainValue = isTodos ? '' : isNoHangul ? 'no_hangul' : isNoPhoto ? 'no_photo' : isNoSocial ? 'no_social' : isNoRomanized ? 'no_romanized' : isNoProductions ? 'no_productions' : isAutoHidden ? 'auto_hidden' : filter

  return (
    <div className="space-y-2">
      <FilterPills
        pills={mainTabs}
        active={activeMainValue as FilterType}
        onChange={onFilter}
      />

      {subTabs.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pl-1">
          <span className="text-[10px] font-black text-muted uppercase tracking-widest mr-1">↳</span>
          {subTabs.map((sub) => {
            const isActive = filter === sub.value
            return (
              <button key={sub.value}
                onClick={() => onFilter(isActive ? parentFilter as FilterType : sub.value)}
                title={sub.title}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                  isActive ? sub.activeColor : sub.color
                }`}
              >
                {sub.label}
                {sub.count != null && <span className="font-mono tabular-nums opacity-80">{sub.count}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Form fields ──────────────────────────────────────────────────────────────

const formFields: FormField[] = [
  { key: 'nameRomanized', label: 'Nome (Romanizado)', type: 'text', placeholder: 'Ex: Kim Soo-hyun', required: true },
  { key: 'nameHangul', label: 'Nome em Hangul', type: 'text', placeholder: 'Ex: 김수현' },
  { key: 'stageNames', label: 'Nomes Artísticos', type: 'text', placeholder: 'Ex: Suzy, Bae (separados por vírgula)' },
  { key: 'bio', label: 'Biografia', type: 'textarea', placeholder: 'Biografia do artista...' },
  { key: 'birthDate', label: 'Data de Nascimento', type: 'date' },
  {
    key: 'gender', label: 'Gênero', type: 'select',
    options: [
      { value: 'male', label: 'Masculino' },
      { value: 'female', label: 'Feminino' },
      { value: 'non_binary', label: 'Não-binário' },
      { value: 'other', label: 'Outro' },
    ],
  },
  {
    key: 'musicalGroupId', label: 'Grupo Musical', type: 'select-async',
    optionsUrl: '/api/admin/groups/all', placeholder: 'Selecionar grupo...',
  },
  { key: 'primaryImageUrl', label: 'URL da Imagem', type: 'text', placeholder: 'https://...' },
  { key: 'tmdbId', label: 'TMDB ID', type: 'text', placeholder: 'ID do The Movie Database' },
  { key: 'mbid', label: 'MusicBrainz ID', type: 'text', placeholder: 'UUID do artista no MusicBrainz' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArtistsAdminPage() {
  const router = useRouter()
  const toast = useAdminToast()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filter, setFilter] = useState<FilterType>('')
  const [stats, setStats] = useState<ArtistStats | null>(null)

  // Local overrides for cells updated in-place (avoid full table refetch)
  const [socialOverrides, setSocialOverrides] = useState<Record<string, Record<string, string>>>({})
  const [nameOverrides, setNameOverrides] = useState<Record<string, { nameRomanized: string; nameHangul: string | null }>>({})
  const [photoOverrides, setPhotoOverrides] = useState<Record<string, string>>({})

  const fetchStats = useCallback(() => {
    adminApi.artists.stats().then(s => setStats(s as unknown as ArtistStats)).catch(() => {})
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const handleSynced = useCallback((artistId: string, links: Record<string, string>) => {
    setSocialOverrides(prev => ({ ...prev, [artistId]: links }))
    fetchStats()
    refetchTable()
  }, [fetchStats])

  const handleWikiFailed = useCallback(() => {
    fetchStats()
    refetchTable()
  }, [fetchStats])

  const handleFixed = useCallback((artistId: string, nameRomanized: string, nameHangul: string | null) => {
    setNameOverrides(prev => ({ ...prev, [artistId]: { nameRomanized, nameHangul } }))
    fetchStats()
    refetchTable()
  }, [fetchStats])

  const handleFixFailed = useCallback(() => {
    fetchStats()
    refetchTable()
  }, [fetchStats])

  const handlePhotoSynced = useCallback((artistId: string, url: string) => {
    setPhotoOverrides(prev => ({ ...prev, [artistId]: url }))
    fetchStats()
    refetchTable()
  }, [fetchStats])

  const handlePhotoFailed = useCallback(() => {
    fetchStats()
    refetchTable()
  }, [fetchStats])

  const columns: Column<Artist>[] = [
    {
      key: 'imageUrl', label: 'Foto',
      render: (artist) => {
        const url = photoOverrides[artist.id] ?? artist.primaryImageUrl
        return url ? (
          <Link href={`/artists/${artist.id}`} target="_blank" onClick={e => e.stopPropagation()}>
            <Image src={url} alt={artist.nameRomanized} width={40} height={40}
              className="rounded-lg object-cover hover:ring-2 hover:ring-purple-500/50 transition-all" />
          </Link>
        ) : (
          <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center text-xs text-muted">N/A</div>
        )
      },
    },
    {
      key: 'nameRomanized', label: 'Nome', sortable: true,
      render: (artist) => {
        const override = nameOverrides[artist.id]
        const name = override?.nameRomanized ?? artist.nameRomanized
        const hasKorean = KOREAN_REGEX.test(name)
        return (
          <div className="flex items-center gap-2">
            <span className={hasKorean ? 'text-orange-400 font-semibold' : 'text-foreground font-medium'}>
              {name}
            </span>
            <Link href={`/artists/${artist.id}`} target="_blank" onClick={e => e.stopPropagation()}
              className="text-muted hover:text-foreground transition-colors flex-shrink-0">
              <ExternalLink size={11} />
            </Link>
          </div>
        )
      },
    },
    {
      key: 'nameHangul', label: 'Hangul',
      render: (artist) => {
        const override = nameOverrides[artist.id]
        const hangul = override?.nameHangul ?? artist.nameHangul
        return hangul
          ? <span className="text-muted text-xs">{hangul}</span>
          : <span className="text-muted text-xs font-bold">—</span>
      },
    },
    {
      key: 'agencyName', label: 'Agência',
      className: 'hidden xl:table-cell',
      render: (artist) => <span className="text-muted text-xs">{artist.agencyName || '—'}</span>,
    },
    {
      key: 'musicalGroupName', label: 'Grupo',
      className: 'hidden lg:table-cell',
      render: (artist) => artist.musicalGroupName ? (
        <span className="text-cyan-400 text-xs font-medium px-2 py-0.5 bg-cyan-400/10 rounded-full whitespace-nowrap">
          {artist.musicalGroupName}
        </span>
      ) : <span className="text-muted text-xs">—</span>,
    },
    {
      key: 'socialLinks', label: 'Redes',
      className: 'hidden xl:table-cell',
      render: (artist) => <SocialBadges links={socialOverrides[artist.id] ?? artist.socialLinks} />,
    },
    {
      key: 'productionsCount', label: 'Prod.', sortable: true,
      render: (artist) => <span className="text-purple-400 font-bold">{artist.productionsCount}</span>,
    },
    {
      key: 'albumsCount', label: 'Álbuns', sortable: true,
      className: 'hidden md:table-cell',
      render: (artist) => (
        <Link href={`/admin/artists/${artist.id}/discography`}
          className="text-pink-400 hover:text-pink-300 hover:underline font-bold">
          {artist.albumsCount}
        </Link>
      ),
    },
    {
      key: 'createdAt', label: 'Cadastro', sortable: true,
      className: 'hidden lg:table-cell',
      render: (artist) => <span className="text-muted text-xs">{new Date(artist.createdAt).toLocaleDateString('pt-BR')}</span>,
    },
  ]

  const handleCreate = () => setFormOpen(true)
  const handleDelete = (ids: string[]) => { setSelectedIds(ids); setDeleteOpen(true) }

  const handleBulkHide = async (ids: string[], clearSelection: () => void) => {
    try {
      await adminApi.artists.bulkHide(ids, true)
      toast.success(`${ids.length} artista${ids.length > 1 ? 's' : ''} ocultado${ids.length > 1 ? 's' : ''}`)
      clearSelection()
      refetchTable()
      fetchStats()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao ocultar artistas')
    }
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (typeof data.stageNames === 'string') {
      data.stageNames = data.stageNames
        ? data.stageNames.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []
    }
    if (data.primaryImageUrl === '') data.primaryImageUrl = null

    const created = await adminApi.artists.create(data)
    toast.saved()
    refetchTable()
    fetchStats()
    // Navigate to full edit page after creation
    const id = (created as Record<string, unknown>).id
    if (id) router.push(`/admin/artists/${id}`)
  }

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true)
    try {
      await adminApi.artists.delete(selectedIds)
      toast.deleted(`${selectedIds.length} artista${selectedIds.length > 1 ? 's' : ''}`)
      setDeleteOpen(false)
      refetchTable()
      fetchStats()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao deletar artistas')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <AdminLayout
      title="Artistas"
      subtitle="Gerencie artistas de K-Drama e K-Pop"
      actions={
        <div className="flex items-center gap-2">
          <AdminLinkButton href="/admin/translations?tab=artist" size="sm">
            <Languages size={11} />
            Traduções
          </AdminLinkButton>
          <AdminButton variant="primary" onClick={handleCreate}>
            <Plus size={18} />
            Novo Artista
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-4">
        <PageGuide
          storageKey="artists"
          title="Como funciona a gestão de Artistas"
          description="Cadastro completo de artistas coreanos (atores, cantores, dançarinos). Cada artista tem perfil público no site — qualidade do perfil impacta diretamente o SEO e a experiência do usuário."
          steps={[
            { label: 'Importado', description: 'Chegou via TMDB ou MusicBrainz import', color: 'zinc' },
            { label: 'Enriquecer', description: 'Gerar bio, editorial e curiosidades com IA', color: 'purple' },
            { label: 'Vincular', description: 'Associar a grupos, agência, produções', color: 'blue' },
            { label: 'Revisar', description: 'Conferir dados, foto e conteúdo gerado', color: 'yellow' },
            { label: 'Publicado', description: 'isHidden=false, aparece no site', color: 'green' },
          ]}
          tips={[
            { text: 'Artistas "flaggedAsNonKorean" não aparecem no site e ficam excluídos do Pipeline e Enriquecimento.' },
            { text: 'Use "Traduções" no cabeçalho para ver e revisar bio/curiosidades em PT-BR.' },
            { text: 'A foto principal vem do TMDB — use o sync de foto para atualizar manualmente.' },
            { text: 'Artistas sem bio aparecem no topo da fila de enriquecimento por terem score de completude baixo.' },
            { text: 'Para artistas duplicados, use /admin/artists/duplicates para fazer merge.' },
          ]}
        />

        <StatsBar stats={stats} filter={filter} onFilter={setFilter} />

        <DataTable<Artist>
          columns={columns}
          apiUrl="/api/admin/artists"
          extraParams={filter ? { filter } : undefined}
          editHref={(artist) => `/admin/artists/${artist.id}`}
          onDelete={handleDelete}
          bulkActions={(ids, clearSelection) => (
            <AdminButton onClick={() => handleBulkHide(ids, clearSelection)} size="sm">
              <EyeOff size={14} />
              Ocultar {ids.length}
            </AdminButton>
          )}
          searchPlaceholder="Buscar por nome..."
          actions={(artist) => (
            <div className="flex items-center gap-1">
              <PhotoSyncButton artist={artist} onSynced={handlePhotoSynced} onFailed={handlePhotoFailed} />
              <FixNamesButton artist={artist} onFixed={handleFixed} onFailed={handleFixFailed} />
              <WikidataSyncButton artist={artist} onSynced={handleSynced} onFailed={handleWikiFailed} />
            </div>
          )}
          renderMobileCard={(artist) => {
            const imageUrl = photoOverrides[artist.id] ?? artist.primaryImageUrl
            const override = nameOverrides[artist.id]
            const name = override?.nameRomanized ?? artist.nameRomanized
            const hangul = override?.nameHangul ?? artist.nameHangul
            const hasKorean = KOREAN_REGEX.test(name)
            return (
              <div className="p-3 flex items-start gap-3">
                {/* Photo */}
                {imageUrl ? (
                  <Image src={imageUrl} alt={name} width={48} height={48}
                    className="rounded-lg object-cover flex-shrink-0 w-12 h-12" />
                ) : (
                  <div className="w-12 h-12 bg-surface rounded-lg flex items-center justify-center text-xs text-muted flex-shrink-0 font-bold">
                    N/A
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className={`font-semibold truncate ${hasKorean ? 'text-orange-400' : 'text-foreground'}`}>
                        {name}
                      </div>
                      {hangul && <div className="text-xs text-muted truncate">{hangul}</div>}
                    </div>
                    <Link href={`/admin/artists/${artist.id}`}
                      className="flex-shrink-0 text-xs text-foreground px-2 py-0.5 border border-border rounded hover:bg-surface-hover transition-colors"
                      onClick={e => e.stopPropagation()}>
                      Editar
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {artist.musicalGroupName && (
                      <span className="text-cyan-400 text-xs font-medium px-1.5 py-0.5 bg-cyan-400/10 rounded-full whitespace-nowrap">
                        {artist.musicalGroupName}
                      </span>
                    )}
                    <span className="text-purple-400 text-xs font-bold">{artist.productionsCount} prod.</span>
                    <span className="text-pink-400 text-xs font-bold">{artist.albumsCount} álbuns</span>
                  </div>

                  {/* Social + action buttons */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <SocialBadges links={socialOverrides[artist.id] ?? artist.socialLinks} />
                    <PhotoSyncButton artist={artist} onSynced={handlePhotoSynced} onFailed={handlePhotoFailed} />
                    <FixNamesButton artist={artist} onFixed={handleFixed} onFailed={handleFixFailed} />
                    <WikidataSyncButton artist={artist} onSynced={handleSynced} onFailed={handleWikiFailed} />
                  </div>
                </div>
              </div>
            )
          }}
        />
      </div>

      <FormModal
        title="Novo Artista"
        fields={formFields}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={`Excluir ${selectedIds.length} artista${selectedIds.length > 1 ? 's' : ''}?`}
        description="Esta ação não pode ser desfeita. Os dados serão removidos permanentemente."
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </AdminLayout>
  )
}
