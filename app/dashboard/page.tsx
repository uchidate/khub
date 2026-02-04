import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, User, Settings, Shield } from 'lucide-react'
import NavBar from '@/components/NavBar'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/dashboard')
  }

  const quickLinks = [
    {
      title: 'Perfil',
      description: 'Visualize e edite seu perfil',
      href: '/profile',
      icon: User,
    },
    {
      title: 'Configurações',
      description: 'Gerencie suas preferências',
      href: '/settings',
      icon: Settings,
    },
    ...(session.user.role === 'admin'
      ? [
          {
            title: 'Admin',
            description: 'Painel de administração',
            href: '/admin',
            icon: Shield,
          },
        ]
      : []),
  ]

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black pt-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <LayoutDashboard className="text-purple-500" size={40} />
              <h1 className="text-4xl md:text-5xl font-black text-white">Dashboard</h1>
            </div>
            <p className="text-xl text-zinc-400">
              Bem-vindo de volta, <span className="text-white font-bold">{session.user.name}</span>!
            </p>
          </div>

          {/* User Info Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8 animate-slide-up">
            <h2 className="text-2xl font-bold text-white mb-6">Informações da Conta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-zinc-500 mb-1">Nome</p>
                <p className="text-white font-medium">{session.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 mb-1">Email</p>
                <p className="text-white font-medium">{session.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 mb-1">Função</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  {session.user.role === 'admin' ? 'Administrador' : session.user.role === 'editor' ? 'Editor' : 'Usuário'}
                </span>
              </div>
              <div>
                <p className="text-sm text-zinc-500 mb-1">ID</p>
                <p className="text-white font-mono text-sm">{session.user.id}</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Acesso Rápido</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20 animate-slide-up group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <link.icon className="text-purple-500 mb-4 group-hover:scale-110 transition-transform" size={32} />
                  <h3 className="text-xl font-bold text-white mb-2">{link.title}</h3>
                  <p className="text-zinc-400 text-sm">{link.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Back to Home */}
          <Link
            href="/v1"
            className="inline-flex items-center gap-2 text-purple-500 hover:text-purple-400 transition-colors"
          >
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </>
  )
}
