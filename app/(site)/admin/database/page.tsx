import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ServerIcon, Activity } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { StatCard } from '@/components/admin'
import { getAdminDatabaseCounts } from '@/lib/repositories/AdminRepository'

export const dynamic = 'force-dynamic'

export default async function AdminDatabasePage() {
  const session = await auth()

  if (!session) redirect('/auth/login?callbackUrl=/admin/database')
  if (session.user.role?.toLowerCase() !== 'admin') redirect('/dashboard')

  const counts = await getAdminDatabaseCounts()
  const total  = Object.values(counts).reduce((a, b) => a + b, 0)

  const stats = [
    { label: 'Usuários',   value: counts.users },
    { label: 'Artistas',   value: counts.artists },
    { label: 'Agências',   value: counts.agencies },
    { label: 'Produções',  value: counts.productions },
    { label: 'Grupos',     value: counts.groups },
    { label: 'Notícias',   value: counts.news },
    { label: 'Álbuns',     value: counts.albums },
    { label: 'Blog posts', value: counts.blogPosts },
  ]

  return (
    <AdminLayout
      title="Database"
      subtitle="Volume de registros por entidade"
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/infrastructure"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <ServerIcon className="w-3.5 h-3.5" />
            Infraestrutura
          </Link>
          <Link
            href="/admin/activity?tab=system"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            Atividade
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => <StatCard key={s.label} label={s.label} value={s.value} />)}
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Total de registros</p>
            <p className="text-3xl font-black text-foreground tabular-nums mt-1">{total.toLocaleString('pt-BR')}</p>
          </div>
          <p className="text-xs text-muted max-w-xs text-right">
            Para incidentes ou comportamento anormal, combine com Infraestrutura, Server Logs e Atividade do sistema.
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
