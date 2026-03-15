'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { GroupMembersModal } from '@/components/admin/GroupMembersModal'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { Plus, Users, Music2, EyeOff, Instagram, Twitter, Youtube, ExternalLink, Globe, Pencil, Trash2, Languages } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MusicalGroup {
  id: string
  name: string
  nameHangul: string | null
  mbid: string | null
  profileImageUrl: string | null
  debutDate: Date | null
  disbandDate: Date | null
  agencyId: string | null
  agencyName: string | null
  socialLinks: Record<string, string> | null
  fanClubName: string | null
  officialColor: string | null
  videos: Array<{ title: string; url: string }> | null
  membersCount: number
  createdAt: Date
  isHidden: boolean
}

interface GroupStats {
  total: number
  active: number
  disbanded: number
  noMembers: number
  hidden: number
}

type StatusFilter = '' | 'active' | 'disbanded' | 'hidden'

const SOCIAL_PLATFORMS = ['website', 'instagram', 'youtube', 'twitter', 'tiktok', 'spotify', 'weverse', 'vlive'] as const
const MAX_MVS = 6

// ─── Social Badges ────────────────────────────────────────────────────────────

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram size={11} />,
  twitter:   <Twitter size={11} />,
  youtube:   <Youtube size={11} />,
  website:   <Globe size={11} />,
}
const SOCIAL_COLORS: Record<string, string> = {
  instagram: 'text-pink-400 bg-pink-500/10 hover:bg-pink-500/20',
  twitter:   'text-sky-400 bg-sky-500/10 hover:bg-sky-500/20',
  youtube:   'text-red-400 bg-red-500/10 hover:bg-red-500/20',
  website:   'text-zinc-400 bg-zinc-700 hover:bg-zinc-600',
}

