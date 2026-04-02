import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Database, Table, BarChart3, HardDrive, ServerIcon, Activity } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import prisma from '@/lib/prisma'

export default async function AdminDatabasePage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/admin/database')
  }

  if (session.user.role?.toLowerCase() !== 'admin') {
    redirect('/dashboard')
  }

  // Get database stats
  const [
    usersCount,
    artistsCount,
    agenciesCount,
    productionsCount,
    newsCount,
    albumsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.artist.count(),
    prisma.agency.count(),
    prisma.production.count(),
    prisma.news.count(),
    prisma.album.count(),
  ])

  const stats = [
    { label: 'Usuários', value: usersCount, icon: Table, color: 'purple' },
    { label: 'Artistas', value: artistsCount, icon: Table, color: 'pink' },
    { label: 'Agências', value: agenciesCount, icon: Table, color: 'blue' },
    { label: 'Produções', value: productionsCount, icon: Table, color: 'cyan' },
    { label: 'Notícias', value: newsCount, icon: Table, color: 'green' },
    { label: 'Álbuns', value: albumsCount, icon: Table, color: 'orange' },
  ]

  return (
    <AdminLayout
      title="Database"
      subtitle="Visão macro dos volumes do banco e ponto de partida para diagnóstico estrutural da plataforma."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/infrastructure"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <ServerIcon className="w-4 h-4" />
            Infraestrutura
          </Link>
          <Link
            href="/admin/activity?tab=system"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <Activity className="w-4 h-4" />
            Atividade do sistema
          </Link>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted mb-2">Escopo</p>
          <p className="text-sm text-muted leading-relaxed">
            Esta página resume o volume das entidades principais. Ela não substitui observabilidade, logs ou manutenção de infraestrutura, mas ajuda a identificar desequilíbrios e crescimento do catálogo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-surface border border-border rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="text-blue-400" size={24} />
                <BarChart3 className="text-muted" size={20} />
              </div>
              <p className="text-sm text-muted mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <HardDrive className="text-blue-500 flex-shrink-0" size={32} />
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Visão Geral do Banco
              </h2>
              <p className="text-muted mb-4">
                Total de registros observados nesta leitura: <span className="text-foreground font-bold">
                  {(usersCount + artistsCount + agenciesCount + productionsCount + newsCount + albumsCount).toLocaleString()}
                </span>
              </p>
              <p className="text-sm text-muted">
                Para incidentes ou comportamento anormal, combine esta leitura com Infrastructure, Server Logs e a aba Sistema em Atividade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
