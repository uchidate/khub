import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users2, Building2, Film, Newspaper, Music, ArrowLeft } from 'lucide-react'
import NavBar from '@/components/NavBar'

export default async function AdminContentPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/admin/content')
  }

  if (session.user.role?.toLowerCase() !== 'admin') {
    redirect('/dashboard')
  }

  const contentSections = [
    {
      title: 'Artistas',
      description: 'Gerenciar artistas e suas informações',
      icon: Users2,
      href: '/admin/artists',
      color: 'purple',
      count: 'Todos os artistas cadastrados',
    },
    {
      title: 'Agências',
      description: 'Gerenciar agências e empresas',
      icon: Building2,
      href: '/admin/agencies',
      color: 'blue',
      count: 'Todas as agências',
    },
    {
      title: 'Produções',
      description: 'Gerenciar dramas, filmes e programas',
      icon: Film,
      href: '/admin/productions',
      color: 'pink',
      count: 'Dramas, filmes e shows',
    },
    {
      title: 'Notícias',
      description: 'Gerenciar notícias e atualizações',
      icon: Newspaper,
      href: '/admin/news',
      color: 'green',
      count: 'Notícias publicadas',
    },
    {
      title: 'Álbuns',
      description: 'Gerenciar álbuns musicais',
      icon: Music,
      href: '/admin/albums',
      color: 'cyan',
      count: 'Discografia dos artistas',
    },
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
              className="inline-flex items-center gap-2 text-purple-500 hover:text-purple-400 transition-colors mb-6"
            >
              <ArrowLeft size={20} />
              Voltar ao Painel Admin
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Gerenciar Conteúdo
            </h1>
            <p className="text-xl text-zinc-400">
              Selecione o tipo de conteúdo que deseja gerenciar
            </p>
          </div>

          {/* Content Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentSections.map((section, index) => (
              <Link
                key={section.href}
                href={section.href}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20 animate-slide-up group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-16 h-16 bg-${section.color}-500/10 rounded-xl flex items-center justify-center mb-6`}>
                  <section.icon className={`text-${section.color}-500 group-hover:scale-110 transition-transform`} size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">{section.title}</h2>
                <p className="text-zinc-400 mb-4">{section.description}</p>
                <p className="text-sm text-zinc-500">{section.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