function SocialBadges({ links }: { links: Record<string, string> | null }) {
  if (!links || Object.keys(links).length === 0) return null
  const entries = Object.entries(links).slice(0, 4)
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {entries.map(([platform, url]) => (
        <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
            SOCIAL_COLORS[platform] ?? 'text-zinc-400 bg-zinc-800 hover:bg-zinc-700'
          }`}>
          {SOCIAL_ICONS[platform] ?? <ExternalLink size={11} />}
        </a>
      ))}
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ group }: { group: MusicalGroup }) {
  if (group.isHidden) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-zinc-800 text-zinc-500">
      <EyeOff size={10} /> Oculto
    </span>
  )
  if (group.disbandDate) return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-900/40 text-red-400 border border-red-800/30">
      Disbandado
    </span>
  )
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-900/40 text-green-400 border border-green-800/30">
      Ativo
    </span>
  )
}

// ─── Form fields ──────────────────────────────────────────────────────────────

const formFields: FormField[] = [
  { key: 'name', label: 'Nome do Grupo', type: 'text', placeholder: 'Ex: BTS', required: true },
  { key: 'nameHangul', label: 'Nome em Hangul', type: 'text', placeholder: 'Ex: 방탄소년단' },
  { key: 'mbid', label: 'MusicBrainz ID', type: 'text', placeholder: 'UUID do MusicBrainz' },
  { key: 'bio', label: 'Biografia', type: 'textarea', placeholder: 'Descrição do grupo...' },
  { key: 'profileImageUrl', label: 'URL da Foto', type: 'text', placeholder: 'https://...' },
  { key: 'debutDate', label: 'Data de Debut', type: 'date' },
  { key: 'disbandDate', label: 'Data de Disbandamento', type: 'date' },
  { key: 'agencyId', label: 'Agência', type: 'select-async', optionsUrl: '/api/admin/agencies/all' },
  { key: 'sl_website', label: '🌐 Site Oficial', type: 'text', placeholder: 'https://bts.weverse.io' },
  { key: 'sl_instagram', label: '📸 Instagram', type: 'text', placeholder: 'https://instagram.com/bts.bighitofficial' },
  { key: 'sl_youtube', label: '▶️ YouTube', type: 'text', placeholder: 'https://youtube.com/@BANGTANTV' },
  { key: 'sl_twitter', label: '🐦 Twitter / X', type: 'text', placeholder: 'https://twitter.com/BTS_twt' },
  { key: 'sl_tiktok', label: '🎵 TikTok', type: 'text', placeholder: 'https://tiktok.com/@bts_official_bighit' },
  { key: 'sl_spotify', label: '🎧 Spotify', type: 'text', placeholder: 'https://open.spotify.com/artist/...' },
  { key: 'sl_weverse', label: '💬 Weverse', type: 'text', placeholder: 'https://weverse.io/bts' },
  { key: 'sl_vlive', label: '📺 VLive', type: 'text', placeholder: 'https://channels.vlive.tv/...' },
  { key: 'fanClubName', label: '💜 Nome do Fã-Clube', type: 'text', placeholder: 'Ex: ARMY, BLINK, ONCE' },
  { key: 'officialColor', label: '🎨 Cor Oficial (hex)', type: 'text', placeholder: 'Ex: #c6a852' },
  { key: 'mv1_title', label: '🎬 MV 1 — Título', type: 'text', placeholder: 'Ex: Dynamite' },
  { key: 'mv1_url', label: '🎬 MV 1 — URL YouTube', type: 'text', placeholder: 'https://youtube.com/watch?v=...' },
  { key: 'mv2_title', label: '🎬 MV 2 — Título', type: 'text', placeholder: 'Ex: Butter' },
  { key: 'mv2_url', label: '🎬 MV 2 — URL YouTube', type: 'text', placeholder: 'https://youtube.com/watch?v=...' },
  { key: 'mv3_title', label: '🎬 MV 3 — Título', type: 'text', placeholder: 'Ex: DNA' },
  { key: 'mv3_url', label: '🎬 MV 3 — URL YouTube', type: 'text', placeholder: 'https://youtube.com/watch?v=...' },
  { key: 'mv4_title', label: '🎬 MV 4 — Título', type: 'text', placeholder: 'Ex: Boy With Luv' },
  { key: 'mv4_url', label: '🎬 MV 4 — URL YouTube', type: 'text', placeholder: 'https://youtube.com/watch?v=...' },
  { key: 'mv5_title', label: '🎬 MV 5 — Título', type: 'text', placeholder: 'Ex: IDOL' },
  { key: 'mv5_url', label: '🎬 MV 5 — URL YouTube', type: 'text', placeholder: 'https://youtube.com/watch?v=...' },
  { key: 'mv6_title', label: '🎬 MV 6 — Título', type: 'text', placeholder: 'Ex: Fake Love' },
  { key: 'mv6_url', label: '🎬 MV 6 — URL YouTube', type: 'text', placeholder: 'https://youtube.com/watch?v=...' },
  { key: 'isHidden', label: 'Visibilidade', type: 'toggle' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupsPage() {
  const toast = useAdminToast()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [managingGroup, setManagingGroup] = useState<MusicalGroup | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [stats, setStats] = useState<GroupStats | null>(null)

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin/groups?stats=1')
    if (res.ok) setStats(await res.json())
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const extraParams = useMemo(
    () => (statusFilter ? { status: statusFilter } : undefined),
    [statusFilter],
  )

  const columns: Column<MusicalGroup>[] = useMemo(() => [
    {
      key: 'profileImageUrl',
      label: 'Foto',
      render: (group) => group.profileImageUrl ? (
        <Image src={group.profileImageUrl} alt={group.name} width={40} height={40}
          className="rounded-full object-cover w-10 h-10" />
      ) : (
        <div
          className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-black text-zinc-300"
          style={group.officialColor ? { backgroundColor: `${group.officialColor}30`, color: group.officialColor } : {}}>
          {group.name.charAt(0).toUpperCase()}
        </div>
      ),
    },
    {
      key: 'name', label: 'Nome', sortable: true,
      render: (group) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white">{group.name}</span>
            {group.officialColor && (
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white/10"
                style={{ backgroundColor: group.officialColor }} />
            )}
            {group.isHidden && <EyeOff size={11} className="text-zinc-600" />}
          </div>
          {group.nameHangul && <div className="text-xs text-zinc-500">{group.nameHangul}</div>}
        </div>
      ),
    },
    {
      key: 'disbandDate', label: 'Status',
      render: (group) => <StatusBadge group={group} />,
    },
    {
      key: 'membersCount', label: 'Membros', sortable: true,
      render: (group) => (
        <span className="text-purple-400 font-bold tabular-nums">{group.membersCount}</span>
      ),
    },
    {
      key: 'agencyName', label: 'Agência',
      className: 'hidden lg:table-cell',
      render: (group) => group.agencyName
        ? <span className="text-zinc-300 text-sm">{group.agencyName}</span>
        : <span className="text-zinc-600 text-xs">—</span>,
    },
    {
      key: 'socialLinks', label: 'Redes',
      className: 'hidden xl:table-cell',
      render: (group) => <SocialBadges links={group.socialLinks} />,
    },
    {
      key: 'debutDate', label: 'Debut', sortable: true,
      className: 'hidden md:table-cell',
      render: (group) => group.debutDate
        ? <span className="text-zinc-400 text-sm">{new Date(group.debutDate).getUTCFullYear()}</span>
        : <span className="text-zinc-600 text-xs">—</span>,
    },
    {
      key: 'createdAt', label: 'Cadastro', sortable: true,
      className: 'hidden xl:table-cell',
      render: (group) => (
        <span className="text-zinc-500 text-xs">
          {new Date(group.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ], [])

  const handleCreate = () => { setFormOpen(true) }
  const handleManageMembers = (group: MusicalGroup) => { setManagingGroup(group); setMembersOpen(true) }
  const handleDelete = (ids: string[]) => { setSelectedIds(ids); setDeleteOpen(true) }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    const socialLinks: Record<string, string> = {}
    for (const platform of SOCIAL_PLATFORMS) {
      const val = data[`sl_${platform}`] as string | undefined
      if (val && val.trim()) socialLinks[platform] = val.trim()
      delete data[`sl_${platform}`]
    }
    const videos: Array<{ title: string; url: string }> = []
    for (let i = 1; i <= MAX_MVS; i++) {
      const title = (data[`mv${i}_title`] as string | undefined)?.trim() ?? ''
      const url = (data[`mv${i}_url`] as string | undefined)?.trim() ?? ''
      delete data[`mv${i}_title`]
      delete data[`mv${i}_url`]
      if (url) videos.push({ title: title || `MV ${i}`, url })
    }
    const payload = {
      ...data,
      socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      videos: videos.length > 0 ? videos : null,
    }

    const res = await fetch('/api/admin/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) { const e = await res.json(); toast.error(e.error || 'Erro ao salvar'); return }
    toast.saved()
    refetchTable()
    fetchStats()
  }

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (!res.ok) { const e = await res.json(); toast.error(e.error || 'Erro ao deletar'); return }
      toast.deleted(`${selectedIds.length} grupo${selectedIds.length > 1 ? 's' : ''}`)
      setDeleteOpen(false)
      refetchTable()
      fetchStats()
    } finally {
      setDeleteLoading(false)
    }
  }

  const statusFilterEl = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {([
        ['',          'Todos',       stats?.total],
        ['active',    'Ativos',      stats?.active],
        ['disbanded', 'Disbandados', stats?.disbanded],
        ['hidden',    'Ocultos',     stats?.hidden],
      ] as [StatusFilter, string, number | undefined][]).map(([val, label, count]) => (
        <button key={val} onClick={() => setStatusFilter(val)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            statusFilter === val
              ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
          }`}>
          {label}
          {count != null && (
            <span className={`font-mono tabular-nums ${statusFilter === val ? 'text-purple-300' : 'text-zinc-500'}`}>
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  )

  return (
    <AdminLayout
      title="Grupos Musicais"
      subtitle="Gerencie os grupos musicais da plataforma"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/translations?tab=group"
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-400/50 bg-purple-500/5 hover:bg-purple-500/10 px-2 py-1 rounded-lg transition-colors">
            <Languages size={11} />
            Traduções
          </Link>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            <Plus size={16} />
            Novo Grupo
          </button>
        </div>
      }
    >
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Music2, label: 'Total',          value: stats?.total,     color: 'bg-zinc-700/50 text-zinc-300' },
            { icon: Users,  label: 'Ativos',          value: stats?.active,    color: 'bg-green-500/10 text-green-400' },
            { icon: Users,  label: 'Disbandados',     value: stats?.disbanded, color: 'bg-red-500/10 text-red-400' },
            { icon: Users,  label: 'Sem membros',     value: stats?.noMembers, color: 'bg-amber-500/10 text-amber-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={16} />
              </div>
              <div>
                <div className="text-xl font-bold text-white tabular-nums">{value ?? '—'}</div>
                <div className="text-xs text-zinc-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <DataTable<MusicalGroup>
          columns={columns}
          apiUrl="/api/admin/groups"
          extraParams={extraParams}
          filters={statusFilterEl}
          editHref={(group) => `/admin/groups/${group.id}`}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por nome ou hangul..."
          actions={(group) => (
            <div className="flex items-center gap-1">
              <button onClick={() => handleManageMembers(group)}
                title="Gerenciar Membros"
                className="p-1.5 text-zinc-400 hover:text-purple-400 hover:bg-purple-900/20 rounded-lg transition-colors">
                <Users size={15} />
              </button>
              <button onClick={() => handleDelete([group.id])}
                title="Excluir"
                className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          )}
          renderMobileCard={(group) => (
            <div className="p-3 flex items-start gap-3">
              {/* Photo / avatar */}
              {group.profileImageUrl ? (
                <Image src={group.profileImageUrl} alt={group.name} width={48} height={48}
                  className="rounded-full object-cover w-12 h-12 flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-black text-zinc-300 flex-shrink-0"
                  style={group.officialColor ? { backgroundColor: `${group.officialColor}30`, color: group.officialColor } : {}}>
                  {group.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-white truncate">{group.name}</span>
                      {group.officialColor && (
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white/10"
                          style={{ backgroundColor: group.officialColor }} />
                      )}
                    </div>
                    {group.nameHangul && <div className="text-xs text-zinc-500">{group.nameHangul}</div>}
                  </div>
                  <StatusBadge group={group} />
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500 flex-wrap">
                  <span className="text-purple-400 font-bold flex items-center gap-1">
                    <Users size={10} /> {group.membersCount}
                  </span>
                  {group.agencyName && <span className="truncate">{group.agencyName}</span>}
                  {group.debutDate && <span>{new Date(group.debutDate).getUTCFullYear()}</span>}
                  {group.fanClubName && (
                    <span className="text-pink-400/70">{group.fanClubName}</span>
                  )}
                </div>

                {group.socialLinks && Object.keys(group.socialLinks).length > 0 && (
                  <div className="mt-2">
                    <SocialBadges links={group.socialLinks} />
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleManageMembers(group) }}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                  >
                    <Users size={10} /> Membros
                  </button>
                  <a
                    href={`/admin/groups/${group.id}`}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Pencil size={10} /> Editar
                  </a>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete([group.id]) }}
                    className="text-xs text-zinc-600 hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={10} /> Excluir
                  </button>
                </div>
              </div>
            </div>
          )}
        />
      </div>

      <FormModal
        title="Novo Grupo Musical"
        fields={formFields}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={`Excluir ${selectedIds.length} grupo${selectedIds.length > 1 ? 's' : ''}?`}
        description="Esta ação não pode ser desfeita. Os dados serão removidos permanentemente."
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />

      {managingGroup && (
        <GroupMembersModal
          groupId={managingGroup.id}
          groupName={managingGroup.name}
          open={membersOpen}
          onClose={() => { setMembersOpen(false); setManagingGroup(null) }}
        />
      )}
    </AdminLayout>
  )
}
