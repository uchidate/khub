import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  User,
  Settings,
  Shield,
  Star,
  Zap,
  Clock,
  ChevronRight
} from 'lucide-react'
import { PageTransition } from '@/components/features/PageTransition'
import { SectionHeader } from '@/components/ui/SectionHeader'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/dashboard')
  }

  const stats = [
    { label: 'Favoritos', value: '12', icon: Star, color: 'text-yellow-500' },
    { label: 'Assiduidade', value: '98%', icon: Zap, color: 'text-purple-500' },
    { label: 'Tempo de Uso', value: '2.5h', icon: Clock, color: 'text-blue-500' },
  ]

  const quickLinks = [
    {
      title: 'Perfil',
      description: 'Gerencie suas informações pessoais',
      href: '/profile',
      icon: User,
    },
    {
      title: 'Configurações',
      description: 'Preferências e notificações',
      href: '/settings',
      icon: Settings,
    },
    ...(session.user.role === 'admin'
      ? [
        {
          title: 'Admin',
          description: 'Painel de controle do sistema',
          href: '/admin',
          icon: Shield,
        },
      ]
      : []),
  ]

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-purple-500 mb-2 font-medium tracking-wider uppercase text-xs">
                <LayoutDashboard size={14} />
                Área do Usuário
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">
                Olá, <span className="hallyu-gradient-text">{session.user.name?.split(' ')[0]}</span>
              </h1>
              <p className="text-zinc-500 mt-2 max-w-md">
                Bem-vindo ao seu painel personalizado. Aqui você encontra seus favoritos e gerencia sua experiência.
              </p>
            </div>

            <Link
              href="/premium"
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              UPGRADE PARA PRO
            </Link>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-zinc-900/50 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <SectionHeader title="Favoritos Recentes" subtitle="O que você mais ama" />
              <div className="glass-card p-8 text-center border-dashed border-2 border-zinc-800">
                <p className="text-zinc-500 mb-4">Você ainda não tem favoritos salvos.</p>
                <Link href="/artists" className="text-purple-500 font-bold hover:underline">Explorar Artistas →</Link>
              </div>
            </section>

            <section>
              <SectionHeader title="Novidades para você" subtitle="Baseado nos seus gostos" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((_, i) => (
                  <div key={i} className="glass-card overflow-hidden group">
                    <div className="aspect-video bg-zinc-900 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                      <div className="absolute bottom-4 left-4 z-20">
                        <p className="text-xs text-purple-400 font-bold uppercase mb-1">Destaque</p>
                        <h4 className="text-white font-bold">Lançamentos da Semana</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar / Quick Links */}
          <aside className="space-y-8">
            <section>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                Gerenciamento
              </h3>
              <div className="space-y-3">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between p-4 glass-card hover:border-purple-500/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-purple-500 transition-colors">
                        <link.icon size={18} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{link.title}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">{link.description}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                  </Link>
                ))}
              </div>
            </section>

            {/* Newsletter Promo */}
            <section className="glass-card p-6 bg-gradient-to-br from-zinc-900 to-purple-900/20">
              <h4 className="font-bold text-white mb-2">Hallyu Insider</h4>
              <p className="text-xs text-zinc-400 mb-4">Receba conteúdos exclusivos e lançamentos em primeira mão no seu e-mail.</p>
              <button className="w-full py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors">
                ATIVE NOTIFICAÇÕES
              </button>
            </section>
          </aside>
        </div>

        {/* Navigation Footer */}
        <div className="mt-20 border-t border-zinc-800 pt-8 flex justify-center">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm uppercase font-bold tracking-widest">
            ← Voltar para a Galáxia
          </Link>
        </div>
      </div>
    </PageTransition>
  )
}

