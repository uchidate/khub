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
  ChevronRight,
  History,
  TrendingUp
} from 'lucide-react'
import { PageTransition } from '@/components/features/PageTransition'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { getDashboardData } from '@/lib/actions/user'
import { MediaCard } from '@/components/ui/MediaCard'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/dashboard')

  const data = await getDashboardData()
  if (!data) return null

  const { favorites, activities, news, stats } = data

  const displayStats = [
    { label: 'Meus Favoritos', value: stats.favoritesCount.toString(), icon: Star, color: 'text-yellow-500' },
    { label: 'Atividade', value: stats.activityScore.toString(), icon: Zap, color: 'text-purple-500' },
    { label: 'Últimas 24h', value: activities.length.toString(), icon: Clock, color: 'text-blue-500' },
  ]

  const quickLinks = [
    { title: 'Perfil', description: 'Gerencie suas informações', href: '/profile', icon: User },
    { title: 'Configurações', description: 'Preferências e privacidade', href: '/settings', icon: Settings },
    ...(session.user.role === 'admin' ? [{ title: 'Admin', description: 'Painel de controle', href: '/admin', icon: Shield }] : []),
  ]

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 text-purple-500 mb-2 font-black tracking-widest uppercase text-[10px]">
                <LayoutDashboard size={14} />
                Portal do Usuário
              </div>
              <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
                Olá, <span className="hallyu-gradient-text">{session.user.name?.split(' ')[0]}</span>
              </h1>
              <p className="text-zinc-500 mt-4 max-w-lg font-medium text-lg leading-relaxed">
                Este é o seu centro de comando Hallyu. Seus favoritos e atividades estão sincronizados em todos os seus dispositivos.
              </p>
            </div>

            <Link
              href="/premium"
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] uppercase tracking-widest italic"
            >
              UPGRADE PARA PRO
            </Link>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {displayStats.map((stat, i) => (
            <div key={i} className="glass-card p-8 flex items-center gap-6 border-white/5 hover:border-white/10 transition-colors">
              <div className={`p-4 rounded-2xl bg-zinc-900/80 ${stat.color} shadow-inner`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mb-1">{stat.label}</p>
                <p className="text-4xl font-black text-white tracking-tighter">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-16">
            <section>
              <div className="flex justify-between items-end mb-8">
                <SectionHeader title="Meus Favoritos" subtitle="Acesso rápido ao que você salvou" className="mb-0" />
                <Link href="/favorites" className="text-purple-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors">
                  Ver Todos →
                </Link>
              </div>

              {favorites.length === 0 ? (
                <div className="glass-card p-12 text-center border-dashed border-2 border-zinc-800/50">
                  <p className="text-zinc-500 mb-6 font-medium">Você ainda não sincronizou favoritos com a nuvem.</p>
                  <Link href="/artists" className="inline-flex items-center gap-2 text-white bg-zinc-800 px-6 py-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors">
                    Explorar Galáxia
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {favorites.map((fav: any) => {
                    const entity = fav.artist || fav.production || fav.news
                    if (!entity) return null
                    return (
                      <MediaCard
                        key={fav.id}
                        id={entity.id}
                        title={'nameRomanized' in entity ? entity.nameRomanized : 'titlePt' in entity ? entity.titlePt : (entity as any).title}
                        imageUrl={'primaryImageUrl' in entity ? entity.primaryImageUrl : (entity as any).imageUrl}
                        type={fav.artist ? 'artist' : fav.production ? 'production' : 'news'}
                        href={fav.artist ? `/artists/${entity.id}` : fav.production ? `/productions/${entity.id}` : `/news/${entity.id}`}
                        aspectRatio="video"
                      />
                    )
                  })}
                </div>
              )}
            </section>

            <section>
              <SectionHeader title="Linha do Tempo" subtitle="Suas interações recentes" />
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-zinc-600 italic text-sm">Nenhuma atividade registrada ainda.</p>
                ) : (
                  activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 glass-card border-white/5">
                      <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500">
                        <History size={16} />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm text-zinc-300">
                          {activity.type === 'LIKE' ? 'Favoritou' : activity.type === 'VIEW' ? 'Visualizou' : activity.type === 'LOGIN' ? 'Entrou no' : 'Interagiu com'}
                          <span className="text-white font-bold ml-1">
                            {activity.entityType === 'ARTIST' ? 'um Artista' : activity.entityType === 'PRODUCTION' ? 'uma Produção' : 'Portal'}
                          </span>
                        </p>
                        <p className="text-[10px] text-zinc-600 uppercase font-bold mt-1">
                          {new Date(activity.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-12">
            <section>
              <h3 className="text-xs font-black text-zinc-500 mb-6 uppercase tracking-[0.3em] flex items-center gap-2 leading-none">
                <TrendingUp size={14} className="text-purple-500" />
                Gerenciamento
              </h3>
              <div className="space-y-3">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between p-5 glass-card hover:border-purple-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-zinc-900/50 rounded-xl text-zinc-500 group-hover:text-purple-500 transition-colors shadow-inner">
                        <link.icon size={20} />
                      </div>
                      <div>
                        <p className="text-white font-black text-sm uppercase tracking-tighter">{link.title}</p>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">{link.description}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-zinc-800 group-hover:text-white transition-colors" />
                  </Link>
                ))}
              </div>
            </section>

            {/* Premium Preview */}
            <section className="glass-card p-8 bg-gradient-to-br from-zinc-900 via-purple-900/20 to-zinc-900 border-purple-500/20 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-all rounded-full" />
              <h4 className="font-black text-white mb-2 uppercase italic tracking-tighter text-xl">Hallyu <span className="text-purple-500 italic">Pro</span></h4>
              <p className="text-xs text-zinc-400 mb-6 font-medium leading-relaxed">
                Desbloqueie estatísticas detalhadas de popularidade e badges exclusivas para o seu perfil.
              </p>
              <Link href="/premium" className="block w-full py-3 bg-white text-black text-[10px] font-black rounded-xl hover:bg-zinc-200 transition-colors text-center tracking-widest uppercase italic">
                SAIBA MAIS
              </Link>
            </section>
          </aside>
        </div>

        {/* Footer */}
        <div className="mt-32 border-t border-zinc-900 pt-12 flex flex-col items-center">
          <Link href="/" className="text-zinc-600 hover:text-white transition-colors flex items-center gap-3 text-xs uppercase font-black tracking-[0.4em] italic">
            <span className="hallyu-gradient-text">←</span> Voltar para a Galáxia
          </Link>
          <p className="text-[10px] text-zinc-800 font-bold mt-8 uppercase tracking-widest">HallyuHub Command Center v1.2</p>
        </div>
      </div>
    </PageTransition>
  )
}
