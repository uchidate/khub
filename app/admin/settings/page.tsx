import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings, ArrowLeft, Info } from 'lucide-react'
import NavBar from '@/components/NavBar'

export default async function AdminSettingsPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/admin/settings')
  }

  if (session.user.role?.toLowerCase() !== 'admin') {
    redirect('/dashboard')
  }

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
            <div className="flex items-center gap-3 mb-4">
              <Settings className="text-orange-500" size={40} />
              <h1 className="text-4xl md:text-5xl font-black text-white">
                Configurações
              </h1>
            </div>
            <p className="text-xl text-zinc-400">
              Configurações gerais do sistema
            </p>
          </div>

          {/* Coming Soon */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Settings className="text-orange-500" size={40} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Em Desenvolvimento
            </h2>
            <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
              As configurações do sistema estarão disponíveis em breve. Aqui você poderá ajustar preferências gerais,
              configurações de email, integrações e muito mais.
            </p>
            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 max-w-2xl mx-auto">
              <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-blue-400 text-left">
                Por enquanto, configurações específicas podem ser ajustadas diretamente nas variáveis de ambiente (.env)
                ou através das outras seções do painel admin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
