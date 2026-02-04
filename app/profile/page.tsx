import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Shield, Calendar } from 'lucide-react'
import NavBar from '@/components/NavBar'

export default async function ProfilePage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/profile')
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black pt-24 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <User className="text-purple-500" size={40} />
              <h1 className="text-4xl md:text-5xl font-black text-white">Meu Perfil</h1>
            </div>
            <p className="text-xl text-zinc-400">Gerencie suas informações pessoais</p>
          </div>

          {/* Profile Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8 animate-slide-up">
            {/* Avatar Section */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8 pb-8 border-b border-zinc-800">
              <div className="relative">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-32 h-32 rounded-full border-4 border-purple-500"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-4 border-purple-500">
                    <span className="text-5xl font-bold text-white">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-zinc-900" />
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-white mb-2">{session.user.name}</h2>
                <p className="text-zinc-400 mb-4">{session.user.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    <Shield size={16} />
                    {session.user.role === 'admin' ? 'Administrador' : session.user.role === 'editor' ? 'Editor' : 'Usuário'}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white mb-4">Informações da Conta</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-zinc-500">
                    <User size={16} />
                    Nome Completo
                  </label>
                  <div className="bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white">
                    {session.user.name}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-zinc-500">
                    <Mail size={16} />
                    Email
                  </label>
                  <div className="bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white">
                    {session.user.email}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-zinc-500">
                    <Shield size={16} />
                    Função
                  </label>
                  <div className="bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white">
                    {session.user.role === 'admin' ? 'Administrador' : session.user.role === 'editor' ? 'Editor' : 'Usuário'}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-zinc-500">
                    <Calendar size={16} />
                    ID do Usuário
                  </label>
                  <div className="bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono text-sm">
                    {session.user.id}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-8 border-t border-zinc-800 flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all">
                Editar Perfil
              </button>
              <Link
                href="/settings"
                className="px-6 py-3 bg-zinc-800 text-white font-bold rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Configurações
              </Link>
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
              href="/v1"
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
