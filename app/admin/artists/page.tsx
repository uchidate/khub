'use client'

import { useState, useCallback, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus, RefreshCw, Instagram, Twitter, Youtube, Music2, ExternalLink, Type, ImagePlus, EyeOff, Languages } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

// ─── Social Badges ────────────────────────────────────────────────────────────

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram size={12} />,
  twitter: <Twitter size={12} />,
  youtube: <Youtube size={12} />,
  tiktok: <Music2 size={12} />,
}

const SOCIAL_COLORS: Record<string, string> = {
  instagram: 'text-pink-400 bg-pink-500/10 hover:bg-pink-500/20',
  twitter: 'text-sky-400 bg-sky-500/10 hover:bg-sky-500/20',
  youtube: 'text-red-400 bg-red-500/10 hover:bg-red-500/20',
  tiktok: 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20',
}

function SocialBadges({ links }: { links: Record<string, string> | null }) {
  if (!links || Object.keys(links).length === 0) {
    return <span className="text-zinc-600 text-xs">—</span>
  }
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Object.entries(links).map(([platform, url]) => (
        <a
          key={platform}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={platform}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
            SOCIAL_COLORS[platform] ?? 'text-zinc-400 bg-zinc-800 hover:bg-zinc-700'
          }`}
        >
          {SOCIAL_ICONS[platform] ?? <ExternalLink size={12} />}
          <span className="capitalize">{platform}</span>
        </a>
      ))}
    </div>
  )
}

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
  }, [artist.id, artist.socialLinks, onSynced, onFailed])

  const display = tried && state === 'idle' ? 'warn' : state

  const colorClass =
    display === 'ok'   ? 'text-green-400 border-green-500/30'
    : display === 'warn' ? 'text-zinc-500 border-zinc-700'
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
  }, [artist.id, artist.primaryImageUrl, canSync, onSynced, onFailed])

  if (!canSync) return null

  const display = tried && state === 'idle' ? 'warn' : state

  const colorClass =
    display === 'ok'   ? 'text-green-400 border-green-500/30'
    : display === 'warn' ? 'text-zinc-500 border-zinc-700'
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
    : display === 'warn' ? 'text-zinc-500 border-zinc-700'
    : display === 'err'  ? 'text-red-400 border-red-500/30'
    : needsFixName
      ? 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10'
      : 'text-purple-400 border-purple-500/30 hover:bg-purple-500/10'

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
    { label: 'Todos', value: '' as FilterType, count: stats?.total ?? null, dot: 'bg-zinc-400' },
    { label: 'Sem Hangul', value: 'no_hangul' as FilterType, count: stats?.noHangul ?? null, dot: 'bg-purple-400' },
    { label: 'Sem Romanizado', value: 'no_romanized' as FilterType, count: stats?.noRomanized ?? null, dot: 'bg-amber-400' },
    { label: 'Sem Foto', value: 'no_photo' as FilterType, count: stats?.noPhoto ?? null, dot: 'bg-orange-400' },
    { label: 'Sem Redes', value: 'no_social' as FilterType, count: stats?.noSocialTotal ?? null, dot: 'bg-blue-400' },
    { label: 'Sem Produção', value: 'no_productions' as FilterType, count: stats?.noProductions ?? null, dot: 'bg-yellow-500' },
    { label: 'Auto-ocultos', value: 'auto_hidden' as FilterType, count: stats?.autoHidden ?? null, dot: 'bg-zinc-500' },
    { label: 'Flagged', value: 'flagged' as FilterType, count: stats?.flagged ?? null, dot: 'bg-red-400' },
  ]

  type SubTab = { label: string; value: FilterType; count: number | null; title: string; color: string; activeColor: string }

  const todosSubs: SubTab[] = [
    { label: 'Com TMDB', value: 'with_tmdb', count: stats?.withTmdb ?? null, title: 'Artistas com TMDB ID cadastrado', color: 'text-green-400 border-green-500/30 bg-green-500/10 hover:bg-green-500/20', activeColor: 'text-green-300 border-green-400/50 bg-green-500/20' },
    { label: 'Sem TMDB', value: 'no_tmdb', count: stats?.noTmdb ?? null, title: 'Artistas sem TMDB ID — requer curadoria', color: 'text-zinc-600 border-zinc-800 bg-zinc-900 hover:bg-zinc-800', activeColor: 'text-zinc-500 border-zinc-700 bg-zinc-800' },
  ]

  const hangulSubs: SubTab[] = [
    { label: 'Pendentes', value: 'no_hangul_pending', count: stats?.noHangulPending ?? null, title: 'Tem TMDB — nunca tentado, clique "Hangul" para preencher', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20', activeColor: 'text-orange-300 border-orange-400/50 bg-orange-500/20' },
    { label: 'Já tentados', value: 'no_hangul_attempted', count: stats?.noHangulAttempted ?? null, title: 'Já processado — TMDB não encontrou hangul', color: 'text-zinc-400 border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700/60', activeColor: 'text-zinc-300 border-zinc-500 bg-zinc-700/60' },
    { label: 'Sem TMDB', value: 'no_hangul_no_tmdb', count: stats?.noHangulNoTmdb ?? null, title: 'Sem TMDB ID — requer entrada manual', color: 'text-zinc-600 border-zinc-800 bg-zinc-900 hover:bg-zinc-800', activeColor: 'text-zinc-500 border-zinc-700 bg-zinc-800' },
  ]

  const photoSubs: SubTab[] = [
    { label: 'Pendentes', value: 'no_photo_pending', count: stats?.noPhotoPending ?? null, title: 'Tem TMDB — nunca tentado, clique "Foto" para sincronizar', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20', activeColor: 'text-orange-300 border-orange-400/50 bg-orange-500/20' },
    { label: 'Já tentados', value: 'no_photo_attempted', count: stats?.noPhotoAttempted ?? null, title: 'Já processado — TMDB não encontrou foto', color: 'text-zinc-400 border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700/60', activeColor: 'text-zinc-300 border-zinc-500 bg-zinc-700/60' },
    { label: 'Sem TMDB', value: 'no_photo_no_tmdb', count: stats?.noPhotoNoTmdb ?? null, title: 'Sem TMDB ID — requer entrada manual', color: 'text-zinc-600 border-zinc-800 bg-zinc-900 hover:bg-zinc-800', activeColor: 'text-zinc-500 border-zinc-700 bg-zinc-800' },
  ]

  const socialSubs: SubTab[] = [
    { label: 'Pendentes', value: 'no_social_pending', count: stats?.noSocialPending ?? null, title: 'Nunca tentado — clique "Wiki" para sincronizar', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20', activeColor: 'text-orange-300 border-orange-400/50 bg-orange-500/20' },
    { label: 'Já tentados', value: 'no_social_attempted', count: stats?.noSocialAttempted ?? null, title: 'Já processado, Wikidata não encontrou redes', color: 'text-zinc-400 border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700/60', activeColor: 'text-zinc-300 border-zinc-500 bg-zinc-700/60' },
    { label: 'Sem TMDB', value: 'no_social_no_tmdb', count: stats?.noSocialNoTmdb ?? null, title: 'Sem redes E sem TMDB ID — requer entrada manual', color: 'text-zinc-600 border-zinc-800 bg-zinc-900 hover:bg-zinc-800', activeColor: 'text-zinc-500 border-zinc-700 bg-zinc-800' },
  ]

  const romanizedSubs: SubTab[] = [
    { label: 'Pendentes', value: 'no_romanized_pending', count: stats?.noRomanizedPending ?? null, title: 'Tem TMDB — nunca tentado, clique "Nome" para corrigir', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20', activeColor: 'text-orange-300 border-orange-400/50 bg-orange-500/20' },
    { label: 'Já tentados', value: 'no_romanized_attempted', count: stats?.noRomanizedAttempted ?? null, title: 'Já processado — TMDB não encontrou nome romanizado', color: 'text-zinc-400 border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700/60', activeColor: 'text-zinc-300 border-zinc-500 bg-zinc-700/60' },
    { label: 'Sem TMDB', value: 'no_romanized_no_tmdb', count: stats?.noRomanizedNoTmdb ?? null, title: 'Sem TMDB ID — requer entrada manual', color: 'text-zinc-600 border-zinc-800 bg-zinc-900 hover:bg-zinc-800', activeColor: 'text-zinc-500 border-zinc-700 bg-zinc-800' },
  ]

  const subTabs = isTodos ? todosSubs : isNoHangul ? hangulSubs : isNoPhoto ? photoSubs : isNoSocial ? socialSubs : isNoRomanized ? romanizedSubs : []
  const parentFilter = isTodos ? '' : isNoHangul ? 'no_hangul' : isNoPhoto ? 'no_photo' : isNoSocial ? 'no_social' : isNoRomanized ? 'no_romanized' : isAutoHidden ? 'auto_hidden' : 'no_productions'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {mainTabs.map((tab) => {
          const isActive = tab.value === ''
            ? isTodos
            : tab.value === 'no_hangul' ? isNoHangul
            : tab.value === 'no_photo' ? isNoPhoto
            : tab.value === 'no_social' ? isNoSocial
            : tab.value === 'no_romanized' ? isNoRomanized
            : tab.value === 'no_productions' ? isNoProductions
            : tab.value === 'auto_hidden' ? isAutoHidden
            : filter === tab.value
          return (
            <button key={tab.value} onClick={() => onFilter(tab.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isActive
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
              {tab.label}
              {tab.count != null && (
                <span className={`font-mono tabular-nums ${isActive ? 'text-purple-300' : 'text-zinc-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {subTabs.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pl-1">
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mr-1">↳</span>
          {subTabs.map((sub) => {
            const isActive = filter === sub.value
            return (
              <button key={sub.value}
                onClick={() => onFilter(isActive ? parentFilter as FilterType : sub.value)}
                title={sub.title}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition-all border ${
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
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filter, setFilter] = useState<FilterType>('')
  const [stats, setStats] = useState<ArtistStats | null>(null)

  // Local overrides for cells updated in-place (avoid full table refetch)
  const [socialOverrides, setSocialOverrides] = useState<Record<string, Record<string, string>>>({})
  const [nameOverrides, setNameOverrides] = useState<Record<string, { nameRomanized: string; nameHangul: string | null }>>({})
  const [photoOverrides, setPhotoOverrides] = useState<Record<string, string>>({})

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin/artists/stats')
    if (res.ok) setStats(await res.json())
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
          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-xs text-zinc-500">N/A</div>
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
            <span className={hasKorean ? 'text-orange-400 font-semibold' : 'text-white font-medium'}>
              {name}
            </span>
            <Link href={`/artists/${artist.id}`} target="_blank" onClick={e => e.stopPropagation()}
              className="text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0">
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
          ? <span className="text-zinc-400 text-xs">{hangul}</span>
          : <span className="text-zinc-700 text-xs font-bold">—</span>
      },
    },
    {
      key: 'agencyName', label: 'Agência',
      className: 'hidden xl:table-cell',
      render: (artist) => <span className="text-zinc-400 text-xs">{artist.agencyName || '—'}</span>,
    },
    {
      key: 'musicalGroupName', label: 'Grupo',
      className: 'hidden lg:table-cell',
      render: (artist) => artist.musicalGroupName ? (
        <span className="text-cyan-400 text-xs font-medium px-2 py-0.5 bg-cyan-400/10 rounded-full whitespace-nowrap">
          {artist.musicalGroupName}
        </span>
      ) : <span className="text-zinc-600 text-xs">—</span>,
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
      render: (artist) => <span className="text-zinc-500 text-xs">{new Date(artist.createdAt).toLocaleDateString('pt-BR')}</span>,
    },
  ]

  const handleCreate = () => setFormOpen(true)
  const handleDelete = (ids: string[]) => { setSelectedIds(ids); setDeleteOpen(true) }

  const handleBulkHide = async (ids: string[], clearSelection: () => void) => {
    const res = await fetch('/api/admin/artists?bulk=hide', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (!res.ok) return
    clearSelection()
    refetchTable()
    fetchStats()
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (typeof data.stageNames === 'string') {
      data.stageNames = data.stageNames
        ? data.stageNames.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []
    }
    if (data.primaryImageUrl === '') data.primaryImageUrl = null

    const res = await fetch('/api/admin/artists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Erro ao criar artista')
    }

    const created = await res.json()
    refetchTable()
    fetchStats()
    // Navigate to full edit page after creation
    if (created.id) router.push(`/admin/artists/${created.id}`)
  }

  const handleDeleteConfirm = async () => {
    const res = await fetch('/api/admin/artists', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Erro ao deletar artistas')
    }

    refetchTable()
    fetchStats()
  }

  return (
    <AdminLayout title="Artistas">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex items-center gap-3 -mt-6">
              <p className="text-zinc-400 text-sm">Gerencie artistas de K-Drama e K-Pop</p>
              <Link href="/admin/translations?tab=artist"
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-400/50 bg-purple-500/5 hover:bg-purple-500/10 px-2 py-0.5 rounded-full transition-colors flex-shrink-0">
                <Languages size={11} />
                Traduções
              </Link>
            </div>
            <StatsBar stats={stats} filter={filter} onFilter={setFilter} />
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all flex-shrink-0"
          >
            <Plus size={18} />
            Novo Artista
          </button>
        </div>

        <DataTable<Artist>
          columns={columns}
          apiUrl="/api/admin/artists"
          extraParams={filter ? { filter } : undefined}
          editHref={(artist) => `/admin/artists/${artist.id}`}
          onDelete={handleDelete}
          bulkActions={(ids, clearSelection) => (
            <button
              onClick={() => handleBulkHide(ids, clearSelection)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-700/50 border border-zinc-600/40 text-zinc-300 rounded-lg text-sm hover:bg-zinc-600/50 transition-colors font-medium"
            >
              <EyeOff size={14} />
              Ocultar {ids.length}
            </button>
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
                  <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-xs text-zinc-500 flex-shrink-0 font-bold">
                    N/A
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className={`font-semibold truncate ${hasKorean ? 'text-orange-400' : 'text-white'}`}>
                        {name}
                      </div>
                      {hangul && <div className="text-xs text-zinc-500 truncate">{hangul}</div>}
                    </div>
                    <Link href={`/admin/artists/${artist.id}`}
                      className="flex-shrink-0 text-xs text-zinc-500 hover:text-purple-400 px-2 py-0.5 border border-zinc-700 rounded hover:border-purple-500/50 transition-colors"
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

      <DeleteConfirm
        open={deleteOpen}
        count={selectedIds.length}
        entityName="artista"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  )
}
