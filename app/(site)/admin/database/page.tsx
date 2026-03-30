import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Database, ArrowLeft, Table, BarChart3, HardDrive } from 'lucide-react'
import NavBar from '@/components/NavBar'
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
    <>
      <NavBar />
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black pt-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors mb-6"
            >
              <ArrowLeft size={20} />
              Voltar ao Painel Admin
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <Database className="text-blue-500" size={40} />
              <h1 className="text-4xl md:text-5xl font-black text-foreground">
                Banco de Dados
              </h1>
            </div>
            <p className="text-xl text-muted">
              Estatísticas e visão geral do banco de dados
            </p>
          </div>

          {/* Database Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-surface border border-border rounded-2xl p-6 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`text-${stat.color}-500`} size={24} />
                  <BarChart3 className="text-muted" size={20} />
                </div>
                <p className="text-sm text-muted mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Info Card */}
          <div className="bg-surface border border-border rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <HardDrive className="text-blue-500 flex-shrink-0" size={32} />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Visão Geral do Banco
                </h2>
                <p className="text-muted mb-4">
                  Total de registros no banco de dados: <span className="text-foreground font-bold">
                    {(usersCount + artistsCount + agenciesCount + productionsCount + newsCount + albumsCount).toLocaleString()}
                  </span>
                </p>
                <p className="text-sm text-muted">
                  Funcionalidades avançadas de gerenciamento de banco de dados estarão disponíveis em breve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
