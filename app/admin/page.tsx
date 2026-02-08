import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, Users, Database, Activity, FileText, Settings, Film } from 'lucide-react'
import NavBar from '@/components/NavBar'
import prisma from '@/lib/prisma'

export default async function AdminPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/admin')
  }

  if (session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  const adminSections = [
    {
      title: 'Gerenciar Usuários',
      description: 'Visualizar, editar e gerenciar contas de usuários',
      icon: Users,
      href: '/admin/users',
      color: 'purple',
    },
    {
      title: 'Conteúdo',
      description: 'Gerenciar artistas, agências, produções e notícias',
      icon: FileText,
      href: '/admin/content',
      color: 'pink',
    },
    {
      title: 'Filmografias',
      description: 'Atualizar filmografias de artistas via TMDB',
      icon: Film,
      href: '/admin/filmography',
      color: 'cyan',
    },
    {
      title: 'Banco de Dados',
      description: 'Visualizar estatísticas e gerenciar dados',
      icon: Database,
      href: '/admin/database',
      color: 'blue',
    },
    {
      title: 'Atividade',
      description: 'Monitorar logs e atividade do sistema',
      icon: Activity,
      href: '/admin/activity',
      color: 'green',
    },
    {
      title: 'Configurações',
      description: 'Configurações gerais do sistema',
      icon: Settings,
      href: '/admin/settings',
      color: 'orange',
    },
  ]

  // Fetch real stats directly from database
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    totalUsers,
    totalArtists,
    totalProductions,
    totalNews,
    newUsersCount,
    newArtistsCount,
    newProductionsCount,
    newNewsCount,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.artist.count(),
    prisma.production.count(),
    prisma.news.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.artist.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.production.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.news.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { email: true, createdAt: true },
    }),
  ])

  const calculateGrowth = (current: number, newCount: number) => {
    const previous = current - newCount
    if (previous === 0) return '+100'
    const percentage = ((newCount / previous) * 100).toFixed(0)
    return `+${percentage}`
  }

  const stats = [
    { label: 'Total de Usuários', value: totalUsers.toLocaleString(), change: `${calculateGrowth(totalUsers, newUsersCount)}%` },
    { label: 'Artistas Cadastrados', value: totalArtists.toLocaleString(), change: `${calculateGrowth(totalArtists, newArtistsCount)}%` },
    { label: 'Produções', value: totalProductions.toLocaleString(), change: `${calculateGrowth(totalProductions, newProductionsCount)}%` },
    { label: 'Notícias Publicadas', value: totalNews.toLocaleString(), change: `${calculateGrowth(totalNews, newNewsCount)}%` },
  ]

  const recentActivity = recentUsers.map((user) => {
    const date = new Date(user.createdAt)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    let timeAgo = ''
    if (diffInMinutes < 60) {
      timeAgo = `${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''} atrás`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      timeAgo = `${hours} hora${hours !== 1 ? 's' : ''} atrás`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      timeAgo = `${days} dia${days !== 1 ? 's' : ''} atrás`
    }

    return {
      action: 'Novo usuário registrado',
      user: user.email || 'Sem email',
      time: timeAgo,
    }
  })

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black pt-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-red-500" size={40} />
              <h1 className="text-4xl md:text-5xl font-black text-white">Painel Admin</h1>
            </div>
            <p className="text-xl text-zinc-400">
              Bem-vindo, <span className="text-white font-bold">{session.user.name}</span>
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="text-sm text-zinc-500 mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-sm text-green-500">{stat.change} este mês</p>
              </div>
            ))}
          </div>

          {/* Admin Sections */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Ferramentas Admin</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminSections.map((section, index) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20 animate-slide-up group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-12 h-12 bg-${section.color}-500/10 rounded-lg flex items-center justify-center mb-4`}>
                    <section.icon className={`text-${section.color}-500 group-hover:scale-110 transition-transform`} size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{section.title}</h3>
                  <p className="text-zinc-400 text-sm">{section.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8 animate-slide-up">
            <h2 className="text-2xl font-bold text-white mb-6">Atividade Recente</h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-t border-zinc-800 first:border-t-0"
                  >
                    <div>
                      <p className="text-white font-medium">{activity.action}</p>
                      <p className="text-sm text-zinc-500">{activity.user}</p>
                    </div>
                    <p className="text-sm text-zinc-500">{activity.time}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-zinc-500 py-4">Nenhuma atividade recente</p>
              )}
            </div>
          </div>

          {/* Back Links */}
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="text-purple-500 hover:text-purple-400 transition-colors"
            >
              ← Voltar ao Dashboard
            </Link>
            <Link
              href=""
              className="text-purple-500 hover:text-purple-400 transition-colors"
            >
              ← Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
